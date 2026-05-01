import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lang } from '../../types'

interface CelebrationProps {
  visible: boolean
  lang: Lang
  onDone: () => void
}

// 8 stars fly out at equal angles
const STAR_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * 360)

export function Celebration({ visible, lang, onDone }: CelebrationProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [visible, onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Flying stars */}
          <div className="relative flex items-center justify-center">
            {STAR_ANGLES.map((angle, i) => (
              <motion.span
                key={i}
                className="absolute text-3xl pointer-events-none select-none"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 110,
                  y: Math.sin((angle * Math.PI) / 180) * 110,
                  opacity: 0,
                  scale: 1.6,
                }}
                transition={{ duration: 0.75, ease: 'easeOut', delay: i * 0.025 }}
              >
                ⭐
              </motion.span>
            ))}

            {/* Main card */}
            <motion.div
              className="bg-white rounded-3xl px-10 py-8 flex flex-col items-center gap-3 shadow-2xl"
              initial={{ scale: 0.2, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <motion.span
                className="text-7xl"
                animate={{ rotate: [0, -14, 14, -8, 0] }}
                transition={{ delay: 0.25, duration: 0.55 }}
              >
                🌟
              </motion.span>
              <p className="text-3xl font-bold text-indigo-600">
                {lang === 'de' ? 'Richtig!' : 'Correct!'}
              </p>
              <p className="text-lg text-gray-400">
                {lang === 'de' ? 'Super gemacht! 👏' : 'Well done! 👏'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
