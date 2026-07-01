type RuntimeConfig = {
  apiBaseUrl: string;
  basePath: string;
};

declare global {
  interface Window {
    __EPS_CONFIG__?: Partial<RuntimeConfig>;
  }
}

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === ".") {
    return "/";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

const basePath = normalizeBasePath(
  window.__EPS_CONFIG__?.basePath ?? import.meta.env.VITE_BASE_PATH,
);
const basePathWithoutTrailingSlash =
  basePath === "/" ? "" : basePath.replace(/\/$/, "");

export const runtimeConfig: RuntimeConfig = {
  basePath,
  apiBaseUrl:
    window.__EPS_CONFIG__?.apiBaseUrl ||
    import.meta.env.VITE_API_BASE_URL ||
    `${basePathWithoutTrailingSlash}/api`,
};

export const routerBasename =
  basePath === "/" ? "/" : basePath.replace(/\/$/, "");

export function assetUrl(path: string): string {
  return `${basePath}${path.replace(/^\//, "")}`;
}
