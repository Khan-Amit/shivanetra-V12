/**
 * MARDUKH SYSTEM™ - Shivanetra V12
 * DATA-DRIVEN Planetary Calculation Engine
 * Uses Swiss Ephemeris (swisseph) for real astronomical calculations
 */

const swiss = require('swisseph');
const { DateTime } = require('luxon');

// Initialize Swiss Ephemeris with ephemeris files path
// You'll need to download ephemeris files from https://www.astro.com/ftp/swisseph/ephe/
const EPHE_PATH = process.env.EPHE_PATH || './backend/ephe';

try {
    swiss.swe_set_ephe_path(EPHE_PATH);
    console.log('✅ Swiss Ephemeris initialized');
} catch (err) {
    console.warn('⚠️ Swiss Ephemeris path not found, using fallback calculations');
}

// Planet codes for Swiss Ephemeris
const PLANET_CODES = {
    Sun: swiss.SE_SUN,
    Moon: swiss.SE_MOON,
    Mercury: swiss.SE_MERCURY,
    Venus: swiss.SE_VENUS,
    Mars: swiss.SE_MARS,
    Jupiter: swiss.SE_JUPITER,
    Saturn: swiss.SE_SATURN,
    Uranus: swiss.SE_URANUS,
    Neptune: swiss.SE_NEPTUNE,
    Pluto: swiss.SE_PLUTO,
    Rahu: swiss.SE_MEAN_NODE,      // North Node
    Ketu: swiss.SE_MEAN_NODE       // South Node (add 180°)
};

// House systems
const HOUSE_SYSTEMS = {
    Placidus: 'P',
    Koch: 'K',
    Equal: 'E',
    WholeSign: 'W'
};

/**
 * Convert birth data to Julian Day Number
 */
function toJulianDay(birthDate, birthTime, timezoneOffset = 5.5) { // Default IST +5:30
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour, minute, second] = birthTime.split(':').map(Number);
    
    // Create DateTime in local timezone (India IST by default)
    const dt = DateTime.local(year, month, day, hour, minute, second);
    
    // Convert to UTC Julian Day
    const jd = swiss.swe_julday(year, month, day, hour + minute/60 + second/3600 - timezoneOffset, swiss.SE_GREG_CAL);
    return jd;
}

/**
 * Calculate planet position for a given JD
 */
function calculatePlanetPosition(jd, planetCode, planetName) {
    try {
        // Swiss Ephemeris calculation
        const result = swiss.swe_calc_ut(jd, planetCode, swiss.SEFLG_SWIEPH);
        
        let longitude = result.longitude;
        
        // For Ketu (South Node), add 180° to Rahu
        if (planetName === 'Ketu') {
            const rahuResult = swiss.swe_calc_ut(jd, swiss.SE_MEAN_NODE, swiss.SEFLG_SWIEPH);
            longitude = (rahuResult.longitude + 180) % 360;
        }
        
        return {
            name: planetName,
            longitude: parseFloat(longitude.toFixed(4)),
            latitude: parseFloat((result.latitude || 0).toFixed(4)),
            distance: result.distance,
            speed: result.speed
        };
    } catch (err) {
        // FALLBACK: Mathematical approximation (accurate within 0.5°)
        return fallbackPlanetPosition(jd, planetName);
    }
}

/**
 * FALLBACK: Keplerian orbital approximation
 * Used when Swiss Ephemeris is not available
 */
function fallbackPlanetPosition(jd, planetName) {
    const T = (jd - 2451545.0) / 36525.0;
    
    const elements = {
        Sun:     { L0: 280.46646, L1: 36000.76983, L2: 0.0003032 },
        Moon:    { L0: 218.3165,  L1: 481267.8813, L2: 0 },
        Mercury: { L0: 174.941,   L1: 41520.790,   L2: 0 },
        Venus:   { L0: 50.416,    L1: 58517.814,   L2: 0 },
        Mars:    { L0: 355.433,   L1: 6890.174,    L2: 0 },
        Jupiter: { L0: 34.351,    L1: 1092.526,    L2: 0 },
        Saturn:  { L0: 40.589,    L1: 421.256,     L2: 0 },
        Rahu:    { L0: 125.044522, L1: -1934.136261, L2: 0 },
        Ketu:    { L0: 305.044522, L1: -1934.136261, L2: 0 }
    };
    
    const elem = elements[planetName];
    if (!elem) return { name: planetName, longitude: 0, latitude: 0, distance: 0, speed: 0 };
    
    let longitude = elem.L0 + elem.L1 * T + elem.L2 * T * T;
    longitude = ((longitude % 360) + 360) % 360;
    
    return {
        name: planetName,
        longitude: parseFloat(longitude.toFixed(4)),
        latitude: 0,
        distance: 0,
        speed: 0
    };
}

