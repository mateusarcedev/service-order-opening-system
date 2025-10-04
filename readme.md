# Service Order Opening System

Full-stack application for managing Service Orders (OS), with checklist, photo upload, and service tracking.

* **Backend**: NestJS + Prisma (PostgreSQL) + MinIO (S3 compatible)
* **Frontend**: Vue 3 + Vite + Pinia + TanStack Query
* **Infra**: Docker Compose (Postgres, MinIO, API and Web)

> **Note:** project for **development environment**. No Nginx/reverse proxy and intentionally simple configurations.

---

## Repository structure

```
.
├── api        # NestJS + Prisma (PostgreSQL/MinIO)
└── os-web     # Vue 3 Frontend (Vite)
```

Each app has its own **.env**: one in `api/.env` and another in `os-web/.env`.
There is **no** `.env` in the root.

---

## Prerequisites

* Node.js 20+
* Docker and Docker Compose
* (Optional to run without Docker) PostgreSQL 13+ and MinIO (or S3 compatible)

---

## Environment variables

Create **two files**:

### `api/.env` (keys only — no values)

```
DATABASE_URL=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

JWT_SECRET=

# MinIO (internal format)
MINIO_ENDPOINT=          # host only, no http/https (e.g.: minio or localhost)
MINIO_PORT=              # e.g.: 9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
MINIO_REGION=            # e.g.: us-east-1
MINIO_USE_SSL=           # true | false

# Upload
PHOTO_MAX_SIZE_MB=
PHOTO_MAX_PER_OS=
```

> ⚠️ **Important:** in `MINIO_ENDPOINT` **do not add** `http://` or `https://`.
> The final endpoint is built from `MINIO_USE_SSL` + `MINIO_ENDPOINT` + `MINIO_PORT`.
> If you include protocol here, you will see errors like `ENOTFOUND http`.

### `os-web/.env`

```
VITE_API_BASE_URL=
```

`VITE_API_BASE_URL` must point to the API (e.g.: `http://localhost:3000`).

---

## Running with Docker Compose

Starts **PostgreSQL**, **MinIO**, **API**, and **Web**.

1. **Create the .envs**

   * `api/.env` with the keys above.
   * `os-web/.env` with `VITE_API_BASE_URL`.

2. **Start the services**

   ```bash
   docker compose up -d
   ```

3. **Apply Prisma migrations (inside API container)**

   ```bash
   docker compose exec api npx prisma migrate deploy
   # for development:
   # docker compose exec api npx prisma migrate dev --name init
   ```

4. **(Optional) Run seed**

   ```bash
   docker compose exec api npm run db:seed
   ```

5. **Access**

   * **Web**: [http://localhost:5173](http://localhost:5173)
   * **API**: [http://localhost:3000](http://localhost:3000)
   * **MinIO (console)**: [http://localhost:9001](http://localhost:9001)
   * **MinIO (S3 API)**: [http://localhost:9000](http://localhost:9000)

> The photo service automatically creates the *bucket* when saving. You can check/manage it via the MinIO console.

---

## Running locally (without Docker)

> Useful if you already have Postgres and MinIO/S3 installed locally.

1. **Database and MinIO**

   * Create the database in PostgreSQL
     (or start via Compose: `docker compose up -d os_system`).
   * Start MinIO (or use a compatible S3)
     (or via Compose: `docker compose up -d minio`).
   * Fill `api/.env` with the `DATABASE_URL` and MinIO credentials.

2. **Backend (API)**

   ```bash
   cd api
   npm ci
   npx prisma generate
   npx prisma migrate dev --name init     # or: npx prisma migrate deploy
   npm run db:seed                        # optional
   npm run start:dev                      # http://localhost:3000
   ```

3. **Frontend (Web)**

   ```bash
   cd os-web
   npm ci
   # set VITE_API_BASE_URL in os-web/.env (e.g.: http://localhost:3000)
   npm run dev                            # http://localhost:5173
   ```

---

## Basic flow

1. **Login** (after seed or user creation).
2. **Create Service Order** (title/description).
3. **Start checklist**, answer items (including required ones).
4. **Upload photos** (stored in MinIO).
5. **Finish Service Order** and view **summary** (total time + gallery).

> The details screen tries to display images via **pre-signed URL**; if the browser cannot access it (e.g., internal Compose host), it falls back to API (blob).

---

## Tips & Troubleshooting

* **`P1001 Can't reach database server at 'localhost:5432'`**
  Inside the container, `localhost` is the container itself. Use the **service name** in the `DATABASE_URL`, for example:

  ```
  postgres://<user>:<pass>@os_system:5432/<db>
  ```

* **`ENOTFOUND http` / `getaddrinfo ENOTFOUND http` when connecting to MinIO**
  You probably included `http://` in `MINIO_ENDPOINT`.
  Correct it to just the host (e.g.: `minio`) and keep:

  ```
  MINIO_USE_SSL=false
  MINIO_PORT=9000
  ```

* **Images don’t show up in the browser**
  Pre-signed URLs with internal hosts (e.g.: `http://minio:9000/...`) are not accessible from the browser.
  The UI already uses API fallback. If you prefer direct URLs accessible externally, adjust the variables to reflect your environment host/port (always following the endpoint format described above).

* **Open shell in API container**

  ```bash
  docker compose exec api sh
  ```

---

## Useful scripts

**API**

* `npm run start:dev` — start API in development mode
* `npm run build` — build to `dist/`
* `npm run db:seed` — populate example data
* `npx prisma migrate dev` / `deploy` — apply migrations
* `npx prisma studio` — Prisma UI to inspect data (local)

**Web**

* `npm run dev` — Vite dev server
* `npm run build` — production build
* `npm run preview` — preview the build

---
