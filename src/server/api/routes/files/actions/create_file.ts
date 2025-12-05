import { exists } from '@std/fs';
import { dirname } from '@std/path';

export function createFile(
  request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (exist) {
      return new Response("File already exists", {status: 409});
    }
    return request.bytes()
      .then((content) => Deno.mkdir(dirname(path), { recursive: true })
        .then(() => Deno.writeFile(path, content)))
      .then(() => new Response('', {status: 200}));
  })
}
