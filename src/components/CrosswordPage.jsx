import React, { useEffect, useState, useMemo } from "react";
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

  // 🧠 Build the crossword grid only once for better performance
  const initialGrid = useMemo(
    () => layout.map((row) => row.map((cell) => (cell === "" ? "" : ""))),
    []
  );

  const [grid, setGrid] = useState(initialGrid);
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - startTime) / 1000)
  );

  // 🕒 Timer
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

  // 🧩 Handle input change
  const handleChange = (r, c, value) => {
    if (layout[r][c] === "") return;
    const letter = value.slice(0, 1).toUpperCase();
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = letter;
      return next;
    });
  };

  // 🚀 Handle puzzle submission
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
      name: user.name,
      time: elapsed,
      correct,
      total,
      timestamp: Date.now(),
    };

    // Update leaderboard
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    leaderboard.push(entry);
    leaderboard.sort((a, b) => a.time - b.time || b.correct - a.correct);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    localStorage.setItem("lastResult", JSON.stringify(entry));

    setSubmitted(true);
    alert(`Submitted — ${correct}/${total} correct • ${elapsed}s`);

    setLoading(true);
    setTimeout(() => navigate("/leaderboard"), 700);
  };

  const handleGateComplete = () => {
    setLoading(false);
  };

  const resetPuzzle = () => {
    setGrid(initialGrid);
    localStorage.setItem("startTime", Date.now().toString());
    setElapsed(0);
    setSubmitted(false);
  };

  return (
    <div className="cw-root">
      {loading && <GateTransition loading={loading} onComplete={handleGateComplete} />}

      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">
            Player: <strong>{user?.name}</strong>
          </div>
          <div className="cw-timer">Time: {elapsed}s</div>
        </div>
      </header>

      <main className="cw-main">
        {/* Crossword Grid */}
        <section className="cw-board">
          <div className="board-grid" role="grid" aria-label="Crossword grid">
            {grid.map((row, r) => (
              <div className="board-row" role="row" key={r}>
                {row.map((cell, c) => {
                  const isWordCell = layout[r][c] !== "";
                  return (
                    <div
                      key={c}
                      className={`cell ${isWordCell ? "white" : "black"}`}
                      role="gridcell"
                    >
                      {isWordCell && (
                        <input
                          className="cell-input"
                          maxLength={1}
                          value={grid[r][c] || ""}
                          onChange={(e) => handleChange(r, c, e.target.value)}
                          disabled={submitted}
                          autoComplete="off"
                          aria-label={`Row ${r + 1} col ${c + 1}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* Clues + Controls */}
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
                {clues.filter((c) => c.dir === "down").length === 0 ? (
                  <li>— No down clues in this sample —</li>
                ) : (
                  clues
                    .filter((c) => c.dir === "down")
                    .map((c) => (
                      <li key={c.id}>
                        <strong>{c.id}</strong> — {c.clue}
                      </li>
                    ))
                )}
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
            <button className="btn muted" onClick={resetPuzzle}>
              Restart
            </button>
            <button
              className="btn ghost"
              onClick={() => navigate("/leaderboard")}
            >
              View Leaderboard
            </button>
          </div>

          <div className="progress-card">
            <h4>Progress</h4>
            <p>
              Filled: <strong>{grid.flat().filter((x) => x).length}</strong>
            </p>
            <p>
              Words: <strong>{clues.length}</strong>
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
