import { initStorage, getWordProgress, updateWordProgress, getScheduledReviews, addToPendingReview, removeFromPending, getPendingReviews, updateSettings, getSettings, getAllWordProgress, incrementNewWordsCount, canLearnNewWords, hasMinimumNewWords } from './utils/storage.js';
import { updateLevel } from './utils/scheduler.js';
import { t } from './i18n.js';
import { getWordList, getAllWordLists, getWord } from './data/word-lists.js';

let currentWord = null;
let phase = 1;
let phase1Result = null;
let wordList = null;
let lang = 'en';
let selectedVoice = null;
let voices = [];
let shuffle = false;

// Track recently shown words to enforce spacing
// A word must wait for MIN_GAP other words before it can reappear
const MIN_GAP = 2;
let recentlyShown = [];

const wordText = document.getElementById('wordText');
const playSound = document.getElementById('playSound');
const spacer = document.getElementById('spacer');
const explainBlock = document.getElementById('explainBlock');
const phaseText = document.getElementById('phaseText');
const explainText = document.getElementById('explainText');
const examplesText = document.getElementById('examplesText');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const languageSelect = document.getElementById('languageSelect');
const listSelect = document.getElementById('listSelect');
const voiceSelect = document.getElementById('voiceSelect');
const shuffleToggle = document.getElementById('shuffleToggle');
const closeSettings = document.getElementById('closeSettings');
const noWordsScreen = document.getElementById('noWordsScreen');
const levelsScreen = document.getElementById('levelsScreen');
const levelsList = document.getElementById('levelsList');
const closeLevels = document.getElementById('closeLevels');
const viewLevelsBtn = document.getElementById('viewLevelsBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

function loadVoices() {
  voices = speechSynthesis.getVoices();
  populateVoices();
}

function populateVoices() {
  voiceSelect.innerHTML = '';
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  if (englishVoices.length === 0) {
    voiceSelect.innerHTML = '<option value="">No voices</option>';
    return;
  }
  englishVoices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    opt.selected = v.name === selectedVoice;
    voiceSelect.appendChild(opt);
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function populateLevels() {
  const words = getAllWordProgress(wordList);
  levelsList.innerHTML = '';
  words.forEach(w => {
    const item = document.createElement('div');
    item.className = 'word-level-item';

    const name = document.createElement('span');
    name.className = 'word-level-name';
    name.textContent = w.word;

    const value = document.createElement('div');
    value.className = 'word-level-value';
    for (let i = 0; i < 9; i++) {
      const dot = document.createElement('span');
      dot.className = 'level-dot';
      if (i < w.progress.level) {
        dot.classList.add('active');
        if (w.progress.level >= 9) dot.classList.add('mastered');
      }
      value.appendChild(dot);
    }

    item.appendChild(name);
    item.appendChild(value);
    levelsList.appendChild(item);
  });
}

function exportProgress() {
  const data = localStorage.getItem('pwa-memorizer-data');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pwa-memorizer-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem('pwa-memorizer-data', JSON.stringify(data));
      initStorage();
      init();
    } catch (err) {
      alert('Invalid file format');
    }
  };
  reader.readAsText(file);
}

function init() {
  const settings = getSettings();
  lang = settings.uiLanguage || 'en';
  wordList = getWordList(settings.activeListId || 'incel');
  selectedVoice = settings.ttsVoice || null;
  shuffle = settings.shuffle || false;

  if (speechSynthesis.getVoices().length > 0) loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;

  populateSettings();
  setupEventListeners();
  showNextWord();
}

function populateSettings() {
  languageSelect.innerHTML = '';
  ['en', 'zh'].forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l === 'en' ? 'English' : '中文';
    opt.selected = l === lang;
    languageSelect.appendChild(opt);
  });

  listSelect.innerHTML = '';
  getAllWordLists().forEach(list => {
    const opt = document.createElement('option');
    opt.value = list.id;
    opt.textContent = list.name;
    opt.selected = list.id === wordList?.id;
    listSelect.appendChild(opt);
  });

  shuffleToggle.checked = shuffle;
}

