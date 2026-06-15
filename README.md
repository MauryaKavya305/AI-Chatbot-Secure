# AI Chatbot — Secure Setup

A Gemini-powered chat widget you can embed in any web page.
The Gemini API key **never leaves the server** — the frontend only talks to your own `/api/chat` endpoint.

---

## Project Structure

```
AI-Chatbot/
├── .env                  ← Your secrets (NEVER commit this)
├── .gitignore            ← Excludes .env and node_modules
├── package.json
├── server/
│   └── index.js          ← Express server (holds the API key)
└── public/               ← Served as static files to the browser
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── script.js     ← No API key here, calls /api/chat
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Add your Gemini API key
Create a `.env` file in the project root (already listed in `.gitignore`):
```
GEMINI_API_KEY=your_actual_key_here
PORT=3000
```
Get your key from: https://aistudio.google.com/app/apikey

### 3. Start the server
```bash
# Production
npm start

# Development (auto-restarts on changes)
npm run dev
```

Open http://localhost:3000 in your browser.

---

## How the security fix works

| Before (❌ leaks key) | After (✅ key is safe) |
|---|---|
| Frontend JS called Gemini API directly with key in the source | Frontend calls `/api/chat` on your own server |
| Anyone opening DevTools could copy the key | Server reads key from `.env`, never exposed |
| Key visible in GitHub repo | `.env` is gitignored; only a placeholder is committed |

---

## Embedding in another app

Since the chatbot is now served by your Express server, you can embed it in any page by:

1. Deploying this server (e.g. on Render, Railway, or a VPS)
2. Adding the chatbot's `<script>` and `<link>` tags to your existing HTML — or simply iframing `http://your-server/`

---

## Deploying to production

When deploying (e.g. Render, Railway, Fly.io), set `GEMINI_API_KEY` as an **environment variable** in your hosting dashboard — never in the code or a committed file.
