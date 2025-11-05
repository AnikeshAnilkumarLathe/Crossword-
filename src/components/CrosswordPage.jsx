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

  // Fetch crossword data from backend
  useEffect(() => {
    const fetchCrossword = async () => {
  setLoading(true);
  try {
    const res = await fetch("https://crosswordbackend.onrender.com/crossword");
    const data = await res.json();
    console.log("Fetched crossword:", data);

    // 🧠 Convert backend grid to the format your React UI expects
    const transformedLayout = data.Grid.map((row) =>
      row.map((cell) => (cell.IsBlank ? "" : ""))
    );

    setCrossword({
      ...data,
      layout: transformedLayout,
      clues: data.Clues,
    });
  } catch (error) {
    console.log("Error fetching crossword:", error);
  } finally {
    setLoading(false);
  }
};
  fetchCrossword();

  }, []);

  // Start countdown timer
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRemaining(0);
          handleSubmit(); // auto-submit when time ends
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  // Format time as MM:SS
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
      if (el.setSelectionRange)
        el.setSelectionRange(el.value.length, el.value.length);
    }
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

  const moveToNearestRightOrDown = (r, c) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    for (let offset = 1; offset <= Math.max(rows, cols); offset++) {
      if (c + offset < cols && grid[r][c + offset] !== null) {
        focusCell(r, c + offset);
        return true;
      }
      if (r + offset < rows && grid[r + offset][c] !== null) {
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
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = findPrevCell(r, c);
      if (prev) focusCell(prev[0], prev[1]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      for (let rr = r + 1; rr < grid.length; rr++) {
        if (grid[rr][c] !== null) {
          focusCell(rr, c);
          break;
        }
      }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      for (let rr = r - 1; rr >= 0; rr--) {
        if (grid[rr][c] !== null) {
          focusCell(rr, c);
          break;
        }
      }
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

  // Numbering logic
  const getNumberingMap = useMemo(() => {
    const map = {};
    if (!grid.length) return map;
    let num = 1;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === null) continue;
        const startAcross =
          (c === 0 || grid[r][c - 1] === null) &&
          c + 1 < grid[r].length &&
          grid[r][c + 1] !== null;
        const startDown =
          (r === 0 || grid[r - 1][c] === null) &&
          r + 1 < grid.length &&
          grid[r + 1][c] !== null;
        if (startAcross || startDown) {
          map[`${r}-${c}`] = num++;
        }
      }
    }
    return map;
  }, [grid]);

  const handleSubmit = async () => {
    if (!crossword || submitted) return;

    // Flatten clues from backend
    const allClues = [
      ...(crossword.Clues?.Across || []).map((c) => ({ ...c, dir: "across" })),
      ...(crossword.Clues?.Down || []).map((c) => ({ ...c, dir: "down" })),
    ];

    const userAnswers = allClues.map((clue, index) => {
      let word = "";
      // simple word collector — if your backend gives row/col, modify accordingly
      word = clue.ClueText ? clue.ClueText.replace(/[^A-Z]/gi, "") : "";
      return {
        clueID: clue.ClueID,
        clueText: word.trim(),
      };
    });

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
    } catch (err) {
      setPopup({
        open: true,
        title: "⚠️ Network Error",
        message: "Unable to connect to the server. Please try again later.",
        success: false,
      });
    }
  };

  if (loading || !crossword) {
    return <div className="cw-root"><p>Loading crossword...</p></div>;
  }

  const allClues = [
    ...(crossword.Clues?.Across || []).map((c) => ({ ...c, dir: "across" })),
    ...(crossword.Clues?.Down || []).map((c) => ({ ...c, dir: "down" })),
  ];

  return (
    <div className="cw-root dark">
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
          <div className="board-grid large" role="grid">
            {grid.map((row, r) => (
              <div className="board-row" key={r}>
                {row.map((cell, c) => {
                  const key = keyFor(r, c);
                  const number = getNumberingMap[key];
                  return (
                    <div key={c} className={`cell ${cell !== null ? "white" : "black"}`}>
                      {cell !== null && number && <span className="cell-number">{number}</span>}
                      {cell !== null && (
                        <input
                          ref={(el) => (inputRefs.current[key] = el)}
                          className="cell-input"
                          maxLength={1}
                          value={grid[r][c] || ""}
                          onChange={(e) => handleInput(r, c, e)}
                          onKeyDown={(e) => handleKeyDown(r, c, e)}
                          disabled={submitted}
                          autoComplete="off"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

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
