import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.INLINE_IMAGES_PORT ?? 5230);
const ROOT = process.env.INLINE_IMAGES_ROOT
  ?? 'H:/KeySolutionPublish/wwwroot/adventnet/ServiceDesk/inlineimages';

const contentTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.bmp', 'image/bmp'],
]);

const rootPath = path.resolve(ROOT);

function send(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
}

function resolveImagePath(url) {
  const requestUrl = new URL(url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (!pathname.startsWith('/inlineimages/')) {
    return null;
  }

  const relativePath = pathname.replace(/^\/inlineimages\//, '');
  const resolvedPath = path.resolve(rootPath, relativePath);

  if (!resolvedPath.startsWith(rootPath + path.sep)) {
    return null;
  }

  return resolvedPath;
}

const server = createServer(async (request, response) => {
  if (!request.url || request.method !== 'GET') {
    send(response, 405, 'Metodo nao permitido.');
    return;
  }

  const imagePath = resolveImagePath(request.url);

  if (!imagePath || !existsSync(imagePath)) {
    send(response, 404, 'Imagem nao encontrada.');
    return;
  }

  const imageStat = await stat(imagePath);

  if (!imageStat.isFile()) {
    send(response, 404, 'Imagem nao encontrada.');
    return;
  }

  const extension = path.extname(imagePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream',
    'Content-Length': imageStat.size,
    'Cache-Control': 'no-cache',
  });
  createReadStream(imagePath).pipe(response);
});

server.listen(PORT, () => {
  console.log(`Inline images em http://localhost:${PORT}/inlineimages`);
  console.log(`Origem: ${rootPath}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

