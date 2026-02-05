// app/components/GameBoard.tsx
import styles from "../game.module.css";
import type { Cell, Player } from "../types";

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
  const isNeighborToCurrent = (targetCell: Cell) => {
    if (currentPlayerId === null) return false;
    const playerCells = grid.filter((c) => c.ownerId === currentPlayerId);
    return playerCells.some(
      (pc) =>
        Math.abs(pc.x - targetCell.x) + Math.abs(pc.y - targetCell.y) === 1,
    );
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // --- НОВА ФУНКЦІЯ: Отримати власника за координатами ---
  const getOwnerIdAt = (x: number, y: number): number | null => {
    // Перевірка на вихід за межі поля
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return -1; // -1 означає "межа карти"

    const cell = grid.find((c) => c.x === x && c.y === y);
    return cell ? cell.ownerId : null;
  };

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
          type="button"
          className={styles.button}
          style={{
            width: "auto",
            padding: "5px 15px",
            fontSize: "0.9rem",
            background: "#666",
          }}
          onClick={onToMenu}
        >
          В меню
        </button>
        <button
          type="button"
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

          const isNeighbor =
            currentPlayerId !== null && isNeighborToCurrent(cell);
          const isEnemy =
            cell.ownerId !== null && cell.ownerId !== currentPlayerId;
          const isTarget = phase === "MAP_SELECTION" && isNeighbor && isEnemy;

          // --- ЛОГІКА КОРДОНІВ ---
          // Ми малюємо кордон, якщо сусід має ІНШОГО власника (або це край карти)
          // Стиль кордону: товстий білий (або темний), якщо це межа регіону
          const borderStyle = "2px solid rgba(255, 255, 255, 0.6)"; // Напівпрозорий білий

          const topOwner = getOwnerIdAt(cell.x, cell.y - 1);
          const bottomOwner = getOwnerIdAt(cell.x, cell.y + 1);
          const leftOwner = getOwnerIdAt(cell.x - 1, cell.y);
          const rightOwner = getOwnerIdAt(cell.x + 1, cell.y);

          const styleObj = {
            backgroundColor: owner?.color || "#333",
            // Якщо власник сусіда не співпадає з поточним -> малюємо кордон
            borderTop: topOwner !== cell.ownerId ? borderStyle : "none",
            borderBottom: bottomOwner !== cell.ownerId ? borderStyle : "none",
            borderLeft: leftOwner !== cell.ownerId ? borderStyle : "none",
            borderRight: rightOwner !== cell.ownerId ? borderStyle : "none",
          };

          return (
            <div
              key={idx}
              className={`${styles.cell} ${isTarget ? styles.potentialTarget : ""}`}
              style={styleObj}
              onClick={() => onCellClick(cell)}
              title={owner?.name}
            >
              <span className={styles.cellText}>{owner?.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
