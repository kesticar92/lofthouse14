import listingsJson from "@/app/scrapper/reviews/airbnb_listings.json";

export type AirbnbListingMeta = {
  id: string;
  url: string;
  loftCode: string;
  label: string;
};

export const airbnbListings = listingsJson as AirbnbListingMeta[];

const byId = new Map(airbnbListings.map((l) => [l.id, l]));

export function airbnbListingById(id: string): AirbnbListingMeta | undefined {
  return byId.get(id);
}

export function airbnbListingUrl(id: string): string {
  return byId.get(id)?.url ?? `https://www.airbnb.com.co/rooms/${id}`;
}

/** Lofts 01–14 sin 04 (bodega/oficina). */
export const loftFilterOptions = [
  { value: "all", label: "Todos los lofts" },
  ...airbnbListings.map((l) => ({
    value: l.loftCode,
    label: l.label,
  })),
];
