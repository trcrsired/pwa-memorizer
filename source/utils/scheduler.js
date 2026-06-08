// Ebbinghaus intervals (days)
// Level ≤6: same session, Level 7-8: scheduled, Level 9: mastered
const INTERVALS = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,  // Level ≤6: same day
  7: 1,
  8: 2,
  9: null  // Mastered
};

export function calculateNextReviewDate(level) {
  const days = INTERVALS[level];
  if (days === null) return null;
  if (days === 0) return null; // Same-day handled by session.pendingReview

  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function updateLevel(currentLevel, change) {
  const newLevel = Math.max(0, Math.min(9, currentLevel + change));
  return {
    level: newLevel,
    lastReviewDate: new Date().toISOString(),
    nextReviewDate: calculateNextReviewDate(newLevel),
    timesReviewed: (currentLevel || 0) + 1
  };
}

export function isWordDue(progress) {
  if (!progress) return true;
  if (progress.level >= 9) return false;
  if (progress.level <= 6) return true;

  const today = new Date().toISOString().split('T')[0];
  return !progress.nextReviewDate || progress.nextReviewDate <= today;
}