import {
  DIRECTIONS,
  getCellValue,
  getNextCell,
  getOppositeCell,
  isFrontRow,
} from "./utils.js";

function directionScore(board, player, from, direction) {
  const landing = getNextCell(player, from, direction);
  let score = getCellValue(board, landing) * 2;

  if (isFrontRow(player, landing)) {
    const opposite = getOppositeCell(player, landing);
    score += getCellValue(board, opposite) * 4;
  }

  // Ein leeres Feld beendet die Kette wahrscheinlich sofort.
  if (getCellValue(board, landing) === 0) {
    score -= 1;
  }

  return score;
}

export function chooseMove(board, player, legalMoves) {
  return [...legalMoves].sort((left, right) => {
    const rightScore = getCellValue(board, right) + (isFrontRow(player, right) ? 0.25 : 0);
    const leftScore = getCellValue(board, left) + (isFrontRow(player, left) ? 0.25 : 0);
    return rightScore - leftScore || left.col - right.col;
  })[0];
}

export function chooseDirection(board, player, from) {
  const clockwiseScore = directionScore(board, player, from, DIRECTIONS.CLOCKWISE);
  const counterclockwiseScore = directionScore(board, player, from, DIRECTIONS.COUNTERCLOCKWISE);

  return clockwiseScore >= counterclockwiseScore
    ? DIRECTIONS.CLOCKWISE
    : DIRECTIONS.COUNTERCLOCKWISE;
}
