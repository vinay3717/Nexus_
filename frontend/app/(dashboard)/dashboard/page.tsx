'use client';

import { AuthGate } from '@/lib/authGate';

// Dashboard — Feature 27 will fill this in on Day 5
// Placeholder keeps the AuthGate working and lets B verify the OAuth flow end-to-end.
export default function DashboardPage() {
  return (
    <AuthGate>
      <div
        style={{
          minHeight: '100vh',
          background: '#0D0D12',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            padding: '32px 40px',
            background: '#16161F',
            border: '1px solid #2A2A40',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#6D5FFD', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
            ✓ Auth working
          </p>
          <h1 style={{ color: '#F0EFFB', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#A8A6C0', fontSize: '14px' }}>
            Feature 27 will build this on Day 5.
          </p>
        </div>
      </div>
    </AuthGate>
  );
}
