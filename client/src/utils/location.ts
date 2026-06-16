/**
 * Utility functions for location data handling
 */

/**
 * Convert any location shape to a plain string for display
 * Handles both string locations and location objects with area/lat/lng
 */
export function getLocationString(location: any): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object" && "area" in location) {
    return location.area;
  }
  return String(location);
}
