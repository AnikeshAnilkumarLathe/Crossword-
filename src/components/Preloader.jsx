import React, { useEffect, useState } from "react";
import "../styles/Preloader.css";

export default function Preloader() {
  const [fadeOut, setFadeOut] = useState(false);

  // Automatically fade out when component unmount is triggered externally
  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => {
        const el = document.querySelector(".preloader");
        if (el) el.style.display = "none";
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [fadeOut]);

  return (
    <div className={`preloader ${fadeOut ? "fade-out" : ""}`}>
      <div className="loader"></div>
      <p className="progress-text">Loading...</p>
    </div>
  );
}
