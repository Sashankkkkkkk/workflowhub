# WorkFlowHub

Lightweight workflow and productivity platform for remote teams (SOFT806 Assignment 1 – Task 2).

| Layer | Technology | Package manager |
|-------|------------|-----------------|
| Backend API | Django 5.2 + Django REST Framework (token auth) | pip + `backend/requirements.txt` |
| Frontend | React 18 + Vite | npm + `frontend/package.json` / `package-lock.json` |
| Containers | Docker (one Dockerfile per service) + Docker Compose | – |
| CI | GitHub Actions (`.github/workflows/ci.yml`) and CircleCI (`.circleci/config.yml`) | – |

## Features

* Register, log in and log out (`/api/auth/register/`, `/api/auth/login/`, `/api/auth/logout/`)
* Full CRUD on workflow items (`/api/workflow-items/`) with status Pending / In Progress / Completed
* Each user only sees their own items
* Health probe at `/api/health/`

## Configuration (environment variables)

Copy `.env.example` to `.env` and edit it. `.env` is git-ignored – **never commit real secrets**.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `DJANGO_SECRET_KEY` | backend | Django signing key |
| `DJANGO_DEBUG` | backend | `true` / `false` |
| `DJANGO_ALLOWED_HOSTS` | backend | comma-separated host list |
| `CORS_ALLOWED_ORIGINS` | backend | origins allowed to call the API |
| `VITE_API_URL` | frontend | API base URL (inlined at build time) |

## Run with Docker Compose

```bash
cp .env.example .env
docker compose up --build
# Frontend: http://localhost:3000     API: http://localhost:8000/api/health/
```

## Run without Docker

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver            # http://localhost:8000

# frontend (second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                           # http://localhost:5173
```

## Tests

```bash
cd backend  && python manage.py test     # 8 API tests
cd frontend && npm test                  # 2 UI tests
```

## Build the images individually

```bash
docker build -t workflowhub-backend ./backend
docker build --build-arg VITE_API_URL=http://localhost:8000/api -t workflowhub-frontend ./frontend
```

## Git workflow

* `main` is the stable branch – changes arrive only through pull requests.
* One feature branch per backlog issue (`feature/<short-name>`), reviewed before merge.
* Issues are tracked on the GitHub Projects board: Backlog → To Do → In Progress → In Review → Done.

## CI pipelines

Both pipelines run on push/pull request, install dependencies (pip / npm ci), run the tests, build the
backend and frontend Docker images, and smoke-test the backend container.

* **GitHub Actions** – `.github/workflows/ci.yml`
* **CircleCI** – `.circleci/config.yml` (enable the repo under *Projects → Set Up Project* in CircleCI)
