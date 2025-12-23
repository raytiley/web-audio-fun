import { describe, it, expect, vi } from 'vitest';
import {
  extractKeyFromAudio,
  isValidEssentiaInstance,
  EssentiaLike,
} from './essentiaHelpers';

describe('extractKeyFromAudio', () => {
  it('calls arrayToVector before KeyExtractor', () => {
    // This test ensures the critical conversion step is not skipped
    const mockVector = { _isVector: true };
    const mockArrayToVector = vi.fn().mockReturnValue(mockVector);
    const mockKeyExtractor = vi.fn().mockReturnValue({
      key: 'A',
      scale: 'minor',
      strength: 0.85,
    });

    const mockEssentia: EssentiaLike = {
      arrayToVector: mockArrayToVector,
      KeyExtractor: mockKeyExtractor,
    };

    const audioData = new Float32Array([0.1, -0.2, 0.3, -0.4]);
    const result = extractKeyFromAudio(mockEssentia, audioData);

    // Verify arrayToVector was called with the Float32Array
    expect(mockArrayToVector).toHaveBeenCalledTimes(1);
    expect(mockArrayToVector).toHaveBeenCalledWith(audioData);

    // Verify KeyExtractor was called with the VECTOR (not the Float32Array!)
    expect(mockKeyExtractor).toHaveBeenCalledTimes(1);
    expect(mockKeyExtractor).toHaveBeenCalledWith(mockVector);

    // Verify the result is returned correctly
    expect(result).toEqual({
      key: 'A',
      scale: 'minor',
      strength: 0.85,
    });
  });

  it('does NOT pass Float32Array directly to KeyExtractor', () => {
    // This is a regression test - if someone removes the arrayToVector call,
    // this test will fail
    const mockVector = Symbol('vector');
    const mockArrayToVector = vi.fn().mockReturnValue(mockVector);
    const mockKeyExtractor = vi.fn().mockReturnValue({
      key: 'C',
      scale: 'major',
      strength: 0.9,
    });

    const mockEssentia: EssentiaLike = {
      arrayToVector: mockArrayToVector,
      KeyExtractor: mockKeyExtractor,
    };

    const audioData = new Float32Array(1024);
    extractKeyFromAudio(mockEssentia, audioData);

    // The argument to KeyExtractor should NOT be the original Float32Array
    const keyExtractorArg = mockKeyExtractor.mock.calls[0][0];
    expect(keyExtractorArg).not.toBe(audioData);
    expect(keyExtractorArg).toBe(mockVector);
  });

  it('handles empty Float32Array', () => {
    const mockArrayToVector = vi.fn().mockReturnValue({});
    const mockKeyExtractor = vi.fn().mockReturnValue({
      key: '',
      scale: '',
      strength: 0,
    });

    const mockEssentia: EssentiaLike = {
      arrayToVector: mockArrayToVector,
      KeyExtractor: mockKeyExtractor,
    };

    const result = extractKeyFromAudio(mockEssentia, new Float32Array(0));
    expect(mockArrayToVector).toHaveBeenCalled();
    expect(result.key).toBe('');
  });
});

describe('isValidEssentiaInstance', () => {
  it('returns true for valid Essentia-like object', () => {
    const validEssentia = {
      arrayToVector: () => ({}),
      KeyExtractor: () => ({ key: 'C', scale: 'major', strength: 0.8 }),
    };
    expect(isValidEssentiaInstance(validEssentia)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidEssentiaInstance(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidEssentiaInstance(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidEssentiaInstance('string')).toBe(false);
    expect(isValidEssentiaInstance(123)).toBe(false);
    expect(isValidEssentiaInstance(true)).toBe(false);
  });

  it('returns false if arrayToVector is missing', () => {
    const incomplete = {
      KeyExtractor: () => ({ key: 'C', scale: 'major', strength: 0.8 }),
    };
    expect(isValidEssentiaInstance(incomplete)).toBe(false);
  });

  it('returns false if KeyExtractor is missing', () => {
    const incomplete = {
      arrayToVector: () => ({}),
    };
    expect(isValidEssentiaInstance(incomplete)).toBe(false);
  });

  it('returns false if arrayToVector is not a function', () => {
    const invalid = {
      arrayToVector: 'not a function',
      KeyExtractor: () => ({ key: 'C', scale: 'major', strength: 0.8 }),
    };
    expect(isValidEssentiaInstance(invalid)).toBe(false);
  });

  it('returns false if KeyExtractor is not a function', () => {
    const invalid = {
      arrayToVector: () => ({}),
      KeyExtractor: null,
    };
    expect(isValidEssentiaInstance(invalid)).toBe(false);
  });
});
