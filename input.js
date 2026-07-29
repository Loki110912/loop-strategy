export function setupInput({
  onCellSelected,
  onDirectionSelected,
  onDirectionPreview,
  onDirectionPreviewEnd,
  onEndTurn,
  onGameModeSelected,
  onDifficultySelected,
  onBackToModes,
  onOpenRules,
  onCloseRules,
  onPlayAgain,
  onReturnToMenu,
  onRestart,
}) {
  const onClick = (event) => {
    if (event.target.closest("[data-play-again]")) {
      onPlayAgain();
      return;
    }

    if (event.target.closest("[data-return-menu]")) {
      onReturnToMenu();
      return;
    }

    if (event.target.closest("[data-open-rules]")) {
      onOpenRules();
      return;
    }

    if (event.target.closest("[data-close-rules]")) {
      onCloseRules();
      return;
    }

    const modeButton = event.target.closest("[data-game-mode]");
    if (modeButton) {
      onGameModeSelected(modeButton.dataset.gameMode);
      return;
    }

    const difficultyButton = event.target.closest("[data-difficulty]");
    if (difficultyButton) {
      onDifficultySelected(difficultyButton.dataset.difficulty);
      return;
    }

    if (event.target.closest("#back-to-modes")) {
      onBackToModes();
      return;
    }

    const directionButton = event.target.closest("[data-direction]");
    if (directionButton) {
      onDirectionSelected(directionButton.dataset.direction);
      return;
    }

    if (event.target.closest("#end-turn")) {
      onEndTurn();
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

  const onPointerOver = (event) => {
    const directionButton = event.target.closest("[data-direction]");
    if (directionButton && !directionButton.contains(event.relatedTarget)) {
      onDirectionPreview(directionButton.dataset.direction);
    }
  };

  const onPointerOut = (event) => {
    const directionButton = event.target.closest("[data-direction]");
    if (directionButton && !directionButton.contains(event.relatedTarget)) {
      onDirectionPreviewEnd();
    }
  };

  const onFocusIn = (event) => {
    const directionButton = event.target.closest("[data-direction]");
    if (directionButton) {
      onDirectionPreview(directionButton.dataset.direction);
    }
  };

  const onFocusOut = (event) => {
    if (event.target.closest("[data-direction]")) {
      onDirectionPreviewEnd();
    }
  };

  document.addEventListener("click", onClick);
  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
  };
}
