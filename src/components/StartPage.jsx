import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GateTransition from "./GateTransition";
import "../styles/StartPage.css";

export default function StartPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = (e) => {
    e.preventDefault();
    if (mode === "signup") {
      if (!name || !email || !password) {
        alert("Please enter name, email, and password");
        return;
      }
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      if (users.find((u) => u.email === email)) {
        alert("User already exists. Please sign in.");
        setMode("signin");
        return;
      }
      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    } else if (mode === "signin") {
      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const existing = users.find((u) => u.email === email && u.password === password);
      if (!existing) {
        alert("Invalid credentials or user not found. Please sign up first.");
        return;
      }
      localStorage.setItem("user", JSON.stringify(existing));
      setUser(existing);
      alert(`Welcome back, ${existing.name}!`);
    }
    setPassword("");
  };

  const handleStart = () => {
    localStorage.setItem("startTime", Date.now().toString());
    setLoading(true);
  };

  const handleGateComplete = () => {
    setLoading(false);
    navigate("/crossword");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="start-root">
      {loading && <GateTransition loading={loading} onComplete={handleGateComplete} />}

      <video className="bg-video" autoPlay loop muted playsInline>
        <source src="o.mp4" type="video/mp4" />
      </video>

      <div className="overlay" />

      <div className="content-container">
        <div className="start-left">
          <div className="brand">
            <h1 className="site-title">Crossword Challenge</h1>
            <p className="tagline">Presented to you by EPC & CC</p>
          </div>

          <div className="auth-card">
            {!user ? (
              <form onSubmit={handleAuth}>
                <h3 className="auth-title">{mode === "signin" ? "Sign In" : "Sign Up"}</h3>
                {mode === "signup" && (
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="row">
                  <button className="btn primary" type="submit">
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                  <button
                    type="button"
                    className="btn muted"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  >
                    {mode === "signin" ? "Switch to Sign Up" : "Switch to Sign In"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="welcome">
                <p>Signed in as</p>
                <strong className="username">{user.name}</strong>
                <div className="row">
                  <button className="btn primary" onClick={handleStart}>
                    Start Game
                  </button>
                  <button className="btn muted" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
