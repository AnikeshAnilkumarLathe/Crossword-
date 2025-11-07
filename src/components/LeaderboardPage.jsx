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
  const localScore = last?.score || last?.Score || "";

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

  // Top-10 leaderboard entries
  const topList = list.slice(0, 10);

  // -- Debugging only --
  console.log("LocalStorage user object:", last);
  console.log("Local name:", localDisplayName, "Local score:", localScore);

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
        {/* User specific score display */}
        <div className="last-card">
          {localDisplayName
            ? <div>Hi, {localDisplayName} your score is {localScore}</div>
            : <div>Hi! Please log in or play to see your score.</div>
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
