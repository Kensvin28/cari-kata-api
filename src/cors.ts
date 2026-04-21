export const resolveOrigin = (origin: string): string | null => {
  if (!origin) return "*";
  if (origin.includes("http://localhost:5173")) return origin;
  const { hostname } = new URL(origin);
  if (hostname.endsWith("kensvin28.workers.dev")) return origin;

  return null;
};
