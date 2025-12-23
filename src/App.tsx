import { useAudioInput } from './hooks/useAudioInput';
import { usePitchDetection } from './hooks/usePitchDetection';
import { useBpmDetection } from './hooks/useBpmDetection';
import { useKeyDetection } from './hooks/useKeyDetection';
import { useRecorder } from './hooks/useRecorder';
import { useDetectionHistory } from './hooks/useDetectionHistory';

import { StartButton } from './components/StartButton';
import { AudioVisualizer } from './components/AudioVisualizer';
import { NoteDisplay } from './components/NoteDisplay';
import { BpmDisplay } from './components/BpmDisplay';
import { KeyDisplay } from './components/KeyDisplay';
import { RecordingControls } from './components/RecordingControls';
import { HistoryPanel } from './components/HistoryPanel';

import styles from './App.module.css';

function App() {
  // Audio input
  const {
    isActive,
    isLoading,
    error,
    stream,
    audioContext,
    analyserNode,
    sourceNode,
    start,
    stop,
  } = useAudioInput();

  // Detection hooks
  const { frequency, noteInfo } = usePitchDetection(analyserNode, isActive);
  const bpmInfo = useBpmDetection(audioContext, sourceNode, isActive);
  const keyInfo = useKeyDetection(analyserNode, isActive);

  // Recording
  const recorder = useRecorder(stream);

  // History
  const { history, clearHistory } = useDetectionHistory(
    noteInfo,
    bpmInfo.bpm,
    keyInfo,
    isActive
  );

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Web Audio Fun</h1>
        <p className={styles.subtitle}>
          Real-time audio analysis in the browser
        </p>
      </header>

      <main className={styles.main}>
        <section className={styles.controls}>
          <StartButton
            isActive={isActive}
            isLoading={isLoading}
            error={error}
            onStart={start}
            onStop={stop}
          />
        </section>

        {isActive && (
          <>
            <section className={styles.visualizer}>
              <AudioVisualizer analyserNode={analyserNode} isActive={isActive} />
            </section>

            <section className={styles.detectors}>
              <NoteDisplay noteInfo={noteInfo} frequency={frequency} />
              <BpmDisplay bpmInfo={bpmInfo} />
              <KeyDisplay
                keyInfo={keyInfo}
                isLoading={keyInfo.isLoading}
                error={keyInfo.error}
              />
            </section>

            <section className={styles.extras}>
              <RecordingControls
                isRecording={recorder.isRecording}
                audioUrl={recorder.audioUrl}
                duration={recorder.duration}
                onStartRecording={recorder.startRecording}
                onStopRecording={recorder.stopRecording}
                onClearRecording={recorder.clearRecording}
                onDownloadRecording={recorder.downloadRecording}
              />
              <HistoryPanel history={history} onClear={clearHistory} />
            </section>
          </>
        )}

        {!isActive && !isLoading && (
          <section className={styles.instructions}>
            <p>Click "Start Listening" to begin audio analysis.</p>
            <p className={styles.note}>
              Requires microphone permission. Works best in Chrome or Firefox.
            </p>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Built with React + Web Audio API •{' '}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Source
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
