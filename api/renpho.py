import os
import json
from http.server import BaseHTTPRequestHandler

def fetch_renpho():
    email = os.environ.get("RENPHO_EMAIL", "").strip()
    password = os.environ.get("RENPHO_PASSWORD", "").strip()

    if not email or not password:
        return {"error": "RENPHO_EMAIL or RENPHO_PASSWORD environment variables missing"}

    try:
        from renpho import RenphoClient
        client = RenphoClient(email, password)
        client.login()
        raw_measurements = client.get_all_measurements()
        
        measurements = []
        for item in raw_measurements:
            ts = item.get("localCreatedAt") or item.get("createdAt") or item.get("created_at") or item.get("timestamp") or ""
            date_str = ts.split(" ")[0] if " " in str(ts) else (ts.split("T")[0] if "T" in str(ts) else str(ts)[:10])

            measurements.append({
                "timestamp": ts,
                "date": date_str,
                "weight_kg": float(item.get("weight", 0) or 0),
                "body_fat_percent": float(item.get("bodyfat", 0) or 0),
                "muscle_mass_kg": float(item.get("muscle", 0) or 0),
                "bmi": float(item.get("bmi", 0) or 0),
                "water_percent": float(item.get("water", 0) or 0),
                "visceral_fat": int(item.get("visfat", 0) or 0),
                "metabolic_age": int(item.get("bodyage", 0) or 0),
                "bone_mass_kg": float(item.get("bone", 0) or 0),
                "bmr": int(item.get("bmr", 0) or 0),
                "raw": item
            })

        measurements.sort(key=lambda x: x["timestamp"])
        return {
            "is_sample_data": False,
            "measurements": measurements
        }
    except Exception as e:
        return {"error": str(e)}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        data = fetch_renpho()
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 's-maxage=300, stale-while-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
