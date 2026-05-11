'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email'|'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
  }

  const inp = { width:'100%', background:'#1a1a1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'14px 16px', fontSize:16, color:'#fff', outline:'none', marginBottom:12, boxSizing:'border-box' as const }
  const btn = { width:'100%', padding:'15px', background:'#fff', color:'#0a0a0a', border:'none', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer' as const, marginBottom:8 }

  return (
    <div style={{minHeight:'100dvh',background:'#0a0a0a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px',fontFamily:'Inter,-apple-system,sans-serif'}}>
      <div style={{width:60,height:60,borderRadius:18,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none"><path d="M5 18L20 5L35 18V37H26V27H14V37H5V18Z" fill="#0a0a0a"/><path d="M22 11L16 21H21L18 31L26 19H21L24 11Z" fill="white"/></svg>
      </div>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:6,color:'#fff'}}>Quikly</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,.4)',marginBottom:40}}>Fast help. Fair pay.</div>
      <div style={{width:'100%',maxWidth:360}}>
        {step==='email' ? <>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==='Enter'&&sendOtp()} />
          <button style={btn} onClick={sendOtp} disabled={loading||!email}>{loading?'Sending...':'Continue →'}</button>
        </> : <>
          <div style={{fontSize:13,color:'rgba(255,255,255,.4)',marginBottom:12}}>Code sent to {email}</div>
          <input style={{...inp,fontSize:24,fontWeight:700,letterSpacing:8,textAlign:'center'}} type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" maxLength={6} onKeyDown={e=>e.key==='Enter'&&verifyOtp()} />
          <button style={btn} onClick={verifyOtp} disabled={loading||otp.length<6}>{loading?'Verifying...':'Log in'}</button>
          <button onClick={()=>setStep('email')} style={{...btn,background:'none',color:'rgba(255,255,255,.4)',border:'none'}}>← Different email</button>
        </>}
        {error&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,fontSize:13,color:'#ef4444',marginTop:8}}>{error}</div>}
        <div style={{textAlign:'center',marginTop:28}}><a href="/signup" style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none'}}>No account? <strong style={{color:'#fff'}}>Sign up</strong></a></div>
      </div>
    </div>
  )
}
