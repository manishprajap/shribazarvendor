import React, { useEffect } from 'react';
import './SplashScreen.css';

interface Props {
  onDone?: () => void; // ✅ App.tsx se callback — router.push nahi chahiye
}

const SplashScreen: React.FC<Props> = ({ onDone }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onDone?.(); // ✅ App level state update karega, router handle karega
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash-root">
      <div className="splash-circles">
        <div className="circle circle-1" />
        <div className="circle circle-2" />
        <div className="circle circle-3" />
      </div>

      <div className="splash-content">
        <div className="splash-logo">
          <img src="/shrilogo.jpeg" alt="Shri Bazar" />
        </div>
        <h1 className="splash-title">Shri Bazar</h1>
        <p className="splash-badge">Saller / Vendor </p>
        <p className="splash-description">All merchandise is available for sale.</p>
      </div>

      <div className="splash-loader">
        <div className="loader-bar">
          <div className="loader-fill" />
        </div>
        <p className="splash-tagline">Sell smarter. Grow faster.</p>
      </div>

      <p className="splash-footer">Powered by Shri Bazar</p>
    </div>
  );
};

export default SplashScreen;