import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";
import Preloader from "./Preloader"; // 👈 import preloader

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function StartPage({ videoSrc = "/og.mp4" }) {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true); // 👈 main preloader flag
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  // -------- existing apiFetch, ensureScriptLoaded, etc. (no change) -------- //

  // 👇 detect when everything (video, Google, localStorage) is ready
  useEffect(() => {
    const video = document.createElement("video");
    video.src = videoSrc;
    video.preload = "auto";

    Promise.all([
      new Promise((resolve) => (video.oncanplaythrough = resolve)),
      ensureScriptLoaded(),
    ])
      .then(() => setPageLoading(false)) // hide preloader once loaded
      .catch(() => setPageLoading(false));
  }, [videoSrc, ensureScriptLoaded]);

  // rest of your logic remains the same ...

  return (
    <>
      {pageLoading && <Preloader />} {/* 👈 show preloader until fully loaded */}

      <div className="start-root" style={{ display: pageLoading ? "none" : "flex" }}>
        <video autoPlay loop muted playsInline className="bg-video">
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
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
                      style={{ color: "crimson", marginTop: 10, fontWeight: 600 }}
                    >
                      {error}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="username">Hi, {user.username}</p>
                  <p className="userscore">Score: {user.score}</p>
                  <div className="row">
                    <button className="btn primary" onClick={() => navigate("/crossword")}>
                      Start Game
                    </button>
                    <button className="btn muted" onClick={() => handleLogout()}>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
