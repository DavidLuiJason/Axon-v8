import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { ChatPane } from './ChatPane';
import { WorkspacePane } from './WorkspacePane';

export const DualPaneContainer: React.FC = () => {
  const {
    paneViewState,
    setPaneViewState,
    splitRatio,
    setSplitRatio,
    openMenu,
    drawerGestureOffset,
    setDrawerGestureOffset,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Desktop splitter drag
  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = Math.max(15, Math.min(85, (relativeX / rect.width) * 100));
      setSplitRatio(percentage);
    },
    [setSplitRatio]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handlePointerMove(e.clientX);
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handlePointerMove]);

  // Real-time gesture swipe tracking between Chat and Workspace (iOS/ChatGPT style)
  const [dragOffset, setDragOffset] = useState(0);
  const [isGesturing, setIsGesturing] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (paneViewState === 'split') return;

    // Do not intercept touches on form controls, buttons, input bar, or shortcut menus
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, select, button, [contenteditable="true"], .no-swipe-gesture, #chat-input-bar, #chat-bottom-shortcut-bar, #edit-shortcuts-modal, [data-no-swipe]'
      )
    ) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      gestureLockRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      gestureLockRef.current = null;
      setIsGesturing(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      paneViewState === 'split' ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    ) {
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (gestureLockRef.current === null) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
        gestureLockRef.current = 'vertical';
        return;
      }
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
        gestureLockRef.current = 'horizontal';
        setIsGesturing(true);
      }
    }

    if (gestureLockRef.current === 'horizontal') {
      const isChat = paneViewState === 'chat-only';

      if (isChat) {
        if (diffX <= 0) {
          // Dragging left moves towards workspace
          setDragOffset(diffX);
          setDrawerGestureOffset(null);
        } else {
          // Dragging right from ANYWHERE in chat pane opens navigation drawer with real-time tracking
          setDragOffset(0);
          setDrawerGestureOffset(diffX);
        }
      } else {
        // Workspace view: dragging right moves towards chat
        setDrawerGestureOffset(null);
        if (diffX >= 0) {
          setDragOffset(diffX);
        } else {
          setDragOffset(diffX * 0.15); // damping
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (paneViewState === 'split' || touchStartXRef.current === null) {
      setDragOffset(0);
      setDrawerGestureOffset(null);
      setIsGesturing(false);
      return;
    }

    const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 400;
    const currentX = e.changedTouches[0].clientX;
    const diffX = currentX - touchStartXRef.current;
    const dt = Date.now() - touchStartTimeRef.current;
    const velocity = diffX / Math.max(1, dt);

    if (gestureLockRef.current === 'horizontal') {
      const threshold = containerWidth * 0.22;
      const isChat = paneViewState === 'chat-only';

      if (isChat) {
        if (diffX > 0) {
          // Swiping right to open navigation drawer
          if (diffX > 55 || (velocity > 0.35 && diffX > 25)) {
            openMenu();
          } else {
            setDrawerGestureOffset(null);
          }
        } else if (diffX < -threshold || (velocity < -0.35 && diffX < -30)) {
          // Past threshold -> completes to workspace
          setPaneViewState('workspace-only');
        }
      } else {
        // In workspace view: dragging right past threshold completes to chat
        if (diffX > threshold || (velocity > 0.35 && diffX > 30)) {
          setPaneViewState('chat-only');
        }
      }
    }

    setDragOffset(0);
    setDrawerGestureOffset(null);
    setIsGesturing(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    gestureLockRef.current = null;
  };

  const handleTouchCancel = () => {
    setDragOffset(0);
    setDrawerGestureOffset(null);
    setIsGesturing(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    gestureLockRef.current = null;
  };

  const isSplitMode = paneViewState === 'split';

  // Calculate track transform
  let transformStyle = 'none';
  let transitionStyle = isGesturing ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';

  if (!isSplitMode) {
    if (paneViewState === 'chat-only') {
      transformStyle = dragOffset !== 0 ? `translate3d(${dragOffset}px, 0, 0)` : 'translate3d(0%, 0, 0)';
    } else {
      // workspace-only: base position is -50%
      transformStyle =
        dragOffset !== 0
          ? `translate3d(calc(-50% + ${dragOffset}px), 0, 0)`
          : 'translate3d(-50%, 0, 0)';
    }
  }

  return (
    <div
      ref={containerRef}
      id="dual-pane-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`relative flex-1 min-h-0 w-full flex overflow-hidden bg-black ${
        isDragging ? 'cursor-col-resize select-none' : ''
      }`}
    >
      {isSplitMode ? (
        // Split view (desktop side-by-side with draggable splitter)
        <div className="w-full h-full min-h-0 flex overflow-hidden">
          <div
            id="dual-pane-left"
            style={{ width: `${splitRatio}%` }}
            className="h-full min-h-0 overflow-hidden flex flex-col"
          >
            <ChatPane />
          </div>

          <div
            onMouseDown={() => {
              isDraggingRef.current = true;
              setIsDragging(true);
            }}
            className="w-1.5 h-full bg-neutral-900 hover:bg-neutral-700 cursor-col-resize flex items-center justify-center transition-colors shrink-0"
          >
            <div className="w-0.5 h-8 bg-neutral-600 rounded-full" />
          </div>

          <div
            id="dual-pane-right"
            style={{ width: `${100 - splitRatio}%` }}
            className="h-full min-h-0 overflow-hidden flex flex-col"
          >
            <WorkspacePane />
          </div>
        </div>
      ) : (
        // Single-pane gesture slider track (w-[200%])
        <div
          style={{
            transform: transformStyle,
            transition: transitionStyle,
          }}
          className="flex flex-row w-[200%] h-full min-h-0 will-change-transform overflow-hidden"
        >
          {/* Left Pane: Chat (width 50% of track = 100% of container) */}
          <div
            id="dual-pane-left"
            className="w-1/2 h-full min-h-0 overflow-hidden flex flex-col shrink-0"
          >
            <ChatPane />
          </div>

          {/* Right Pane: Workspace (width 50% of track = 100% of container) */}
          <div
            id="dual-pane-right"
            className="w-1/2 h-full min-h-0 overflow-hidden flex flex-col shrink-0"
          >
            <WorkspacePane />
          </div>
        </div>
      )}
    </div>
  );
};
