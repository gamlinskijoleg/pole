// app/components/GameSidebar.tsx
import styles from "../game.module.css";
import type { BattleRecord, Player } from "../types";

interface GameSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  battleLog: BattleRecord[];
  players: Player[];
  isGameOver: boolean;
}

export default function GameSidebar({
  isOpen,
  onClose,
  battleLog,
  players,
  isGameOver,
}: GameSidebarProps) {
  // Функція для розрахунку статистики
  const calculateStats = () => {
    const stats: Record<
      string,
      { wins: number; totalScore: number; battles: number }
    > = {};

    // Ініціалізація
    players.forEach((p) => {
      // Враховуємо навіть мертвих гравців для історії
      stats[p.name] = { wins: 0, totalScore: 0, battles: 0 };
    });

    battleLog.forEach((record) => {
      if (!stats[record.attackerName])
        stats[record.attackerName] = { wins: 0, totalScore: 0, battles: 0 };
      if (!stats[record.defenderName])
        stats[record.defenderName] = { wins: 0, totalScore: 0, battles: 0 };

      stats[record.attackerName].battles += 1;
      stats[record.attackerName].totalScore += record.attackerScore;

      stats[record.defenderName].battles += 1;
      stats[record.defenderName].totalScore += record.defenderScore;

      if (stats[record.winnerName]) {
        stats[record.winnerName].wins += 1;
      }
    });

    return Object.entries(stats).sort((a, b) => b[1].wins - a[1].wins); // Сортуємо по перемогах
  };

  return (
    <>
      <div
        className={`${styles.sidebarOverlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>
            {isGameOver ? "🏆 Статистика" : "📜 Хід гри"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {isGameOver ? (
          /* --- СТАТИСТИКА ПІСЛЯ ГРИ --- */
          <div>
            {calculateStats().map(([name, stat], idx) => (
              <div
                key={name}
                className={styles.logItem}
                style={{ borderColor: idx === 0 ? "#f1c40f" : "#eee" }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  {idx + 1}. {name} {idx === 0 && "👑"}
                </div>
                <div className={styles.statRow}>
                  <span>Перемог у битвах:</span> <strong>{stat.wins}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Всього битв:</span> <strong>{stat.battles}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Правильних відповідей:</span>{" "}
                  <strong>{stat.totalScore}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- ЛОГ ПІД ЧАС ГРИ --- */
          <div>
            {battleLog.length === 0 && (
              <p style={{ color: "#888", textAlign: "center" }}>
                Битв ще не було...
              </p>
            )}

            {[...battleLog].reverse().map((record) => (
              <div key={record.id} className={styles.logItem}>
                <div className={styles.logHeader}>
                  <span>⚔️ {record.category}</span>
                  <span style={{ fontSize: "0.8rem", color: "#999" }}>
                    {record.duration} сек
                  </span>
                </div>
                <div style={{ marginBottom: "5px" }}>
                  <span
                    style={{
                      color:
                        record.winnerName === record.attackerName
                          ? "green"
                          : "black",
                    }}
                  >
                    {record.attackerName}
                  </span>
                  {" vs "}
                  <span
                    style={{
                      color:
                        record.winnerName === record.defenderName
                          ? "green"
                          : "black",
                    }}
                  >
                    {record.defenderName}
                  </span>
                </div>
                <div className={styles.logScore}>
                  <span>Рахунок (правильних):</span>
                  <strong>
                    {record.attackerScore} : {record.defenderScore}
                  </strong>
                </div>
                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "0.85rem",
                    color: "#28a745",
                  }}
                >
                  Переможець: {record.winnerName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
