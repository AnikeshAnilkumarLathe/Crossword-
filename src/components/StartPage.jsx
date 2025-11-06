import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Preloader from "./Preloader"; // ✅ Import your preloader
import "../styles/StartPage.css";

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function StartPage({ videoSrc = "/og.mp4" }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // For Google Sign-in
  const [user, setUser] = useState(null);

  const [showPreloader, setShowPreloader] = useState(false); // ✅ Show preloader on click
  const [progress, setProgress] = useState(0); // ✅ Preloader progress

  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  // On mount, load user from localStorage if exists
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Logout user
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");
    setUser(null);
  }, []);

  // ✅ Handle Start Game click
  const handleStartGame = useCallback(() => {
    setShowPreloader(true);

    // Optional: animate progress for visible effect
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setProgress(prog);
      if (prog >= 100) clearInterval(interval);
    }, 100);

    // Navigate after short delay (or replace with real async action)
    setTimeout(() => {
      navigate("/crossword");
    }, 1000);
  }, [navigate]);

  // ✅ Show preloader overlay while navigating
  if (showPreloader) {
    return <Preloader progress={progress} />;
  }

  return (
    <div className="start-root">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="content-container">
        <div className="start-left">
          <div className="brand">
            <h1 className="site-title">Crossword Challenge</h1>
            <p className="tagline">Presented by CC & EPC</p>
          </div>

          <div className="auth-card">
            {!user ? (
              <>
                <p className="auth-title">Sign in with your Email</p>
                <div
                  id="googleSignInDiv"
                  ref={googleContainerRef}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 48,
                  }}
                >
                  {loading && <div className="spinner" />}
                </div>
                {error && (
                  <p
                    className="error"
                    role="alert"
                    style={{
                      color: "crimson",
                      marginTop: 10,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="username">Hi, {user.username}</p>
                <div className="row">
                  <button className="btn primary" onClick={handleStartGame}>
                    Start Game
                  </button>
                  <button className="btn muted" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
