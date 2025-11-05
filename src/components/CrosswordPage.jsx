// src/components/CrosswordPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CrosswordPage.css";
import GateTransition from "./GateTransition";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [crosswordRaw, setCrosswordRaw] = useState(null); // raw API object
  const [layout, setLayout] = useState([]); // transformed layout array[row][col] ("" = black, "." = fillable)
  const [clues, setClues] = useState({ Across: [], Down: [] }); // store backend clues
  const [crosswordId, setCrosswordId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const TOTAL_TIME = 180; // seconds
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const [popup, setPopup] = useState({ open: false, title: "", message: "", success: false });

  // grid letters state: null for black cells, "" for empty fillable cells or the letter
  const initialGridFromLayout = (layoutArr) =>
    layoutArr.map((row) => row.map((cell) => (cell === "" ? null : "")));

  const [grid, setGrid] = useState([]);

  // Input refs
  const inputRefs = useRef({});
  const keyFor = (r, c) => `${r}-${c}`;

  // Fetch crossword from API and transform data
  useEffect(() => {
    const fetchCrossword = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/crossword"); 
        // Some servers might return non-JSON or wrapped JSON; attempt parse carefully
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          // If parse fails, re-throw with helpful message
          throw new Error("Invalid JSON returned from crossword API: " + err.message);
        }

        // Ensure Grid exists
        if (!data.Grid || !Array.isArray(data.Grid)) {
          throw new Error("Unexpected API shape: missing Grid array");
        }

        // Transform Grid -> layout
        const transformedLayout = data.Grid.map((row) =>
          row.map((cellObj) => {
            if (cellObj && typeof cellObj === "object") {
              return cellObj.IsBlank ? "" : "."; // "" = blocked, "." = fillable (non-empty)
            } else {
              // fallback: if backend already returns string, follow previous convention
              return cellObj === "" ? "" : ".";
            }
          })
        );

        // set layout, clues and raw data
        setLayout(transformedLayout);
        setClues({
          Across: (data.Clues && data.Clues.Across) || [],
          Down: (data.Clues && data.Clues.Down) || [],
        });
        setCrosswordId(data.CrosswordID ?? data.CrosswordId ?? data.id ?? null);
        setCrosswordRaw(data);

        // init grid letters
        setGrid(initialGridFromLayout(transformedLayout));
      } catch (error) {
        console.error("Error fetching crossword:", error);
        setPopup({
          open: true,
          title: "Error",
          message: "Could not load crossword: " + (error.message || "unknown error"),
          success: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCrossword();
  }, []);

  useEffect(() => {
    if (layout && layout.length) {
      setGrid(initialGridFromLayout(layout));
    }
  }, [layout]);

  // Timer and auto-submit
  useEffect(() => {
    if (submitted) return;
    setRemaining(TOTAL_TIME); // reset when component mounts / new crossword
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit
          handleSubmit(true).catch((err) => {
            console.error("Auto submit failed:", err);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, crosswordId]); // restart timer if crosswordId changes

  // Helpers: focusing, navigation
  const focusCell = (r, c) => {
    const key = keyFor(r, c);
    const el = inputRefs.current[key];
    if (el && typeof el.focus === "function") {
      el.focus();
      if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const findNextCell = (r, c) => {
    if (!layout || !layout[0]) return null;
    const rows = layout.length;
    const cols = layout[0].length;
    for (let cc = c + 1; cc < cols; cc++) if (layout[r][cc] !== "") return [r, cc];
    for (let rr = r + 1; rr < rows; rr++)
      for (let cc = 0; cc < cols; cc++) if (layout[rr][cc] !== "") return [rr, cc];
    return null;
  };

  const findPrevCell = (r, c) => {
    if (!layout || !layout[0]) return null;
    const cols = layout[0].length;
    for (let cc = c - 1; cc >= 0; cc--) if (layout[r][cc] !== "") return [r, cc];
    for (let rr = r - 1; rr >= 0; rr--)
      for (let cc = cols - 1; cc >= 0; cc--) if (layout[rr][cc] !== "") return [rr, cc];
    return null;
  };

  const moveToNearestRightOrDown = (r, c) => {
    if (!layout || !layout[0]) return false;
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

  // Input handler
  const handleInput = (r, c, e) => {
    const raw = e.target.value || "";
    const char = raw.slice(-1).toUpperCase();
    if (!/^[A-Z]$/.test(char) && char !== "") {
      // Non-letters (but allow clearing)
      return;
    }
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = char === "" ? "" : char;
      return next;
    });
    if (char !== "") {
      moveToNearestRightOrDown(r, c);
    }
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

  // numbering map: backend may already have NumberAssociated; if not we compute it.
  const numberingMap = useMemo(() => {
    const map = {};
    if (!crosswordRaw || !crosswordRaw.Grid) {
      // fallback compute from layout
      let num = 1;
      if (!layout || !layout.length) return map;
      for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[r].length; c++) {
          if (layout[r][c] === "") continue;
          const startAcross = (c === 0 || layout[r][c - 1] === "") && (c + 1 < layout[r].length && layout[r][c + 1] !== "");
          const startDown = (r === 0 || layout[r - 1][c] === "") && (r + 1 < layout.length && layout[r + 1][c] !== "");
          if (startAcross || startDown) {
            map[`${r}-${c}`] = num++;
          }
        }
      }
      return map;
    }

    // Use backend NumberAssociated if provided
    for (let r = 0; r < crosswordRaw.Grid.length; r++) {
      for (let c = 0; c < crosswordRaw.Grid[r].length; c++) {
        const cellObj = crosswordRaw.Grid[r][c];
        if (cellObj && typeof cellObj.NumberAssociated === "number" && cellObj.NumberAssociated > 0) {
          map[`${r}-${c}`] = cellObj.NumberAssociated;
        }
      }
    }
    return map;
  }, [crosswordRaw, layout]);

  // format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Build payload and submit answers
  // If autoSubmit flag true it was triggered by timer; else by user click.
  const handleSubmit = async (autoSubmit = false) => {
    if (submitted) return;
    // Build answers array using clues from backend (preferred) OR local clues if needed
    const backendClues = (clues && Array.isArray(clues.Across)) ? [...clues.Across, ...clues.Down] : [];
    // If backend clues are structured as objects with ClueID and ClueText, use those,
    // otherwise fallback to using combined clues array indices.
    const userAnswers = [];

    // Prefer using clues.Across and clues.Down separately so ordering is stable
    const acrossClues = clues.Across || [];
    const downClues = clues.Down || [];

    acrossClues.forEach((clueObj, idx) => {
      // we need row/col/length from backend clue object. If backend uses other names adjust accordingly.
      // If backend clue lacks row/col/length, we will fallback to constructing from Grid using NumberAssociated
      let word = "";
      if (clueObj.Row !== undefined && clueObj.Col !== undefined && clueObj.Length !== undefined) {
        for (let i = 0; i < clueObj.Length; i++) {
          const ch = grid[clueObj.Row][clueObj.Col + i];
          word += ch ? ch.toUpperCase() : "";
        }
      } else if (clueObj.StartRow !== undefined) {
        // alternate naming
        for (let i = 0; i < clueObj.Length; i++) {
          const ch = grid[clueObj.StartRow][clueObj.StartCol + i];
          word += ch ? ch.toUpperCase() : "";
        }
      } else {
        // fallback: try to find by NumberAssociated in the Grid (if clueObj.ClueID matches that)
        // This fallback may be brittle; better to have backend include row/col/length.
        word = clueObj.ClueText || "";
      }

      userAnswers.push({
        clueID: clueObj.ClueID ?? clueObj.id ?? idx + 1,
        clueText: word.trim(),
      });
    });

    downClues.forEach((clueObj, idx) => {
      let word = "";
      if (clueObj.Row !== undefined && clueObj.Col !== undefined && clueObj.Length !== undefined) {
        for (let i = 0; i < clueObj.Length; i++) {
          const ch = grid[clueObj.Row + i][clueObj.Col];
          word += ch ? ch.toUpperCase() : "";
        }
      } else if (clueObj.StartRow !== undefined) {
        for (let i = 0; i < clueObj.Length; i++) {
          const ch = grid[clueObj.StartRow + i][clueObj.StartCol];
          word += ch ? ch.toUpperCase() : "";
        }
      } else {
        word = clueObj.ClueText || "";
      }

      userAnswers.push({
        clueID: clueObj.ClueID ?? clueObj.id ?? acrossClues.length + idx + 1,
        clueText: word.trim(),
      });
    });

    // final payload
    const payload = {
      crossword_id: crosswordId ?? 1,
      answers: userAnswers,
    };

    try {
      setLoading(true);
      const res = await fetch("https://crosswordbackend.onrender.com/submitcrossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let resultText = await res.text();
      let result = {};
      try {
        result = JSON.parse(resultText);
      } catch {
        result = { message: resultText };
      }

      if (res.ok) {
        setPopup({
          open: true,
          title: "✅ Submission Successful!",
          message: result.message || "Your answers were submitted.",
          success: true,
        });
      } else {
        setPopup({
          open: true,
          title: "❌ Submission Failed",
          message: result.message || "Server rejected the submission.",
          success: false,
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
      setPopup({
        open: true,
        title: "⚠️ Network Error",
        message: "Could not submit answers. Try again later.",
        success: false,
      });
    } finally {
      setLoading(false);
      if (autoSubmit) {
        // keep popup visible; user can navigate after seeing it
      }
    }
  };

  // small guard: if layout empty show loading/placeholder
  const isReady = layout && layout.length > 0 && grid && grid.length > 0;

  return (
    <div className="cw-root">
      {loading && <GateTransition loading={loading} onComplete={() => {}} />}

      <header className="cw-header">
        <div className="cw-title">Crossword</div>
        <div className="cw-meta">
          <div className="cw-user">Player: <strong>{user?.name || "Guest"}</strong></div>
          <div className="cw-timer">⏳ Time Left: <strong>{formatTime(remaining)}</strong></div>
        </div>
      </header>

      <main className="cw-main">
        <section className="cw-board">
          <div className="board-grid large" role="grid" aria-label="Crossword grid">
            {!isReady ? (
              <div style={{ color: "#fff", padding: 24 }}>Loading crossword...</div>
            ) : (
              grid.map((row, r) => (
                <div className="board-row" role="row" key={r}>
                  {row.map((cell, c) => {
                    const isWordCell = layout[r][c] !== ""; // non-empty layout entry => fillable
                    const key = keyFor(r, c);
                    const number = numberingMap[key];
                    return (
                      <div
                        key={c}
                        className={`cell ${isWordCell ? "white" : "black"}`}
                        role="gridcell"
                      >
                        {isWordCell && number && <span className="cell-number">{number}</span>}
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
              ))
            )}
          </div>
        </section>

        <aside className="cw-side">
          <div className="clues">
            <h3>Clues</h3>

            <div className="clue-group">
              <h4>Across</h4>
              <ul>
                {(clues.Across || []).map((c) => (
                  <li key={c.ClueID ?? c.id ?? c.ClueText}>
                    <strong>{c.ClueID ?? ""}</strong> — {c.ClueText ?? c.clue ?? ""}
                  </li>
                ))}
              </ul>
            </div>

            <div className="clue-group">
              <h4>Down</h4>
              <ul>
                {(clues.Down || []).map((c) => (
                  <li key={c.ClueID ?? c.id ?? c.ClueText}>
                    <strong>{c.ClueID ?? ""}</strong> — {c.ClueText ?? c.clue ?? ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={() => handleSubmit(false)} disabled={submitted}>
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
            <p>Words: <strong>{(clues.Across?.length || 0) + (clues.Down?.length || 0)}</strong></p>
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
                  setPopup({ open: false, title: "", message: "", success: false });
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
