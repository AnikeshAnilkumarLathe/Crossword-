import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CrosswordPage.css";
import GateTransition from "./GateTransition";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [crossword, setCrossword] = useState(null);
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [popup, setPopup] = useState({ open: false, title: "", message: "", success: false });

  const TOTAL_TIME = 180; // 3 minutes
  const [remaining, setRemaining] = useState(TOTAL_TIME);

  // ✅ Fetch crossword data
  useEffect(() => {
    const fetchCrossword = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/crossword/1"); // use your crossword id
        const data = await res.json();
        console.log("Crossword fetched:", data);
        setCrossword(data);

        // ✅ Build grid (null = black cell)
        const g = data.Grid.map((row) =>
          row.map((cell) => (cell.IsBlank ? null : ""))
        );
        setGrid(g);
      } catch (err) {
        console.error("Error fetching crossword:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrossword();
  }, []);

  // ✅ Countdown timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRemaining(0);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const inputRefs = useRef({});
  const keyFor = (r, c) => `${r}-${c}`;
  const focusCell = (r, c) => {
    const el = inputRefs.current[keyFor(r, c)];
    if (el) el.focus();
  };

  const findNextCell = (r, c) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    for (let cc = c + 1; cc < cols; cc++) if (grid[r][cc] !== null) return [r, cc];
    for (let rr = r + 1; rr < rows; rr++)
      for (let cc = 0; cc < cols; cc++) if (grid[rr][cc] !== null) return [rr, cc];
    return null;
  };

  const findPrevCell = (r, c) => {
    const cols = grid[0]?.length || 0;
    for (let cc = c - 1; cc >= 0; cc--) if (grid[r][cc] !== null) return [r, cc];
    for (let rr = r - 1; rr >= 0; rr--)
      for (let cc = cols - 1; cc >= 0; cc--) if (grid[rr][cc] !== null) return [rr, cc];
    return null;
  };

  const handleInput = (r, c, e) => {
    const char = e.target.value.toUpperCase().slice(-1);
    if (!/^[A-Z]$/.test(char) && e.target.value !== "") return;
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = e.target.value === "" ? "" : char;
      return next;
    });
    const next = findNextCell(r, c);
    if (next) focusCell(next[0], next[1]);
  };

  const handleKeyDown = (r, c, e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = findNextCell(r, c);
      if (next) focusCell(next[0], next[1]);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = findPrevCell(r, c);
      if (prev) focusCell(prev[0], prev[1]);
    }
    if (e.key === "Backspace") {
      if (!grid[r][c]) {
        const prev = findPrevCell(r, c);
        if (prev) {
          focusCell(prev[0], prev[1]);
        }
      }
    }
  };

  // ✅ Numbering from backend
  const getNumberingMap = useMemo(() => {
    const map = {};
    if (!crossword?.Grid) return map;
    crossword.Grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (cell.NumberAssociated > 0) map[`${r}-${c}`] = cell.NumberAssociated;
      })
    );
    return map;
  }, [crossword]);

  // ✅ Submission
  const handleSubmit = async () => {
    if (!crossword || submitted) return;
    const allClues = [
      ...(crossword.Clues?.Across || []),
      ...(crossword.Clues?.Down || []),
    ];

    const userAnswers = allClues.map((clue) => ({
      clueID: clue.ClueID,
      clueText: clue.ClueText?.trim() || "",
    }));

    const payload = {
      crossword_id: crossword.CrosswordID,
      answers: userAnswers,
    };

    try {
      const res = await fetch("https://crosswordbackend.onrender.com/submitcrossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      setPopup({
        open: true,
        title: res.ok ? "✅ Submission Successful!" : "❌ Submission Failed",
        message: result.message || (res.ok ? "Your answers are saved." : "Please try again."),
        success: res.ok,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setPopup({
        open: true,
        title: "⚠️ Network Error",
        message: "Unable to connect to server. Try again later.",
        success: false,
      });
    }
  };

  if (loading || !crossword)
    return <div className="cw-root"><p>Loading crossword...</p></div>;

  return (
    <div className="cw-root dark">
      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">👤 {user?.name || "Guest"}</div>
          <div className="cw-timer">⏳ {formatTime(remaining)}</div>
        </div>
      </header>

      <main className="cw-main">
        {/* ✅ BOARD */}
        <section className="cw-board">
          <div className="board-grid" role="grid">
            {grid.map((row, r) => (
              <div className="board-row" key={r}>
                {row.map((cell, c) => {
                  const number = getNumberingMap[`${r}-${c}`];
                  const isBlank = cell === null;
                  return (
                    <div
                      key={c}
                      className={`cell ${isBlank ? "black" : "white"}`}
                    >
                      {!isBlank && number && (
                        <span className="cell-number">{number}</span>
                      )}
                      {!isBlank && (
                        <input
                          ref={(el) => (inputRefs.current[keyFor(r, c)] = el)}
                          className="cell-input"
                          maxLength={1}
                          value={grid[r][c] || ""}
                          onChange={(e) => handleInput(r, c, e)}
                          onKeyDown={(e) => handleKeyDown(r, c, e)}
                          disabled={submitted}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* ✅ SIDE BAR */}
        <aside className="cw-side">
          <h3>Clues</h3>
          <div className="clue-group">
            <h4>Across</h4>
            <ul>
              {crossword.Clues?.Across?.map((c) => (
                <li key={c.ClueID}>
                  <strong>{c.ClueID}</strong> — {c.ClueText}
                </li>
              ))}
            </ul>
          </div>
          <div className="clue-group">
            <h4>Down</h4>
            <ul>
              {crossword.Clues?.Down?.map((c) => (
                <li key={c.ClueID}>
                  <strong>{c.ClueID}</strong> — {c.ClueText}
                </li>
              ))}
            </ul>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={handleSubmit} disabled={submitted}>
              Submit Answers
            </button>
            <button className="btn ghost" onClick={() => navigate("/leaderboard")}>
              🏆 Leaderboard
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
