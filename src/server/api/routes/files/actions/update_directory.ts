import { join } from '@std/path/join';
import { exists } from '@std/fs';
import { move } from "@std/fs";

export function updateDirectory(
  request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (!exist) {
      return new Response('File does not exist', {status: 409});
    }
    return request.bytes()
      .then((content) => {
        const newPath = join('./shared', new TextDecoder().decode(content));
        return Deno.mkdir(newPath, { recursive: true }).then(() => move(path, newPath, { overwrite: true }));
      })
      .then(() => new Response('', {status: 200}));
  })
}
