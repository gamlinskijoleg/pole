// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./game.module.css";
import { Player, Cell, GameSettings, Question, MOCK_QUESTIONS, QuestionCategory, BattleRecord } from "./types";

import MainMenu from "./components/MainMenu";
import GameBoard from "./components/GameBoard";
import BattleModal from "./components/BattleModal";
import TopicSelection from "./components/TopicSelection";
import QuestionsEditor from "./components/QuestionsEditor";
import GameSidebar from "./components/GameSidebar";

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

const STORAGE_KEY = "pole_game_save_v5_stats";

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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

  const [battleLog, setBattleLog] = useState<BattleRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    attackerScore: number;
    defenderScore: number;
  } | null>(null);

  // --- 1. ЗАВАНТАЖЕННЯ ---
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
        setBattleLog(parsed.battleLog || []);

        if (parsed.questions && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
        } else {
          setQuestions(MOCK_QUESTIONS);
        }
      } catch (e) {
        console.error("Error loading save:", e);
        setQuestions(MOCK_QUESTIONS);
      }
    } else {
      setQuestions(MOCK_QUESTIONS);
    }
    setIsLoaded(true);
  }, []);

  // --- 2. ЗБЕРЕЖЕННЯ ---
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      phase, settings, playerConfigs, players, grid, currentPlayerId, battleData, pendingBattle, questions,
      battleLog
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [phase, settings, playerConfigs, players, grid, currentPlayerId, battleData, pendingBattle, questions, battleLog, isLoaded]);

  // Сінхронізація гравців
  useEffect(() => {
    if (!isLoaded) return;
    setPlayerConfigs((prev) => {
      if (prev.length === settings.playerCount) return prev;
      const newConfigs = [...prev];
      if (settings.playerCount > prev.length) {
        for (let i = prev.length; i < settings.playerCount; i++) {
          newConfigs.push({ name: `Гравець ${i + 1}`, color: getRandomColor() });
        }
      } else if (settings.playerCount < prev.length) {
        return newConfigs.slice(0, settings.playerCount);
      }
      return newConfigs;
    });
  }, [settings.playerCount, isLoaded]);

  const updatePlayerConfig = (index: number, field: keyof PlayerConfig, value: string) => {
    const newConfigs = [...playerConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setPlayerConfigs(newConfigs);
  };

  const resetGame = () => {
    if (confirm("Скинути прогрес партії?")) {
      setPhase("MENU");
      setGrid([]);
      setPlayers([]);
      setCurrentPlayerId(null);
      setBattleData(null);
      setPendingBattle(null);
      setBattleLog([]);
    }
  };

  const factoryReset = () => {
    if (confirm("УВАГА! Це видалить ВСІ ваші питання і відновить стандартні. Ви впевнені?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handleSaveQuestion = (q: Question) => {
    setQuestions(prev => {
      const exists = prev.find(item => item.id === q.id);
      return exists ? prev.map(item => item.id === q.id ? q : item) : [...prev, q];
    });
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const isNeighborToPlayer = (targetCell: Cell, playerId: number) => {
    const playerCells = grid.filter((c) => c.ownerId === playerId);
    return playerCells.some(
      (pc) => Math.abs(pc.x - targetCell.x) + Math.abs(pc.y - targetCell.y) === 1,
    );
  };

  const startGame = () => {
    const totalCells = settings.gridSize * settings.gridSize;
    if (settings.playerCount > totalCells) {
      alert(`Максимум ${totalCells} гравців!`);
      return;
    }

    let newGrid: Cell[] = [];
    for (let y = 0; y < settings.gridSize; y++) {
      for (let x = 0; x < settings.gridSize; x++) {
        newGrid.push({ x, y, ownerId: null });
      }
    }

    const newPlayers: Player[] = playerConfigs.map((cfg, i) => ({
      id: i, name: cfg.name, color: cfg.color, isAlive: true, cellsCount: 0,
    }));

    let placedSeeds = 0;
    let availableIndices = Array.from({ length: newGrid.length }, (_, i) => i);
    availableIndices.sort(() => Math.random() - 0.5);

    while (placedSeeds < newPlayers.length && availableIndices.length > 0) {
      const idx = availableIndices.pop();
      if (idx !== undefined) {
        newGrid[idx].ownerId = placedSeeds;
        placedSeeds++;
      }
    }

    let emptyCells = newGrid.filter((c) => c.ownerId === null).length;
    let safeguard = 0;

    while (emptyCells > 0 && safeguard < 1000) {
      safeguard++;
      for (let pid = 0; pid < newPlayers.length; pid++) {
        const playerCells = newGrid.filter((c) => c.ownerId === pid);
        const neighbors: number[] = [];
        playerCells.forEach((cell) => {
          [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach((offset) => {
            const idx = newGrid.findIndex((c) => c.x === cell.x + offset.x && c.y === cell.y + offset.y);
            if (idx !== -1 && newGrid[idx].ownerId === null) neighbors.push(idx);
          });
        });

        if (neighbors.length > 0) {
          newGrid[neighbors[Math.floor(Math.random() * neighbors.length)]].ownerId = pid;
          emptyCells--;
          if (emptyCells === 0) break;
        }
      }
      if (emptyCells > 0 && emptyCells === newGrid.filter((c) => c.ownerId === null).length) {
        const remainingIdx = newGrid.findIndex((c) => c.ownerId === null);
        if (remainingIdx !== -1) { newGrid[remainingIdx].ownerId = 0; emptyCells--; }
      }
    }

    newPlayers.forEach((p) => { p.cellsCount = newGrid.filter((c) => c.ownerId === p.id).length; });
    setPlayers(newPlayers);
    setGrid(newGrid);
    setCurrentPlayerId(Math.floor(Math.random() * newPlayers.length));
    setPendingBattle(null);
    setBattleData(null);
    setBattleLog([]);
    setPhase("MAP_SELECTION");
  };

  const handleCellClick = (cell: Cell) => {
    if (phase !== "MAP_SELECTION" || currentPlayerId === null) return;
    if (cell.ownerId === currentPlayerId) return;
    if (cell.ownerId !== null && isNeighborToPlayer(cell, currentPlayerId)) {
      setPendingBattle({ attackerId: currentPlayerId, defenderId: cell.ownerId });
      setPhase("TOPIC_SELECTION");
    }
  };

  const getRandomQuestion = (category?: QuestionCategory) => {
    let source = questions;
    if (category) {
      const filtered = source.filter((q) => q.category === category);
      if (filtered.length > 0) source = filtered;
    }
    return source[Math.floor(Math.random() * source.length)];
  };

  const handleTopicSelect = (category: QuestionCategory) => {
    if (!pendingBattle) return;
    setBattleData({
      attackerId: pendingBattle.attackerId,
      defenderId: pendingBattle.defenderId,
      attackerTime: settings.timeLimit,
      defenderTime: settings.timeLimit,
      currentTurnId: pendingBattle.attackerId,
      category: category,
      question: getRandomQuestion(category),
      penaltyUntil: null,
      attackerScore: 0,
      defenderScore: 0
    });
    setPendingBattle(null);
    setPhase("BATTLE");
  };

  const handleAnswer = (idx: number) => {
    if (!battleData || !battleData.question) return;
    if (battleData.penaltyUntil && Date.now() < battleData.penaltyUntil) return;

    if (idx === battleData.question.correctIndex) {
      const isAttackerTurn = battleData.currentTurnId === battleData.attackerId;
      const nextPlayer = isAttackerTurn ? battleData.defenderId : battleData.attackerId;

      setBattleData((prev) => ({
        ...prev!,
        currentTurnId: nextPlayer,
        question: getRandomQuestion(prev!.category),
        attackerScore: isAttackerTurn ? prev!.attackerScore + 1 : prev!.attackerScore,
        defenderScore: !isAttackerTurn ? prev!.defenderScore + 1 : prev!.defenderScore,
      }));
    } else {
      setBattleData((prev) => ({ ...prev!, penaltyUntil: Date.now() + 3000, question: getRandomQuestion(prev!.category) }));
    }
  };

  const endBattle = (winnerId: number, loserId: number) => {
    if (battleData) {
      const attacker = players.find(p => p.id === battleData.attackerId);
      const defender = players.find(p => p.id === battleData.defenderId);
      const winner = players.find(p => p.id === winnerId);

      const duration = (settings.timeLimit * 2) - (battleData.attackerTime + battleData.defenderTime);

      const record: BattleRecord = {
        // FIX: Додаємо random, щоб уникнути дублікатів ключів
        id: Date.now() + Math.random(),
        attackerName: attacker?.name || '?',
        defenderName: defender?.name || '?',
        winnerName: winner?.name || '?',
        category: battleData.category,
        attackerScore: battleData.attackerScore,
        defenderScore: battleData.defenderScore,
        duration: duration
      };
      setBattleLog(prev => [...prev, record]);
    }

    setPhase((currentPhase) => {
      if (currentPhase !== "BATTLE") return currentPhase;
      const newGrid = grid.map((cell) => ({ ...cell, ownerId: cell.ownerId === loserId ? winnerId : cell.ownerId }));
      const newPlayers = players.map((p) => {
        if (p.id === loserId) return { ...p, isAlive: false, cellsCount: 0 };
        if (p.id === winnerId) return { ...p, cellsCount: newGrid.filter((c) => c.ownerId === winnerId).length };
        return p;
      });
      setGrid(newGrid);
      setPlayers(newPlayers);
      const alive = newPlayers.filter((p) => p.isAlive);
      if (alive.length === 1) return "GAME_OVER";
      else { setCurrentPlayerId(winnerId); return "MAP_SELECTION"; }
    });
    setBattleData(null);
  };

  // --- ВИПРАВЛЕНИЙ ТАЙМЕР ---
  // 1. Ефект тільки для відліку часу
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "BATTLE" && battleData) {
      interval = setInterval(() => {
        setBattleData((prev) => {
          if (!prev) return null;
          // Тут ми ТІЛЬКИ змінюємо час. Ми НЕ викликаємо endBattle тут.
          if (prev.currentTurnId === prev.attackerId) {
            return { ...prev, attackerTime: prev.attackerTime - 1 };
          } else {
            return { ...prev, defenderTime: prev.defenderTime - 1 };
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, battleData?.currentTurnId]);

  // 2. Ефект для перевірки кінця гри (спрацьовує коли змінюється battleData)
  useEffect(() => {
    if (phase === "BATTLE" && battleData) {
      if (battleData.currentTurnId === battleData.attackerId && battleData.attackerTime <= 0) {
        endBattle(battleData.defenderId, battleData.attackerId);
      } else if (battleData.currentTurnId === battleData.defenderId && battleData.defenderTime <= 0) {
        endBattle(battleData.attackerId, battleData.defenderId);
      }
    }
  }, [battleData]);

  if (!isLoaded) return <div className={styles.container}>Завантаження...</div>;

  return (
    <div className={styles.container}>

      {phase !== "MENU" && (
        <button
          className={styles.menuToggleBtn}
          onClick={() => setIsSidebarOpen(true)}
          title="Історія та статистика"
        >
          📜
        </button>
      )}

      <GameSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        battleLog={battleLog}
        players={players}
        isGameOver={phase === "GAME_OVER"}
      />

      {phase === "MENU" && (
        <>
          <MainMenu
            settings={settings} setSettings={setSettings}
            playerConfigs={playerConfigs} updatePlayerConfig={updatePlayerConfig}
            onStart={startGame} onReset={resetGame}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              className={styles.button}
              style={{ background: '#6f42c1' }}
              onClick={() => setPhase('EDITOR')}
            >
              📝 Редактор питань та тем
            </button>
            <button
              className={styles.button}
              style={{ background: '#555', fontSize: '0.8rem', padding: '8px' }}
              onClick={factoryReset}
            >
              ⚠️ Відновити стандартні питання
            </button>
          </div>
        </>
      )}

      {phase === "EDITOR" && (
        <QuestionsEditor
          customQuestions={questions}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
          onBack={() => setPhase("MENU")}
        />
      )}

      {(phase === "MAP_SELECTION" || phase === "BATTLE" || phase === "TOPIC_SELECTION") && (
        <GameBoard
          grid={grid} players={players} currentPlayerId={currentPlayerId} phase={phase} gridSize={settings.gridSize}
          onCellClick={handleCellClick} onReset={resetGame} onToMenu={() => setPhase("MENU")}
        />
      )}

      {phase === "TOPIC_SELECTION" && pendingBattle && (
        <TopicSelection
          attackerId={pendingBattle.attackerId} defenderId={pendingBattle.defenderId}
          players={players} onSelect={handleTopicSelect} allQuestions={questions}
        />
      )}

      {phase === "BATTLE" && battleData && (
        <BattleModal battleData={battleData} players={players} onAnswer={handleAnswer} />
      )}

      {phase === "GAME_OVER" && (
        <div className={styles.menu}>
          <h1 style={{ textAlign: "center" }}>🏆 Перемога! 🏆</h1>
          <h2 style={{ color: players.find((p) => p.isAlive)?.color, textAlign: "center", fontSize: "2rem" }}>
            {players.find((p) => p.isAlive)?.name}
          </h2>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className={styles.button} onClick={() => setPhase("MENU")}>В меню</button>
            <button className={styles.button} onClick={() => setIsSidebarOpen(true)} style={{ background: '#f1c40f', color: '#000' }}>Статистика</button>
          </div>
        </div>
      )}
    </div>
  );
}