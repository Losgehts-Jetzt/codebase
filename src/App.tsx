import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import MathScreen from './screens/MathScreen'
import LanguageScreen from './screens/LanguageScreen'
import StoriesScreen from './screens/StoriesScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/math" element={<MathScreen />} />
        <Route path="/language" element={<LanguageScreen />} />
        <Route path="/stories" element={<StoriesScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
