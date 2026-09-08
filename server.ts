import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'AXON Multi-AI Engine' });
});

// Helper to construct system instruction with per-project isolation
function getSystemPrompt(accountLabel?: string, providerName?: string, projectContext?: any) {
  let prompt = `You are AXON, an AI-powered workspace for a smartphone.
Active session: "${accountLabel || 'Default'}" (${providerName || 'AI Engine'}).

CRITICAL PERSONA DIRECTIVE:
You must ALWAYS speak in the first person using "I" (e.g., "I can help you with that...", "I have updated...", "I am currently set to..."). NEVER refer to yourself in the third person as "AXON" or "the system" in conversational dialogue (e.g. do not say "AXON will do this", say "I will do this").

CONVERSATIONAL CALIBRATION RULES:
1. Match the depth of what is actually being asked:
   - Short, direct answers for simple questions.
   - Detailed answers only when the question is genuinely complex or explicitly asks for depth.
2. Avoid unnecessary padding, restating the question, or over-explaining things nobody asked about.
3. If a request is ambiguous, ask at most ONE clarifying question rather than guessing wildly.
4. Keep a natural, plain-language conversational tone.

ACCURATE SELF-KNOWLEDGE (Established in Parts 1-6):
- Dual-pane workspace (Chat left, Workspace/code right) with 3 view states (chat-only, 50/50 split, workspace-only).
- Tools Menu suites: Text, Calculation, Color, Image utilities, and File conversions.
- Multi-AI Official API connections: Gemini, Claude, and ChatGPT with user-managed keys, manual account switching, and 24-hour limit cooldown tracking.
- Automation & Run Code Layer: Conditional trigger-and-action rules engine and sandboxed live Run Code hooks.
- Notes & Memory System: Scoped per-project memory/context isolation, full-text search across all notes, tags/categories, pin/unpin, and rich conversation data extraction to notes or downloadable files (.md, .txt, .json).
- Features not yet built: full video sequencer, voice synthesis. Do not claim to possess them yet.`;

  if (projectContext && projectContext.name) {
    prompt += `\n\nPER-PROJECT MEMORY & ISOLATION DIRECTIVE:
You are currently operating inside the isolated context of Project: "${projectContext.name}".
${projectContext.description ? `Project Scope/Goal: ${projectContext.description}` : ''}
${projectContext.systemContext ? `Custom Directives: ${projectContext.systemContext}` : ''}
${projectContext.relevantNotes ? `Project Notes & Knowledge Memory:\n${projectContext.relevantNotes}` : ''}
[CRITICAL ISOLATION RULE]: Strictly focus your memory and references on "${projectContext.name}". Do NOT draw in or confuse information with unrelated projects unless explicitly prompted.`;
  }

  return prompt;
}

