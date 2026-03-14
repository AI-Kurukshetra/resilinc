export const DEFAULT_AUTHENTICATED_REDIRECT = "/overview";
export const DEFAULT_UNAUTHENTICATED_REDIRECT = "/login";

export function sanitizeNextPath(nextPath: string | undefined, fallback: string): string {
  if (!nextPath) {
    return fallback;
  }

  const value = nextPath.trim();

  if (!value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//") || value.startsWith("/api")) {
    return fallback;
  }

  return value;
}