function setupEventListeners() {
  btnYes.addEventListener('click', handleYes);
  btnNo.addEventListener('click', handleNo);

  settingsBtn.addEventListener('click', () => {
    populateVoices();
    settingsModal.style.display = 'flex';
  });

  closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');

  viewLevelsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    populateLevels();
    document.querySelector('.memorize-ui').style.display = 'none';
    noWordsScreen.style.display = 'none';
    levelsScreen.style.display = 'flex';
  });

  closeLevels.addEventListener('click', () => {
    levelsScreen.style.display = 'none';
    if (currentWord) {
      document.querySelector('.memorize-ui').style.display = 'flex';
    } else {
      noWordsScreen.style.display = 'flex';
    }
  });

  exportBtn.addEventListener('click', exportProgress);

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      if (e.target.files[0]) importProgress(e.target.files[0]);
    };
    input.click();
  });

  languageSelect.addEventListener('change', (e) => {
    lang = e.target.value;
    updateSettings('uiLanguage', lang);
    render();
  });

  listSelect.addEventListener('change', (e) => {
    wordList = getWordList(e.target.value);
    updateSettings('activeListId', e.target.value);
    showNextWord();
  });

  voiceSelect.addEventListener('change', (e) => {
    selectedVoice = e.target.value;
    updateSettings('ttsVoice', selectedVoice);
  });

  shuffleToggle.addEventListener('change', (e) => {
    shuffle = e.target.checked;
    updateSettings('shuffle', shuffle);
  });

  playSound.addEventListener('click', () => {
    if (currentWord) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.8;
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      speechSynthesis.speak(utterance);
    }
  });
}

function showNextWord() {
  phase = 1;
  phase1Result = null;
  currentWord = getNextWord();
  if (!currentWord) return showNoWords();
  render();
}

function getNextWord() {
  const data = JSON.parse(localStorage.getItem('pwa-memorizer-data'));
  const newWordsCount = data.session.newWordsToday || 0;

  // Helper: check if word can be shown (not in recentlyShown)
  const canShow = (wordId) => !recentlyShown.includes(wordId);

  // Learning phase: must learn at least 3 new words first
  if (newWordsCount < 3) {
    let newWords = wordList.words.filter(w =>
      !data.session.reviewedToday.includes(w.word) &&
      !data.wordProgress[w.word]
    );
    if (shuffle) newWords = shuffleArray([...newWords]);
    // Prefer words not recently shown
    const notRecent = newWords.filter(w => canShow(w.word));
    if (notRecent.length > 0) {
      incrementNewWordsCount();
      trackShown(notRecent[0].word);
      return { ...notRecent[0], progress: { level: 4, nextReviewDate: null } };
    }
    if (newWords.length > 0) {
      incrementNewWordsCount();
      trackShown(newWords[0].word);
      return { ...newWords[0], progress: { level: 4, nextReviewDate: null } };
    }
  }

  // Review phase: get all words needing same-session review (level ≤ 6, not reviewed today)
  const scheduled = getScheduledReviews(wordList);
  const sameSession = scheduled.filter(w => {
    const progress = getWordProgress(w.word);
    return progress.level <= 6 && !data.session.reviewedToday.includes(w.word);
  });

  // Filter out recently shown words
  const eligible = sameSession.filter(w => canShow(w.word));
  if (eligible.length > 0) {
    if (shuffle) {
      const shuffled = shuffleArray([...eligible]);
      trackShown(shuffled[0].word);
      return { ...shuffled[0], progress: getWordProgress(shuffled[0].word) };
    }
    trackShown(eligible[0].word);
    return { ...eligible[0], progress: getWordProgress(eligible[0].word) };
  }

  // If all same-session words are in recentlyShown, allow showing any of them
  if (sameSession.length > 0) {
    // Reset recentlyShown to allow cycling
    recentlyShown = recentlyShown.slice(-1); // Keep only last one
    if (shuffle) {
      const shuffled = shuffleArray([...sameSession]);
      trackShown(shuffled[0].word);
      return { ...shuffled[0], progress: getWordProgress(shuffled[0].word) };
    }
    trackShown(sameSession[0].word);
    return { ...sameSession[0], progress: getWordProgress(sameSession[0].word) };
  }

  // If scheduled reviews exist but all reviewed today, wait
  if (scheduled.length > 0) return null;

  // After all reviews done and all words ≥4, learn more new words
  if (canLearnNewWords()) {
    let newWords = wordList.words.filter(w => !data.session.reviewedToday.includes(w.word));
    if (shuffle) newWords = shuffleArray([...newWords]);
    const notRecent = newWords.filter(w => canShow(w.word));
    if (notRecent.length > 0) {
      incrementNewWordsCount();
      trackShown(notRecent[0].word);
      return { ...notRecent[0], progress: getWordProgress(notRecent[0].word) };
    }
    if (newWords.length > 0) {
      incrementNewWordsCount();
      trackShown(newWords[0].word);
      return { ...newWords[0], progress: getWordProgress(newWords[0].word) };
    }
  }

  return null;
}

