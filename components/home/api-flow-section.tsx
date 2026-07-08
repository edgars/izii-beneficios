"use client";

import { motion } from "framer-motion";
import { ApiFlowGraph } from "@/components/home/api-flow-graph";

export function ApiFlowSection() {
  return (
    <section className="relative overflow-hidden border-t border-slate-200 px-6 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(186,230,255,0.35),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-izii-lime/95">
          Fluxo em tempo real
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-izii-charcoal sm:text-3xl">
          Do client ao servidor e de volta
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Request e response em linhas retas contínuas, ligadas de extremo a extremo, com códigos
          HTTP animados no retorno (200, 201, 401, 429, 500).
        </p>
      </motion.div>

      <ApiFlowGraph className="relative z-10 mt-10 md:mt-14" />
    </section>
  );
}
