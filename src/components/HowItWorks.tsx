import styles from './HowItWorks.module.css';

export function HowItWorks() {
  return (
    <div className={styles.container}>
      <section className={styles.intro}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.introText}>
          This app uses modern browser APIs to analyze audio from your microphone in real-time.
          No audio leaves your device—all processing happens locally in your browser.
        </p>
      </section>

      <div className={styles.cards}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Web Audio API</h3>
          <p className={styles.cardText}>
            The <strong>Web Audio API</strong> provides a powerful system for controlling audio
            in the browser. This app uses:
          </p>
          <ul className={styles.list}>
            <li>
              <code>getUserMedia()</code> — Accesses the microphone with permission
            </li>
            <li>
              <code>AudioContext</code> — Creates the audio processing graph
            </li>
            <li>
              <code>AnalyserNode</code> — Extracts frequency and time-domain data from the audio stream
            </li>
            <li>
              <code>MediaRecorder</code> — Records audio to WebM/Opus format for playback and download
            </li>
          </ul>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Pitch Detection</h3>
          <p className={styles.cardText}>
            Note detection uses the <strong>YIN algorithm</strong>, a widely-used autocorrelation-based
            pitch detection method developed at IRCAM.
          </p>
          <ul className={styles.list}>
            <li>
              <strong>How it works:</strong> Compares the audio waveform against shifted versions
              of itself to find the fundamental frequency
            </li>
            <li>
              <strong>Frequency → Note:</strong> Converts Hz to musical notes using A440 tuning
              (A4 = 440 Hz) and calculates cents offset for tuning accuracy
            </li>
            <li>
              <strong>Smoothing:</strong> Uses exponential moving average and note hysteresis
              to reduce flickering
            </li>
          </ul>
          <p className={styles.library}>
            Library: <a href="https://github.com/peterkhayes/pitchfinder" target="_blank" rel="noopener noreferrer">pitchfinder</a>
          </p>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>BPM Detection</h3>
          <p className={styles.cardText}>
            Tempo analysis identifies the <strong>beats per minute</strong> by analyzing
            rhythmic patterns in the audio.
          </p>
          <ul className={styles.list}>
            <li>
              <strong>Energy analysis:</strong> Detects sudden increases in audio energy (transients)
            </li>
            <li>
              <strong>Peak detection:</strong> Identifies beat onsets in the energy curve
            </li>
            <li>
              <strong>Interval analysis:</strong> Calculates time between beats to estimate tempo
            </li>
            <li>
              <strong>Confidence:</strong> Stabilizes over time as more beats are detected
            </li>
          </ul>
          <p className={styles.library}>
            Library: <a href="https://github.com/dlepaux/realtime-bpm-analyzer" target="_blank" rel="noopener noreferrer">realtime-bpm-analyzer</a>
          </p>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Key Detection</h3>
          <p className={styles.cardText}>
            Musical key detection uses <strong>essentia.js</strong>, a WebAssembly port of the
            Essentia C++ audio analysis library developed by the Music Technology Group at UPF.
          </p>
          <ul className={styles.list}>
            <li>
              <strong>FFT → Chromagram:</strong> Transforms audio into a 12-bin pitch class profile
              (C, C#, D, ... B)
            </li>
            <li>
              <strong>Key profiles:</strong> Compares the chromagram against templates for major
              and minor keys (Krumhansl-Schmuckler algorithm)
            </li>
            <li>
              <strong>WASM:</strong> Runs compiled C++ code in the browser at near-native speed
              (~2.5MB module)
            </li>
          </ul>
          <p className={styles.library}>
            Library: <a href="https://mtg.github.io/essentia.js/" target="_blank" rel="noopener noreferrer">essentia.js</a>
          </p>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Architecture</h3>
          <p className={styles.cardText}>
            The app is built with <strong>React 18 + TypeScript + Vite</strong> and follows
            a hooks-based architecture:
          </p>
          <ul className={styles.list}>
            <li>
              <code>useAudioInput</code> — Manages microphone access and AudioContext lifecycle
            </li>
            <li>
              <code>usePitchDetection</code> — Runs YIN algorithm on each animation frame
            </li>
            <li>
              <code>useBpmDetection</code> — Connects to realtime-bpm-analyzer events
            </li>
            <li>
              <code>useKeyDetection</code> — Buffers audio and analyzes periodically with essentia.js
            </li>
            <li>
              <code>useRecorder</code> — Wraps MediaRecorder for recording/playback
            </li>
          </ul>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Privacy</h3>
          <p className={styles.cardText}>
            Your audio data stays on your device:
          </p>
          <ul className={styles.list}>
            <li>No audio is sent to any server</li>
            <li>All analysis runs in your browser using JavaScript and WebAssembly</li>
            <li>Recordings are stored only in browser memory until you navigate away</li>
            <li>Source code is open and auditable</li>
          </ul>
        </article>
      </div>
    </div>
  );
}
