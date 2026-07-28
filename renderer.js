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

export function createRenderer(documentRoot = document) {
  const boardElement = documentRoot.querySelector("#board");
  const turnLabel = documentRoot.querySelector("#turn-label");
  const message = documentRoot.querySelector("#game-message");
  const handCount = documentRoot.querySelector("#hand-count");
  const directionButtons = [...documentRoot.querySelectorAll("[data-direction]")];
  const endTurnButton = documentRoot.querySelector("#end-turn");
  const menuScreen = documentRoot.querySelector("#menu-screen");
  const gameScreen = documentRoot.querySelector("#game-screen");
  const modeSelection = documentRoot.querySelector("#mode-selection");
  const difficultySelection = documentRoot.querySelector("#difficulty-selection");
  const modeLabel = documentRoot.querySelector("#mode-label");
  const difficultyLabel = documentRoot.querySelector("#difficulty-label");
  const scorePanel = documentRoot.querySelector("#score-panel");
  const playerScore = documentRoot.querySelector("#player-score");
  const opponentScore = documentRoot.querySelector("#opponent-score");

  function showModeSelection() {
    menuScreen.hidden = false;
    gameScreen.hidden = true;
    modeSelection.hidden = false;
    difficultySelection.hidden = true;
  }

  function showDifficultySelection() {
    menuScreen.hidden = false;
    gameScreen.hidden = true;
    modeSelection.hidden = true;
    difficultySelection.hidden = false;
  }

  function showGame() {
    menuScreen.hidden = true;
    gameScreen.hidden = false;
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

  return { renderGame, showDifficultySelection, showGame, showModeSelection };
}
