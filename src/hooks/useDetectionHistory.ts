import { useState, useCallback, useRef, useEffect } from 'react';
import type { DetectionEvent, NoteInfo, KeyInfo } from '../types/audio';

const MAX_HISTORY_LENGTH = 100;
const THROTTLE_MS = 500;

export function useDetectionHistory(
  noteInfo: NoteInfo | null,
  bpm: number | null,
  keyInfo: KeyInfo | null,
  isActive: boolean
) {
  const [history, setHistory] = useState<DetectionEvent[]>([]);
  const lastAddTimeRef = useRef<number>(0);

  // Add event to history (throttled)
  useEffect(() => {
    if (!isActive) return;

    const now = Date.now();
    if (now - lastAddTimeRef.current < THROTTLE_MS) {
      return;
    }

    // Only add if we have meaningful data
    if (!noteInfo && bpm === null && (!keyInfo || !keyInfo.key)) {
      return;
    }

    lastAddTimeRef.current = now;

    const event: DetectionEvent = {
      timestamp: now,
      note: noteInfo,
      bpm,
      key: keyInfo?.key ? keyInfo : null,
    };

    setHistory(prev => {
      const newHistory = [...prev, event];
      // Keep only last N items
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        return newHistory.slice(-MAX_HISTORY_LENGTH);
      }
      return newHistory;
    });
  }, [noteInfo, bpm, keyInfo, isActive]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Clear history when deactivated
  useEffect(() => {
    if (!isActive) {
      setHistory([]);
    }
  }, [isActive]);

  return {
    history,
    clearHistory,
  };
}
