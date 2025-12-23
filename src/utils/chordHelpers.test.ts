import { describe, it, expect } from 'vitest';
import {
  rotateTemplate,
  cosineSimilarity,
  matchChord,
  computeChromaFromFFT,
  formatChordName,
  CHORD_TEMPLATES,
} from './chordHelpers';

describe('rotateTemplate', () => {
  it('returns the same template when rotated by 0', () => {
    const template = CHORD_TEMPLATES.major;
    const rotated = rotateTemplate(template, 0);
    expect(rotated).toEqual(template);
  });

  it('rotates C major to D major (2 semitones)', () => {
    // C major: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
    // D major should have 1s at positions 2, 6, 9
    const rotated = rotateTemplate(CHORD_TEMPLATES.major, 2);
    expect(rotated[2]).toBe(1); // D
    expect(rotated[6]).toBe(1); // F#
    expect(rotated[9]).toBe(1); // A
  });

  it('rotates C major to G major (7 semitones)', () => {
    // G major should have 1s at positions 7, 11, 2
    const rotated = rotateTemplate(CHORD_TEMPLATES.major, 7);
    expect(rotated[7]).toBe(1); // G
    expect(rotated[11]).toBe(1); // B
    expect(rotated[2]).toBe(1); // D
  });

  it('handles rotation by 12 (full octave)', () => {
    const template = CHORD_TEMPLATES.minor;
    const rotated = rotateTemplate(template, 12);
    expect(rotated).toEqual(template);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const vec = [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const vec1 = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const vec2 = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0, 5);
  });

  it('returns 0 for zero vectors', () => {
    const zero = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const vec = [1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    expect(cosineSimilarity(zero, vec)).toBe(0);
    expect(cosineSimilarity(vec, zero)).toBe(0);
    expect(cosineSimilarity(zero, zero)).toBe(0);
  });

  it('returns correct value for similar vectors', () => {
    const vec1 = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]; // C major
    const vec2 = [0.9, 0.1, 0.1, 0.1, 0.8, 0.1, 0.1, 0.9, 0.1, 0.1, 0.1, 0.1]; // Noisy C major
    const similarity = cosineSimilarity(vec1, vec2);
    expect(similarity).toBeGreaterThan(0.8);
    expect(similarity).toBeLessThan(1);
  });
});

describe('matchChord', () => {
  it('identifies C major chord from perfect chroma', () => {
    // Perfect C major chroma
    const chroma = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    const result = matchChord(chroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('C');
    expect(result!.quality).toBe('major');
    expect(result!.name).toBe('C Major');
  });

  it('identifies A minor chord from perfect chroma', () => {
    // A minor: A-C-E (positions 9, 0, 4)
    const chroma = [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0];
    const result = matchChord(chroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('A');
    expect(result!.quality).toBe('minor');
    expect(result!.name).toBe('Am');
  });

  it('identifies G major chord', () => {
    // G major: G-B-D (positions 7, 11, 2)
    const chroma = [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = matchChord(chroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('G');
    expect(result!.quality).toBe('major');
  });

  it('identifies E minor chord', () => {
    // E minor: E-G-B (positions 4, 7, 11)
    const chroma = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1];
    const result = matchChord(chroma);
    expect(result).not.toBeNull();
    expect(result!.root).toBe('E');
    expect(result!.quality).toBe('minor');
  });

  it('returns null for low confidence', () => {
    // Random noise - should not match any chord with high confidence
    const chroma = [0.5, 0.4, 0.6, 0.5, 0.4, 0.5, 0.6, 0.4, 0.5, 0.6, 0.4, 0.5];
    const result = matchChord(chroma, 0.9); // High threshold
    expect(result).toBeNull();
  });

  it('returns null for all-zero chroma', () => {
    const chroma = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const result = matchChord(chroma);
    expect(result).toBeNull();
  });

  it('includes correct notes in chord info', () => {
    const chroma = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0];
    const result = matchChord(chroma);
    expect(result).not.toBeNull();
    expect(result!.notes).toContain('C');
    expect(result!.notes).toContain('E');
    expect(result!.notes).toContain('G');
  });
});

describe('computeChromaFromFFT', () => {
  it('returns 12-element array', () => {
    const fftData = new Float32Array(1024).fill(-60);
    const result = computeChromaFromFFT(fftData, 44100);
    expect(result).toHaveLength(12);
  });

  it('returns normalized values between 0 and 1', () => {
    // Create FFT data with some signal
    const fftData = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      fftData[i] = -60 + Math.random() * 40;
    }
    const result = computeChromaFromFFT(fftData, 44100);

    result.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it('handles uniform FFT data', () => {
    // Uniform FFT data should still produce valid 12-element normalized output
    const fftData = new Float32Array(1024).fill(-100);
    const result = computeChromaFromFFT(fftData, 44100);

    // Should still return valid 12-element array
    expect(result).toHaveLength(12);
    // All values should still be between 0 and 1 (normalized)
    result.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
});

describe('formatChordName', () => {
  it('formats major chord with "Major" suffix', () => {
    expect(formatChordName('C', 'major')).toBe('C Major');
    expect(formatChordName('G', 'major')).toBe('G Major');
  });

  it('formats minor chord with "m" suffix', () => {
    expect(formatChordName('A', 'minor')).toBe('Am');
    expect(formatChordName('E', 'minor')).toBe('Em');
  });

  it('formats seventh chord with "7" suffix', () => {
    expect(formatChordName('G', '7')).toBe('G7');
    expect(formatChordName('D', '7')).toBe('D7');
  });

  it('formats maj7 chord correctly', () => {
    expect(formatChordName('C', 'maj7')).toBe('Cmaj7');
  });

  it('formats m7 chord correctly', () => {
    expect(formatChordName('A', 'm7')).toBe('Am7');
  });

  it('formats sus2 chord correctly', () => {
    expect(formatChordName('D', 'sus2')).toBe('Dsus2');
  });

  it('formats sus4 chord correctly', () => {
    expect(formatChordName('A', 'sus4')).toBe('Asus4');
  });

  it('formats diminished chord correctly', () => {
    expect(formatChordName('B', 'dim')).toBe('Bdim');
  });

  it('formats augmented chord correctly', () => {
    expect(formatChordName('C', 'aug')).toBe('Caug');
  });
});
