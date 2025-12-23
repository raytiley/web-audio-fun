import { useState, useEffect, useRef } from 'react';
import { YIN } from 'pitchfinder';
import { frequencyToNote } from '../utils/noteHelpers';
import type { NoteInfo } from '../types/audio';

interface PitchDetectionResult {
  frequency: number | null;
  noteInfo: NoteInfo | null;
}

export function usePitchDetection(
  analyserNode: AnalyserNode | null,
  isActive: boolean
): PitchDetectionResult {
  const [result, setResult] = useState<PitchDetectionResult>({
    frequency: null,
    noteInfo: null,
  });

  const detectPitchRef = useRef<ReturnType<typeof YIN> | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      setResult({ frequency: null, noteInfo: null });
      return;
    }

    // Initialize pitch detector
    const sampleRate = analyserNode.context.sampleRate;
    detectPitchRef.current = YIN({ sampleRate });

    // Create buffer for audio data
    const bufferLength = analyserNode.fftSize;
    bufferRef.current = new Float32Array(bufferLength);

    const detectPitch = () => {
      if (!analyserNode || !detectPitchRef.current || !bufferRef.current) {
        return;
      }

      // Get time domain data
      analyserNode.getFloatTimeDomainData(bufferRef.current);

      // Check if there's enough signal (avoid detecting silence)
      let sum = 0;
      for (let i = 0; i < bufferRef.current.length; i++) {
        sum += bufferRef.current[i] * bufferRef.current[i];
      }
      const rms = Math.sqrt(sum / bufferRef.current.length);

      // Only detect pitch if signal is above threshold
      if (rms > 0.01) {
        const frequency = detectPitchRef.current(bufferRef.current);

        if (frequency !== null && frequency > 20 && frequency < 20000) {
          const noteInfo = frequencyToNote(frequency);
          setResult({ frequency, noteInfo });
        } else {
          setResult({ frequency: null, noteInfo: null });
        }
      } else {
        setResult({ frequency: null, noteInfo: null });
      }

      rafIdRef.current = requestAnimationFrame(detectPitch);
    };

    rafIdRef.current = requestAnimationFrame(detectPitch);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [analyserNode, isActive]);

  return result;
}