// Multi-AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { provider, model, messages, apiKey, accountLabel, conversationSummary, projectContext } = req.body;

    const systemInstruction = getSystemPrompt(accountLabel, provider, projectContext);

    // If a conversation summary is passed from an account handoff, prepend it as prior context
    let formattedContext = '';
    if (conversationSummary) {
      formattedContext = `[Context summary from previous session handoff: ${conversationSummary}]\n\n`;
    }

    // 1. GOOGLE GEMINI (Official @google/genai SDK)
    if (provider === 'gemini') {
      const activeKey = apiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_KEY',
          message: 'No Gemini API key provided. Add one in AXON Settings > AI Accounts.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Format message history
      const lastUserMsg = messages[messages.length - 1]?.text || 'Hello';
      const promptContent = formattedContext ? `${formattedContext}${lastUserMsg}` : lastUserMsg;

      try {
        const geminiModel = model || 'gemini-3.8-flash';
        const response = await ai.models.generateContent({
          model: geminiModel,
          contents: promptContent,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const replyText = response.text || 'No text generated.';
        return res.json({ success: true, text: replyText });
      } catch (geminiError: any) {
        const errMsg = geminiError?.message || String(geminiError);
        const status = geminiError?.status || geminiError?.code;

        // Detect 429 / Quota / Resource Exhausted
        if (
          status === 429 ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('rate limit')
        ) {
          return res.status(429).json({
            success: false,
            errorType: 'RATE_LIMIT',
            retryAfterMs: 86400000, // 24 hours cooldown
            message: 'Gemini account usage limit reached. Cooldown timer recorded.',
          });
        }

        return res.status(500).json({
          success: false,
          errorType: 'API_ERROR',
          message: `Gemini API error: ${errMsg}`,
        });
      }
    }

    // 2. ANTHROPIC CLAUDE (Official Messages API)
    if (provider === 'claude') {
      const activeKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_KEY',
          message: 'No Claude API key provided. Add one in AXON Settings > AI Accounts.',
        });
      }

      const claudeModel = model || 'claude-3-5-sonnet-20241022';

      // Build Claude messages array
      const history = (messages || []).slice(-6).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      if (formattedContext && history.length > 0) {
        history[0].content = `${formattedContext}${history[0].content}`;
      }

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': activeKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 1024,
          system: systemInstruction,
          messages: history.length > 0 ? history : [{ role: 'user', content: 'Hello' }],
        }),
      });

      const data: any = await claudeRes.json();

      if (!claudeRes.ok) {
        if (claudeRes.status === 429 || data?.error?.type === 'rate_limit_error') {
          return res.status(429).json({
            success: false,
            errorType: 'RATE_LIMIT',
            retryAfterMs: 86400000,
            message: 'Claude account usage limit reached. Cooldown timer recorded.',
          });
        }
        return res.status(claudeRes.status).json({
          success: false,
          errorType: 'API_ERROR',
          message: data?.error?.message || 'Claude API returned an error',
        });
      }

      const reply = data.content?.[0]?.text || '';
      return res.json({ success: true, text: reply });
    }

    // 3. OPENAI CHATGPT (Official Chat Completions API)
    if (provider === 'chatgpt') {
      const activeKey = apiKey || process.env.OPENAI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          success: false,
          errorType: 'MISSING_KEY',
          message: 'No ChatGPT API key provided. Add one in AXON Settings > AI Accounts.',
        });
      }

      const gptModel = model || 'gpt-4o';

      const history = (messages || []).slice(-6).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      if (formattedContext && history.length > 0) {
        history[0].content = `${formattedContext}${history[0].content}`;
      }

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: gptModel,
          messages: [{ role: 'system', content: systemInstruction }, ...history],
          max_tokens: 1024,
        }),
      });

      const data: any = await openAiRes.json();

      if (!openAiRes.ok) {
        if (
          openAiRes.status === 429 ||
          data?.error?.code === 'insufficient_quota' ||
          data?.error?.code === 'rate_limit_exceeded'
        ) {
          return res.status(429).json({
            success: false,
            errorType: 'RATE_LIMIT',
            retryAfterMs: 86400000,
            message: 'ChatGPT account usage limit reached. Cooldown timer recorded.',
          });
        }
        return res.status(openAiRes.status).json({
          success: false,
          errorType: 'API_ERROR',
          message: data?.error?.message || 'ChatGPT API returned an error',
        });
      }

      const reply = data.choices?.[0]?.message?.content || '';
      return res.json({ success: true, text: reply });
    }

    return res.status(400).json({ success: false, message: 'Unsupported AI provider.' });
  } catch (error: any) {
    console.error('API Chat route error:', error);
    return res.status(500).json({
      success: false,
      errorType: 'INTERNAL_ERROR',
      message: error?.message || 'Internal server error processing AI request',
    });
  }
});

// Conversation Context Summarizer (Used for seamless handoff when manually switching accounts)
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || messages.length === 0) {
      return res.json({ summary: '' });
    }

    const conversationText = messages
      .slice(-10)
      .map((m: any) => `${m.sender}: ${m.text}`)
      .join('\n');

    // Fast local summary fallback
    const keyPoints = messages
      .filter((m: any) => m.sender === 'user')
      .slice(-3)
      .map((m: any) => m.text.slice(0, 80))
      .join('; ');

    const fallbackSummary = `Recent topics discussed: ${keyPoints || 'General inquiry'}. Prior session active.`;

    // Try Gemini if key available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const summaryRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Provide a concise 2-sentence summary of this user-assistant conversation to preserve context for a new session:\n\n${conversationText}`,
        });
        if (summaryRes.text) {
          return res.json({ summary: summaryRes.text.trim() });
        }
      } catch (e) {
        // use fallback
      }
    }

    return res.json({ summary: fallbackSummary });
  } catch (err: any) {
    return res.json({ summary: 'Prior conversation context retained.' });
  }
});

