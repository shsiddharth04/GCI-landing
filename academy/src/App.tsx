import Nav from './components/Nav'
import Hero from './components/Hero'
import Tracks from './components/Tracks'
import Outcomes from './components/Outcomes'
import Curriculum from './components/Curriculum'
import Instructors from './components/Instructors'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Nav />
      <Hero />
      <Tracks />
      <Outcomes />
      <Curriculum />
      <Instructors />
      <FAQ />
      <Footer />
    </div>
  )
}
