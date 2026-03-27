# API: Files

The `/api/files/` endpoint provides a complete REST interface for managing files and directories on the server.

All paths are relative to the server's configured root directory.  
A path **ending with a trailing slash** (`/`) is treated as a **directory**, while a path **without a trailing slash** is treated as a **file**.

---

## GET `/api/files/<path>` 
Retrieves the content of a file or lists the contents of a directory.

### GET `/api/files/<path_to_file>`
- Read a file
- Returns the raw file content.
- The `Content-Type` header is automatically set based on the file extension.

**Examples:**
```bash
curl http://localhost:8000/api/files/settings.json
curl http://localhost:8000/api/files/plugins/myplugin/config.yml
```

### GET `/api/files/<path_to_directory>/`
- List a directory (non-recursive)
- Returns a JSON array containing the entries in the directory.

**Example response:**
```json
[
  {
    "name": "settings.json",
    "path": "settings.json",
    "isDirectory": false,
    "isFile": true,
    "isSymlink": false
  },
  {
    "name": "plugins",
    "path": "plugins",
    "isDirectory": true,
    "isFile": false,
    "isSymlink": false
  }
]
```

---

## POST `/api/files/<path>` 
Creates a new file or directory. Parent directories are created automatically.

### POST `/api/files/<path_to_file>`
- Create a file
- Optionally accepts the file content in the request body.
- Returns an error if the file already exists.

**Examples:**
```bash
# Create an empty file
curl -X POST http://localhost:8000/api/files/newfile.txt

# Create a file with content
curl -X POST http://localhost:8000/api/files/config.json \
  -H "Content-Type: application/json" \
  -d '{"server": {"port": 25565}}'
```

### POST `/api/files/<path_to_directory>/`
- Create a directory

**Examples:**
```bash
curl -X POST http://localhost:8000/api/files/newfolder/
curl -X POST http://localhost:8000/api/files/deep/nested/folder/
```

---

## DELETE `/api/files/<path>`
Deletes a file or a directory (recursively).

### DELETE `/api/files/<path_to_file>`
- Delete a file

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/files/oldfile.txt
```

### DELETE `/api/files/<path_to_directory>/`
- Delete a directory recursively
- Deletes the directory and all its contents (files and subdirectories).

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/files/oldfolder/
```

---

## PUT `/api/files/<path>` 
Replaces the entire content of an existing file (overwrite).  
Cannot be used on directories.

### PUT `/api/files/<path_to_file>`

**Examples:**
```bash
curl -X PUT http://localhost:8000/api/files/settings.json \
  -H "Content-Type: application/json" \
  -d '{"updated": true}'
```

---

## PATCH `/api/files/<path>`
Renames or moves a file or directory.
The request body must contain a JSON object with a `newPath` field.

### PATCH `/api/files/<path_to_file>`

**Examples:**
```bash
# Rename file
curl -X PATCH http://localhost:8000/api/files/oldname.txt \
  -H "Content-Type: application/json" \
  -d '{"newPath": "newname.txt"}'
```

```bash
# Move file
curl -X PATCH http://localhost:8000/api/files/oldfolder/file.txt \
  -H "Content-Type: application/json" \
  -d '{"newPath": "newfolder/file.txt"}'
```


### PATCH `/api/files/<path_to_directory>/`

**Examples:**
```bash
# Rename directory
curl -X PATCH http://localhost:8000/api/files/oldfolder/ \
  -H "Content-Type: application/json" \
  -d '{"newPath": "newfolder/"}'
```

```bash
# Move directory
curl -X PATCH http://localhost:8000/api/files/oldfolder/ \
  -H "Content-Type: application/json" \
  -d '{"newPath": "backup/oldfolder/"}'
```

---

## Common Error Codes

- `404` – File or directory not found
- `409` – Conflict (e.g. file already exists on `POST`)
- `400` – Bad request (missing `newPath` in `PATCH`, etc.)
- `500` – Internal server error
