import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";

const BACKEND_BASE = "https://crosswordbackend.onrender.com";

export default function StartPage({ videoSrc = "/og.mp4" }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [videosReady, setVideosReady] = useState(false);
  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  // 🟩 Helper to preload videos and store them in sessionStorage
  const preloadVideos = useCallback(async () => {
    const sources = ["/og.mp4", "/final.mp4"];
    try {
      await Promise.all(
        sources.map(
          (src) =>
            new Promise((resolve, reject) => {
              const video = document.createElement("video");
              video.src = src;
              video.preload = "auto";
              video.oncanplaythrough = () => {
                // Convert small videos into blobs and cache in sessionStorage
                fetch(src)
                  .then((res) => res.blob())
                  .then((blob) => {
                    const blobUrl = URL.createObjectURL(blob);
                    sessionStorage.setItem(src, blobUrl);
                    resolve();
                  })
                  .catch(() => resolve()); // fallback ignore
              };
              video.onerror = reject;
            })
        )
      );
      setVideosReady(true);
    } catch (err) {
      console.error("Video preload failed:", err);
      setVideosReady(false);
    }
  }, []);

  // 🟩 Run preload once on mount
  useEffect(() => {
    preloadVideos();
  }, [preloadVideos]);

  // ✅ Helper: backend call
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

  // ✅ Create/remove Google Sign-In divs
  const createChildDivIfNeeded = useCallback(() => {
    if (childDivRef.current) return childDivRef.current;
    const el = document.createElement("div");
    el.setAttribute("data-gsi-child", "1");
    if (googleContainerRef.current) googleContainerRef.current.appendChild(el);
    childDivRef.current = el;
    return el;
  }, []);

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

  // ✅ Load Google client script
  const ensureScriptLoaded = useCallback(async () => {
    const src = "https://accounts.google.com/gsi/client";
    if (window.google && window.google.accounts && window.google.accounts.id)
      return;
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

  // ✅ Handle Google credential response
  const handleCredentialResponse = useCallback(
    async (response) => {
      if (!response || !response.credential) {
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
        const serverJwt = result?.token || result?.jwt || null;
        const serverUser = result?.user;
        if (serverJwt) {
          localStorage.setItem("jwt", serverJwt);
        }
        if (serverUser) {
          localStorage.setItem("user", JSON.stringify(serverUser));
          setUser(serverUser);
        }
        setError(null);
      } catch (err) {
        console.error("auth error", err, err?.body);
        setError(err?.body?.message || err.message || "Authentication failed.");
      } finally {
        setLoading(false);
        removeChildDivIfExists();
      }
    },
    [apiFetch, removeChildDivIfExists]
  );

  // ✅ Load stored user
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

  // ✅ Set up Google sign-in
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
      if (
        !(window.google && window.google.accounts && window.google.accounts.id)
      ) {
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
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
      try {
        if (
          window.google &&
          window.google.accounts &&
          window.google.accounts.id &&
          window.google.accounts.id.cancel
        ) {
          window.google.accounts.id.cancel();
        }
      } catch {}
    };
  }, [
    user,
    ensureScriptLoaded,
    handleCredentialResponse,
    createChildDivIfNeeded,
    removeChildDivIfExists,
  ]);

  // ✅ Logout
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("jwt");
    } catch (err) {
      console.warn("Failed to remove user info from localStorage:", err);
    }
    setUser(null);
    initializedRef.current = false;
    setLoading(true);
    removeChildDivIfExists();
  }, [removeChildDivIfExists]);

  // ✅ Start game — use preloaded blob for final.mp4
  const handleStartGame = useCallback(() => {
    const finalBlobUrl = sessionStorage.getItem("/final.mp4") || "/final.mp4";
    navigate("/crossword", { state: { videoSrc: finalBlobUrl } });
  }, [navigate]);

  const ogBlobUrl = sessionStorage.getItem("/og.mp4") || videoSrc;

  return (
    <div className="start-root">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src={ogBlobUrl} type="video/mp4" />
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
                    disabled={!videosReady}
                  >
                    {videosReady ? "Start Game" : "Loading Videos..."}
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
