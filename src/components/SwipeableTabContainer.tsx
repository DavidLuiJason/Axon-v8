import React, { useRef, useState } from 'react';

interface SwipeableTabContainerProps<T extends string> {
  tabs: readonly T[] | T[];
  activeTab: T;
  onTabChange: (newTab: T) => void;
  children: React.ReactNode;
  className?: string;
}

export function SwipeableTabContainer<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  children,
  className = '',
}: SwipeableTabContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const currentIndex = tabs.indexOf(activeTab);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignore touches on form inputs, range sliders, or interactive canvas
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'input, textarea, select, canvas, [contenteditable="true"], .no-tab-swipe'
      )
    ) {
      touchStartRef.current = null;
      isHorizontalSwipeRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isHorizontalSwipeRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - touchStartRef.current.x;
    const dy = currentY - touchStartRef.current.y;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        isHorizontalSwipeRef.current = false; // vertical scroll
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        isHorizontalSwipeRef.current = true; // horizontal swipe
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Elastic resistance if at ends
      let offset = dx;
      const isAtFirst = currentIndex === 0;
      const isAtLast = currentIndex === tabs.length - 1;

      if ((isAtFirst && dx > 0) || (isAtLast && dx < 0)) {
        offset = dx * 0.25;
      } else {
        offset = dx * 0.7;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isHorizontalSwipeRef.current) {
      setDragOffset(0);
      touchStartRef.current = null;
      isHorizontalSwipeRef.current = null;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const dx = touchEndX - touchStartRef.current.x;
    const dt = Date.now() - touchStartRef.current.time;
    const velocity = dx / Math.max(1, dt);

    const threshold = 45;
    const fastSwipe = Math.abs(velocity) > 0.35 && Math.abs(dx) > 20;

    if (dx < -threshold || (fastSwipe && dx < 0)) {
      // Swipe left -> go to next tab
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1]);
      }
    } else if (dx > threshold || (fastSwipe && dx > 0)) {
      // Swipe right -> go to previous tab
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1]);
      }
    }

    setDragOffset(0);
    touchStartRef.current = null;
    isHorizontalSwipeRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        setDragOffset(0);
        touchStartRef.current = null;
        isHorizontalSwipeRef.current = null;
      }}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        style={{
          transform: dragOffset ? `translateX(${dragOffset}px)` : 'none',
          transition: dragOffset ? 'none' : 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}
