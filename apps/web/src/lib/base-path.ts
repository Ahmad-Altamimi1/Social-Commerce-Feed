export function getBasePath(): string {
  const value = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!value || value === "/") return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function withBasePath(path: string): string {
  const basePath = getBasePath();
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
