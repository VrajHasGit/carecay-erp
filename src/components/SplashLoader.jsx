import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SplashLoader.css';

const SleekCarSVG = () => (
  <svg viewBox="0 0 800 300" width="280" height="100" xmlns="http://www.w3.org/2000/svg" className="crazy-car-svg">
    <defs>
      <linearGradient id="carPaint" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316"/>
        <stop offset="100%" stopColor="#EA580C"/>
      </linearGradient>
      <linearGradient id="windowTint" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0F172A"/>
        <stop offset="100%" stopColor="#1E293B"/>
      </linearGradient>
      <linearGradient id="headlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#FEF08A" stopOpacity="0"/>
      </linearGradient>
    </defs>
    
    <g transform="translate(20, 50)">
      {/* Spoiler */}
      <path fill="#111" d="M 50 40 L 90 20 L 100 40 L 60 50 Z" />
      <path fill="#111" d="M 70 25 L 80 70 L 60 70 Z" />
      
      {/* Car Body Main */}
      <path 
        fill="url(#carPaint)" 
        d="M 60 80 
           Q 60 50 150 50 
           L 260 25 
           Q 320 10 400 35 
           L 580 85 
           Q 680 100 700 130 
           L 700 160 
           Q 700 190 670 190 
           L 600 190 
           A 50 50 0 0 0 480 190 
           L 260 190 
           A 50 50 0 0 0 140 190 
           L 50 190 
           Q 20 190 20 160 
           L 20 110 
           Q 20 80 60 80 Z" 
      />
      
      {/* Side Skirt/Details */}
      <path fill="#000" opacity="0.3" d="M 140 180 L 480 180 L 470 160 L 150 160 Z" />
      
      {/* Windows */}
      <path 
        fill="url(#windowTint)" 
        d="M 160 55 L 260 30 Q 320 15 390 40 L 480 70 L 160 70 Z" 
      />
      {/* Window Highlight */}
      <path fill="#38BDF8" opacity="0.3" d="M 165 60 L 260 35 Q 315 22 380 43 L 460 65 L 165 65 Z" />
      
      {/* Front Headlight */}
      <path fill="#FEF08A" d="M 640 100 L 690 120 L 680 135 L 630 115 Z" />
      {/* Beam */}
      <path fill="url(#headlight)" d="M 680 120 L 1200 60 L 1200 200 L 670 140 Z" />
      
      {/* Rear Taillight */}
      <path fill="#EF4444" d="M 20 110 L 40 110 L 40 140 L 20 140 Z" />
      <path fill="#DC2626" d="M 20 120 L 30 120 L 30 130 L 20 130 Z" />
      
      {/* Rear Wheel */}
      <g className="wheel-spin">
        <circle cx="200" cy="190" r="55" fill="#111" />
        <circle cx="200" cy="190" r="40" fill="#333" stroke="#64748B" strokeWidth="6" />
        <circle cx="200" cy="190" r="15" fill="#F8FAFC" />
        <circle cx="200" cy="190" r="5" fill="#111" />
        <path stroke="#94A3B8" strokeWidth="4" d="M 200 150 L 200 230 M 160 190 L 240 190 M 172 162 L 228 218 M 172 218 L 228 162" />
      </g>

      {/* Front Wheel */}
      <g className="wheel-spin">
        <circle cx="540" cy="190" r="55" fill="#111" />
        <circle cx="540" cy="190" r="40" fill="#333" stroke="#64748B" strokeWidth="6" />
        <circle cx="540" cy="190" r="15" fill="#F8FAFC" />
        <circle cx="540" cy="190" r="5" fill="#111" />
        <path stroke="#94A3B8" strokeWidth="4" d="M 540 150 L 540 230 M 500 190 L 580 190 M 512 162 L 568 218 M 512 218 L 568 162" />
      </g>
    </g>
  </svg>
);

export default function SplashLoader({ onComplete }) {
  const { authLoading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show the racing animation for at least 2.5 seconds
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimePassed && !authLoading) {
      setIsFadingOut(true);
      const exitTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // 500ms fade out transition
      return () => clearTimeout(exitTimer);
    }
  }, [minTimePassed, authLoading, onComplete]);

  return (
    <div className={`splash-wrap ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        
        {/* Animated Custom SVG Sports Car */}
        <div className="car-container">
          <SleekCarSVG />
          
          {/* Moving Speed Lines */}
          <div className="speed-lines">
            <div className="line l1"></div>
            <div className="line l2"></div>
            <div className="line l3"></div>
            <div className="line l4"></div>
          </div>
          
          {/* Exhaust Smoke */}
          <div className="exhaust">
            <div className="smoke s1"></div>
            <div className="smoke s2"></div>
            <div className="smoke s3"></div>
          </div>
        </div>
        
        {/* Moving Road */}
        <div className="road">
          <div className="dashed-line"></div>
        </div>
        
        {/* Glowing Loading Text */}
        <div className="loading-text">
          <span className="glow-text">REVING UP ENGINE</span>
          <div className="dots"><span>.</span><span>.</span><span>.</span></div>
        </div>
        
        {/* Fuel/Speedometer Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar"></div>
        </div>
        
      </div>
    </div>
  );
}
