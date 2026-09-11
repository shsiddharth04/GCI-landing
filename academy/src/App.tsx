import CustomCursor from './components/CustomCursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Tracks from './components/Tracks'
import Instructors from './components/Instructors'
import StudioGallery from './components/StudioGallery'
import TrustLayer from './components/TrustLayer'
import Outcomes from './components/Outcomes'
import Pathway from './components/Pathway'
import Graduation from './components/Graduation'
import PaymentPlans from './components/PaymentPlans'
import Curriculum from './components/Curriculum'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import StudioPage from './pages/StudioPage'

export default function App() {
  if (window.location.pathname === '/studio') return <StudioPage />

  return (
    <div className="public-site grain min-h-screen bg-[#050505] text-white relative">
      <CustomCursor />
      <Nav />
      <Hero />
      <Tracks />
      <Instructors />
      <TrustLayer />
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
