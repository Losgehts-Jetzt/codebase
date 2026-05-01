import { useNavigate } from 'react-router-dom'

export default function MathScreen() {
  const navigate = useNavigate()
  return (
    <div className="min-h-svh bg-gradient-to-b from-violet-100 to-indigo-100 flex flex-col items-center justify-center p-6 gap-6">
      <button onClick={() => navigate('/')} className="self-start text-indigo-500 text-lg font-semibold">
        ← Zurück
      </button>
      <span className="text-7xl">🔢</span>
      <h1 className="text-3xl font-bold text-indigo-700">Mathe</h1>
      <p className="text-gray-500">Hier kommen bald Rechenaufgaben!</p>
    </div>
  )
}
