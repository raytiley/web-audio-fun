import type { NoteInfo } from '../types/audio';
import { formatNote, formatCents, getCentsColor } from '../utils/noteHelpers';
import styles from './NoteDisplay.module.css';

interface NoteDisplayProps {
  noteInfo: NoteInfo | null;
  frequency: number | null;
}

export function NoteDisplay({ noteInfo, frequency }: NoteDisplayProps) {
  const centsColor = noteInfo ? getCentsColor(noteInfo.cents) : undefined;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Note</h2>
      <div className={styles.noteWrapper}>
        <span className={styles.note}>{formatNote(noteInfo)}</span>
        {noteInfo && (
          <span className={styles.cents} style={{ color: centsColor }}>
            {formatCents(noteInfo.cents)}
          </span>
        )}
      </div>
      <div className={styles.frequency}>
        {frequency ? `${frequency.toFixed(1)} Hz` : '-- Hz'}
      </div>
      {noteInfo && (
        <div className={styles.tunerBar}>
          <div className={styles.tunerTrack}>
            <div
              className={styles.tunerIndicator}
              style={{
                left: `${50 + noteInfo.cents / 2}%`,
                backgroundColor: centsColor,
              }}
            />
            <div className={styles.tunerCenter} />
          </div>
        </div>
      )}
    </div>
  );
}
