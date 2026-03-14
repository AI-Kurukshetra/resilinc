const DEFAULT_RATE_LIMIT_WAIT_SECONDS = 60;

interface AuthErrorLike {
  message: string;
  status?: number;
  code?: string;
}

export interface NormalizedAuthError {
  code: string;
  message: string;
  status: number;
  retryAfterSeconds?: number;
}

export function normalizeAuthError(
  error: AuthErrorLike,
  fallbackCode: string,
  fallbackMessage: string,
): NormalizedAuthError {
  const message = error.message || fallbackMessage;
  const status = typeof error.status === "number" && error.status >= 400 ? error.status : 400;
  const normalizedCode = (error.code || "").toLowerCase();
  const normalizedMessage = message.toLowerCase();

  const isRateLimited =
    status === 429 ||
    normalizedCode.includes("rate_limit") ||
    normalizedMessage.includes("rate limit");

  if (isRateLimited) {
    const retryAfterSeconds = parseRetryAfterSeconds(message) ?? DEFAULT_RATE_LIMIT_WAIT_SECONDS;
    return {
      code: "AUTH_RATE_LIMITED",
      message: `Too many email requests. Please wait about ${formatWaitLabel(
        retryAfterSeconds,
      )} and try again.`,
      status: 429,
      retryAfterSeconds,
    };
  }

  return {
    code: fallbackCode,
    message,
    status,
  };
}

function parseRetryAfterSeconds(message: string): number | null {
  const minuteMatch = message.match(/(\d+)\s*minute/i);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10) * 60;
  }

  const secondMatch = message.match(/(\d+)\s*second/i);
  if (secondMatch) {
    return Number.parseInt(secondMatch[1], 10);
  }

  return null;
}

function formatWaitLabel(seconds: number): string {
  if (seconds % 60 === 0 && seconds >= 60) {
    const minutes = seconds / 60;
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}
