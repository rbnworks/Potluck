# Potluck Planner

This project is a full-stack web application for organizing a potluck event.

## Features
- Users can submit what food they will bring (name, category, dish, quantity)
- Categories: configurable (defaults provided)
- Live summary of all entries and per-category totals
- Admin login to download the Excel sheet of all entries
- Dockerized frontend (React + Vite) and backend (FastAPI)

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Running with Docker Compose
```
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4020

### Development (Manual)
- Backend: see `backend/README.md`
- Frontend: `npm install` then `npm run dev`

## Configuration (Environment Variables)

You can configure both services via environment variables. With Docker Compose, place them in a local `.env` file next to `docker-compose.yml` or export them in your shell before running.

Note: Frontend variables must start with `VITE_`. Changing frontend env requires a rebuild or dev server restart.

### Backend (FastAPI)
- `ADMIN_PASSWORD` (string)
  - Admin password for edit/delete/download. Default: `admin123` (set a strong value in production).
- `CATEGORIES` (list)
  - Allowed categories for submissions. Accepts JSON array or comma-separated list.
  - Default: `["Starters","Salads","Veg curry","Non-veg Curry","Chapatis/Naan/Roti etc","Rice Items","Sweets","Drinks"]`

Examples:
- Comma-separated: `CATEGORIES=Starters,Salads,Main Course,Desserts`
- JSON: `CATEGORIES=["Starters","Salads","Main Course","Desserts"]`

### Frontend (Vite + React)
- `VITE_BACKEND_URL` (string)
  - Base URL for the backend API. Default in compose: `http://localhost:4020`.
- `VITE_CATEGORY_NAMES` (list)
  - Base category names. CSV or JSON array. Defaults match backend default categories.
- `VITE_CATEGORY_PER_QTY` (list)
  - Per-quantity note per category (e.g., "Serving 5"). CSV or JSON array. Defaults provided.
- `VITE_MAX_QTY` (list)
  - Maximum total quantity per category. CSV or JSON array of numbers. Defaults provided.
- `VITE_ALLOWED_HOSTS` (list)
  - Comma-separated hostnames allowed by the Vite dev server (only needed when accessing the dev server via a non-default host). Optional.

Notes:
- If lengths of `VITE_CATEGORY_PER_QTY` or `VITE_MAX_QTY` are shorter than `VITE_CATEGORY_NAMES`, missing values default to empty string and `0` respectively.
- Keep frontend and backend category lists aligned logically. The backend validates categories using its `CATEGORIES` list.

### Example .env (Docker Compose)
```
# Backend
ADMIN_PASSWORD=strong-secret
CATEGORIES=["Starters","Salads","Main Course","Desserts"]

# Frontend
VITE_BACKEND_URL=https://api.example.com
VITE_CATEGORY_NAMES=Starters,Salads,Main Course,Desserts
VITE_CATEGORY_PER_QTY=Serving 5,Serving 5,Serving 8,Serving 8
VITE_MAX_QTY=6,2,10,4
VITE_ALLOWED_HOSTS=potluck.example.com,localhost,127.0.0.1
```

Then run:
```
docker compose up --build
```

### Example (Windows PowerShell)
```
$env:ADMIN_PASSWORD='strong-secret'; \
$env:CATEGORIES='["Starters","Salads","Main Course","Desserts"]'; \
$env:VITE_BACKEND_URL='https://api.example.com'; \
$env:VITE_CATEGORY_NAMES='Starters,Salads,Main Course,Desserts'; \
$env:VITE_CATEGORY_PER_QTY='Serving 5,Serving 5,Serving 8,Serving 8'; \
$env:VITE_MAX_QTY='6,2,10,4'; \
$env:VITE_ALLOWED_HOSTS='potluck.example.com,localhost,127.0.0.1'; \
 docker compose up --build
```

## Admin
- Admin password is configured via `ADMIN_PASSWORD`. Default is `admin123` (development only).
- Excel download available to admin users.

## File Structure
- `/backend` - FastAPI backend
- `/` - React frontend (Vite)

## License
MIT

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
