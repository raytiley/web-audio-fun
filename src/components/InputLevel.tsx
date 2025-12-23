import { useEffect, useRef, useState } from 'react';
import styles from './InputLevel.module.css';

interface InputLevelProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

const RMS_THRESHOLD = 0.005;
const UPDATE_INTERVAL_MS = 50;

export function InputLevel({ analyserNode, isActive }: InputLevelProps) {
  const [level, setLevel] = useState(0);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      setLevel(0);
      return;
    }

    const bufferLength = analyserNode.fftSize;
    bufferRef.current = new Float32Array(bufferLength);

    const updateLevel = () => {
      if (!analyserNode || !bufferRef.current) return;

      const now = performance.now();
      if (now - lastUpdateRef.current >= UPDATE_INTERVAL_MS) {
        analyserNode.getFloatTimeDomainData(bufferRef.current);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < bufferRef.current.length; i++) {
          sum += bufferRef.current[i] * bufferRef.current[i];
        }
        const rms = Math.sqrt(sum / bufferRef.current.length);

        // Scale RMS to a 0-100 percentage (capped at 0.3 RMS for full scale)
        const scaledLevel = Math.min(100, (rms / 0.3) * 100);
        setLevel(scaledLevel);
        lastUpdateRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(updateLevel);
    };

    rafIdRef.current = requestAnimationFrame(updateLevel);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [analyserNode, isActive]);

  // Calculate threshold position as percentage (0.005 / 0.3 * 100)
  const thresholdPosition = (RMS_THRESHOLD / 0.3) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        <span className={styles.title}>Input Level</span>
        <span className={styles.status}>
          {level > thresholdPosition ? 'Detecting' : 'Too quiet'}
        </span>
      </div>
      <div className={styles.meterWrapper}>
        <div className={styles.meter}>
          <div
            className={`${styles.fill} ${level > thresholdPosition ? styles.active : ''}`}
            style={{ width: `${level}%` }}
          />
          <div
            className={styles.threshold}
            style={{ left: `${thresholdPosition}%` }}
          />
        </div>
      </div>
    </div>
  );
}
