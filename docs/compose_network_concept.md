# Compose Concept
This is a concept on how we could setup multiple server instances that all use a shared internal network and can be accessed over the same UI instance.
The main goal is to provide an easy way of managing multiple Minecraft instances over the same dashboard UI. Also we wand an easy way of configuring/adding new instances and the dashboard UI should pick these up automatically.

```
+-[localhost (Host)]--------------------------------------------------------------------------------+
|                                                                                                   |
|                                                                                                   |
|   +-[compose.yml (Container)]----+                     +-[docker.sock (Docker API)]-----------+   |
|   |                              |                     |                                      |   |
|   |                              |                     |                                      |   |
|   |   +-[Dashboard]----------+   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |      server1:61000 <----------------------------- server1:61000                       |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |      server2:61000 <----------------------------- server2:61000                       |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                :80 --------> localhost:8080    |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   +----------------------+   |                     |                                      |   |
|   |                              |                     |                                      |   |
|   +------------------------------+                     +--------------------------------------+   |
|                                                                          |  |                     |
|                                                                          |  |                     |
|   +-[compose.yml (Container)]----+                     +-[server_management (Docker Network)]-+   |
|   |                              |                     |                                      |   |
|   |                              |                     |                                      |   |
|   |   +-[Server 1 (server1)]-+   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |             :61000 ------------------------------> server1:61000                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |             :25565 --------> localhost:60001   |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   +----------------------+   |                     |                                      |   |
|   |                              |                     |                                      |   |
|   +------------------------------+                     |                                      |   |
|                                                        |                                      |   |
|                                                        |                                      |   |
|   +-[compose.yml (Container)]----+                     |                                      |   |
|   |                              |                     |                                      |   |
|   |                              |                     |                                      |   |
|   |   +-[Server 2 (server2)]-+   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |             :61000 ------------------------------> server2:61000                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |             :25565 --------> localhost:60002   |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   |                      |   |                     |                                      |   |
|   |   +----------------------+   |                     |                                      |   |
|   |                              |                     |                                      |   |
|   +------------------------------+                     +--------------------------------------+   |
|                                                                                                   |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

## Main Dashboard UI
This service provides the dashboard hosted on `http://localhost:8080`. It's in the same network as service `server1` and service `server2`,
thus it's able to connect to the service `http://server1:61000` and service `http://server2:61000` to access the data.

`minecraft/dashboard/compose.yml`
```yml
services:
  dashboard:
    image: dashboard:latest
    container_name: dashboard
    ports:
      # Dashboard UI port
      - "8080:80"

    networks:
      # Network for communication between the Minecraft servers and the dashboard.
      - server_management

    environment:
      # Name of the shared network for the communication between the Minecraft servers and the dashboard.
      # We will use the Docker API to query all devices in that network, excluding self.
      - NETWORK=server_management

    volumes:
      # Socket for accessing the Docker API.
      - /var/run/docker.sock:/var/run/docker.sock:ro

networks:
  # Network for communication between the Minecraft servers and the dashboard.
  server_management:
    name: server_management
    external: true
```

## Minecraft Server 1
This service provides the Minecraft server 1 hostet on `localhost:60001`. It's in the same network as service `dashboard`, thus it's able to provide the data on `http://server1:61000`.

`minecraft/server1/compose.yml`
```yml
services:
  server1:
    image: server:latest
    container_name: server1
    ports:
      # Minecraft port
      - "60001:25565"

    expose:
      # Expose the port only to the internal network, so that it can be accessed by the dashboard
      # for communicating with server 2.
      - "61000"

    networks:
      # Network for communication between the Minecraft server and the dashboard.
      - server_management

networks:
  # Network for communication between the Minecraft servers and the dashboard.
  server_management:
    name: server_management
    external: true
```

## Minecraft Server 2
This service provides the Minecraft server 2 hostet on `localhost:60002`. It's in the same network as service `dashboard`, thus it's able to provide the data on `http://server2:61000`.

`minecraft/server2/compose.yml`
```yml
services:
  server2:
    image: server:latest
    container_name: server2
    ports:
      # Minecraft port
      - "60002:25565"

    expose:
      # Expose the port only to the internal network, so that it can be accessed by the dashboard
      # for communicating with server 2.
      - "61000"

    networks:
      # Network for communication between the Minecraft server and the dashboard.
      - server_management

networks:
  # Network for communication between the Minecraft servers and the dashboard.
  server_management:
    name: server_management
    external: true
```
