from flask import Flask, jsonify, render_template
import fastf1
import fastf1.ergast as ergast
import pandas as pd
import os

app = Flask(__name__)

# Use /tmp for cache (works on Render free tier too)
CACHE_DIR = os.environ.get("CACHE_DIR", "/tmp/fastf1_cache")
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)


# ─── Homepage ────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


# ─── Season Schedule ─────────────────────────────────────────────────────────
@app.route("/api/schedule/<int:year>")
def get_schedule(year):
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        races = []
        for _, row in schedule.iterrows():
            races.append({
                "round":    int(row["RoundNumber"]),
                "name":     row["EventName"],
                "country":  row["Country"],
                "location": row["Location"],
                "date":     str(row["EventDate"].date()),
                "format":   row["EventFormat"],
            })
        return jsonify({"year": year, "races": races})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Race Results ─────────────────────────────────────────────────────────────
@app.route("/api/results/<int:year>/<int:round_num>")
def get_results(year, round_num):
    try:
        session = fastf1.get_session(year, round_num, "R")
        session.load(laps=False, telemetry=False, weather=False, messages=False)
        results = session.results[[
            "DriverNumber", "FullName", "Abbreviation",
            "TeamName", "Position", "Points", "Status", "GridPosition"
        ]].sort_values("Position")
        return jsonify({
            "event":   session.event["EventName"],
            "year":    year,
            "results": results.fillna("").to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Driver Standings ─────────────────────────────────────────────────────────
@app.route("/api/standings/drivers/<int:year>")
def get_driver_standings(year):
    try:
        standings = ergast.get_driver_standings(season=year, round=None)
        df = standings.content[0]
        result = []
        for _, row in df.iterrows():
            result.append({
                "position":    int(row["position"]),
                "driver":      f"{row['givenName']} {row['familyName']}",
                "code":        row.get("driverCode", ""),
                "team":        row["constructorNames"][0] if row["constructorNames"] else "",
                "points":      float(row["points"]),
                "wins":        int(row["wins"]),
                "nationality": row["nationality"],
            })
        return jsonify({"year": year, "standings": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Constructor Standings ────────────────────────────────────────────────────
@app.route("/api/standings/constructors/<int:year>")
def get_constructor_standings(year):
    try:
        standings = ergast.get_constructor_standings(season=year, round=None)
        df = standings.content[0]
        result = []
        for _, row in df.iterrows():
            result.append({
                "position":    int(row["position"]),
                "team":        row["constructorName"],
                "points":      float(row["points"]),
                "wins":        int(row["wins"]),
                "nationality": row["nationality"],
            })
        return jsonify({"year": year, "standings": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Telemetry ────────────────────────────────────────────────────────────────
@app.route("/api/telemetry/<int:year>/<int:round_num>/<string:driver>")
def get_telemetry(year, round_num, driver):
    try:
        session = fastf1.get_session(year, round_num, "Q")
        session.load(weather=False, messages=False)
        fastest_lap = session.laps.pick_driver(driver).pick_fastest()
        tel = fastest_lap.get_telemetry()
        step = max(1, len(tel) // 250)
        tel_sampled = tel.iloc[::step][["Distance", "Speed", "Throttle", "Brake", "nGear"]].copy()
        tel_sampled["Brake"] = tel_sampled["Brake"].astype(int)
        lap_time = fastest_lap["LapTime"]
        lap_fmt = (
            f"{int(lap_time.total_seconds() // 60)}:{lap_time.total_seconds() % 60:06.3f}"
            if pd.notna(lap_time) else "N/A"
        )
        return jsonify({
            "driver":    driver,
            "event":     session.event["EventName"],
            "year":      year,
            "lapTime":   lap_fmt,
            "telemetry": tel_sampled.fillna(0).to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Lap Times ────────────────────────────────────────────────────────────────
@app.route("/api/laps/<int:year>/<int:round_num>/<string:session_type>")
def get_laps(year, round_num, session_type):
    try:
        session = fastf1.get_session(year, round_num, session_type)
        session.load(telemetry=False, weather=False, messages=False)
        laps = session.laps.pick_quicklaps()
        fastest = (
            laps.groupby("Driver")["LapTime"]
            .min().reset_index().sort_values("LapTime")
        )
        fastest["LapTimeSeconds"] = fastest["LapTime"].dt.total_seconds()
        fastest["LapTimeFormatted"] = fastest["LapTime"].apply(
            lambda x: f"{int(x.total_seconds()//60)}:{x.total_seconds()%60:06.3f}"
            if pd.notna(x) else "N/A"
        )
        return jsonify({
            "event":  session.event["EventName"],
            "session": session_type,
            "year":   year,
            "laps":   fastest[["Driver", "LapTimeSeconds", "LapTimeFormatted"]].to_dict(orient="records")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
