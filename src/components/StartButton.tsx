import styles from './StartButton.module.css';

interface StartButtonProps {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function StartButton({
  isActive,
  isLoading,
  error,
  onStart,
  onStop,
}: StartButtonProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${isActive ? styles.active : ''}`}
        onClick={isActive ? onStop : onStart}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className={styles.spinner} />
        ) : isActive ? (
          <>
            <span className={styles.stopIcon} />
            Stop
          </>
        ) : (
          <>
            <span className={styles.micIcon} />
            Start Listening
          </>
        )}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
