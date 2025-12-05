import { route, type Route } from "@std/http/unstable-route";
import { route as filesRoute } from "./routes/files/route.ts";

const routes: Route[] = [
  ...filesRoute()
];

function defaultHandler(_req: Request) : Response {
  return new Response('Invalid request', {status: 404});
}


Deno.serve(route(routes, defaultHandler));
