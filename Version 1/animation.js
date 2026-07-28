export function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export async function animatePickup(renderer, state, cell) {
  renderer.renderGame(state, { activeCell: cell });
  await wait(220);
}

export async function animateSowingStep(renderer, state, cell) {
  renderer.renderGame(state, { activeCell: cell });
  await wait(210);
}

export async function animateCollection(renderer, state, collectedCells) {
  renderer.renderGame(state, { collectedCells });
  await wait(340);
}
