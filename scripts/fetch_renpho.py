#!/usr/bin/env python3
import os
import sys
import json
import datetime
from pathlib import Path

# Cargar variables de entorno desde .env.local o .env si existe python-dotenv
try:
    from dotenv import load_dotenv
    env_local = Path(__file__).resolve().parent.parent / '.env.local'
    env_file = Path(__file__).resolve().parent.parent / '.env'
    if env_local.exists():
        load_dotenv(env_local)
    elif env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = PROJECT_ROOT / 'public' / 'renpho_data.json'

def generate_sample_data():
    """Genera datos realistas de prueba vinculados a las semanas recientes."""
    today = datetime.date.today()
    sample_measurements = []
    
    # 12 semanas de mediciones progresivas (2 por semana)
    base_weight = 79.5
    base_fat = 20.8
    base_muscle = 59.2
    
    for i in range(24):
        days_ago = (23 - i) * 3.5
        m_date = today - datetime.timedelta(days=days_ago)
        
        # Tendencia de pérdida de grasa y ganancia de masa muscular
        weight = round(base_weight - (i * 0.15) + ((i % 3) * 0.1 - 0.05), 1)
        fat_pct = round(base_fat - (i * 0.12) + ((i % 2) * 0.1), 1)
        muscle_kg = round(base_muscle + (i * 0.08) - ((i % 4) * 0.05), 1)
        bmi = round(weight / (1.80 ** 2), 1)
        water = round(55.0 + (i * 0.15), 1)
        visceral = max(4, int(7 - (i // 6)))
        metabolic_age = max(22, int(28 - (i // 4)))
        bmr = int(1680 + (muscle_kg * 4))

        sample_measurements.append({
            "timestamp": f"{m_date.isoformat()}T08:30:00Z",
            "date": m_date.isoformat(),
            "weight_kg": weight,
            "body_fat_percent": fat_pct,
            "muscle_mass_kg": muscle_kg,
            "bmi": bmi,
            "water_percent": water,
            "visceral_fat": visceral,
            "metabolic_age": metabolic_age,
            "bone_mass_kg": 3.3,
            "bmr": bmr
        })

    return {
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "is_sample_data": True,
        "measurements": sample_measurements
    }

def main():
    email = os.environ.get("RENPHO_EMAIL", "").strip()
    password = os.environ.get("RENPHO_PASSWORD", "").strip()

    if not email or not password:
        print("⚠️ No se encontraron credenciales RENPHO_EMAIL / RENPHO_PASSWORD en .env.local")
        print("💡 Generando dataset de muestra para la visualización del dashboard...")
        data = generate_sample_data()
    else:
        print(f"🔑 Intentando autenticar con Renpho (cuenta: {email})...")
        try:
            from renpho import RenphoClient
            client = RenphoClient(email, password)
            client.login()
            print("✅ Autenticación exitosa en Renpho. Recuperando mediciones...")
            raw_measurements = client.get_all_measurements()
            
            measurements = []
            for item in raw_measurements:
                ts = item.get("localCreatedAt") or item.get("createdAt") or item.get("created_at") or item.get("timestamp") or datetime.datetime.now().isoformat()
                date_str = ts.split(" ")[0] if " " in str(ts) else (ts.split("T")[0] if "T" in str(ts) else str(ts)[:10])
                
                weight = float(item.get("weight", 0) or item.get("weight_kg", 0))
                fat = float(item.get("bodyfat", 0) or item.get("body_fat_percent", 0) or item.get("subcutaneous_fat", 0))
                muscle = float(item.get("muscle", 0) or item.get("muscle_mass_kg", 0) or item.get("muscle_mass", 0))
                bmi = float(item.get("bmi", 0))
                water = float(item.get("water", 0) or item.get("water_percent", 0))
                visceral = int(item.get("visfat", 0) or item.get("visceral_fat", 0) or item.get("visceral", 0))
                metabolic_age = int(item.get("bodyage", 0) or item.get("metabolic_age", 0) or item.get("body_age", 0))
                bone = float(item.get("bone", 0) or item.get("bone_mass", 0))
                bmr = int(item.get("bmr", 0))

                measurements.append({
                    "timestamp": ts,
                    "date": date_str,
                    "weight_kg": weight,
                    "body_fat_percent": fat,
                    "muscle_mass_kg": muscle,
                    "bmi": bmi,
                    "water_percent": water,
                    "visceral_fat": visceral,
                    "metabolic_age": metabolic_age,
                    "bone_mass_kg": bone,
                    "bmr": bmr,
                    "raw": item
                })
            
            measurements.sort(key=lambda x: x["timestamp"])

            data = {
                "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "is_sample_data": False,
                "measurements": measurements
            }
            print(f"🎉 Se obtuvieron {len(measurements)} mediciones reales de Renpho.")
        except Exception as e:
            print(f"❌ Error al consultar API de Renpho: {e}")
            print("💡 Generando fallback con datos de muestra...")
            data = generate_sample_data()

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"💾 Archivo guardado correctamente en: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
