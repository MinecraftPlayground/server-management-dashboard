| Method | Route | Description/Usage |
|:---:|:----|:----|
| `GET` | `/api/files/<path_to_file>` | Get file content |
| `GET` | `/api/files/<path_to_directory>/` | List directory content (directories and files) |
| `POST` | `/api/files/<path_to_file>` | Create file (+ optional file content) |
| `POST` | `/api/files/<path_to_directory>/` | Create directory |
| `DELETE` | `/api/files/<path_to_file>` | Delete file |
| `DELETE` | `/api/files/<path_to_directory>/` | Delete directory recursively |
| `PUT` | `/api/files/<path_to_file>` | Replace file content |
| `PATCH` | `/api/files/<path_to_file>` | Rename/Move file |
| `PATCH` | `/api/files/<path_to_directory>` | Rename/Move directory |
