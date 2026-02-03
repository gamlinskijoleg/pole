// app/components/QuestionsEditor.tsx
import { useState } from 'react';
import styles from '../game.module.css';
import { Question } from '../types';

interface QuestionsEditorProps {
    customQuestions: Question[];
    onSave: (q: Question) => void;
    onDelete: (id: number) => void;
    onBack: () => void;
}

export default function QuestionsEditor({ customQuestions, onSave, onDelete, onBack }: QuestionsEditorProps) {
    const [category, setCategory] = useState('');
    const [text, setText] = useState('');
    const [answers, setAnswers] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(0);

    // Отримуємо список усіх існуючих категорій для підказки
    const existingCategories = Array.from(new Set(customQuestions.map(q => q.category)));

    const handleAnswerChange = (idx: number, val: string) => {
        const newAnswers = [...answers];
        newAnswers[idx] = val;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        if (!category.trim() || !text.trim() || answers.some(a => !a.trim())) {
            alert("Заповніть всі поля!");
            return;
        }

        const newQuestion: Question = {
            id: Date.now(), // Унікальний ID
            text,
            answers,
            correctIndex,
            category: category.trim()
        };

        onSave(newQuestion);

        // Очищення форми (категорію лишаємо, щоб зручно додавати багато питань в одну тему)
        setText('');
        setAnswers(['', '', '', '']);
        setCorrectIndex(0);
    };

    return (
        <div className={styles.menu} style={{ maxWidth: '600px' }}>
            <h2 style={{ textAlign: 'center' }}>Редактор питань</h2>

            <div className={styles.formGroup} style={{ borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <label>Категорія (Тема)</label>
                <input
                    className={styles.input}
                    list="categories"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Напр: Історія України"
                />
                <datalist id="categories">
                    {existingCategories.map(c => <option key={c} value={c} />)}
                </datalist>
            </div>

            <div className={styles.formGroup}>
                <label>Питання</label>
                <input className={styles.input} value={text} onChange={e => setText(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
                <label>Варіанти відповідей (виберіть правильну кружечком)</label>
                {answers.map((ans, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '5px', alignItems: 'center' }}>
                        <input
                            type="radio"
                            name="correct"
                            checked={correctIndex === idx}
                            onChange={() => setCorrectIndex(idx)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <input
                            className={styles.input}
                            value={ans}
                            onChange={e => handleAnswerChange(idx, e.target.value)}
                            placeholder={`Варіант ${idx + 1}`}
                        />
                    </div>
                ))}
            </div>

            <button className={styles.button} onClick={handleSubmit} style={{ background: '#28a745', marginBottom: '20px' }}>
                Додати питання
            </button>

            <div className={styles.playersList} style={{ maxHeight: '200px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Ваші питання ({customQuestions.length}):</h4>
                {customQuestions.length === 0 && <p style={{ color: '#888' }}>Поки що немає власних питань</p>}
                {customQuestions.map(q => (
                    <div key={q.id} className={styles.playerRow} style={{ justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <div>
                            <strong>[{q.category}]</strong> {q.text}
                        </div>
                        <button
                            onClick={() => onDelete(q.id)}
                            style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
                        >
                            X
                        </button>
                    </div>
                ))}
            </div>

            <button className={styles.button} onClick={onBack} style={{ marginTop: '10px', background: '#666' }}>
                Назад в меню
            </button>
        </div>
    );
}