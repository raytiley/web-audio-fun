/**
 * Essentia.js Helper Utilities
 *
 * Essentia.js uses WebAssembly (WASM) bindings to C++ code. The WASM layer
 * requires specific data types that differ from JavaScript types.
 *
 * IMPORTANT: Essentia algorithms expect VectorFloat (WASM std::vector<float>),
 * NOT JavaScript Float32Array. Passing a Float32Array directly will cause:
 *   BindingError: Cannot pass "..." as a VectorFloat
 *
 * Solution: Always use essentia.arrayToVector() to convert Float32Array
 * before passing to Essentia algorithms.
 */

/**
 * Type representing the Essentia instance with required methods for key detection.
 * The `arrayToVector` method is REQUIRED for converting Float32Array to VectorFloat.
 */
export interface EssentiaLike {
  arrayToVector: (array: Float32Array) => unknown;
  KeyExtractor: (signal: unknown) => { key: string; scale: string; strength: number };
}

/**
 * Safely extracts key information from audio data using Essentia.
 *
 * This helper ensures the Float32Array is properly converted to VectorFloat
 * before being passed to KeyExtractor, preventing BindingError.
 *
 * @param essentia - The Essentia instance
 * @param audioData - Float32Array of audio samples
 * @returns Key detection result
 *
 * @example
 * const result = extractKeyFromAudio(essentiaInstance, audioBuffer);
 * console.log(result.key, result.scale); // "A", "minor"
 */
export function extractKeyFromAudio(
  essentia: EssentiaLike,
  audioData: Float32Array
): { key: string; scale: string; strength: number } {
  // CRITICAL: Convert Float32Array to VectorFloat for WASM compatibility
  const vectorData = essentia.arrayToVector(audioData);
  return essentia.KeyExtractor(vectorData);
}

/**
 * Validates that an object has the required Essentia methods for key detection.
 * Use this to verify Essentia is properly loaded before attempting detection.
 *
 * @param obj - Object to check
 * @returns true if the object has required Essentia methods
 */
export function isValidEssentiaInstance(obj: unknown): obj is EssentiaLike {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const essentia = obj as Record<string, unknown>;
  return (
    typeof essentia.arrayToVector === 'function' &&
    typeof essentia.KeyExtractor === 'function'
  );
}
