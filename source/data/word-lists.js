import incel from './wordlists/incel.js';
import cet4 from './wordlists/cet-4.js';
import toefl from './wordlists/toefl.js';

// Registry of all word lists
// To add a new list: import it and add to this object
const WORD_LISTS = {
  incel,
  'cet-4': cet4,
  toefl
};

export function getWordList(listId) {
  return WORD_LISTS[listId] || null;
}

export function getAllWordLists() {
  return Object.values(WORD_LISTS);
}

export function getWord(wordListId, wordId) {
  const list = getWordList(wordListId);
  if (!list) return null;
  return list.words.find(w => w.word === wordId || w.id === wordId);
}