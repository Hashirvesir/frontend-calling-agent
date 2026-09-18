'use client';

import { useEffect } from 'react';
import Nav from '@/components/landing/Nav';
import Hero from '@/components/landing/Hero';
import VoiceDemo from '@/components/landing/VoiceDemo';
import Features from '@/components/landing/Features';
import DashboardPreview from '@/components/landing/DashboardPreview';
import Pricing from '@/components/landing/Pricing';
import TalkToSalesSection from '@/components/landing/TalkToSalesSection';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '900px',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Background spotlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav />
        <div className="reveal"><Hero /></div>
        <div className="reveal"><VoiceDemo /></div>
        <div className="reveal"><Features /></div>
        <div className="reveal"><DashboardPreview /></div>
        <div className="reveal"><Pricing /></div>
        <div className="reveal"><TalkToSalesSection /></div>
        <div className="reveal"><Testimonials /></div>
        <div className="reveal"><CTA /></div>
        <Footer />
      </div>
    </div>
  );
}
