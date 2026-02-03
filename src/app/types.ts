// app/types.ts

export type PlayerColor = string;

export interface Player {
	id: number;
	name: string;
	color: PlayerColor;
	isAlive: boolean;
	cellsCount: number; // Для відображення статистики
}

export interface Cell {
	x: number;
	y: number;
	ownerId: number | null; // ID гравця
}

export interface GameSettings {
	gridSize: number; // напр. 5 для 5x5
	playerCount: number;
	timeLimit: number; // секунди
}

export interface Question {
	id: number;
	text: string;
	answers: string[]; // 4 варіанти
	correctIndex: number;
}

// Простий набір питань для прикладу
export const MOCK_QUESTIONS: Question[] = [
	{ id: 1, text: "Столиця Франції?", answers: ["Лондон", "Берлін", "Париж", "Мадрид"], correctIndex: 2 },
	{ id: 2, text: "Скільки планет у Сонячній системі?", answers: ["7", "8", "9", "10"], correctIndex: 1 },
	{ id: 3, text: "Хімічна формула води?", answers: ["H2O", "CO2", "O2", "NaCl"], correctIndex: 0 },
	{ id: 4, text: "Найвища гора світу?", answers: ["К2", "Еверест", "Говерла", "Альпи"], correctIndex: 1 },
	{ id: 5, text: "Рік проголошення незалежності України?", answers: ["1990", "1991", "1996", "2004"], correctIndex: 1 },
	{ id: 6, text: "Скільки біт в одному байті?", answers: ["4", "8", "16", "32"], correctIndex: 1 },
	{ id: 7, text: "Що таке React?", answers: ["База даних", "Бібліотека JS", "Операційна система", "Мова програмування"], correctIndex: 1 },
	// Додай більше питань тут...
];
