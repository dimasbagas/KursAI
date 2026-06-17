"use client";

import { useEffect } from "react";
import Link from "next/link";
import { renderCanvas } from "@/components/ui/canvas"
import { Shapes, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <section id="home" className="relative overflow-hidden min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="animation-delay-8 animate-fadeIn flex flex-col items-center justify-center px-4 text-center z-10 max-w-4xl mx-auto">
        <div className="mb-6 mt-10 sm:justify-center md:mb-4">
          <div className="relative flex items-center gap-2 whitespace-nowrap rounded-full border border-dark-border bg-dark-card/60 px-4 py-1.5 text-xs text-primary/80 backdrop-blur-md">
            <Shapes className="h-4 w-4 text-primary animate-pulse" /> Introducing KursAI.
            <a
              href="#fitur"
              className="hover:text-white ml-1 flex items-center font-bold gap-1 transition-colors"
            >
              Explore{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mb-10 mt-4 md:mt-6">
          <div className="px-2">
            <div className="border-dark-border relative mx-auto h-full max-w-3xl border border-white/5 bg-dark-card/25 backdrop-blur-sm p-6 md:p-12 rounded-3xl">
              <Plus className="text-primary absolute -left-4 -top-4 h-8 w-8" />
              <Plus className="text-primary absolute -bottom-4 -left-4 h-8 w-8" />
              <Plus className="text-primary absolute -right-4 -top-4 h-8 w-8" />
              <Plus className="text-primary absolute -bottom-4 -right-4 h-8 w-8" />
              <h1 className="flex select-none flex-col px-3 py-2 text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl text-white">
                Your Complete Platform for Business Design.
              </h1>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                </span>
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Available Now</p>
              </div>
            </div>
          </div>

          <h1 className="mt-8 text-xl md:text-2xl text-white">
            Welcome to our creative playground! I&#39;m{" "}
            <span className="text-primary font-black">KursAI</span>
          </h1>

          <p className="mx-auto mb-10 mt-3 max-w-2xl px-6 text-sm text-muted">
            We craft enchanting visuals for brands, and conjure AI design resources to empower businesses.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="default" size="lg" className="rounded-full shadow-lg shadow-primary/20">
                Start Project
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="rounded-full bg-transparent border-dark-border hover:bg-dark-hover">
                Register Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <canvas
        className="bg-transparent pointer-events-none absolute inset-0 mx-auto w-full h-full -z-0"
        id="canvas"
      ></canvas>
    </section>
  );
}
