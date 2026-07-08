"use client";

import { motion, useReducedMotion } from "framer-motion";

const SPARKLE_COUNT = 88;
const STAR_COUNT = 32;

type SparkleSpec = {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  repeatDelay: number;
  tone: "teal" | "blue" | "sky" | "white";
  kind: "dot" | "star";
};

const TONE: Record<SparkleSpec["tone"], { core: string; glow: string }> = {
  teal: { core: "rgba(130,200,215,0.9)", glow: "rgba(30,112,130,0.5)" },
  blue: { core: "rgba(140,200,230,0.9)", glow: "rgba(45,137,179,0.45)" },
  sky: { core: "rgba(125,220,252,0.9)", glow: "rgba(51,190,242,0.45)" },
  white: { core: "rgba(255,255,255,0.9)", glow: "rgba(255,255,255,0.35)" }
};

function buildSpecs(): SparkleSpec[] {
  const tones: SparkleSpec["tone"][] = ["teal", "blue", "sky", "white"];
  const specs: SparkleSpec[] = [];

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const left = `${(((i * 0.618033988749895) % 1) * 92 + 4).toFixed(2)}%`;
    const top = `${(((i * 0.381966011250895 + 0.12) % 0.78) * 100).toFixed(2)}%`;
    specs.push({
      id: i,
      left,
      top,
      size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2.25 : 1.5,
      delay: (i % 11) * 0.22,
      duration: 1.4 + (i % 7) * 0.35,
      repeatDelay: 0.15 + (i % 6) * 0.25,
      tone: tones[i % tones.length],
      kind: "dot"
    });
  }

  for (let i = 0; i < STAR_COUNT; i++) {
    const left = `${(((i * 0.754877666246693) % 1) * 88 + 6).toFixed(2)}%`;
    const top = `${(((i * 0.569840290998053) % 0.7) * 100).toFixed(2)}%`;
    specs.push({
      id: SPARKLE_COUNT + i,
      left,
      top,
      size: 3.5 + (i % 3) * 0.5,
      delay: i * 0.28,
      duration: 2 + (i % 5) * 0.4,
      repeatDelay: 0.2 + (i % 4) * 0.35,
      tone: tones[(i + 1) % tones.length],
      kind: "star"
    });
  }

  return specs;
}

const SPECS = buildSpecs();

function SparkleDot({ spec, reduce }: { spec: SparkleSpec; reduce: boolean }) {
  const { core, glow } = TONE[spec.tone];

  return (
    <motion.span
      className="absolute rounded-full will-change-[opacity,transform]"
      style={{
        left: spec.left,
        top: spec.top,
        width: spec.size,
        height: spec.size,
        background: core,
        boxShadow: `0 0 ${spec.size * 5}px ${glow}, 0 0 ${spec.size * 10}px ${glow}`
      }}
      animate={
        reduce
          ? { opacity: 0.25, scale: 1 }
          : {
              opacity: [0, 0.35, 1, 0.45, 0],
              scale: [0.2, 0.9, 1.35, 0.85, 0.2],
              rotate: [0, 45, 90, 135, 180]
            }
      }
      transition={{
        duration: spec.duration,
        delay: spec.delay,
        repeat: Infinity,
        repeatDelay: spec.repeatDelay,
        ease: "easeInOut"
      }}
    />
  );
}

function SparkleStar({ spec, reduce }: { spec: SparkleSpec; reduce: boolean }) {
  const { core, glow } = TONE[spec.tone];
  const arm = spec.size * 2.8;

  return (
    <motion.div
      className="absolute will-change-[opacity,transform]"
      style={{ left: spec.left, top: spec.top }}
      animate={
        reduce
          ? { opacity: 0.2, rotate: 0 }
          : {
              opacity: [0, 0.65, 1, 0.5, 0],
              rotate: [0, 25, -18, 12, 0],
              scale: [0.4, 1.1, 1.25, 0.95, 0.4]
            }
      }
      transition={{
        duration: spec.duration,
        delay: spec.delay,
        repeat: Infinity,
        repeatDelay: spec.repeatDelay,
        ease: "easeInOut"
      }}
    >
      <span
        className="absolute block origin-center"
        style={{
          left: "50%",
          top: "50%",
          width: arm,
          height: 1,
          marginLeft: -arm / 2,
          marginTop: -0.5,
          background: `linear-gradient(90deg, transparent, ${core}, transparent)`,
          boxShadow: `0 0 8px ${glow}`
        }}
      />
      <span
        className="absolute block origin-center"
        style={{
          left: "50%",
          top: "50%",
          width: 1,
          height: arm,
          marginLeft: -0.5,
          marginTop: -arm / 2,
          background: `linear-gradient(180deg, transparent, ${core}, transparent)`,
          boxShadow: `0 0 8px ${glow}`
        }}
      />
    </motion.div>
  );
}

/** Soft drifting shimmer orbs — adds depth behind sparkles */
function ShimmerOrbs({ reduce }: { reduce: boolean }) {
  return (
    <>
      <motion.div
        className="absolute left-[18%] top-[22%] h-32 w-32 rounded-full bg-izii-dark/[0.07] blur-2xl"
        animate={reduce ? undefined : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1], x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[20%] top-[38%] h-24 w-24 rounded-full bg-izii-green/[0.08] blur-2xl"
        animate={reduce ? undefined : { opacity: [0.2, 0.55, 0.2], scale: [1, 1.2, 1], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute left-[42%] top-[8%] h-20 w-20 rounded-full bg-izii-lime/[0.06] blur-xl"
        animate={reduce ? undefined : { opacity: [0.15, 0.45, 0.15], y: [0, 14, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </>
  );
}

export function SparkleBackground() {
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Fade edges so sparkles stay subtle at viewport borders */}
      <motion.div
        className="absolute inset-0 opacity-100"
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 38%, black 15%, transparent 72%), linear-gradient(to bottom, black 0%, transparent 88%)"
        }}
      >
        <ShimmerOrbs reduce={!!reduce} />
        {SPECS.map((spec) =>
          spec.kind === "star" ? (
            <SparkleStar key={spec.id} spec={spec} reduce={!!reduce} />
          ) : (
            <SparkleDot key={spec.id} spec={spec} reduce={!!reduce} />
          )
        )}
      </motion.div>

      {/* Occasional soft sweep — discrete but adds life */}
      {!reduce ? (
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(51,190,242,0.04)_50%,transparent_60%)]"
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />
      ) : null}
    </div>
  );
}
