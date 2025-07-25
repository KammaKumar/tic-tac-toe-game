// DOM Elements
const board = document.getElementById('board');
const statusText = document.getElementById('status');
const resetButton = document.getElementById('reset');
const scoreXText = document.getElementById('score-x');
const scoreOText = document.getElementById('score-o');
const moveSound = document.getElementById('move-sound');
const winSound = document.getElementById('win-sound');
const errorSound = document.getElementById('error-sound');
const gameModeSelect = document.getElementById('game-mode');
const difficultySelect = document.getElementById('difficulty');
const difficultySetting = document.getElementById('difficulty-setting');

// Game State
let cells = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;
let scoreX = 0;
let scoreO = 0;
let gameMode = 'pvp'; // 'pvp' or 'pva'
let difficulty = 'hard'; // 'easy', 'moderate', or 'hard'

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Initialize Board
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  const cellText = document.createElement('span');
  cell.appendChild(cellText);
  board.appendChild(cell);
}

// Event Listeners
board.addEventListener('click', handleCellClick);
resetButton.addEventListener('click', startGame);
gameModeSelect.addEventListener('change', (e) => {
  gameMode = e.target.value;
  difficultySetting.classList.toggle('hidden', gameMode !== 'pva');
  startGame();
});
difficultySelect.addEventListener('change', (e) => {
  difficulty = e.target.value;
  startGame();
});

// Main Game Logic
function handleCellClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell) return;

  // Play error sound on invalid clicks
  if (!gameActive || cells[cell.dataset.index] !== '') {
    if (gameActive) errorSound.play();
    return;
  }
  
  const index = cell.dataset.index;
  makeMove(index, currentPlayer);

  if (gameActive && gameMode === 'pva' && currentPlayer === 'O') {
    statusText.textContent = "AI is thinking...";
    setTimeout(aiMove, 500);
  }
}

function makeMove(index, player) {
  if (!gameActive || cells[index] !== '') return;

  cells[index] = player;
  const cellText = board.children[index].querySelector('span');
  cellText.textContent = player;
  board.children[index].classList.add(player.toLowerCase());
  moveSound.play();

  if (checkWinner(cells, player)) {
    endGame(false);
  } else if (!cells.includes('')) {
    endGame(true);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

function endGame(isDraw) {
  gameActive = false;
  if (isDraw) {
    showPopup("It's a Draw!");
  } else {
    winSound.play();
    updateScore();
    const winnerName = (gameMode === 'pva' && currentPlayer === 'O') ? 'AI' : `Player ${currentPlayer}`;
    showPopup(`${winnerName} Wins!`);
  }
}

function checkWinner(boardState, player) {
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
      if (gameActive) { // Only highlight on the main board
          pattern.forEach(index => document.querySelector(`[data-index='${index}']`).classList.add('win'));
      }
      return true;
    }
  }
  return false;
}

// Scoring and Game Start/Reset
function updateScore() {
  if (currentPlayer === 'X') scoreX++;
  else scoreO++;
  scoreXText.textContent = scoreX;
  scoreOText.textContent = scoreO;
}

function showPopup(message) {
  document.getElementById('popup-message').textContent = message;
  document.getElementById('popup').style.display = 'flex';
}

function startGame() {
  // *** FIX: Stop the winning sound when a new game starts ***
  winSound.pause();
  winSound.currentTime = 0;

  cells.fill('');
  currentPlayer = 'X';
  gameActive = true;
  document.querySelectorAll('.cell').forEach(cell => {
    cell.querySelector('span').textContent = '';
    cell.classList.remove('win', 'x', 'o');
  });
  statusText.textContent = "Player X's Turn";
  document.getElementById('popup').style.display = 'none';
  // Set initial state based on selectors
  gameMode = gameModeSelect.value;
  difficulty = difficultySelect.value;
  difficultySetting.classList.toggle('hidden', gameMode !== 'pva');
}

// AI Logic
function aiMove() {
  if (!gameActive) return;

  let bestMove;
  const availableCells = cells.map((c, i) => c === '' ? i : null).filter(i => i !== null);

  if (difficulty === 'easy') {
    bestMove = availableCells[Math.floor(Math.random() * availableCells.length)];
  } else if (difficulty === 'moderate') {
    // 75% chance to play perfectly, 25% chance to play randomly
    if (Math.random() < 0.75) {
      bestMove = findBestMove();
    } else {
      bestMove = availableCells[Math.floor(Math.random() * availableCells.length)];
    }
  } else { // Hard difficulty
    bestMove = findBestMove();
  }
  makeMove(bestMove, 'O');
}

function findBestMove() {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (cells[i] === '') {
      cells[i] = 'O'; // AI is 'O'
      let score = minimax(cells, 0, false);
      cells[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

const scores = { 'X': -10, 'O': 10, 'draw': 0 };

function minimax(board, depth, isMaximizing) {
  if (checkWinner(board, 'O')) return scores['O'] - depth;
  if (checkWinner(board, 'X')) return scores['X'] + depth;
  if (!board.includes('')) return scores['draw'];

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        bestScore = Math.max(bestScore, minimax(board, depth + 1, false));
        board[i] = '';
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        bestScore = Math.min(bestScore, minimax(board, depth + 1, true));
        board[i] = '';
      }
    }
    return bestScore;
  }
}

// Initialize the game on page load
startGame();