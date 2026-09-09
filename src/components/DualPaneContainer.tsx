import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatPane } from './ChatPane';
import { WorkspacePane } from './WorkspacePane';

export const DualPaneContainer: React.FC = () => {
  const {
    paneViewState,
    setPaneViewState,
    openMenu,
    setDrawerGestureOffset,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time gesture swipe tracking between Chat and Workspace (iOS/ChatGPT style)
  const [dragOffset, setDragOffset] = useState(0);
  const [isGesturing, setIsGesturing] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const isMouseActiveRef = useRef<boolean>(false);

  // Exclude interactive elements from triggering swipe navigation
  const isIgnoredTarget = (target: HTMLElement | null): boolean => {
    if (!target) return false;

    // Full-surface swipe navigation: from anywhere on the code/workspace interface,
    // swiping in the return direction back to chat works across the entire surface.
    if (
      paneViewState === 'workspace-only' ||
      Boolean(target.closest('#dual-pane-right, #workspace-pane'))
    ) {
      return false;
    }

    return Boolean(
      target.closest(
        'input, textarea, select, button, [contenteditable="true"], .no-swipe-gesture, #chat-input-bar, #chat-bottom-dock, #chat-bottom-shortcut-bar, #edit-shortcuts-modal, [data-no-swipe], pre, code'
      )
    );
  };

  // Touch handlers (Mobile / Touchscreens)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isIgnoredTarget(e.target as HTMLElement | null)) {
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
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Lock direction on first significant movement
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
          // Dragging left moves towards workspace in real time
          setDragOffset(diffX);
          setDrawerGestureOffset(null);
        } else {
          // Dragging right from chat pane opens navigation drawer with real-time tracking
          setDragOffset(0);
          setDrawerGestureOffset(diffX);
        }
      } else {
        // Workspace view: dragging right moves towards chat in real time
        setDrawerGestureOffset(null);
        if (diffX >= 0) {
          setDragOffset(diffX);
        } else {
          setDragOffset(diffX * 0.18); // Rubber-band resistance on rightmost boundary
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) {
      setDragOffset(0);
      setDrawerGestureOffset(null);
      setIsGesturing(false);
      return;
    }

    const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 400;
    const halfwayThreshold = containerWidth * 0.5; // Halfway threshold (50%)
    const currentX = e.changedTouches[0].clientX;
    const diffX = currentX - touchStartXRef.current;
    const dt = Math.max(1, Date.now() - touchStartTimeRef.current);
    const velocity = diffX / dt;

    if (gestureLockRef.current === 'horizontal') {
      const isChat = paneViewState === 'chat-only';

      if (isChat) {
        if (diffX > 0) {
          // Swiping right to open navigation drawer
          if (diffX > 55 || (velocity > 0.35 && diffX > 25)) {
            openMenu();
          } else {
            setDrawerGestureOffset(null);
          }
        } else if (diffX < 0) {
          // Dragging left towards workspace:
          // Completes transition if dragged past halfway threshold OR fast flick past 40px; otherwise springs back
          if (-diffX >= halfwayThreshold || (velocity < -0.4 && diffX < -40)) {
            setPaneViewState('workspace-only');
          }
        }
      } else {
        // In workspace view: dragging right towards chat:
        // Completes transition if dragged past halfway threshold OR fast flick past 40px; otherwise springs back
        if (diffX > 0) {
          if (diffX >= halfwayThreshold || (velocity > 0.4 && diffX > 40)) {
            setPaneViewState('chat-only');
          }
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

  // Mouse drag support for desktop/pointer
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isIgnoredTarget(e.target as HTMLElement | null)) return;

    touchStartXRef.current = e.clientX;
    touchStartYRef.current = e.clientY;
    touchStartTimeRef.current = Date.now();
    gestureLockRef.current = null;
    isMouseActiveRef.current = true;
    setIsGesturing(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseActiveRef.current || touchStartXRef.current === null || touchStartYRef.current === null) return;

      const diffX = e.clientX - touchStartXRef.current;
      const diffY = e.clientY - touchStartYRef.current;

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
            setDragOffset(diffX);
            setDrawerGestureOffset(null);
          } else {
            setDragOffset(0);
            setDrawerGestureOffset(diffX);
          }
        } else {
          setDrawerGestureOffset(null);
          if (diffX >= 0) {
            setDragOffset(diffX);
          } else {
            setDragOffset(diffX * 0.18);
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseActiveRef.current || touchStartXRef.current === null) return;

      const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 400;
      const halfwayThreshold = containerWidth * 0.5;
      const diffX = e.clientX - touchStartXRef.current;
      const dt = Math.max(1, Date.now() - touchStartTimeRef.current);
      const velocity = diffX / dt;

      if (gestureLockRef.current === 'horizontal') {
        const isChat = paneViewState === 'chat-only';

        if (isChat) {
          if (diffX > 0) {
            if (diffX > 55 || (velocity > 0.35 && diffX > 25)) {
              openMenu();
            } else {
              setDrawerGestureOffset(null);
            }
          } else if (diffX < 0) {
            if (-diffX >= halfwayThreshold || (velocity < -0.4 && diffX < -40)) {
              setPaneViewState('workspace-only');
            }
          }
        } else {
          if (diffX > 0) {
            if (diffX >= halfwayThreshold || (velocity > 0.4 && diffX > 40)) {
              setPaneViewState('chat-only');
            }
          }
        }
      }

      setDragOffset(0);
      setDrawerGestureOffset(null);
      setIsGesturing(false);
      isMouseActiveRef.current = false;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      gestureLockRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [paneViewState, openMenu, setDrawerGestureOffset, setPaneViewState]);

  // Real-time track position & smooth spring transition
  let transformStyle = 'translate3d(0%, 0, 0)';
  const transitionStyle = isGesturing
    ? 'none'
    : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';

  if (paneViewState === 'chat-only') {
    transformStyle =
      dragOffset !== 0
        ? `translate3d(${dragOffset}px, 0, 0)`
        : 'translate3d(0%, 0, 0)';
  } else {
    // Workspace-only: base position is -50% of 200% track (-100% of container)
    transformStyle =
      dragOffset !== 0
        ? `translate3d(calc(-50% + ${dragOffset}px), 0, 0)`
        : 'translate3d(-50%, 0, 0)';
  }

  return (
    <div
      ref={containerRef}
      id="dual-pane-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      className="relative flex-1 min-h-0 w-full overflow-hidden bg-black"
      style={{ touchAction: 'pan-y' }}
    >
      {/* 2-Screen Swipeable Slider Track (200% width, exactly 100% per screen) */}
      <div
        id="dual-pane-track"
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '200%',
          height: '100%',
          flexShrink: 0,
          transform: transformStyle,
          transition: transitionStyle,
          willChange: 'transform',
        }}
        className="h-full min-h-0 overflow-hidden"
      >
        {/* Left Screen: Chat (Full Screen) */}
        <div
          id="dual-pane-left"
          style={{ width: '50%', flexShrink: 0 }}
          className="h-full min-h-0 overflow-hidden flex flex-col shrink-0"
        >
          <ChatPane />
        </div>

        {/* Right Screen: Workspace / Code (Full Screen) */}
        <div
          id="dual-pane-right"
          style={{ width: '50%', flexShrink: 0 }}
          className="h-full min-h-0 overflow-hidden flex flex-col shrink-0"
        >
          <WorkspacePane />
        </div>
      </div>
    </div>
  );
};
