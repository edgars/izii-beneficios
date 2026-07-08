import Link from "next/link";
import { BookOpen, HelpCircleIcon } from "lucide-react";
import { APP_NAME } from "@/config/brand";
import { PortalLogo } from "@/components/portal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-izii-charcoal dark:text-slate-100" aria-label={`${APP_NAME} — início`}>
          <PortalLogo priority className="h-7 max-h-8" />
          <span className="sr-only">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
          <Link href="/docs/referencia-rest" className="transition hover:text-izii-charcoal dark:hover:text-white">
            Manuais de Usuário
          </Link>
          <Link href="/#apis" className="transition hover:text-izii-charcoal dark:hover:text-white">
            APIs
          </Link>
        </nav>
        <div className="flex-1" />
        <Link
          href="/docs/referencia-rest"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-izii-charcoal transition hover:border-izii-green/40 hover:text-izii-green dark:border-slate-700 dark:text-slate-200"
        >
          <HelpCircleIcon className="h-3.5 w-3.5" />
          Suporte
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
