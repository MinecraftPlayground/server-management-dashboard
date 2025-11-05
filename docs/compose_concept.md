# Compose Concept
This is a concept on how we could setup multiple server instances that all use a shared internal network and can be accessed over the same UI instance.


## Main Dashboard UI
This service provides the dashboard hosted on `http://localhost:8080`. It's in the same network as `server1` and `server2`,
thus it's able to connect to the services `http://dashboard_communication:61001` and `http://dashboard_communication:61002` to access the data.

`minecraft/dashboard/compose.yml`
```yml
services:
  dashboard:
    image: dashboard:latest
    container_name: server1
    ports:
      - "8080:80" # Dashboard UI port

    networks:
      - dashboard_communication

networks:
  dashboard_communication:
    name: dashboard_communication
    external: true
```

## Minecraft Server 1
This service provides the Minecraft server 1 hostet on `localhost:60001`. It's in the same network as `dashboard`, thus it's able to provide the data on `http://dashboard_communication:61001`.

`minecraft/server1/compose.yml`
```yml
services:
  server1:
    image: server:latest
    container_name: server1
    ports:
      - "60001:25565" # Minecraft port

    expose:
      - "61001" # Dashboard communication from server 1

    networks:
      - dashboard_communication

networks:
  dashboard_communication:
    name: dashboard_communication
    external: true
```

## Minecraft Server 2
This service provides the Minecraft server 2 hostet on `localhost:60002`. It's in the same network as `dashboard`, thus it's able to provide the data on `http://dashboard_communication:61002`.

`minecraft/server2/compose.yml`
```yml
services:
  server2:
    image: server:latest
    container_name: server2
    ports:
      - "60002:25565" # Minecraft port

    expose:
      - "61002" # Dashboard communication from server 2

    networks:
      - dashboard

networks:
  dashboard_communication:
    name: dashboard_communication
    external: true
```
