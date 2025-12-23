import styles from './RecordingControls.module.css';

interface RecordingControlsProps {
  isRecording: boolean;
  audioUrl: string | null;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onDownloadRecording: () => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RecordingControls({
  isRecording,
  audioUrl,
  duration,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onDownloadRecording,
  disabled = false,
}: RecordingControlsProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Recording</h2>

      <div className={styles.controls}>
        {!isRecording && !audioUrl && (
          <button
            className={styles.recordButton}
            onClick={onStartRecording}
            disabled={disabled}
          >
            <span className={styles.recordIcon} />
            Record
          </button>
        )}

        {isRecording && (
          <div className={styles.recordingActive}>
            <div className={styles.recordingIndicator}>
              <span className={styles.recordingDot} />
              Recording {formatDuration(duration)}
            </div>
            <button className={styles.stopButton} onClick={onStopRecording}>
              <span className={styles.stopIcon} />
              Stop
            </button>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className={styles.playbackSection}>
            <audio src={audioUrl} controls className={styles.audioPlayer} />
            <div className={styles.playbackActions}>
              <button
                className={styles.actionButton}
                onClick={onDownloadRecording}
              >
                Download
              </button>
              <button
                className={`${styles.actionButton} ${styles.clearButton}`}
                onClick={onClearRecording}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
