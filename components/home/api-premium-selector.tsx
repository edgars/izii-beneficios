"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import type { ApiConfig } from "@/config/apis";
import { Badge } from "@/components/ui/badge";

type ApiWithMeta = ApiConfig & {
  badge?: string;
  tagline?: string;
};

export function ApiPremiumSelector({ apis }: { apis: ApiWithMeta[] }) {
  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-izii-charcoal md:text-3xl">APIs Premium</h2>
          <p className="mt-2 text-sm text-slate-500">Selecione uma API para explorar endpoints, schemas e playground.</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {apis.map((api, index) => (
            <motion.div
              key={api.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={`/${api.id}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-izii-green/40 hover:bg-izii-lime/10 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 shrink-0 text-izii-lime" />
                      <span className="font-medium text-izii-charcoal line-clamp-2">{api.name}</span>
                    </div>
                    {api.badge ? (
                      <Badge variant="outline" className="mt-2 border-izii-lime/35 text-izii-green">
                        {api.badge}
                      </Badge>
                    ) : null}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-izii-lime" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-3">
                  {api.tagline ?? api.description ?? "OpenAPI spec disponível no portal."}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-izii-lime opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
