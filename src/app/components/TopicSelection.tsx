// app/components/TopicSelection.tsx
import styles from '../game.module.css';
import { QuestionCategory, Player, Question } from '../types';

interface TopicSelectionProps {
    attackerId: number;
    defenderId: number;
    players: Player[];
    onSelect: (category: QuestionCategory) => void;
    allQuestions: Question[]; // Передаємо всі питання
}

export default function TopicSelection({ attackerId, defenderId, players, onSelect, allQuestions }: TopicSelectionProps) {
    const attacker = players.find(p => p.id === attackerId);
    const defender = players.find(p => p.id === defenderId);

    // Отримуємо унікальні категорії з наявних питань
    const categories = Array.from(new Set(allQuestions.map(q => q.category)));

    return (
        <div className={styles.battleOverlay}>
            <div className={styles.battleCard}>
                <h2 style={{ marginBottom: '10px' }}>Вибір теми атаки</h2>
                <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                    <span style={{ color: attacker?.color, fontWeight: 'bold' }}>{attacker?.name}</span>
                    {' атакує '}
                    <span style={{ color: defender?.color, fontWeight: 'bold' }}>{defender?.name}</span>
                </p>

                <div className={styles.answersGrid} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={styles.answerBtn}
                            onClick={() => onSelect(cat)}
                            style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}