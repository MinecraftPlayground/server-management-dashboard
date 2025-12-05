import { exists } from '@std/fs';

export function deleteFile(
  _request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (!exist) {
      return new Response('File does not exist', { status: 404 });
    }

    return Deno.remove(path, { recursive: true }).then(() => new Response('', { status: 200 }));
  });
}
