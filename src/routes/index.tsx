import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, Loader2, Bookmark, Flame, Radar, Target, Star, MousePointerClick } from "lucide-react";
import { searchLeads, type Lead } from "@/lib/places.functions";
import { useSavedLeads } from "@/lib/leads-store";
import { LeadCard, isHot } from "@/components/LeadCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadFinderV2 — Prospecção de empresas sem site" },
      {
        name: "description",
        content:
          "Busque estabelecimentos por região e nicho e descubra rapidamente quais negócios ainda não têm site oficial.",
      },
      { property: "og:title", content: "LeadFinderV2 — Prospecção de empresas sem site" },
      {
        property: "og:description",
        content:
          "Painel privado para encontrar estabelecimentos sem site oficial por região e nicho.",
      },
    ],
  }),
  component: Index,
});

type Filter = "sem-site" | "quentes" | "todos";

function Index() {
  const run = useServerFn(searchLeads);
  const { leads: saved, save } = useSavedLeads();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<Filter>("sem-site");
  const [minReviews, setMinReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedIds = useMemo(() => new Set(saved.map((l) => l.id)), [saved]);
  const all = results ?? [];
  const noSite = useMemo(() => all.filter((l) => !l.hasSite), [all]);
  const hot = useMemo(() => all.filter(isHot), [all]);
  const base = filter === "todos" ? all : filter === "quentes" ? hot : noSite;
  const visible = useMemo(
    () => (minReviews === 0 ? base : base.filter((l) => l.reviews >= minReviews)),
    [base, minReviews],
  );

  const reviewFilters = [0, 10, 20, 40, 80, 150];

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { query: query.trim() } });
      setResults(res.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível buscar agora.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Filter; label: string; count: number; icon?: boolean }[] = [
    { key: "sem-site", label: "Sem site", count: noSite.length },
    { key: "quentes", label: "Leads quentes", count: hot.length, icon: true },
    { key: "todos", label: "Todos", count: all.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Radar className="size-5" />
            </span>
            <div>
              <h1 className="text-[17px] font-bold leading-none tracking-tight">
                LeadFinder<span className="text-primary">V2</span>
              </h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Empresas sem site oficial
              </p>
            </div>
          </div>
          <Link
            to="/leads"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-medium"
          >
            <Bookmark className="size-4" />
            {saved.length}
          </Link>
        </header>

        <form onSubmit={onSearch} className="mt-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: hamburguerias em Santos"
                className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-[15px] outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "Buscando" : "Buscar"}
            </button>
          </div>
        </form>

        {loading && (
          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Varrendo a região inteira, isso leva alguns segundos…
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {results && !error && (
          <>
            <div className="mt-5 flex gap-1.5 rounded-2xl border border-border bg-card p-1.5">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[12px] font-semibold transition-colors ${
                    filter === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.icon && <Flame className="size-3.5" />}
                  {t.label}
                  <span className="opacity-70">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="flex shrink-0 items-center gap-1 pr-1 text-[11px] text-muted-foreground">
                <Star className="size-3" /> avaliações:
              </span>
              {reviewFilters.map((n) => (
                <button
                  key={n}
                  onClick={() => setMinReviews(n)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    minReviews === n
                      ? "bg-secondary text-foreground"
                      : "bg-card text-muted-foreground"
                  }`}
                >
                  {n === 0 ? "Todas" : `${n}+`}
                </button>
              ))}
            </div>

            <section className="mt-3 space-y-3">
              {visible.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  saved={savedIds.has(lead.id)}
                  onSave={save}
                />
              ))}
              {visible.length === 0 && (
                <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Nenhum estabelecimento nesse filtro.
                </p>
              )}
            </section>
          </>
        )}

        {!results && !loading && !error && (
          <div className="mt-10 space-y-3">
            <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
              Digite o nicho + a cidade ou bairro.
              <br />O sistema varre a região e separa quem ainda não tem site.
            </p>
            <div className="grid gap-2">
              {[
                {
                  icon: Target,
                  title: "Busque nicho + região",
                  desc: "Ex.: pizzarias no Gonzaga, salões em Osasco",
                },
                {
                  icon: Flame,
                  title: "Priorize os leads quentes",
                  desc: "Sem site, com algumas avaliações e boa nota — prontos pra vender um site",
                },
                {
                  icon: MousePointerClick,
                  title: "Copie ou salve com 1 toque",
                  desc: "Copie os dados pra colar no WhatsApp ou salve em Meus Leads",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <f.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-card-foreground">{f.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
