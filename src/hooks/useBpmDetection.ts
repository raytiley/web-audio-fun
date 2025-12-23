import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createRealtimeBpmAnalyzer,
  type BpmAnalyzer,
} from 'realtime-bpm-analyzer';
import type { BpmInfo } from '../types/audio';

export function useBpmDetection(
  audioContext: AudioContext | null,
  sourceNode: MediaStreamAudioSourceNode | null,
  isActive: boolean
): BpmInfo {
  const [bpmInfo, setBpmInfo] = useState<BpmInfo>({
    bpm: null,
    confidence: 0,
  });

  const analyzerRef = useRef<BpmAnalyzer | null>(null);
  const isInitializedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.disconnect();
      analyzerRef.current = null;
    }
    isInitializedRef.current = false;
    setBpmInfo({ bpm: null, confidence: 0 });
  }, []);

  useEffect(() => {
    if (!audioContext || !sourceNode || !isActive) {
      cleanup();
      return;
    }

    // Prevent double initialization
    if (isInitializedRef.current) {
      return;
    }

    let isMounted = true;

    const initBpmDetector = async () => {
      try {
        isInitializedRef.current = true;

        const bpmAnalyzer = await createRealtimeBpmAnalyzer(audioContext, {
          continuousAnalysis: true,
          stabilizationTime: 5000,
        });

        if (!isMounted) {
          bpmAnalyzer.disconnect();
          return;
        }

        analyzerRef.current = bpmAnalyzer;

        // Connect source to analyzer's node
        sourceNode.connect(bpmAnalyzer.node);

        // Listen for BPM events using the event emitter
        bpmAnalyzer.on('bpm', (data) => {
          if (!isMounted) return;

          const bpmCandidates = data.bpm;
          if (bpmCandidates && bpmCandidates.length > 0) {
            const topCandidate = bpmCandidates[0];
            setBpmInfo({
              bpm: Math.round(topCandidate.tempo),
              confidence: Math.min(topCandidate.count / 100, 1),
            });
          }
        });

        bpmAnalyzer.on('bpmStable', (data) => {
          if (!isMounted) return;

          const bpmValue = data.bpm?.[0];
          if (bpmValue) {
            setBpmInfo({
              bpm: Math.round(bpmValue.tempo),
              confidence: 1.0,
            });
          }
        });
      } catch (err) {
        console.error('Failed to initialize BPM detector:', err);
        isInitializedRef.current = false;
      }
    };

    initBpmDetector();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [audioContext, sourceNode, isActive, cleanup]);

  return bpmInfo;
}
