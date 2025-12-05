import { exists } from '@std/fs/exists';

export function updateFile(
  request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (!exist) {
      return new Response('File does not exist', {status: 409});
    }
    return request.bytes()
      .then((content) => Deno.writeFile(path, content))
      .then(() => new Response('', {status: 200}));
  })
}
