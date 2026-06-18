import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

type Point = {
  x: number;
  y: number;
};

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

const highlightPills = [
  "Pembukuan Instan",
  "AI Assistant",
  "Hitung Laba",
] as const;

const heroStats: { label: string; value: string }[] = [
  { label: "Bisnis Terdaftar", value: "2.5K+" },
  { label: "Transaksi Dicatat", value: "45K+" },
  { label: "Accuracy Rate", value: "99.8%" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

export function GlowyWavesHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      // Use daylight/marble theme colors for Steep Style
      return {
        backgroundTop: "#ffffff",
        backgroundBottom: "#f7f7f8",
        wavePalette: [
          {
            offset: 0,
            amplitude: 70,
            frequency: 0.003,
            color: "rgba(119, 123, 134, 0.12)", // Graphite (#777b86)
            opacity: 0.5,
          },
          {
            offset: Math.PI / 2,
            amplitude: 90,
            frequency: 0.0026,
            color: "rgba(163, 166, 175, 0.15)", // Dove (#a3a6af)
            opacity: 0.4,
          },
          {
            offset: Math.PI,
            amplitude: 60,
            frequency: 0.0034,
            color: "rgba(93, 42, 26, 0.08)", // Rust (#5d2a1a)
            opacity: 0.35,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 80,
            frequency: 0.0022,
            color: "rgba(251, 225, 209, 0.25)", // Apricot Wash (#fbe1d1)
            opacity: 0.3,
          },
          {
            offset: Math.PI * 2,
            amplitude: 55,
            frequency: 0.004,
            color: "rgba(139, 140, 141, 0.1)", // Slate (#8b8c8d)
            opacity: 0.25,
          },
        ] satisfies WaveConfig[],
      };
    };

    let themeColors = computeThemeColors();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
            wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
            (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-white"
      role="region"
      aria-label="Glowing waves hero section"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Steep Style: Peach-lit dawn radial glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-1/4 h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-[#fbe1d1]/30 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[#d3e3fc]/20 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-24 text-center md:px-8 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full animate-fadeIn"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#a3a6af]/20 bg-white/70 px-4.5 py-1.5 text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#4c4c4c] backdrop-blur-sm shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#5d2a1a]" aria-hidden="true" />
            Asisten AI untuk UMKM Indonesia
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-[#17191c] tracking-[-0.025em] leading-[1.05]"
          >
            Pembukuan Bisnis <br className="hidden md:inline" />
            <span className="text-[#5d2a1a] italic font-normal">Tinggal Chat Saja.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-base md:text-lg text-[#4c4c4c] font-sans leading-relaxed tracking-[-0.009em]"
          >
            Catat penjualan, hitung laba bersih, dan kelola stok barang secara instan lewat obrolan biasa. Tidak perlu install aplikasi tambahan, tanpa belajar rumus Excel yang rumit.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group gap-2 rounded-full px-8 py-3 text-sm font-sans font-semibold bg-[#17191c] text-white hover:bg-black transition-all duration-300 shadow-md hover:scale-[1.02]"
            >
              Mulai Catat Gratis
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <a
              href="#showcase"
              className="text-[#17191c] hover:underline text-sm font-sans font-semibold px-6 py-2.5 flex items-center gap-1 transition-all duration-200"
            >
              Lihat Demo Aplikasi
            </a>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="mb-14 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] text-[#777b86]"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-full border border-[#a3a6af]/20 bg-[#f7f7f8]/90 px-4.5 py-1.5 backdrop-blur-sm font-sans font-semibold text-[10px] text-[#4c4c4c]"
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          {/* Steep style stats: 24px cards that feel like ceramic tiles, not windows */}
          <motion.div
            variants={statsVariants}
            className="grid gap-6 rounded-[24px] border border-[#a3a6af]/20 bg-white p-6 shadow-sm sm:grid-cols-3 max-w-3xl mx-auto"
            style={{ boxShadow: "rgba(4, 23, 43, 0.03) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 15px 20px -5px" }}
          >
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="space-y-1.5 p-3"
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#777b86] font-sans font-bold">
                  {stat.label}
                </div>
                <div className="text-3xl md:text-4xl font-serif text-[#17191c] font-normal">
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
