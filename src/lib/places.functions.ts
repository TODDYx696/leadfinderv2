import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const NON_SITE_DOMAINS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "ifood.com",
  "linktr.ee",
  "wa.me",
  "api.whatsapp.com",
  "whatsapp.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "google.com",
  "goo.gl",
  "anota.ai",
  "delivery.much.com.br",
  "abrahao.com.br",
  "menudino.com",
  "goomer.app",
  "sitedopedido.com",
];

export type Lead = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviews: number;
  mapsUrl: string;
  website: string | null;
  hasSite: boolean;
};

function normalizeWebsite(uri: string | undefined): {
  website: string | null;
  hasSite: boolean;
} {
  if (!uri) return { website: null, hasSite: false };
  let host = "";
  try {
    host = new URL(uri).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return { website: uri, hasSite: true };
  }
  const isSocial = NON_SITE_DOMAINS.some(
    (d) => host === d || host.endsWith(`.${d}`),
  );
  return { website: uri, hasSite: !isSocial };
}

function buildVariants(query: string): string[] {
  const q = query.trim();
  const suffixes = [
    "",
    "delivery",
    "melhores avaliados",
    "perto do centro",
    "bairros",
    "pequenos negócios",
    "aberto agora",
    "artesanal",
  ];
  return suffixes.map((s) => (s ? `${q} ${s}` : q));
}

const FIELD_MASK = [

  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.websiteUri",
  "nextPageToken",
].join(",");

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().trim().min(3).max(120),
        pages: z.number().int().min(1).max(3).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ leads: Lead[] }> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) {
      throw new Error("Conexão com o Google Maps indisponível.");
    }

    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mapsKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": FIELD_MASK,
    };

    const maxPages = data.pages ?? 3;
    const variants = buildVariants(data.query);
    const byId = new Map<string, Lead>();

    const fetchVariant = async (textQuery: string) => {
      let pageToken: string | undefined;
      for (let i = 0; i < maxPages; i++) {
        const body: Record<string, unknown> = {
          textQuery,
          languageCode: "pt-BR",
          regionCode: "BR",
          pageSize: 20,
        };
        if (pageToken) body["pageToken"] = pageToken;

        const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`Places searchText failed [${res.status}]: ${text}`);
          if (res.status === 403) {
            throw new Error(
              "O Google recusou a busca (403). Verifique as restrições da chave no Google Cloud Console.",
            );
          }
          throw new Error(`Falha na busca [${res.status}]: ${text}`);
        }

        const json = (await res.json()) as {
          places?: Array<Record<string, any>>;
          nextPageToken?: string;
        };

        for (const p of json.places ?? []) {
          const id = String(p["id"]);
          if (byId.has(id)) continue;
          const { website, hasSite } = normalizeWebsite(p["websiteUri"]);
          byId.set(id, {
            id,
            name: p["displayName"]?.text ?? "Sem nome",
            address: p["formattedAddress"] ?? "",
            phone:
              p["nationalPhoneNumber"] ?? p["internationalPhoneNumber"] ?? null,
            rating: typeof p["rating"] === "number" ? p["rating"] : null,
            reviews:
              typeof p["userRatingCount"] === "number" ? p["userRatingCount"] : 0,
            mapsUrl:
              p["googleMapsUri"] ??
              `https://www.google.com/maps/place/?q=place_id:${id}`,
            website,
            hasSite,
          });
        }

        pageToken = json.nextPageToken;
        if (!pageToken) break;
      }
    };

    // Sequential in small batches to stay within gateway limits.
    for (let i = 0; i < variants.length; i += 3) {
      await Promise.all(variants.slice(i, i + 3).map(fetchVariant));
    }

    const leads = [...byId.values()].sort((a, b) => b.reviews - a.reviews);
    return { leads };
  });

