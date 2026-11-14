export function requestOrigin(req: Request): string {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (host) return `${forwardedProto ?? "https"}://${host}`;
  return new URL(req.url).origin;
}
