// app/types.ts

export type PlayerColor = string;

// Новий тип для категорій
export type QuestionCategory = "OBCHYSLENNIA" | "VYRAZY" | "TRYGONOMETRIIA" | "VIDSOTKY";

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
	category: QuestionCategory; // Додали поле категорії
}

// Оновлена база питань (Математичний нахил)
export const MOCK_QUESTIONS: Question[] = [
	// ОБЧИСЛЕННЯ
	{ id: 1, text: "25 * 4 = ?", answers: ["50", "100", "75", "125"], correctIndex: 1, category: "OBCHYSLENNIA" },
	{ id: 2, text: "120 / 6 = ?", answers: ["20", "12", "60", "30"], correctIndex: 0, category: "OBCHYSLENNIA" },
	{ id: 3, text: "15 + 18 = ?", answers: ["33", "32", "43", "23"], correctIndex: 0, category: "OBCHYSLENNIA" },
	{ id: 4, text: "7 * 8 = ?", answers: ["54", "58", "56", "64"], correctIndex: 2, category: "OBCHYSLENNIA" },

	// ВИРАЗИ
	{ id: 5, text: "Спростіть: 2x + 3x", answers: ["5x", "6x", "5x^2", "x"], correctIndex: 0, category: "VYRAZY" },
	{ id: 6, text: "Розв'яжіть: x - 5 = 10", answers: ["5", "15", "-5", "50"], correctIndex: 1, category: "VYRAZY" },
	{ id: 7, text: "x * x = ?", answers: ["2x", "x^2", "x", "2"], correctIndex: 1, category: "VYRAZY" },

	// ТРИГОНОМЕТРІЯ
	{ id: 8, text: "sin(30°)", answers: ["0", "1", "0.5", "√3/2"], correctIndex: 2, category: "TRYGONOMETRIIA" },
	{ id: 9, text: "cos(0°)", answers: ["0", "1", "-1", "0.5"], correctIndex: 1, category: "TRYGONOMETRIIA" },
	{ id: 10, text: "tg(45°)", answers: ["1", "0", "∞", "√3"], correctIndex: 0, category: "TRYGONOMETRIIA" },

	// ВІДСОТКИ
	{ id: 11, text: "50% від 80", answers: ["40", "20", "60", "30"], correctIndex: 0, category: "VIDSOTKY" },
	{ id: 12, text: "20% від 50", answers: ["5", "10", "25", "15"], correctIndex: 1, category: "VIDSOTKY" },
	{ id: 13, text: "100% це...", answers: ["0.1", "1", "10", "0.01"], correctIndex: 1, category: "VIDSOTKY" },
];

export const CATEGORY_NAMES: Record<QuestionCategory, string> = {
	OBCHYSLENNIA: "Обчислення",
	VYRAZY: "Вирази",
	TRYGONOMETRIIA: "Тригонометрія",
	VIDSOTKY: "Відсотки",
};
