import { useState, useEffect, useRef, useCallback } from 'react';
import type { KeyInfo } from '../types/audio';

// Essentia types
type EssentiaInstance = {
  KeyExtractor: (signal: Float32Array) => { key: string; scale: string; strength: number };
};

// Dynamic import for Essentia
let essentiaInstance: EssentiaInstance | null = null;
let essentiaLoading: Promise<EssentiaInstance> | null = null;

async function loadEssentia(): Promise<EssentiaInstance> {
  if (essentiaInstance) {
    return essentiaInstance;
  }

  if (essentiaLoading) {
    return essentiaLoading;
  }

  essentiaLoading = (async () => {
    try {
      // Dynamic imports for essentia.js
      const [essentiaModule, wasmModule] = await Promise.all([
        import('essentia.js/dist/essentia.js-core.es.js'),
        import('essentia.js/dist/essentia-wasm.es.js'),
      ]);

      const Essentia = essentiaModule.default;
      const { EssentiaWASM } = wasmModule;

      essentiaInstance = new Essentia(EssentiaWASM) as EssentiaInstance;
      return essentiaInstance;
    } catch (err) {
      console.error('Failed to load Essentia.js:', err);
      throw err;
    }
  })();

  return essentiaLoading;
}

const BUFFER_DURATION = 3; // seconds
const ANALYSIS_INTERVAL = 2000; // ms

export function useKeyDetection(
  analyserNode: AnalyserNode | null,
  isActive: boolean
): KeyInfo & { isLoading: boolean; error: string | null } {
  const [keyInfo, setKeyInfo] = useState<KeyInfo>({
    key: '',
    scale: '',
    strength: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioBufferRef = useRef<Float32Array[]>([]);
  const intervalRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const essentiaRef = useRef<EssentiaInstance | null>(null);

  const analyzeKey = useCallback(async () => {
    if (!essentiaRef.current || audioBufferRef.current.length === 0) {
      return;
    }

    try {
      // Concatenate buffered audio
      const totalLength = audioBufferRef.current.reduce((sum, buf) => sum + buf.length, 0);
      const combinedBuffer = new Float32Array(totalLength);
      let offset = 0;
      for (const buf of audioBufferRef.current) {
        combinedBuffer.set(buf, offset);
        offset += buf.length;
      }

      // Analyze key using Essentia
      const result = essentiaRef.current.KeyExtractor(combinedBuffer);

      if (result && result.key) {
        setKeyInfo({
          key: result.key,
          scale: result.scale as 'major' | 'minor',
          strength: result.strength,
        });
      }

      // Clear buffer after analysis
      audioBufferRef.current = [];
    } catch (err) {
      console.error('Key detection error:', err);
    }
  }, []);

  useEffect(() => {
    if (!analyserNode || !isActive) {
      setKeyInfo({ key: '', scale: '', strength: 0 });
      audioBufferRef.current = [];
      return;
    }

    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        essentiaRef.current = await loadEssentia();
        if (!isMounted) return;
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setError('Failed to load audio analysis library');
        setIsLoading(false);
        return;
      }

      const sampleRate = analyserNode.context.sampleRate;
      const bufferSize = analyserNode.fftSize;
      const buffer = new Float32Array(bufferSize);
      const maxBufferFrames = Math.ceil((BUFFER_DURATION * sampleRate) / bufferSize);

      // Collect audio data
      const collectAudio = () => {
        if (!isMounted || !analyserNode) return;

        analyserNode.getFloatTimeDomainData(buffer);

        // Check for signal
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);

        if (rms > 0.01) {
          audioBufferRef.current.push(new Float32Array(buffer));

          // Keep buffer limited
          while (audioBufferRef.current.length > maxBufferFrames) {
            audioBufferRef.current.shift();
          }
        }

        rafIdRef.current = requestAnimationFrame(collectAudio);
      };

      rafIdRef.current = requestAnimationFrame(collectAudio);

      // Analyze periodically
      intervalRef.current = window.setInterval(analyzeKey, ANALYSIS_INTERVAL);
    };

    init();

    return () => {
      isMounted = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      audioBufferRef.current = [];
    };
  }, [analyserNode, isActive, analyzeKey]);

  return { ...keyInfo, isLoading, error };
}
