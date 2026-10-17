# 🚀 Deployment Guide — GridPulse AI

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   Vercel         │  API    │  Railway / Render     │
│   (Frontend)     │ ──────► │  (Python Backend)     │
│   Next.js 15     │         │  FastAPI + TensorFlow │
└─────────────────┘         └──────────────────────┘
```

---

## Step 1: Deploy the Backend (Railway)

### Option A: Railway (Recommended)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your **GridPluse-AI** repository
4. Railway will auto-detect the `Dockerfile` and `railway.toml`
5. Once deployed, copy your backend URL (e.g. `https://gridpulse-api-production.up.railway.app`)

### Option B: Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New"** → **"Web Service"** → connect your GitHub repo
3. Settings:
   - **Root Directory**: `.` (project root)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Copy your backend URL

---

## Step 2: Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → import **GridPluse-AI**
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
4. Add environment variable:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL from Step 1 (e.g. `https://gridpulse-api-production.up.railway.app`)
5. Click **Deploy**

---

## Environment Variables Summary

### Frontend (Vercel)
| Variable | Value | Required |
|:---------|:------|:---------|
| `NEXT_PUBLIC_API_URL` | Your deployed backend URL | ✅ Yes |

### Backend (Railway/Render)
| Variable | Value | Required |
|:---------|:------|:---------|
| `PORT` | Auto-set by platform | Auto |

---

## Verify Deployment

1. **Backend**: Visit `https://your-backend-url.com/health` — should return JSON with `"status": "operational"`
2. **Frontend**: Visit your Vercel URL — dashboard should load and fetch data from the backend
3. **API Docs**: Visit `https://your-backend-url.com/docs` for Swagger UI

---

## Troubleshooting

| Issue | Fix |
|:------|:----|
| Frontend shows fallback data | Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel |
| CORS errors in browser | The `next.config.ts` rewrites should handle this; verify the rewrite is active |
| Backend health check fails | Check Railway/Render logs for TensorFlow import errors |
| TensorFlow too large for free tier | Consider using `tensorflow-cpu` in requirements.txt to reduce image size |
