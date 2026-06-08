// -----------------------------
// Vocabulary data (example)
// -----------------------------
const vocab = [
  {
    word: "abandon",
    definitions: [
      "To leave behind or give up",
      "To withdraw from"
    ],
    synonyms: "quit, desert, relinquish"
  },
  {
    word: "abstract",
    definitions: [
      "Existing in thought but not having physical form",
      "Difficult to understand"
    ],
    synonyms: "conceptual, theoretical"
  }
];

let index = 0;

// -----------------------------
// i18n dictionary
// -----------------------------
const i18n = {
  en: {
    deckTitle: "CET-4 Vocabulary",
    definition: "Definition",
    synonyms: "Synonyms",
    wrong: "Wrong",
    right: "Right"
  },
  zh: {
    deckTitle: "四级词汇",
    definition: "释义",
    synonyms: "同义词",
    wrong: "不会",
    right: "会了"
  }
};

let lang = "en";

// -----------------------------
// Render UI
// -----------------------------
function renderCard() {
  const item = vocab[index];

  document.getElementById("deck-title").textContent = i18n[lang].deckTitle;
  document.getElementById("word").textContent = item.word;

  const defList = document.getElementById("definitions");
  defList.innerHTML = "";
  item.definitions.forEach(d => {
    const li = document.createElement("li");
    li.textContent = d;
    defList.appendChild(li);
  });

  document.getElementById("synonyms").textContent = item.synonyms;

  // i18n labels
  document.querySelector("[data-i18n='definition']").textContent = i18n[lang].definition;
  document.querySelector("[data-i18n='synonyms']").textContent = i18n[lang].synonyms;
  document.querySelector("[data-i18n='wrong']").textContent = i18n[lang].wrong;
  document.querySelector("[data-i18n='right']").textContent = i18n[lang].right;
}

// -----------------------------
// Navigation logic
// -----------------------------
function nextCard() {
  index = (index + 1) % vocab.length;
  renderCard();
}
// -----------------------------
// Event listeners
// -----------------------------
document.querySelector(".btn-wrong").addEventListener("click", nextCard);
document.querySelector(".btn-right").addEventListener("click", nextCard);

