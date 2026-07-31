const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);

function applicationBasePath() {
  if (typeof window === "undefined") return "";

  // Harbour serves deployed applications below /p/{route-key}. Derive that
  // prefix from the document URL instead of relying on a framework asset path
  // or exposing the server-only HARBOUR_BASE_PATH variable to browser code.
  const match = window.location.pathname.match(/^\/p\/[^/]+(?=\/|$)/);
  return match?.[0] ?? "";
}

function routedUrl(url: URL) {
  const basePath = applicationBasePath();
  if (
    !basePath ||
    url.origin !== window.location.origin ||
    url.pathname === basePath ||
    url.pathname.startsWith(`${basePath}/`)
  ) {
    return url;
  }

  url.pathname = `${basePath}${url.pathname}`;
  return url;
}

function routedInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string") {
    if (!input.startsWith("/") || input.startsWith("//")) return input;
    return routedUrl(new URL(input, window.location.origin));
  }

  if (input instanceof URL) {
    return routedUrl(new URL(input.href));
  }

  const url = routedUrl(new URL(input.url));
  return url.href === input.url ? input : new Request(url, input);
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function browserRequest(input: RequestInfo | URL, init: RequestInit = {}) {
  const routed = routedInput(input);
  const requestInput =
    typeof routed === "string" && routed.startsWith("/")
      ? new URL(routed, window.location.origin)
      : routed;
  const request = new Request(requestInput, init);

  if (!WRITE_METHODS.has(request.method.toUpperCase())) {
    return fetch(request);
  }

  // Materialize the browser-generated representation (including FormData and
  // Request bodies), hash those exact bytes, and leave the original body intact.
  const body = await request.clone().arrayBuffer();
  const headers = new Headers(request.headers);
  headers.set("x-amz-content-sha256", await sha256Hex(body));

  return fetch(new Request(request, { headers }));
}
