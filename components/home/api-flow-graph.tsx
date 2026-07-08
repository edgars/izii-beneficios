"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Laptop, Server, Workflow } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const REQUEST_MS = 3200;

type FlowPaths = {
  request: string;
  response: string;
  x1: number;
  x2: number;
  y: number;
  w: number;
  h: number;
};

function measureFlowPaths(root: HTMLElement): FlowPaths | null {
  const clientIcon = root.querySelector<HTMLElement>('[data-flow-node="client"]');
  const apiIcon = root.querySelector<HTMLElement>('[data-flow-node="api"]');
  if (!clientIcon || !apiIcon) return null;

  const box = root.getBoundingClientRect();
  const client = clientIcon.getBoundingClientRect();
  const api = apiIcon.getBoundingClientRect();

  const w = box.width;
  const h = box.height;
  if (w < 1 || h < 1) return null;

  const y = client.top + client.height / 2 - box.top;
  const x1 = client.right - box.left;
  const x2 = api.left - box.left;

  return {
    w,
    h,
    x1,
    x2,
    y,
    request: `M ${x1} ${y} L ${x2} ${y}`,
    response: `M ${x2} ${y} L ${x1} ${y}`
  };
}

const RESPONSE_MS = 5200;

type Direction = "request" | "response";

/** Cores alinhadas ao comportamento HTTP / variantes do portal */
const HTTP_STATUS_SEQUENCE = [
  {
    code: 200,
    label: "OK",
    hint: "GET · sucesso",
    color: "#34d399",
    glow: "rgba(52,211,153,0.55)",
    bg: "rgba(16,185,129,0.18)",
    border: "rgba(52,211,153,0.45)"
  },
  {
    code: 201,
    label: "Created",
    hint: "POST · recurso criado",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.55)",
    bg: "rgba(14,165,233,0.18)",
    border: "rgba(56,189,248,0.45)"
  },
  {
    code: 401,
    label: "Unauthorized",
    hint: "auth · credencial inválida",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.5)",
    bg: "rgba(245,158,11,0.16)",
    border: "rgba(251,191,36,0.4)"
  },
  {
    code: 429,
    label: "Too Many Requests",
    hint: "rate limit · throttle",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.5)",
    bg: "rgba(234,88,12,0.16)",
    border: "rgba(251,146,60,0.42)"
  },
  {
    code: 500,
    label: "Internal Server Error",
    hint: "upstream · falha no servidor",
    color: "#f87171",
    glow: "rgba(248,113,113,0.55)",
    bg: "rgba(239,68,68,0.16)",
    border: "rgba(248,113,113,0.42)"
  }
] as const;

