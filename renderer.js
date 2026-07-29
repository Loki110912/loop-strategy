import {
  GAME_MODE_DETAILS,
  GAME_MODES,
  OPPONENT,
  PLAYER,
  getDifficultyLabel,
  getLegalMoves,
  getPlayerName,
  isFrontRow,
  sameCell,
} from "./utils.js";

function cellMarkup(board, row, col, state, options) {
  const owner = row < 2 ? PLAYER : OPPONENT;
  const cell = { row, col };
  const legalMoves = state.phase === "selecting-source" && state.currentPlayer === PLAYER
    ? getLegalMoves(board, PLAYER)
    : [];
  const isLegal = legalMoves.some((move) => sameCell(move, cell));
  const isCurrent = sameCell(state.currentPos, cell)
    && state.phase !== "selecting-source"
    && state.phase !== "game-over";
  const isActive = sameCell(options.activeCell, cell);
  const isCollected = options.collectedCells?.some((move) => sameCell(move, cell));
  const isPreviewed = options.previewCells?.some((move) => sameCell(move, cell));
  const isPreviewTarget = sameCell(options.previewTarget, cell);
  const classes = [
    "cell",
    `cell-${owner}`,
    isFrontRow(owner, cell) ? "cell-front" : "",
    isLegal ? "cell-legal" : "",
    isCurrent ? "cell-current" : "",
    isActive ? "cell-active" : "",
    isCollected ? "cell-collected" : "",
    isPreviewed ? "cell-preview" : "",
    isPreviewTarget ? "cell-preview-target" : "",
  ].filter(Boolean).join(" ");

  return `
    <button
      class="${classes}"
      type="button"
      data-row="${row}"
      data-col="${col}"
      data-position="${row + 1}.${col + 1}"
      aria-label="${getPlayerName(owner)}, Reihe ${row + 1}, Feld ${col + 1}: ${board[row][col]} Punkte"
      ${isLegal ? "" : "disabled"}
    >
      <span class="point-count">${board[row][col]}</span>
    </button>`;
}

function rowMarkup(board, row, state, options) {
  return `<div class="cell-row">${Array.from(
    { length: 5 },
    (_, col) => cellMarkup(board, row, col, state, options),
  ).join("")}</div>`;
}

function createConfettiMarkup() {
  const colors = ["#f5c36a", "#82d8b7", "#e58772", "#9ba8ff", "#f4f0e7"];

  return Array.from({ length: 36 }, (_, index) => {
    const left = (index * 37) % 100;
    const drift = ((index * 29) % 34) - 17;
    const delay = 520 + ((index * 83) % 760);
    const duration = 2700 + ((index * 71) % 900);
    const color = colors[index % colors.length];
    return `<span style="--confetti-left:${left}%; --confetti-drift:${drift}px; --confetti-delay:${delay}ms; --confetti-duration:${duration}ms; --confetti-color:${color}"></span>`;
  }).join("");
}

