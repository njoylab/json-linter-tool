const HOMEPAGE_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</index.md>; rel="alternate"; type="text/markdown"'
];

const JQ_PLAYGROUND_LINKS = [
  '</jq-playground/index.md>; rel="alternate"; type="text/markdown"'
];

function acceptsMarkdown(request) {
  const accept = request.headers.get('Accept') || '';
  return /\btext\/markdown\b/i.test(accept);
}

function getMarkdownAssetPath(pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    return '/index.md';
  }

  if (pathname === '/jq-playground/' || pathname === '/jq-playground/index.html') {
    return '/jq-playground/index.md';
  }

  return null;
}

function estimateMarkdownTokens(markdown) {
  return String(Math.max(1, Math.ceil(markdown.length / 4)));
}

function addVary(headers, value) {
  const current = headers.get('Vary');
  if (!current) {
    headers.set('Vary', value);
    return;
  }

  const values = current.split(',').map((item) => item.trim().toLowerCase());
  if (!values.includes(value.toLowerCase())) {
    headers.set('Vary', `${current}, ${value}`);
  }
}

function addDiscoveryHeaders(headers, pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    for (const link of HOMEPAGE_LINKS) {
      headers.append('Link', link);
    }
    addVary(headers, 'Accept');
    return;
  }

  if (pathname === '/jq-playground/' || pathname === '/jq-playground/index.html') {
    for (const link of JQ_PLAYGROUND_LINKS) {
      headers.append('Link', link);
    }
    addVary(headers, 'Accept');
  }
}

function addCorsIfWellKnown(headers, pathname) {
  if (pathname.startsWith('/.well-known/')) {
    headers.set('Access-Control-Allow-Origin', '*');
  }
}

async function withDecoratedAssetResponse(response, pathname) {
  const headers = new Headers(response.headers);
  addDiscoveryHeaders(headers, pathname);
  addCorsIfWellKnown(headers, pathname);

  if (pathname === '/.well-known/api-catalog') {
    headers.set('Content-Type', 'application/linkset+json; charset=utf-8');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function markdownResponse(env, request, pathname) {
  const markdownPath = getMarkdownAssetPath(pathname);
  if (!markdownPath) {
    return null;
  }

  const assetRequest = new Request(new URL(`https://assets.local${markdownPath}`), request);
  const assetResponse = await env.ASSETS.fetch(assetRequest);
  if (!assetResponse.ok) {
    return null;
  }

  const markdown = await assetResponse.text();
  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('x-markdown-tokens', estimateMarkdownTokens(markdown));
  addDiscoveryHeaders(headers, pathname);
  addCorsIfWellKnown(headers, pathname);

  return new Response(markdown, {
    status: 200,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (acceptsMarkdown(request)) {
        const markdown = await markdownResponse(env, request, url.pathname);
        if (markdown) {
          return markdown;
        }
      }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withDecoratedAssetResponse(assetResponse, url.pathname);
  }
};