export function ApiFlowGraph({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [flowPaths, setFlowPaths] = React.useState<FlowPaths | null>(null);
  const [direction, setDirection] = React.useState<Direction>("request");
  const [statusIndex, setStatusIndex] = React.useState(0);

  const remeasure = React.useCallback(() => {
    const root = canvasRef.current;
    if (!root) return;
    const next = measureFlowPaths(root);
    if (next) setFlowPaths(next);
  }, []);

  React.useLayoutEffect(() => {
    remeasure();
    const raf = requestAnimationFrame(remeasure);
    const root = canvasRef.current;
    if (!root) return () => cancelAnimationFrame(raf);
    const ro = new ResizeObserver(remeasure);
    ro.observe(root);
    window.addEventListener("resize", remeasure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [remeasure]);

  React.useEffect(() => {
    if (reduce) return;
    const ms = direction === "request" ? REQUEST_MS : RESPONSE_MS;
    const id = window.setInterval(() => {
      setDirection((d) => (d === "request" ? "response" : "request"));
    }, ms);
    return () => window.clearInterval(id);
  }, [direction, reduce]);

  React.useEffect(() => {
    if (reduce || direction !== "response") {
      setStatusIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % HTTP_STATUS_SEQUENCE.length);
    }, RESPONSE_MS / HTTP_STATUS_SEQUENCE.length);
    return () => window.clearInterval(id);
  }, [direction, reduce]);

  const activePath = flowPaths
    ? direction === "request"
      ? flowPaths.request
      : flowPaths.response
    : "";
  const idlePath = flowPaths
    ? direction === "request"
      ? flowPaths.response
      : flowPaths.request
    : "";
  const currentStatus = HTTP_STATUS_SEQUENCE[statusIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative mx-auto w-full max-w-4xl", className)}
    >
      <motion.div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg backdrop-blur-md">
        <motion.div
          className="absolute inset-0"
          animate={
            reduce
              ? undefined
              : {
                  background:
                    direction === "request"
                      ? "radial-gradient(ellipse 65% 55% at 35% 30%, rgba(186,230,255,0.35), transparent 68%)"
                      : `radial-gradient(ellipse 65% 55% at 65% 75%, ${currentStatus.glow.replace("0.55", "0.08")}, transparent 68%)`
                }
          }
          transition={{ duration: 0.5 }}
        />

        <motion.div
          ref={canvasRef}
          className="relative z-[1] h-[min(46vw,260px)] w-full sm:h-[250px]"
        >
        {flowPaths ? (
        <svg
          viewBox={`0 0 ${flowPaths.w} ${flowPaths.h}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id="flow-request-grad"
              gradientUnits="userSpaceOnUse"
              x1={flowPaths.x1}
              y1={flowPaths.y}
              x2={flowPaths.x2}
              y2={flowPaths.y}
            >
              <stop offset="0%" stopColor="rgba(51,190,242,0.2)" />
              <stop offset="50%" stopColor="rgba(125,211,252,1)" />
              <stop offset="100%" stopColor="rgba(51,190,242,0.4)" />
            </linearGradient>
            <filter id="flow-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path d={idlePath} fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1" strokeLinecap="round" />
          <path
            d={flowPaths.request}
            fill="none"
            stroke="rgba(148,163,184,0.4)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="4 8"
          />

          <circle cx={flowPaths.x1} cy={flowPaths.y} r="3" fill="rgba(148,163,184,0.6)" />
          <circle cx={flowPaths.x2} cy={flowPaths.y} r="3" fill="rgba(148,163,184,0.6)" />

          <AnimatePresence mode="wait">
            {!reduce && activePath ? (
              <motion.g
                key={direction}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.path
                  d={activePath}
                  fill="none"
                  stroke={
                    direction === "request" ? "url(#flow-request-grad)" : currentStatus.color
                  }
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#flow-soft-glow)"
                  initial={{ pathLength: 0.02 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.path
                  d={activePath}
                  fill="none"
                  stroke={direction === "request" ? "rgba(196,181,253,0.9)" : currentStatus.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 16"
                  animate={{
                    strokeDashoffset: direction === "request" ? [0, -44] : [0, 44]
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                />
              </motion.g>
            ) : null}
          </AnimatePresence>
        </svg>
        ) : null}

        {/* Pacotes e códigos HTTP — camada HTML com offsetPath */}
        {!reduce && flowPaths && activePath ? (
          <div className="pointer-events-none absolute inset-0 z-[2] overflow-visible">
            <AnimatePresence mode="wait">
              {direction === "request" ? (
                <RequestPacket key="req" path={flowPaths.request} />
              ) : (
                <HttpStatusTraveler
                  key={currentStatus.code}
                  path={flowPaths.response}
                  status={currentStatus}
                />
              )}
            </AnimatePresence>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 z-[3]">
          <GraphNode
            nodeId="client"
            style={{ left: "5%", top: "50%", transform: "translateY(-50%)" }}
            icon={Laptop}
            title="Client"
            subtitle="Consumer"
            role={direction === "request" ? "source" : "sink"}
            reduce={!!reduce}
            pulseColor={direction === "response" ? currentStatus.color : undefined}
          />
          <GraphNode
            nodeId="portal"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            icon={Workflow}
            title="Portal"
            subtitle="Proxy · Docs"
            role="hub"
            reduce={!!reduce}
            accent
          />
          <GraphNode
            nodeId="api"
            style={{ right: "5%", top: "50%", transform: "translateY(-50%)" }}
            icon={Server}
            title="API"
            subtitle="REST · OpenAPI"
            role={direction === "request" ? "sink" : "source"}
            reduce={!!reduce}
            pulseColor={direction === "response" ? currentStatus.color : undefined}
          />
        </div>
        </motion.div>

        <StatusBar
          direction={direction}
          status={currentStatus}
          statusIndex={statusIndex}
          reduce={!!reduce}
        />
      </motion.div>
    </motion.div>
  );
}

function RequestPacket({ path }: { path: string }) {
  const pathStyle = { offsetPath: `path('${path}')`, offsetRotate: "0deg" };
  const travel = {
    offsetDistance: ["0%", "100%"],
    transition: {
      duration: 1.1,
      repeat: Infinity,
      repeatDelay: REQUEST_MS / 1000 - 1.1,
      ease: "easeInOut" as const
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-izii-lime shadow-md"
        style={pathStyle}
        animate={{ ...travel, offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0.2] }}
        transition={travel.transition}
      />
      <motion.div
        className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-md border border-izii-lime/40 bg-izii-lime/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-izii-green shadow-sm"
        style={pathStyle}
        animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
        transition={{ ...travel.transition, delay: 0.06 }}
      >
        POST
      </motion.div>
    </motion.div>
  );
}

function HttpStatusTraveler({
  path,
  status
}: {
  path: string;
  status: (typeof HTTP_STATUS_SEQUENCE)[number];
}) {
  return (
    <motion.div
      className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
      style={{
        offsetPath: `path('${path}')`,
        offsetRotate: "0deg"
      }}
      initial={{ offsetDistance: "100%", opacity: 0, scale: 0.6 }}
      animate={{
        offsetDistance: ["100%", "0%"],
        opacity: [0, 1, 1, 0.85, 0],
        scale: [0.6, 1.08, 1, 0.95, 0.7]
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="rounded-md border px-2 py-0.5 font-mono text-xs font-bold tabular-nums shadow-lg sm:text-sm"
        style={{
          color: status.color,
          backgroundColor: status.bg,
          borderColor: status.border,
          boxShadow: `0 0 20px ${status.glow}`
        }}
      >
        {status.code}
      </span>
      <span
        className="whitespace-nowrap rounded px-1.5 py-px text-[8px] font-medium uppercase tracking-wide sm:text-[9px]"
        style={{ color: status.color, opacity: 0.85 }}
      >
        {status.label}
      </span>
    </motion.div>
  );
}

function StatusBar({
  direction,
  status,
  statusIndex,
  reduce
}: {
  direction: Direction;
  status: (typeof HTTP_STATUS_SEQUENCE)[number];
  statusIndex: number;
  reduce: boolean;
}) {
  const Icon = direction === "request" ? ArrowUpRight : ArrowDownLeft;

  return (
    <motion.div
      className="relative z-[4] flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-3"
      layout
    >
      <Icon
        className="h-3.5 w-3.5"
        style={{ color: direction === "request" ? "#a78bfa" : status.color }}
        aria-hidden
      />
      <AnimatePresence mode="wait">
        {direction === "request" ? (
          <motion.span
            key="req"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="font-mono text-[11px] text-slate-700 sm:text-xs"
          >
            POST /auth/token
          </motion.span>
        ) : (
          <motion.span
            key={status.code}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="font-mono text-[11px] sm:text-xs"
            style={{ color: status.color }}
          >
            {status.code} · {status.hint}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        className={cn(
          "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
          direction === "request" ? "bg-izii-lime/15 text-izii-green" : ""
        )}
        style={
          direction === "response"
            ? { backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }
            : undefined
        }
        layout
      >
        {direction === "request" ? "request" : "response"}
      </motion.span>
      {!reduce && direction === "response" ? (
        <div className="flex gap-1">
          {HTTP_STATUS_SEQUENCE.map((s, i) => (
            <motion.span
              key={s.code}
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: i === statusIndex ? s.color : "rgba(148,163,184,0.5)" }}
              animate={i === statusIndex ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

function GraphNode({
  nodeId,
  icon: Icon,
  title,
  subtitle,
  role,
  reduce,
  accent,
  pulseColor,
  style
}: {
  nodeId: "client" | "portal" | "api";
  icon: typeof Laptop;
  title: string;
  subtitle: string;
  role: "source" | "sink" | "hub";
  reduce: boolean;
  accent?: boolean;
  pulseColor?: string;
  style: React.CSSProperties;
}) {
  const active = role === "source" || role === "sink";
  const glow = pulseColor ?? "rgba(51,190,242,0.45)";

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1.5"
      style={style}
      animate={reduce ? undefined : { scale: active ? 1.03 : role === "hub" ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <motion.div
        data-flow-node={nodeId}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl border bg-white shadow-sm sm:h-12 sm:w-12",
          accent ? "border-izii-lime/45" : "border-slate-300",
          active && !pulseColor && "border-izii-lime/50 shadow-md"
        )}
        style={
          active && pulseColor
            ? { borderColor: pulseColor, boxShadow: `0 0 28px -4px ${glow}` }
            : undefined
        }
        animate={
          reduce || !active
            ? undefined
            : {
                boxShadow: [
                  "0 0 0 0 rgba(0,0,0,0)",
                  `0 0 20px 2px ${glow}`,
                  "0 0 0 0 rgba(0,0,0,0)"
                ]
              }
        }
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Icon className={cn("h-5 w-5", accent ? "text-izii-green" : "text-slate-600")} />
      </motion.div>
      <div className="text-center">
        <p className="text-[10px] font-semibold text-slate-800 sm:text-xs">{title}</p>
        <p className="text-[9px] text-slate-400 sm:text-[10px]">{subtitle}</p>
      </div>
    </motion.div>
  );
}