function trackShown(wordId) {
  recentlyShown.push(wordId);
  // Keep only MIN_GAP entries to allow words to cycle back
  if (recentlyShown.length > MIN_GAP) {
    recentlyShown.shift();
  }
}

function showNoWords() {
  document.querySelector('.memorize-ui').style.display = 'none';
  noWordsScreen.style.display = 'flex';
  noWordsScreen.querySelector('.no-words-title').textContent = t('noWords', lang);
  noWordsScreen.querySelector('.no-words-msg').textContent = t('noWordsMsg', lang);
}

function render() {
  document.querySelector('.memorize-ui').style.display = 'flex';
  noWordsScreen.style.display = 'none';
  levelsScreen.style.display = 'none';
  if (!currentWord) return;

  wordText.textContent = currentWord.word;

  spacer.style.display = phase === 1 ? 'block' : 'none';
  explainBlock.style.display = phase === 2 ? 'block' : 'none';

  if (phase === 1) {
    phaseText.textContent = '';
    btnYes.textContent = t('btnYes', lang);
    btnNo.textContent = t('btnNo', lang);
    btnNo.style.display = 'block';
  } else {
    if (phase1Result === 'yes') {
      phaseText.textContent = t('phase2PromptYes', lang);
      btnYes.textContent = t('btnCorrect', lang);
      btnNo.textContent = t('btnWrong', lang);
      btnNo.style.display = 'block';
    } else {
      phaseText.textContent = t('phase2PromptNo', lang);
      btnYes.textContent = t('btnGotIt', lang);
      btnNo.style.display = 'none';
    }
    explainText.innerHTML = `<strong>${t('meaning', lang)}:</strong> ${currentWord.meaning}<br><br>${currentWord.translation}`;
    examplesText.innerHTML = `<strong>${t('examples', lang)}:</strong><br>${currentWord.examples.map(e => `• ${e}`).join('<br>')}`;
  }
}

function handleYes() {
  if (phase === 1) {
    phase1Result = 'yes';
    phase = 2;
    render();
  } else {
    const wordId = currentWord.word;
    const progress = getWordProgress(wordId);
    let newLevel = progress.level;

    if (phase1Result === 'yes') {
      // Correct: level +1
      const newProgress = updateLevel(progress.level, +1);
      newLevel = newProgress.level;
      updateWordProgress(wordId, newProgress);
    }

    // Only mark as reviewed if level > 6
    const markReviewed = newLevel > 6;
    removeFromPending(wordId, markReviewed);

    showNextWord();
  }
}

function handleNo() {
  if (phase === 1) {
    phase1Result = 'no';
    const wordId = currentWord.word;
    // Reset level to 0 when user doesn't know the word
    updateWordProgress(wordId, { level: 0, nextReviewDate: null, lastReviewDate: new Date().toISOString() });
    phase = 2;
    render();
  } else {
    // Phase 2: No acts as wrong (only meaningful if phase1 was yes)
    if (phase1Result === 'yes') {
      const wordId = currentWord.word;
      const progress = getWordProgress(wordId);
      const newProgress = updateLevel(progress.level, -1);
      updateWordProgress(wordId, newProgress);
    }

    showNextWord();
  }
}

initStorage();
init();