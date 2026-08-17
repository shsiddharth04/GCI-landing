import Nav from './components/Nav'
import Hero from './components/Hero'
import Tracks from './components/Tracks'
import Outcomes from './components/Outcomes'
import Pathway from './components/Pathway'
import Curriculum from './components/Curriculum'
import Instructors from './components/Instructors'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="grain min-h-screen bg-[#050505] text-white relative">
      <Nav />
      <Hero />
      <Tracks />
      <Outcomes />
      <Pathway />
      <Curriculum />
      <Instructors />
      <FAQ />
      <Footer />
    </div>
  )
}
