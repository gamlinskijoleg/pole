// app/types.ts

export type PlayerColor = string;
export type QuestionCategory = string;

export interface Player {
  id: number;
  name: string;
  color: PlayerColor;
  isAlive: boolean;
  cellsCount: number;
}

export interface Cell {
  x: number;
  y: number;
  ownerId: number | null;
}

export interface GameSettings {
  gridSize: number;
  playerCount: number;
  timeLimit: number;
}

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctIndex: number;
  category: QuestionCategory;
}

// НОВЕ: Запис про одну битву
export interface BattleRecord {
  id: number;
  attackerName: string;
  defenderName: string;
  winnerName: string;
  category: string;
  attackerScore: number; // Скільки правильних дав атакуючий
  defenderScore: number; // Скільки правильних дав захисник
  duration: number;      // Скільки секунд тривав бій
}

export const MOCK_QUESTIONS: Question[] = [
  { id: 1, text: "25 * 4 = ?", answers: ["50", "100", "75", "125"], correctIndex: 1, category: 'Обчислення' },
  { id: 2, text: "120 / 6 = ?", answers: ["20", "12", "60", "30"], correctIndex: 0, category: 'Обчислення' },
  { id: 5, text: "Спростіть: 2x + 3x", answers: ["5x", "6x", "5x^2", "x"], correctIndex: 0, category: 'Алгебра' },
  { id: 8, text: "sin(30°)", answers: ["0", "1", "0.5", "√3/2"], correctIndex: 2, category: 'Тригонометрія' },
  { id: 11, text: "50% від 80", answers: ["40", "20", "60", "30"], correctIndex: 0, category: 'Відсотки' },
];