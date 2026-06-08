const STORAGE_KEY = 'pwa-memorizer-data';

function getDefaultData() {
  return {
    version: 1,
    settings: {
      uiLanguage: 'en',
      activeListId: 'incel',
      shuffle: false
    },
    wordProgress: {},
    session: {
      date: new Date().toISOString().split('T')[0],
      pendingReview: [],
      reviewedToday: [],
      newWordsToday: 0
    }
  };
}

function migrateData(data) {
  const version = data.version || 0;
  if (version < 1) {
    data.settings = data.settings || getDefaultData().settings;
    data.version = 1;
  }
  return data;
}

export function initStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    migrateData(data);
    // Reset session if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (data.session.date !== today) {
      data.session = {
        date: today,
        pendingReview: [],
        reviewedToday: [],
        newWordsToday: 0
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  const data = getDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function getWordProgress(wordId) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return data.wordProgress[wordId] || { level: 4, nextReviewDate: null, lastReviewDate: null };
}

export function updateWordProgress(wordId, updates) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const current = data.wordProgress[wordId] || {
    level: 4,
    nextReviewDate: null,
    lastReviewDate: null,
    timesReviewed: 0
  };
  data.wordProgress[wordId] = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getScheduledReviews(wordList) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const today = new Date().toISOString().split('T')[0];
  if (!wordList) return [];

  return wordList.words.filter(word => {
    const progress = data.wordProgress[word.id || word.word];
    if (!progress) return true;
    if (progress.level >= 9) return false;
    if (progress.level <= 6) return true;
    if (!progress.nextReviewDate) return true;
    return progress.nextReviewDate <= today;
  });
}

export function addToPendingReview(wordId) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!data.session.pendingReview.includes(wordId)) {
    data.session.pendingReview.push(wordId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function removeFromPending(wordId, markReviewed = true) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  data.session.pendingReview = data.session.pendingReview.filter(id => id !== wordId);
  if (markReviewed) {
    data.session.reviewedToday.push(wordId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function incrementNewWordsCount() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  data.session.newWordsToday = (data.session.newWordsToday || 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data.session.newWordsToday;
}

export function getNewWordsCount() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return data.session.newWordsToday || 0;
}

const NEW_WORDS_MIN = 3;

export function canLearnNewWords() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const newWordsCount = data.session.newWordsToday || 0;

  // Must learn at least 3 new words initially
  if (newWordsCount < NEW_WORDS_MIN) return true;

  // After initial 3, check if all words are level ≥4 and all reviews done
  const pendingReviews = data.session.pendingReview.length;
  if (pendingReviews > 0) return false;

  // Check if any word is below level 4
  for (const wordId in data.wordProgress) {
    if (data.wordProgress[wordId].level < 4) return false;
  }

  // Check if scheduled reviews are pending
  // (this will be checked by caller via getScheduledReviews)

  return true;
}

export function hasMinimumNewWords() {
  return getNewWordsCount() >= NEW_WORDS_MIN;
}

export function getPendingReviews() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return data.session.pendingReview;
}

export function updateSettings(key, value) {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  data.settings[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSettings() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return data.settings;
}

export function getAllWordProgress(wordList) {
  if (!wordList) return [];
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return wordList.words.map(word => ({
    word: word.word,
    meaning: word.meaning,
    progress: data.wordProgress[word.word] || { level: 4, nextReviewDate: null }
  }));
}