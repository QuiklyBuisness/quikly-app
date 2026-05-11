'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-server'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [step, setStep] = useState<'role'|'email'|'otp'|'name'>('role')
  const [role, setRole] = useState<'customer'|'worker'|null>(null)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(error.message); else setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp || otp.length < 4) { setError('Enter the full code from your email'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    console.log('verify result:', data, error)
    if (error) { setError(error.message); setLoading(false); return }
    setStep('name'); setLoading(false)
  }

  async function createProfile() {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired — please try again'); setLoading(false); return }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, role, first_name: firstName, last_name: lastName,
      verification_status: 'pending', rating: 5.00, jobs_completed: 0
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/app.html')
  }

  const inp: React.CSSProperties = { width:'100%', background:'#1a1a1a', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'14px 16px', fontSize:16, color:'#fff', outline:'none', marginBottom:12, boxSizing:'border-box' }
  const btn = (bg='#fff', color='#0a0a0a'): React.CSSProperties => ({ width:'100%', padding:'15px', background:bg, color, border:bg==='#fff'?'none':'1px solid rgba(255,255,255,.1)', borderRadius:14, fontSize:16, fontWeight:800, cursor:'pointer', marginBottom:8, fontFamily:'inherit', opacity: loading ? 0.6 : 1 })

  return (
    <div style={{minHeight:'100dvh',background:'#0a0a0a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 24px',fontFamily:'Inter,-apple-system,sans-serif'}}>
      <div style={{width:60,height:60,borderRadius:18,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
        <svg width="34" height="34" viewBox="0 0 40 40" fill="none"><path d="M5 18L20 5L35 18V37H26V27H14V37H5V18Z" fill="#0a0a0a"/><path d="M22 11L16 21H21L18 31L26 19H21L24 11Z" fill="white"/></svg>
      </div>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:-1,marginBottom:6,color:'#fff'}}>Quikly</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,.4)',marginBottom:36}}>Fast help. Fair pay.</div>
      <div style={{width:'100%',maxWidth:360}}>

        {step==='role'&&<>
          <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:20,textAlign:'center'}}>Get work done or find work?</div>
          <button style={btn()} onClick={()=>{setRole('customer');setStep('email')}}>Get work done</button>
          <button style={btn('#1a1a1a','#fff')} onClick={()=>{setRole('worker');setStep('email')}}>Find work nearby</button>
        </>}

        {step==='email'&&<>
          <div style={{fontSize:13,color:'rgba(255,255,255,.5)',marginBottom:8,fontWeight:600}}>YOUR EMAIL</div>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e=>e.key==='Enter'&&sendOtp()} autoCapitalize="none" autoCorrect="off" />
          <button style={btn()} onClick={sendOtp} disabled={loading||!email}>{loading?'Sending...':'Continue →'}</button>
          <button style={btn('#0a0a0a','rgba(255,255,255,.4)')} onClick={()=>setStep('role')}>← Back</button>
        </>}

        {step==='otp'&&<>
          <div style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:4,fontWeight:600}}>CHECK YOUR EMAIL</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.3)',marginBottom:16}}>Enter the code sent to {email}</div>
          <input
            style={{...inp,fontSize:22,fontWeight:700,letterSpacing:4,textAlign:'center'}}
            type="text"
            value={otp}
            onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
            placeholder="- - - - - - - -"
            maxLength={8}
            onKeyDown={e=>e.key==='Enter'&&verifyOtp()}
            autoFocus
          />
          <button style={btn()} onClick={verifyOtp} disabled={loading}>{loading?'Verifying...':'Verify →'}</button>
          <button style={btn('#0a0a0a','rgba(255,255,255,.4)')} onClick={()=>{setStep('email');setOtp('');setError('')}}>← Try different email</button>
        </>}

        {step==='name'&&<>
          <div style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:6,fontWeight:600}}>ALMOST THERE</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.3)',marginBottom:16}}>Just your name to finish setting up.</div>
          <input style={inp} type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" autoCapitalize="words" />
          <input style={inp} type="text" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" autoCapitalize="words" onKeyDown={e=>e.key==='Enter'&&createProfile()} />
          <button style={btn()} onClick={createProfile} disabled={loading||!firstName||!lastName}>{loading?'Creating account...':'Create account'}</button>
        </>}

        {error&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:10,fontSize:13,color:'#ef4444',marginTop:8}}>{error}</div>}

        <div style={{textAlign:'center',marginTop:28}}>
          <a href="/login" style={{color:'rgba(255,255,255,.4)',fontSize:14,textDecoration:'none'}}>Have an account? <strong style={{color:'#fff'}}>Log in</strong></a>
        </div>
      </div>
    </div>
  )
}
