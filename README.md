# Flux — Controle Financeiro Pessoal

Aplicação full-stack de organização financeira com visão mensal e prospecção futura.

## Stack

| Camada      | Tecnologia                    |
|-------------|-------------------------------|
| Backend     | Kotlin + Spring Boot 3        |
| Frontend    | Next.js 15 + TypeScript       |
| Estilo      | CSS Modules + Tailwind        |
| Banco       | PostgreSQL (via Flyway)       |
| Gráficos    | Recharts                      |

## Estrutura

```
flux/
├── backend/      → Kotlin Spring Boot (porta 8080)
├── frontend/     → Next.js (porta 3000)
└── docker-compose.yml  → PostgreSQL local
```

## Rodando localmente

### 1. Banco de dados (PostgreSQL via Docker)
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
./gradlew bootRun
```

### 3. Frontend
```bash
cd frontend
npm run dev
```

Acesse: **http://localhost:3000**

## API

Backend rodando em `http://localhost:8080/api`

| Recurso           | Endpoints                                      |
|-------------------|------------------------------------------------|
| Usuários          | `GET/POST /api/users`                          |
| Categorias        | `GET/POST/PUT/DELETE /api/categories`          |
| Fontes pagamento  | `GET/POST/DELETE /api/payment-sources`         |
| Lançamentos       | `GET/POST/PUT/DELETE /api/transactions`        |
| Orçamentos        | `GET /api/budgets`, `PUT /api/budgets`         |
| Prospecção        | `GET /api/timeline`                            |
