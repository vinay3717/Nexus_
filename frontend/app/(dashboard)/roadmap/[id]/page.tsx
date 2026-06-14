'use client';
import { AuthGate } from '@/lib/authGate';
export default function RoadmapPage({ params }: { params: { id: string } }) {
  return (
    <AuthGate>
      <div style={{ minHeight:'100vh', background:'#0D0D12', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#A8A6C0', fontFamily:'system-ui' }}>Roadmap {params.id} — Feature 16</p>
      </div>
    </AuthGate>
  );
}
