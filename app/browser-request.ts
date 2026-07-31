const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);

function applicationBasePath() {
  if (typeof document === "undefined") return "";

  const script = document.querySelector<HTMLScriptElement>('script[src*="/_next/"]');
  if (script?.src) {
    const pathname = new URL(script.src, window.location.href).pathname;
    const marker = pathname.indexOf("/_next/");
    if (marker >= 0) return pathname.slice(0, marker);
  }

  return window.location.pathname === "/"
    ? ""
    : window.location.pathname.replace(/\/$/, "");
}

function routedInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//")) {
    return input;
  }
  return `${applicationBasePath()}${input}`;
}

async function sha256Hex(body: BodyInit) {
  let bytes: ArrayBuffer;
  if (typeof body === "string") {
    bytes = new TextEncoder().encode(body).buffer;
  } else if (body instanceof URLSearchParams) {
    bytes = new TextEncoder().encode(body.toString()).buffer;
  } else if (body instanceof Blob) {
    bytes = await body.arrayBuffer();
  } else if (body instanceof ArrayBuffer) {
    bytes = body;
  } else if (ArrayBuffer.isView(body)) {
    bytes = new Uint8Array(body.buffer, body.byteOffset, body.byteLength).slice().buffer;
  } else {
    throw new Error("Unsupported browser request body for signed write request");
  }

  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function browserRequest(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const headers = new Headers(init.headers);

  if (WRITE_METHODS.has(method)) {
    if (init.body == null) {
      headers.set("x-amz-content-sha256", await sha256Hex(""));
    } else {
      headers.set("x-amz-content-sha256", await sha256Hex(init.body));
    }
  }

  return fetch(routedInput(input), { ...init, headers });
}
