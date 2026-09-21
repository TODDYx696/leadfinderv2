import { useCallback, useEffect, useState } from "react";
import type { Lead } from "./places.functions";

export const STATUSES = [
  "Novo",
  "Contatado",
  "Interessado",
  "Proposta",
  "Cliente",
] as const;

export type LeadStatus = (typeof STATUSES)[number];

export type SavedLead = Lead & {
  status: LeadStatus;
  savedAt: number;
  note?: string;
};

const KEY = "leadfinderv2.leads";

function read(): SavedLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLead[]) : [];
  } catch {
    return [];
  }
}

function write(leads: SavedLead[]) {
  window.localStorage.setItem(KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("leadfinder:update"));
}

export function useSavedLeads() {
  const [leads, setLeads] = useState<SavedLead[]>([]);

  useEffect(() => {
    const sync = () => setLeads(read());
    sync();
    window.addEventListener("leadfinder:update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("leadfinder:update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((lead: Lead) => {
    const current = read();
    if (current.some((l) => l.id === lead.id)) return false;
    write([{ ...lead, status: "Novo", savedAt: Date.now() }, ...current]);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((l) => l.id !== id));
  }, []);

  const setStatus = useCallback((id: string, status: LeadStatus) => {
    write(read().map((l) => (l.id === id ? { ...l, status } : l)));
  }, []);

  return { leads, save, remove, setStatus };
}
