// ============================================================
// SHIVANETRA V12 - MASTER PREDICTION DATABASE
// Based on Surya Siddhanta & Feng Shui
// ============================================================

const SHIVANETRA_PREDICTIONS = {
    // 12 HOUSES - Core Meanings
    houses: {
        1: { name: "Tanu Bhava", meaning: "Body", prediction: "Physical appearance, health, ego, life force, true personality" },
        2: { name: "Dhana Bhava", meaning: "Wealth", prediction: "Fixed assets, liquid money, family wealth, speech, values" },
        3: { name: "Sahaja Bhava", meaning: "Siblings", prediction: "Courage, mental strength, willpower, daily effort, short travels" },
        4: { name: "Sukha Bhava", meaning: "Happiness", prediction: "Mother, inner peace, land, vehicles, home, emotional security" },
        5: { name: "Putra Bhava", meaning: "Children", prediction: "Intelligence, past-life karma, romance, creativity" },
        6: { name: "Shatru Bhava", meaning: "Enemies", prediction: "Debts, diseases, obstacles, daily hard work, resolving conflicts" },
        7: { name: "Yuvati Bhava", meaning: "Partnership", prediction: "Marriage, legal spouse, business partners, foreign dealings" },
        8: { name: "Ayur Bhava", meaning: "Longevity", prediction: "Sudden ups/downs, inheritance, secrets, occult, transformation" },
        9: { name: "Dharma Bhava", meaning: "Duty", prediction: "Higher wisdom, religion, luck, philosophy, father" },
        10: { name: "Karma Bhava", meaning: "Action", prediction: "Career, professional success, public reputation, status" },
        11: { name: "Labha Bhava", meaning: "Gains", prediction: "Financial profits, fulfilling desires, older siblings, networks" },
        12: { name: "Vyaya Bhava", meaning: "Loss", prediction: "Expenses, isolation, foreign settlement, subconscious, liberation" }
    },

    // PLANET IN HOUSE PREDICTIONS
    sunInHouse: {
        1: "High ego, strong leadership, robust health, pride/stubbornness",
        2: "Earns through government/authority, harsh speech, family friction",
        3: "Incredible courage, victory over rivals, self-made success",
        4: "High public status, restless home, lacks inner peace",
        5: "Sharp analytical intellect, few children, competitive mindset",
        6: "Crushes enemies, robust immunity, thrives under pressure",
        7: "Dominant spouse, power struggles in marriage",
        8: "Secrets, sudden eye issues, hidden transformations",
        9: "Righteous nature, deep respect for father/teachers",
        10: "Peak professional success, commands authority, leadership status",
        11: "Wealth through networks, influential friends",
        12: "Success far from home, high spiritual isolation, ego detachment"
    },

    moonInHouse: {
        1: "Deep emotional sensitivity, moody, magnetic, charming",
        2: "Fluctuating wealth, sweet-spoken, loves fine dining",
        3: "Artistic intellect, restless mind, loves short travels",
        4: "Deep emotional peace, attached to mother, gains vehicles/land",
        5: "Highly creative, emotionally intuitive, lucky in investments",
        6: "Prone to anxiety/worry, delicate health, drained by conflict",
        7: "Deeply emotional spouse, craves companionship, popular",
        8: "High psychic intuition, sudden emotional shifts, fascinated by occult",
        9: "Philosophical explorer, fortunate mind, spiritual journeys",
        10: "Public-facing career, shifts jobs often, works with people",
        11: "Profits from social crowds, highly collaborative",
        12: "Vivid dreams, profound sleep, feels detached from world"
    },

    jupiterInHouse: {
        1: "Exceptional wisdom, protection, long life, magnetic optimism",
        2: "Immense financial prosperity, eloquent speaker, respected family",
        3: "Highly intellectual, calculated risk-taker, writes with depth",
        4: "Massive domestic happiness, spiritual household, safe home",
        5: "Brilliant wisdom, wonderful children, highly successful student",
        6: "Solves legal/health debts, works in healing, protection from scams",
        7: "Blessed moral spouse, marriage brings spiritual/financial growth",
        8: "Exceptional lifespan, inherits unexpected wealth, esoteric truth",
        9: "Ultimate blessing, high spiritual guide, profound mentor",
        10: "Highly respected profession, trusted advisor, top educator",
        11: "Infinite financial avenues, exceptional prosperity, master networker",
        12: "Guaranteed spiritual liberation, money spent on charity, deep intuition"
    },

    saturnInHouse: {
        1: "Hard childhood, delayed success, highly disciplined, mature",
        2: "Delayed financial accumulation, strict earner, patient savings",
        3: "Tremendous inner willpower, quiet, few siblings, slow victory",
        4: "Heavy domestic duties, detached from childhood home, later real estate",
        5: "Delayed education, analytical mind, heavy responsibilities via children",
        6: "Ultimate conqueror of debts, thrives in daily grind, resilient",
        7: "Delayed marriage (post 28), mature partner, dutiful, unbreakable bond",
        8: "Very long life, avoids accidents, chronic endurance, steady transformation",
        9: "Self-made luck, struggles with dogma, highly moral later in life",
        10: "Unstoppable career rise, immense work ethic, rules organizations",
        11: "Slow systematic financial gains, loyal friends, global impact",
        12: "Excellent controller of waste, solitary focus, structured meditation"
    },

    // FENG SHUI NUMBER PREDICTIONS (1-9)
    fengShuiNumbers: {
        1: { name: "White Water Star", love: "New partner or reclaiming voice", success: "Entrepreneurs, pioneers, overcoming obstacles", health: "Kidneys, ears, manage hydration", luck: "Very Auspicious" },
        2: { name: "Black Earth Star", love: "Slow companionship, stale routines", success: "Land, farming, property wealth", health: "Stomach, digestion, low energy", luck: "Inauspicious" },
        3: { name: "Jade Wood Star", love: "Stormy disagreements, ego clashes", success: "Athletes, litigators, competitive wins", health: "Feet, liver, nervous system", luck: "Volatile" },
        4: { name: "Green Wood Star", love: "Intense poetic romance, Peach Blossom", success: "Students, writers, artists, exams", health: "Thighs, hips, avoid romantic drama", luck: "Auspicious" },
        5: { name: "Yellow Earth Star", love: "Abrupt breakups, external drama", success: "Standstill, financial loss, avoid risks", health: "Core body, inflammation, rest needed", luck: "Highly Dangerous" },
        6: { name: "White Metal Star", love: "Disciplined tradition, elder guidance", success: "Promotions, executive power, mentors", health: "Lungs, head, migraines", luck: "Auspicious" },
        7: { name: "Red Metal Star", love: "Miscommunication, hidden secrets", success: "Financial fraud warning, keep plans confidential", health: "Mouth, teeth, throat strain", luck: "Inauspicious" },
        8: { name: "White Earth Star", love: "Stable practical, lacks passion", success: "Steady reliable accumulation, retain earnings", health: "Hands, spine, minor stiffness", luck: "Neutral-Positive" },
        9: { name: "Purple Fire Star", love: "Engagements, weddings, pure joy", success: "Rapid fame, massive expansion, thriving", health: "Eyes, heart, guard against burnout", luck: "Most Auspicious" }
    },

    // HOUSE GROUPINGS
    houseGroups: {
        dharma: { houses: [1, 5, 9], meaning: "Duty - Life purpose, righteousness" },
        artha: { houses: [2, 6, 10], meaning: "Wealth - Material prosperity" },
        kama: { houses: [3, 7, 11], meaning: "Desire - Fulfillment of wants" },
        moksha: { houses: [4, 8, 12], meaning: "Liberation - Spiritual freedom" }
    },

    // LUCKY ITEMS
    luckyItems: {
        1: { color: "White", direction: "North", element: "Water" },
        2: { color: "Black", direction: "Southwest", element: "Earth" },
        3: { color: "Green", direction: "East", element: "Wood" },
        4: { color: "Green", direction: "Southeast", element: "Wood" },
        5: { color: "Yellow", direction: "Center", element: "Earth" },
        6: { color: "White", direction: "Northwest", element: "Metal" },
        7: { color: "Red", direction: "West", element: "Metal" },
        8: { color: "White", direction: "Northeast", element: "Earth" },
        9: { color: "Purple", direction: "South", element: "Fire" }
    }
};

// Helper Functions
function getHousePrediction(houseNumber) {
    return SHIVANETRA_PREDICTIONS.houses[houseNumber] || null;
}

function getPlanetInHousePrediction(planet, houseNumber) {
    const planetKey = planet.toLowerCase();
    if (planetKey === 'sun') return SHIVANETRA_PREDICTIONS.sunInHouse[houseNumber];
    if (planetKey === 'moon') return SHIVANETRA_PREDICTIONS.moonInHouse[houseNumber];
    if (planetKey === 'jupiter') return SHIVANETRA_PREDICTIONS.jupiterInHouse[houseNumber];
    if (planetKey === 'saturn') return SHIVANETRA_PREDICTIONS.saturnInHouse[houseNumber];
    return "No prediction available";
}

function getFengShuiPrediction(number) {
    return SHIVANETRA_PREDICTIONS.fengShuiNumbers[number] || null;
}

function getLuckyItem(number) {
    return SHIVANETRA_PREDICTIONS.luckyItems[number] || null;
}
