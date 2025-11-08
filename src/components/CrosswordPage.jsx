import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CrosswordPage.css";

export default function CrosswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [crossword, setCrossword] = useState(null);
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [typingDir, setTypingDir] = useState("across"); 
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: "",
    success: false,
  });

  const TOTAL_TIME = 180;
  const [remaining, setRemaining] = useState(TOTAL_TIME);

  useEffect(() => {
    const fetchCrossword = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/crossword");
        const data = await res.json();
        setCrossword(data);

        let savedGrid = null;
        try {
          const raw = localStorage.getItem("cw-grid");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) savedGrid = parsed;
          }
        } catch (e) {
          console.warn("Invalid cw-grid in localStorage:", e);
        }

        if (savedGrid && savedGrid.length) {
          setGrid(savedGrid);
        } else if (Array.isArray(data.Grid)) {
          const g = data.Grid.map((row) =>
            row.map((cell) => (cell.IsBlank ? null : ""))
          );
          setGrid(g);
        }

        const savedTime = parseInt(localStorage.getItem("cw-time"), 10);
        const lastTimestamp = parseInt(localStorage.getItem("cw-timestamp"), 10);
        const now = Date.now();
        if (!isNaN(savedTime) && savedTime > 0) {
          if (!isNaN(lastTimestamp)) {
            const elapsed = Math.floor((now - lastTimestamp) / 1000);
            const newRemaining = Math.max(0, savedTime - elapsed);
            setRemaining(newRemaining);
            localStorage.setItem("cw-time", newRemaining.toString());
            localStorage.setItem("cw-timestamp", now.toString());
          } else {
            setRemaining(savedTime);
            localStorage.setItem("cw-timestamp", now.toString());
          }
        } else {
          localStorage.setItem("cw-timestamp", now.toString());
        }
      } catch (e) {
        console.error("Error fetching crossword:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCrossword();
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      localStorage.setItem("cw-grid", JSON.stringify(grid));
    }
  }, [grid]);

  function getClueLength(grid, row, col, dir) {
    if (
      !Array.isArray(grid) ||
      typeof row !== "number" ||
      typeof col !== "number" ||
      grid[row] === undefined ||
      grid[row][col] === null
    )
      return 0;
    let len = 0;
    if (dir === "across") {
      while (
        col + len < grid[row].length &&
        grid[row][col + len] !== null
      )
        len++;
    } else if (dir === "down") {
      while (
        row + len < grid.length &&
        grid[row + len] &&
        grid[row + len][col] !== null
      )
        len++;
    }
    return len;
  }

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

    const handleSubmit = useCallback(async () => {
    if (!crossword) {
      console.warn("handleSubmit called but crossword is null");
      return;
    }
    if (submitted) {
      console.warn("handleSubmit called but already submitted");
      return;
    }

    localStorage.removeItem("cw-grid");
    localStorage.removeItem("cw-time");
    localStorage.removeItem("cw-timestamp");
    localStorage.setItem("cw-submitted", crossword.CrosswordID.toString());

    const clueIdToGridCoordinates = {};
    Object.entries(getNumberingMap).forEach(([key, clueNum]) => {
      clueIdToGridCoordinates[clueNum] = key.split("-").map(Number);
    });

    const cluesRaw = [
      ...(crossword.Clues?.Across || []).map((c) => ({
        ...c,
        dir: "across",
        gridCoordinates: clueIdToGridCoordinates[c.ClueID],
      })),
      ...(crossword.Clues?.Down || []).map((c) => ({
        ...c,
        dir: "down",
        gridCoordinates: clueIdToGridCoordinates[c.ClueID],
      })),
    ];

    const validClues = cluesRaw.filter((clue) =>
      Array.isArray(clue.gridCoordinates)
    );

    const clues = validClues.map((clue) => {
      const [row, col] = clue.gridCoordinates;
      const length = getClueLength(grid, row, col, clue.dir);
      return { ...clue, ClueRow: row + 1, ClueCol: col + 1, ClueLength: length };
    });

    const answers = clues.map((clue) => {
      let word = "";
      const startRow = clue.ClueRow - 1;
      const startCol = clue.ClueCol - 1;

      if (clue.dir === "across") {
        for (let i = 0; i < clue.ClueLength; i++) {
          word += (grid[startRow]?.[startCol + i] || "").toUpperCase();
        }
      } else {
        for (let i = 0; i < clue.ClueLength; i++) {
          word += (grid[startRow + i]?.[startCol] || "").toUpperCase();
        }
      }

      let clueText;
      if (word && word.length === clue.ClueLength) {
        clueText = word.toUpperCase();
      } else {
        clueText = "";
      }

      return {
        clueID: clue.ClueID,
        clueText,
      };
    });

    const payload = {
      crossword_id: crossword.CrosswordID,
      answers,
      time_left: remaining,
    };

    console.log("Payload to submit", payload);

    const jwt = localStorage.getItem("jwt");
    if (!jwt) console.warn("JWT token missing!");

    try {
      const res = await fetch("https://crosswordbackend.onrender.com/submitcrossword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.removeItem("cw-grid");
        localStorage.removeItem("cw-time");
        localStorage.removeItem("cw-timestamp");

        setPopup({
          open: true,
          title: "✅ Submission Successful!",
          message: result.message || "Your answers have been submitted successfully.",
          success: true,
        });
      } else {
        setPopup({
          open: true,
          title: "❌ Multiple Submissions Detected",
          message:
            result.message ||
            "You have already submitted answers for this crossword.",
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
      console.error("Submission error:", err);
    }
  }, [crossword, grid, submitted, getNumberingMap, remaining]);

  useEffect(() => {
    if (submitted || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        const newTime = prev - 1;
        localStorage.setItem("cw-time", newTime.toString());
        localStorage.setItem("cw-timestamp", Date.now().toString());
        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, handleSubmit, remaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <div className="cw-timer">
            Time Left: <strong>{formatTime(remaining)}</strong>
          </div>
        </div>
      </header>
      <main className="cw-main">
        <section className="cw-board">
          <div className="board-scroll">
            <div className="board-grid large" role="grid">
              
              {grid.map((row, r) => (
                <div className="board-row" key={r}>
                  {row.map((cell, c) => {
                    const key = keyFor(r, c);
                    const cellData = crossword.Grid[r][c]
                    const isBlank = cellData?.IsBlank;
                    const number = cellData?.NumberAssociated;
                    return (
                      <div key={c} className={`cell ${isBlank === false ? "white" : "black"}`}>
                        {cellData !== null && number>0  && (
                          <span className="cell-number"> {number} </span>
                        )}
                        {cellData !== null && (
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
           </div>
        </section>
        <aside className="cw-side">
          <h3 className="clue">Clues</h3>
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
          navigate("/leaderboard");
        }}
      >
        Go to Leaderboard
      </button>
    </div>
  </div>
)}

    </div>
  );
}
