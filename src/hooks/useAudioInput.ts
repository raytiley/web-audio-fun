import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioInputState } from '../types/audio';

const ANALYSER_FFT_SIZE = 2048;

export function useAudioInput() {
  const [state, setState] = useState<AudioInputState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    audioContext: null,
    analyserNode: null,
    sourceNode: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

      // Create source from stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyserNode);

      // Store refs for cleanup
      audioContextRef.current = audioContext;
      streamRef.current = stream;

      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream,
        audioContext,
        analyserNode,
        sourceNode,
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

    setState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null,
      audioContext: null,
      analyserNode: null,
      sourceNode: null,
    });
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
  };
}
