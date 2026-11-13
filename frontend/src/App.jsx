import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeReport, explainReport, chatAboutReport } from './services/api'
import { supabase, supabaseConfigured } from './lib/supabase'
import {
  Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown,
  CircleHelp, FileImage, FileText, HeartPulse, Info, Languages, LockKeyhole,
  Menu, MessageCircle, ShieldCheck, Sparkles, UploadCloud, X, AlertCircle,
  BookOpen, ClipboardList, Microscope, Trash2
} from 'lucide-react'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

const demoValues = [
  {
    name: 'Haemoglobin',
    value: '13.2',
    unit: 'g/dL',
    range: '12.0–15.5 g/dL',
    status: 'Within sample range',
    explanation: 'Haemoglobin is a protein in red blood cells that carries oxygen around the body. This sample value falls within the illustrative range shown here.',
  },
  {
    name: 'White blood cell count',
    value: '7,200',
    unit: 'cells/µL',
    range: '4,000–11,000 cells/µL',
    status: 'Within sample range',
    explanation: 'White blood cells are part of the immune system. This sample value falls within the illustrative range shown here.',
  },
  {
    name: 'Platelet count',
    value: '245,000',
    unit: 'cells/µL',
    range: '150,000–450,000 cells/µL',
    status: 'Within sample range',
    explanation: 'Platelets help blood clot. This sample value falls within the illustrative range shown here.',
  },
]

function Brand({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 text-left" aria-label="ReportSaathi home">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/10">
        <HeartPulse size={22} strokeWidth={2.3} />
      </span>
      <span className="text-[19px] font-bold tracking-tight text-slate-900">Report<span className="text-emerald-700">Saathi</span></span>
    </button>
  )
}

