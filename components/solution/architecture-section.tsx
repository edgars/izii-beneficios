"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Cloud,
  KeyRound,
  Route,
  Sparkles,
  type LucideIcon
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 }
};

type Component = {
  icon: LucideIcon;
  name: string;
  tag: string;
  analogy: string;
  what: string;
  why: string;
};

const components: Component[] = [
  {
    icon: Cloud,
    name: "Independência de nuvem",
    tag: "Flexibilidade",
    analogy: "Pense em uma operação que pode ser instalada onde fizer mais sentido para o negócio.",
    what: "A solução não depende de um único provedor. Pode ser executada na AWS, na Google Cloud, na Microsoft Azure ou em uma infraestrutura própria da IZII, conforme a estratégia de cada cliente.",
    why: "Elimina a dependência de fornecedor e preserva o poder de negociação. A operação pode migrar de ambiente sem reconstrução, reduzindo custos e riscos de longo prazo."
  },
  {
    icon: KeyRound,
    name: "Keycloak",
    tag: "Gestão de identidade e acesso",
    analogy: "Funciona como o controle de acesso corporativo: identifica cada pessoa e libera apenas o que ela pode usar.",
    what: "É a camada de identidade da solução. Autentica cada usuário e define, com precisão, quem pode acessar cada recurso e realizar cada operação, de forma centralizada.",
    why: "Sustenta a segurança e a conformidade. Garante que apenas usuários autorizados acessem cada informação — pilar essencial para privacidade e proteção de dados (LGPD)."
  },
  {
    icon: Route,
    name: "KrakenD",
    tag: "Porta de entrada das APIs",
    analogy: "É a portaria única da operação: recebe cada solicitação, valida e encaminha ao destino correto.",
    what: "Todas as requisições passam primeiro pelo API Gateway. Ele valida o acesso junto ao Keycloak, direciona cada chamada ao serviço adequado e padroniza a comunicação entre sistemas.",
    why: "Concentra o controle em um único ponto seguro e monitorável. Aumenta o desempenho, reduz a complexidade das integrações e protege os serviços internos."
  },
  {
    icon: Activity,
    name: "Grafana",
    tag: "Observabilidade",
    analogy: "É o painel de controle da operação: mostra, em tempo real, a saúde de todo o sistema.",
    what: "Consolida indicadores em painéis visuais: volume de requisições, tempo de resposta, disponibilidade e eventuais falhas — tudo acompanhado de forma contínua.",
    why: "Antecipa problemas antes que afetem o cliente. Dá à equipe e à gestão visibilidade para decidir com dados e sustentar acordos de nível de serviço (SLA)."
  }
];

export function ArchitectureSection() {
  return (
    <div className="px-6 pb-24 pt-16 md:pt-20">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <div className="text-center">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-izii-lime/25 bg-izii-lime/10 px-4 py-1.5 text-xs font-medium text-izii-green"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Arquitetura da solução
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl font-semibold tracking-tight text-transparent sm:text-5xl md:text-6xl"
          >
            <span className="text-gradient">Os componentes da </span>
            <br />
            <span className="text-gradient-accent">solução, de forma clara</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-300"
          >
            Uma visão de negócio da arquitetura, sem jargão técnico. Cada
            componente cumpre um papel específico para entregar segurança,
            desempenho e controle. Conheça abaixo o que cada um faz e o valor
            que gera.
          </motion.p>
        </div>

        {/* Cards dos componentes */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {components.map((c, i) => (
            <motion.article
              key={c.name}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-izii-green/40 hover:shadow-lg hover:shadow-izii-green/5 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-izii-green/10 text-izii-green ring-1 ring-izii-green/20">
                  <c.icon className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-izii-green">
                    {c.tag}
                  </span>
                  <h2 className="text-xl font-semibold text-izii-charcoal dark:text-slate-100">
                    {c.name}
                  </h2>
                </div>
              </div>

              <p className="mt-5 rounded-lg bg-izii-mint/30 px-4 py-3 text-sm font-medium text-izii-charcoal dark:bg-izii-green/10 dark:text-izii-mint">
                <span className="font-semibold uppercase tracking-wide text-izii-green">
                  Analogia:{" "}
                </span>
                <span className="italic">{c.analogy}</span>
              </p>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-semibold text-izii-charcoal dark:text-slate-100">
                    O que faz:{" "}
                  </span>
                  {c.what}
                </p>
                <p>
                  <span className="font-semibold text-izii-charcoal dark:text-slate-100">
                    Por que importa:{" "}
                  </span>
                  {c.why}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Grafana em ação */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-16"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold text-izii-charcoal md:text-3xl dark:text-slate-100">
              Monitoramento em tempo real
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Exemplo de um painel do Grafana. Os indicadores consolidam a saúde
              da operação em uma única visão: com uma olhada, a equipe avalia o
              desempenho e é alertada automaticamente quando algo exige atenção.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-izii-charcoal/5 dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/grafana.jpeg"
              alt="Painel do Grafana mostrando gráficos de monitoramento da solução em tempo real"
              width={1280}
              height={713}
              className="h-auto w-full"
              priority
            />
          </div>
        </motion.section>

        {/* Resumo */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-16 rounded-2xl border border-izii-green/20 bg-izii-green/5 p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-izii-charcoal dark:text-slate-100">
            O valor de negócio, em resumo
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            A solução da IZII opera em{" "}
            <strong className="text-izii-green">qualquer nuvem</strong>, controla
            acessos com <strong className="text-izii-green">Keycloak</strong>,
            centraliza e protege as integrações com{" "}
            <strong className="text-izii-green">KrakenD</strong> e mantém total
            visibilidade da operação com{" "}
            <strong className="text-izii-green">Grafana</strong>. O resultado é
            uma plataforma segura, escalável e sob controle — pronta para
            crescer com o negócio.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
