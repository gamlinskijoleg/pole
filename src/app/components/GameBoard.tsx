// app/components/GameBoard.tsx
import styles from "../game.module.css";
import { Player, Cell } from "../types";

interface GameBoardProps {
  grid: Cell[];
  players: Player[];
  currentPlayerId: number | null;
  phase: string;
  gridSize: number;
  onCellClick: (cell: Cell) => void;
  onReset: () => void;
  onToMenu: () => void;
}

export default function GameBoard({
  grid,
  players,
  currentPlayerId,
  phase,
  gridSize,
  onCellClick,
  onReset,
  onToMenu,
}: GameBoardProps) {
  // Допоміжна функція для візуалізації (чи є сусідом)
  // Дублюємо логіку візуально, щоб не тягнути її з батька,
  // або можна передати з батька функцію isNeighbor
  const isNeighborToCurrent = (targetCell: Cell) => {
    if (currentPlayerId === null) return false;
    const playerCells = grid.filter((c) => c.ownerId === currentPlayerId);
    return playerCells.some(
      (pc) =>
        Math.abs(pc.x - targetCell.x) + Math.abs(pc.y - targetCell.y) === 1,
    );
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <div className={styles.gameBoard}>
      <div
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          maxWidth: "500px",
          justifyContent: "space-between",
        }}
      >
        <button
          className={styles.button}
          style={{
            width: "auto",
            padding: "5px 15px",
            fontSize: "0.9rem",
            background: "#666",
          }}
          onClick={onToMenu}
        >
          В меню (Пауза)
        </button>
        <button
          className={styles.button}
          style={{
            width: "auto",
            padding: "5px 15px",
            fontSize: "0.9rem",
            background: "#d32f2f",
          }}
          onClick={onReset}
        >
          Почати знову
        </button>
      </div>

      <div className={styles.infoPanel}>
        <h2>
          Хід:{" "}
          <span style={{ color: currentPlayer?.color }}>
            {currentPlayer?.name}
          </span>
        </h2>
        <p>Територія: {currentPlayer?.cellsCount} кл.</p>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {grid.map((cell, idx) => {
          const owner = players.find((p) => p.id === cell.ownerId);

          // Логіка підсвітки
          const isNeighbor =
            currentPlayerId !== null && isNeighborToCurrent(cell);
          const isEnemy =
            cell.ownerId !== null && cell.ownerId !== currentPlayerId;
          const isTarget = phase === "MAP_SELECTION" && isNeighbor && isEnemy;

          return (
            <div
              key={idx}
              className={`${styles.cell} ${isTarget ? styles.potentialTarget : ""}`}
              style={{ backgroundColor: owner?.color || "#333" }}
              onClick={() => onCellClick(cell)}
              title={owner?.name}
            >
              <span className={styles.cellText}>
                {owner?.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
