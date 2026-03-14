const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

export function isAuthBypassEnabled(): boolean {
  const rawValue = process.env.AUTH_BYPASS_ENABLED;

  if (!rawValue) {
    return false;
  }

  return TRUTHY_VALUES.has(rawValue.toLowerCase());
}
