export type SponsorshipType = "shirt_front" | "sleeve" | "stadium" | "official_partner";

export type SponsorProfile = {
  id: string;
  brand_name: string;
  category: string;
  sponsorship_type: SponsorshipType;
  team_ids: number[];
  rival_brands: string[];
  rival_categories: string[];
  is_example: boolean;
  notes: string | null;
};

export const SPONSORSHIP_TYPE_LABEL: Record<SponsorshipType, string> = {
  shirt_front: "Shirt front",
  sleeve: "Sleeve",
  stadium: "Stadium",
  official_partner: "Official partner",
};
