"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Boxes, Sparkles } from "lucide-react";
import { GridBackground } from "@/components/home/grid-background";
import { MagneticButton } from "@/components/home/magnetic-button";
import { ApiFlowGraph } from "@/components/home/api-flow-graph";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 }
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pt-20">
      <GridBackground />

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-izii-lime/25 bg-izii-lime/10 px-4 py-1.5 text-xs font-medium text-izii-green"
        >
          <Sparkles className="h-3.5 w-3.5" />
         Platforma de APIs de Operadoras de saúde
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className="text-gradient">Integrações com  </span>
          <br />
          <span className="text-gradient-accent">operadoras de saúde</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg"
        >
          
          Nossos anos de experiência em integração com operadoras de saúde nos garantem uma solução robusta e escalável para suas necessidades, agora disponível para você via APIs
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="#apis">
            <Boxes className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Explorar APIs
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </MagneticButton>
          <MagneticButton href="/docs/referencia-rest" variant="ghost">
            <BookOpen className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Primeiros Passos
          </MagneticButton>
        </motion.div>
      </div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.6, delay: 0.32 }}
        className="relative z-10 mx-auto mt-12 max-w-6xl"
      >
        <ApiFlowGraph />
      </motion.div>
    </section>
  );
}
