import React from "react";
import "../styles/Preloader.css";

export default function Preloader() {
  return (
    <div id="preloader">
      <div className="loader-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
}
