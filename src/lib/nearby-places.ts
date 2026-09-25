export type NearbyPlaceCategory = "food" | "sights" | "activities" | "practical";

const FILTERS: Record<NearbyPlaceCategory, string> = {
  food: `["amenity"~"^(restaurant|cafe|fast_food)$"]`,
  sights: `["tourism"~"^(attraction|museum|viewpoint|gallery)$"]`,
  activities: `["leisure"~"^(sports_centre|water_park|theme_park|swimming_pool|park)$"]`,
  practical: `["amenity"~"^(pharmacy|hospital|clinic|supermarket|fuel|atm)$"]`,
};

export function isNearbyPlaceCategory(value: string): value is NearbyPlaceCategory {
  return value in FILTERS;
}

export function nearbyPlacesQuery(category: NearbyPlaceCategory, lat:number, lon:number, radius=5_000) {
  return `[out:json][timeout:18];nwr${FILTERS[category]}(around:${radius},${lat},${lon});out center tags 40;`;
}
