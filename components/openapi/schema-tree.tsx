import type { SchemaField } from "@/lib/openapi/resolve-schema";
import { cn } from "@/lib/utils";

export function SchemaTree({ field, depth = 0 }: { field: SchemaField; depth?: number }) {
  const typeLabel = field.name ? field.type : undefined;

  return (
    <div className={cn(depth > 0 && "ml-4 border-l border-slate-200 pl-3")}>
      <div className="flex flex-wrap items-baseline gap-2 py-1.5">
        {field.name ? <span className="font-mono text-sm text-izii-green">{field.name}</span> : null}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-500">
          {typeLabel ?? field.type}
        </span>
        {field.format ? <span className="text-[10px] text-slate-400">{field.format}</span> : null}
        {field.required ? (
          <span className="text-[10px] font-medium uppercase text-rose-400">required</span>
        ) : null}
        {field.refs?.length ? (
          <span className="truncate font-mono text-[10px] text-slate-400">{field.refs[0]}</span>
        ) : null}
      </div>
      {field.description ? <p className="pb-1 text-xs text-slate-500">{field.description}</p> : null}
      {field.enumValues?.length ? (
        <p className="pb-2 font-mono text-[10px] text-slate-400">enum: {field.enumValues.map(String).join(" | ")}</p>
      ) : null}
      {field.items ? (
        <div className="pb-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">items</p>
          <SchemaTree field={field.items} depth={depth + 1} />
        </div>
      ) : null}
      {field.properties?.map((prop) => (
        <SchemaTree key={`${depth}-${prop.name ?? prop.type}`} field={prop} depth={depth + 1} />
      ))}
    </div>
  );
}
