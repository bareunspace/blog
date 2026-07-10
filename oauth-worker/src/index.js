function badRequest(message) {
  return new Response(JSON.stringify({ error: "invalid_request", error_description: message }), {
    status: 400,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createCodeVerifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

function getOrigin(env) {
  return (env.ORIGIN || "").trim().replace(/\/$/, "");
}

function getPublicBaseUrl(request, env) {
  const configured = (env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

function githubAuthorizeUrl({ clientId, redirectUri, state, codeChallenge }) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

async function exchangeCodeForToken({ code, verifier, clientId, clientSecret, redirectUri }) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    const desc = payload.error_description || payload.error || "GitHub token exchange failed";
    throw new Error(desc);
  }

  return payload.access_token;
}

function htmlPage(content) {
  return new Response(content, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function callbackScript({ token, state, origin }) {
  const safeOrigin = JSON.stringify(origin);
  const safeToken = JSON.stringify(token);
  const safeState = JSON.stringify(state);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Decap OAuth Callback</title>
  </head>
  <body>
    <script>
      (function () {
        var targetOrigin = ${safeOrigin};
        var data = "authorization:github:success:" + ${safeToken};
        if (window.opener) {
          window.opener.postMessage("authorization:github:success:" + ${safeToken} + ":" + ${safeState}, targetOrigin);
          window.close();
        } else {
          document.body.textContent = "Login complete. You can close this window.";
        }
      })();
    </script>
  </body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const allowedOrigin = getOrigin(env);
    const clientId = (env.OAUTH_CLIENT_ID || "").trim();
    const clientSecret = (env.OAUTH_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret || !allowedOrigin) {
      return badRequest("Missing required OAuth environment variables.");
    }

    if (path === "/auth") {
      const state = url.searchParams.get("state") || randomState();
      const verifier = createCodeVerifier();
      const challenge = await createCodeChallenge(verifier);
      const redirectUri = `${getPublicBaseUrl(request, env)}/callback`;

      const authUrl = githubAuthorizeUrl({
        clientId,
        redirectUri,
        state,
        codeChallenge: challenge
      });

      const cookieValue = encodeURIComponent(JSON.stringify({ state, verifier }));
      return new Response(null, {
        status: 302,
        headers: {
          location: authUrl.toString(),
          "set-cookie": `decap_oauth=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
          "cache-control": "no-store"
        }
      });
    }

    if (path === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return badRequest("Missing code or state in callback.");
      }

      const cookie = request.headers.get("cookie") || "";
      const oauthCookie = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("decap_oauth="));

      if (!oauthCookie) {
        return badRequest("Missing OAuth state cookie.");
      }

      let stored;
      try {
        const raw = decodeURIComponent(oauthCookie.slice("decap_oauth=".length));
        stored = JSON.parse(raw);
      } catch {
        return badRequest("Invalid OAuth state cookie.");
      }

      if (stored.state !== state || !stored.verifier) {
        return badRequest("OAuth state mismatch.");
      }

      const redirectUri = `${getPublicBaseUrl(request, env)}/callback`;

      try {
        const token = await exchangeCodeForToken({
          code,
          verifier: stored.verifier,
          clientId,
          clientSecret,
          redirectUri
        });

        const clearCookie = "decap_oauth=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
        const response = htmlPage(callbackScript({ token, state, origin: allowedOrigin }));
        response.headers.set("set-cookie", clearCookie);
        return response;
      } catch (error) {
        return badRequest(error.message || "OAuth callback failed.");
      }
    }

    if (path === "/health") {
      return new Response("ok", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
