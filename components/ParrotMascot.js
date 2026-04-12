'use client';

import React from 'react';

/**
 * ParrotMascot: A premium, beautiful SVG parrot.
 * States: 'idle', 'thinking', 'speaking', 'listening'
 */
export default function ParrotMascot({ state = 'idle' }) {
  return (
    <div className={`parrot-svg-wrapper ${state}`}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="parrot-svg"
      >
        <defs>
          {/* Main Body Gradient */}
          <radialGradient id="bodyGrad" cx="100" cy="80" r="80" fx="80" fy="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#d63031" />
          </radialGradient>
          
          {/* Belly Gradient */}
          <linearGradient id="bellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fed6e3" />
          </linearGradient>

          {/* Eye Glow Gradient */}
          <radialGradient id="eyeGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="185" rx="45" ry="8" fill="rgba(0,0,0,0.1)" />

        {/* Tail feathers */}
        <path d="M90 150 L80 190 Q100 200 120 190 L110 150Z" fill="#0984e3" className="parrot-tail" />

        {/* Crest feathers on top */}
        <g className="parrot-crest">
            <path d="M100 40 Q110 5 125 30" fill="none" stroke="#d63031" strokeWidth="6" strokeLinecap="round" />
            <path d="M95 45 Q85 15 70 35" fill="none" stroke="#d63031" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Main Body */}
        <path
          className="parrot-body"
          d="M60 145 Q100 185 140 145 Q155 100 140 55 Q100 25 60 55 Q45 100 60 145"
          fill="url(#bodyGrad)"
          stroke="#b33939"
          strokeWidth="1"
        />

        {/* Belly Section */}
        <path
          className="parrot-belly"
          d="M75 130 Q100 155 125 130 Q135 105 125 85 Q100 70 75 85 Q65 105 75 130"
          fill="url(#bellyGrad)"
          opacity="0.9"
        />

        {/* Wings */}
        <path
          className="parrot-wing-left"
          d="M65 100 Q30 95 25 140 Q50 160 65 140"
          fill="#ff4d4d"
          stroke="#b33939"
          strokeWidth="1"
        />
        <path
          className="parrot-wing-right"
          d="M135 100 Q170 95 175 140 Q150 160 135 140"
          fill="#ff4d4d"
          stroke="#b33939"
          strokeWidth="1"
        />

        {/* Eyes Group */}
        <g className="parrot-eyes">
          {/* Left Eye */}
          <circle cx="82" cy="72" r="12" fill="white" />
          <circle cx="84" cy="72" r="6" fill="#2d3436" className="eye-pupil" />
          <circle cx="81" cy="69" r="2.5" fill="url(#eyeGlow)" />

          {/* Right Eye */}
          <circle cx="118" cy="72" r="12" fill="white" />
          <circle cx="116" cy="72" r="6" fill="#2d3436" className="eye-pupil" />
          <circle cx="119" cy="69" r="2.5" fill="url(#eyeGlow)" />
        </g>

        {/* Beak Group */}
        <g className="parrot-beak-group">
          <path
            className="parrot-beak-top"
            d="M88 90 Q100 120 112 90 L100 82 Z"
            fill="#fdcb6e"
          />
          <path
            className="parrot-beak-bottom"
            d="M93 92 Q100 112 107 92 L100 88 Z"
            fill="#e17055"
          />
        </g>

        {/* Feet */}
        <g className="parrot-feet">
            <rect x="80" y="165" width="8" height="12" rx="4" fill="#fab1a0" />
            <rect x="112" y="165" width="8" height="12" rx="4" fill="#fab1a0" />
        </g>
      </svg>
    </div>
  );
}
