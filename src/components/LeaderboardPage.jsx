import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user details directly from localStorage (most common keys)
  const last = JSON.parse(localStorage.getItem("lastResult") || localStorage.getItem("user") || "null");
  const localDisplayName = last?.username || last?.Username || last?.name || "";

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch("https://crosswordbackend.onrender.com/leaderboard");
        const data = await res.json();
        setList(Array.isArray(data) ? data.sort((a, b) => b.Score - a.Score) : []);
      } catch {
        setList([]);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  // Top-10 leaderboard entries for table
  const topList = list.slice(0, 10);

  // Find user's entry in leaderboard using raw name (case-sensitive)
  const userEntry = localDisplayName &&
    list.find(u =>
      u.Username === localDisplayName ||
      u.name === localDisplayName
    );

  // Get score from API leaderboard
  const apiScore = userEntry ? userEntry.Score : "";

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
          {localDisplayName
            ? <>
                <div className="score-top">Your Score: <span className="user-score">{apiScore}</span></div>
                <div className="hi-user">
                  Hi, <span className="user-name">{localDisplayName}</span>
                </div>
              </>
            : <div className="hi-user">Hi! Please log in or play to see your score.</div>
          }
        </div>

        {/* Leaderboard table showing top 10 scorers */}
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
            ) : topList.length === 0 ? (
              <tr><td colSpan="3">No results yet — they will be announced soon!</td></tr>
            ) : (
              topList.map((user, i) => (
                <tr key={user.id || i} className={i < 3 ? "top" : ""}>
                  <td>{i + 1}</td>
                  <td>{user.Username || user.name}</td>
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
