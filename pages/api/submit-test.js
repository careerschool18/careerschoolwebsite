const sendResultToBackend = async (finalScore) => {
  try {
    await fetch("/api/submit-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: "Python",
        score: finalScore,
        total: questions.length,
        answers,
        submittedAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Failed to submit test", error);
  }
};
