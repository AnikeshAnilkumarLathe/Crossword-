import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Try to get the logged in user from localStorage (change as per your auth)
  const last = JSON.parse(localStorage.getItem("lastResult") || "null");
  const username = last?.Username || last?.name || "";

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

  // Top-10 only
  const topList = list.slice(0, 10);

  // Find this user's entry in leaderboard
  const userEntry = username &&
    list.find(u => (u.Username || u.name) === username);
  const userRank = userEntry ? (list.indexOf(userEntry) + 1) : null;

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
        {/* Score card for current user, styled like the old last player card */}
        <div className="last-card">
          <strong>Your Score:</strong>
          {userEntry ? (
            <div>
              {userEntry.Username} — {userEntry.Score} pts
              <span style={{ marginLeft: "0.8em", color: "#77204b", fontWeight: 500 }}>
                {userRank ? `Rank #${userRank}` : null}
              </span>
            </div>
          ) : (
            <div>
              {username
                ? <>{username} — not ranked yet</>
                : <>Not ranked yet</>
              }
            </div>
          )}
        </div>

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
