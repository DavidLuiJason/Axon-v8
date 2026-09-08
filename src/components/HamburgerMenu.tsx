import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Wrench,
  Code2,
  Zap,
  Video,
  FileText,
  Settings,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  HardDrive,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AxonLogo } from './AxonLogo';
import { ScreenId } from '../types';
import { ProjectSwitcherModal } from './ProjectSwitcherModal';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose }) => {
  const {
    currentScreen,
    navigateTo,
    icons,
    activeProject,
    projects,
    setActiveProjectId,
    drawerGestureOffset,
  } = useApp();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(false);

  // Real-time gesture drag tracking for drawer (iOS / ChatGPT style)
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isHorizontalGestureRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isHorizontalGestureRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (isHorizontalGestureRef.current === null) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
        isHorizontalGestureRef.current = false; // vertical scroll inside drawer
        return;
      }
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
        isHorizontalGestureRef.current = true; // horizontal drawer drag
      }
    }

    if (isHorizontalGestureRef.current) {
      // Drawer can only be dragged left to close
      if (diffX <= 0) {
        setDragOffset(diffX);
      } else {
        // Elastic resistance if dragging right
        setDragOffset(diffX * 0.15);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const currentX = e.changedTouches[0].clientX;
    const diffX = currentX - touchStartXRef.current;
    const dt = Date.now() - touchStartTimeRef.current;
    const velocity = diffX / Math.max(1, dt);

    // Completion threshold: dragged left > 60px or fast swipe
    const shouldClose = diffX < -60 || (velocity < -0.35 && diffX < -25);

    if (shouldClose) {
      setDragOffset(-320);
      setTimeout(() => {
        onClose();
        setDragOffset(0);
      }, 180);
    } else {
      // Springs back smoothly to origin
      setDragOffset(0);
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalGestureRef.current = null;
  };

  const isVisible = isOpen || drawerGestureOffset !== null;
  if (!isVisible) return null;

  const otherNavItems: Array<{
    id: ScreenId;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'tools',
      label: 'Tools Menu',
      description: 'Calculator, color mixer, bible & conversions',
      icon: Wrench,
    },
    {
      id: 'code',
      label: 'AXON Code',
      description: 'Coding workspace & runtime preview',
      icon: Code2,
    },
    {
      id: 'automation',
      label: 'Automation & Run Code',
      description: 'Conditional triggers & live script layer',
      icon: Zap,
    },
    {
      id: 'notes',
      label: 'Library',
      description: 'Context notes, chat extracts & documents',
      icon: FileText,
    },
    {
      id: 'video_editor',
      label: 'Video Editor',
      description: 'Timeline editor & waveform synthesizer',
      icon: Video,
    },
    {
      id: 'storage',
      label: 'Storage & Manifest',
      description: 'Budget allocation, manifest & space management',
      icon: HardDrive,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Theme customization, AI accounts & workspace data',
      icon: Settings,
    },
  ];

  const handleSelect = (id: ScreenId) => {
    navigateTo(id);
    onClose();
  };

  const effectiveTranslateX = isOpen
    ? dragOffset
    : -320 + Math.min(320, Math.max(0, drawerGestureOffset || 0));

  const backdropOpacity = isOpen
    ? Math.max(0, Math.min(1, 1 + dragOffset / 300))
    : Math.max(0, Math.min(1, (drawerGestureOffset || 0) / 320));

  const isInteractivelyDragging = dragOffset !== 0 || drawerGestureOffset !== null;

  return (
    <div
      id="hamburger-overlay"
      className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md transition-opacity duration-150 select-none cursor-pointer"
      style={{ opacity: backdropOpacity }}
      onClick={onClose}
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        id="hamburger-drawer"
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          setDragOffset(0);
          touchStartXRef.current = null;
        }}
        style={{
          transform: `translate3d(${effectiveTranslateX}px, 0, 0)`,
          transition: isInteractivelyDragging
            ? 'none'
            : 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="w-80 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800 flex flex-col shadow-2xl text-white select-none will-change-transform cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding and active App Icon */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AxonLogo
              size={32}
              preset={icons.appIconType === 'preset' ? icons.appIconPreset : undefined}
              customUrl={icons.appIconType === 'custom' ? icons.appIconCustomUrl : undefined}
            />
            <div>
              <span className="font-bold tracking-wider text-base text-white">AXON</span>
              <p className="text-[11px] text-neutral-400">Personal AI Workspace</p>
            </div>
          </div>
          <button
            id="hamburger-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 active:scale-95 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation items container */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
            Workspace & Navigation
          </div>

          {/* AXON WORKSPACE ITEM (Restructured with downward arrow and in-place expansion) */}
          <div className="rounded-xl overflow-hidden border border-neutral-800/60 bg-neutral-950/40">
            <div
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors group ${
                currentScreen === 'axon'
                  ? 'bg-neutral-900 text-white font-medium'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              {/* Tapping the label itself jumps straight to whichever project/chat was last worked on */}
              <button
                id="hamburger-nav-axon"
                type="button"
                onClick={() => handleSelect('axon')}
                className="flex-1 flex items-center gap-3 min-w-0 text-left active:opacity-80"
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    currentScreen === 'axon'
                      ? 'bg-white text-black'
                      : 'bg-neutral-900 text-neutral-400 group-hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                    <span>AXON Workspace</span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: activeProject.color || '#ffffff' }}
                      title={`Active: ${activeProject.name}`}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {activeProject.name} • Dual-pane AI chat
                  </p>
                </div>
              </button>

              {/* Tapping downward arrow expands projects list in place */}
              <button
                id="hamburger-axon-expand-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWorkspaceExpanded((prev) => !prev);
                }}
                aria-label={isWorkspaceExpanded ? 'Collapse projects list' : 'Expand projects list'}
                title={isWorkspaceExpanded ? 'Collapse projects' : 'View projects'}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all ml-1 shrink-0"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isWorkspaceExpanded ? 'rotate-180 text-white' : 'text-neutral-400'
                  }`}
                />
              </button>
            </div>

            {/* In-place expanded project list */}
            {isWorkspaceExpanded && (
              <div
                id="hamburger-axon-expanded-projects"
                className="p-2 border-t border-neutral-800 bg-neutral-900/50 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  <span>Projects ({projects.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectModalOpen(true);
                    }}
                    className="text-white hover:text-neutral-300 transition-colors flex items-center gap-1 font-medium capitalize text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Project</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                  {projects.map((proj) => {
                    const isCurrent = proj.id === activeProject.id;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          navigateTo('axon');
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all text-left ${
                          isCurrent
                            ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                            : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color || '#ffffff' }}
                          />
                          <span className="truncate">{proj.name}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-end px-1">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(true)}
                    className="text-[11px] text-neutral-400 hover:text-white transition-colors"
                  >
                    Manage All Projects →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Other Navigation Items */}
          {otherNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`hamburger-nav-${item.id}`}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors group ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {item.label}
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.description}</p>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>AXON v0.1</span>
          <span className="text-[11px]">Swipe left to close</span>
        </div>
      </div>

      {/* Project Switcher Modal */}
      <ProjectSwitcherModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
};
