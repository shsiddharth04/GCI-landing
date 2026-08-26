import Nav from './components/Nav'
import Hero from './components/Hero'
import Tracks from './components/Tracks'
import Instructors from './components/Instructors'
import StudioGallery from './components/StudioGallery'
import Outcomes from './components/Outcomes'
import Pathway from './components/Pathway'
import Graduation from './components/Graduation'
import PaymentPlans from './components/PaymentPlans'
import Curriculum from './components/Curriculum'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="grain min-h-screen bg-[#050505] text-white relative">
      <Nav />
      <Hero />
      <Tracks />
      <Instructors />
      <StudioGallery />
      <Outcomes />
      <Pathway />
      <Graduation />
      <PaymentPlans />
      <Curriculum />
      <FAQ />
      <Footer />
    </div>
  )
}
