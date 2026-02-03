// app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './game.module.css';
import { Player, Cell, GameSettings, Question, MOCK_QUESTIONS } from './types';

type GamePhase = 'MENU' | 'MAP_SELECTION' | 'BATTLE' | 'GAME_OVER';

interface PlayerConfig {
  name: string;
  color: string;
}

// Функція для генерації випадкового кольору
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function PoleGame() {
  // --- STATE ---
  const [phase, setPhase] = useState<GamePhase>('MENU');

  const [settings, setSettings] = useState<GameSettings>({
    gridSize: 5,
    playerCount: 2,
    timeLimit: 45,
  });

  // Налаштування конкретних гравців (для меню)
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: 'Гравець 1', color: '#FF5733' },
    { name: 'Гравець 2', color: '#33FF57' },
  ]);

  // Дані гри
  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

  const [battleData, setBattleData] = useState<{
    attackerId: number;
    defenderId: number;
    attackerTime: number;
    defenderTime: number;
    currentTurnId: number;
    question: Question | null;
    penaltyUntil: number | null;
  } | null>(null);

  // --- EFFECT: Sync Player Configs with Count ---
  // Коли змінюється кількість гравців, додаємо нових або видаляємо зайвих, зберігаючи існуючі налаштування
  useEffect(() => {
    setPlayerConfigs((prev) => {
      const newConfigs = [...prev];
      if (settings.playerCount > prev.length) {
        // Додаємо нових
        for (let i = prev.length; i < settings.playerCount; i++) {
          newConfigs.push({
            name: `Гравець ${i + 1}`,
            color: getRandomColor(),
          });
        }
      } else if (settings.playerCount < prev.length) {
        // Обрізаємо зайвих
        return newConfigs.slice(0, settings.playerCount);
      }
      return newConfigs;
    });
  }, [settings.playerCount]);

  // Оновлення конкретного гравця в меню
  const updatePlayerConfig = (index: number, field: keyof PlayerConfig, value: string) => {
    const newConfigs = [...playerConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setPlayerConfigs(newConfigs);
  };

  // --- LOGIC: MAP GENERATION ---
  const generateMap = (size: number) => {
    let newGrid: Cell[] = [];

    // 1. Сітка
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newGrid.push({ x, y, ownerId: null });
      }
    }

    // 2. Ініціалізація гравців з конфігурацій
    const newPlayers: Player[] = playerConfigs.map((cfg, i) => ({
      id: i,
      name: cfg.name,
      color: cfg.color,
      isAlive: true,
      cellsCount: 0,
    }));

    // 3. Зерна
    let placedSeeds = 0;
    const pCount = newPlayers.length;

    // Захист від нескінченного циклу, якщо поле замале (хоча ми перевіримо це до запуску)
    const maxIterations = size * size * 2;
    let iterations = 0;

    while (placedSeeds < pCount && iterations < maxIterations) {
      const randIdx = Math.floor(Math.random() * newGrid.length);
      if (newGrid[randIdx].ownerId === null) {
        newGrid[randIdx].ownerId = placedSeeds;
        placedSeeds++;
      }
      iterations++;
    }

    // 4. Region Growing
    let emptyCells = newGrid.filter(c => c.ownerId === null).length;

    while (emptyCells > 0) {
      for (let pid = 0; pid < pCount; pid++) {
        const playerCells = newGrid.filter(c => c.ownerId === pid);
        let neighbors: number[] = [];

        playerCells.forEach(cell => {
          const adj = [
            { x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 }
          ];
          adj.forEach(pos => {
            const idx = newGrid.findIndex(c => c.x === pos.x && c.y === pos.y);
            if (idx !== -1 && newGrid[idx].ownerId === null) {
              neighbors.push(idx);
            }
          });
        });

        if (neighbors.length > 0) {
          const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
          newGrid[randomNeighbor].ownerId = pid;
          emptyCells--;
          if (emptyCells === 0) break;
        }
      }

      // Fallback: якщо алгоритм застряг (немає сусідів, але є пусті клітинки десь далеко)
      if (emptyCells > 0 && emptyCells === newGrid.filter(c => c.ownerId === null).length) {
        const remainingIdx = newGrid.findIndex(c => c.ownerId === null);
        if (remainingIdx !== -1) {
          // Віддаємо найближчому (спрощено - першому живому)
          newGrid[remainingIdx].ownerId = 0;
          emptyCells--;
        }
      }
    }

    // Оновлюємо лічильники
    newPlayers.forEach(p => {
      p.cellsCount = newGrid.filter(c => c.ownerId === p.id).length;
    });

    setPlayers(newPlayers);
    setGrid(newGrid);
    setCurrentPlayerId(Math.floor(Math.random() * pCount));
    setPhase('MAP_SELECTION');
  };

  // --- LOGIC: GAMEPLAY ---
  const isNeighborToPlayer = (targetCell: Cell, playerId: number) => {
    const playerCells = grid.filter(c => c.ownerId === playerId);
    return playerCells.some(pc => Math.abs(pc.x - targetCell.x) + Math.abs(pc.y - targetCell.y) === 1);
  };

  const handleCellClick = (cell: Cell) => {
    if (phase !== 'MAP_SELECTION' || currentPlayerId === null) return;
    if (cell.ownerId === currentPlayerId) return;
    if (cell.ownerId !== null && isNeighborToPlayer(cell, currentPlayerId)) {
      startBattle(currentPlayerId, cell.ownerId);
    }
  };

  const getRandomQuestion = () => MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)];

  const startBattle = (attackerId: number, defenderId: number) => {
    setBattleData({
      attackerId,
      defenderId,
      attackerTime: settings.timeLimit,
      defenderTime: settings.timeLimit,
      currentTurnId: attackerId,
      question: getRandomQuestion(),
      penaltyUntil: null
    });
    setPhase('BATTLE');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'BATTLE' && battleData) {
      interval = setInterval(() => {
        const now = Date.now();

        setBattleData(prev => {
          if (!prev) return null;

          // Якщо час вийшов під час штрафу - теж перевіряємо це

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
  }, [phase, battleData?.currentTurnId]); // Прибрав battleData.penaltyUntil з deps, щоб таймер був стабільним

  const handleAnswer = (idx: number) => {
    if (!battleData || !battleData.question) return;
    if (battleData.penaltyUntil && Date.now() < battleData.penaltyUntil) return;

    if (idx === battleData.question.correctIndex) {
      const nextPlayer = battleData.currentTurnId === battleData.attackerId
        ? battleData.defenderId
        : battleData.attackerId;
      setBattleData(prev => ({
        ...prev!,
        currentTurnId: nextPlayer,
        question: getRandomQuestion()
      }));
    } else {
      setBattleData(prev => ({
        ...prev!,
        penaltyUntil: Date.now() + 3000,
        question: getRandomQuestion()
      }));
    }
  };

  const endBattle = (winnerId: number, loserId: number) => {
    // В React state update краще робити поза рендером/інтервалом через setTimeout якщо конфлікти,
    // але тут ми викликаємо це з ефекту, тому ок.

    // Щоб не викликати кілька разів (бо setInterval може тікнути ще раз)
    // ми це загорнемо в setPhase відразу.

    setPhase(currentPhase => {
      if (currentPhase !== 'BATTLE') return currentPhase; // вже оброблено

      const newGrid = grid.map(cell => ({
        ...cell,
        ownerId: cell.ownerId === loserId ? winnerId : cell.ownerId
      }));

      const newPlayers = players.map(p => {
        if (p.id === loserId) return { ...p, isAlive: false, cellsCount: 0 };
        if (p.id === winnerId) {
          const count = newGrid.filter(c => c.ownerId === winnerId).length;
          return { ...p, cellsCount: count };
        }
        return p;
      });

      setGrid(newGrid);
      setPlayers(newPlayers);

      const alivePlayers = newPlayers.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        return 'GAME_OVER';
      } else {
        setCurrentPlayerId(winnerId);
        return 'MAP_SELECTION';
      }
    });
    setBattleData(null);
  };

  const startGame = () => {
    const totalCells = settings.gridSize * settings.gridSize;
    if (settings.playerCount > totalCells) {
      alert(`Максимум ${totalCells} гравців для цього поля!`);
      return;
    }
    generateMap(settings.gridSize);
  };

  return (
    <div className={styles.container}>

      {/* --- MENU PHASE --- */}
      {phase === 'MENU' && (
        <div className={styles.menu}>
          <h1 style={{ textAlign: 'center' }}>Налаштування гри</h1>

          <div className={styles.formGroup}>
            <label>Розмір поля ({settings.gridSize}x{settings.gridSize})</label>
            <input
              type="range" min="4" max="10"
              value={settings.gridSize}
              onChange={(e) => setSettings({ ...settings, gridSize: Number(e.target.value) })}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Кількість гравців ({settings.playerCount})</label>
            <input
              type="number" min="2" max={settings.gridSize * settings.gridSize}
              value={settings.playerCount}
              onChange={(e) => setSettings({ ...settings, playerCount: Number(e.target.value) })}
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
                    onChange={(e) => updatePlayerConfig(idx, 'name', e.target.value)}
                    className={styles.playerNameInput}
                    placeholder="Ім'я"
                  />
                  <input
                    type="color"
                    value={player.color}
                    onChange={(e) => updatePlayerConfig(idx, 'color', e.target.value)}
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
              type="number" min="10" max="120"
              value={settings.timeLimit}
              onChange={(e) => setSettings({ ...settings, timeLimit: Number(e.target.value) })}
              className={styles.input}
            />
          </div>

          <button className={styles.button} onClick={startGame}>Почати гру</button>
        </div>
      )}

      {/* --- MAP & BATTLE RENDER --- */}
      {(phase === 'MAP_SELECTION' || phase === 'BATTLE') && (
        <div className={styles.gameBoard}>
          <div className={styles.infoPanel}>
            <h2>
              Хід: <span style={{ color: players.find(p => p.id === currentPlayerId)?.color }}>
                {players.find(p => p.id === currentPlayerId)?.name}
              </span>
            </h2>
            <p>Територія: {players.find(p => p.id === currentPlayerId)?.cellsCount} кл.</p>
          </div>

          <div
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${settings.gridSize}, 1fr)`
            }}
          >
            {grid.map((cell, idx) => {
              const owner = players.find(p => p.id === cell.ownerId);
              const isOwner = cell.ownerId === currentPlayerId;
              const isNeighbor = currentPlayerId !== null && isNeighborToPlayer(cell, currentPlayerId);
              const isEnemy = cell.ownerId !== null && cell.ownerId !== currentPlayerId;
              const isTarget = phase === 'MAP_SELECTION' && isNeighbor && isEnemy;

              return (
                <div
                  key={idx}
                  className={`${styles.cell} ${isTarget ? styles.potentialTarget : ''}`}
                  style={{ backgroundColor: owner?.color || '#333' }}
                  onClick={() => handleCellClick(cell)}
                  title={owner?.name}
                >
                  {/* Можна виводити ID власника або першу літеру імені для наочності */}
                  {owner?.name.charAt(0).toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- BATTLE MODAL --- */}
      {phase === 'BATTLE' && battleData && (
        <div className={styles.battleOverlay}>
          <div className={styles.battleCard}>
            <h2>⚔️ БИТВА ⚔️</h2>

            <div className={styles.timers}>
              <div
                className={battleData.currentTurnId === battleData.attackerId ? styles.activeTimer : ''}
                style={{ color: players.find(p => p.id === battleData.attackerId)?.color }}
              >
                {players.find(p => p.id === battleData.attackerId)?.name}
                <br />
                {battleData.attackerTime}с
              </div>
              <div>vs</div>
              <div
                className={battleData.currentTurnId === battleData.defenderId ? styles.activeTimer : ''}
                style={{ color: players.find(p => p.id === battleData.defenderId)?.color }}
              >
                {players.find(p => p.id === battleData.defenderId)?.name}
                <br />
                {battleData.defenderTime}с
              </div>
            </div>

            <div className={styles.questionBox}>
              <p><strong>Питання:</strong></p>
              <h3>{battleData.question?.text}</h3>
            </div>

            <div className={styles.answersGrid}>
              {battleData.question?.answers.map((ans, idx) => (
                <button
                  key={idx}
                  className={styles.answerBtn}
                  onClick={() => handleAnswer(idx)}
                  disabled={!!battleData.penaltyUntil && Date.now() < battleData.penaltyUntil}
                >
                  {ans}
                </button>
              ))}
            </div>

            {battleData.penaltyUntil && Date.now() < battleData.penaltyUntil && (
              <div className={styles.penaltyOverlay}>
                ❌ ПОМИЛКА! ШТРАФ...
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- GAME OVER --- */}
      {phase === 'GAME_OVER' && (
        <div className={styles.menu}>
          <h1 style={{ textAlign: 'center' }}>🏆 Перемога! 🏆</h1>
          <h2 style={{
            color: players.find(p => p.isAlive)?.color,
            textAlign: 'center',
            fontSize: '2rem'
          }}>
            {players.find(p => p.isAlive)?.name}
          </h2>
          <p style={{ textAlign: 'center' }}>Захопив все поле!</p>
          <button className={styles.button} onClick={() => setPhase('MENU')}>В меню</button>
        </div>
      )}
    </div>
  );
}