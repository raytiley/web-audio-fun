import { describe, it, expect } from 'vitest';
import {
  calculateKeyScores,
  findBestKey,
  computeWinningKey,
  isStrongEnough,
  MIN_VOTES_TO_DISPLAY,
  MIN_STRENGTH_THRESHOLD,
  SWITCHING_THRESHOLD,
  DECAY_TIME_CONSTANT,
  type KeyVote,
  type CurrentKey,
} from './keyDetectionHelpers';

describe('keyDetectionHelpers', () => {
  const NOW = 1700000000000; // Fixed timestamp for testing

  describe('isStrongEnough', () => {
    it('returns true for strength at threshold', () => {
      expect(isStrongEnough(MIN_STRENGTH_THRESHOLD)).toBe(true);
    });

    it('returns true for strength above threshold', () => {
      expect(isStrongEnough(0.8)).toBe(true);
    });

    it('returns false for strength below threshold', () => {
      expect(isStrongEnough(0.1)).toBe(false);
      expect(isStrongEnough(0.29)).toBe(false);
    });
  });

  describe('calculateKeyScores', () => {
    it('returns empty object for empty history', () => {
      const scores = calculateKeyScores([], NOW);
      expect(scores).toEqual({});
    });

    it('calculates scores for single vote', () => {
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.8, timestamp: NOW },
      ];
      const scores = calculateKeyScores(history, NOW);

      expect(scores['C-major']).toBeDefined();
      expect(scores['C-major'].count).toBe(1);
      expect(scores['C-major'].totalStrength).toBe(0.8);
      // At timestamp = NOW, age = 0, so recencyWeight = exp(0) = 1
      expect(scores['C-major'].totalWeight).toBeCloseTo(0.8, 5);
    });

    it('aggregates scores for same key', () => {
      const history: KeyVote[] = [
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.8, timestamp: NOW },
      ];
      const scores = calculateKeyScores(history, NOW);

      expect(scores['A-minor'].count).toBe(2);
      expect(scores['A-minor'].totalStrength).toBe(1.4);
      expect(scores['A-minor'].totalWeight).toBeCloseTo(1.4, 5);
    });

    it('separates scores for different keys', () => {
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.7, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
      ];
      const scores = calculateKeyScores(history, NOW);

      expect(Object.keys(scores)).toHaveLength(2);
      expect(scores['C-major'].count).toBe(1);
      expect(scores['A-minor'].count).toBe(1);
    });

    it('applies time decay to older votes', () => {
      const oneMinuteAgo = NOW - 60 * 1000;
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.8, timestamp: oneMinuteAgo },
      ];
      const scores = calculateKeyScores(history, NOW);

      // After 60 seconds with decay constant of 30s: weight = 0.8 * exp(-60/30) = 0.8 * exp(-2)
      const expectedWeight = 0.8 * Math.exp(-60 / DECAY_TIME_CONSTANT);
      expect(scores['C-major'].totalWeight).toBeCloseTo(expectedWeight, 5);
      // totalStrength is not decayed
      expect(scores['C-major'].totalStrength).toBe(0.8);
    });

    it('recent votes have more weight than older votes', () => {
      const recentVote: KeyVote = { key: 'C', scale: 'major', strength: 0.5, timestamp: NOW };
      const oldVote: KeyVote = { key: 'A', scale: 'minor', strength: 0.5, timestamp: NOW - 60000 };

      const scores = calculateKeyScores([recentVote, oldVote], NOW);

      expect(scores['C-major'].totalWeight).toBeGreaterThan(scores['A-minor'].totalWeight);
    });
  });

  describe('findBestKey', () => {
    it('returns null for empty scores', () => {
      const result = findBestKey({});
      expect(result.keyId).toBeNull();
      expect(result.voteRatio).toBe(0);
      expect(result.totalScore).toBe(0);
    });

    it('returns the only key when there is one', () => {
      const scores = {
        'C-major': { totalWeight: 0.8, totalStrength: 0.8, count: 1 },
      };
      const result = findBestKey(scores);

      expect(result.keyId).toBe('C-major');
      expect(result.voteRatio).toBe(1);
      expect(result.totalScore).toBe(0.8);
    });

    it('returns the key with highest weight', () => {
      const scores = {
        'C-major': { totalWeight: 0.5, totalStrength: 0.5, count: 1 },
        'A-minor': { totalWeight: 0.8, totalStrength: 0.8, count: 1 },
        'G-major': { totalWeight: 0.3, totalStrength: 0.3, count: 1 },
      };
      const result = findBestKey(scores);

      expect(result.keyId).toBe('A-minor');
      expect(result.voteRatio).toBeCloseTo(0.8 / 1.6, 5);
    });

    it('calculates correct vote ratio', () => {
      const scores = {
        'C-major': { totalWeight: 3, totalStrength: 3, count: 3 },
        'A-minor': { totalWeight: 1, totalStrength: 1, count: 1 },
      };
      const result = findBestKey(scores);

      expect(result.keyId).toBe('C-major');
      expect(result.voteRatio).toBe(0.75); // 3 / 4
      expect(result.totalScore).toBe(4);
    });
  });

  describe('computeWinningKey', () => {
    it('returns null when history is too short', () => {
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.8, timestamp: NOW },
      ];
      const result = computeWinningKey(history, null, NOW);

      expect(result).toBeNull();
    });

    it('returns null when history has exactly MIN_VOTES_TO_DISPLAY - 1 votes', () => {
      const history: KeyVote[] = Array(MIN_VOTES_TO_DISPLAY - 1).fill(null).map(() => ({
        key: 'C',
        scale: 'major',
        strength: 0.8,
        timestamp: NOW,
      }));
      const result = computeWinningKey(history, null, NOW);

      expect(result).toBeNull();
    });

    it('returns key when history has exactly MIN_VOTES_TO_DISPLAY votes', () => {
      const history: KeyVote[] = Array(MIN_VOTES_TO_DISPLAY).fill(null).map(() => ({
        key: 'C',
        scale: 'major',
        strength: 0.8,
        timestamp: NOW,
      }));
      const result = computeWinningKey(history, null, NOW);

      expect(result).not.toBeNull();
      expect(result?.key).toBe('C');
      expect(result?.scale).toBe('major');
    });

    it('returns winning key with no current key (first detection)', () => {
      const history: KeyVote[] = [
        { key: 'A', scale: 'minor', strength: 0.7, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.8, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
      ];
      const result = computeWinningKey(history, null, NOW);

      expect(result?.key).toBe('A');
      expect(result?.scale).toBe('minor');
      expect(result?.strength).toBeCloseTo(0.7, 5); // average of 0.7, 0.8, 0.6
    });

    it('keeps current key when new key does not exceed switching threshold', () => {
      // Current key is C major, but votes are split
      const currentKey: CurrentKey = { key: 'C', scale: 'major' };
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.6, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.7, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.7, timestamp: NOW },
      ];
      // A minor has slightly higher total but not 60% of total
      const result = computeWinningKey(history, currentKey, NOW);

      // Should keep C major because A minor doesn't have 60% majority
      expect(result?.key).toBe('C');
      expect(result?.scale).toBe('major');
    });

    it('switches to new key when it exceeds switching threshold', () => {
      const currentKey: CurrentKey = { key: 'C', scale: 'major' };
      const history: KeyVote[] = [
        { key: 'A', scale: 'minor', strength: 0.8, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.8, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.8, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.5, timestamp: NOW },
      ];
      // A minor has 2.4 / 2.9 = 82.7% of votes, well above 60%
      const result = computeWinningKey(history, currentKey, NOW);

      expect(result?.key).toBe('A');
      expect(result?.scale).toBe('minor');
    });

    it('stays on current key when it is still the best', () => {
      const currentKey: CurrentKey = { key: 'C', scale: 'major' };
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.8, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.8, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.8, timestamp: NOW },
      ];
      const result = computeWinningKey(history, currentKey, NOW);

      expect(result?.key).toBe('C');
      expect(result?.scale).toBe('major');
    });

    it('returns correct average strength', () => {
      const history: KeyVote[] = [
        { key: 'G', scale: 'major', strength: 0.4, timestamp: NOW },
        { key: 'G', scale: 'major', strength: 0.6, timestamp: NOW },
        { key: 'G', scale: 'major', strength: 0.8, timestamp: NOW },
      ];
      const result = computeWinningKey(history, null, NOW);

      expect(result?.strength).toBeCloseTo(0.6, 5); // (0.4 + 0.6 + 0.8) / 3
    });

    it('handles edge case where current key has no votes in history', () => {
      const currentKey: CurrentKey = { key: 'D', scale: 'minor' };
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.5, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.5, timestamp: NOW },
        { key: 'G', scale: 'major', strength: 0.5, timestamp: NOW },
      ];
      // No key has 60% majority, but current key (D minor) has no votes
      // Should switch to whatever has the best score since current key is gone
      const result = computeWinningKey(history, currentKey, NOW);

      // All keys have equal weight, so it should keep D minor (current)
      // because no new key exceeds threshold
      expect(result?.key).toBe('D');
      expect(result?.scale).toBe('minor');
      expect(result?.strength).toBe(0); // No votes for D minor
    });

    it('respects time decay in key selection', () => {
      // Old votes for C major, recent votes for A minor
      const history: KeyVote[] = [
        { key: 'C', scale: 'major', strength: 0.9, timestamp: NOW - 90000 }, // 90s ago
        { key: 'C', scale: 'major', strength: 0.9, timestamp: NOW - 90000 },
        { key: 'C', scale: 'major', strength: 0.9, timestamp: NOW - 90000 },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
      ];
      const result = computeWinningKey(history, null, NOW);

      // Even though C major has higher raw strength, A minor should win
      // because it's more recent
      expect(result?.key).toBe('A');
      expect(result?.scale).toBe('minor');
    });
  });

  describe('switching threshold behavior', () => {
    it(`requires ${SWITCHING_THRESHOLD * 100}% vote ratio to switch keys`, () => {
      const currentKey: CurrentKey = { key: 'C', scale: 'major' };

      // Create history where new key has exactly at threshold
      // Need: newKeyWeight / totalWeight >= SWITCHING_THRESHOLD
      const history: KeyVote[] = [
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'A', scale: 'minor', strength: 0.6, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.4, timestamp: NOW },
      ];
      // A minor: 1.8, C major: 0.4, total: 2.2
      // Ratio: 1.8/2.2 = 0.818 > 0.6
      const result = computeWinningKey(history, currentKey, NOW);

      expect(result?.key).toBe('A');
    });

    it('does not switch when just below threshold', () => {
      const currentKey: CurrentKey = { key: 'C', scale: 'major' };

      // Create history where new key is just below threshold
      const history: KeyVote[] = [
        { key: 'A', scale: 'minor', strength: 0.55, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.45, timestamp: NOW },
        { key: 'C', scale: 'major', strength: 0.45, timestamp: NOW },
      ];
      // A minor: 0.55, C major: 0.90, total: 1.45
      // A minor ratio: 0.55/1.45 = 0.379 < 0.6
      const result = computeWinningKey(history, currentKey, NOW);

      expect(result?.key).toBe('C');
    });
  });
});
