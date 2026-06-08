/**
 * MARDUKH SYSTEM™ - Shivanetra V12
 * Numerology Service: Kabbalah, Chinese Astrology, Kundalini
 */

/**
 * Calculate Life Path Number (Western Numerology)
 */
function getLifePathNumber(birthDate) {
    const [year, month, day] = birthDate.split('-').map(Number);
    let sum = day + month + year;
    while (sum > 9) {
        sum = Math.floor(sum / 10) + (sum % 10);
    }
    return sum;
}

/**
 * Calculate Soul Urge Number (Vowels of name)
 */
function getSoulUrgeNumber(name) {
    const vowels = { a: 1, e: 5, i: 9, o: 6, u: 3, A: 1, E: 5, I: 9, O: 6, U: 3 };
    let sum = 0;
    for (let char of name) {
        if (vowels[char]) sum += vowels[char];
    }
    while (sum > 9) {
        sum = Math.floor(sum / 10) + (sum % 10);
    }
    return sum || 1;
}

/**
 * Kabbalah Number (Reduction to single digit)
 */
function getKabbalahNumber(num) {
    let n = Math.abs(num);
    while (n > 9) {
        n = Math.floor(n / 10) + (n % 10);
    }
    return n;
}

/**
 * Kabbalah Tree of Life Association
 */
function getKabbalahSphere(number) {
    const spheres = {
        1: { name: 'Kether (Crown)', planet: 'Neptune', meaning: 'Divine Will' },
        2: { name: 'Chokmah (Wisdom)', planet: 'Uranus', meaning: 'Inspiration' },
        3: { name: 'Binah (Understanding)', planet: 'Saturn', meaning: 'Structure' },
        4: { name: 'Chesed (Mercy)', planet: 'Jupiter', meaning: 'Compassion' },
        5: { name: 'Geburah (Strength)', planet: 'Mars', meaning: 'Power' },
        6: { name: 'Tiphareth (Beauty)', planet: 'Sun', meaning: 'Harmony' },
        7: { name: 'Netzach (Victory)', planet: 'Venus', meaning: 'Emotion' },
        8: { name: 'Hod (Splendor)', planet: 'Mercury', meaning: 'Intellect' },
        9: { name: 'Yesod (Foundation)', planet: 'Moon', meaning: 'Intuition' }
    };
    return spheres[number] || { name: 'Malkuth (Kingdom)', planet: 'Earth', meaning: 'Manifestation' };
}

/**
 * Chinese Zodiac Sign from year
 */
function getChineseZodiac(year) {
    const animals = [
        'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
        'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
    ];
    const index = (year - 1900) % 12;
    return animals[index];
}

/**
 * Chinese Five Elements from year
 */
function getChineseElement(year) {
    const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const index = Math.floor((year - 1900) / 2) % 5;
    return elements[index];
}

/**
 * Chinese Yin/Yang from year
 */
function getYinYang(year) {
    return year % 2 === 0 ? 'Yang' : 'Yin';
}

/**
 * BaZi (Four Pillars) - Simplified
 */
function getBazi(birthDate, birthTime) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const hour = parseInt(birthTime.split(':')[0]);
    
    // Simplified BaZi calculation
    const heavenlyStems = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
    const earthlyBranches = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
    
    const yearStem = (year - 4) % 10;
    const yearBranch = (year - 4) % 12;
    const hourBranch = Math.floor(hour / 2) % 12;
    
    return {
        yearPillar: `${heavenlyStems[yearStem]} ${earthlyBranches[yearBranch]}`,
        hourPillar: `${heavenlyStems[(yearStem + hourBranch) % 10]} ${earthlyBranches[hourBranch]}`,
        earthlyBranches: {
            year: earthlyBranches[yearBranch],
            hour: earthlyBranches[hourBranch]
        }
    };
}

/**
 * Kua Number (Feng Shui)
 */
function getKuaNumber(year, gender = 'M') {
    let y = year % 100;
    let sum = Math.floor(y / 10) + (y % 10);
    while (sum > 9) {
        sum = Math.floor(sum / 10) + (sum % 10);
    }
    let kua;
    if (gender === 'M') {
        kua = 10 - sum;
    } else {
        kua = 5 + sum;
    }
    if (kua > 9) kua = kua - 9;
    if (kua === 5) kua = gender === 'M' ? 2 : 8;
    return kua;
}

/**
 * Kua Directions (Good/Bad)
 */
