# APEX — F1 Data Hub

A cinematic F1 informational website powered by [FastF1](https://github.com/theOehrly/Fast-F1) and Flask.

## Features
- 📅 Season Calendar
- 🏆 Driver & Constructor Standings (with points bars)
- 🏁 Race Results (full grid classification)
- 📡 Driver Telemetry (speed · throttle · brake chart from qualifying)

## Live
-[Live link] (https://apex-f1.onrender.com/)

## Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py

# Open browser
http://localhost:5000
```

## Deploy to Render (Free)

1. Push this repo to GitHub
2. Go to render.com → New Web Service → Connect repo
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
4. Deploy → get your live URL ✅

## Project Structure

```
├── app.py                  ← Flask backend + API routes
├── Procfile                ← Gunicorn start command
├── requirements.txt        ← Python dependencies
├── templates/
│   └── index.html          ← Frontend HTML
└── static/
    ├── style.css           ← Styling
    └── script.js           ← Frontend JS
```

## API Endpoints

| Route | Description |
|---|---|
| `GET /api/schedule/<year>` | Season race calendar |
| `GET /api/standings/drivers/<year>` | Driver standings |
| `GET /api/standings/constructors/<year>` | Constructor standings |
| `GET /api/results/<year>/<round>` | Race classification |
| `GET /api/telemetry/<year>/<round>/<driver>` | Qualifying telemetry |

---
Unofficial project. Not affiliated with Formula 1.
