// pages/test/data-analytics
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import questionBank from "../../data/data-analytics-questions.json";

const STORAGE_KEY = "data_analytics_test_state_v1";

export default function DataAnalyticsTest() {
  const router = useRouter();

  /* ---------------- STATES ---------------- */
  const [step, setStep] = useState("login");
  const [timer, setTimer] = useState(20 * 60);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [tabCount, setTabCount] = useState(0);
  const [autoSubmitReason, setAutoSubmitReason] = useState("");

  /* ---------------- REFS ---------------- */
  const submittedRef = useRef(false);

  /* ---------------- LOAD SAVED STATE ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setStep(data.step);
      setTimer(data.timer);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      setTabCount(data.tabCount || 0);
    }
  }, []);

  /* ---------------- SAVE STATE ---------------- */
  useEffect(() => {
    if (step === "test") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, timer, questions, answers, tabCount })
      );
    }
  }, [step, timer, questions, answers, tabCount]);

  /* ---------------- AUTO SUBMIT HANDLER ---------------- */
  const triggerAutoSubmit = (message) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setAutoSubmitReason(message);
    submitTest(true);
  };

  /* ---------------- SECURITY BLOCKS ---------------- */
  useEffect(() => {
    if (step !== "test") return;

    const block = (e) => e.preventDefault();

    const blockKeys = (e) => {
      const forbidden =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U");

      if (forbidden) {
        triggerAutoSubmit(
          "You violated the exam rules, so the test was automatically submitted. Kindly contact HR."
        );
      }
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [step]);

  /* ---------------- QUESTIONS ---------------- */
  const generateQuestions = () => {
    const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 50));
  };

  /* ---------------- AUTO START ---------------- */
  useEffect(() => {
    if (router.query.start === "true") {
      generateQuestions();
      setStep("test");
    }
  }, [router.query.start]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (step !== "test") return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          triggerAutoSubmit(
            "The time is over, so the test was automatically submitted. Please contact HR for further details."
          );
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  /* ---------------- TAB SWITCH ---------------- */
  useEffect(() => {
    if (step !== "test") return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setTabCount((prev) => {
          const count = prev + 1;
          if (count <= 2) {
            alert(`Warning ${count}/3: Tab switching is not allowed.`);
            return count;
          }

          triggerAutoSubmit(
            "You violated the rules 3 times, so the test was submitted. Kindly contact HR."
          );
          return count;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [step]);

  /* ---------------- SUBMIT ---------------- */
  const submitTest = (forced = false) => {
    if (!forced && Object.keys(answers).length < 50) {
      alert("Please answer all 50 questions before submitting.");
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setStep("submitted");
  };

  /* ---------------- TIME FORMAT ---------------- */
  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  /* ---------------- SUBMITTED ---------------- */
  if (step === "submitted") {
    return (
      <CenteredCard title="Data Analytics Test Submitted">
        <p className="text-center text-red-600 font-semibold mb-6">
          {autoSubmitReason ||
            "Your Data Analytics test was successfully submitted."}
        </p>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
        >
          OK
        </button>
      </CenteredCard>
    );
  }

  /* ---------------- INSTRUCTIONS ---------------- */
  if (step === "instructions") {
    return (
      <CenteredCard title="Data Analytics Test Instructions">
        <Instruction>50 questions – all mandatory</Instruction>
        <Instruction>Time limit: 20 minutes</Instruction>
        <Instruction>No tab switch / copy / inspect</Instruction>
        <Instruction>Violations → auto submit</Instruction>

        <PrimaryButton
          className="mt-6"
          onClick={() =>
            window.open("/test/data-analytics?start=true", "_blank")
          }
        >
          Start Data Analytics Test
        </PrimaryButton>
      </CenteredCard>
    );
  }

  /* ---------------- LOGIN ---------------- */
  if (step === "login") {
    return (
      <CenteredCard title="Data Analytics Online Assessment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep("instructions");
          }}
          className="space-y-4"
        >
          <Input placeholder="Full Name" />
          <Input placeholder="Email ID" />
          <Input placeholder="Mobile Number" />
          <Input placeholder="College / Company" />
          <PrimaryButton>Proceed</PrimaryButton>
        </form>
      </CenteredCard>
    );
  }

  /* ---------------- TEST PAGE ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 px-3 py-4 select-none">
      <div className="sticky top-0 bg-white shadow rounded-xl px-4 py-3 flex justify-between">
        <h2 className="font-bold">Data Analytics Test</h2>
        <span className="font-bold text-red-600">
          ⏱ {minutes}:{seconds}
        </span>
      </div>

      <div className="max-w-3xl mx-auto mt-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white p-4 rounded-xl shadow mb-4">
            <p className="font-semibold mb-3">
              {i + 1}. {q.question}
            </p>
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() =>
                  setAnswers((p) => ({ ...p, [q.id]: opt }))
                }
                className={`w-full text-left px-4 py-2 mb-2 rounded border ${
                  answers[q.id] === opt
                    ? "bg-blue-600 text-white"
                    : "bg-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ))}

        <button
          onClick={() => submitTest()}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
        >
          Submit Data Analytics Test
        </button>
      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

const CenteredCard = ({ title, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 px-3">
    <div className="bg-white p-6 rounded-2xl shadow w-full max-w-lg">
      <h2 className="text-xl font-bold text-center mb-5">{title}</h2>
      {children}
    </div>
  </div>
);

const Input = ({ placeholder }) => (
  <input
    required
    placeholder={placeholder}
    className="w-full border px-3 py-2 rounded-lg"
  />
);

const PrimaryButton = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`w-full bg-blue-600 text-white py-2 rounded-lg font-semibold ${className}`}
  >
    {children}
  </button>
);

const Instruction = ({ children }) => (
  <p className="text-sm text-gray-700 mb-2">• {children}</p>
);
