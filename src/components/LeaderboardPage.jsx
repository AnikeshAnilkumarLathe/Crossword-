import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/leaderboard");
        const data = await res.json();
        console.log("Leaderboard data:", data);
        setList(Array.isArray(data) ? data.sort((a, b) => b.score - a.score) : []);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setList([]);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  const last = JSON.parse(localStorage.getItem("lastResult") || "null");

  return (
    <div className="lb-root">
      <video
        className="lb-video-bg"
        src="/final.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <nav className="lb-navbar">
        <div className="nav-left">
          Crossword by <strong>CC</strong> and <strong>EPC</strong>
          {console.log("new")}
        </div>
        <div className="nav-center">
          Leaderboard
        </div>
        <div className="nav-right">
          <button className="home-btn" onClick={() => navigate("/")}>Home</button>
          <button className="home-btn" onClick={() => navigate("/solutions")}>Solutions</button>
        </div>
      </nav>

      <main className="lb-main">
        {last && (
          <div className="last-card">
            <strong>Last Result:</strong>
            <div>{last.name} — {last.correct}/{last.total}</div>
          </div>
        )}

        <table className="lb-table" aria-label="Leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3">Loading…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="3">No results yet — they will be announced soon!</td></tr>
            ) : (
              list.map((user, i) => (
                <tr key={user.id || i} className={i < 3 ? "top" : ""}>
                  <td>{i + 1}</td>
                  <td>{user.Username}</td>
                  <td>{user.Score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}
