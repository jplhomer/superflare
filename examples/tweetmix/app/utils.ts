/**
 * Hash some text using Sha-256.
 * NOTE: This is bad; don't do this; use bcrypt instead.
 */
export async function unsafeHash(
  input: string,
  algorithm: AlgorithmIdentifier = "SHA-256"
) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a relative time string using the Intl.RelativeTimeFormat API.
 */
export function getRelativeTime(date: Date) {
  // If the date was in the last minute, use unsigned seconds as the format
  const diffInSeconds = Math.abs(
    Math.floor((new Date().getTime() - date.getTime()) / 1000)
  );
  if (diffInSeconds < 60) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInSeconds, "second");
  }

  // If the date was in the last hour, use minutes as the format
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInMinutes, "minute");
  }

  // If the date was in the last day, use hours as the format
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInHours, "hour");
  }

  // If the date was in the last week, use days as the format
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInDays, "day");
  }

  // If the date was in the last month, use weeks as the format
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInWeeks, "week");
  }

  // If the date was in the last year, use months as the format
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
      style: "short",
    }).format(-diffInMonths, "month");
  }

  // If the date was more than a year ago, use years as the format
  const diffInYears = Math.floor(diffInDays / 365);
  return new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "short",
  }).format(-diffInYears, "year");
}
