import type { ChordInfo, ChordQuality } from '../types/audio';

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chord templates: 12-dimensional vectors representing pitch class profiles
// Index 0 = C, 1 = C#, 2 = D, etc.
export const CHORD_TEMPLATES: Record<ChordQuality, number[]> = {
  major: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], // 1-3-5 (C-E-G)
  minor: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], // 1-b3-5 (C-Eb-G)
  '7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], // 1-3-5-b7 (C-E-G-Bb)
  maj7: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], // 1-3-5-7 (C-E-G-B)
  m7: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], // 1-b3-5-b7 (C-Eb-G-Bb)
  sus2: [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0], // 1-2-5 (C-D-G)
  sus4: [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0], // 1-4-5 (C-F-G)
  dim: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], // 1-b3-b5 (C-Eb-Gb)
  aug: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // 1-3-#5 (C-E-G#)
};

// Notes in each chord type (relative to root at 0)
const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

// Display names for chord qualities
const QUALITY_DISPLAY: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  sus2: 'sus2',
  sus4: 'sus4',
  dim: 'dim',
  aug: 'aug',
};

/**
 * Rotate a template by n semitones (for different root notes)
 */
export function rotateTemplate(template: number[], semitones: number): number[] {
  const rotated = new Array(12);
  for (let i = 0; i < 12; i++) {
    rotated[(i + semitones) % 12] = template[i];
  }
  return rotated;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get the notes in a chord given root and quality
 */
function getChordNotes(root: number, quality: ChordQuality): string[] {
  const intervals = CHORD_INTERVALS[quality];
  return intervals.map((interval) => NOTE_NAMES[(root + interval) % 12]);
}

/**
 * Format chord name for display
 */
export function formatChordName(root: string, quality: ChordQuality): string {
  const qualityStr = QUALITY_DISPLAY[quality];
  return qualityStr ? `${root}${qualityStr}` : `${root} Major`;
}

/**
 * Compute chroma (pitch class profile) from FFT frequency data
 * This is a fallback if essentia.js HPCP is not available
 */
export function computeChromaFromFFT(
  frequencyData: Float32Array,
  sampleRate: number
): number[] {
  const chroma = new Array(12).fill(0);
  const binWidth = sampleRate / (frequencyData.length * 2);

  // Only analyze frequencies in musical range (65 Hz to 2000 Hz, roughly C2 to C7)
  const minBin = Math.floor(65 / binWidth);
  const maxBin = Math.min(frequencyData.length - 1, Math.floor(2000 / binWidth));

  for (let i = minBin; i <= maxBin; i++) {
    const freq = i * binWidth;
    if (freq > 0) {
      // Convert frequency to MIDI note number
      const noteNum = 12 * Math.log2(freq / 440) + 69;
      const pitchClass = Math.round(noteNum) % 12;

      // Convert from dB to linear magnitude and add to pitch class
      // frequencyData is in dB, typically -100 to 0
      const magnitude = Math.pow(10, frequencyData[i] / 20);
      chroma[pitchClass] += magnitude;
    }
  }

  // Normalize chroma vector
  const max = Math.max(...chroma);
  if (max > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= max;
    }
  }

  return chroma;
}

interface ChordMatch {
  root: number;
  quality: ChordQuality;
  similarity: number;
}

/**
 * Match a chroma vector against all chord templates
 * Returns the best matching chord info, or null if confidence is too low
 */
export function matchChord(
  chroma: number[],
  minConfidence: number = 0.7
): ChordInfo | null {
  let bestMatch: ChordMatch | null = null;

  // Try all roots (0-11) and all chord types
  for (let root = 0; root < 12; root++) {
    for (const [qualityKey, template] of Object.entries(CHORD_TEMPLATES)) {
      const quality = qualityKey as ChordQuality;
      const rotatedTemplate = rotateTemplate(template, root);
      const similarity = cosineSimilarity(chroma, rotatedTemplate);

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { root, quality, similarity };
      }
    }
  }

  if (!bestMatch || bestMatch.similarity < minConfidence) {
    return null;
  }

  const rootNote = NOTE_NAMES[bestMatch.root];
  return {
    root: rootNote,
    quality: bestMatch.quality,
    name: formatChordName(rootNote, bestMatch.quality),
    confidence: bestMatch.similarity,
    notes: getChordNotes(bestMatch.root, bestMatch.quality),
  };
}
