import { exists } from '@std/fs/exists';

export function createDirectory(
  _request : Request,
  path : string
) : Promise<Response> {
  return exists(path).then((exist) => {
    if (exist) {
      return new Response("Directory already exists", {status: 409});
    }
    return Deno.mkdir(path)
      .then(() => new Response('', {status: 200}));
  })
}
