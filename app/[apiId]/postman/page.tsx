import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, FolderOpen, Key, Play, Settings2 } from "lucide-react";
import { getApiConfigSafe, listApis } from "@/config/apis";
import { getOpenApiDocument, getOpenApiNav } from "@/lib/openapi";
import { ExplorerSidebar } from "@/components/explorer/explorer-sidebar";
import { PortalTopbar } from "@/components/portal-topbar";
import { CodeBlock } from "@/components/code-block";

export const revalidate = 3600;

export default async function PostmanDocsPage({
  params
}: {
  params: Promise<{ apiId: string }>;
}) {
  const { apiId } = await params;
  const api = await getApiConfigSafe(apiId);
  if (!api) notFound();

  const [apis, doc] = await Promise.all([listApis(), getOpenApiDocument(apiId)]);
  const nav = getOpenApiNav(doc);
  const baseUrl = api.baseUrl ?? "https://api.izii.com.br";

  const envJson = JSON.stringify(
    {
      id: `${apiId}-env`,
      name: `${api.name} — Ambiente`,
      values: [
        { key: "baseUrl", value: baseUrl, type: "default", enabled: true },
        { key: "bearerToken", value: "", type: "secret", enabled: true }
      ],
      _postman_variable_scope: "environment"
    },
    null,
    2
  );

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-background">
      <PortalTopbar
        apiId={apiId}
        apis={apis}
        apiName={api.name}
        mobileNav={<ExplorerSidebar apiId={apiId} nav={nav} />}
      />

      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Back */}
        <Link
          href={`/${apiId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-izii-charcoal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para a API
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-izii-charcoal">
          Postman — {api.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Importe a coleção gerada automaticamente a partir da especificação OpenAPI e comece a
          testar os endpoints em minutos.
        </p>

        {/* Downloads */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <DownloadCard
            href={`/api/specs/${apiId}/postman`}
            icon={<PostmanIcon className="h-5 w-5" />}
            title="Coleção RESTful"
            description="gerada da spec OpenAPI"
            badge="v2.1"
          />
          <DownloadCard
            href={`/postman/${apiId}.postman_collection.json`}
            icon={<PostmanIcon className="h-5 w-5" />}
            title="Coleção Manual"
            description="dados mockados · RPC"
            badge="v2.1"
          />
          <DownloadCard
            href={`/api/specs/${apiId}/openapi`}
            icon={<OpenApiIcon className="h-5 w-5" />}
            title="Spec OpenAPI"
            description={`${apiId}-openapi.yaml`}
            badge="YAML"
          />
        </div>

        {/* Steps */}
        <div className="mt-10 space-y-10">
          <Step
            number={1}
            icon={<FolderOpen className="h-4 w-4" />}
            title="Importe a coleção"
          >
            <ol className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                1. Baixe o arquivo <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{apiId}.postman_collection.json</code> acima.
              </li>
              <li>2. Abra o Postman → clique em <strong>Import</strong> (canto superior esquerdo).</li>
              <li>3. Arraste o arquivo ou selecione via <em>files</em> → confirme.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-400">
              A coleção já inclui a variável <code className="font-mono">{"{{baseUrl}}"}</code> configurada para{" "}
              <code className="font-mono">{baseUrl}</code>.
            </p>
          </Step>

          <Step
            number={2}
            icon={<Settings2 className="h-4 w-4" />}
            title="Configure o ambiente"
          >
            <p className="mt-3 text-sm text-slate-600">
              Crie um ambiente no Postman com as variáveis abaixo. Você pode importar diretamente
              salvando o JSON como arquivo <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{apiId}-env.json</code>.
            </p>
            <div className="mt-4">
              <CodeBlock code={envJson} language="json" collapsible={false} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <strong className="block text-slate-700">Variáveis do ambiente</strong>
              <ul className="mt-2 space-y-1 font-mono">
                <li>
                  <span className="text-izii-green">baseUrl</span> — URL base da API (
                  <code>{baseUrl}</code>)
                </li>
                <li>
                  <span className="text-izii-green">bearerToken</span> — preenchido automaticamente
                  após o passo 3
                </li>
              </ul>
            </div>
          </Step>

          <Step
            number={3}
            icon={<Key className="h-4 w-4" />}
            title="Obtenha o token de autenticação"
          >
            <p className="mt-3 text-sm text-slate-600">
              Execute a requisição <strong>Gerar Token JWT</strong> dentro da pasta{" "}
              <em>Autenticação</em>. O script de teste da coleção salva o token automaticamente em{" "}
              <code className="font-mono">{"{{authorization_token}}"}</code>.
            </p>
            <div className="mt-4">
              <CodeBlock
                code={`curl -s -X POST ${baseUrl}api/orquestrador/gerar-jwt-para-acesso \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "seu-client-id",
    "clientSecret": "seu-client-secret",
    "tenantId": "seu-tenant-id"
  }' | jq -r '.token'`}
                language="bash"
                collapsible={false}
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              O token expira em 2 horas. O script de teste da requisição salva em{" "}
              <code className="font-mono">authorization_token</code> automaticamente.
            </p>
          </Step>

          <Step
            number={4}
            icon={<Play className="h-4 w-4" />}
            title="Execute os endpoints"
          >
            <p className="mt-3 text-sm text-slate-600">
              Com o ambiente configurado, todos os endpoints já usam{" "}
              <code className="font-mono">{"{{bearerToken}}"}</code> no header{" "}
              <code className="font-mono">Authorization: Bearer</code> automaticamente.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded bg-blue-100 text-center text-[10px] font-bold text-blue-700">I</span>
                <span><strong>Realizar Integração</strong> — use <code className="font-mono">movimento</code> para selecionar a operação: <code className="font-mono">I</code> Inclusão · <code className="font-mono">A</code> Alteração · <code className="font-mono">E</code> Exclusão · <code className="font-mono">T</code> Troca de Plano · <code className="font-mono">R</code> Reativação.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded bg-emerald-100 text-center text-[10px] font-bold text-emerald-700">C</span>
                <span><strong>Buscar Movimentações</strong> — <code className="font-mono">movimento: "C"</code>. Filtre por CPF, apólice ou data via objeto <code className="font-mono">consulta</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded bg-orange-100 text-center text-[10px] font-bold text-orange-700">↔</span>
                <span>O campo <code className="font-mono">cnpjProvedor</code> roteia para a operadora correta: <code className="font-mono">01685053000156</code> SulAmérica · <code className="font-mono">33055146000193</code> Bradesco.</span>
              </li>
            </ul>
          </Step>
        </div>
      </div>
    </div>
  );
}

function OpenApiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#6BA539" />
      <path d="M20 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8.5 4.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm17 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM9 20c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm22 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-13.5 7.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8.5 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="white" opacity="0.9" />
      <circle cx="20" cy="20" r="5" fill="white" opacity="0.95" />
      <circle cx="20" cy="20" r="3" fill="#6BA539" />
    </svg>
  );
}

function PostmanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#FF6C37" />
      <path d="M22.5 11.5c-4.7 0-8.5 3.8-8.5 8.5s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5-3.8-8.5-8.5-8.5zm0 15c-3.6 0-6.5-2.9-6.5-6.5s2.9-6.5 6.5-6.5 6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5z" fill="white" opacity="0.9" />
      <path d="M19.5 17l5 3-5 3V17z" fill="white" />
      <circle cx="13" cy="20" r="3.5" fill="white" opacity="0.6" />
    </svg>
  );
}

function DownloadCard({
  href,
  icon,
  title,
  description,
  badge
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <a
      href={href}
      download
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-izii-green/40 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 group-hover:bg-izii-lime/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-izii-charcoal">{title}</span>
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {badge}
          </span>
        </div>
        <p className="truncate font-mono text-[11px] text-slate-400">{description}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-izii-green" />
    </a>
  );
}

function Step({
  number,
  icon,
  title,
  children
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-izii-lime/15 text-izii-green">
        {icon}
      </div>
      <div className="absolute -left-px top-7 h-full w-px bg-slate-100" aria-hidden />
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-300">0{number}</span>
        <h2 className="text-base font-semibold text-izii-charcoal">{title}</h2>
      </div>
      {children}
    </div>
  );
}
