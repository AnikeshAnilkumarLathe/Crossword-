import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { layout, clues, solution } from "../data/crosswordData";
import "../styles/CrosswordPage.css";
import GateTransition from "./GateTransition";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const startTime = Number(localStorage.getItem("startTime")) || Date.now();
  const [crossword, setCrossword] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const TOTAL_TIME = 180; // 3 minutes = 180 seconds
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const [popup, setPopup] = useState({ open: false, title: "", message: "", success: false });

  useEffect(() => {
    const fetchCrossword = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/crossword");
        const data = await res.json();
        console.log(data);
        setCrossword(data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrossword();
  }, []);

  // Build initial grid
  const initialGrid = useMemo(() => {
    return layout.map((row) => row.map((cell) => (cell === "" ? null : "")));
  }, []);

  const [grid, setGrid] = useState(initialGrid);

  useEffect(() => {
  if (submitted) return;

  const timer = setInterval(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        setRemaining(0);
        setSubmitted(true);
        handleSubmit(); // ⏰ Auto-submit when timer ends
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [submitted]); // dependencies


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const inputRefs = useRef({});
  const keyFor = (r, c) => `${r}-${c}`;

  const focusCell = (r, c) => {
    const key = keyFor(r, c);
    const el = inputRefs.current[key];
    if (el && typeof el.focus === "function") {
      el.focus();
      if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const findNextCell = (r, c) => {
    const rows = layout.length;
    const cols = layout[0]?.length ?? 0;
    for (let cc = c + 1; cc < cols; cc++) if (layout[r][cc] !== "") return [r, cc];
    for (let rr = r + 1; rr < rows; rr++)
      for (let cc = 0; cc < cols; cc++) if (layout[rr][cc] !== "") return [rr, cc];
    return null;
  };

  const findPrevCell = (r, c) => {
    const cols = layout[0]?.length ?? 0;
    for (let cc = c - 1; cc >= 0; cc--) if (layout[r][cc] !== "") return [r, cc];
    for (let rr = r - 1; rr >= 0; rr--)
      for (let cc = cols - 1; cc >= 0; cc--) if (layout[rr][cc] !== "") return [rr, cc];
    return null;
  };

  const moveToNearestRightOrDown = (r, c) => {
    const rows = layout.length;
    const cols = layout[0].length;
    for (let offset = 1; offset <= Math.max(rows, cols); offset++) {
      if (c + offset < cols && layout[r][c + offset] !== "") {
        focusCell(r, c + offset);
        return true;
      }
      if (r + offset < rows && layout[r + offset][c] !== "") {
        focusCell(r + offset, c);
        return true;
      }
    }
    return false;
  };

  const handleInput = (r, c, e) => {
    const raw = e.target.value || "";
    const char = raw.slice(-1).toUpperCase();
    if (!/^[A-Z]$/.test(char)) {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = char === "" ? "" : prev[r][c];
        return next;
      });
      return;
    }
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = char;
      return next;
    });
    moveToNearestRightOrDown(r, c);
  };

  const handleKeyDown = (r, c, e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = findNextCell(r, c);
      if (next) focusCell(next[0], next[1]);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = findPrevCell(r, c);
      if (prev) focusCell(prev[0], prev[1]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      for (let rr = r + 1; rr < layout.length; rr++) {
        if (layout[rr][c] !== "") {
          focusCell(rr, c);
          break;
        }
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      for (let rr = r - 1; rr >= 0; rr--) {
        if (layout[rr][c] !== "") {
          focusCell(rr, c);
          break;
        }
      }
      return;
    }
    if (e.key === "Backspace") {
      if (!grid[r][c]) {
        const prev = findPrevCell(r, c);
        if (prev) {
          focusCell(prev[0], prev[1]);
          setGrid((prevGrid) => {
            const next = prevGrid.map((row) => [...row]);
            next[prev[0]][prev[1]] = "";
            return next;
          });
        }
      } else {
        setGrid((prevGrid) => {
          const next = prevGrid.map((row) => [...row]);
          next[r][c] = "";
          return next;
        });
      }
      e.preventDefault();
    }
  };

  // Generate numbering map
  const getNumberingMap = useMemo(() => {
    const map = {};
    let num = 1;
    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        if (layout[r][c] === "") continue;
        const startAcross =
          (c === 0 || layout[r][c - 1] === "") &&
          c + 1 < layout[r].length &&
          layout[r][c + 1] !== "";
        const startDown =
          (r === 0 || layout[r - 1][c] === "") &&
          r + 1 < layout.length &&
          layout[r + 1][c] !== "";
        if (startAcross || startDown) {
          map[`${r}-${c}`] = num++;
        }
      }
    }
    return map;
  }, [layout]);

  // Handle submission
  // Handle submission
