import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function StartPage({ videoSrc = "/og.mp4" }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [submittedToday, setSubmittedToday] = useState(false);
  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  // Helper function to call backend with JWT
  const apiFetch = useCallback(async (path, opts = {}) => {
    const headers = (opts.headers = opts.headers || {});
    const stored = localStorage.getItem("jwt");
    if (stored) headers["Authorization"] = `Bearer ${stored}`;
    headers["Content-Type"] = headers["Content-Type"] || "application/json";

    const res = await fetch(BACKEND_BASE + path, {
      credentials: "omit",
      ...opts,
      headers,
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (!res.ok) {
      const err = new Error(json?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }, []);

  // Create Google Sign-in child div
  const createChildDivIfNeeded = useCallback(() => {
    if (childDivRef.current) return childDivRef.current;
    const el = document.createElement("div");
    el.setAttribute("data-gsi-child", "1");
    if (googleContainerRef.current)
      googleContainerRef.current.appendChild(el);
    childDivRef.current = el;
    return el;
  }, []);

  // Remove Google Sign-in child div
  const removeChildDivIfExists = useCallback(() => {
    if (!childDivRef.current && !googleContainerRef.current) return;
    if (childDivRef.current && childDivRef.current.parentNode) {
      childDivRef.current.parentNode.removeChild(childDivRef.current);
    } else if (googleContainerRef.current) {
      while (googleContainerRef.current.firstChild) {
        googleContainerRef.current.removeChild(
          googleContainerRef.current.firstChild
        );
      }
    }
    childDivRef.current = null;
  }, []);

  // Load Google client script
  const ensureScriptLoaded = useCallback(async () => {
    const src = "https://accounts.google.com/gsi/client";
    if (window.google?.accounts?.id) return;

    await new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", resolve, { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }, []);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError("No credential returned from Google.");
        setLoading(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const result = await apiFetch("/auth/google", {
          method: "POST",
          body: JSON.stringify({ token: response.credential }),
        });

        const serverJwt = result?.token || result?.jwt;
        const serverUser = result?.user;

        if (serverJwt) localStorage.setItem("jwt", serverJwt);
        if (serverUser) {
          localStorage.setItem("user", JSON.stringify(serverUser));
          setUser(serverUser);
        }

        setError(null);
      } catch (err) {
        setError(err?.body?.message || err.message || "Authentication failed.");
      } finally {
        setLoading(false);
        removeChildDivIfExists();
      }
    },
    [apiFetch, removeChildDivIfExists]
  );

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Cache videos after they start playing
  useEffect(() => {
    const videoUrls = ["/og.mp4", "/final.mp4"];

    async function cacheVideo(url) {
      try {
        const cache = await caches.open("video-cache-v1");
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log(`${url} cached for future use`);
        }
      } catch (err) {
        console.error(`Error caching ${url}:`, err);
      }
    }

    const videoEl = document.getElementById("bg-video");
    if (videoEl) {
      videoEl.addEventListener("loadeddata", () => {
        videoUrls.forEach((url) => cacheVideo(url));
      });
    } else {
      setTimeout(() => videoUrls.forEach((url) => cacheVideo(url)), 5000);
    }
  }, []);

  // Google One Tap setup
  useEffect(() => {
    if (user) {
      removeChildDivIfExists();
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      await ensureScriptLoaded();
      if (cancelled) return;

      if (!window.google?.accounts?.id) {
        setError("Failed to load Google Sign-In.");
        setLoading(false);
        return;
      }

      if (!initializedRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse,
          });
          initializedRef.current = true;
        } catch {
          setError("Failed to initialize Google Sign-In.");
          setLoading(false);
          return;
        }
      }

      const childDiv = createChildDivIfNeeded();
      if (!user) {
        try {
          window.google.accounts.id.renderButton(childDiv, {
            theme: "outline",
            size: "large",
            width: 180,
          });
        } catch {}
      }

      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel?.();
      } catch {}
    };
  }, [
    user,
    ensureScriptLoaded,
    handleCredentialResponse,
    createChildDivIfNeeded,
    removeChildDivIfExists,
  ]);

  // Hide/show Google button based on loading
  useEffect(() => {
    if (childDivRef.current)
      childDivRef.current.style.display = loading ? "none" : "block";
  }, [loading]);

  // Logout user
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");
    setUser(null);
    initializedRef.current = false;
    setLoading(true);
    removeChildDivIfExists();
  }, [removeChildDivIfExists]);

  // Check if user submitted today's crossword
  useEffect(() => {
    async function checkCrosswordStatus() {
      try {
        const res = await fetch(`${BACKEND_BASE}/crossword`);
        const data = await res.json();
        const submittedId = localStorage.getItem("cw-submitted");
        if (submittedId && submittedId === data.CrosswordID?.toString()) {
          setSubmittedToday(true);
        } else {
          setSubmittedToday(false);
        }
      } catch (err) {
        console.error("Error checking crossword status:", err);
      }
    }
    checkCrosswordStatus();
  }, []);

  // ✅ Preloader fade-out after video is ready
  useEffect(() => {
    const preloader = document.getElementById("preloader");
    const video = document.getElementById("bg-video");

    if (video) {
      video.addEventListener("canplaythrough", () => {
        if (preloader) {
          preloader.style.opacity = "0";
          preloader.style.pointerEvents = "none";
          setTimeout(() => preloader.remove(), 600);
        }
      });
    } else if (preloader) {
      preloader.style.opacity = "0";
      setTimeout(() => preloader.remove(), 600);
    }
  }, []);

  return (
    <div className="start-root">
      <video
        id="bg-video"
        autoPlay
        loop
        muted
        playsInline
        className="bg-video"
        preload="auto"
        poster="/StartPageBG.png"
      >
        <source
          src={
            localStorage.getItem("ogVideo")
              ? localStorage.getItem("ogVideo")
              : videoSrc
          }
          type="video/mp4"
        />
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
                <p className="auth-title">Welcome to the Challenge!</p>
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
                    onClick={() =>
                      submittedToday
                        ? navigate("/leaderboard")
                        : navigate("/crossword")
                    }
                  >
                    {submittedToday ? "Leaderboard" : "Start Game"}
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
