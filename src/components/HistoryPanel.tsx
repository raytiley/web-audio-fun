import { useRef, useEffect } from 'react';
import type { DetectionEvent } from '../types/audio';
import { formatNote } from '../utils/noteHelpers';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
  history: DetectionEvent[];
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
        {history.length > 0 && (
          <button className={styles.clearButton} onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className={styles.list} ref={listRef}>
        {history.length === 0 ? (
          <div className={styles.empty}>
            No detections yet. Start listening to see history.
          </div>
        ) : (
          history.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className={styles.item}>
              <span className={styles.time}>{formatTime(event.timestamp)}</span>
              <span className={styles.note}>
                {event.note ? formatNote(event.note) : '--'}
              </span>
              <span className={styles.bpm}>
                {event.bpm !== null ? `${event.bpm} BPM` : '--'}
              </span>
              <span className={styles.key}>
                {event.key ? `${event.key.key} ${event.key.scale}` : '--'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
