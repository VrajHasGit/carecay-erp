import React, { useState, useEffect, useCallback, useRef } from 'react';
import { isImage } from '../utils/uploadMedia';

/**
 * MediaViewer — Premium full-screen lightbox for photos & videos.
 *
 * Props:
 *   media  – array of { url, key, name, type, size }
 *   index  – initial index to show (default 0)
 *   onClose – callback when the viewer is closed
 */
const MediaViewer = ({ media = [], index = 0, onClose }) => {
  const [current, setCurrent] = useState(index);
  const [zoomed, setZoomed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef(null);

  // Clamp index
  useEffect(() => { setCurrent(Math.max(0, Math.min(index, media.length - 1))); }, [index, media.length]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const go = useCallback((dir) => {
    if (transitioning) return;
    setTransitioning(true);
    setZoomed(false);
    setCurrent(prev => {
      const next = prev + dir;
      if (next < 0) return media.length - 1;
      if (next >= media.length) return 0;
      return next;
    });
    setTimeout(() => setTransitioning(false), 300);
  }, [media.length, transitioning]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === ' ') { e.preventDefault(); setZoomed(z => !z); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onClose]);

  if (!media.length) return null;

  const item = media[current];
  const itemIsImage = isImage(item.type || item.url || item.name);
  const counter = `${current + 1} / ${media.length}`;

  return (
    <div className="mv-overlay" ref={containerRef} onClick={(e) => { if (e.target === containerRef.current) onClose(); }}>
      {/* Top bar */}
      <div className="mv-topbar">
        <div className="mv-counter">{counter}</div>
        <div className="mv-filename">{item.name || 'Untitled'}</div>
        <div className="mv-actions">
          {itemIsImage && (
            <button className="mv-btn" onClick={() => setZoomed(z => !z)} title={zoomed ? 'Zoom out' : 'Zoom in'}>
              <i className={`fa fa-magnifying-glass-${zoomed ? 'minus' : 'plus'}`}></i>
            </button>
          )}
          <a className="mv-btn" href={item.url} target="_blank" rel="noopener noreferrer" title="Open original" onClick={e => e.stopPropagation()}>
            <i className="fa fa-external-link"></i>
          </a>
          <button className="mv-btn mv-close-btn" onClick={onClose} title="Close (Esc)">
            <i className="fa fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button className="mv-arrow mv-arrow-left" onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <i className="fa fa-chevron-left"></i>
          </button>
          <button className="mv-arrow mv-arrow-right" onClick={(e) => { e.stopPropagation(); go(1); }}>
            <i className="fa fa-chevron-right"></i>
          </button>
        </>
      )}

      {/* Main content */}
      <div className={`mv-stage ${transitioning ? 'mv-transitioning' : ''}`}>
        {itemIsImage ? (
          <img
            src={item.url}
            alt={item.name}
            className={`mv-image ${zoomed ? 'mv-zoomed' : ''}`}
            onClick={(e) => { e.stopPropagation(); setZoomed(z => !z); }}
            draggable={false}
          />
        ) : (
          <div className="mv-unsupported">
            <i className="fa fa-file" style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}></i>
            <div>{item.name}</div>
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--or1)', marginTop: 8 }}>
              Download File
            </a>
          </div>
        )}
      </div>

      {/* Filmstrip */}
      {media.length > 1 && (
        <div className="mv-filmstrip">
          {media.map((m, i) => (
            <button
              key={i}
              className={`mv-thumb ${i === current ? 'mv-thumb-active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setZoomed(false); setCurrent(i); }}
            >
              {isImage(m.type || m.url || m.name) ? (
                <img src={m.url} alt={m.name} loading="lazy" draggable={false} />
              ) : (
                <div className="mv-thumb-file"><i className="fa fa-file"></i></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaViewer;
