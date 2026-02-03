// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./game.module.css";
import { Player, Cell, GameSettings, Question, MOCK_QUESTIONS, QuestionCategory } from "./types";

import MainMenu from "./components/MainMenu";
import GameBoard from "./components/GameBoard";
import BattleModal from "./components/BattleModal";
import TopicSelection from "./components/TopicSelection";
import QuestionsEditor from "./components/QuestionsEditor";

type GamePhase = 'MENU' | 'EDITOR' | 'MAP_SELECTION' | 'TOPIC_SELECTION' | 'BATTLE' | 'GAME_OVER';

interface PlayerConfig {
  name: string;
  color: string;
}

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const STORAGE_KEY = "pole_game_save_v3";

export default function PoleGame() {
  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("MENU");

  const [settings, setSettings] = useState<GameSettings>({
    gridSize: 5,
    playerCount: 2,
    timeLimit: 45,
  });

  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: "Гравець 1", color: "#FF5733" },
    { name: "Гравець 2", color: "#33FF57" },
  ]);

  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

  const [pendingBattle, setPendingBattle] = useState<{ attackerId: number, defenderId: number } | null>(null);

  const [battleData, setBattleData] = useState<{
    attackerId: number;
    defenderId: number;
    attackerTime: number;
    defenderTime: number;
    currentTurnId: number;
    question: Question | null;
    penaltyUntil: number | null;
    category: QuestionCategory;
  } | null>(null);

  const allQuestions = [...MOCK_QUESTIONS, ...customQuestions];

  // --- STORAGE & SYNC LOGIC ---

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPhase(parsed.phase);
        setSettings(parsed.settings);
        setPlayerConfigs(parsed.playerConfigs);
        setPlayers(parsed.players);
        setGrid(parsed.grid);
        setCurrentPlayerId(parsed.currentPlayerId);
        setBattleData(parsed.battleData);
        setPendingBattle(parsed.pendingBattle);
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      phase, settings, playerConfigs, players, grid, currentPlayerId, battleData, pendingBattle,
      customQuestions // Зберігаємо власні питання
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [phase, settings, playerConfigs, players, grid, currentPlayerId, battleData, pendingBattle, customQuestions, isLoaded]);

  // Синхронізація кількості конфігурацій гравців
  useEffect(() => {
    if (!isLoaded) return;
    setPlayerConfigs((prev) => {
      if (prev.length === settings.playerCount) return prev;
      const newConfigs = [...prev];
      if (settings.playerCount > prev.length) {
        for (let i = prev.length; i < settings.playerCount; i++) {
          newConfigs.push({
            name: `Гравець ${i + 1}`,
            color: getRandomColor(),
          });
        }
      } else if (settings.playerCount < prev.length) {
        return newConfigs.slice(0, settings.playerCount);
      }
      return newConfigs;
    });
  }, [settings.playerCount, isLoaded]);

  const updatePlayerConfig = (
    index: number,
    field: keyof PlayerConfig,
    value: string,
  ) => {
    const newConfigs = [...playerConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setPlayerConfigs(newConfigs);
  };

  const resetGame = () => {
    if (confirm("Всі дані буде видалено. Продовжити?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  // --- GAME LOGIC HELPER ---
  const isNeighborToPlayer = (targetCell: Cell, playerId: number) => {
    const playerCells = grid.filter((c) => c.ownerId === playerId);
    return playerCells.some(
      (pc) =>
        Math.abs(pc.x - targetCell.x) + Math.abs(pc.y - targetCell.y) === 1,
    );
  };

  // --- START GAME LOGIC ---
  const startGame = () => {
    const totalCells = settings.gridSize * settings.gridSize;
    if (settings.playerCount > totalCells) {
      alert(`Максимум ${totalCells} гравців!`);
      return;
    }

    // 1. Створення пустої сітки
    let newGrid: Cell[] = [];
    for (let y = 0; y < settings.gridSize; y++) {
      for (let x = 0; x < settings.gridSize; x++) {
        newGrid.push({ x, y, ownerId: null });
      }
    }

    const newPlayers: Player[] = playerConfigs.map((cfg, i) => ({
      id: i,
      name: cfg.name,
      color: cfg.color,
      isAlive: true,
      cellsCount: 0,
    }));

    // 2. Розставляння "зерен" (ПОКРАЩЕНО)
    // Спершу пробуємо випадково, якщо не виходить - шукаємо першу вільну
    let placedSeeds = 0;

    // Перемішуємо індекси сітки, щоб випадковий вибір був без колізій
    let availableIndices = Array.from({ length: newGrid.length }, (_, i) => i);
    // Функція shuffle
    availableIndices.sort(() => Math.random() - 0.5);

    while (placedSeeds < newPlayers.length && availableIndices.length > 0) {
      const idx = availableIndices.pop();
      if (idx !== undefined) {
        newGrid[idx].ownerId = placedSeeds;
        placedSeeds++;
      }
    }

    // 3. Region Growing (Заповнення порожнечі)
    let emptyCells = newGrid.filter((c) => c.ownerId === null).length;
    let safeguard = 0;

    while (emptyCells > 0 && safeguard < 1000) {
      safeguard++;
      for (let pid = 0; pid < newPlayers.length; pid++) {
        const playerCells = newGrid.filter((c) => c.ownerId === pid);
        const neighbors: number[] = [];

        playerCells.forEach((cell) => {
          [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
          ].forEach((offset) => {
            const idx = newGrid.findIndex(
              (c) => c.x === cell.x + offset.x && c.y === cell.y + offset.y,
            );
            if (idx !== -1 && newGrid[idx].ownerId === null)
              neighbors.push(idx);
          });
        });

        if (neighbors.length > 0) {
          // Захоплюємо випадкового вільного сусіда
          newGrid[
            neighbors[Math.floor(Math.random() * neighbors.length)]
          ].ownerId = pid;
          emptyCells--;
          if (emptyCells === 0) break;
        }
      }

      // Fallback: якщо ніхто не має сусідів, але є пусті клітинки (ізольовані)
      if (emptyCells > 0 && emptyCells === newGrid.filter((c) => c.ownerId === null).length) {
        const remainingIdx = newGrid.findIndex((c) => c.ownerId === null);
        if (remainingIdx !== -1) {
          // Віддаємо першому живому
          newGrid[remainingIdx].ownerId = 0;
          emptyCells--;
        }
      }
    }

    newPlayers.forEach((p) => {
      p.cellsCount = newGrid.filter((c) => c.ownerId === p.id).length;
    });
    setPlayers(newPlayers);
    setGrid(newGrid);
    setCurrentPlayerId(Math.floor(Math.random() * newPlayers.length));

    // Очищаємо будь-які старі стани битви
    setPendingBattle(null);
    setBattleData(null);

    setPhase("MAP_SELECTION");
  };

  // --- HANDLERS FOR EDITOR ---
  const handleSaveQuestion = (q: Question) => {
    setCustomQuestions(prev => [...prev, q]);
  };
  const handleDeleteQuestion = (id: number) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };

  // --- ACTION HANDLERS ---

  const handleCellClick = (cell: Cell) => {
    if (phase !== "MAP_SELECTION" || currentPlayerId === null) return;
    if (cell.ownerId === currentPlayerId) return;
    if (cell.ownerId !== null && isNeighborToPlayer(cell, currentPlayerId)) {
      setPendingBattle({
        attackerId: currentPlayerId,
        defenderId: cell.ownerId,
      });
      setPhase("TOPIC_SELECTION");
    }
  };

  const getRandomQuestion = (category?: QuestionCategory) => {
    let source = allQuestions;
    if (category) {
      const filtered = source.filter((q) => q.category === category);
      if (filtered.length > 0) source = filtered;
    }
    return source[Math.floor(Math.random() * source.length)];
  };

  const handleTopicSelect = (category: QuestionCategory) => {
    if (!pendingBattle) return;

    // ВАЖЛИВО: Тут ми явно беремо settings.timeLimit, щоб гарантувати актуальність
    setBattleData({
      attackerId: pendingBattle.attackerId,
      defenderId: pendingBattle.defenderId,
      attackerTime: settings.timeLimit,
      defenderTime: settings.timeLimit,
      currentTurnId: pendingBattle.attackerId,
      category: category,
      question: getRandomQuestion(category),
      penaltyUntil: null,
    });

    setPendingBattle(null);
    setPhase("BATTLE");
  };

  const handleAnswer = (idx: number) => {
    if (!battleData || !battleData.question) return;
    if (battleData.penaltyUntil && Date.now() < battleData.penaltyUntil) return;

    if (idx === battleData.question.correctIndex) {
      const nextPlayer =
        battleData.currentTurnId === battleData.attackerId
          ? battleData.defenderId
          : battleData.attackerId;
      setBattleData((prev) => ({
        ...prev!,
        currentTurnId: nextPlayer,
        question: getRandomQuestion(prev!.category),
      }));
    } else {
      setBattleData((prev) => ({
        ...prev!,
        penaltyUntil: Date.now() + 3000,
        question: getRandomQuestion(prev!.category),
      }));
    }
  };

  const endBattle = (winnerId: number, loserId: number) => {
    setPhase((currentPhase) => {
      if (currentPhase !== "BATTLE") return currentPhase;
      const newGrid = grid.map((cell) => ({
        ...cell,
        ownerId: cell.ownerId === loserId ? winnerId : cell.ownerId,
      }));
      const newPlayers = players.map((p) => {
        if (p.id === loserId) return { ...p, isAlive: false, cellsCount: 0 };
        if (p.id === winnerId)
          return {
            ...p,
            cellsCount: newGrid.filter((c) => c.ownerId === winnerId).length,
          };
        return p;
      });
      setGrid(newGrid);
      setPlayers(newPlayers);

      const alive = newPlayers.filter((p) => p.isAlive);
      if (alive.length === 1) return "GAME_OVER";
      else {
        setCurrentPlayerId(winnerId);
        return "MAP_SELECTION";
      }
    });
    setBattleData(null);
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "BATTLE" && battleData) {
      interval = setInterval(() => {
        setBattleData((prev) => {
          if (!prev) return null;
          if (prev.currentTurnId === prev.attackerId) {
            if (prev.attackerTime <= 0) {
              endBattle(prev.defenderId, prev.attackerId);
              return prev;
            }
            return { ...prev, attackerTime: prev.attackerTime - 1 };
          } else {
            if (prev.defenderTime <= 0) {
              endBattle(prev.attackerId, prev.defenderId);
              return prev;
            }
            return { ...prev, defenderTime: prev.defenderTime - 1 };
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, battleData?.currentTurnId]);

  if (!isLoaded) return <div className={styles.container}>Завантаження...</div>;

  return (
    <div className={styles.container}>
      {phase === "MENU" && (
        <>
          <MainMenu
            settings={settings} setSettings={setSettings}
            playerConfigs={playerConfigs} updatePlayerConfig={updatePlayerConfig}
            onStart={startGame} onReset={resetGame}
          />
          {/* Кнопка редактора питань */}
          <div style={{ marginTop: '10px' }}>
            <button
              className={styles.button}
              style={{ background: '#6f42c1' }}
              onClick={() => setPhase('EDITOR')}
            >
              📝 Редактор питань та тем
            </button>
          </div>
        </>
      )}

      {/* Фаза редактора */}
      {phase === "EDITOR" && (
        <QuestionsEditor
          customQuestions={customQuestions}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
          onBack={() => setPhase("MENU")}
        />
      )}

      {(phase === "MAP_SELECTION" || phase === "BATTLE" || phase === "TOPIC_SELECTION") && (
        <GameBoard
          grid={grid}
          players={players}
          currentPlayerId={currentPlayerId}
          phase={phase}
          gridSize={settings.gridSize}
          onCellClick={handleCellClick}
          onReset={resetGame}
          onToMenu={() => setPhase("MENU")}
        />
      )}

      {phase === "TOPIC_SELECTION" && pendingBattle && (
        <TopicSelection
          attackerId={pendingBattle.attackerId}
          defenderId={pendingBattle.defenderId}
          players={players}
          onSelect={handleTopicSelect}
          allQuestions={allQuestions}
        />
      )}

      {phase === "BATTLE" && battleData && (
        <BattleModal
          battleData={battleData}
          players={players}
          onAnswer={handleAnswer}
        />
      )}

      {phase === "GAME_OVER" && (
        <div className={styles.menu}>
          <h1 style={{ textAlign: "center" }}>🏆 Перемога! 🏆</h1>
          <h2
            style={{
              color: players.find((p) => p.isAlive)?.color,
              textAlign: "center",
              fontSize: "2rem",
            }}
          >
            {players.find((p) => p.isAlive)?.name}
          </h2>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button className={styles.button} onClick={() => setPhase("MENU")}>
              В меню
            </button>
            <button
              className={styles.button}
              style={{ background: "#d32f2f" }}
              onClick={resetGame}
            >
              Нова гра
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
