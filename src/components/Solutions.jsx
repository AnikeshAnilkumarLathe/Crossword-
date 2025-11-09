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

  // Fill grid
  const filledGrid = useMemo(() => {
    if (!solution || !solution.grid.length) return [];
    const baseGrid = solution.grid.map(row =>
      row.map(cell => (cell.IsBlank ? null : ""))
    );

    (solution.clues?.Across || []).forEach(clue => {
      for (let r = 0; r < solution.grid.length; r++) {
        for (let c = 0; c < solution.grid[r].length; c++) {
          const cell = solution.grid[r][c];
          if (!cell.IsBlank && cell.NumberAssociated > 0 && cell.NumberAssociated === clue.ClueID) {
            const answer = answersMap[clue.ClueID] || "";
            for (let k = 0; k < answer.length; k++) {
              if (c + k < baseGrid[r].length && baseGrid[r][c + k] !== null) {
                baseGrid[r][c + k] = answer[k];
              } else break;
            }
            return;
          }
        }
      }
    });

    (solution.clues?.Down || []).forEach(clue => {
      for (let r = 0; r < solution.grid.length; r++) {
        for (let c = 0; c < solution.grid[r].length; c++) {
          const cell = solution.grid[r][c];
          if (!cell.IsBlank && cell.NumberAssociated > 0 && cell.NumberAssociated === clue.ClueID) {
            const answer = answersMap[clue.ClueID] || "";
            for (let k = 0; k < answer.length; k++) {
              if (r + k < baseGrid.length && baseGrid[r + k][c] !== null) {
                baseGrid[r + k][c] = answer[k];
              } else break;
            }
            return;
          }
        }
      }
    });

    return baseGrid;
  }, [solution, answersMap]);

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
          <span style={{ margin: "0 10px" }}>Day {day-1} Solution</span>
          <button onClick={() => setDay(d => d + 1)}>Next Day</button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : !solution || !solution.grid.length ? (
          <div className="no-solution">
            The solutions will be posted soon! Please check back later.
          </div>
        ) : (
          <div className="solution-card">
            <h3>Day {day - 1} Solution</h3>
            {filledGrid.length > 0 && (
              <table className="grid-table">
                <tbody>
                  {filledGrid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => {
                        const origCell = solution.grid[r][c];
                        return (
                          <td
                            key={c}
                            className={
                              origCell.IsBlank
                                ? "cell-black"
                                : cell
                                ? "cell-white-filled"
                                : "cell-white"
                            }
                          >
                            {origCell.NumberAssociated > 0 && (
                              <span className="cell-number">
                                {origCell.NumberAssociated}
                              </span>
                            )}
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