const handleSubmit = async () => {
  if (submitted) return;

  // 1️⃣ Construct user answers in backend format
  const userAnswers = clues.map((clue, index) => {
    let word = "";

    if (clue.dir === "across") {
      for (let i = 0; i < clue.length; i++) {
        const char = grid[clue.row][clue.col + i];
        word += char ? char.toUpperCase() : "";
      }
    } else if (clue.dir === "down") {
      for (let i = 0; i < clue.length; i++) {
        const char = grid[clue.row + i]?.[clue.col];
        word += char ? char.toUpperCase() : "";
      }
    }

    return {
      clueID: index + 1,
      clueText: word.trim(),
    };
  });

  // 2️⃣ Payload for backend
  const payload = {
    crossword_id: 1, // or dynamic crosswordId from API
    answers: userAnswers,
  };

  try {
    const res = await fetch("https://crosswordbackend.onrender.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      setPopup({
        open: true,
        title: "✅ Submission Successful!",
        message: result.message || "Your answers have been submitted successfully.",
        success: true,
      });
    } else {
      setPopup({
        open: true,
        title: "❌ Submission Failed",
        message: result.message || "Something went wrong. Please try again.",
        success: false,
      });
    }

    setSubmitted(true);
  } catch (error) {
    setPopup({
      open: true,
      title: "⚠️ Network Error",
      message: "Unable to connect to the server. Please try again later.",
      success: false,
    });
  }
};



  const handleGateComplete = () => setLoading(false);

  return (
    <div className="cw-root">
      {loading && <GateTransition loading={loading} onComplete={handleGateComplete} />}
      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">
            Player: <strong>{user?.name || "Guest"}</strong>
          </div>
          <div className="cw-timer">
            ⏳ Time Left: <strong>{formatTime(remaining)}</strong>
          </div>
        </div>
      </header>

      <main className="cw-main">
        <section className="cw-board">
          <div className="board-grid large" role="grid" aria-label="Crossword grid">
            {grid.map((row, r) => (
              <div className="board-row" role="row" key={r}>
                {row.map((cell, c) => {
                  const isWordCell = cell !== null;
                  const key = keyFor(r, c);
                  const number = getNumberingMap[key];
                  return (
                    <div
                      key={c}
                      className={`cell ${isWordCell ? "white" : "black"}`}
                      role="gridcell"
                    >
                      {isWordCell && number && (
                        <span className="cell-number">{number}</span>
                      )}
                      {isWordCell ? (
                        <input
                          ref={(el) => (inputRefs.current[key] = el)}
                          className="cell-input"
                          maxLength={1}
                          value={grid[r][c] || ""}
                          onChange={(e) => handleInput(r, c, e)}
                          onKeyDown={(e) => handleKeyDown(r, c, e)}
                          disabled={submitted}
                          inputMode="text"
                          autoComplete="off"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <aside className="cw-side">
          <div className="clues">
            <h3>Clues</h3>
            <div className="clue-group">
              <h4>Across</h4>
              <ul>
                {clues
                  .filter((c) => c.dir === "across")
                  .map((c) => (
                    <li key={c.id}>
                      <strong>{c.id}</strong> — {c.clue}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="clue-group">
              <h4>Down</h4>
              <ul>
                {clues
                  .filter((c) => c.dir === "down")
                  .map((c) => (
                    <li key={c.id}>
                      <strong>{c.id}</strong> — {c.clue}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="actions">
            <button
              className="btn primary"
              onClick={handleSubmit}
              disabled={submitted}
            >
              Submit Answers
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setLoading(true);
                setTimeout(() => navigate("/leaderboard"), 900);
              }}
            >
              View Leaderboard
            </button>
          </div>

          <div className="progress-card">
            <h4>Progress</h4>
            <p>
              Filled: <strong>{grid.flat().filter(Boolean).length}</strong>
            </p>
            <p>
              Words: <strong>{clues.length}</strong>
            </p>
          </div>
        </aside>
      </main>
      {popup.open && (
  <div className="popup-overlay">
    <div className="popup-box">
      <h2>{popup.title}</h2>
      <p>{popup.message}</p>
      <div className="popup-actions">
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
  </div>
)}

    </div>
  );
}
