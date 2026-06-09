from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import requests
import json
from datetime import datetime, timedelta
import hashlib
import re

app = Flask(__name__)
CORS(app)

DB_PATH = 'shivanetra.db'

# NASA Horizons API Planet IDs
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
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        birth_day INTEGER,
        birth_month INTEGER,
        birth_year INTEGER,
        birth_place TEXT
    )''')
    
    # Predictions table (90+ predictions database)
    c.execute('''CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY,
        category TEXT,
        text TEXT,
        planet_id TEXT
    )''')
    
    # Planet positions cache
    c.execute('''CREATE TABLE IF NOT EXISTS planet_cache (
        id INTEGER PRIMARY KEY,
        planet_name TEXT,
        longitude REAL,
        latitude REAL,
        updated_at TIMESTAMP
    )''')
    
    # Insert prediction database if empty
    c.execute("SELECT COUNT(*) FROM predictions")
    if c.fetchone()[0] == 0:
        predictions = [
            # Daily predictions (30)
            ("daily", "The stars align for prosperity. Trust the journey ahead.", "Sun"),
            ("daily", "Wisdom from ancestors guides your decisions today.", "Moon"),
            ("daily", "Financial abundance flows toward unexpected sources.", "Jupiter"),
            ("daily", "Love and compassion bring healing to relationships.", "Venus"),
            ("daily", "Creative projects reach breakthrough moments.", "Mercury"),
            ("daily", "Health improves with mindful practices and rest.", "Sun"),
            ("daily", "Career opportunities knock at your door.", "Saturn"),
            ("daily", "Travel plans manifest positively.", "Jupiter"),
            ("daily", "Spiritual growth accelerates through meditation.", "Moon"),
            ("daily", "Family bonds strengthen through honest communication.", "Venus"),
            ("daily", "New friendships bring joy and support.", "Mercury"),
            ("daily", "Hidden talents emerge; express yourself freely.", "Sun"),
            ("daily", "Patience rewards you with unexpected gifts.", "Saturn"),
            ("daily", "Let go of old patterns that no longer serve you.", "Ketu"),
            ("daily", "The Universe supports your boldest dreams.", "Jupiter"),
            ("daily", "Forgiveness liberates your soul today.", "Moon"),
            ("daily", "Gratitude multiplies your blessings.", "Venus"),
            ("daily", "A message from a loved one arrives unexpectedly.", "Mercury"),
            ("daily", "Your intuition is heightened; trust your gut.", "Moon"),
            ("daily", "Success comes through collaboration, not competition.", "Venus"),
            ("daily", "Rest is as productive as action today.", "Sun"),
            ("daily", "A door closes so a better one can open.", "Saturn"),
            ("daily", "You are exactly where you need to be.", "Jupiter"),
            ("daily", "Kindness you share returns threefold.", "Venus"),
            ("daily", "Nature brings you peace and clarity.", "Moon"),
            ("daily", "A financial decision made today yields future rewards.", "Mercury"),
            ("daily", "Your leadership inspires others.", "Sun"),
            ("daily", "Learning something new brings unexpected joy.", "Mercury"),
            ("daily", "Home improvements bring harmony to family life.", "Venus"),
            ("daily", "A long-held wish begins to manifest.", "Jupiter"),
            # Weekly predictions (25)
            ("weekly", "This week brings clarity to confusing situations. Trust the process.", "Mercury"),
            ("weekly", "Mars energy boosts your motivation. Start new projects with confidence.", "Mars"),
            ("weekly", "Mercury brings important messages. Listen carefully to all communications.", "Mercury"),
            ("weekly", "Venus blesses relationships. Express love openly this week.", "Venus"),
            ("weekly", "Jupiter expands your horizons. Travel or learn something new.", "Jupiter"),
            ("weekly", "Saturn teaches discipline. Focus on long-term goals.", "Saturn"),
            ("weekly", "Full moon reveals hidden emotions. Journal your feelings.", "Moon"),
            ("weekly", "New moon energy is perfect for setting powerful intentions.", "Moon"),
            ("weekly", "Opportunities come through unexpected connections.", "Jupiter"),
            ("weekly", "Financial review recommended. Budget wisely this week.", "Mercury"),
            ("weekly", "Health improvements begin with small daily habits.", "Sun"),
            ("weekly", "Career breakthroughs happen mid-week.", "Saturn"),
            ("weekly", "Family matters resolve harmoniously.", "Venus"),
            ("weekly", "Creative inspiration strikes unexpectedly.", "Mercury"),
            ("weekly", "Let go of what weighs you down.", "Ketu"),
            ("weekly", "A conversation changes your perspective.", "Mercury"),
            ("weekly", "Patience with yourself is key this week.", "Moon"),
            ("weekly", "Celebrate small victories along the way.", "Jupiter"),
            ("weekly", "Trust divine timing in all matters.", "Saturn"),
            ("weekly", "Your energy attracts aligned opportunities.", "Sun"),
            ("weekly", "Restorative sleep brings mental clarity.", "Moon"),
            ("weekly", "A financial gift or refund arrives.", "Jupiter"),
            ("weekly", "Professional recognition comes your way.", "Saturn"),
            ("weekly", "Old wounds heal through forgiveness.", "Venus"),
            ("weekly", "New romance or friendship blossoms.", "Venus"),
            # Monthly predictions (25)
            ("monthly", "This month brings major career developments and recognition.", "Saturn"),
            ("monthly", "Relationships deepen significantly this month.", "Venus"),
            ("monthly", "Financial abundance flows toward you from multiple sources.", "Jupiter"),
            ("monthly", "Health improvements with consistent effort and self-care.", "Sun"),
            ("monthly", "Creative projects reach successful completion.", "Mercury"),
            ("monthly", "Spiritual awakening possible this month.", "Moon"),
            ("monthly", "Travel opportunities present themselves unexpectedly.", "Jupiter"),
            ("monthly", "Family matters resolve with love and understanding.", "Venus"),
            ("monthly", "Educational pursuits bring great rewards.", "Mercury"),
            ("monthly", "Legal matters conclude favorably in your interest.", "Saturn"),
            ("monthly", "Home improvements increase property value and happiness.", "Venus"),
            ("monthly", "Business partnerships flourish with clear communication.", "Mercury"),
            ("monthly", "Personal growth accelerates through challenges.", "Saturn"),
            ("monthly", "Manifestation power is at its peak.", "Moon"),
            ("monthly", "Past karma clears, bringing fresh starts.", "Ketu"),
            ("monthly", "A mentor or guide appears in your life.", "Jupiter"),
            ("monthly", "Your leadership inspires positive change.", "Sun"),
            ("monthly", "Community involvement brings recognition.", "Mercury"),
            ("monthly", "Technology upgrades improve daily life.", "Mercury"),
            ("monthly", "A dream you forgot becomes reality.", "Moon"),
            ("monthly", "Patience through difficulty brings wisdom.", "Saturn"),
            ("monthly", "Your unique perspective solves old problems.", "Sun"),
            ("monthly", "Generosity attracts unexpected returns.", "Jupiter"),
            ("monthly", "Inner peace becomes your greatest strength.", "Moon"),
            ("monthly", "The universe aligns in your favor.", "Jupiter")
        ]
        for cat, text, planet in predictions:
            c.execute("INSERT INTO predictions (category, text, planet_id) VALUES (?, ?, ?)", (cat, text, planet))
    
    conn.commit()
    conn.close()

def fetch_nasa_planet(planet_id, planet_name):
    """Fetch real planet position from NASA Horizons API"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='{planet_id}'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'result' in data:
                result_text = data['result']
                lines = result_text.split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            return float(match.group(1))
                    if line.strip() and line.strip()[0].isdigit():
                        parts = line.split()
                        if len(parts) >= 4:
                            try:
                                lon = float(parts[3])
                                if 0 <= lon <= 360:
                                    return lon
                            except:
                                pass
        return None
    except Exception as e:
        print(f"Error fetching {planet_name}: {e}")
        return None

def fetch_lunar_nodes():
    """Fetch Rahu (North Node)"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='N8'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'result' in data:
                lines = data['result'].split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            return float(match.group(1))
        return None
    except:
        return None

@app.route('/api/planets', methods=['GET'])
def get_planets():
    """Get real-time planet positions from NASA API with 1-hour cache"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check cache
    c.execute("SELECT planet_name, longitude, updated_at FROM planet_cache ORDER BY updated_at DESC LIMIT 1")
    cache = c.fetchone()
    
    if cache:
        cache_time = datetime.fromisoformat(cache[2])
        if datetime.now() - cache_time < timedelta(hours=1):
            c.execute("SELECT planet_name, longitude FROM planet_cache")
            rows = c.fetchall()
            conn.close()
            result = {row[0]: {'longitude': row[1]} for row in rows}
            return jsonify({'status': 'success', 'data': result, 'source': 'cache', 'time': cache[2]})
    
    # Fetch fresh from NASA
    result = {}
    for name, pid in PLANET_IDS.items():
        lon = fetch_nasa_planet(pid, name)
        if lon is not None:
            result[name] = {'longitude': lon}
    
    # Get lunar nodes
    rahu = fetch_lunar_nodes()
    if rahu:
        result['Rahu'] = {'longitude': rahu}
        result['Ketu'] = {'longitude': (rahu + 180) % 360}
    
    # Save to cache
    c.execute("DELETE FROM planet_cache")
    for name, data in result.items():
        c.execute("INSERT INTO planet_cache (planet_name, longitude, updated_at) VALUES (?, ?, ?)",
                  (name, data['longitude'], datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'data': result, 'source': 'nasa_api', 'time': datetime.now().isoformat()})

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get predictions from database"""
    category = request.args.get('category', 'daily')
    planet = request.args.get('planet', 'Sun')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT text FROM predictions WHERE category=? ORDER BY RANDOM() LIMIT 1", (category,))
    pred = c.fetchone()
    conn.close()
    
    return jsonify({'prediction': pred[0] if pred else "The stars are aligned for you today."})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except:
        conn.close()
        return jsonify({'success': False})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, username FROM users WHERE username=? AND password=?", (username, password))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({'success': True, 'username': user[1]})
    return jsonify({'success': False})

@app.route('/api/save_profile', methods=['POST'])
def save_profile():
    data = request.json
    username = data.get('username')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET birth_day=?, birth_month=?, birth_year=?, birth_place=? WHERE username=?",
              (data.get('birth_day'), data.get('birth_month'), data.get('birth_year'), data.get('birth_place'), username))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/get_profile/<username>', methods=['GET'])
def get_profile(username):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT birth_day, birth_month, birth_year, birth_place FROM users WHERE username=?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({'birth_day': user[0], 'birth_month': user[1], 'birth_year': user[2], 'birth_place': user[3]})
    return jsonify({})

if __name__ == '__main__':
    init_db()
    print("🚀 Shivanetra V12 Backend Server Running")
    print("📍 API: http://localhost:5000/api/planets")
    print("📍 Predictions: http://localhost:5000/api/predictions")
    app.run(host='0.0.0.0', port=5000, debug=True)
