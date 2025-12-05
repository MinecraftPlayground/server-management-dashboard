import { emptyDir, exists } from '@std/fs';
import { join } from '@std/path';

export function deleteDirectory(
  _request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (!exist) {
      return new Response('File does not exist', { status: 404 });
    }

    if (path === join('shared/')) {
      return emptyDir(path).then(() => new Response('', { status: 200 }));
    }

    return Deno.remove(path, { recursive: true }).then(() => new Response('', { status: 200 }));
  });
}