export function createRenderer(documentRoot = document) {
  const boardElement = documentRoot.querySelector("#board");
  const turnLabel = documentRoot.querySelector("#turn-label");
  const message = documentRoot.querySelector("#game-message");
  const handCount = documentRoot.querySelector("#hand-count");
  const directionButtons = [...documentRoot.querySelectorAll("[data-direction]")];
  const endTurnButton = documentRoot.querySelector("#end-turn");
  const menuScreen = documentRoot.querySelector("#menu-screen");
  const rulesScreen = documentRoot.querySelector("#rules-screen");
  const endScreen = documentRoot.querySelector("#end-screen");
  const gameScreen = documentRoot.querySelector("#game-screen");
  const modeSelection = documentRoot.querySelector("#mode-selection");
  const difficultySelection = documentRoot.querySelector("#difficulty-selection");
  const modeLabel = documentRoot.querySelector("#mode-label");
  const difficultyLabel = documentRoot.querySelector("#difficulty-label");
  const scorePanel = documentRoot.querySelector("#score-panel");
  const playerScore = documentRoot.querySelector("#player-score");
  const opponentScore = documentRoot.querySelector("#opponent-score");
  const endEyebrow = documentRoot.querySelector("#end-eyebrow");
  const endTitle = documentRoot.querySelector("#end-title");
  const endMessage = documentRoot.querySelector("#end-message");
  const endMode = documentRoot.querySelector("#end-mode");
  const endDifficulty = documentRoot.querySelector("#end-difficulty");
  const endDuration = documentRoot.querySelector("#end-duration");
  const endMoves = documentRoot.querySelector("#end-moves");
  const endStolen = documentRoot.querySelector("#end-stolen");
  const endLongestRun = documentRoot.querySelector("#end-longest-run");
  const confettiLayer = documentRoot.querySelector("#confetti-layer");

  function showModeSelection() {
    menuScreen.hidden = false;
    rulesScreen.hidden = true;
    endScreen.hidden = true;
    gameScreen.hidden = true;
    modeSelection.hidden = false;
    difficultySelection.hidden = true;
  }

  function showDifficultySelection() {
    menuScreen.hidden = false;
    rulesScreen.hidden = true;
    endScreen.hidden = true;
    gameScreen.hidden = true;
    modeSelection.hidden = true;
    difficultySelection.hidden = false;
  }

  function showGame() {
    menuScreen.hidden = true;
    rulesScreen.hidden = true;
    endScreen.hidden = true;
    gameScreen.hidden = false;
  }

  function showRules() {
    menuScreen.hidden = true;
    gameScreen.hidden = true;
    endScreen.hidden = true;
    rulesScreen.hidden = false;
  }

  function showEndScreen(summary) {
    menuScreen.hidden = true;
    rulesScreen.hidden = true;
    gameScreen.hidden = true;
    endScreen.classList.toggle("end-screen-win", summary.playerWon);
    endScreen.classList.toggle("end-screen-loss", !summary.playerWon);
    endEyebrow.textContent = summary.playerWon ? "Partie gewonnen" : "Partie beendet";
    endTitle.textContent = summary.title;
    endMessage.textContent = summary.message;
    endMode.textContent = summary.stats.mode;
    endDifficulty.textContent = summary.stats.difficulty;
    endDuration.textContent = summary.stats.duration;
    endMoves.textContent = summary.stats.moves;
    endStolen.textContent = summary.stats.stolen;
    endLongestRun.textContent = summary.stats.longestRun;
    confettiLayer.innerHTML = summary.playerWon ? createConfettiMarkup() : "";
    endScreen.hidden = false;
  }

  function renderGame(state, options = {}) {
    const [board] = [state.board];
    boardElement.innerHTML = `
      <section class="side side-opponent" aria-label="Gegnerische Felder">
        <h2 class="side-heading">Gegner</h2>
        ${rowMarkup(board, 2, state, options)}
        ${rowMarkup(board, 3, state, options)}
      </section>
      <section class="side side-player" aria-label="Eigene Felder">
        ${rowMarkup(board, 0, state, options)}
        ${rowMarkup(board, 1, state, options)}
        <h2 class="side-heading">Spieler</h2>
      </section>`;

    turnLabel.textContent = state.winner ? `${getPlayerName(state.winner)} gewinnt` : getPlayerName(state.currentPlayer);
    turnLabel.style.color = state.winner === OPPONENT || state.currentPlayer === OPPONENT
      ? "var(--opponent)"
      : "var(--player)";
    message.textContent = state.message;
    handCount.textContent = state.hand;
    modeLabel.textContent = `Modus: ${GAME_MODE_DETAILS[state.mode].label}`;
    difficultyLabel.textContent = `KI: ${getDifficultyLabel(state.difficulty)}`;

    const isPointHunt = state.mode === GAME_MODES.POINT_HUNT;
    scorePanel.hidden = !isPointHunt;
    if (isPointHunt) {
      playerScore.textContent = state.scores[PLAYER];
      opponentScore.textContent = state.scores[OPPONENT];
    }

    const playerCanChooseDirection = state.phase === "choosing-direction" && state.currentPlayer === PLAYER;
    directionButtons.forEach((button) => {
      button.disabled = !playerCanChooseDirection;
      const isSelected = playerCanChooseDirection && state.selectedDirection === button.dataset.direction;
      button.classList.toggle("direction-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    const playerCanEndTurn = playerCanChooseDirection && state.hand > 0;
    endTurnButton.hidden = !playerCanEndTurn;
    endTurnButton.disabled = !playerCanEndTurn;
  }

  return {
    renderGame,
    showDifficultySelection,
    showEndScreen,
    showGame,
    showModeSelection,
    showRules,
  };
}
