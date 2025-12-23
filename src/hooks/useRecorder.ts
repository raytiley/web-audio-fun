import { useState, useCallback, useRef, useEffect } from 'react';
import type { RecorderState } from '../types/audio';

export function useRecorder(stream: MediaStream | null) {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    audioUrl: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setState(prev => ({
          ...prev,
          isRecording: false,
          audioUrl: url,
        }));
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      // Update duration counter
      durationIntervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setState(prev => ({
            ...prev,
            duration: Math.floor((Date.now() - startTimeRef.current!) / 1000),
          }));
        }
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
      }));
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    startTimeRef.current = null;
  }, []);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    chunksRef.current = [];
    setState({
      isRecording: false,
      audioUrl: null,
      duration: 0,
    });
  }, [state.audioUrl]);

  const downloadRecording = useCallback(() => {
    if (!state.audioUrl) return;

    const link = document.createElement('a');
    link.href = state.audioUrl;
    link.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
    downloadRecording,
  };
}
