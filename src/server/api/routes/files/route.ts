import type { Route } from "@std/http/unstable-route";
import { createDirectory, createFile, deleteDirectory, deleteFile, getDirectory, getFile, updateDirectory, updateFile } from './actions/index.ts';
import { pathProvider } from './path_provider.ts';


const rootApiPath = "/api/files";
const apiFilePattern = new URLPattern({ pathname: `${rootApiPath}:path(\/.*[^\/](?!\/)$)` })
const apiDirectoryPattern = new URLPattern({ pathname: `${rootApiPath}:path(.*\/$)` })

export function route(): Route[] {
  return [
    {
      method: ['GET'],
      pattern: apiFilePattern,
      handler: pathProvider(getFile)
    },
    {
      method: ['GET'],
      pattern: apiDirectoryPattern,
      handler: pathProvider(getDirectory)
    },
    {
      method: ['POST'],
      pattern: apiFilePattern,
      handler: pathProvider(createFile)
    },
    {
      method: ['POST'],
      pattern: apiDirectoryPattern,
      handler: pathProvider(createDirectory)
    },
    {
      method: ['PUT'],
      pattern: apiFilePattern,
      handler: pathProvider(updateFile)
    },
    {
      method: ['PUT'],
      pattern: apiDirectoryPattern,
      handler: pathProvider(updateDirectory)
    },
    {
      method: ['DELETE'],
      pattern: apiFilePattern,
      handler: pathProvider(deleteFile)
    },
    {
      method: ['DELETE'],
      pattern: apiDirectoryPattern,
      handler: pathProvider(deleteDirectory)
    }
  ];
}
