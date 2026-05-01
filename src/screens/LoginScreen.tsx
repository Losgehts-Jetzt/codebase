import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { LangToggle } from '../components/LangToggle'
import type { Lang } from '../types'

type View = 'login' | 'forgot' | 'forgot-sent'

const copy = {
  title:        { de: 'Willkommen!',              en: 'Welcome!' },
  subtitle:     { de: 'Bitte melde dich an.',     en: 'Please sign in to continue.' },
  email:        { de: 'E-Mail-Adresse',            en: 'Email address' },
  password:     { de: 'Passwort',                  en: 'Password' },
  loginBtn:     { de: 'Anmelden',                  en: 'Sign in' },
  forgot:       { de: 'Passwort vergessen?',       en: 'Forgot password?' },
  forgotTitle:  { de: 'Passwort zurücksetzen',     en: 'Reset password' },
  forgotSub:    { de: 'Gib deine E-Mail ein. Wir schicken dir einen Link.', en: 'Enter your email and we\'ll send you a reset link.' },
  sendBtn:      { de: 'Link senden',               en: 'Send link' },
  sentTitle:    { de: 'E-Mail gesendet!',          en: 'Email sent!' },
  sentSub:      { de: 'Prüfe dein Postfach und klicke den Link.', en: 'Check your inbox and click the link.' },
  backToLogin:  { de: 'Zurück zur Anmeldung',      en: 'Back to sign in' },
  wrongCreds:   { de: 'E-Mail oder Passwort falsch.', en: 'Incorrect email or password.' },
  genericError: { de: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.', en: 'Something went wrong. Please try again.' },
}

export default function LoginScreen() {
  const { login, resetPassword } = useAuth()
  const [lang, setLang] = useState<Lang>('de')
  const [view, setView] = useState<View>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const t = (key: keyof typeof copy) => copy[key][lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError(t('wrongCreds'))
      } else {
        setError(t('genericError'))
      }
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPassword(email.trim())
      setView('forgot-sent')
    } catch {
      setError(t('genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-white flex flex-col items-center justify-center px-6">
      {/* Lang toggle — top right */}
      <div className="fixed top-5 right-5 z-10">
        <LangToggle lang={lang} onChange={setLang} />
      </div>

      {/* App logo / name */}
      <motion.div
        className="mb-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-6xl">🎓</span>
        <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">MathHelp</h1>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <motion.div
            key="login"
            className="w-full max-w-sm bg-white rounded-3xl shadow-xl px-8 py-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('title')}</h2>
            <p className="text-sm text-gray-400 mb-7">{t('subtitle')}</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('email')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('password')}
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    className="text-sm text-red-500 font-medium text-center"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-indigo-600 text-white font-bold text-lg py-3.5 active:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {busy ? '…' : t('loginBtn')}
              </button>
            </form>

            <button
              onClick={() => { setError(''); setView('forgot') }}
              className="mt-5 w-full text-center text-sm text-indigo-400 active:text-indigo-600"
            >
              {t('forgot')}
            </button>
          </motion.div>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <motion.div
            key="forgot"
            className="w-full max-w-sm bg-white rounded-3xl shadow-xl px-8 py-10"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('forgotTitle')}</h2>
            <p className="text-sm text-gray-400 mb-7">{t('forgotSub')}</p>

            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t('email')}
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    className="text-sm text-red-500 font-medium text-center"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-indigo-600 text-white font-bold text-lg py-3.5 active:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {busy ? '…' : t('sendBtn')}
              </button>
            </form>

            <button
              onClick={() => { setError(''); setView('login') }}
              className="mt-5 w-full text-center text-sm text-indigo-400 active:text-indigo-600"
            >
              ← {t('backToLogin')}
            </button>
          </motion.div>
        )}

        {/* ── RESET EMAIL SENT VIEW ── */}
        {view === 'forgot-sent' && (
          <motion.div
            key="sent"
            className="w-full max-w-sm bg-white rounded-3xl shadow-xl px-8 py-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <span className="text-6xl">📬</span>
            <h2 className="text-2xl font-bold text-gray-800 text-center">{t('sentTitle')}</h2>
            <p className="text-sm text-gray-400 text-center">{t('sentSub')}</p>
            <p className="text-sm font-semibold text-indigo-600 text-center">{email}</p>
            <button
              onClick={() => { setView('login'); setPassword('') }}
              className="mt-2 w-full rounded-xl bg-indigo-600 text-white font-bold text-lg py-3.5 active:bg-indigo-700 transition-colors"
            >
              ← {t('backToLogin')}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
