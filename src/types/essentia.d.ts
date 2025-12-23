declare module 'essentia.js/dist/essentia.js-core.es.js' {
  interface EssentiaInstance {
    KeyExtractor(
      signal: Float32Array,
      sampleRate?: number,
      frameSize?: number,
      hopSize?: number,
      hpcpSize?: number,
      maxFrequency?: number,
      maxNumPeaks?: number,
      minFrequency?: number,
      numHarmonics?: number,
      profileType?: string,
      spectralPeaksThreshold?: number,
      tuningFrequency?: number,
      weightType?: string,
      windowType?: string
    ): { key: string; scale: string; strength: number };
    arrayToVector(array: Float32Array): unknown;
    vectorToArray(vector: unknown): Float32Array;
  }

  class Essentia implements EssentiaInstance {
    constructor(wasmModule: unknown);
    KeyExtractor(
      signal: Float32Array,
      sampleRate?: number,
      frameSize?: number,
      hopSize?: number,
      hpcpSize?: number,
      maxFrequency?: number,
      maxNumPeaks?: number,
      minFrequency?: number,
      numHarmonics?: number,
      profileType?: string,
      spectralPeaksThreshold?: number,
      tuningFrequency?: number,
      weightType?: string,
      windowType?: string
    ): { key: string; scale: string; strength: number };
    arrayToVector(array: Float32Array): unknown;
    vectorToArray(vector: unknown): Float32Array;
  }

  export default Essentia;
}

declare module 'essentia.js/dist/essentia-wasm.es.js' {
  export const EssentiaWASM: unknown;
}
