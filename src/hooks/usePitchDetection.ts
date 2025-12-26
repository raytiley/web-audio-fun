import { useState, useEffect, useRef } from 'react';
import { Macleod } from 'pitchfinder';
import { frequencyToNote } from '../utils/noteHelpers';
import type { NoteInfo } from '../types/audio';

interface PitchDetectionResult {
  frequency: number | null;
  noteInfo: NoteInfo | null;
}

// Smoothing configuration
const EMA_ALPHA = 0.2; // Weight for new frequency (0.2 new, 0.8 old) - slower for stability
const NOTE_STABILITY_FRAMES = 4; // Require 4 consecutive frames of same note
const UPDATE_INTERVAL_MS = 100; // Minimum 100ms between state updates (~10/sec)
const MIN_PITCH_PROBABILITY = 0.8; // Reject low-confidence detections

export function usePitchDetection(
  analyserNode: AnalyserNode | null,
  isActive: boolean
): PitchDetectionResult {
  const [result, setResult] = useState<PitchDetectionResult>({
    frequency: null,
    noteInfo: null,
  });

  const detectPitchRef = useRef<ReturnType<typeof Macleod> | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Smoothing state refs
  const smoothedFrequencyRef = useRef<number | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const noteConsecutiveCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      setResult({ frequency: null, noteInfo: null });
      // Reset smoothing state
      smoothedFrequencyRef.current = null;
      lastNoteRef.current = null;
      noteConsecutiveCountRef.current = 0;
      lastUpdateTimeRef.current = 0;
      return;
    }

    // Initialize pitch detector with McLeod (MPM) algorithm
    const sampleRate = analyserNode.context.sampleRate;
    const bufferLength = analyserNode.fftSize;
    detectPitchRef.current = Macleod({
      sampleRate,
      bufferSize: bufferLength,
      cutoff: 0.93, // Tartini default - prefer fundamental over harmonics
    });

    // Create buffer for audio data
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

      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Only detect pitch if signal is above threshold
      if (rms > 0.005) {
        const result = detectPitchRef.current(bufferRef.current);
        const rawFrequency = result.freq;
        const probability = result.probability;

        // Filter by probability and guitar+voice frequency range (70Hz to 2000Hz)
        if (rawFrequency > 0 && rawFrequency > 70 && rawFrequency < 2000 && probability > MIN_PITCH_PROBABILITY) {
          // Apply Exponential Moving Average to smooth frequency
          if (smoothedFrequencyRef.current === null) {
            smoothedFrequencyRef.current = rawFrequency;
          } else {
            smoothedFrequencyRef.current =
              smoothedFrequencyRef.current * (1 - EMA_ALPHA) +
              rawFrequency * EMA_ALPHA;
          }

          const noteInfo = frequencyToNote(smoothedFrequencyRef.current);
          if (!noteInfo) {
            // frequencyToNote returned null, skip this frame
            rafIdRef.current = requestAnimationFrame(detectPitch);
            return;
          }
          const currentNote = noteInfo.note + noteInfo.octave;

          // Note hysteresis: track consecutive frames of same note
          if (currentNote === lastNoteRef.current) {
            noteConsecutiveCountRef.current++;
          } else {
            noteConsecutiveCountRef.current = 1;
            lastNoteRef.current = currentNote;
          }

          // Only update state if:
          // 1. Enough time has passed since last update
          // 2. Note has been stable for enough frames
          if (
            timeSinceLastUpdate >= UPDATE_INTERVAL_MS &&
            noteConsecutiveCountRef.current >= NOTE_STABILITY_FRAMES
          ) {
            setResult({ frequency: smoothedFrequencyRef.current, noteInfo });
            lastUpdateTimeRef.current = now;
          }
        } else {
          // No valid frequency detected
          if (timeSinceLastUpdate >= UPDATE_INTERVAL_MS) {
            setResult({ frequency: null, noteInfo: null });
            lastUpdateTimeRef.current = now;
            smoothedFrequencyRef.current = null;
            lastNoteRef.current = null;
            noteConsecutiveCountRef.current = 0;
          }
        }
      } else {
        // Signal too weak
        if (timeSinceLastUpdate >= UPDATE_INTERVAL_MS) {
          setResult({ frequency: null, noteInfo: null });
          lastUpdateTimeRef.current = now;
          smoothedFrequencyRef.current = null;
          lastNoteRef.current = null;
          noteConsecutiveCountRef.current = 0;
        }
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
