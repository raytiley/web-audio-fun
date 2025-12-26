import type { KeyInfo } from '../types/audio';

// Configuration
export const KEY_HISTORY_SIZE = 8; // keep last 8 key detections for voting
export const MIN_VOTES_TO_DISPLAY = 3; // need at least 3 votes for a key to display
export const MIN_STRENGTH_THRESHOLD = 0.3; // ignore weak detections
export const SWITCHING_THRESHOLD = 0.6; // new key needs 60% of weighted votes to switch
export const DECAY_TIME_CONSTANT = 30; // seconds for exponential decay

// Key detection with timestamp and weight
export interface KeyVote {
  key: string;
  scale: string;
  strength: number;
  timestamp: number;
}

export interface CurrentKey {
  key: string;
  scale: string;
}

/**
 * Calculate weighted scores for each key from vote history.
 * More recent detections and higher strength detections get more weight.
 */
export function calculateKeyScores(
  history: KeyVote[],
  now: number
): Record<string, { totalWeight: number; totalStrength: number; count: number }> {
  const keyScores: Record<string, { totalWeight: number; totalStrength: number; count: number }> = {};

  for (const vote of history) {
    const keyId = `${vote.key}-${vote.scale}`;
    const ageSeconds = (now - vote.timestamp) / 1000;
    // Decay factor: recent votes count more (exponential decay)
    const recencyWeight = Math.exp(-ageSeconds / DECAY_TIME_CONSTANT);
    const weight = vote.strength * recencyWeight;

    if (!keyScores[keyId]) {
      keyScores[keyId] = { totalWeight: 0, totalStrength: 0, count: 0 };
    }
    keyScores[keyId].totalWeight += weight;
    keyScores[keyId].totalStrength += vote.strength;
    keyScores[keyId].count++;
  }

  return keyScores;
}

/**
 * Find the key with the highest weighted score.
 * Returns the key ID and the ratio of its score to the total.
 */
export function findBestKey(
  keyScores: Record<string, { totalWeight: number; totalStrength: number; count: number }>
): { keyId: string | null; voteRatio: number; totalScore: number } {
  let bestKey: string | null = null;
  let bestScore = 0;
  let totalScore = 0;

  for (const [keyId, scores] of Object.entries(keyScores)) {
    totalScore += scores.totalWeight;
    if (scores.totalWeight > bestScore) {
      bestScore = scores.totalWeight;
      bestKey = keyId;
    }
  }

  const voteRatio = totalScore > 0 ? bestScore / totalScore : 0;
  return { keyId: bestKey, voteRatio, totalScore };
}

/**
 * Compute the winning key from vote history using weighted voting.
 * Implements hysteresis to prevent rapid key switching.
 */
export function computeWinningKey(
  history: KeyVote[],
  currentKey: CurrentKey | null,
  now: number = Date.now()
): KeyInfo | null {
  if (history.length < MIN_VOTES_TO_DISPLAY) {
    return null;
  }

  const keyScores = calculateKeyScores(history, now);
  const { keyId: bestKey, voteRatio, totalScore } = findBestKey(keyScores);

  if (!bestKey || totalScore === 0) {
    return null;
  }

  const [key, scale] = bestKey.split('-');
  const scores = keyScores[bestKey];

  // If we have a current key, require the new key to have a higher threshold to switch
  // This prevents rapid oscillation between keys
  if (currentKey) {
    const currentKeyId = `${currentKey.key}-${currentKey.scale}`;
    if (currentKeyId !== bestKey && voteRatio < SWITCHING_THRESHOLD) {
      // Not enough confidence to switch, keep current key
      const currentScores = keyScores[currentKeyId];
      return {
        key: currentKey.key,
        scale: currentKey.scale as 'major' | 'minor',
        strength: currentScores?.totalStrength / (currentScores?.count || 1) || 0,
      };
    }
  }

  return {
    key,
    scale: scale as 'major' | 'minor',
    strength: scores.totalStrength / scores.count,
  };
}

/**
 * Check if a key detection result is strong enough to be considered.
 */
export function isStrongEnough(strength: number): boolean {
  return strength >= MIN_STRENGTH_THRESHOLD;
}
