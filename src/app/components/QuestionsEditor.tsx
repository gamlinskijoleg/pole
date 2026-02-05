// app/components/QuestionsEditor.tsx
import styles from "../game.module.css";
import type { Question } from "../types";
import MathRender from "./MathRender";
import { useState, useRef } from "react";

interface QuestionsEditorProps {
  customQuestions: Question[];
  onSave: (q: Question) => void;
  onDelete: (id: number) => void;
  onBack: () => void;
}

export default function QuestionsEditor({
  customQuestions,
  onSave,
  onDelete,
  onBack,
}: QuestionsEditorProps) {
  // --- STATE ---
  const existingCategories = Array.from(
    new Set(customQuestions.map((q) => q.category)),
  );

  // Якщо немає категорій, activeCategory = '', що покаже екран створення
  const [activeCategory, setActiveCategory] = useState<string>(
    existingCategories[0] || "",
  );

  // Режим створення нової категорії
  const [isAddingTopic, setIsAddingTopic] = useState(
    existingCategories.length === 0,
  );
  const [newTopicName, setNewTopicName] = useState("");

  // Форма питання
  const [editingId, setEditingId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const formRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ---
  const filteredQuestions = customQuestions.filter(
    (q) => q.category === activeCategory,
  );

  const handleCreateTopic = () => {
    if (!newTopicName.trim()) return;
    setActiveCategory(newTopicName.trim());
    setIsAddingTopic(false);
    setNewTopicName("");
  };

  const handleAnswerChange = (idx: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[idx] = val;
    setAnswers(newAnswers);
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setText(q.text);
    setAnswers([...q.answers]);
    setCorrectIndex(q.correctIndex);
    // Плавний скрол до форми
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setAnswers(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const handleSubmit = () => {
    if (!text.trim() || answers.some((a) => !a.trim())) {
      alert("Будь ласка, заповніть питання і всі відповіді!");
      return;
    }

    onSave({
      id: editingId || Date.now(),
      text,
      answers,
      correctIndex,
      category: activeCategory,
    });

    resetForm();
  };

  const handleDeleteTopic = () => {
    if (
      confirm(
        `Видалити тему "${activeCategory}" і всі її ${filteredQuestions.length} питань?`,
      )
    ) {
      // Видаляємо всі питання цієї теми
      filteredQuestions.forEach((q) => {
        onDelete(q.id);
      });

      // Перемикаємось на іншу тему або режим створення
      const remaining = existingCategories.filter((c) => c !== activeCategory);
      if (remaining.length > 0) {
        setActiveCategory(remaining[0]);
      } else {
        setActiveCategory("");
        setIsAddingTopic(true);
      }
    }
  };

  return (
    <div
      className={styles.menu}
      style={{ maxWidth: "700px", width: "95%", maxHeight: "95vh" }}
    >
      {/* --- HEADER --- */}
      <div className={styles.editorHeader}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          ← Назад
        </button>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Редактор Вікторини</h2>
        <div style={{ width: "60px" }}></div> {/* Placeholder for balance */}
      </div>

      {/* --- TOPIC BAR (Tabs) --- */}
      <div className={styles.topicsBar}>
        {existingCategories.map((cat) => (
          <div
            key={cat}
            className={`${styles.topicTab} ${activeCategory === cat && !isAddingTopic ? styles.active : ""}`}
            onClick={() => {
              setActiveCategory(cat);
              setIsAddingTopic(false);
              resetForm();
            }}
          >
            {cat}
            <span
              style={{
                background: "rgba(0,0,0,0.1)",
                borderRadius: "10px",
                padding: "0 6px",
                fontSize: "0.8rem",
              }}
            >
              {customQuestions.filter((q) => q.category === cat).length}
            </span>
          </div>
        ))}

        <button
          type="button"
          className={styles.addTopicBtn}
          onClick={() => {
            setIsAddingTopic(true);
            setActiveCategory("");
          }}
          title="Додати нову тему"
        >
          +
        </button>
      </div>

      {/* --- CONTENT AREA --- */}

      {/* 1. Створення теми */}
      {isAddingTopic ? (
        <div
          className={styles.editorCard}
          style={{ textAlign: "center", padding: "40px 20px" }}
        >
          <h3>Створити нову тему</h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              marginTop: "15px",
            }}
          >
            <input
              className={styles.input}
              style={{ maxWidth: "300px" }}
              placeholder="Назва теми (напр. Географія)"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTopic()}
            />
            <button
              type="button"
              className={styles.button}
              style={{ width: "auto" }}
              onClick={handleCreateTopic}
            >
              Створити
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Форма питання */}
          <div className={styles.editorCard} ref={formRef}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <h3
                style={{ margin: 0, color: editingId ? "#f39c12" : "#2c3e50" }}
              >
                {editingId ? "✏️ Редагування" : "➕ Нове питання"}
              </h3>
              <button
                type="button"
                onClick={handleDeleteTopic}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e74c3c",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  textDecoration: "underline",
                }}
              >
                Видалити тему
              </button>
            </div>

            <div className={styles.formGroup}>
              <input
                className={styles.input}
                placeholder="Введіть запитання..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {text.includes("$") && (
                <div
                  style={{
                    marginTop: "5px",
                    padding: "10px",
                    background: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                >
                  <small style={{ color: "#666" }}>Попередній перегляд:</small>
                  <br />
                  <strong>
                    <MathRender text={text} />
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Варіанти (клікніть кружечок біля правильного):
              </label>
              {answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`${styles.answerRow} ${correctIndex === idx ? styles.correct : ""}`}
                  onClick={() =>
                    setCorrectIndex(idx)
                  } /* Клік по всій строці вибирає правильну */
                >
                  <input
                    type="radio"
                    className={styles.radio}
                    name="correct"
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                  />
                  <input
                    className={styles.input}
                    style={{ border: "1px solid #ddd" }}
                    placeholder={`Відповідь ${idx + 1}`}
                    value={ans}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    // Щоб клік по інпуту не перемикав радіо, зупиняємо спливання
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className={styles.button}
                onClick={handleSubmit}
                style={{ background: editingId ? "#f39c12" : "#0070f3" }}
              >
                {editingId ? "Зберегти зміни" : "Додати питання"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={resetForm}
                  style={{ background: "#95a5a6", width: "auto" }}
                >
                  Скасувати
                </button>
              )}
            </div>
          </div>

          {/* 3. Список питань */}
          <div className={styles.questionList}>
            {filteredQuestions.length === 0 ? (
              <div
                style={{ textAlign: "center", color: "#999", padding: "20px" }}
              >
                У темі "<b>{activeCategory}</b>" ще немає питань. Додайте перше!
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className={`${styles.qCard} ${editingId === q.id ? styles.editing : ""}`}
                >
                  <div style={{ flex: 1, paddingRight: "10px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                      {q.text}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      Правильно: {q.answers[q.correctIndex]}
                    </div>
                  </div>
                  <div className={styles.qActions}>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.edit}`}
                      onClick={() => startEdit(q)}
                      title="Редагувати"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.delete}`}
                      onClick={() => confirm("Видалити?") && onDelete(q.id)}
                      title="Видалити"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
