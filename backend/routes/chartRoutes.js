const express = require('express');
const router = express.Router();
const { getCompleteChartData, getNakshatra, getZodiacSign } = require('../services/planetaryEngine');
const { getCompleteNumerology } = require('../services/numerologyService');

/**
 * POST /api/chart/calculate
 * Returns complete chart + numerology
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
            timezoneOffset = 5.5,
            gender = 'M'
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

        // Calculate numerology
        const numerology = getCompleteNumerology({
            name: name || 'Guest',
            birthDate,
            gender
        });

        // Find Moon position for Nakshatra
        const moonPlanet = chartData.planets.find(p => p.name === 'Moon');
        const nakshatra = moonPlanet ? getNakshatra(moonPlanet.longitude) : null;

        // Add zodiac signs to planets
        const planetsWithSigns = chartData.planets.map(planet => ({
            ...planet,
            zodiacSign: getZodiacSign(planet.longitude)
        }));

        const sunPlanet = chartData.planets.find(p => p.name === 'Sun');
        const sunSign = sunPlanet ? getZodiacSign(sunPlanet.longitude) : 'Unknown';

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
            },
            numerology: numerology
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

router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Shivanetra V12 Chart Service',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
