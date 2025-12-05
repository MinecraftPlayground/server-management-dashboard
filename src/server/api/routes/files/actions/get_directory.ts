import { exists } from '@std/fs/exists';

export function getDirectory(
  _request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (!exist) {
      return new Response("[]", { status: 404 });
    }

    return new Response(JSON.stringify(Array.from(Deno.readDirSync(path))));
  });
}
