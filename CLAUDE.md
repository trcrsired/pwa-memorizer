# PWA Memorizer - Project Knowledge

## Overview
A Progressive Web App for vocabulary memorization using spaced repetition.

## Core Rules

### Memory Levels
- 9 levels per word (0-9)
- New words start at level 4
- Level 9 = mastered (never appear again)

### Level Changes
- **Phase 1 "No"**: Level resets to 0
- **Phase 1 "Yes" + Phase 2 "Correct"**: Level +1
- **Phase 1 "Yes" + Phase 2 "Wrong"**: Level -1

### Review Scheduling
- **Level ≤6**: Same-session review (cycles in `pendingReview`)
- **Level 7**: Scheduled for 1 day later
- **Level 8**: Scheduled for 2 days later
- **Level 9**: Mastered, never appear

### Learning Flow
1. **Learning phase**: Learn 3 new words first (mandatory)
2. **Review phase**: Cycle words with level ≤6
3. **More new words**: Only when:
   - All words have level ≥4
   - All scheduled reviews complete

### Two-Phase Review
1. **Phase 1**: Show word only (meaning hidden), user clicks Yes/No
2. **Phase 2**: Show meaning, user confirms:
   - If Phase 1 was Yes: Correct/Wrong buttons
   - If Phase 1 was No: Only "Got it" button (level already set to 0)

## Data Structure

### localStorage key: `pwa-memorizer-data`
```json
{
  "version": 1,
  "settings": {
    "uiLanguage": "en",
    "activeListId": "incel",
    "shuffle": false,
    "ttsVoice": null
  },
  "wordProgress": {
    "wordId": {
      "level": 4,
      "nextReviewDate": null,
      "lastReviewDate": "2026-06-09T..."
    }
  },
  "session": {
    "date": "2026-06-09",
    "pendingReview": ["word1", "word2"],
    "reviewedToday": ["word3"],
    "newWordsToday": 3
  }
}
```

### Word Key Strategy
- Default: word itself is the key (shared across lists)
- Custom: word list can define `id` for context-specific meanings

## File Structure

```
source/
├── index.html          # Main UI
├── styles.css          # Styling (light/dark mode)
├── main.js             # Core app logic
├── i18n.js             # EN/ZH translations
├── sw.js               # Service worker (LNA compliant)
├── sw-register.js      # SW registration + update prompt
├── utils/
│   ├── storage.js      # localStorage wrapper
│   └── scheduler.js    # Ebbinghaus intervals
└── data/
    ├── word-lists.js   # Registry (imports from wordlists/)
    └── wordlists/      # Individual word list files
        ├── incel.js
        ├── cet-4.js
        └── toefl.js
```

## Key Functions

### storage.js
- `initStorage()` - Load/create data
- `getWordProgress(wordId)` - Get level/nextReview
- `updateWordProgress(wordId, updates)` - Save progress
- `getScheduledReviews(wordList)` - Get words due today (level ≤6 or scheduled)
- `addToPendingReview(wordId)` - Add to session queue
- `removeFromPending(wordId, markReviewed)` - Remove from queue (markReviewed=true for level >6)
- `canLearnNewWords()` - Check if can learn more (min 3, then conditions)
- `hasMinimumNewWords()` - Check if learned 3 initial words

### scheduler.js
- `calculateNextReviewDate(level)` - Ebbinghaus intervals
- `updateLevel(currentLevel, change)` - Apply change, return new state

### main.js
- `getNextWord()` - Priority: new words (if <3) → pending → scheduled → more new words
- `handleYes()` - Phase 1: show meaning; Phase 2: +1 level if phase1=yes
- `handleNo()` - Phase 1: level=0; Phase 2: -1 level if phase1=yes

## UI Components

### Main Screen
- Word display with sound button (TTS)
- Spacer (phase 1) / Explanation block (phase 2)
- Yes/No buttons at bottom

### Settings Modal
- Language selector (EN/ZH)
- Word list selector
- Voice selector (Web Speech API)
- Shuffle toggle
- View Word Levels button
- Export/Import progress buttons

### Word Levels Screen
- Full screen scrollable list
- Each word shows 9 dots (filled = active level)
- Gold dot for mastered (level 9)

## Service Worker

### sw.js Features
- Cache-first strategy
- LNA compliance (excludes localhost, private IPs, .local)
- Update notification via `confirm()` prompt
- `CACHE_FILES` array for offline assets

### sw-register.js
- `SW_ENABLED` toggle (set false for dev)
- Checks for updates every hour
- `SKIP_WAITING` message handler

## Adding New Word Lists

1. Create file in `source/data/wordlists/your-list.js`:
```js
export default {
  id: 'your-list',
  name: 'Your List',
  description: 'Description',
  words: [
    { word: 'example', meaning: '...', translation: '...', examples: ['...'] }
  ]
};
```

2. Import and register in `word-lists.js`:
```js
import yourList from './wordlists/your-list.js';
const WORD_LISTS = { incel, 'cet-4': cet4, toefl, 'your-list': yourList };
```

3. Add to `sw.js` CACHE_FILES array.