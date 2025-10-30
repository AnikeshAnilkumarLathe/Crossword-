import React, { useEffect, useRef } from "react";
import "../styles/GateTransition.css";

export default function GateTransition({ loading, onComplete }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => {
        if (typeof onComplete === "function") onComplete();
      }, 1800);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading, onComplete]);

  return (
    <div className={`gate-overlay ${loading ? "animate" : ""}`} aria-hidden>
      <div className="gate-panel left" />
      <div className="gate-panel right" />
      <div className="gate-top" />
      {loading && (
        <div className="gate-loading">
          <div className="loader" />
          <div className="loading-text">Loading puzzle…</div>
        </div>
      )}
    </div>
  );
}
