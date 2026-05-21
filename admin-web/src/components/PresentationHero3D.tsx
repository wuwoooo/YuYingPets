import React from 'react';
import './PresentationHero3D.css';

export function PresentationHero3D() {
  return (
    <div className="hero-3d-container">
      <div className="hero-3d-glow" />
      <div className="holo-beam" />
      
      <div className="orbital-rings">
        <div className="orbital-ring ring-1" />
        <div className="orbital-ring ring-2" />
        <div className="orbital-ring ring-3" />
      </div>
      
      <div className="pillars-group">
        <div className="pillar p1">
          <div className="pillar-face pillar-top" />
          <div className="pillar-face pillar-front" />
          <div className="pillar-face pillar-right" />
        </div>
        <div className="pillar p2">
          <div className="pillar-face pillar-top" />
          <div className="pillar-face pillar-front" />
          <div className="pillar-face pillar-right" />
        </div>
        <div className="pillar p3">
          <div className="pillar-face pillar-top" />
          <div className="pillar-face pillar-front" />
          <div className="pillar-face pillar-right" />
        </div>
      </div>
      
      <div className="floating-hologram">
        <svg viewBox="0 0 24 24" fill="currentColor">
           <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/>
        </svg>
      </div>

      <div className="particle pt-1" />
      <div className="particle pt-2" />
      <div className="particle pt-3" />
      <div className="particle pt-4" />
      <div className="particle pt-5" />

      {/* --- HUD 文本面板点缀，填补空隙 --- */}
      <div className="hero-hud-text top-left">
        <div className="hud-label">SYSTEM CORE</div>
        <div className="hud-value">ONLINE</div>
      </div>
      <div className="hero-hud-text top-right">
        <div className="hud-label">SYNC RATE</div>
        <div className="hud-value" style={{ color: '#00e676' }}>99.9%</div>
      </div>
      <div className="hero-hud-text bottom-left">
        <div className="hud-label">COORDS X-Y</div>
        <div className="hud-value">102.3 : 44.8</div>
      </div>
      <div className="hero-hud-text bottom-right">
        <div className="hud-label">THROUGHPUT</div>
        <div className="hud-value">8,421 req/s</div>
      </div>
    </div>
  );
}
