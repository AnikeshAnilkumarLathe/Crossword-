// src/components/CrosswordPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { layout, clues, solution } from "../data/crosswordData";
import "../styles/CrosswordPage.css";
import GateTransition from "./GateTransition";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const startTime = Number(localStorage.getItem("startTime")) || Date.now();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validate shape (helpful during dev)
  useEffect(() => {
    if (!layout || !Array.isArray(layout) || layout.length === 0) {
      console.warn("crossword layout is empty or invalid");
    }
    if (
      solution &&
      (solution.length !== layout.length || solution[0].length !== layout[0].length)
    ) {
      console.warn("layout and solution dimensions differ — ensure same shape");
    }
  }, []);

  // Build initial grid: null = blocked (black), "" = editable (white, empty)
  const initialGrid = useMemo(() => {
    return layout.map((row) =>
      row.map((cell) => {
        // Treat empty string "" in layout as blocked; anything else (letter, ".", 1) = white
        return cell === "" ? null : "";
      })
    );
  }, []);

  const [grid, setGrid] = useState(initialGrid);

  // Timer
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - startTime) / 1000)
  );

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, navigate, user]);

  // Refs for inputs: use an object keyed by "r-c"
  const inputRefs = useRef({});

  const keyFor = (r, c) => `${r}-${c}`;

  const focusCell = (r, c) => {
    const key = keyFor(r, c);
    const el = inputRefs.current[key];
    if (el && typeof el.focus === "function") {
      el.focus();
      // optionally place cursor at end
      if (el.setSelectionRange) {
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };

  // find next editable cell in reading order (right then down)
  const findNextCell = (r, c) => {
    const rows = layout.length;
    const cols = layout[0]?.length ?? 0;
    // first try to the right on same row
    for (let cc = c + 1; cc < cols; cc++) {
      if (layout[r][cc] !== "") return [r, cc];
    }
    // then scan subsequent rows left-to-right
    for (let rr = r + 1; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        if (layout[rr][cc] !== "") return [rr, cc];
      }
    }
    return null;
  };

  // find previous editable cell (left then up)
  const findPrevCell = (r, c) => {
    const cols = layout[0]?.length ?? 0;
    // left on same row
    for (let cc = c - 1; cc >= 0; cc--) {
      if (layout[r][cc] !== "") return [r, cc];
    }
    // scan previous rows right-to-left
    for (let rr = r - 1; rr >= 0; rr--) {
      for (let cc = cols - 1; cc >= 0; cc--) {
        if (layout[rr][cc] !== "") return [rr, cc];
      }
    }
    return null;
  };

  // Move according to nearest: prefer right, if none, nearest downward on same col scanning by offset
  const moveToNearestRightOrDown = (r, c) => {
    const rows = layout.length;
    const cols = layout[0].length;
    // Search offsets from 1 up to max(rows, cols)
    for (let offset = 1; offset <= Math.max(rows, cols); offset++) {
      // try right (same row)
      if (c + offset < cols && layout[r][c + offset] !== "") {
        focusCell(r, c + offset);
        return true;
      }
      // try down (same col)
      if (r + offset < rows && layout[r + offset][c] !== "") {
        focusCell(r + offset, c);
        return true;
      }
    }
    return false;
  };

  // handle input (typing)
  const handleInput = (r, c, e) => {
    const raw = e.target.value || "";
    const char = raw.slice(-1).toUpperCase(); // take last typed char
    if (!/^[A-Z]$/.test(char)) {
      // ignore non-letters; also clear if empty
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = char === "" ? "" : prev[r][c];
        return next;
      });
      return;
    }
    // set letter
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = char;
      return next;
    });

    // auto-move to nearest editable (right or down)
    moveToNearestRightOrDown(r, c);
  };

  // key navigation: arrows and backspace
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
      // move downward on same column to first available
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
      // if current cell has a value, clear it; if empty move to previous and clear that
      if (!grid[r][c]) {
        const prev = findPrevCell(r, c);
        if (prev) {
          focusCell(prev[0], prev[1]);
          // also clear previous
          setGrid((prevGrid) => {
            const next = prevGrid.map((row) => [...row]);
            next[prev[0]][prev[1]] = "";
            return next;
          });
        }
      } else {
        // clear current value
        setGrid((prevGrid) => {
          const next = prevGrid.map((row) => [...row]);
          next[r][c] = "";
          return next;
        });
      }
      // let default backspace not navigate browser
      e.preventDefault();
      return;
    }
  };

  // Score & submit
  const handleSubmit = () => {
    let total = 0,
      correct = 0;
    for (let r = 0; r < solution.length; r++) {
      for (let c = 0; c < solution[r].length; c++) {
        const sol = solution[r][c];
        if (sol && sol !== "") {
          total++;
          if ((grid[r][c] || "").toUpperCase() === sol.toUpperCase()) correct++;
        }
      }
    }

    const entry = {
      name: user?.name || "Player",
      time: Math.floor((Date.now() - startTime) / 1000),
      correct,
      total,
      timestamp: Date.now(),
    };

    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    leaderboard.push(entry);
    leaderboard.sort((a, b) => a.time - b.time || b.correct - a.correct);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    localStorage.setItem("lastResult", JSON.stringify(entry));

    setSubmitted(true);
    alert(`Submitted — ${correct}/${total} correct • ${entry.time}s`);
    setLoading(true);
    setTimeout(() => navigate("/leaderboard"), 900);
  };

  const handleGateComplete = () => setLoading(false);

  return (
    <div className="cw-root">
      {loading && <GateTransition loading={loading} onComplete={handleGateComplete} />}

      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">Player: <strong>{user?.name || "Guest"}</strong></div>
          <div className="cw-timer">Time: {Math.floor((Date.now() - startTime) / 1000)}s</div>
        </div>
      </header>

      <main className="cw-main">
        <section className="cw-board">
          <div className="board-grid" role="grid" aria-label="Crossword grid">
            {grid.map((row, r) => (
              <div className="board-row" role="row" key={r}>
                {row.map((cell, c) => {
                  const isWordCell = cell !== null; // null = blocked
                  const key = keyFor(r, c);
                  return (
                    <div
                      key={c}
                      className={`cell ${isWordCell ? "white" : "black"}`}
                      role="gridcell"
                      aria-hidden={!isWordCell}
                    >
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
                          aria-label={`Row ${r + 1} col ${c + 1}`}
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
                {clues.filter((c) => c.dir === "across").map((c) => (
                  <li key={c.id}><strong>{c.id}</strong> — {c.clue}</li>
                ))}
              </ul>
            </div>

            <div className="clue-group">
              <h4>Down</h4>
              <ul>
                {clues.filter((c) => c.dir === "down").map((c) => (
                  <li key={c.id}><strong>{c.id}</strong> — {c.clue}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={handleSubmit} disabled={submitted}>
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
            <p>Filled: <strong>{grid.flat().filter(Boolean).length}</strong></p>
            <p>Words: <strong>{clues.length}</strong></p>
          </div>
        </aside>
      </main>
    </div>
  );
}
