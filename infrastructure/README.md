# Infrastructure

Local development infrastructure for TRP.

## PostgreSQL

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Connection (see `.env.example`):

```
postgresql://trp:trp@localhost:5432/trp
```

Stop:

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

Redis and MinIO are deferred until a real need appears (see `docs/CANONICAL.md`).
