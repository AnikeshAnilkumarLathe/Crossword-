import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SolutionPage.css";

export default function SolutionPage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(1);  // Start at day 1
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSolution() {
      setLoading(true);
      console.log(`Fetching solution for crossword_id = ${day}...`);

      try {
        const res = await fetch("https://crosswordbackend.onrender.com/getsolution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crossword_id: day }),
        });

        console.log("Raw response status:", res.status);

        const data = await res.json();
        console.log("Fetched solution data:", data);

        // Map backend response fields properly
        setSolution({
          grid: data.crossword?.Grid || [],
          clues: data.crossword?.Clues || { Across: [], Down: [] },
          solution: data.solution?.sol || [],
        });
      } catch (err) {
        console.error("Error fetching solution:", err);
        setSolution(null);
      }
      setLoading(false);
    }
    fetchSolution();
  }, [day]);

  // Create a map of answers for quick lookup by ClueID
  const answersMap = {};
  if (solution?.solution && Array.isArray(solution.solution)) {
    solution.solution.forEach(({ ClueID, ClueText }) => {
      answersMap[ClueID] = ClueText;
    });
  }

  console.log("Currently displaying solution:", solution);

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
            {solution.grid && solution.grid.length > 0 && (
              <table className="grid-table">
                <tbody>
                  {solution.grid.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} className={cell === null ? "cell-black" : "cell-white"}>
                          {/* Adjust here if cell contains objects; assuming string or null */}
                          {typeof cell === 'object' && cell !== null ? (cell.Letter || "") : (cell || "")}
                        </td>
                      ))}
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
