import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChordInfo } from '../types/audio';
import { computeChromaFromFFT, matchChord } from '../utils/chordHelpers';

interface ChordDetectionResult {
  chord: ChordInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Configuration
const ANALYSIS_INTERVAL_MS = 150; // Faster than key detection for responsiveness
const MIN_CONFIDENCE = 0.6; // Minimum similarity for valid chord
const STABILITY_FRAMES = 2; // Require consecutive frames for stability
const RMS_THRESHOLD = 0.005; // Same as pitch detection

export function useChordDetection(
  analyserNode: AnalyserNode | null,
  isActive: boolean
): ChordDetectionResult {
  const [result, setResult] = useState<ChordDetectionResult>({
    chord: null,
    isLoading: false,
    error: null,
  });

  const frequencyDataRef = useRef<Float32Array | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Stability tracking
  const lastChordRef = useRef<string | null>(null);
  const chordStabilityCountRef = useRef<number>(0);

  const analyzeChord = useCallback(() => {
    if (!analyserNode || !frequencyDataRef.current || !timeDataRef.current) {
      return;
    }

    // Get time domain data for RMS calculation
    analyserNode.getFloatTimeDomainData(timeDataRef.current);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < timeDataRef.current.length; i++) {
      sum += timeDataRef.current[i] * timeDataRef.current[i];
    }
    const rms = Math.sqrt(sum / timeDataRef.current.length);

    // Only analyze if signal is strong enough
    if (rms <= RMS_THRESHOLD) {
      // Reset stability if no signal
      if (lastChordRef.current !== null) {
        chordStabilityCountRef.current = 0;
        lastChordRef.current = null;
        setResult((prev) => ({ ...prev, chord: null }));
      }
      return;
    }

    // Get frequency data for chroma analysis
    analyserNode.getFloatFrequencyData(frequencyDataRef.current);

    // Compute chroma from FFT
    const sampleRate = analyserNode.context.sampleRate;
    const chroma = computeChromaFromFFT(frequencyDataRef.current, sampleRate);

    // Match against chord templates
    const detectedChord = matchChord(chroma, MIN_CONFIDENCE);

    if (detectedChord) {
      const currentChordName = detectedChord.name;

      // Stability check
      if (currentChordName === lastChordRef.current) {
        chordStabilityCountRef.current++;
      } else {
        chordStabilityCountRef.current = 1;
        lastChordRef.current = currentChordName;
      }

      // Only update if chord is stable
      if (chordStabilityCountRef.current >= STABILITY_FRAMES) {
        setResult((prev) => ({ ...prev, chord: detectedChord }));
      }
    } else {
      // No confident match
      chordStabilityCountRef.current = 0;
      lastChordRef.current = null;
      setResult((prev) => ({ ...prev, chord: null }));
    }
  }, [analyserNode]);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      setResult({ chord: null, isLoading: false, error: null });
      lastChordRef.current = null;
      chordStabilityCountRef.current = 0;
      return;
    }

    // Initialize buffers
    const bufferLength = analyserNode.frequencyBinCount;
    frequencyDataRef.current = new Float32Array(bufferLength);
    timeDataRef.current = new Float32Array(analyserNode.fftSize);

    // Start periodic analysis
    intervalRef.current = window.setInterval(analyzeChord, ANALYSIS_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      frequencyDataRef.current = null;
      timeDataRef.current = null;
    };
  }, [analyserNode, isActive, analyzeChord]);

  return result;
}
