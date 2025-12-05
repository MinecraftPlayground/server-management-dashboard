import type { Handler } from '@std/http/unstable-route';
import { join } from '@std/path/join';

export function pathProvider(
  fn : (
    request : Request,
    path : string
  ) => Response | Promise<Response>
) : Handler {
  return (request, params) => {
    console.log(request.method,join('./shared', params?.pathname.groups.path ?? ''));  
    return fn(request, join('./shared', params?.pathname.groups.path ?? ''))
  };
}
