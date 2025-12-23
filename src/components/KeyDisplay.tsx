import type { KeyInfo } from '../types/audio';
import styles from './KeyDisplay.module.css';

interface KeyDisplayProps {
  keyInfo: KeyInfo;
  isLoading: boolean;
  error: string | null;
}

export function KeyDisplay({ keyInfo, isLoading, error }: KeyDisplayProps) {
  const { key, scale, strength } = keyInfo;

  const displayKey = key && scale ? `${key} ${scale}` : '--';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Key</h2>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : isLoading ? (
        <div className={styles.loading}>
          <span className={styles.spinner} />
          Loading...
        </div>
      ) : (
        <>
          <div className={styles.key}>{displayKey}</div>
          {key && (
            <div className={styles.strengthWrapper}>
              <div className={styles.strengthBar}>
                <div
                  className={styles.strengthFill}
                  style={{ width: `${strength * 100}%` }}
                />
              </div>
              <span className={styles.strengthLabel}>
                {Math.round(strength * 100)}% strength
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
