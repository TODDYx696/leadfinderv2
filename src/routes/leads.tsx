import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { STATUSES, useSavedLeads, type LeadStatus } from "@/lib/leads-store";
import { LeadCard } from "@/components/LeadCard";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Meus Leads — LeadFinderV2" },
      {
        name: "description",
        content:
          "Leads salvos da prospecção, organizados por etapa: novo, contatado, interessado, proposta e cliente.",
      },
      { property: "og:title", content: "Meus Leads — LeadFinderV2" },
      {
        property: "og:description",
        content: "Acompanhe seus leads salvos por etapa de prospecção.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { leads, remove, setStatus } = useSavedLeads();
  const [filter, setFilter] = useState<LeadStatus | "Todos">("Todos");

  const visible = useMemo(
    () => leads.filter((l) => filter === "Todos" || l.status === filter),
    [leads, filter],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-6">
      <header className="flex items-center gap-3">
        <Link to="/" className="rounded-lg border border-border p-2" aria-label="Voltar">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Meus Leads</h1>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["Todos", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {s}
            {s !== "Todos" && (
              <span className="ml-1 opacity-70">
                {leads.filter((l) => l.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-3">
        {visible.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            status={lead.status}
            onStatus={setStatus}
            onRemove={remove}
          />
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Nenhum lead salvo aqui ainda.
          </p>
        )}
      </section>
    </main>
  );
}
