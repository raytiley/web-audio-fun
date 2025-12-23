import type { ChordInfo } from '../types/audio';
import styles from './ChordDisplay.module.css';

interface ChordDisplayProps {
  chord: ChordInfo | null;
}

export function ChordDisplay({ chord }: ChordDisplayProps) {
  const displayName = chord?.name || '--';
  const notes = chord?.notes || [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Chord</h2>
      <div className={styles.chord}>{displayName}</div>
      {chord && (
        <>
          <div className={styles.notes}>{notes.join(' - ')}</div>
          <div className={styles.confidenceWrapper}>
            <div className={styles.confidenceBar}>
              <div
                className={styles.confidenceFill}
                style={{ width: `${chord.confidence * 100}%` }}
              />
            </div>
            <span className={styles.confidenceLabel}>
              {Math.round(chord.confidence * 100)}% match
            </span>
          </div>
        </>
      )}
    </div>
  );
}
