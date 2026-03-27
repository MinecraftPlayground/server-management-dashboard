| Method | Route | Description/Usage |
|:---:|:----|:----|
| `POST` | `/api/files/<path_to_directory>/` | Create directory |
| `DELETE` | `/api/files/<path_to_file>` | Delete file |
| `DELETE` | `/api/files/<path_to_directory>/` | Delete directory recursively |
| `PUT` | `/api/files/<path_to_file>` | Replace file content |
| `PATCH` | `/api/files/<path_to_file>` | Rename/Move file |
| `PATCH` | `/api/files/<path_to_directory>` | Rename/Move directory |

# `api/files`
This endpoint provides an easy way of getting, changing, deleting and stating files/directories.

## Methods
### `GET /api/files/<path_to_file>`
Get the contents of a file. This request returns the requested file with the respective `Content-Type` based on the file extension.

#### Examples
##### `GET /api/files/settings.json`
This returns the `settings.json` file with the `Content-Type: application/json` from the path `/settings.json`.

##### `GET /api/files/some/path/file.txt`
This returns the `file.txt` file with the `Content-Type: text/plain` from the path `/some/path/file.txt`.

---

### `GET /api/files/<path_to_directory>/`
Get a listing for all files and directories (non recursive) for the given directory as a JSON object array.

#### Examples
##### `GET /api/files/`
This returns all the files and directories for the root directory (`/`):
```json
[
  {
    path: "settings.json",
    isDirectory: false,
    isFile: true,
    isSymlink: false,
    name: "settings.json"
  },
  {
    path: "some",
    isDirectory: true,
    isFile: false,
    isSymlink: false,
    name: "some"
  }
]
```

##### `GET /api/files/some/`
This returns all the files and directories for the directory `/some/`:
```json
[
  {
    path: "some\file.txt",
    isDirectory: false,
    isFile: true,
    isSymlink: false,
    name: "file.txt"
  }
]
```

---

### `POST /api/files/<path_to_new_file>`
Create new file with optional content. If the file already exists, an error will be returned. If the path for the file is nested inside other directories (ex. `some_other/new_file.txt`) and the directory does not exist, it will be created automatically. If the directory does already exists, the file will be created normally.

#### Examples
##### `POST /api/files/new_file.txt`
This will create a new file called `new_file.txt` in the root of the directory (`/`).

##### `POST /api/files/some_other/new_file.txt`
This will create a new file called `new_file.txt` in the directory `/some_other/`. The directory `/some_other/` will be created if it doesn't exists already.
