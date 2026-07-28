export function setupInput({ onCellSelected, onDirectionSelected, onRestart }) {
  const onClick = (event) => {
    const directionButton = event.target.closest("[data-direction]");
    if (directionButton) {
      onDirectionSelected(directionButton.dataset.direction);
      return;
    }

    const cellButton = event.target.closest("[data-row][data-col]");
    if (cellButton) {
      onCellSelected({
        row: Number(cellButton.dataset.row),
        col: Number(cellButton.dataset.col),
      });
      return;
    }

    if (event.target.closest("#new-game")) {
      onRestart();
    }
  };

  document.addEventListener("click", onClick);

  return () => document.removeEventListener("click", onClick);
}
