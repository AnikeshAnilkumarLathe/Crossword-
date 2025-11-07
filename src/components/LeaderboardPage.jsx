import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaderboardPage.css";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retrieve logged in user from localStorage, try all key variants
  const last = JSON.parse(localStorage.getItem("lastResult") || localStorage.getItem("user") || "null");
  const username =
    last?.username ||
    last?.Username ||
    last?.name ||
    "";

  // Helper to normalize string comparisons
  function norm(str) {
    return (str || "").trim().toLowerCase();
  }

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

  // Top-10 list
  const topList = list.slice(0, 10);

  // Debugging output
  console.log("LocalStorage last:", last);
  console.log("Extracted username:", username);
  console.log("Leaderboard from API:", list);
  list.forEach((u, i) => {
    console.log(
      `API user #${i + 1}:`,
      "Username:", norm(u.Username),
      "Name:", norm(u.name),
      "| Comparing to:", norm(username)
    );
  });

  // Find and display user's own entry
  const userEntry = username &&
    list.find(u =>
      norm(u.Username) === norm(username) ||
      norm(u.name) === norm(username)
    );
  console.log("Matched userEntry:", userEntry);

  const userRank = userEntry ? (list.indexOf(userEntry) + 1) : null;
  console.log("userRank:", userRank);

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
        {/* User specific score and rank display */}
        <div className="last-card">
          <strong>Your Score & Rank:</strong>
          {userEntry ? (
            <div>
              {userEntry.Username || userEntry.name} — {userEntry.Score} pts
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

        {/* Leaderboard table showing only the top 10 scorers */}
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
