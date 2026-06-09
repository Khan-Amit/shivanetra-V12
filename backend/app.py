from flask import Flask, jsonify, request, session
from flask_cors import CORS
import sqlite3
import requests
import json
from datetime import datetime, timedelta
import hashlib
from functools import wraps

app = Flask(__name__)
app.secret_key = 'shivanetra_secret_key_2026'
CORS(app, supports_credentials=True)

DB_PATH = 'shivanetra.db'

# Planet IDs for NASA Horizons
PLANET_IDS = {
    'Sun': '10', 'Moon': '301', 'Mercury': '199', 'Venus': '299',
    'Mars': '499', 'Jupiter': '599', 'Saturn': '699'
}

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        birth_day INTEGER,
        birth_month INTEGER,
        birth_year INTEGER,
        birth_time TEXT,
        birth_place TEXT,
        gender TEXT
    )''')
    
    # Planet cache table
    c.execute('''CREATE TABLE IF NOT EXISTS planet_cache (
        id INTEGER PRIMARY KEY,
        planet_name TEXT,
        longitude REAL,
        updated_at TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()

def fetch_from_nasa(planet_id, planet_name):
    """Fetch real planet position from NASA Horizons API"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='{planet_id}'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            if 'result' in data:
                lines = data['result'].split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        import re
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            return float(match.group(1))
        return None
    except:
        return None

def fetch_lunar_node():
    """Fetch Rahu (North Node)"""
    today = datetime.now().strftime('%Y-%m-%d')
    url = f"https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='N8'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='{today}'&STOP_TIME='{today}+1'&STEP_SIZE='1d'"
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            data = r.json()
            if 'result' in data:
                lines = data['result'].split('\n')
                for line in lines:
                    if 'Ecliptic lon' in line:
                        import re
                        match = re.search(r'Ecliptic lon\s*=\s*([\d\.]+)', line)
                        if match:
                            return float(match.group(1))
        return None
    except:
        return None

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'User created'})
    except:
        conn.close()
        return jsonify({'success': False, 'message': 'Username exists'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = hashlib.sha256(data.get('password').encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, username FROM users WHERE username=? AND password=?', (username, password))
    user = c.fetchone()
    conn.close()
    
    if user:
        session['user_id'] = user[0]
        session['username'] = user[1]
        return jsonify({'success': True, 'username': user[1]})
    return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    if request.method == 'GET':
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT username, birth_day, birth_month, birth_year, birth_time, birth_place, gender FROM users WHERE id=?', (session['user_id'],))
        user = c.fetchone()
        conn.close()
        return jsonify({
            'username': user[0],
            'birth_day': user[1], 'birth_month': user[2], 'birth_year': user[3],
            'birth_time': user[4], 'birth_place': user[5], 'gender': user[6]
        })
    
    else:
        data = request.json
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''UPDATE users SET 
            birth_day=?, birth_month=?, birth_year=?, birth_time=?, birth_place=?, gender=?
            WHERE id=?''', 
            (data.get('birth_day'), data.get('birth_month'), data.get('birth_year'),
             data.get('birth_time'), data.get('birth_place'), data.get('gender'), session['user_id']))
        conn.commit()
        conn.close()
        return jsonify({'success': True})

@app.route('/api/planets', methods=['GET'])
def get_planets():
    # Check cache
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT planet_name, longitude, updated_at FROM planet_cache ORDER BY updated_at DESC LIMIT 1')
    cache = c.fetchone()
    
    use_cache = False
    if cache:
        cache_time = datetime.fromisoformat(cache[2])
        if datetime.now() - cache_time < timedelta(hours=1):
            use_cache = True
    
    if use_cache:
        c.execute('SELECT planet_name, longitude FROM planet_cache')
        rows = c.fetchall()
        conn.close()
        result = {row[0]: {'longitude': row[1]} for row in rows}
        return jsonify({'status': 'success', 'data': result, 'cached': True})
    
    # Fetch fresh from NASA
    result = {}
    for name, pid in PLANET_IDS.items():
        lon = fetch_from_nasa(pid, name)
        if lon:
            result[name] = {'longitude': lon}
    
    # Get lunar nodes
    rahu = fetch_lunar_node()
    if rahu:
        result['Rahu'] = {'longitude': rahu}
        result['Ketu'] = {'longitude': (rahu + 180) % 360}
    
    # Save to cache
    c.execute('DELETE FROM planet_cache')
    for name, data in result.items():
        c.execute('INSERT INTO planet_cache (planet_name, longitude, updated_at) VALUES (?, ?, ?)',
                  (name, data['longitude'], datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'data': result, 'cached': False})

@app.route('/api/check', methods=['GET'])
def check():
    return jsonify({'logged_in': 'user_id' in session, 'username': session.get('username')})

if __name__ == '__main__':
    init_db()
    print("🚀 Shivanetra V12 Backend running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
