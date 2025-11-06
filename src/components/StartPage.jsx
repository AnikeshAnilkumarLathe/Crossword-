import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Preloader from "./Preloader"; // ✅ Import your preloader
import "../styles/StartPage.css";

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function StartPage({ videoSrc = "/og.mp4" }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [preloadProgress, setPreloadProgress] = useState(0); // ✅ track video load %
  const [videosLoaded, setVideosLoaded] = useState(false); // ✅ track if both videos are ready

  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  // ✅ Helper function to preload videos
  const preloadVideos = useCallback((sources) => {
    return Promise.all(
      sources.map(
        (src, i) =>
          new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src = src;
            video.preload = "auto";
            video.oncanplaythrough = () => {
              // Update progress incrementally
              setPreloadProgress((prev) => Math.min(prev + 50, 100));
              resolve();
            };
            video.onerror = reject;
          })
      )
    );
  }, []);

  // ✅ On mount, preload both videos and store them in cache
  useEffect(() => {
    async function loadAssets() {
      try {
        await preloadVideos(["/og.mp4", "/final.mp4"]);
        setVideosLoaded(true);
      } catch (e) {
        console.error("Failed to preload videos:", e);
        setError("Video loading failed. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadAssets();
  }, [preloadVideos]);

  // ✅ Handle Start Game button
  const handleStartGame = useCallback(() => {
    if (videosLoaded) navigate("/crossword", { state: { videoSrc: "/final.mp4" } });
  }, [navigate, videosLoaded]);

  // ✅ Return preloader if loading videos
  if (loading || preloadProgress < 100) {
    return <Preloader progress={preloadProgress} />;
  }

  // ✅ Main UI (unchanged below this)
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
                  <button
                    className="btn primary"
                    onClick={handleStartGame}
                    disabled={!videosLoaded}
                  >
                    Start Game
                  </button>
                  <button className="btn muted" onClick={() => console.log("logout")}>
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
