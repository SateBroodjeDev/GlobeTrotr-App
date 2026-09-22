import type { TravelItem, TravelOption } from "./types";

export const MAX_COMPARE_OPTIONS = 4;

export function safeOptionUrl(value?: string) {
  if (!value?.trim()) return undefined;
  if (value.trim().length > 2048) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeTravelOption(option: TravelOption): TravelOption {
  const amount = Number(option.amount);
  const duration = Number(option.durationMinutes);
  const distance = Number(option.distanceKm);
  return {
    ...option,
    title: option.title.trim().slice(0, 160),
    provider: option.provider?.trim().slice(0, 120) || undefined,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : undefined,
    currency: /^[A-Z]{3}$/.test(option.currency ?? "") ? option.currency : undefined,
    durationMinutes: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : undefined,
    distanceKm: Number.isFinite(distance) && distance >= 0 ? distance : undefined,
    cancellation: option.cancellation?.trim().slice(0, 500) || undefined,
    notes: option.notes?.trim().slice(0, 2000) || undefined,
    sourceUrl: safeOptionUrl(option.sourceUrl),
  };
}

export function convertOptionToBooking(
  options: TravelOption[],
  travelItems: TravelItem[],
  optionId: string,
  createId: () => string,
) {
  const option = options.find((item) => item.id === optionId);
  if (!option) return { options, travelItems, changed: false };
  if (option.convertedTravelItemId) {
    return { options, travelItems, changed: false };
  }
  const travelItemId = createId();
  const travelItem: TravelItem = {
    id: travelItemId,
    type: option.type,
    title: option.title,
    date: option.startDate,
    endDate: option.endDate,
    provider: option.provider,
    amount: option.amount,
    currency: option.currency,
    notes: [option.cancellation, option.notes].filter(Boolean).join("\n") || undefined,
  };
  return {
    options: options.map((item) =>
      item.id === optionId
        ? { ...item, status: "selected" as const, convertedTravelItemId: travelItemId }
        : item,
    ),
    travelItems: [...travelItems, travelItem],
    changed: true,
  };
}
