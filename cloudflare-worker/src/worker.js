/**
 * Carecay Media Upload Worker
 * Handles file uploads to Cloudflare R2 and serves them back.
 * 
 * Routes:
 *   POST   /upload       — Upload a file (multipart/form-data, field: "file")
 *   GET    /file/:key    — Download/serve a file
 *   DELETE /file/:key    — Delete a file
 *   GET    /list         — List all files (optional ?prefix=)
 */

const CORS_HEADERS = (origin, env) => {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Key',
    'Access-Control-Max-Age': '86400',
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = CORS_HEADERS(origin, env);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Simple API key check (set via `wrangler secret put UPLOAD_KEY`)
    if (request.method === 'POST' || request.method === 'DELETE') {
      const apiKey = request.headers.get('X-Upload-Key') || '';
      if (env.UPLOAD_KEY && apiKey !== env.UPLOAD_KEY) {
        return json({ error: 'Unauthorized' }, 401, cors);
      }
    }

    try {
      // POST /upload
      if (request.method === 'POST' && url.pathname === '/upload') {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) return json({ error: 'No file provided' }, 400, cors);

        // Generate unique key: valuation/<timestamp>_<filename>
        const folder = formData.get('folder') || 'valuation';
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${folder}/${timestamp}_${safeName}`;

        // Upload to R2
        const arrayBuf = await file.arrayBuffer();
        await env.MEDIA_BUCKET.put(key, arrayBuf, {
          httpMetadata: { contentType: file.type },
          customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
        });

        // Build public URL
        const publicUrl = `${url.origin}/file/${key}`;

        return json({
          success: true,
          key,
          url: publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        }, 200, cors);
      }

      // GET /file/:key (serve file)
      if (request.method === 'GET' && url.pathname.startsWith('/file/')) {
        const key = url.pathname.replace('/file/', '');
        const object = await env.MEDIA_BUCKET.get(key);
        if (!object) return json({ error: 'File not found' }, 404, cors);

        const headers = new Headers(cors);
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Content-Disposition', `inline; filename="${key.split('/').pop()}"`);

        return new Response(object.body, { headers });
      }

      // DELETE /file/:key
      if (request.method === 'DELETE' && url.pathname.startsWith('/file/')) {
        const key = url.pathname.replace('/file/', '');
        await env.MEDIA_BUCKET.delete(key);
        return json({ success: true, deleted: key }, 200, cors);
      }

      // GET /list
      if (request.method === 'GET' && url.pathname === '/list') {
        const prefix = url.searchParams.get('prefix') || '';
        const listed = await env.MEDIA_BUCKET.list({ prefix, limit: 100 });
        const files = listed.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          url: `${url.origin}/file/${obj.key}`,
        }));
        return json({ files }, 200, cors);
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (e) {
      return json({ error: e.message }, 500, cors);
    }
  },
};

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}
