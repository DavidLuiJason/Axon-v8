import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  FileText,
  Calendar,
  Check,
  X,
  Pin,
  Folder,
  Tag,
  Copy,
  Sparkles,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NoteCategory, NoteItem } from '../types';

export const NotesScreen: React.FC = () => {
  const {
    notes,
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    addNote,
    updateNote,
    togglePinNote,
    deleteNote,
    goBack,
    showToast,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<'active' | 'all' | string>('active');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'all'>('all');

  // Creation/Edit modal state
  const [isCreating, setIsCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form fields
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [projectInput, setProjectInput] = useState(activeProjectId);
  const [categoryInput, setCategoryInput] = useState<NoteCategory>('general');
  const [tagsInput, setTagsInput] = useState('');

  // Filter notes by project, category, and full-text search
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // 1. Project filtering
        if (projectFilter === 'active') {
          if (n.projectId && n.projectId !== activeProjectId && n.projectId !== 'global') {
            return false;
          }
        } else if (projectFilter !== 'all') {
          if (n.projectId !== projectFilter) return false;
        }

        // 2. Category filtering
        if (categoryFilter !== 'all') {
          const cat = n.category || 'general';
          if (cat !== categoryFilter) return false;
        }

        // 3. Full-text search
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const inTitle = n.title.toLowerCase().includes(q);
        const inContent = n.content.toLowerCase().includes(q);
        const inTags = n.tags?.some((t) => t.toLowerCase().includes(q));
        const projName = projects.find((p) => p.id === n.projectId)?.name.toLowerCase() || '';
        const inProj = projName.includes(q);

        return inTitle || inContent || inTags || inProj;
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then newest updated/created first
        return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
      });
  }, [notes, projectFilter, activeProjectId, categoryFilter, searchQuery, projects]);

  const handleStartCreate = () => {
    setTitleInput('');
    setContentInput('');
    setProjectInput(activeProjectId);
    setCategoryInput('general');
    setTagsInput('');
    setEditingNoteId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (note: NoteItem) => {
    setTitleInput(note.title);
    setContentInput(note.content);
    setProjectInput(note.projectId || activeProjectId);
    setCategoryInput(note.category || 'general');
    setTagsInput(note.tags?.join(', ') || '');
    setEditingNoteId(note.id);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!titleInput.trim() && !contentInput.trim()) {
      setIsCreating(false);
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingNoteId) {
      updateNote(editingNoteId, {
        title: titleInput.trim() || 'Untitled Note',
        content: contentInput,
        projectId: projectInput,
        category: categoryInput,
        tags: parsedTags,
      });
    } else {
      addNote(
        titleInput.trim() || 'Untitled Note',
        contentInput,
        projectInput,
        parsedTags,
        categoryInput
      );
    }

    setIsCreating(false);
    setEditingNoteId(null);
    setTitleInput('');
    setContentInput('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingNoteId(null);
  };

  const handleCopyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Note copied to clipboard');
  };

  const getProjectName = (projId?: string) => {
    if (!projId || projId === 'global') return 'Global';
    const found = projects.find((p) => p.id === projId);
    return found ? found.name : 'General Workspace';
  };

  const CATEGORIES: { id: NoteCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'extracted_chat', label: 'Chat Extracts' },
    { id: 'code', label: 'Code' },
    { id: 'prompt', label: 'Prompts' },
    { id: 'spec', label: 'Specs' },
  ];

  return (
    <div
      id="notes-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header bar with Back button and New Note action */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Notes & Memory</span>
            </h2>
            <p className="text-xs text-neutral-400">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} • Context-isolated workspace
            </p>
          </div>

          <button
            id="notes-add-new-btn"
            type="button"
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>

        {/* Project Scope Filter Banner */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-neutral-900/70 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 pl-1">
            <Folder className="w-3.5 h-3.5 text-neutral-400" />
            <span>Scope:</span>
          </div>

          <button
            type="button"
            onClick={() => setProjectFilter('active')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              projectFilter === 'active'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white'
            }`}
          >
            Current: {activeProject.name}
          </button>

          <button
            type="button"
            onClick={() => setProjectFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              projectFilter === 'all'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white'
            }`}
          >
            All Projects ({notes.length})
          </button>

          {/* Individual project filter dropdown */}
          <div className="relative ml-auto">
            <select
              value={projectFilter.startsWith('proj-') ? projectFilter : ''}
              onChange={(e) => {
                if (e.target.value) setProjectFilter(e.target.value);
              }}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-neutral-600 appearance-none pr-6 cursor-pointer"
            >
              <option value="">Filter by Project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search bar & Category filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="notes-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Full-text search notes, extracts, tags..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-neutral-200 text-black font-semibold'
                    : 'bg-neutral-900 border border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note Creator/Editor Inline Card */}
        {isCreating && (
          <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                {editingNoteId ? 'Edit Note' : 'Create New Note'}
              </span>
              <button
                type="button"
                onClick={handleCancel}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              id="note-title-input"
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Note title..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              autoFocus
            />

            {/* Scope / Project Assignment & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 font-medium">
                  Assign to Project
                </label>
                <select
                  id="note-project-select"
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="global">Global (Available across all projects)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 font-medium">
                  Category
                </label>
                <select
                  id="note-category-select"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as NoteCategory)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-600"
                >
                  <option value="general">General Note</option>
                  <option value="extracted_chat">Chat Extract</option>
                  <option value="code">Code / Snippet</option>
                  <option value="prompt">Prompt</option>
                  <option value="spec">Spec / Architecture</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1 font-medium">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. auth, api, architecture..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              />
            </div>

            <textarea
              id="note-content-input"
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Write your note, code, or prompt here..."
              rows={5}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none leading-relaxed font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                id="note-save-btn"
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-2.5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80">
              <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-400">
                {searchQuery ? 'No matching notes found' : 'No notes in this view'}
              </p>
              <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try a different keyword or clear your search query.'
                  : `Tap "New Note" to save notes, code, or extract insights from AI conversations in "${activeProject.name}".`}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isExtracted = note.category === 'extracted_chat';
              const projName = getProjectName(note.projectId);

              return (
                <div
                  key={note.id}
                  id={`note-item-${note.id}`}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 group select-text ${
                    note.isPinned
                      ? 'bg-neutral-900/90 border-neutral-700 shadow-sm'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white leading-tight">
                          {note.title}
                        </h3>

                        {note.isPinned && (
                          <span className="px-1.5 py-0.5 rounded bg-white text-black text-[10px] font-bold flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5 fill-black" />
                            <span>PINNED</span>
                          </span>
                        )}

                        {isExtracted && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] border border-neutral-700 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-neutral-400" />
                            <span>Chat Extract</span>
                          </span>
                        )}

                        <span className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 text-[10px] border border-neutral-800">
                          {projName}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 select-none">
                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={() => togglePinNote(note.id)}
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned
                            ? 'text-white bg-neutral-800'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy content button */}
                      <button
                        type="button"
                        onClick={() => handleCopyNote(note.content)}
                        title="Copy note content"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        title="Edit note"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button: ALWAYS triggers confirmation prompt! */}
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        title="Delete note"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content body */}
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {note.content}
                  </p>

                  {/* Tags & timestamp footer */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/60 text-[10px] text-neutral-500 select-none">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Tag className="w-3 h-3 text-neutral-600" />
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={() => setSearchQuery(tag)}
                              className="px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 hover:text-white cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      <span>{note.updatedAt || note.createdAt}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
