const TRANSLATIONS = {
  en: {
    title: 'PWA Memorizer',
    phase1Prompt: 'Do you know this word?',
    phase2PromptYes: 'Did you remember correctly?',
    phase2PromptNo: 'Remember this for next time',
    btnYes: 'Yes',
    btnNo: 'No',
    btnCorrect: 'Correct',
    btnWrong: 'Wrong',
    btnGotIt: 'Got it',
    settings: 'Settings',
    language: 'Language',
    wordList: 'Word List',
    voice: 'Voice',
    close: 'Close',
    noWords: 'All done!',
    noWordsMsg: 'No words to review right now.',
    meaning: 'Meaning',
    examples: 'Examples',
    level: 'Level'
  },
  zh: {
    title: 'PWA 记忆器',
    phase1Prompt: '你认识这个单词吗？',
    phase2PromptYes: '你记对了吗？',
    phase2PromptNo: '下次记住它',
    btnYes: '认识',
    btnNo: '不认识',
    btnCorrect: '对了',
    btnWrong: '错了',
    btnGotIt: '记住了',
    settings: '设置',
    language: '语言',
    wordList: '词表',
    voice: '语音',
    close: '关闭',
    noWords: '全部完成！',
    noWordsMsg: '暂时没有需要复习的单词。',
    meaning: '释义',
    examples: '例句',
    level: '等级'
  }
};

export function t(key, lang = 'en') {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

export function getAvailableLanguages() {
  return Object.keys(TRANSLATIONS);
}