import type { BpmInfo } from '../types/audio';
import styles from './BpmDisplay.module.css';

interface BpmDisplayProps {
  bpmInfo: BpmInfo;
}

export function BpmDisplay({ bpmInfo }: BpmDisplayProps) {
  const { bpm, confidence } = bpmInfo;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>BPM</h2>
      <div className={styles.bpm}>
        {bpm !== null ? bpm : '--'}
      </div>
      <div className={styles.confidenceWrapper}>
        <div className={styles.confidenceBar}>
          <div
            className={styles.confidenceFill}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className={styles.confidenceLabel}>
          {confidence > 0 ? `${Math.round(confidence * 100)}% confidence` : 'Analyzing...'}
        </span>
      </div>
    </div>
  );
}
