const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router = require('express').Router();
const PORT = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')



router.get('/totalRecovered', async (req, res) => {
    try {
        const data = await connection.aggregate([
            { $group: { _id: "total", recovered: { $sum: "$recovered" } } }
        ])
        res.send(data);
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/totalActive', async (req, res) => {
    try {
        const active = await connection.aggregate([
            {
                $group: {
                    _id: "total", active: {
                        $sum: {
                            $subtract: ["$infected", "$recovered"]
                        }
                    }
                }
            }
        ])
        res.send(active);
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/totalDeath', async (req, res) => {
    try {
        const data = await connection.aggregate([
            { $group: { _id: "total", death: { $sum: "$death" } } }
        ])
        res.send(data);
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/hotspotStates', async (req, res) => {
    try {
        const data = await connection.aggregate([
            {
                $addFields: {
                    rate: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $subtract: ["$infected", "$recovered"],
                                    }, "$infected"
                                ],
                            },
                            5,
                        ],
                    }
                }
            },
            {
                $match: { rate: { $gt: 0.1 } },
            },
            {
                $project: {
                    _id: 0,
                    state: 1,
                    rate: 1
                }
            }
        ])
        res.send(data);
    } catch (err) {
        res.send(err.message)
    }
})

router.get('/healthyStates', async (req, res) => {
    try {
        const data = await connection.aggregate([
            {
                $addFields: {
                    mortality: {
                        $round: [
                            {
                                $divide: [
                                    "$death", "$infected"
                                ]
                            }, 5
                        ]
                    }
                }
            }, {
                $match: {
                    mortality: { $lt: 0.05 }
                }
            }, {
                $project: {
                    _id: 0,
                    state: 1,
                    mortality: 1
                }
            }
        ])
        res.send(data);
    } catch (err) {
        res.send(err.message)
    }
})



module.exports = router;




app.listen(port, () => console.log(`App listening on port ${PORT}!`))

module.exports = app;