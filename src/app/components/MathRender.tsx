// app/components/MathRender.tsx
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

interface MathRenderProps {
  text: string;
}

export default function MathRender({ text }: MathRenderProps) {
  // Якщо текст пустий
  if (!text) return null;

  // Розбиваємо текст по знаку $.
  // Парні елементи масиву (0, 2, 4...) - це звичайний текст.
  // Непарні (1, 3, 5...) - це формули LaTeX.
  const parts = text.split("$");

  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // Це формула
          return <InlineMath key={index} math={part} />;
        }
        // Це звичайний текст
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
