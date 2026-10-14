import type { Nutriments } from "../types";

/**
 * Photo → calories (STUBBED).
 *
 * The real implementation will send the image to a vision model (e.g. Claude
 * vision), which returns identified foods with estimated portions, each then
 * resolved against the nutrition DB. Portion size from a 2D photo is an
 * estimate, so results are a fast first draft the user should correct.
 *
 * This stub keeps the interface stable so the UI and data flow are built now;
 * flip `photoAiEnabled` in Settings to reveal the feature, then drop in a real
 * `estimateFromPhoto` backed by an API.
 */

export interface PhotoFoodGuess {
  name: string;
  grams: number;
  nutriments: Nutriments;
  confidence: number; // 0–1
}

export interface PhotoEstimateResult {
  items: PhotoFoodGuess[];
  note: string;
}

export const PHOTO_STUB_NOTE =
  "Photo estimation isn't wired up yet. This is a placeholder — connect a " +
  "vision model in a later step to turn a plate photo into logged items.";

/** Placeholder: returns nothing but a note. Replace with a real API call. */
export async function estimateFromPhoto(
  _image: Blob,
): Promise<PhotoEstimateResult> {
  return { items: [], note: PHOTO_STUB_NOTE };
}

export const PHOTO_FEATURE_READY = false;
