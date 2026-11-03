const emojis = [
  '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁',
  '🐸', '🐵', '🐔', '🐧', '🦄', '🐝', '🦋', '🐢',
  '🍎', '🍌', '🍓', '🍉', '🍇', '🍊', '🍋', '🍑',
  '🚗', '🚀', '✈️', '🚲', '⚽', '🏀', '🎯', '🎨'
];

const difficultySettings = {
  easy:   { pairs: 4, className: 'easy' },
  medium: { pairs: 6, className: 'medium' },
  hard:   { pairs: 8, className: 'hard' }
};

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let score = 0;
let moves = 0;
let canFlip = true;
let totalPairs = 6;

const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const movesEl = document.getElementById('moves');
const messageEl = document.getElementById('message');
const difficultySelect = document.getElementById('difficulty');
const restartBtn = document.getElementById('restartBtn');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createBoard() {
  const level = difficultySelect.value;
  const settings = difficultySettings[level];
  totalPairs = settings.pairs;

  // Reset state
  board.innerHTML = '';
  board.className = `board ${settings.className}`;
  flippedCards = [];
  matchedPairs = 0;
  score = 0;
  moves = 0;
  canFlip = true;
  scoreEl.textContent = '0';
  movesEl.textContent = '0';
  messageEl.innerHTML = '';
  messageEl.className = 'message';

  // Select & shuffle emojis
  const selected = shuffle(emojis).slice(0, totalPairs);
  const cardEmojis = shuffle([...selected, ...selected]);

  cards = cardEmojis.map((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Carte face cachée');
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="card-face card-front"></div>
      <div class="card-face card-back">${emoji}</div>
    `;

    card.addEventListener('click', () => flipCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flipCard(card);
      }
    });

    board.appendChild(card);
    return card;
  });
}

function flipCard(card) {
  if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
    return;
  }

  card.classList.add('flipped');
  card.setAttribute('aria-label', `Carte ${card.dataset.emoji}`);
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    canFlip = false;
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;

  if (card1.dataset.emoji === card2.dataset.emoji) {
    // Match !
    setTimeout(() => {
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedPairs++;

      // Points : plus de points si peu de coups
      const points = Math.max(40, 100 - Math.floor(moves / 2) * 5);
      score += points;
      scoreEl.textContent = score;

      messageEl.textContent = `🎉 Bravo ! +${points} points`;
      
      flippedCards = [];
      canFlip = true;

      if (matchedPairs === totalPairs) {
        setTimeout(showWin, 450);
      }
    }, 350);
  } else {
    // Pas de match
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      card1.setAttribute('aria-label', 'Carte face cachée');
      card2.setAttribute('aria-label', 'Carte face cachée');
      flippedCards = [];
      canFlip = true;
      messageEl.textContent = 'Essaie encore ! 💪';
    }, 750);
  }
}

function showWin() {
  const bonus = Math.max(0, 180 - moves * 4);
  score += bonus;
  scoreEl.textContent = score;

  messageEl.className = 'message win-message';
  messageEl.innerHTML = `
    🏆 Gagné ! 🏆<br>
    Score final : <strong>${score}</strong><br>
    En ${moves} coups
  `;
}

// Events
restartBtn.addEventListener('click', createBoard);
difficultySelect.addEventListener('change', createBoard);

// Start
createBoard();

// ========== PWA / Installation ==========
const installBtn = document.getElementById('installBtn');
const iosSheet = document.getElementById('iosSheet');
let deferredPrompt = null;

const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// iPhone / iPad : pas d'installation automatique, on montre le guide
if (isIOS && !isStandalone) installBtn.hidden = false;

// Android / Chrome / Edge : vraie fenêtre d'installation
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isStandalone) installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  } else if (isIOS) {
    iosSheet.hidden = false;
  }
});

document.getElementById('iosClose').addEventListener('click', () => { iosSheet.hidden = true; });
iosSheet.addEventListener('click', (e) => { if (e.target === iosSheet) iosSheet.hidden = true; });

window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

// Service Worker (hors connexion)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
