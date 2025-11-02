import React, { useEffect, useState } from "react";
import "../styles/GateTransition.css"; 

const GateTransition = ({ loading, onComplete }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (loading) {
      // Start the animation
      setAnimate(true);

      const timer = setTimeout(() => {
        setAnimate(false);
        if (onComplete) onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading, onComplete]);

  if (!loading) return null;

  return (
    <div className={`gate-overlay ${animate ? "animate" : ""}`}>
      {/* Orange bar on top */}
      <div className="gate-top"></div>

      {/* Left and right panels */}
      <div className="gate-panel left"></div>
      <div className="gate-panel right"></div>

      {/* Loader in center */}
      <div className="gate-loading">
        <div className="loader"></div>
        <div className="loading-text">Loading...</div>
      </div>
    </div>
  );
};

export default GateTransition;
