"use client";
import { useEffect, useState } from "react";

export default function Exam() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("userQuestions");
    if (!stored) {
      alert("No questions found");
      window.close();
      return;
    }
    setQuestions(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-xl font-bold mb-4">Python Test</h1>

      {questions.map((q, i) => (
        <div key={q.id} className="bg-white p-4 mb-3 rounded">
          <p className="font-semibold">
            {i + 1}. {q.question}
          </p>
          {q.options.map((o) => (
            <p key={o}>• {o}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