function getKuaDirections(kuaNumber) {
    const directions = {
        1: { good: ['SE', 'E', 'S', 'N'], bad: ['W', 'NW', 'NE', 'SW'] },
        2: { good: ['NE', 'W', 'NW', 'SW'], bad: ['E', 'SE', 'S', 'N'] },
        3: { good: ['S', 'N', 'SE', 'E'], bad: ['SW', 'NE', 'W', 'NW'] },
        4: { good: ['N', 'S', 'E', 'SE'], bad: ['NW', 'SW', 'NE', 'W'] },
        6: { good: ['W', 'NE', 'NW', 'SW'], bad: ['E', 'SE', 'S', 'N'] },
        7: { good: ['NW', 'SW', 'NE', 'W'], bad: ['SE', 'E', 'N', 'S'] },
        8: { good: ['SW', 'NW', 'W', 'NE'], bad: ['N', 'S', 'E', 'SE'] },
        9: { good: ['E', 'SE', 'N', 'S'], bad: ['W', 'NE', 'SW', 'NW'] }
    };
    return directions[kuaNumber] || directions[1];
}

/**
 * Kundalini Five Numbers
 */
function getKundaliniFive(birthDate) {
    const [year, month, day] = birthDate.split('-').map(Number);
    
    // Soul Number (day)
    let soul = day;
    while (soul > 9) soul = Math.floor(soul / 10) + (soul % 10);
    if (soul === 0) soul = 9;
    
    // Karma Number (month)
    let karma = month;
    while (karma > 9) karma = Math.floor(karma / 10) + (karma % 10);
    if (karma === 0) karma = 9;
    
    // Destiny Number (day + month + year)
    let destiny = day + month + year;
    while (destiny > 9) destiny = Math.floor(destiny / 10) + (destiny % 10);
    if (destiny === 0) destiny = 9;
    
    // Path Number (soul + karma + destiny)
    let path = soul + karma + destiny;
    while (path > 9) path = Math.floor(path / 10) + (path % 10);
    if (path === 0) path = 9;
    
    // Dharma Number (year)
    let dharma = year;
    while (dharma > 9) dharma = Math.floor(dharma / 10) + (dharma % 10);
    if (dharma === 0) dharma = 9;
    
    return {
        soul,
        karma,
        destiny,
        path,
        dharma,
        description: {
            soul: `Inner self and core desires`,
            karma: `Lessons and challenges`,
            destiny: `Life purpose and direction`,
            path: `The journey and growth`,
            dharma: `Spiritual duty and service`
        }
    };
}

/**
 * Get Complete Numerology Report
 */
function getCompleteNumerology(userData) {
    const { name, birthDate, gender = 'M' } = userData;
    const year = parseInt(birthDate.split('-')[0]);
    
    const lifePath = getLifePathNumber(birthDate);
    const soulUrge = getSoulUrgeNumber(name);
    const kabbalahNum = getKabbalahNumber(lifePath);
    const kabbalahSphere = getKabbalahSphere(kabbalahNum);
    
    const chineseZodiac = getChineseZodiac(year);
    const chineseElement = getChineseElement(year);
    const yinYang = getYinYang(year);
    const bazi = getBazi(birthDate, '12:00:00');
    const kuaNumber = getKuaNumber(year, gender);
    const kuaDirections = getKuaDirections(kuaNumber);
    
    const kundalini = getKundaliniFive(birthDate);
    
    return {
        western: {
            lifePathNumber: lifePath,
            soulUrgeNumber: soulUrge,
            expressionNumber: getKabbalahNumber(lifePath + soulUrge)
        },
        kabbalah: {
            number: kabbalahNum,
            sphere: kabbalahSphere.name,
            planet: kabbalahSphere.planet,
            meaning: kabbalahSphere.meaning
        },
        chinese: {
            zodiac: chineseZodiac,
            element: chineseElement,
            yinYang: yinYang,
            bazi: bazi,
            kua: {
                number: kuaNumber,
                goodDirections: kuaDirections.good,
                badDirections: kuaDirections.bad
            }
        },
        kundalini: kundalini
    };
}

module.exports = {
    getLifePathNumber,
    getSoulUrgeNumber,
    getKabbalahNumber,
    getKabbalahSphere,
    getChineseZodiac,
    getChineseElement,
    getYinYang,
    getBazi,
    getKuaNumber,
    getKuaDirections,
    getKundaliniFive,
    getCompleteNumerology
};
