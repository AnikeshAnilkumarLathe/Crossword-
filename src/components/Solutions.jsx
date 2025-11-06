import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SolutionPage.css";

export default function SolutionPage() {
  const navigate = useNavigate();
  const [day, setDay] = useState(2); // By default, show up to yesterday's solutions
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSolutionsUpToDay() {
      setLoading(true);
      let results = [];
      try {
        // Only show solutions for days strictly before the current day
        for (let i = 1; i < day; i++) {
          const res = await fetch("https://crosswordbackend.onrender.com/getsolution", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crossword_id: i }),
          });
          const data = await res.json();
          results.push({
            day: i,
            solution: data.solution,
            grid: data.grid,
            clues: data.clues,
          });
        }
        setSolutions(results);
      } catch (err) {
        console.error("Failed to fetch solutions:", err);
        setSolutions([]);
      }
      setLoading(false);
    }
    fetchSolutionsUpToDay();
  }, [day]);

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
          <button onClick={() => setDay(Math.max(2, day - 1))}>Prev Day</button>
          <span style={{ margin: "0 10px" }}>Day {day - 1} Solution{day > 2 ? "s" : ""}</span>
          <button onClick={() => setDay(day + 1)}>Next Day</button>
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : solutions.length === 0 ? (
          <div>No solutions available yet. Come back after each day's crossword is closed!</div>
        ) : (
          solutions.map(sol => (
            <div key={sol.day} className="solution-card">
              <h3>Day {sol.day} Solution</h3>
              {sol.grid && (
                <table className="grid-table">
                  <tbody>
                    {sol.grid.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className={cell === null ? "cell-black" : "cell-white"}>
                            {cell || ""}
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
                  {(sol.clues?.Across || []).map((clue, i) =>
                    <li key={`across-${i}`}>
                      <strong>Across {clue.ClueID}:</strong> {clue.ClueText} — <span className="answer">{sol.solution?.[clue.ClueID]}</span>
                    </li>
                  )}
                  {(sol.clues?.Down || []).map((clue, i) =>
                    <li key={`down-${i}`}>
                      <strong>Down {clue.ClueID}:</strong> {clue.ClueText} — <span className="answer">{sol.solution?.[clue.ClueID]}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
