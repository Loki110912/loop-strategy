export const PLAYER = "player";
export const OPPONENT = "opponent";

export const DIRECTIONS = {
  CLOCKWISE: "clockwise",
  COUNTERCLOCKWISE: "counterclockwise",
};

const makeCell = (row, col) => ({ row, col });

// Jede Seite besitzt eine eigene geschlossene Strecke aus zwei Reihen mit je fünf Feldern.
// Die letzte Zelle einer Reihe verbindet sich mit der letzten Zelle der anderen Reihe.
export const TRACKS = {
  [PLAYER]: [
    ...Array.from({ length: 5 }, (_, col) => makeCell(0, col)),
    ...Array.from({ length: 5 }, (_, index) => makeCell(1, 4 - index)),
  ],
  [OPPONENT]: [
    ...Array.from({ length: 5 }, (_, col) => makeCell(3, col)),
    ...Array.from({ length: 5 }, (_, index) => makeCell(2, 4 - index)),
  ],
};

export function createBoard() {
  return Array.from({ length: 4 }, () => Array(5).fill(2));
}

export function getOtherPlayer(player) {
  return player === PLAYER ? OPPONENT : PLAYER;
}

export function getPlayerName(player) {
  return player === PLAYER ? "Spieler" : "Gegner";
}

export function isOwnCell(player, cell) {
  return player === PLAYER ? cell.row < 2 : cell.row >= 2;
}

export function isFrontRow(player, cell) {
  return player === PLAYER ? cell.row === 1 : cell.row === 2;
}

export function getOppositeCell(player, cell) {
  if (!isFrontRow(player, cell)) {
    return null;
  }

  return makeCell(player === PLAYER ? 2 : 1, cell.col);
}

export function getNextCell(player, currentCell, direction) {
  const track = TRACKS[player];
  const index = track.findIndex(
    (cell) => cell.row === currentCell.row && cell.col === currentCell.col,
  );

  if (index === -1) {
    throw new Error("Die aktuelle Position liegt nicht auf der eigenen Strecke.");
  }

  const offset = direction === DIRECTIONS.CLOCKWISE ? 1 : -1;
  return track[(index + offset + track.length) % track.length];
}

export function getLegalMoves(board, player) {
  return TRACKS[player].filter((cell) => board[cell.row][cell.col] >= 2);
}

export function hasLegalMoves(board, player) {
  return getLegalMoves(board, player).length > 0;
}

export function getCellValue(board, cell) {
  return board[cell.row][cell.col];
}

export function sameCell(left, right) {
  return Boolean(left && right && left.row === right.row && left.col === right.col);
}
