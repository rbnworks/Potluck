# Potluck Planner

This project is a full-stack web application for organizing a potluck event.

## Features
- Users can submit what food they will bring (name, category, dish, quantity)
- Categories: Starters, Veg curry, Non-veg Curry, Chapatis/Naan/Roti (Breads), Rice Items, Sweets
- Live summary of all entries
- Admin login to download the Excel sheet of all entries
- Dockerized frontend (React) and backend (FastAPI)

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Running with Docker Compose
```
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Development (Manual)
- Backend: see `backend/README.md`
- Frontend: `npm install` then `npm run dev`

## Admin
- Default admin password: `admin123` (change in `backend/main.py` for production)

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