function Disclaimer({ compact = false }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-950 ${compact ? 'p-3' : 'p-4'}`} role="note">
      <Info className="mt-0.5 shrink-0 text-amber-700" size={19} />
      <p className="text-sm leading-6">
        <strong>Educational use only.</strong> ReportSaathi does not diagnose conditions or recommend treatment. It does not replace advice from a qualified healthcare professional. Discuss your results and concerns with your clinician.
      </p>
    </div>
  )
}

function Header({ page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = [
    ['Overview', 'home'],
    ['Dashboard', 'dashboard'],
    ['How it works', 'how'],
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Brand onClick={() => setPage('home')} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {nav.map(([label, target]) => (
            <button key={target} onClick={() => setPage(target)} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${page === target ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><span className={`h-2 w-2 rounded-full ${supabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {supabaseConfigured ? 'Accounts enabled' : 'Demo mode'}</span>
          <button onClick={() => setPage('dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
            Open dashboard <ArrowRight size={16} />
          </button>
        </div>
        <button className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {menuOpen && <nav className="grid gap-1 border-t border-slate-100 px-4 py-3 md:hidden" aria-label="Mobile navigation">
        {nav.map(([label, target]) => <button key={target} onClick={() => { setPage(target); setMenuOpen(false) }} className="rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</button>)}
        <button onClick={() => { setPage('dashboard'); setMenuOpen(false) }} className="mt-1 rounded-xl bg-emerald-700 px-4 py-3 text-left text-sm font-semibold text-white">Open dashboard</button>
      </nav>}
    </header>
  )
}

function Landing({ setPage }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[#f5faf7]">
        <div className="pointer-events-none absolute -right-36 -top-36 h-[34rem] w-[34rem] rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-36 h-[30rem] w-[30rem] rounded-full bg-teal-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm sm:text-sm">
              <Sparkles size={15} /> Medical information, made easier to understand
            </div>
            <h1 className="max-w-2xl text-[2.7rem] font-semibold leading-[1.09] tracking-tight text-slate-950 sm:text-6xl">
              Your lab report, in <span className="text-emerald-700">language you understand.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Medical terms and numbers can feel overwhelming. ReportSaathi is designed to help you understand what laboratory report entries mean, one step at a time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setPage('dashboard')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">
                Explore the demo <ArrowRight size={18} />
              </button>
              <button onClick={() => setPage('how')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                How it works
              </button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-700" /> Privacy-conscious design</span>
              <span className="inline-flex items-center gap-2"><Languages size={17} className="text-emerald-700" /> Multilingual direction</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-emerald-100 to-teal-50 blur-xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-emerald-950/10 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Illustrative preview</p><h2 className="mt-1 text-xl font-semibold text-slate-900">A clearer report view</h2></div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText size={23} /></span>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-800">Haemoglobin</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Example only</span></div>
                <div className="mt-4 flex items-end gap-2"><span className="text-3xl font-semibold tracking-tight text-slate-900">13.2</span><span className="pb-1 text-sm text-slate-500">g/dL</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[58%] rounded-full bg-emerald-600" /></div>
                <div className="mt-3 flex justify-between text-xs text-slate-500"><span>12.0</span><span>Illustrative range: 12.0–15.5</span><span>15.5</span></div>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><BookOpen size={17} /> In simple language</div>
                <p className="mt-2 text-sm leading-6 text-emerald-950/80">Haemoglobin is a protein in red blood cells that carries oxygen around the body.</p>
              </div>
              <p className="mt-4 text-center text-[11px] font-medium text-slate-400">Fictional sample data · Not a real patient report</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Designed around understanding</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Less confusion. More context.</h2><p className="mt-4 leading-7 text-slate-600">The goal is to make the language in a laboratory report easier to follow—not to replace the person who provides your care.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {[
            [FileText, 'Read the report', 'Choose a PDF or image of a laboratory report when document analysis is enabled.'],
            [Microscope, 'Understand each value', 'See the test name, value, unit and reference range as printed in the source.'],
            [MessageCircle, 'Learn the terminology', 'Explore plain-language explanations while keeping clinical decisions with your clinician.'],
          ].map(([Icon, title, body]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={21} /></span><h3 className="mt-5 font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}
        </div>
        <div className="mt-10"><Disclaimer /></div>
      </section>
    </>
  )
}


function AuthPanel({ user }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setMessage(''); setError('')
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) throw authError
        setMessage(data.session ? 'Your account has been created.' : 'Check your email to confirm your account, then sign in.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        setMessage('You are signed in.')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally { setBusy(false) }
  }

  const signOut = async () => {
    if (!supabase) return
    setBusy(true)
    const { error: authError } = await supabase.auth.signOut()
    if (authError) setError(authError.message)
    else setMessage('You have signed out.')
    setBusy(false)
  }

  if (!supabaseConfigured) return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <h2 className="font-semibold text-amber-950">Account and history · Demo mode</h2>
    <p className="mt-2 text-sm leading-6 text-amber-900">Supabase is not configured. Document extraction and Gemini can still work, but accounts and report history are disabled. Nothing is saved.</p>
  </section>

  if (user) return <section className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Signed in</p><p className="mt-1 font-semibold text-emerald-950">{user.email}</p><p className="mt-1 text-xs text-emerald-900">Your history is protected by Supabase Row Level Security.</p></div>
    <button onClick={signOut} disabled={busy} className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 disabled:opacity-50">{busy ? 'Please wait…' : 'Sign out'}</button>
  </section>

  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold text-slate-950">Your ReportSaathi account</h2><p className="mt-1 text-sm text-slate-600">Sign in to optionally save report history metadata.</p></div>
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button onClick={() => { setMode('signin'); setMessage(''); setError('') }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>Sign in</button>
        <button onClick={() => { setMode('signup'); setMessage(''); setError('') }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>Create account</button>
      </div>
    </div>
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Email
        <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="you@example.com"/>
      </label>
      <label className="text-sm font-medium text-slate-700">Password
        <input type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="At least 8 characters"/>
      </label>
      <button type="submit" disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 sm:col-span-2">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    {message && <p role="status" className="mt-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <p className="mt-3 text-xs leading-5 text-slate-500">Account confirmation settings are controlled in your Supabase project.</p>
  </section>
}

function ReportHistory({ user, refreshKey }) {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!supabase || !user) { setRows([]); return }
    setBusy(true); setError('')
    const { data, error: queryError } = await supabase.from('report_history')
      .select('id, title, source_type, extraction_method, page_count, created_at')
      .order('created_at', { ascending: false }).limit(30)
    if (queryError) setError(queryError.message)
    else setRows(data || [])
    setBusy(false)
  }

  useEffect(() => { load() }, [user?.id, refreshKey])

  const remove = async (id) => {
    if (!supabase || !user) return
    setError(''); setMessage('')
    const { error: deleteError } = await supabase.from('report_history').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else { setRows(current => current.filter(row => row.id !== id)); setMessage('History entry deleted.') }
  }

  if (!user) return null
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Saved report history</h2><p className="mt-1 text-xs text-slate-500">Metadata only. No report text or uploaded files are stored.</p></div><button onClick={load} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Refresh</button></div>
    {busy && <p className="mt-4 text-sm text-slate-500">Loading history…</p>}
    {!busy && rows.length === 0 && <p className="mt-4 text-sm text-slate-500">No saved reports yet.</p>}
    {rows.length > 0 && <div className="mt-4 divide-y divide-slate-100">{rows.map(row => <div key={row.id} className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.source_type.toUpperCase()} · {row.extraction_method} · {row.page_count} page(s)</p><p className="text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</p></div>
      <button onClick={() => remove(row.id)} className="shrink-0 rounded-lg p-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
    </div>)}</div>}
    {message && <p role="status" className="mt-2 text-xs text-emerald-700">{message}</p>}
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
  </section>
}

function UploadPanel({ onDemo, user, onSaved }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [language, setLanguage] = useState('English')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatQuestion, setChatQuestion] = useState('')
  const [isChatting, setIsChatting] = useState(false)

  const validate = (candidate) => {
    setError('')
    setNotice('')
    setAnalysis(null)
    setExplanation(null)
    setChatMessages([])
    setChatQuestion('')
    if (!candidate) return
    const ext = `.${candidate.name.split('.').pop().toLowerCase()}`
    const typeOk = ACCEPTED_TYPES.includes(candidate.type) || ACCEPTED_EXTENSIONS.includes(ext)
    if (!typeOk) { setFile(null); setError('Unsupported file. Choose a PDF, JPG or PNG file.'); return }
    if (candidate.size > MAX_FILE_BYTES) { setFile(null); setError('This file is larger than 10 MB. Choose a smaller file.'); return }
    if (candidate.size === 0) { setFile(null); setError('This file is empty. Choose a different file.'); return }
    setFile(candidate)
  }

  const handleAnalyze = async () => {
    if (!file || isAnalyzing) return
    setIsAnalyzing(true)
    setError('')
    setNotice('')
    setAnalysis(null)
    setExplanation(null)
    setChatMessages([])
    setChatQuestion('')
    try {
      const result = await analyzeReport(file)
      setAnalysis(result)
    } catch (err) {
      const message = err.response?.data?.detail || (err.code === 'ECONNABORTED'
        ? 'The document took too long to process. Try a smaller or clearer file.'
        : 'Could not connect to the ReportSaathi backend. Check that the API is running.')
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExplain = async () => {
    if (!analysis?.extracted_text || isExplaining) return
    setIsExplaining(true)
    setError('')
    setExplanation(null)
    try {
      const result = await explainReport(analysis.extracted_text, language)
      setExplanation(result)
    } catch (err) {
      const message = err.response?.data?.detail || (err.code === 'ECONNABORTED'
        ? 'The AI explanation took too long. Please try again.'
        : 'Could not reach the AI explanation service. Check the backend and try again.')
      setError(message)
    } finally {
      setIsExplaining(false)
    }
  }

  const handleChatSubmit = async (event) => {
    event.preventDefault()
    const question = chatQuestion.trim()
    if (!analysis?.extracted_text || !question || isChatting) return
    const previous = chatMessages.slice(-6)
    setIsChatting(true)
    setChatQuestion('')
    setError('')
    setChatMessages(current => [...current, { role: 'user', content: question }])
    try {
      const result = await chatAboutReport(
        analysis.extracted_text,
        question,
        language,
        previous.map(item => ({ role: item.role, content: item.content })),
      )
      setChatMessages(current => [...current, {
        role: 'assistant',
        content: result.answer,
        source_excerpt: result.source_excerpt,
        supported_by_report: result.supported_by_report,
      }])
    } catch (err) {
      const message = err.response?.data?.detail || 'Could not get an answer. Please check the backend and try again.'
      setChatMessages(current => [...current, { role: 'assistant', content: message, supported_by_report: false }])
    } finally {
      setIsChatting(false)
    }
  }

  const handleSaveMetadata = async () => {
    if (!supabase || !user || !analysis || isSaving) return
    setIsSaving(true); setSaveMessage(''); setError('')
    const { error: saveError } = await supabase.from('report_history').insert({
      title: 'Laboratory report',
      source_type: analysis.source_type,
      extraction_method: analysis.extraction_method,
      page_count: analysis.page_count,
    })
    if (saveError) setError(saveError.message)
    else { setSaveMessage('History metadata saved. The file, extracted text and AI explanation were not saved.'); onSaved?.() }
    setIsSaving(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    validate(event.dataTransfer.files?.[0])
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">New analysis</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Upload a laboratory report</h2><p className="mt-2 text-sm leading-6 text-slate-600">Choose a PDF or image. ReportSaathi extracts its text first; you can then request an educational explanation in your preferred language.</p></div>
        <span className="hidden h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 sm:grid"><UploadCloud size={23} /></span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-6 rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-9 ${dragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50/70 hover:border-emerald-400'}`}
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><FileImage size={25} /></span>
        <p className="mt-4 font-semibold text-slate-900">Drop your report here</p>
        <p className="mt-1 text-sm text-slate-500">or browse files from your device</p>
        <button onClick={() => inputRef.current?.click()} className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100">Choose a file</button>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={e => validate(e.target.files?.[0])} aria-label="Choose a laboratory report file" />
        <p className="mt-4 text-xs text-slate-500">PDF, JPG or PNG · Maximum 10 MB</p>
      </div>
      {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
      {file && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex min-w-0 items-center gap-3"><FileText className="shrink-0 text-emerald-700" size={20} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{file.name}</p><p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · Validated locally</p></div></div>
        <button onClick={() => { setFile(null); setAnalysis(null); setExplanation(null); setChatMessages([]); setChatQuestion(''); if (inputRef.current) inputRef.current.value = '' }} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-700" aria-label="Remove selected file"><Trash2 size={17} /></button>
      </div>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button disabled={!file || isAnalyzing} onClick={handleAnalyze} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isAnalyzing ? 'Extracting text…' : 'Extract report text'} {!isAnalyzing && <ArrowRight size={17} />}</button>
        <button onClick={onDemo} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">View sample results <ArrowRight size={17} /></button>
      </div>
      {notice && <div role="status" className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">{notice}</div>}
      {analysis && <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-emerald-950">Text extraction complete</h3>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800">{analysis.extraction_method === 'pdf_text' ? 'PDF text' : 'OCR text'}</span>
        </div>
        <p className="mt-2 text-xs text-emerald-900/80">{analysis.page_count} page(s) · {analysis.status} · Source: {analysis.source_type}</p>
        {analysis.warnings?.map((warning, index) => <p key={index} className="mt-2 text-xs leading-5 text-amber-800">{warning}</p>)}
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-100 bg-white p-3 text-xs leading-5 text-slate-800">{analysis.extracted_text}</pre>
        <p className="mt-3 text-xs leading-5 text-emerald-950">{analysis.notice}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-medium text-slate-800">Explanation language
            <select value={language} onChange={e => { setLanguage(e.target.value); setExplanation(null); setChatMessages([]) }} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100">
              <option>English</option>
              <option>Kannada</option>
              <option>Hindi</option>
            </select>
          </label>
          <button onClick={handleExplain} disabled={isExplaining} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {isExplaining ? 'Generating explanation…' : 'Explain this report'} <Sparkles size={16} />
          </button>
        </div>
      </section>}
      {explanation && <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 p-4" aria-live="polite">
        <div className="flex items-center gap-2">
          <Sparkles className="text-sky-700" size={19} />
          <h3 className="font-semibold text-sky-950">Educational explanation · {explanation.language}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-800">{explanation.explanation.summary}</p>
        {explanation.explanation.findings?.length > 0 ? <div className="mt-4 space-y-3">
          {explanation.explanation.findings.map((finding, index) => <article key={`${finding.test_name || 'finding'}-${index}`} className="rounded-xl border border-sky-100 bg-white p-4">
            <h4 className="font-semibold text-slate-900">{finding.test_name || 'Unclear test name'}</h4>
            <p className="mt-1 text-sm text-slate-700">{[finding.value, finding.unit].filter(Boolean).join(' ') || 'Value not clearly identified'}</p>
            {finding.reference_range && <p className="mt-1 text-xs text-slate-500">Printed reference range: {finding.reference_range}</p>}
            <p className="mt-3 text-sm leading-6 text-slate-700">{finding.explanation}</p>
            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600"><strong>Source text:</strong> {finding.source_excerpt}</p>
            {finding.notes?.map((note, i) => <p key={i} className="mt-2 text-xs text-amber-800">{note}</p>)}
          </article>)}
        </div> : <p className="mt-3 text-sm text-slate-700">No individual test findings could be safely verified from the extracted text.</p>}
        {explanation.explanation.missing_or_unclear?.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3"><h4 className="text-sm font-semibold text-amber-900">Missing or unclear information</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">{explanation.explanation.missing_or_unclear.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
        {explanation.explanation.general_notes?.map((item, i) => <p key={i} className="mt-2 text-xs leading-5 text-slate-600">{item}</p>)}
        <p className="mt-4 text-xs leading-5 text-sky-950">{explanation.safety_notice}</p>
      </section>}
      {analysis && <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-violet-700" size={19} />
          <h3 className="font-semibold text-violet-950">Ask about this report</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-violet-900">Questions are answered using this report's extracted text only. The chat is temporary and is not saved.</p>
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto" aria-live="polite">
          {chatMessages.map((message, index) => <article key={index} className={`rounded-xl p-3 text-sm leading-6 ${message.role === 'user' ? 'ml-6 bg-violet-700 text-white' : 'mr-4 border border-violet-100 bg-white text-slate-800'}`}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-70">{message.role === 'user' ? 'You' : 'ReportSaathi'}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.source_excerpt && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-700"><strong>Report source:</strong> {message.source_excerpt}</p>}
            {message.role === 'assistant' && message.supported_by_report === false && <p className="mt-2 text-xs font-medium text-amber-700">Not verified from this report or safety-limited.</p>}
          </article>)}
          {isChatting && <p className="text-xs text-violet-800">Preparing an answer…</p>}
        </div>
        <form onSubmit={handleChatSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input value={chatQuestion} onChange={event => setChatQuestion(event.target.value)} maxLength={1000} placeholder="Ask about a test or value in this report…" className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" aria-label="Question about selected report" />
          <button type="submit" disabled={!chatQuestion.trim() || isChatting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300">{isChatting ? 'Sending…' : 'Ask question'} <ArrowRight size={16} /></button>
        </form>
        <p className="mt-3 text-xs leading-5 text-slate-600">Do not use chat for diagnosis, emergencies, treatment decisions or medication changes. Contact a qualified clinician for those questions.</p>
      </section>}
      {analysis && <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs leading-5 text-slate-600">Saving is optional. Only the date, generic title, source type, extraction method and page count are stored. The original file, extracted text and AI explanation are not saved.</p>
        {user ? <button onClick={handleSaveMetadata} disabled={isSaving} className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 disabled:opacity-50">{isSaving ? 'Saving…' : 'Save report history metadata'}</button> : <p className="mt-2 text-xs text-slate-500">Sign in to save metadata. Nothing is saved automatically.</p>}
        {saveMessage && <p role="status" className="mt-2 text-xs text-emerald-800">{saveMessage}</p>}
      </div>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Privacy note: the selected file is sent to your configured ReportSaathi backend for temporary text extraction. This phase does not save the file or extracted text to a database. Use test or synthetic reports until production security, consent and retention controls are reviewed.</p>
    </section>
  )
}

function Dashboard({ setPage, user, authReady }) {
  const [historyRefresh, setHistoryRefresh] = useState(0)
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Your workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Welcome to ReportSaathi</h1><p className="mt-2 text-slate-600">Upload a report to extract its text, or explore the synthetic sample results.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><span className="h-2 w-2 rounded-full bg-amber-500" /> {user ? "Account connected" : "Optional account"}</span>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <UploadPanel onDemo={() => setPage('results')} user={user} onSaved={() => setHistoryRefresh(value => value + 1)} />
        <aside className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-6 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-emerald-300"><ShieldCheck size={22} /></span>
            <h2 className="mt-5 text-lg font-semibold">Your information matters</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Files are sent to the API for temporary extraction. Files and extracted text are never saved to report history.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-emerald-200"><LockKeyhole size={15} /> Temporary API extraction only</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">What you can try</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-700" /> Extract text from PDF and image files</li>
              <li className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-700" /> See a clearly labelled sample report</li>
              <li className="flex gap-2"><CircleHelp size={17} className="shrink-0 text-emerald-700" /> Understand the educational disclaimer</li>
            </ul>
          </div>
        </aside>
      </div>
      <div className="mt-6 space-y-4">
        {!authReady ? <p className="text-sm text-slate-500">Checking account session…</p> : <AuthPanel user={user} />}
        <ReportHistory user={user} refreshKey={historyRefresh} />
      </div>
      <div className="mt-6"><Disclaimer compact /></div>
    </main>
  )
}

function Results({ setPage }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={() => setPage('dashboard')} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800"><ArrowLeft size={17} /> Back to dashboard</button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Example report</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your sample results</h1><p className="mt-2 text-sm text-slate-600">Synthetic example values · Not extracted from an uploaded document</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Demo preview</span>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[['3','Example values'],['0','Uploaded files'],['Demo','Processing mode']].map(([v,l]) => <div key={l} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-2xl font-semibold text-slate-950">{v}</p><p className="mt-1 text-sm text-slate-500">{l}</p></div>)}
      </div>
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2"><ClipboardList className="text-emerald-700" size={20} /><h2 className="text-xl font-semibold text-slate-950">Extracted values</h2></div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1.2fr_.7fr_1.2fr_.9fr] gap-3 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid"><span>Test</span><span>Value</span><span>Reference range</span><span>Sample status</span></div>
          {demoValues.map((item, index) => <div key={item.name} className={`grid gap-2 px-5 py-4 sm:grid-cols-[1.2fr_.7fr_1.2fr_.9fr] sm:items-center ${index ? 'border-t border-slate-100' : ''}`}>
            <div><p className="text-sm font-semibold text-slate-900">{item.name}</p><p className="text-xs text-slate-400 sm:hidden">Test name</p></div>
            <div><p className="text-sm font-semibold tabular-nums text-slate-900">{item.value} <span className="font-normal text-slate-500">{item.unit}</span></p></div>
            <div><p className="text-sm text-slate-600">{item.range}</p><p className="text-xs text-slate-400 sm:hidden">Illustrative range</p></div>
            <div><span className="inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{item.status}</span></div>
          </div>)}
        </div>
        <p className="mt-2 text-xs text-slate-500">All values and ranges above are synthetic demo content. They are not medical reference recommendations.</p>
      </section>
      <section className="mt-9">
        <div className="mb-4 flex items-center gap-2"><BookOpen className="text-emerald-700" size={20} /><h2 className="text-xl font-semibold text-slate-950">Plain-language explanations</h2></div>
        <div className="space-y-3">{demoValues.map(item => <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">{item.name}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{item.explanation}</p></article>)}</div>
      </section>
      <div className="mt-8"><Disclaimer /></div>
      <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => setPage('dashboard')} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Back to dashboard</button><button onClick={() => setPage('home')} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Return home</button></div>
    </main>
  )
}

function HowItWorks({ setPage }) {
  const steps = [
    ['01', 'Select a report', 'Choose a PDF or a clear JPG/PNG image. The app will validate file format and size.'],
    ['02', 'Extract the text', 'Document processing will read digital PDF text or use OCR for scanned pages and images.'],
    ['03', 'Review explanations', 'The app will separate values found in the source from plain-language educational explanations.'],
  ]
  return <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">How it works</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A transparent path from report to understanding</h1><p className="mt-4 max-w-2xl leading-7 text-slate-600">The complete workflow is being developed in stages. This frontend currently demonstrates the interface and local file checks only.</p><div className="mt-9 grid gap-4 md:grid-cols-3">{steps.map(([n,t,d]) => <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold text-emerald-700">{n}</p><h2 className="mt-5 font-semibold text-slate-900">{t}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{d}</p></div>)}</div><div className="mt-8"><Disclaimer /></div><button onClick={() => setPage('dashboard')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Go to dashboard <ArrowRight size={17} /></button></main>
}

export default function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!supabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setUser(data.session?.user || null); setAuthReady(true) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthReady(true)
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const content = useMemo(() => {
    if (page === 'dashboard') return <Dashboard setPage={setPage} user={user} authReady={authReady} />
    if (page === 'results') return <Results setPage={setPage} />
    if (page === 'how') return <HowItWorks setPage={setPage} />
    return <Landing setPage={setPage} />
  }, [page, user, authReady])
  return <div className="min-h-screen bg-[#fbfdfc] text-slate-900"><Header page={page} setPage={setPage} />{content}<footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><Brand onClick={() => setPage('home')} /><p>© {new Date().getFullYear()} ReportSaathi · Educational information only</p><p>Report history is opt-in</p></div></footer></div>
}
