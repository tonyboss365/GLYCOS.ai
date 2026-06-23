import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import TopographicNeuralField from './components/TopographicNeuralField';
import Hero from './sections/Hero';
import Statement from './sections/Statement';
import Showcase from './sections/Showcase';
import Gallery from './sections/Gallery';
import Metrics from './sections/Metrics';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

function App() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      syncTouch: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative">
      {/* WebGL Background - only visible in hero */}
      <TopographicNeuralField />

      {/* Main Content */}
      <main className="relative">
        <Hero />
        <Statement />
        <Showcase />
        <Gallery />
        <Metrics />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}

export default App;
