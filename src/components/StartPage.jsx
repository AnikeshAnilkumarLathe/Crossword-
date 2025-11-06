import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SolutionPage.css";

export default function SolutionPage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(1);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSolution() {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/getsolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crossword_id: day }),
        });
        const data = await res.json();
        setSolution({
          grid: data.crossword?.Grid || [],
          clues: data.crossword?.Clues || { Across: [], Down: [] },
          solution: data.solution?.sol || [],
        });
      } catch {
        setSolution(null);
      }
      setLoading(false);
    }
    fetchSolution();
  }, [day]);

  // Map answers by ClueID
  const answersMap = useMemo(() => {
    const map = {};
    if (solution?.solution && Array.isArray(solution.solution)) {
      solution.solution.forEach(({ ClueID, ClueText }) => {
        map[ClueID] = ClueText.toUpperCase();
      });
    }
    return map;
  }, [solution?.solution]);

  // Fill grid with answers mapped to appropriate clue positions
  const filledGrid = useMemo(() => {
    if (!solution || !solution.grid.length) return [];

    const baseGrid = solution.grid.map(row =>
      row.map(cell => (cell.IsBlank ? null : ""))
    );

    (solution.clues?.Across || []).forEach(clue => {
      const answer = answersMap[clue.ClueID] || "";
      const row = (clue.ClueRow || 1) - 1;
      const col = (clue.ClueCol || 1) - 1;

      for (let i = 0; i < answer.length && col + i < baseGrid[0].length; i++) {
        if (baseGrid[row][col + i] !== null) {
          baseGrid[row][col + i] = answer[i];
        }
      }
    });

    (solution.clues?.Down || []).forEach(clue => {
      const answer = answersMap[clue.ClueID] || "";
      const row = (clue.ClueRow || 1) - 1;
      const col = (clue.ClueCol || 1) - 1;

      for (let i = 0; i < answer.length && row + i < baseGrid.length; i++) {
        if (baseGrid[row + i][col] !== null) {
          baseGrid[row + i][col] = answer[i];
        }
      }
    });

    return baseGrid;
  }, [solution, answersMap]);

  // Generate numbering map for clue starts
  const getNumberingMap = useMemo(() => {
    const map = {};
    if (!solution?.grid || !solution.grid.length) return map;
    let num = 1;

    for (let r = 0; r < solution.grid.length; r++) {
      for (let c = 0; c < solution.grid[r].length; c++) {
        if (solution.grid[r][c].IsBlank) continue;

        const startAcross =
          (c === 0 || solution.grid[r][c - 1].IsBlank) &&
          c + 1 < solution.grid[r].length &&
          !solution.grid[r][c + 1].IsBlank;

        const startDown =
          (r === 0 || solution.grid[r - 1][c].IsBlank) &&
          r + 1 < solution.grid.length &&
          !solution.grid[r + 1][c].IsBlank;

        if (startAcross || startDown) {
          map[`${r}-${c}`] = num++;
        }
      }
    }
    return map;
  }, [solution]);

  return (
    <div className="solution-root">
      <nav className="lb-navbar">
        <div className="nav-left">
          Crossword by <strong>CC</strong> and <strong>EPC</strong>
        </div>
        <div className="nav-center">Solutions</div>
        <div className="nav-right">
          <button className="home-btn" onClick={() => navigate("/")}>Home</button>
          <button className="home-btn" onClick={() => navigate("/leaderboard")}>Leaderboard</button>
        </div>
      </nav>

      <main className="solution-main">
        <div className="solution-controls">
          <button onClick={() => setDay(d => Math.max(1, d - 1))}>Prev Day</button>
          <span style={{ margin: "0 10px" }}>Day {day} Solution</span>
          <button onClick={() => setDay(d => d + 1)}>Next Day</button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : !solution ? (
          <div>No solution available for day {day}</div>
        ) : (
          <div className="solution-card">
            <h3>Day {day} Solution</h3>
            {filledGrid.length > 0 && (
              <table className="grid-table">
                <tbody>
                  {filledGrid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => {
                        const originalCell = solution.grid[r][c];
                        const number = getNumberingMap[`${r}-${c}`];

                        return (
                          <td key={c} className={originalCell.IsBlank ? "cell-black" : "cell-white"}>
                            {number && <span className="cell-number">{number}</span>}
                            {cell || ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div>
              <h4>Clues & Answers</h4>
              <ul>
                {(solution.clues?.Across || []).map((clue, i) => (
                  <li key={`across-${i}`}>
                    <strong>Across {clue.ClueID}:</strong> {clue.ClueText} — <span className="answer">{answersMap[clue.ClueID]}</span>
                  </li>
                ))}
                {(solution.clues?.Down || []).map((clue, i) => (
                  <li key={`down-${i}`}>
                    <strong>Down {clue.ClueID}:</strong> {clue.ClueText} — <span className="answer">{answersMap[clue.ClueID]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
