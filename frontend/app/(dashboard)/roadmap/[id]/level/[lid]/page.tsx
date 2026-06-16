'use client';
import { AuthGate } from '@/lib/authGate';
export default function LevelPage({ params }: { params: { id: string; lid: string } }) {
  return (
    <AuthGate>
      <div style={{ minHeight:'100vh', background:'#0D0D12', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#A8A6C0', fontFamily:'system-ui' }}>Level {params.lid} — Feature 21</p>
      </div>
    </AuthGate>
  );
}
