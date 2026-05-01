import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const modules = [
  {
    path: '/math',
    emoji: '🔢',
    label: 'Mathe',
    sublabel: 'Rechnen & Aufgaben',
    bg: 'from-violet-400 to-indigo-500',
    shadow: 'shadow-indigo-300',
  },
  {
    path: '/language',
    emoji: '✏️',
    label: 'Sprache',
    sublabel: 'Lesen & Schreiben',
    bg: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-teal-300',
  },
  {
    path: '/stories',
    emoji: '📖',
    label: 'Geschichten',
    sublabel: 'Vorlesen & Entdecken',
    bg: 'from-orange-400 to-rose-500',
    shadow: 'shadow-rose-300',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? 'du'

  return (
    <div className="min-h-svh bg-gradient-to-b from-sky-100 to-indigo-100 flex flex-col items-center justify-center p-6 gap-8">
      <button
        onClick={logout}
        className="fixed top-5 right-5 text-xs font-semibold text-indigo-400 active:text-indigo-600 bg-white/70 rounded-full px-3 py-1.5 shadow-sm"
      >
        Abmelden
      </button>
      <motion.h1
        className="text-4xl font-bold text-indigo-700 tracking-tight"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Hallo, {name}! 👋
      </motion.h1>

      <div className="flex flex-col gap-5 w-full max-w-sm">
        {modules.map((mod, i) => (
          <motion.button
            key={mod.path}
            onClick={() => navigate(mod.path)}
            className={`w-full rounded-3xl bg-gradient-to-r ${mod.bg} ${mod.shadow} shadow-lg text-white flex items-center gap-5 px-6 py-5 active:scale-95 transition-transform`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
          >
            <span className="text-5xl">{mod.emoji}</span>
            <div className="text-left">
              <p className="text-2xl font-bold leading-tight">{mod.label}</p>
              <p className="text-sm opacity-80 mt-0.5">{mod.sublabel}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
