# Docker Commands Cheatsheet - LocalLink

## Quick Rebuild Scripts

### Rebuild Everything
```powershell
# Windows
.\rebuild-all.ps1

# Linux/Mac
./rebuild-all.sh
```

### Rebuild Backend Only
```powershell
# Windows
.\rebuild-backend.ps1

# Linux/Mac
./rebuild-backend.sh
```

### Rebuild Frontend Only
```powershell
# Windows
.\rebuild-frontend.ps1

# Linux/Mac
./rebuild-frontend.sh
```

## Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d backend frontend

# Rebuild and start
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## Individual Container Commands

### Backend

```bash
# Build
docker build -t locallink-backend:latest backend

# Run
docker run -d --name locallink-backend -p 5000:5000 --env-file backend/.env locallink-backend:latest

# Logs
docker logs -f locallink-backend

# Stop
docker stop locallink-backend

# Remove
docker rm locallink-backend

# Shell access
docker exec -it locallink-backend sh
```

### Frontend

```bash
# Build
docker build -t locallink-frontend:latest frontend

# Run
docker run -d --name locallink-frontend -p 3000:80 locallink-frontend:latest

# Logs
docker logs -f locallink-frontend

# Stop
docker stop locallink-frontend

# Remove
docker rm locallink-frontend

# Shell access
docker exec -it locallink-frontend sh
```

## Useful Docker Commands

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Stop all containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune

# Remove specific container
docker rm -f locallink-backend
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi locallink-backend:latest

# Remove unused images
docker image prune

# Remove all unused images
docker image prune -a
```

### Logs and Debugging

```bash
# View logs
docker logs locallink-backend

# Follow logs
docker logs -f locallink-backend

# Last 100 lines
docker logs --tail 100 locallink-backend

# With timestamps
docker logs -t locallink-backend

# Container stats
docker stats locallink-backend

# Inspect container
docker inspect locallink-backend
```

### Network Management

```bash
# List networks
docker network ls

# Create network
docker network create locallink-network

# Connect container to network
docker network connect locallink-network locallink-backend

# Inspect network
docker network inspect locallink-network
```

### Volume Management

```bash
# List volumes
docker volume ls

# Remove unused volumes
docker volume prune

# Inspect volume
docker volume inspect mongodb_data
```

### System Cleanup

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Remove everything unused
docker system prune -a --volumes
```

## One-Liners

### Complete Backend Rebuild
```bash
docker stop locallink-backend && docker rm locallink-backend && docker build -t locallink-backend:latest backend && docker run -d --name locallink-backend -p 5000:5000 --env-file backend/.env locallink-backend:latest && docker logs -f locallink-backend
```

### Complete Frontend Rebuild
```bash
docker stop locallink-frontend && docker rm locallink-frontend && docker build -t locallink-frontend:latest frontend && docker run -d --name locallink-frontend -p 3000:80 locallink-frontend:latest && docker logs -f locallink-frontend
```

### Rebuild Both Services
```bash
# Backend
docker stop locallink-backend && docker rm locallink-backend && docker build -t locallink-backend:latest backend && docker run -d --name locallink-backend -p 5000:5000 --env-file backend/.env locallink-backend:latest

# Frontend
docker stop locallink-frontend && docker rm locallink-frontend && docker build -t locallink-frontend:latest frontend && docker run -d --name locallink-frontend -p 3000:80 locallink-frontend:latest

# View status
docker ps
```

## Troubleshooting Commands

### Check if containers are running
```bash
docker ps -f name=locallink
```

### Check container health
```bash
docker inspect --format='{{.State.Health.Status}}' locallink-backend
```

### View container resource usage
```bash
docker stats --no-stream locallink-backend locallink-frontend
```

### Test connectivity between containers
```bash
# From frontend to backend
docker exec locallink-frontend wget -O- http://backend:5000/health

# From backend to MongoDB
docker exec locallink-backend node -e "console.log('test')"
```

### Check environment variables
```bash
docker exec locallink-backend env
```

### View nginx config (frontend)
```bash
docker exec locallink-frontend cat /etc/nginx/conf.d/default.conf
```

### Check nginx logs (frontend)
```bash
docker exec locallink-frontend cat /var/log/nginx/access.log
docker exec locallink-frontend cat /var/log/nginx/error.log
```

## Port Mappings

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| Backend | 5000 | 5000 | http://localhost:5000 |
| Frontend | 80 | 3000 | http://localhost:3000 |
| MongoDB | 27017 | 27017 | mongodb://localhost:27017 |
| Recommendation | 8001 | 8001 | http://localhost:8001 |

## Common Issues & Solutions

### Port already in use
```bash
# Find process using port (Windows)
netstat -ano | findstr :5000

# Find process using port (Mac/Linux)
lsof -i :5000

# Use different port
docker run -p 5001:5000 ...
```

### Cannot connect to MongoDB
```bash
# Use host.docker.internal
MONGO_URI=mongodb://host.docker.internal:27017/localLink

# Or use container name with docker-compose
MONGO_URI=mongodb://mongodb:27017/localLink
```

### Changes not reflected
```bash
# Rebuild without cache
docker build --no-cache -t locallink-backend:latest backend
```

### Container exits immediately
```bash
# Check logs for errors
docker logs locallink-backend
```

### Out of disk space
```bash
# Clean up everything
docker system prune -a --volumes
```

## Quick Reference

```bash
# Build
docker build -t <image> <context>

# Run
docker run -d --name <name> -p <host>:<container> <image>

# Stop
docker stop <container>

# Remove
docker rm <container>

# Logs
docker logs -f <container>

# Shell
docker exec -it <container> sh

# Stats
docker stats <container>
```

---

**Pro Tip**: Use the rebuild scripts for the easiest experience!
