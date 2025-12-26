import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioInputState } from '../types/audio';

const ANALYSER_FFT_SIZE = 4096;

export function useAudioInput() {
  const [state, setState] = useState<AudioInputState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    audioContext: null,
    analyserNode: null,
    sourceNode: null,
    gainNode: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const start = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context
      const audioContext = new AudioContext();

      // Create analyser node
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = ANALYSER_FFT_SIZE;
      analyserNode.smoothingTimeConstant = 0.8;

      // Create gain node for sensitivity control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0; // Default gain

      // Create source from stream
      const sourceNode = audioContext.createMediaStreamSource(stream);

      // Connect: source → gain → analyser
      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);

      // Store refs for cleanup
      audioContextRef.current = audioContext;
      streamRef.current = stream;
      gainNodeRef.current = gainNode;

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream,
        audioContext,
        analyserNode,
        sourceNode,
        gainNode,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const stop = useCallback(() => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    gainNodeRef.current = null;

    setState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null,
      audioContext: null,
      analyserNode: null,
      sourceNode: null,
      gainNode: null,
    });
  }, []);

  const setGain = useCallback((value: number) => {
    if (gainNodeRef.current) {
      // Clamp value between 0.5 and 5.0
      const clampedValue = Math.max(0.5, Math.min(5.0, value));
      gainNodeRef.current.gain.value = clampedValue;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    start,
    stop,
    setGain,
  };
}