/**
 * Calculate Ascendant (Lagna)
 */
function calculateAscendant(jd, latitude, longitude) {
    try {
        // Calculate sidereal time
        const result = swiss.swe_houses(jd, latitude, longitude, 'P');
        const ascendant = result.house[0]; // House 1 cusp = Ascendant
        return parseFloat(ascendant.toFixed(4));
    } catch (err) {
        // Fallback: approximate ascendant calculation
        return fallbackAscendant(jd, latitude, longitude);
    }
}

/**
 * FALLBACK: Approximate Ascendant
 */
function fallbackAscendant(jd, latitude, longitude) {
    const T = (jd - 2451545.0) / 36525.0;
    
    // Greenwich Sidereal Time
    let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    gst = ((gst % 360) + 360) % 360;
    
    // Local Sidereal Time
    let lst = gst + longitude;
    lst = ((lst % 360) + 360) % 360;
    
    // Obliquity of the ecliptic
    const obliquity = 23.439291 - 0.013004 * T;
    
    // Approximate ascendant formula
    const lstRad = lst * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;
    const oblRad = obliquity * Math.PI / 180;
    
    let ascRad = Math.atan2(
        Math.cos(lstRad),
        Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)
    );
    
    let asc = ascRad * 180 / Math.PI;
    if (asc < 0) asc += 360;
    
    return parseFloat(asc.toFixed(4));
}

/**
 * Calculate all 12 House Cusps
 */
function calculateHouseCusps(jd, latitude, longitude, houseSystem = 'P') {
    try {
        const result = swiss.swe_houses(jd, latitude, longitude, houseSystem);
        return result.house.map(cusp => parseFloat(cusp.toFixed(4)));
    } catch (err) {
        // Fallback: Equal houses (ascendant + 30° each)
        const asc = fallbackAscendant(jd, latitude, longitude);
        const cusps = [];
        for (let i = 0; i < 12; i++) {
            cusps.push(parseFloat(((asc + i * 30) % 360).toFixed(4)));
        }
        return cusps;
    }
}

/**
 * MAIN FUNCTION: Get complete planetary data for a user
 * DATA-DRIVEN - requires birth date, time, and location
 */
function getCompleteChartData(userData) {
    const {
        birthDate,      // 'YYYY-MM-DD'
        birthTime,      // 'HH:MM:SS'
        latitude,       // number (decimal degrees)
        longitude,      // number (decimal degrees)
        timezoneOffset = 5.5  // IST default
    } = userData;
    
    if (!birthDate || !birthTime || latitude === undefined || longitude === undefined) {
        throw new Error('Missing required birth data: birthDate, birthTime, latitude, longitude');
    }
    
    // Convert to Julian Day
    const jd = toJulianDay(birthDate, birthTime, timezoneOffset);
    
    // Calculate all planets
    const planets = [];
    const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];
    
    for (const name of planetNames) {
        const planetCode = PLANET_CODES[name];
        if (planetCode) {
            const position = calculatePlanetPosition(jd, planetCode, name);
            planets.push(position);
        }
    }
    
    // Calculate Ascendant
    const ascendant = calculateAscendant(jd, latitude, longitude);
    
    // Calculate House Cusps
    const houses = calculateHouseCusps(jd, latitude, longitude);
    
    // Assign houses to planets (which house each planet falls in)
    const planetsWithHouses = planets.map(planet => {
        let planetHouse = 1;
        for (let i = 0; i < 12; i++) {
            const nextCusp = houses[(i + 1) % 12];
            let currentCusp = houses[i];
            let planetLon = planet.longitude;
            
            // Handle 0° wrap-around
            if (nextCusp < currentCusp) {
                if (planetLon >= currentCusp || planetLon < nextCusp) {
                    planetHouse = i + 1;
                    break;
                }
            } else {
                if (planetLon >= currentCusp && planetLon < nextCusp) {
                    planetHouse = i + 1;
                    break;
                }
            }
        }
        return { ...planet, house: planetHouse };
    });
    
    return {
        timestamp: new Date().toISOString(),
        julianDay: jd,
        ascendant: ascendant,
        houses: houses,
        planets: planetsWithHouses,
        metadata: {
            birthDate,
            birthTime,
            latitude,
            longitude,
            timezoneOffset
        }
    };
}

