import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();

  // Get player name from localStorage (like your original code)
  const last = JSON.parse(localStorage.getItem("lastResult") || localStorage.getItem("user") || "null");
  const localDisplayName = last?.username || last?.Username || last?.name || "Player";

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
        </div>
        <div className="nav-center">Leaderboard</div>
        <div className="nav-right">
          <button className="home-btn" onClick={() => navigate("/")}>Home</button>
          <button className="home-btn" onClick={() => navigate("/solutions")}>Solutions</button>
        </div>
      </nav>

      <main className="lb-main">
        <div className="last-card">
          <div className="hi-user">
            Hi, <span className="user-name">{localDisplayName}</span>!
          </div>
          <div className="score-top">
            Your Score: <span className="user-score">Will be updated soon!</span>
          </div>
        </div>

        {/* Placeholder leaderboard table */}
        <table className="lb-table" aria-label="Leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="3" style={{ textAlign: "center", fontStyle: "italic" }}>
                The leaderboard will be updated soon!
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
