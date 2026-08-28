## GitHub Codespaces Development

Backend:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Frontend:
npm run dev

Required forwarded ports:
- 5173 → React/Vite
- 8000 → FastAPI

For direct browser API calls from the frontend in Codespaces,
port 8000 must be set to Public.

Frontend API URL:
VITE_API_BASE_URL=https://<codespace>-8000.app.github.dev
