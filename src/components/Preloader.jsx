import React from "react";
import "../styles/Preloader.css";

export default function Preloader({ progress }) {
  return (
    <div className="preloader-root">
      <div className="loader-box">
        <h2>Loading Assets...</h2>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>{Math.floor(progress)}%</p>
      </div>
    </div>
  );
}
