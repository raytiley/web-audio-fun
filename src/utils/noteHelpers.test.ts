import { describe, it, expect } from 'vitest';
import { frequencyToNote, formatNote, formatCents, getCentsColor } from './noteHelpers';

describe('frequencyToNote', () => {
  it('converts A4 (440 Hz) correctly', () => {
    const result = frequencyToNote(440);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('A');
    expect(result!.octave).toBe(4);
    expect(result!.cents).toBe(0);
  });

  it('converts middle C (C4, ~261.63 Hz) correctly', () => {
    const result = frequencyToNote(261.63);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('C');
    expect(result!.octave).toBe(4);
    // Allow small cents offset due to floating point
    expect(Math.abs(result!.cents)).toBeLessThanOrEqual(1);
  });

  it('converts E4 (~329.63 Hz) correctly', () => {
    const result = frequencyToNote(329.63);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('E');
    expect(result!.octave).toBe(4);
  });

  it('handles low frequencies (C2, ~65.41 Hz)', () => {
    const result = frequencyToNote(65.41);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('C');
    expect(result!.octave).toBe(2);
  });

  it('handles high frequencies (C7, ~2093 Hz)', () => {
    const result = frequencyToNote(2093);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('C');
    expect(result!.octave).toBe(7);
  });

  it('returns null for zero frequency', () => {
    expect(frequencyToNote(0)).toBeNull();
  });

  it('returns null for negative frequency', () => {
    expect(frequencyToNote(-100)).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(frequencyToNote(NaN)).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(frequencyToNote(Infinity)).toBeNull();
  });

  it('calculates cents offset for slightly sharp A4', () => {
    // 442 Hz is about 8 cents sharp of A4
    const result = frequencyToNote(442);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('A');
    expect(result!.cents).toBeGreaterThan(0);
    expect(result!.cents).toBeLessThanOrEqual(10);
  });

  it('calculates cents offset for slightly flat A4', () => {
    // 438 Hz is about 8 cents flat of A4
    const result = frequencyToNote(438);
    expect(result).not.toBeNull();
    expect(result!.note).toBe('A');
    expect(result!.cents).toBeLessThan(0);
    expect(result!.cents).toBeGreaterThanOrEqual(-10);
  });
});

describe('formatNote', () => {
  it('formats a valid note', () => {
    expect(formatNote({ note: 'A', octave: 4, cents: 0, frequency: 440 })).toBe('A4');
    expect(formatNote({ note: 'C#', octave: 3, cents: 5, frequency: 138.59 })).toBe('C#3');
  });

  it('returns "--" for null input', () => {
    expect(formatNote(null)).toBe('--');
  });
});

describe('formatCents', () => {
  it('returns musical note symbol for zero cents', () => {
    expect(formatCents(0)).toBe('♪');
  });

  it('formats positive cents with plus sign', () => {
    expect(formatCents(10)).toBe('+10¢');
    expect(formatCents(1)).toBe('+1¢');
  });

  it('formats negative cents with minus sign', () => {
    expect(formatCents(-10)).toBe('-10¢');
    expect(formatCents(-1)).toBe('-1¢');
  });
});

describe('getCentsColor', () => {
  it('returns green for in-tune notes (0-5 cents)', () => {
    expect(getCentsColor(0)).toBe('#4ade80');
    expect(getCentsColor(5)).toBe('#4ade80');
    expect(getCentsColor(-5)).toBe('#4ade80');
  });

  it('returns yellow for close notes (6-15 cents)', () => {
    expect(getCentsColor(10)).toBe('#fbbf24');
    expect(getCentsColor(15)).toBe('#fbbf24');
    expect(getCentsColor(-10)).toBe('#fbbf24');
    expect(getCentsColor(-15)).toBe('#fbbf24');
  });

  it('returns red for out-of-tune notes (>15 cents)', () => {
    expect(getCentsColor(20)).toBe('#f87171');
    expect(getCentsColor(-20)).toBe('#f87171');
    expect(getCentsColor(50)).toBe('#f87171');
  });
});
