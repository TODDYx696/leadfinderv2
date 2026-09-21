import { useState } from "react";
import {
  MapPin,
  Phone,
  Star,
  Globe,
  GlobeLock,
  Plus,
  Check,
  Trash2,
  Copy,
  Flame,
  ExternalLink,
} from "lucide-react";
import type { Lead } from "@/lib/places.functions";
import { STATUSES, type LeadStatus } from "@/lib/leads-store";

export function isHot(lead: Lead) {
  return (
    !lead.hasSite &&
    lead.reviews >= 10 &&
    lead.reviews <= 300 &&
    (lead.rating ?? 0) >= 3.8
  );
}

function leadToText(lead: Lead) {
  return [
    lead.name,
    lead.address,
    lead.phone ? `Telefone: ${lead.phone}` : "Telefone: não informado",
    `Avaliação: ${lead.rating ? lead.rating.toFixed(1) : "—"} (${lead.reviews} avaliações)`,
    `Site oficial: ${lead.hasSite ? lead.website : "não possui"}`,
    `Maps: ${lead.mapsUrl}`,
  ].join("\n");
}

type Props = {
  lead: Lead;
  saved?: boolean;
  onSave?: (lead: Lead) => void;
  onRemove?: (id: string) => void;
  status?: LeadStatus;
  onStatus?: (id: string, status: LeadStatus) => void;
};

export function LeadCard({ lead, saved, onSave, onRemove, status, onStatus }: Props) {
  const [copied, setCopied] = useState(false);
  const hot = isHot(lead);

  async function copy() {
    try {
      await navigator.clipboard.writeText(leadToText(lead));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_0_oklch(1_0_0/6%)_inset]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold leading-tight text-card-foreground">
              {lead.name}
            </h3>
            <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{lead.address || "Endereço não informado"}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                lead.hasSite
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary"
              }`}
            >
              <span className="flex items-center gap-1">
                {lead.hasSite ? <Globe className="size-3" /> : <GlobeLock className="size-3" />}
                {lead.hasSite ? "com site" : "sem site"}
              </span>
            </span>
            {hot && (
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                <Flame className="size-3" /> quente
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[13px] text-secondary-foreground">
            <Star className="size-3.5 text-accent" />
            {lead.rating ? lead.rating.toFixed(1) : "—"}
            <span className="text-muted-foreground">· {lead.reviews}</span>
          </span>
          {lead.phone ? (
            <a
              href={`tel:${lead.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[13px] text-secondary-foreground"
            >
              <Phone className="size-3.5" />
              {lead.phone}
            </a>
          ) : (
            <span className="rounded-lg bg-secondary px-2.5 py-1.5 text-[13px] text-muted-foreground">
              sem telefone
            </span>
          )}
        </div>

        {lead.website && (
          <p className="mt-2 truncate text-[12px] text-muted-foreground">
            {lead.hasSite ? "Site: " : "Só rede social/delivery: "}
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="text-foreground/80 underline underline-offset-2"
            >
              {lead.website}
            </a>
          </p>
        )}

        {status && onStatus && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onStatus(lead.id, s)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-stretch border-t border-border">
        <a
          href={lead.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-4" /> Maps
        </a>
        <button
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        {onSave && (
          <button
            onClick={() => onSave(lead)}
            disabled={saved}
            className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-3 text-[13px] font-semibold text-primary disabled:text-muted-foreground"
          >
            {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
            {saved ? "Salvo" : "Salvar"}
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(lead.id)}
            className="flex items-center justify-center border-l border-border px-4 text-destructive"
            aria-label="Remover lead"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
