import type { NoteInfo } from '../types/audio';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQUENCY = 440;
const A4_MIDI = 69;

/**
 * Convert a frequency in Hz to note information
 */
export function frequencyToNote(frequency: number): NoteInfo | null {
  if (!frequency || frequency <= 0 || !isFinite(frequency)) {
    return null;
  }

  // Calculate the number of semitones from A4
  const semitonesFromA4 = 12 * Math.log2(frequency / A4_FREQUENCY);
  const midiNote = Math.round(A4_MIDI + semitonesFromA4);

  // Calculate cents offset (how far from the exact note)
  const exactMidi = A4_MIDI + semitonesFromA4;
  const cents = Math.round((exactMidi - midiNote) * 100);

  // Get note name and octave
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTE_NAMES[noteIndex];

  return {
    note,
    octave,
    cents,
    frequency,
  };
}

/**
 * Format note info as a display string (e.g., "A4")
 */
export function formatNote(info: NoteInfo | null): string {
  if (!info) return '--';
  return `${info.note}${info.octave}`;
}

/**
 * Format cents as a tuning indicator
 */
export function formatCents(cents: number): string {
  if (cents === 0) return '♪';
  if (cents > 0) return `+${cents}¢`;
  return `${cents}¢`;
}

/**
 * Get a color based on how in-tune the note is
 */
export function getCentsColor(cents: number): string {
  const absCents = Math.abs(cents);
  if (absCents <= 5) return '#4ade80'; // green - in tune
  if (absCents <= 15) return '#fbbf24'; // yellow - close
  return '#f87171'; // red - out of tune
}
