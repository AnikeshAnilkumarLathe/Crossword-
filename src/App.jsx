import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import StartPage from "./components/StartPage";
import CrosswordPage from "./components/CrosswordPage";
import Solutions from "./components/Solutions";
import LeaderboardPage from "./components/LeaderboardPage";
import Preloader from "./components/Preloader";

export default function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader on route change
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1200); // 1.2s fade duration
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      {loading && <Preloader />}
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/crossword" element={<CrosswordPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/solutions" element={<Solutions />} />
      </Routes>
    </>
  );
}
