import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const raw = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const list = Array.isArray(raw) ? raw : [];
  list.sort((a, b) => a.time - b.time || b.correct - a.correct);

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

      <header className="lb-header">
        <h2>Leaderboard</h2>
        <div className="lb-actions">
          <button className="btn ghost" onClick={() => navigate("/")}>Home</button>
          <button className="btn primary" onClick={() => navigate("/crossword")}>Play Again</button>
        </div>
      </header>

      <main className="lb-main">
        {last && (
          <div className="last-card">
            <strong>Last Result:</strong>
            <div>{last.name} — {last.correct}/{last.total} — {last.time}s</div>
          </div>
        )}

        <table className="lb-table" aria-label="Leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Time (s)</th>
              <th>Correct</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="4">No results yet — be the first!</td></tr>
            ) : (
              list.map((p, i) => (
                <tr key={i} className={i < 3 ? "top" : ""}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.time}</td>
                  <td>{p.correct ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}
