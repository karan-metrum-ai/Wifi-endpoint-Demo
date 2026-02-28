/**
 * DigitalTwinLoading Component
 *
 * Full-screen loading state for the Digital Twin page.
 * Displays while fetching infrastructure data from the API.
 */

import React from 'react';

export const DigitalTwinLoading: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '4px solid rgba(0, 170, 255, 0.2)',
          borderTopColor: '#00aaff',
          animation: 'digitalTwinSpin 1s linear infinite',
        }}
      />

      {/* Loading text */}
      <div
        style={{
          color: '#e5e7eb',
          fontSize: '18px',
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.01em',
        }}
      >
        Loading infrastructure topology...
      </div>

      {/* Subtitle */}
      <div
        style={{
          color: '#6b7280',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Fetching data center and device information
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes digitalTwinSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DigitalTwinLoading;
