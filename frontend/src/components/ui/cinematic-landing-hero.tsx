// src/components/ui/cinematic-landing-hero.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.03; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, rgba(23, 25, 28, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(23, 25, 28, 0.03) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* -------------------------------------------------------------------
     PHYSICAL SKEUOMORPHIC MATERIALS (Restored 3D Depth - Light Theme)
  ---------------------------------------------------------------------- */
  
  .text-3d-matte {
      color: #17191c;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .text-silver-matte {
      color: #17191c;
  }

  /* INSIDE THE CARD: Editorial typography for light theme */
  .text-card-silver-matte {
      color: #17191c;
  }

  /* Deep Physical Card with Dynamic Mouse Lighting */
  .premium-depth-card {
      background: #ffffff;
      box-shadow: 
          0 40px 100px -20px rgba(4, 23, 43, 0.08),
          0 20px 40px -20px rgba(0, 0, 0, 0.04),
          inset 0 1px 2px rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(163, 166, 175, 0.2);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(93, 42, 26, 0.03) 0%, transparent 40%);
      mix-blend-mode: multiply; transition: opacity 0.3s ease;
  }

  /* Realistic iPhone Mockup Hardware - Light Theme */
  .iphone-bezel {
      background-color: #ffffff;
      box-shadow: 
          inset 0 0 0 2px #d1d5db, 
          inset 0 0 0 7px #f3f4f6, 
          0 40px 80px -15px rgba(4, 23, 43, 0.12),
          0 15px 25px -5px rgba(0,0,0,0.05);
      transform-style: preserve-3d;
      border: 1px solid #e5e7eb;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #d1d5db 0%, #9ca3af 100%);
      box-shadow: 
          -2px 0 5px rgba(0,0,0,0.05),
          inset -1px 0 1px rgba(255,255,255,0.8);
  }
  
  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: #ffffff;
      box-shadow: 
          0 6px 12px rgba(0, 0, 0, 0.02),
          inset 0 1px 1px rgba(255, 255, 255, 1);
      border: 1px solid rgba(163, 166, 175, 0.15);
  }

  .floating-ui-badge {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(23, 25, 28, 0.05),
          0 20px 40px -10px rgba(4, 23, 43, 0.1);
  }

  /* Physical Tactile Buttons - Ink Style */
  .btn-modern-light, .btn-modern-dark {
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
      background: #17191c;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(23, 25, 28, 0.15);
      border-radius: 9999px;
  }
  .btn-modern-light:hover {
      transform: translateY(-2px);
      background: #000000;
      box-shadow: 0 8px 16px rgba(23, 25, 28, 0.25);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
  }
  .btn-modern-dark {
      background: transparent;
      color: #17191c;
      border: 1px solid rgba(163, 166, 175, 0.4);
      border-radius: 9999px;
  }
  .btn-modern-dark:hover {
      transform: translateY(-2px);
      background: rgba(23, 25, 28, 0.04);
      border-color: #17191c;
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({ 
  brandName = "KursAI",
  tagline1 = "Catat Keuangan Toko,",
  tagline2 = "Tinggal Chat Saja.",
  cardHeading = "Accountability, Redefined.",
  cardDescription,
  metricValue = 247,
  metricLabel = "Transaksi Sukses",
  ctaHeading = "Mulai pembukuan digital Anda.",
  ctaDescription = "Bergabunglah dengan ribuan pelaku usaha yang telah mendigitalisasi pembukuan mereka hari ini.",
  className, 
  ...props 
}: CinematicHeroProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  const finalCardDescription = cardDescription || (
    <>
      <span className="text-white font-semibold">KursAI</span> membantu Anda mengelola pembukuan toko, piutang, kasbon, dan memantau operasional bisnis Anda melalui obrolan pesan interaktif.
    </>
  );

  // 1. High-Performance Mouse Interaction Logic (Using requestAnimationFrame)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 2. Complex Cinematic Scroll Timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        
        // Start mockup animation during card expansion
        .fromTo(".mockup-scroll-wrapper",
          { y: 200, z: -300, rotationX: 30, rotationY: -20, autoAlpha: 0, scale: 0.8 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "power3.out", duration: 2 },
          "-=1.5"
        )
        
        // Fade in left and right card texts earlier (during expansion)
        .fromTo(".card-left-text", 
          { y: 50, autoAlpha: 0 }, 
          { y: 0, autoAlpha: 1, ease: "power3.out", duration: 1.5 }, 
          "-=1.8"
        )
        .fromTo(".card-right-text", 
          { y: 50, autoAlpha: 0, scale: 0.9 }, 
          { y: 0, autoAlpha: 1, scale: 1, ease: "power3.out", duration: 1.5 }, 
          "<"
        )
        
        // Phone widgets and badges staggered
        .fromTo(".phone-widget", { y: 30, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.1, ease: "back.out(1.2)", duration: 1.2 }, "-=1.0")
        .to(".progress-ring", { strokeDashoffset: 60, duration: 1.5, ease: "power3.inOut" }, "-=0.8")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 1.5, ease: "expo.out" }, "-=1.2")
        .fromTo(".floating-badge", { y: 60, autoAlpha: 0, scale: 0.8, rotationZ: -5 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.2, stagger: 0.15 }, "-=1.0")
        
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 }) 
        .to({}, { duration: 1.5 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        // Responsive card pullback sizing
        .to(".main-card", { 
          width: isMobile ? "92vw" : "85vw", 
          height: isMobile ? "92vh" : "85vh", 
          borderRadius: isMobile ? "32px" : "40px", 
          ease: "expo.inOut", 
          duration: 1.8 
        }, "pullback") 
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]); 

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-white text-[#17191c] font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true" />

      {/* BACKGROUND LAYER: Hero Texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform transform-style-3d">
        <h1 className="text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-normal tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-normal italic text-[#5d2a1a] tracking-tighter">
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-normal text-[#17191c] mb-6 tracking-tight">
          {ctaHeading}
        </h2>
        <p className="text-[#4c4c4c] text-base md:text-lg mb-12 max-w-xl mx-auto font-sans leading-relaxed">
          {ctaDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <a href="/register" aria-label="Daftar Sekarang" className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <svg className="w-8 h-8 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase mb-[-2px]">Dapatkan Akses</div>
              <div className="text-xl font-bold leading-none tracking-tight">Daftar Sekarang</div>
            </div>
          </a>
          <a href="#showcase" aria-label="Lihat Demo" className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
            <svg className="w-7 h-7 transition-transform group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-[-2px]">Tonton Simulator</div>
              <div className="text-xl font-bold leading-none tracking-tight">Lihat Demo</div>
            </div>
          </a>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Deep Blue Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE GRID: Flex-col on mobile to force order, Grid on desktop */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
            
            {/* 1. TOP (Mobile) / RIGHT (Desktop): BRAND NAME */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h2 className="text-6xl md:text-[6rem] lg:text-[7rem] font-serif font-bold uppercase tracking-tighter text-[#17191c] lg:mt-0">
                {brandName}
              </h2>
            </div>

            {/* 2. MIDDLE (Mobile) / CENTER (Desktop): IPHONE MOCKUP */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              
              {/* Inner wrapper for safe CSS scaling that doesn't conflict with GSAP */}
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-[0.8] lg:scale-100">
                
                {/* The iPhone Bezel */}
                <div
                  ref={mockupRef}
                  className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col will-change-transform transform-style-3d"
                >
                  {/* Physical Hardware Buttons */}
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  {/* Inner Screen Container */}
                  <div className="absolute inset-[7px] bg-[#f7f7f8] rounded-[2.5rem] overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] text-[#17191c] z-10">
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    </div>

                    {/* App Interface */}
                    <div className="relative w-full h-full pt-12 px-5 pb-8 flex flex-col">
                      <div className="phone-widget flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">UMKM</span>
                          <span className="text-xl font-bold tracking-tight text-[#17191c]">KursAI</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#fbe1d1] text-[#5d2a1a] flex items-center justify-center font-bold text-sm border border-[#5d2a1a]/20 shadow-sm">AI</div>
                      </div>

                      <div className="phone-widget relative w-44 h-44 mx-auto flex items-center justify-center mb-8 drop-shadow-[0_15px_25px_rgba(0,0,0,0.05)]">
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(23,25,28,0.04)" strokeWidth="12" />
                          <circle className="progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#5d2a1a" strokeWidth="12" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-3xl font-bold tracking-tighter text-[#17191c]">0</span>
                          <span className="text-[8px] text-[#5d2a1a] uppercase tracking-[0.1em] font-bold mt-0.5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-[#d3e3fc] flex items-center justify-center mr-3 border border-[#d3e3fc]/30 shadow-inner">
                            <span className="text-sm">📈</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-neutral-400 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-12 bg-neutral-300 rounded-full shadow-inner" />
                          </div>
                        </div>
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-[#fbe1d1] flex items-center justify-center mr-3 border border-[#fbe1d1]/30 shadow-inner">
                            <span className="text-sm">📉</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-16 bg-neutral-400 rounded-full mb-2 shadow-inner" />
                            <div className="h-1.5 w-24 bg-neutral-300 rounded-full shadow-inner" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/10 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges */}
                <div className="floating-badge absolute flex top-6 lg:top-12 left-[-15px] lg:left-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#fbe1d1] flex items-center justify-center border border-[#fbe1d1]/30 shadow-sm">
                    <span className="text-base lg:text-xl drop-shadow-lg" aria-hidden="true">💡</span>
                  </div>
                  <div>
                    <p className="text-[#17191c] text-xs lg:text-sm font-bold tracking-tight">AI Analisis</p>
                    <p className="text-[#5d2a1a] text-[10px] lg:text-xs font-semibold">Laba Naik 15%</p>
                  </div>
                </div>

                <div className="floating-badge absolute flex bottom-12 lg:bottom-20 right-[-15px] lg:right-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#d3e3fc] flex items-center justify-center border border-[#d3e3fc]/30 shadow-sm">
                    <span className="text-base lg:text-lg drop-shadow-lg" aria-hidden="true">📊</span>
                  </div>
                  <div>
                    <p className="text-[#17191c] text-xs lg:text-sm font-bold tracking-tight">Laporan Keuangan</p>
                    <p className="text-[#17191c]/70 text-[10px] lg:text-xs font-semibold">Otomatis Terbit</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. BOTTOM (Mobile) / LEFT (Desktop): ACCOUNTABILITY TEXT */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
              <h3 className="text-[#17191c] text-2xl md:text-3xl lg:text-4xl font-serif font-normal mb-0 lg:mb-5 tracking-tight">
                {cardHeading}
              </h3>
              {/* HIDDEN ON MOBILE */}
              <p className="hidden md:block text-[#4c4c4c] text-sm md:text-base lg:text-lg font-sans font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                {finalCardDescription}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
