/**
 * MARDUKH SYSTEM™ - Shivanetra V12
 * Chart Routes API Endpoints
 * Receives birth data, returns calculated chart
 */

const express = require('express');
const router = express.Router();
const { getCompleteChartData, getNakshatra, getZodiacSign } = require('../services/planetaryEngine');

/**
 * POST /api/chart/calculate
 * Body: { name, birthDate, birthTime, latitude, longitude, location, timezoneOffset }
 * Returns: Complete calculated chart data
 */
router.post('/calculate', async (req, res) => {
    try {
        const {
            name,
            birthDate,
            birthTime,
            latitude,
            longitude,
            location,
            timezoneOffset = 5.5
        } = req.body;

        // Validation
        if (!birthDate || !birthTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required: birthDate and birthTime'
            });
        }

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required: latitude and longitude'
            });
        }

        // Calculate chart data
        const chartData = getCompleteChartData({
            birthDate,
            birthTime,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timezoneOffset
        });

        // Find Moon position for Nakshatra
        const moonPlanet = chartData.planets.find(p => p.name === 'Moon');
        const nakshatra = moonPlanet ? getNakshatra(moonPlanet.longitude) : null;

        // Add zodiac signs to planets
        const planetsWithSigns = chartData.planets.map(planet => ({
            ...planet,
            zodiacSign: getZodiacSign(planet.longitude),
            zodiacSymbol: getZodiacSymbol(planet.longitude)
        }));

        // Find Sun sign for basic horoscope
        const sunPlanet = chartData.planets.find(p => p.name === 'Sun');
        const sunSign = sunPlanet ? getZodiacSign(sunPlanet.longitude) : 'Unknown';

        // Prepare response
        const response = {
            success: true,
            user: {
                name: name || 'Guest',
                birthDate,
                birthTime,
                location: location || 'Unknown',
                latitude,
                longitude
            },
            chart: {
                ascendant: chartData.ascendant,
                ascendantSign: getZodiacSign(chartData.ascendant),
                houses: chartData.houses,
                planets: planetsWithSigns,
                nakshatra: nakshatra,
                sunSign: sunSign,
                julianDay: chartData.julianDay,
                calculatedAt: chartData.timestamp
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Chart calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during chart calculation',
            message: error.message
        });
    }
});

/**
 * GET /api/chart/health
 * Health check for chart service
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Shivanetra V12 Chart Service',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

/**
 * Helper: Get zodiac symbol
 */
function getZodiacSymbol(longitude) {
    const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    const index = Math.floor(longitude / 30) % 12;
    return symbols[index];
}

module.exports = router;
