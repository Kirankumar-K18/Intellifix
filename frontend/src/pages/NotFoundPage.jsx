import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#e2e8f0', gap:16 }}>
      <div style={{ fontSize:72 }}>🔍</div>
      <h1 style={{ fontSize:40, fontWeight:800 }}>404</h1>
      <p style={{ color:'#94a3b8', fontSize:16 }}>Page not found</p>
      <Link to="/" style={{ background:'#3b82f6', color:'#fff', padding:'9px 20px', borderRadius:9, fontWeight:600, fontSize:13, textDecoration:'none', marginTop:8 }}>
        Go Home
      </Link>
    </div>
  )
}
