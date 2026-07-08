import React, { useEffect, useState } from 'react';

const Loader = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing ERP…');

  useEffect(() => {
    const steps = [
      { pct: 20, text: 'Loading modules…' },
      { pct: 45, text: 'Connecting to database…' },
      { pct: 70, text: 'Fetching stock data…' },
      { pct: 90, text: 'Almost ready…' },
      { pct: 100, text: 'Welcome to Carecay ERP!' },
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i].pct);
        setStatusText(steps[i].text);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => onFinish && onFinish(), 400);
      }
    }, 400);

    return () => clearInterval(timer);
  }, []);

  return (
    <div id="loaderWrap" style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #000000 0%, #060912 50%, #0B1120 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: "'Inter', sans-serif"
    }}>
      {/* Animated background dots */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: '#1A56DB',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.4 + 0.1,
            animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Logo/Icon */}
      <div style={{
        width: 200, height: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        animation: 'float 3s ease-in-out infinite',
      }}>
        <img src="/logo.png" alt="Carecay Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>

      {/* Brand */}
      <div style={{
        fontSize: 12, color: 'rgba(255,255,255,0.45)',
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40,
      }}>
        Used Car ERP Platform
      </div>

      {/* Progress bar */}
      <div style={{
        width: 280, height: 4,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 2, overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'linear-gradient(90deg, #1A56DB, #60A5FA)',
          borderRadius: 2,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 10px rgba(96,165,250,0.8)',
        }} />
      </div>

      {/* Status text */}
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {statusText}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
