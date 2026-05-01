import { useNavigate } from 'react-router-dom'

export default function LanguageScreen() {
  const navigate = useNavigate()
  return (
    <div className="min-h-svh bg-gradient-to-b from-emerald-100 to-teal-100 flex flex-col items-center justify-center p-6 gap-6">
      <button onClick={() => navigate('/')} className="self-start text-teal-600 text-lg font-semibold">
        ← Zurück
      </button>
      <span className="text-7xl">✏️</span>
      <h1 className="text-3xl font-bold text-teal-700">Sprache</h1>
      <p className="text-gray-500">Hier kommen bald Sprach-Übungen!</p>
    </div>
  )
}
