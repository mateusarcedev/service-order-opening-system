# OS System — Desafio Técnico

Aplicação full-stack para gestão de Ordens de Serviço (OS), com checklist, upload de fotos e acompanhamento do atendimento.

* **Backend**: NestJS + Prisma (PostgreSQL) + MinIO (S3 compatível)
* **Frontend**: Vue 3 + Vite + Pinia + TanStack Query
* **Infra**: Docker Compose (Postgres, MinIO, API e Web)

> **Nota:** projeto para **ambiente de desenvolvimento**. Sem Nginx/proxy reverso e com configurações intencionalmente simples.

---

## Estrutura do repositório

```
.
├── api        # NestJS + Prisma (PostgreSQL/MinIO)
└── os-web     # Frontend Vue 3 (Vite)
```

Cada app possui seu próprio **.env**: um em `api/.env` e outro em `os-web/.env`.
**Não** existe `.env` na raiz.

---

## Pré-requisitos

* Node.js 20+
* Docker e Docker Compose
* (Opcional para rodar sem Docker) PostgreSQL 13+ e MinIO (ou S3 compatível)

---

## Variáveis de ambiente

Crie **dois arquivos**:

### `api/.env` (apenas chaves — sem valores)

```
DATABASE_URL=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

JWT_SECRET=

# MinIO (formato interno)
MINIO_ENDPOINT=          # apenas o host, sem http/https (ex.: minio ou localhost)
MINIO_PORT=              # ex.: 9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
MINIO_REGION=            # ex.: us-east-1
MINIO_USE_SSL=           # true | false

# Upload
PHOTO_MAX_SIZE_MB=
PHOTO_MAX_PER_OS=
```

> ⚠️ **Importante:** em `MINIO_ENDPOINT` **não coloque** `http://` ou `https://`.
> O endpoint final é montado a partir de `MINIO_USE_SSL` + `MINIO_ENDPOINT` + `MINIO_PORT`.
> Se incluir protocolo aqui, verá erros como `ENOTFOUND http`.

### `os-web/.env`

```
VITE_API_BASE_URL=
```

`VITE_API_BASE_URL` deve apontar para a API (ex.: `http://localhost:3000`).

---

## Rodando com Docker Compose

Sobe **PostgreSQL**, **MinIO**, **API** e **Web**.

1. **Crie os .envs**

   * `api/.env` com as chaves acima.
   * `os-web/.env` com `VITE_API_BASE_URL`.

2. **Suba os serviços**

   ```bash
   docker compose up -d
   ```

3. **Aplique as migrações do Prisma (no container da API)**

   ```bash
   docker compose exec api npx prisma migrate deploy
   # para desenvolvimento:
   # docker compose exec api npx prisma migrate dev --name init
   ```

4. **(Opcional) Executar seed**

   ```bash
   docker compose exec api npm run db:seed
   ```

5. **Acessos**

   * **Web**: [http://localhost:5173](http://localhost:5173)
   * **API**: [http://localhost:3000](http://localhost:3000)
   * **MinIO (console)**: [http://localhost:9001](http://localhost:9001)
   * **MinIO (S3 API)**: [http://localhost:9000](http://localhost:9000)

> 💡 O serviço de fotos cria o *bucket* automaticamente ao salvar. Você pode verificar/gerenciar via console do MinIO.

---

## Rodando localmente (sem Docker)

> Útil se você já possui Postgres e MinIO/S3 na máquina.

1. **Banco e MinIO**

   * Crie o banco no PostgreSQL
     (ou suba via Compose: `docker compose up -d os_system`).
   * Suba o MinIO (ou use S3 compatível)
     (ou via Compose: `docker compose up -d minio`).
   * Preencha `api/.env` com a `DATABASE_URL` e os dados do MinIO.

2. **Backend (API)**

   ```bash
   cd api
   npm ci
   npx prisma generate
   npx prisma migrate dev --name init     # ou: npx prisma migrate deploy
   npm run db:seed                        # opcional
   npm run start:dev                      # http://localhost:3000
   ```

3. **Frontend (Web)**

   ```bash
   cd os-web
   npm ci
   # defina VITE_API_BASE_URL no os-web/.env (ex.: http://localhost:3000)
   npm run dev                            # http://localhost:5173
   ```

---

## Fluxo básico

1. **Login** (após seed ou criação de usuário).
2. **Criar OS** (título/descrição).
3. **Iniciar checklist**, responder itens (inclui obrigatórios).
4. **Fazer upload de fotos** (armazenadas no MinIO).
5. **Finalizar OS** e visualizar **resumo** (tempo total + galeria).

> A tela de detalhes tenta exibir imagens por **URL pré-assinada**; se o navegador não conseguir acessar (ex.: host interno do Compose), faz *fallback* via API (blob).

---

## Dicas & Solução de problemas

* **`P1001 Can't reach database server at 'localhost:5432'`**
  Dentro do container, `localhost` é o próprio container. Use o **nome do serviço** na `DATABASE_URL`, por exemplo:

  ```
  postgres://<user>:<pass>@os_system:5432/<db>
  ```

* **`ENOTFOUND http` / `getaddrinfo ENOTFOUND http` ao falar com MinIO**
  Você provavelmente incluiu `http://` em `MINIO_ENDPOINT`.
  Corrija para apenas o host (ex.: `minio`) e mantenha:

  ```
  MINIO_USE_SSL=false
  MINIO_PORT=9000
  ```

* **Imagens não aparecem no navegador**
  URLs pré-assinadas com host interno (ex.: `http://minio:9000/...`) não são acessíveis pelo browser.
  A tela já usa *fallback* via API. Se preferir URL direta acessível externamente, ajuste as variáveis para refletir o host/porta visíveis do seu ambiente (sempre respeitando o formato do endpoint descrito acima).

* **Abrir shell no container da API**

  ```bash
  docker compose exec api sh
  ```

---

## Scripts úteis

**API**

* `npm run start:dev` — inicia a API em modo desenvolvimento
* `npm run build` — compila para `dist/`
* `npm run db:seed` — popula dados de exemplo
* `npx prisma migrate dev` / `deploy` — aplica migrações
* `npx prisma studio` — UI do Prisma para inspecionar dados (local)

**Web**

* `npm run dev` — Vite dev server
* `npm run build` — build de produção
* `npm run preview` — preview do build

---
