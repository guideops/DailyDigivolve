// ─── Cloudflare Pages Function — /api/chat ────────────────────────────────────
// This runs server-side on Cloudflare's edge. The Claude API key lives here,
// in a Cloudflare environment variable called CLAUDE_API_KEY.
// The browser NEVER sees the key — it only calls /api/chat.
//
// How to set the key:
//   Cloudflare Dashboard → Pages → digitask → Settings → Environment Variables
//   Add: CLAUDE_API_KEY = sk-ant-...
//
// Local dev: create a .dev.vars file (gitignored) with:
//   CLAUDE_API_KEY=sk-ant-...

export async function onRequestPost(context) {
  // ── CORS headers (allow your own domain in production) ────────────────────
  var headers = {
    "Content-Type":                "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    var body = await context.request.json();
    var { systemPrompt, messages } = body;

    if (!systemPrompt || !messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status:400, headers });
    }

    if (!context.env.CLAUDE_API_KEY) {
      return new Response(JSON.stringify({ error: "CLAUDE_API_KEY not configured" }), { status:500, headers });
    }

    // ── Call Claude API ───────────────────────────────────────────────────
    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         context.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",  // Cheapest, fast enough for chat
        max_tokens: 300,
        system:     systemPrompt,
        messages:   messages,
      }),
    });

    if (!response.ok) {
      var errText = await response.text();
      return new Response(JSON.stringify({ error: "Claude API error: " + errText }), { status:502, headers });
    }

    var data  = await response.json();
    var reply = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text
      : "...";

    return new Response(JSON.stringify({ reply }), { status:200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Server error" }), { status:500, headers });
  }
}

// Handle preflight CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
