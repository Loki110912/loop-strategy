import { chooseDirection, chooseMove } from "./ai.js";
import { animateCollection, animatePickup, animateSowingStep, wait } from "./animation.js";
import { setupInput } from "./input.js";
import { createRenderer } from "./renderer.js";
import {
  DIRECTIONS,
  OPPONENT,
  PLAYER,
  createBoard,
  getLegalMoves,
  getNextCell,
  getOppositeCell,
  getOtherPlayer,
  getPlayerName,
  getSowingPath,
  hasLegalMoves,
  isFrontRow,
  isOwnCell,
} from "./utils.js";

const renderer = createRenderer();
let gameVersion = 0;
let state;

const AI_DELAYS = {
  BEFORE_TURN: 760,
  DIRECTION_DECISION: 430,
  AFTER_DIRECTION: 380,
  BETWEEN_CHAIN_RUNS: 470,
};

function newState() {
  return {
    board: createBoard(),
    currentPlayer: PLAYER,
    phase: "selecting-source",
    hand: 0,
    currentPos: null,
    winner: null,
    turn: 1,
    message: "Wähle ein eigenes Feld mit mindestens 2 Punkten.",
  };
}

function render(options) {
  renderer.renderGame(state, options);
}

function isCurrent(version) {
  return version === gameVersion && !state.winner;
}

function declareWinner(winner, message) {
  state.winner = winner;
  state.phase = "game-over";
  state.hand = 0;
  state.message = message;
  render();
}

function startNewGame() {
  gameVersion += 1;
  state = newState();
  render();
}

function verifyOpponentCanPlay(player) {
  const opponent = getOtherPlayer(player);
  if (hasLegalMoves(state.board, opponent)) {
    return false;
  }

  declareWinner(player, `${getPlayerName(opponent)} besitzt kein Feld mit mindestens 2 Punkten. ${getPlayerName(player)} gewinnt!`);
  return true;
}

function getDirectionLabel(direction) {
  return direction === DIRECTIONS.CLOCKWISE ? "im Uhrzeigersinn" : "gegen den Uhrzeigersinn";
}

async function letAiChooseDirectionAndSow(player, version) {
  state.phase = "ai-thinking";
  state.message = "Der Gegner wählt eine Richtung …";
  render();
  await wait(AI_DELAYS.DIRECTION_DECISION);

  if (!isCurrent(version)) {
    return;
  }

  const direction = chooseDirection(state.board, player, state.currentPos);
  state.message = `Der Gegner entscheidet sich für ${getDirectionLabel(direction)}.`;
  render();
  await wait(AI_DELAYS.AFTER_DIRECTION);

  if (isCurrent(version)) {
    await sowAndResolve(player, direction, version);
  }
}

async function beginMove(player, source, version) {
  const points = state.board[source.row][source.col];
  if (!isCurrent(version) || points < 2 || !isOwnCell(player, source)) {
    return;
  }

  state.board[source.row][source.col] = 0;
  state.currentPlayer = player;
  state.currentPos = source;
  state.hand = points;
  state.phase = "picking-up";
  state.message = `${getPlayerName(player)} nimmt ${points} Punkte auf.`;
  render();
  await animatePickup(renderer, state, source);

  if (!isCurrent(version)) {
    return;
  }

  if (player === PLAYER) {
    state.phase = "choosing-direction";
    state.message = `${state.hand} Punkte in der Hand. Wähle eine Richtung.`;
    render();
    return;
  }

  await letAiChooseDirectionAndSow(player, version);
}

async function resolveLanding(player, version) {
  const landing = state.currentPos;
  const collectedCells = [];
  let collected = 0;

  // Nach dem Ablegen bedeutet mehr als ein Punkt: Das Feld war vor dem Betreten nicht leer.
  if (state.board[landing.row][landing.col] > 1) {
    collected = state.board[landing.row][landing.col];
    state.board[landing.row][landing.col] = 0;
    collectedCells.push(landing);
  }

  let stolen = 0;
  if (isFrontRow(player, landing)) {
    const opposite = getOppositeCell(player, landing);
    if (state.board[opposite.row][opposite.col] > 0) {
      stolen = state.board[opposite.row][opposite.col];
      state.board[opposite.row][opposite.col] = 0;
      collectedCells.push(opposite);
    }
  }

  state.hand += collected + stolen;

  if (collectedCells.length > 0) {
    const parts = [];
    if (collected) parts.push(`${collected} aufgenommen`);
    if (stolen) parts.push(`${stolen} gestohlen`);
    state.message = `${getPlayerName(player)}: ${parts.join(", ")}.`;
    render();
    await animateCollection(renderer, state, collectedCells);
  }

  if (!isCurrent(version)) {
    return;
  }

  if (verifyOpponentCanPlay(player)) {
    return;
  }

  if (state.hand === 0) {
    await endTurn(player, version);
    return;
  }

  if (player === PLAYER) {
    state.phase = "choosing-direction";
    state.message = `${state.hand} Punkte in der Hand. Die Kette geht weiter – wähle eine Richtung.`;
    render();
    return;
  }

  state.phase = "ai-thinking";
  state.message = `Der Gegner plant den nächsten Lauf mit ${state.hand} Punkten …`;
  render();
  await wait(AI_DELAYS.BETWEEN_CHAIN_RUNS);

  if (isCurrent(version)) {
    await letAiChooseDirectionAndSow(player, version);
  }
}

