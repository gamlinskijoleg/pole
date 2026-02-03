// app/components/BattleModal.tsx
import styles from "../game.module.css";
import { Player, Question } from "../types";

interface BattleData {
  attackerId: number;
  defenderId: number;
  attackerTime: number;
  defenderTime: number;
  currentTurnId: number;
  question: Question | null;
  penaltyUntil: number | null;
}

interface BattleModalProps {
  battleData: BattleData;
  players: Player[];
  onAnswer: (idx: number) => void;
}

export default function BattleModal({
  battleData,
  players,
  onAnswer,
}: BattleModalProps) {
  const attacker = players.find((p) => p.id === battleData.attackerId);
  const defender = players.find((p) => p.id === battleData.defenderId);

  const isPenaltyActive =
    !!battleData.penaltyUntil && Date.now() < battleData.penaltyUntil;

  return (
    <div className={styles.battleOverlay}>
      <div className={styles.battleCard}>
        <h2>⚔️ БИТВА ⚔️</h2>

        <div className={styles.timers}>
          <div
            className={
              battleData.currentTurnId === battleData.attackerId
                ? styles.activeTimer
                : ""
            }
            style={{ color: attacker?.color }}
          >
            {attacker?.name}
            <br />
            {battleData.attackerTime}с
          </div>
          <div>vs</div>
          <div
            className={
              battleData.currentTurnId === battleData.defenderId
                ? styles.activeTimer
                : ""
            }
            style={{ color: defender?.color }}
          >
            {defender?.name}
            <br />
            {battleData.defenderTime}с
          </div>
        </div>

        <div className={styles.questionBox}>
          <p>
            <strong>Питання:</strong>
          </p>
          <h3>{battleData.question?.text}</h3>
        </div>

        <div className={styles.answersGrid}>
          {battleData.question?.answers.map((ans, idx) => (
            <button
              key={idx}
              className={styles.answerBtn}
              onClick={() => onAnswer(idx)}
              disabled={isPenaltyActive}
            >
              {ans}
            </button>
          ))}
        </div>

        {isPenaltyActive && (
          <div className={styles.penaltyOverlay}>❌ ПОМИЛКА! ШТРАФ...</div>
        )}
      </div>
    </div>
  );
}
