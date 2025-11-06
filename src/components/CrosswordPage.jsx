import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CrosswordPage.css";

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [crossword, setCrossword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: "",
    success: false,
  });

  // Per-clue answers
  const [clueAnswers, setClueAnswers] = useState({});

  useEffect(() => {
    const fetchCrossword = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_BASE}/crossword`);
        const data = await res.json();
        setCrossword(data);
      } catch{
        setPopup({
          open: true,
          title: "Error",
          message: "Error fetching crossword.",
          success: false,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCrossword();
  }, []);

  const handleInput = (clueID, value) => {
    setClueAnswers((prev) => ({
      ...prev,
      [clueID]: value,
    }));
  };

  const handleSubmit = async () => {
    if (submitted || !crossword) return;
    // Collect answers
    const answers = Object.entries(clueAnswers)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([clueID, clueText]) => ({
        clueID: parseInt(clueID, 10),
        clueText: clueText.trim().toUpperCase(),
      }));

    const payload = {
      crossword_id: crossword.crosswordID || crossword.CrosswordID || 1,
      answers,
    };
    console.log("Submitting payload to backend:", payload);

    const jwt = localStorage.getItem("jwt");
    try {
      const res = await fetch(`${BACKEND_BASE}/submitcrossword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Raw fetch response object:", res);
      const result = await res.json();
      console.log("Response JSON from backend:", result);
      if (res.ok) {
        setPopup({
          open: true,
          title: "✅ Submission Successful!",
          message: result.message || "Your answers have been submitted.",
          success: true,
        });
      } else {
        setPopup({
          open: true,
          title: "❌ Submission Failed",
          message: result.message || "Something went wrong.",
          success: false,
        });
      }
      setSubmitted(true);
    } catch {
      setPopup({
        open: true,
        title: "⚠️ Network Error",
        message: "Unable to connect to the server. Please try again later.",
        success: false,
      });
    }
  };

  if (loading || !crossword) {
    return (
      <div className="cw-root">
        <p>Loading crossword...</p>
      </div>
    );
  }

  return (
    <div className="cw-root dark">
      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">
            Player: <strong>{user?.username || "Guest"}</strong>
          </div>
        </div>
      </header>

      <main className="cw-main">
        {/* You may keep a grid for style only */}
        <section className="cw-board">
          {/* Placeholder grid, visual only */}
          <div className="board-scroll">
            <div className="board-grid large" role="grid">
              <div style={{ color: "#aaa", padding: 12, textAlign: "center" }}>
                (Visual grid; enter answers below)
              </div>
            </div>
          </div>
        </section>

        <aside className="cw-side">
          <h3>Clues</h3>
          <div className="clue-group">
            <h4>Across</h4>
            <ul>
              {crossword.clues?.across?.map((clue) => (
                <li key={clue.clueID}>
                  <b>{clue.clueID}.</b> {clue.clueText}{" "}
                  <input
                    type="text"
                    style={{ marginLeft: 8, width: 110, textTransform: "uppercase" }}
                    value={clueAnswers[clue.clueID] || ""}
                    onChange={(e) => handleInput(clue.clueID, e.target.value)}
                    disabled={submitted}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="clue-group">
            <h4>Down</h4>
            <ul>
              {crossword.clues?.down?.map((clue) => (
                <li key={clue.clueID}>
                  <b>{clue.clueID}.</b> {clue.clueText}{" "}
                  <input
                    type="text"
                    style={{ marginLeft: 8, width: 110, textTransform: "uppercase" }}
                    value={clueAnswers[clue.clueID] || ""}
                    onChange={(e) => handleInput(clue.clueID, e.target.value)}
                    disabled={submitted}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={handleSubmit} disabled={submitted}>
              Submit Answers
            </button>
            <button className="btn ghost" onClick={() => navigate("/leaderboard")}>
              Leaderboard
            </button>
          </div>
        </aside>
      </main>

      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>{popup.title}</h2>
            <p>{popup.message}</p>
            <button
              className="btn primary"
              onClick={() => {
                setPopup({ open: false });
                if (popup.success) navigate("/leaderboard");
              }}
            >
              {popup.success ? "Go to Leaderboard" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
