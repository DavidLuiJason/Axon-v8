import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Mic,
  MicOff,
  ArrowUp,
  Trash2,
  Paperclip,
  X,
  ChevronDown,
  AlertTriangle,
  Copy,
  Check,
  Folder,
  BookmarkPlus,
  Download,
  FileText,
  Volume2,
  VolumeX,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Share2,
  LayoutGrid,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AxonLogo } from './AxonLogo';
import { ModelSelectorModal } from './ModelSelectorModal';
import { ChatShortcutBar } from './ChatShortcutBar';
import { isAccountInCooldown, getRemainingCooldownString } from '../lib/aiConfig';
import { resolveMessageButtonColor } from '../lib/colorContrast';

export const ChatPane: React.FC = () => {
  const {
    activeProjectMessages,
    activeProject,
    addMessage,
    deleteMessage,
    clearMessages,
    icons,
    availableModels,
    activeModelId,
    aiAccounts,
    isGeneratingResponse,
    showToast,
    extractConversationToNote,
    extractSingleMessageToNote,
    exportConversationToFile,
    theme,
    setPaneViewState,
    liveThinkingStatus,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sharedMessageId, setSharedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isShortcutBarOpen, setIsShortcutBarOpen] = useState(false);

  // Conversation extraction menu
  const [isExtractMenuOpen, setIsExtractMenuOpen] = useState(false);
  const [isExtractingNote, setIsExtractingNote] = useState(false);
  const extractMenuRef = useRef<HTMLDivElement>(null);

  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: string;
    size?: string;
    dataUrl?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 140;
    setShowScrollToBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  const currentModel = availableModels.find((m) => m.id === activeModelId) || availableModels[0];
  const activeAccount = aiAccounts.find(
    (a) => a.provider === currentModel.provider && a.isActive
  );
  const isCooldownActive = isAccountInCooldown(activeAccount);
  const cooldownString = getRemainingCooldownString(activeAccount);

  const functionColors = theme.functionColors || {};

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProjectMessages, isGeneratingResponse]);

  // Voice recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Close extraction menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (extractMenuRef.current && !extractMenuRef.current.contains(e.target as Node)) {
        setIsExtractMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Text-to-speech with Claude-styled audio waveform
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported on this browser/device');
      return;
    }
    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = () => {
    if (!inputVal.trim() && !attachedFile) return;

    addMessage(inputVal.trim(), attachedFile || undefined);

    setInputVal('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      showToast('Listening... Speak now');
    } else {
      setIsRecording(false);
      if (!inputVal) {
        setInputVal('Draft a responsive component layout with clean monochrome styling');
      }
      showToast('Voice transcribed');
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: sizeStr,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
      });
      showToast(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyText = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      showToast('Copied message to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      showToast('Failed to copy');
    }
  };

  const handleShareMessage = async (msgId: string, text: string, isAi: boolean) => {
    const senderLabel = isAi ? 'AXON' : 'User';
    const shareData = {
      title: `${senderLabel} message from AXON`,
      text: text,
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        setSharedMessageId(msgId);
        showToast('Shared message');
        setTimeout(() => setSharedMessageId(null), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setSharedMessageId(msgId);
      showToast('Message copied to clipboard to share');
      setTimeout(() => setSharedMessageId(null), 2000);
    } catch {
      showToast('Unable to share message');
    }
  };

  const handleSaveFullConversation = () => {
    setIsExtractingNote(true);
    setIsExtractMenuOpen(false);
    setTimeout(() => {
      extractConversationToNote();
      setIsExtractingNote(false);
    }, 150);
  };

  return (
    <div
      id="chat-pane"
      className="flex flex-col h-full min-h-0 w-full bg-black text-white relative overflow-hidden"
    >
      {/* Top Chat Bar (Fixed at top of chat pane - never moves, scrolls, or repositions) */}
      <div
        id="chat-top-bar"
        className="h-11 border-b border-neutral-800/80 px-3.5 flex items-center justify-between bg-neutral-950/90 backdrop-blur-sm shrink-0 z-10 select-none"
      >
        {/* Model Selector Pill */}
        <button
          id="chat-model-selector-btn"
          type="button"
          onClick={() => setIsModelModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-95 transition-all text-xs font-medium text-neutral-200"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isCooldownActive ? 'bg-amber-400' : 'bg-white'
              }`}
            />
            <span className="font-semibold text-white">{currentModel.name}</span>
            {activeAccount && (
              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                ({activeAccount.label})
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {/* Action icons: Save to library note, Export, Clear messages */}
        <div className="flex items-center gap-1">
          {/* Save / Export Chat action menu */}
          <div className="relative" ref={extractMenuRef}>
            <button
              id="chat-extract-menu-btn"
              type="button"
              onClick={() => {
                if (activeProjectMessages.length === 0) {
                  showToast('No messages in active chat to export. Send a message first.');
                  return;
                }
                setIsExtractMenuOpen(!isExtractMenuOpen);
              }}
              disabled={isExtractingNote}
              aria-label="Save or export conversation"
              title="Save or Export Conversation"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 active:scale-95 transition-all text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Save / Export</span>
            </button>

            {isExtractMenuOpen && (
              <div
                id="chat-extract-dropdown"
                className="absolute right-0 top-9 w-64 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider flex items-center justify-between">
                  <span>Save & Export Chat</span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {activeProjectMessages.length} msg{activeProjectMessages.length === 1 ? '' : 's'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    handleSaveFullConversation();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                  <div>
                    <div className="font-medium">Save to Notes</div>
                    <div className="text-[10px] text-neutral-400">Save full chat with synthesized summary</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    exportConversationToFile('markdown');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  <div>
                    <div className="font-medium">Export as Markdown (.md)</div>
                    <div className="text-[10px] text-neutral-400">Complete formatted dialogue</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    exportConversationToFile('text');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  <div>
                    <div className="font-medium">Export as Plain Text (.txt)</div>
                    <div className="text-[10px] text-neutral-400">Simple unformatted transcript</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    exportConversationToFile('json');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  <div>
                    <div className="font-medium">Export as JSON (.json)</div>
                    <div className="text-[10px] text-neutral-400">Raw structured data backup</div>
                  </div>
                </button>

                <button
                  id="export-chat-pdf-btn"
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    exportConversationToFile('pdf');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  <div>
                    <div className="font-medium">Export as PDF (.pdf)</div>
                    <div className="text-[10px] text-neutral-400">Printable document transcript</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExtractMenuOpen(false);
                    const transcript = activeProjectMessages
                      .map((m) => `${m.sender === 'user' ? 'User' : 'AXON'}: ${m.text}`)
                      .join('\n\n');
                    navigator.clipboard.writeText(transcript);
                    showToast('Copied conversation to clipboard');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-900 text-left text-neutral-200 hover:text-white transition-colors border-t border-neutral-900"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                  <div>
                    <div className="font-medium">Copy Full Transcript</div>
                    <div className="text-[10px] text-neutral-400">Copy text to clipboard directly</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Clear Messages */}
          {activeProjectMessages.length > 0 && (
            <button
              id="chat-clear-btn"
              type="button"
              onClick={clearMessages}
              aria-label="Clear chat messages"
              title="Clear messages in this project"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream (Freely scrollable / movable messages) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        id="chat-messages-scroll"
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 select-text overscroll-contain relative"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {activeProjectMessages.length === 0 ? (
          <div
            id="chat-empty-state"
            className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4"
          >
            <div
              className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-lg"
              style={{
                borderColor: `${activeProject.color || '#ffffff'}40`,
                backgroundColor: `${activeProject.color || '#ffffff'}15`,
              }}
            >
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Workspace: {activeProject.name}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                {activeProject.description || 'All messages and memories here are isolated to this project.'}
              </p>
            </div>

            {/* Quick Prompt Starter Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
              {[
                { label: 'Brainstorm ideas', prompt: 'Brainstorm 3 innovative features for this project' },
                { label: 'Write component', prompt: 'Create a clean, responsive UI component with TypeScript' },
                { label: 'Explain architecture', prompt: 'Explain the core system architecture and state flow' },
                { label: 'Draft notes', prompt: 'Draft a concise project specification and roadmap' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputVal(item.prompt)}
                  className="text-left px-3 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-neutral-500">
              Type a prompt below or pick a suggestion above to begin.
            </p>
          </div>
        ) : (
          activeProjectMessages.map((msg) => {
            const isAxon = msg.sender === 'axon' || (msg as any).role === 'assistant';
            const isSpeaking = speakingMessageId === msg.id;
            const messageText = typeof msg.text === 'string'
              ? msg.text
              : (msg.text && typeof msg.text === 'object' && 'text' in (msg.text as any)
                  ? String((msg.text as any).text)
                  : JSON.stringify(msg.text || ''));
            const hasWorkspaceLink =
              isAxon &&
              (/(?:built|created|workspace|component|preview|code|file|script|build)/i.test(messageText) ||
                messageText.includes('```'));

            const bubbleBg = isAxon
              ? functionColors.axonBubbleColor || functionColors.aiChatBubbleBg || '#171717'
              : functionColors.userBubbleColor || functionColors.userChatBubbleBg || '#ffffff';

            const rawBtnColor = isAxon
              ? functionColors.axonMsgBtnColor
              : functionColors.userMsgBtnColor;

            const actionBtnColor = resolveMessageButtonColor(
              rawBtnColor,
              bubbleBg,
              functionColors.messageButtonAutoContrast !== false
            );

            return (
              <div
                key={msg.id}
                id={`chat-message-${msg.id}`}
                className={`flex items-start gap-2.5 group ${
                  isAxon ? 'justify-start' : 'justify-end'
                }`}
              >
                {/* AI Avatar next to AXON's messages */}
                {isAxon && (
                  <div className="shrink-0 mt-0.5">
                    <AxonLogo
                      size={30}
                      preset={icons.avatarType === 'preset' ? icons.avatarPreset : undefined}
                      customUrl={icons.avatarType === 'custom' ? icons.avatarCustomUrl : undefined}
                      glow={false}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  style={{
                    backgroundColor: bubbleBg,
                  }}
                  className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isAxon
                      ? 'bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-tl-sm'
                      : 'bg-white text-black font-normal rounded-tr-sm shadow-md'
                  }`}
                >
                  {/* Optional Attachment Preview */}
                  {msg.attachment && (
                    <div
                      className={`mb-2 p-2 rounded-xl flex items-center gap-2 border text-xs ${
                        isAxon
                          ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      {msg.attachment.type.startsWith('image/') && msg.attachment.dataUrl ? (
                        <img
                          src={msg.attachment.dataUrl}
                          alt={msg.attachment.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <Paperclip className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <p className="font-medium truncate">{msg.attachment.name}</p>
                        {msg.attachment.size && (
                          <p className="text-[10px] opacity-70">{msg.attachment.size}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{messageText}</p>

                  {/* Message Footer: Timestamp & Always-Visible Action Buttons */}
                  <div className="flex items-center justify-between gap-2.5 mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 text-[10px]">
                    <div className="flex items-center gap-1.5 opacity-75 font-mono">
                      <span>{msg.timestamp}</span>
                      {/* Claude-styled dynamic audio waveform when speaking aloud */}
                      {isSpeaking && (
                        <div
                          className="flex items-end gap-0.5 h-3 px-1.5 py-0.5 rounded-full bg-current/20"
                          title="Speaking aloud..."
                        >
                          <span className="w-0.5 h-1.5 bg-current rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                          <span className="w-0.5 h-3 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                          <span className="w-0.5 h-2 bg-current rounded-full animate-[pulse_0.5s_ease-in-out_infinite]" />
                          <span className="w-0.5 h-3.5 bg-current rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
                        </div>
                      )}
                    </div>

                    {/* Always visible action buttons with customized contrast-safe coloring */}
                    <div className="flex items-center gap-1 opacity-100">
                      {/* Speech audio read aloud toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.id, messageText)}
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                        aria-label={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                        style={{ color: actionBtnColor, borderColor: `${actionBtnColor}40` }}
                        className="p-1 rounded-md border bg-black/5 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center shadow-xs"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Copy text */}
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, messageText)}
                        title="Copy text"
                        aria-label="Copy message text"
                        style={{ color: actionBtnColor, borderColor: `${actionBtnColor}40` }}
                        className="p-1 rounded-md border bg-black/5 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center shadow-xs"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Share button replaces delete and save to workspace for both chats */}
                      <button
                        type="button"
                        onClick={() => handleShareMessage(msg.id, messageText, isAxon)}
                        title="Share message"
                        aria-label="Share message"
                        style={{ color: actionBtnColor, borderColor: `${actionBtnColor}40` }}
                        className="p-1 rounded-md border bg-black/5 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center shadow-xs"
                      >
                        {sharedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Dynamic Thinking / Generating Indicator with concise activity status */}
        {isGeneratingResponse && (
          <div className="flex items-start gap-2.5 animate-in fade-in duration-150">
            <div className="shrink-0 mt-0.5">
              <AxonLogo
                size={30}
                preset={icons.avatarType === 'preset' ? icons.avatarPreset : undefined}
                customUrl={icons.avatarType === 'custom' ? icons.avatarCustomUrl : undefined}
                glow={true}
              />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-white">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
              </div>
              <span className="font-mono text-xs text-neutral-200">
                {liveThinkingStatus || 'Thinking...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button when user scrolls up (ChatGPT pattern) */}
      {showScrollToBottom && (
        <button
          id="chat-scroll-bottom-btn"
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          title="Scroll to latest messages"
          className="absolute bottom-24 right-4 z-30 p-2.5 rounded-full bg-neutral-900/90 text-white border border-neutral-700 shadow-2xl backdrop-blur-md active:scale-95 hover:bg-neutral-800 transition-all flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <ArrowDown className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Fixed Bottom Input Dock: Pinned at bottom - never moves, scrolls, or repositions with page content */}
      <div
        id="chat-bottom-dock"
        className="shrink-0 flex flex-col z-20 bg-neutral-950/95 border-t border-neutral-800/80"
      >
        {/* Usage Limit Cooldown Warning Banner if active */}
        {isCooldownActive && (
          <div
            id="chat-cooldown-alert"
            className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {activeAccount?.label} reached API limit ({cooldownString}). AXON will not auto-switch.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModelModalOpen(true)}
              className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-[11px] font-semibold transition-colors shrink-0"
            >
              Switch Account
            </button>
          </div>
        )}

        {/* Voice Recording Banner if active */}
        {isRecording && (
          <div
            id="voice-recording-banner"
            className="mx-3 mt-2 p-2.5 rounded-xl bg-neutral-900 border border-red-500/40 flex items-center justify-between animate-pulse"
          >
            <div className="flex items-center gap-2 text-xs text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-medium">Listening ({recordingSeconds}s)...</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700"
            >
              Stop
            </button>
          </div>
        )}

        {/* Attachment Draft Pill if user selected an image/file */}
        {attachedFile && (
          <div
            id="chat-attached-file-pill"
            className="mx-3 mt-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              {attachedFile.type.startsWith('image/') ? (
                <span className="p-1 rounded bg-neutral-800 text-white">
                  <Paperclip className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="p-1 rounded bg-neutral-800 text-white">
                  <Paperclip className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="truncate max-w-[200px] text-neutral-200">{attachedFile.name}</span>
              <span className="text-[10px] text-neutral-500">{attachedFile.size}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 text-neutral-400 hover:text-white rounded"
              title="Remove attached file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Slide-up Shortcut Bar directly above the input bar */}
        <ChatShortcutBar
          isOpen={isShortcutBarOpen}
          onClose={() => setIsShortcutBarOpen(false)}
          onInsertPrompt={(prompt) =>
            setInputVal((prev) => (prev ? prev + ' ' + prompt : prompt))
          }
        />

        {/* Input Bar at the bottom (Fixed in place, positioned at the very bottom of the screen) */}
        <div
          id="chat-input-bar"
          className="no-swipe-gesture p-3 pb-4 sm:pb-3.5 bg-neutral-950/95 backdrop-blur-sm shrink-0 relative"
          style={{ touchAction: 'manipulation' }}
        >
        <div
          style={{
            backgroundColor: functionColors.chatInputBg || undefined,
          }}
          className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl px-2 py-1.5 focus-within:border-neutral-600 transition-colors"
        >
          {/* Attach / + Button */}
          <button
            id="chat-attach-btn"
            type="button"
            onClick={handleAttachClick}
            aria-label="Attach file or image"
            title="Attach file"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            id="chat-input-field"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name} in ${activeProject.name}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none min-w-0 px-1 py-1"
          />

          {/* Shortcut Bar Trigger Button (Immediately left of mic) */}
          <button
            id="chat-shortcut-toggle-btn"
            type="button"
            onClick={() => setIsShortcutBarOpen((prev) => !prev)}
            aria-label={isShortcutBarOpen ? 'Hide shortcuts' : 'Show quick shortcuts'}
            title={isShortcutBarOpen ? 'Hide Shortcuts' : 'Quick Shortcuts'}
            className={`p-2 rounded-xl transition-all active:scale-95 shrink-0 ${
              isShortcutBarOpen
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Microphone Icon Button */}
          <button
            id="chat-mic-btn"
            type="button"
            onClick={handleToggleVoice}
            aria-label={isRecording ? 'Mute microphone' : 'Voice input'}
            title={isRecording ? 'Stop Voice' : 'Voice Input'}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Distinct Send/Action Button */}
          <button
            id="chat-send-btn"
            type="button"
            onClick={handleSendMessage}
            disabled={(!inputVal.trim() && !attachedFile) || isGeneratingResponse}
            aria-label="Send message"
            style={{
              backgroundColor:
                (inputVal.trim() || attachedFile) && !isGeneratingResponse
                  ? functionColors.sendButtonColor || '#ffffff'
                  : undefined,
            }}
            className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
              (inputVal.trim() || attachedFile) && !isGeneratingResponse
                ? 'text-black active:scale-95 shadow-md hover:bg-neutral-200'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

      {/* Model & Account Switching Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />
    </div>
  );
};