// Conversation Knowledge Extractor (Extracts conversation into structured Markdown notes)
app.post('/api/ai/extract', async (req, res) => {
  try {
    const { messages, projectName, mode } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'No messages to extract' });
    }

    const conversationText = messages
      .map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');

    if (mode === 'raw') {
      const rawTitle = `Transcript: ${projectName || 'Session'} — ${new Date().toLocaleDateString()}`;
      let rawContent = `# Conversation Transcript: ${projectName || 'Workspace'}\n`;
      rawContent += `**Date:** ${new Date().toLocaleString()} · **Messages:** ${messages.length}\n\n---\n\n`;
      messages.forEach((m: any) => {
        const senderBadge = m.sender === 'user' ? '👤 **User**' : `🤖 **AXON (${m.modelUsed || 'AI'})**`;
        rawContent += `### ${senderBadge} <small>(${m.timestamp})</small>\n\n${m.text}\n\n---\n\n`;
      });
      return res.json({
        success: true,
        title: rawTitle,
        content: rawContent,
      });
    }

    // Try Gemini structured extraction if key available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `You are AXON's Conversation Knowledge Extractor.
Synthesize the key takeaways, decisions, and any code from this smartphone conversation into an elegant, concise Markdown note.

Required Markdown Structure:
# Executive Summary: [Short Dynamic Title]
**Project Scope:** ${projectName || 'General Workspace'}
**Extraction Date:** ${new Date().toLocaleString()}

## 🎯 Key Topics & Queries
- [Concise bullet points]

## 💡 Decisions & Recommendations
- [Clear bullet points]

## 📋 Action Items
- [ ] [Concrete follow-up action]

## 💻 Code & Technical Artifacts (if discussed)
[Formatted code blocks with language tags, or omit this section if no code was discussed]

Conversation dialogue:
${conversationText}`;

        const extractRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (extractRes.text) {
          return res.json({
            success: true,
            title: `${projectName || 'Project'} — Summary (${new Date().toLocaleDateString()})`,
            content: extractRes.text.trim(),
          });
        }
      } catch (geminiExtractErr) {
        console.warn('Gemini extraction failed, using template synthesis', geminiExtractErr);
      }
    }

    // Template Fallback synthesis
    const userQueries = messages.filter((m: any) => m.sender === 'user').map((m: any) => m.text);
    const aiReplies = messages.filter((m: any) => m.sender === 'axon').map((m: any) => m.text);

    let doc = `# Executive Summary: ${projectName || 'General Workspace'}\n`;
    doc += `**Extracted:** ${new Date().toLocaleString()} · **Messages:** ${messages.length}\n\n`;
    doc += `## 🎯 Core Topics Discussed\n`;
    userQueries.slice(-5).forEach((q: string, i: number) => {
      doc += `- **Topic ${i + 1}:** ${q.slice(0, 140)}${q.length > 140 ? '...' : ''}\n`;
    });
    doc += `\n## 💡 Key Takeaways\n`;
    aiReplies.slice(-3).forEach((r: string) => {
      doc += `- ${r.slice(0, 160)}${r.length > 160 ? '...' : ''}\n`;
    });
    doc += `\n## 📋 Action Items\n`;
    doc += `- [ ] Apply insights to active project tasks\n`;
    doc += `- [ ] Keep project memory updated in AXON\n\n`;
    doc += `---\n\n## 📜 Full Dialogue Record\n\n`;
    messages.forEach((m: any) => {
      const sender = m.sender === 'user' ? 'User' : 'AXON';
      doc += `**${sender} (${m.timestamp}):**\n${m.text}\n\n`;
    });

    return res.json({
      success: true,
      title: `${projectName || 'Workspace'} — Takeaways (${new Date().toLocaleDateString()})`,
      content: doc,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Extraction failed: ' + err?.message });
  }
});

// Audio Transcription Endpoint
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, message: 'No audio data provided' });
    }

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe the spoken speech in this audio verbatim. Output only the transcribed text, with no extra conversational commentary.',
              },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';
      return res.json({ success: true, transcript: text });
    } else {
      return res.json({
        success: false,
        message: 'No GEMINI_API_KEY configured for server-side audio transcription.',
      });
    }
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Transcription failed' });
  }
});

// Vite Middleware for Development or Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AXON Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
