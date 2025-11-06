import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StartPage from "./components/StartPage";
import CrosswordPage from "./components/CrosswordPage";
import Solutions from "./components/Solutions";
import LeaderboardPage from "./components/LeaderboardPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/crossword" element={<CrosswordPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/solutions" element={<Solutions />} />
      </Routes>
    </Router>
  );
}
