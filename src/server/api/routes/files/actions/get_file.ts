import { serveFile } from '@std/http/file-server';

export function getFile(
  request : Request,
  path : string
) : Promise<Response> {
  return serveFile(request, path);
}

