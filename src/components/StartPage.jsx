import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";

export default function StartPage({ videoSrc = "/o.mp4" }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const googleContainerRef = useRef(null);
  const childDivRef = useRef(null);
  const initializedRef = useRef(false);

  const CLIENT_ID =
    "919062485527-9hno8iqrqs35samoaub3reobf03pq3du.apps.googleusercontent.com";

  const parseJwt = useCallback((token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }, []);

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
        googleContainerRef.current.removeChild(googleContainerRef.current.firstChild);
      }
    }
    childDivRef.current = null;
  }, []);

  const ensureScriptLoaded = useCallback(async () => {
    const src = "https://accounts.google.com/gsi/client";
    if (window.google && window.google.accounts && window.google.accounts.id) return;

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

  const handleCredentialResponse = useCallback(
    (response) => {
      if (!response || !response.credential) {
        setError("No credential returned from Google.");
        return;
      }

      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        setError("Failed to decode token.");
        return;
      }

      if (!decoded.email.endsWith("@pilani.bits-pilani.ac.in")) {
        setError("Please sign in with your BITS Pilani email ID.");
        return;
      }

      const cleanUser = {
        name: decoded.name || decoded.given_name || decoded.email.split("@")[0],
        email: decoded.email,
      };

      try {
        localStorage.setItem("user", JSON.stringify(cleanUser));
      } catch {
        // ignore localStorage errors
      }

      setUser(cleanUser);
      removeChildDivIfExists();
      setError(null);

      if (window.google && window.google.accounts && window.google.accounts.id && window.google.accounts.id.disableAutoSelect) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch {
          /* ignore */
        }
      }
    },
    [parseJwt, removeChildDivIfExists]
  );

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

      if (!(window.google && window.google.accounts && window.google.accounts.id)) {
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

      createChildDivIfNeeded();

      if (!user) {
        try {
          window.google.accounts.id.renderButton(childDivRef.current, {
            theme: "outline",
            size: "large",
            width: 280,
          });
        } catch {
          // ignore render errors
        }
      }

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
      try {
        if (window.google && window.google.accounts && window.google.accounts.id && window.google.accounts.id.cancel) {
          window.google.accounts.id.cancel();
        }
      } catch {
        // ignore
      }
    };
  }, [user, ensureScriptLoaded, handleCredentialResponse, createChildDivIfNeeded, removeChildDivIfExists]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
    setUser(null);
    initializedRef.current = false;
    setLoading(true);
    removeChildDivIfExists();
  }, [removeChildDivIfExists]);

  const handleStartGame = useCallback(() => navigate("/crossword"), [navigate]);

  return (
    <div className="start-root">
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
                <p className="auth-title">Sign in with your BITS Email</p>
                <div
                  id="googleSignInDiv"
                  ref={googleContainerRef}
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 48 }}
                >
                  {loading && <div>Loading Google Sign-In…</div>}
                </div>
                {error && (
                  <p className="error" role="alert" style={{ color: "crimson", marginTop: 10, fontWeight: 600 }}>
                    {error}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="username">Hi, {user.name}</p>
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