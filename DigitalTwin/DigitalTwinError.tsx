/**
 * DigitalTwinError Component
 *
 * Full-screen error state for the Digital Twin page.
 * Displays when API fetch fails or returns invalid data.
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

interface DigitalTwinErrorProps {
  error: FetchBaseQueryError | SerializedError | { message: string };
  refetch: () => void;
}

/**
 * Extract a human-readable error message from RTK Query error types
 */
function getErrorMessage(
  error: FetchBaseQueryError | SerializedError | { message: string }
): string {
  // Custom error object with message
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }

  // FetchBaseQueryError with status
  if ('status' in error) {
    if (typeof error.status === 'number') {
      switch (error.status) {
        case 404:
          return 'Infrastructure data endpoint not found (404)';
        case 500:
          return 'Server error while fetching infrastructure data (500)';
        case 503:
          return 'Infrastructure service unavailable (503)';
        default:
          return `Failed to fetch infrastructure data (${error.status})`;
      }
    }
    if (error.status === 'FETCH_ERROR') {
      return 'Network error - unable to reach the server';
    }
    if (error.status === 'TIMEOUT_ERROR') {
      return 'Request timed out - server took too long to respond';
    }
    if (error.status === 'PARSING_ERROR') {
      return 'Invalid response from server';
    }
  }

  return 'An unexpected error occurred';
}

const DigitalTwinError: React.FC<DigitalTwinErrorProps> = ({
  error,
  refetch,
}) => {
  const errorMessage = getErrorMessage(error);

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
        padding: '24px',
      }}
    >
      {/* Error icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle
          style={{
            width: '40px',
            height: '40px',
            color: '#ef4444',
          }}
        />
      </div>

      {/* Error title */}
      <div
        style={{
          color: '#e5e7eb',
          fontSize: '20px',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        Failed to Load Infrastructure Data
      </div>

      {/* Error message */}
      <div
        style={{
          color: '#9ca3af',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
          maxWidth: '400px',
          lineHeight: 1.5,
        }}
      >
        {errorMessage}
      </div>

      {/* Retry button */}
      <button
        onClick={refetch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow =
            '0 8px 24px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow =
            '0 4px 16px rgba(59, 130, 246, 0.3)';
        }}
      >
        <RefreshCw style={{ width: '16px', height: '16px' }} />
        Retry
      </button>

      {/* Help text */}
      <div
        style={{
          color: '#6b7280',
          fontSize: '12px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
          marginTop: '16px',
        }}
      >
        If the problem persists, please check your network connection
        <br />
        or contact your system administrator.
      </div>
    </div>
  );
};

export default DigitalTwinError;
