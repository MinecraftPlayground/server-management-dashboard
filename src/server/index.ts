import { serveDir } from '@std/http/file-server'
import { parseArgs } from '@std/cli/parse-args';

const args = parseArgs(Deno.args, {
  default: {
    port: 8000
  }
});

const rootDirectory = './dist/';

Deno.serve(
  {port: parseInt(args.port)},
  (request) => serveDir(request, {
    fsRoot: rootDirectory
  })
);