async function sowAndResolve(player, direction, version) {
  if (!isCurrent(version) || state.hand === 0) {
    return;
  }

  state.phase = "sowing";
  state.message = `${getPlayerName(player)} verteilt Punkte ${getDirectionLabel(direction)}.`;
  render();

  while (state.hand > 0 && isCurrent(version)) {
    state.currentPos = getNextCell(player, state.currentPos, direction);
    state.board[state.currentPos.row][state.currentPos.col] += 1;
    state.hand -= 1;
    await animateSowingStep(renderer, state, state.currentPos);
  }

  if (isCurrent(version)) {
    await resolveLanding(player, version);
  }
}

async function endTurn(player, version) {
  if (!isCurrent(version)) {
    return;
  }

  const nextPlayer = getOtherPlayer(player);
  if (!hasLegalMoves(state.board, nextPlayer)) {
    declareWinner(player, `${getPlayerName(nextPlayer)} besitzt kein Feld mit mindestens 2 Punkten. ${getPlayerName(player)} gewinnt!`);
    return;
  }

  state.currentPlayer = nextPlayer;
  state.currentPos = null;
  state.turn += 1;
  state.hand = 0;

  if (nextPlayer === PLAYER) {
    state.phase = "selecting-source";
    state.message = "Dein Zug: Wähle ein eigenes Feld mit mindestens 2 Punkten.";
    render();
    return;
  }

  state.phase = "ai-thinking";
  state.message = "Der Gegner überlegt …";
  render();
  await wait(AI_DELAYS.BEFORE_TURN);

  if (isCurrent(version)) {
    await runOpponentTurn(version);
  }
}

async function runOpponentTurn(version) {
  const legalMoves = getLegalMoves(state.board, OPPONENT);
  if (!isCurrent(version)) {
    return;
  }

  if (legalMoves.length === 0) {
    declareWinner(PLAYER, "Der Gegner besitzt kein Feld mit mindestens 2 Punkten. Du gewinnst!");
    return;
  }

  const source = chooseMove(state.board, OPPONENT, legalMoves);
  await beginMove(OPPONENT, source, version);
}

function handleCellSelected(cell) {
  if (state.phase !== "selecting-source" || state.currentPlayer !== PLAYER) {
    return;
  }

  if (!isOwnCell(PLAYER, cell) || state.board[cell.row][cell.col] < 2) {
    state.message = "Wähle ein eigenes Feld mit mindestens 2 Punkten.";
    render();
    return;
  }

  void beginMove(PLAYER, cell, gameVersion);
}

function handleDirectionSelected(direction) {
  if (
    state.phase !== "choosing-direction"
    || state.currentPlayer !== PLAYER
    || !Object.values(DIRECTIONS).includes(direction)
  ) {
    return;
  }

  void sowAndResolve(PLAYER, direction, gameVersion);
}

function handleDirectionPreview(direction) {
  if (
    state.phase !== "choosing-direction"
    || state.currentPlayer !== PLAYER
    || state.hand === 0
    || !Object.values(DIRECTIONS).includes(direction)
  ) {
    return;
  }

  const path = getSowingPath(PLAYER, state.currentPos, direction, state.hand);
  render({ previewCells: path, previewTarget: path[path.length - 1] });
}

function clearDirectionPreview() {
  if (state.phase === "choosing-direction" && state.currentPlayer === PLAYER) {
    render();
  }
}

function handleEndTurn() {
  if (
    state.phase !== "choosing-direction"
    || state.currentPlayer !== PLAYER
    || state.hand === 0
  ) {
    return;
  }

  // Unverteilte Punkte bleiben im Spiel: Sie werden auf dem aktuellen Ruhepunkt abgelegt.
  state.board[state.currentPos.row][state.currentPos.col] += state.hand;
  state.hand = 0;
  state.phase = "ending-turn";
  state.message = "Du beendest den Zug und legst die übrigen Punkte ab.";
  render();
  void endTurn(PLAYER, gameVersion);
}

setupInput({
  onCellSelected: handleCellSelected,
  onDirectionSelected: handleDirectionSelected,
  onDirectionPreview: handleDirectionPreview,
  onDirectionPreviewEnd: clearDirectionPreview,
  onEndTurn: handleEndTurn,
  onRestart: startNewGame,
});

startNewGame();
