from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
import json
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)  # This allows your HTML to call this backend

DB_PATH = 'planets.db'

# Planet IDs for NASA Horizons API
PLANET_IDS = {
    'Sun': '10',
    'Moon': '301', 
    'Mercury': '199',
    'Venus': '299',
    'Mars': '499',
    'Jupiter': '599',
    'Saturn': '699'
}

def init_db():
    """Create database table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS planet_positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planet_name TEXT,
            longitude REAL,
            latitude REAL,
            distance REAL,
            updated_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_cached_data():
    """Get cached data if less than 1 hour old"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT planet_name, longitude, updated_at FROM planet_positions 
        ORDER BY updated_at DESC LIMIT 1
    ''')
    row = cursor.fetchone()
    conn.close()
    
    if row:
        cache_time = datetime.fromisoformat(row[2])
        if datetime.now() - cache_time < timedelta(hours=1):
            return True
    return False

def fetch_from_nasa(planet_id, planet_name):
    """Fetch a single planet from NASA Horizons API"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='{planet_id}'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'result' in data:
                # Parse the result text to find ecliptic longitude
                result_text = data['result']
                lines = result_text.split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        import re
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            lon = float(match.group(1))
                            return lon
                    # Alternative parsing: look for tabular data
                    if line.strip() and not line.startswith('$$') and not line.startswith('245'):
                        parts = line.split()
                        if len(parts) >= 4 and parts[0].isdigit():
                            try:
                                lon = float(parts[3])
                                return lon
                            except:
                                pass
        return None
    except Exception as e:
        print(f"Error fetching {planet_name}: {e}")
        return None

def fetch_lunar_nodes():
    """Fetch Rahu (North Node) from NASA"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='N8'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'result' in data:
                result_text = data['result']
                lines = result_text.split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        import re
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            return float(match.group(1))
        return None
    except Exception as e:
        print(f"Error fetching lunar nodes: {e}")
        return None

def save_to_db(planet_data):
    """Save planet positions to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM planet_positions')  # Clear old data
    
    for planet, data in planet_data.items():
        cursor.execute('''
            INSERT INTO planet_positions (planet_name, longitude, latitude, distance, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (planet, data['longitude'], 0, 0, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()

@app.route('/api/planets', methods=['GET'])
def get_planets():
    """Main API endpoint - returns all planet positions"""
    
    # Check if we have fresh cache
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT planet_name, longitude, updated_at FROM planet_positions 
        ORDER BY updated_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    use_cache = False
    if rows:
        cache_time = datetime.fromisoformat(rows[0][2])
        if datetime.now() - cache_time < timedelta(hours=1):
            use_cache = True
    
    if use_cache and rows:
        # Return cached data
        result = {}
        for row in rows:
            result[row[0]] = {'longitude': row[1]}
        return jsonify({'status': 'success', 'data': result, 'cached': True, 'time': rows[0][2]})
    
    # Fetch fresh from NASA
    print("Fetching fresh data from NASA API...")
    planet_data = {}
    
    # Fetch each planet
    for name, pid in PLANET_IDS.items():
        print(f"Fetching {name}...")
        lon = fetch_from_nasa(pid, name)
        if lon is not None:
            planet_data[name] = {'longitude': lon}
        else:
            # Fallback to calculated position
            planet_data[name] = {'longitude': calculate_fallback(name)}
    
    # Fetch Rahu and Ketu
    rahu = fetch_lunar_nodes()
    if rahu is not None:
        planet_data['Rahu'] = {'longitude': rahu}
        planet_data['Ketu'] = {'longitude': (rahu + 180) % 360}
    else:
        planet_data['Rahu'] = {'longitude': calculate_fallback('Rahu')}
        planet_data['Ketu'] = {'longitude': (planet_data['Rahu']['longitude'] + 180) % 360}
    
    # Save to database
    save_to_db(planet_data)
    
    return jsonify({
        'status': 'success', 
        'data': planet_data, 
        'cached': False, 
        'time': datetime.now().isoformat()
    })

def calculate_fallback(planet):
    """Fallback calculation if NASA API fails"""
    from datetime import datetime
    d = (datetime.now() - datetime(2000, 1, 1)).days
    
    rates = {
        'Sun': 0.9856, 'Moon': 13.176, 'Mercury': 4.092,
        'Venus': 1.602, 'Mars': 0.524, 'Jupiter': 0.083,
        'Saturn': 0.033, 'Rahu': 0.1114
    }
    offsets = {
        'Sun': 280, 'Moon': 218, 'Mercury': 174, 'Venus': 50,
        'Mars': 355, 'Jupiter': 34, 'Saturn': 50, 'Rahu': 125
    }
    rate = rates.get(planet, 0.1)
    offset = offsets.get(planet, 0)
    return (offset + rate * d) % 360

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Shivanetra V12 Backend Running'})

if __name__ == '__main__':
    init_db()
    print("🚀 Shivanetra V12 Backend Starting...")
    print("📍 API available at: http://localhost:5000/api/planets")
    app.run(host='0.0.0.0', port=5000, debug=True)
