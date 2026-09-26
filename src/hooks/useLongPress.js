import { useCallback, useRef, useState } from 'react';

export default function useLongPress(onLongPress, onClick, { delay = 500 } = {}) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef();
  const eventRef = useRef();

  const start = useCallback((e) => {
    // Only handle primary button for mouse
    if (e.type === 'mousedown' && e.button !== 0) return;

    // Persist the event or relevant data if needed
    // Note: React events are pooled in older versions, but we're likely on 17+
    // To be safe, we extract what we need
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    eventRef.current = { clientX, clientY, target: e.target };

    setLongPressTriggered(false);
    timerRef.current = setTimeout(() => {
      onLongPress({
        clientX: eventRef.current.clientX,
        clientY: eventRef.current.clientY,
        target: eventRef.current.target,
        preventDefault: () => {} // Mock for compatibility
      });
      setLongPressTriggered(true);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback((e) => {
    // Only handle primary button release for mouse onClick
    if (e.type === 'mouseup' && e.button !== 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // If it was a long press, we already triggered onLongPress
    // If it wasn't, and it's a valid release, trigger onClick
    if (!longPressTriggered && onClick) {
      onClick(e);
    }
    
    setLongPressTriggered(false);
  }, [onClick, longPressTriggered]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: stop,
    onTouchEnd: stop,
    onContextMenu: (e) => {
      // If a long press was triggered, prevent the default context menu
      if (longPressTriggered) {
        e.preventDefault();
      }
    },
    onMouseLeave: (e) => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };
}
