// app/components/MainMenu.tsx
import styles from "../game.module.css";
import type { GameSettings } from "../types";

interface PlayerConfig {
  name: string;
  color: string;
}

interface MainMenuProps {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  playerConfigs: PlayerConfig[];
  updatePlayerConfig: (
    index: number,
    field: keyof PlayerConfig,
    value: string,
  ) => void;
  onStart: () => void;
  onReset: () => void;
}

export default function MainMenu({
  settings,
  setSettings,
  playerConfigs,
  updatePlayerConfig,
  onStart,
  onReset,
}: MainMenuProps) {
  return (
    <div className={styles.menu}>
      <h1 style={{ textAlign: "center" }}>Налаштування гри</h1>

      <div className={styles.formGroup}>
        <label>
          Розмір поля ({settings.gridSize}x{settings.gridSize})
        </label>
        <input
          type="range"
          min="4"
          max="10"
          value={settings.gridSize}
          onChange={(e) =>
            setSettings({ ...settings, gridSize: Number(e.target.value) })
          }
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Кількість гравців ({settings.playerCount})</label>
        <input
          type="number"
          min="2"
          max={settings.gridSize * settings.gridSize}
          value={settings.playerCount}
          onChange={(e) =>
            setSettings({ ...settings, playerCount: Number(e.target.value) })
          }
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Гравці:</label>
        <div className={styles.playersList}>
          {playerConfigs.map((player, idx) => (
            <div key={idx} className={styles.playerRow}>
              <span>{idx + 1}.</span>
              <input
                type="text"
                value={player.name}
                onChange={(e) =>
                  updatePlayerConfig(idx, "name", e.target.value)
                }
                className={styles.playerNameInput}
                placeholder="Ім'я"
              />
              <input
                type="color"
                value={player.color}
                onChange={(e) =>
                  updatePlayerConfig(idx, "color", e.target.value)
                }
                className={styles.playerColorInput}
                title="Вибрати колір"
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Час на бій (сек): {settings.timeLimit}</label>
        <input
          type="number"
          min="10"
          max="120"
          value={settings.timeLimit}
          onChange={(e) =>
            setSettings({ ...settings, timeLimit: Number(e.target.value) })
          }
          className={styles.input}
        />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className={styles.button} onClick={onStart}>
          Почати гру
        </button>
        <button
          type="button"
          className={styles.button}
          style={{ background: "#d32f2f" }}
          onClick={onReset}
        >
          Скинути
        </button>
      </div>
    </div>
  );
}