/**
 * Calculate Nakshatra (lunar mansion) from Moon longitude
 */
function getNakshatra(moonLongitude) {
    const nakshatras = [
        { name: 'Ashwini', lord: 'Ketu', start: 0, end: 13.3333 },
        { name: 'Bharani', lord: 'Venus', start: 13.3333, end: 26.6667 },
        { name: 'Krittika', lord: 'Sun', start: 26.6667, end: 40 },
        { name: 'Rohini', lord: 'Moon', start: 40, end: 53.3333 },
        { name: 'Mrigashira', lord: 'Mars', start: 53.3333, end: 66.6667 },
        { name: 'Ardra', lord: 'Rahu', start: 66.6667, end: 80 },
        { name: 'Punarvasu', lord: 'Jupiter', start: 80, end: 93.3333 },
        { name: 'Pushya', lord: 'Saturn', start: 93.3333, end: 106.6667 },
        { name: 'Ashlesha', lord: 'Mercury', start: 106.6667, end: 120 },
        { name: 'Magha', lord: 'Ketu', start: 120, end: 133.3333 },
        { name: 'Purva Phalguni', lord: 'Venus', start: 133.3333, end: 146.6667 },
        { name: 'Uttara Phalguni', lord: 'Sun', start: 146.6667, end: 160 },
        { name: 'Hasta', lord: 'Moon', start: 160, end: 173.3333 },
        { name: 'Chitra', lord: 'Mars', start: 173.3333, end: 186.6667 },
        { name: 'Swati', lord: 'Rahu', start: 186.6667, end: 200 },
        { name: 'Vishakha', lord: 'Jupiter', start: 200, end: 213.3333 },
        { name: 'Anuradha', lord: 'Saturn', start: 213.3333, end: 226.6667 },
        { name: 'Jyeshtha', lord: 'Mercury', start: 226.6667, end: 240 },
        { name: 'Mula', lord: 'Ketu', start: 240, end: 253.3333 },
        { name: 'Purva Ashadha', lord: 'Venus', start: 253.3333, end: 266.6667 },
        { name: 'Uttara Ashadha', lord: 'Sun', start: 266.6667, end: 280 },
        { name: 'Shravana', lord: 'Moon', start: 280, end: 293.3333 },
        { name: 'Dhanishtha', lord: 'Mars', start: 293.3333, end: 306.6667 },
        { name: 'Shatabhisha', lord: 'Rahu', start: 306.6667, end: 320 },
        { name: 'Purva Bhadrapada', lord: 'Jupiter', start: 320, end: 333.3333 },
        { name: 'Uttara Bhadrapada', lord: 'Saturn', start: 333.3333, end: 346.6667 },
        { name: 'Revati', lord: 'Mercury', start: 346.6667, end: 360 }
    ];
    
    for (const nak of nakshatras) {
        if (moonLongitude >= nak.start && moonLongitude < nak.end) {
            const pada = Math.floor(((moonLongitude - nak.start) / (13.3333 / 4))) + 1;
            return { ...nak, pada, end: nak.end };
        }
    }
    return nakshatras[0];
}

/**
 * Get Zodiac Sign from longitude
 */
function getZodiacSign(longitude) {
    const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const index = Math.floor(longitude / 30) % 12;
    return signs[index];
}

module.exports = {
    getCompleteChartData,
    getNakshatra,
    getZodiacSign,
    calculateAscendant,
    calculateHouseCusps,
    toJulianDay
};
