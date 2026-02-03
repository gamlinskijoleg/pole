// app/components/TopicSelection.tsx
import styles from '../game.module.css';
import { CATEGORY_NAMES, QuestionCategory, Player } from '../types';

interface TopicSelectionProps {
    attackerId: number;
    defenderId: number;
    players: Player[];
    onSelect: (category: QuestionCategory) => void;
}

export default function TopicSelection({ attackerId, defenderId, players, onSelect }: TopicSelectionProps) {
    const attacker = players.find(p => p.id === attackerId);
    const defender = players.find(p => p.id === defenderId);

    // Отримуємо список ключів категорій
    const categories = Object.keys(CATEGORY_NAMES) as QuestionCategory[];

    return (
        <div className={styles.battleOverlay}>
            <div className={styles.battleCard}>
                <h2 style={{ marginBottom: '10px' }}>Вибір теми атаки</h2>
                <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                    <span style={{ color: attacker?.color, fontWeight: 'bold' }}>{attacker?.name}</span>
                    {' атакує '}
                    <span style={{ color: defender?.color, fontWeight: 'bold' }}>{defender?.name}</span>
                </p>

                <div className={styles.answersGrid}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={styles.answerBtn}
                            onClick={() => onSelect(cat)}
                            style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                        >
                            {CATEGORY_NAMES[cat]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}