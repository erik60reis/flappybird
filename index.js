const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});


/*const sequelize = new Sequelize('mysql://username:your_password@localhost:3306/database_name', {
    dialect: 'mysql',
    logging: false
});*/


const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

sequelize.sync()
    .then(() => {
        console.log('Database and tables synchronized');
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });

app.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await LeaderboardEntry.findAll({
            order: [['score', 'DESC']],
            limit: 20,
            attributes: ['name', 'score']
        });
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/leaderboard', async (req, res) => {
    const { name, score } = req.body;
    try {
        let playerEntry = await LeaderboardEntry.findOne({ where: { name } });

        if (playerEntry) {
            if (score > playerEntry.score) {
                playerEntry.score = score;
                await playerEntry.save();
                res.status(200).json(playerEntry);
            } else {
                res.status(200).json(playerEntry);
            }
        } else {
            const newEntry = await LeaderboardEntry.create({ name, score });
            res.status(201).json(newEntry);
        }
    } catch (error) {
        console.error('Error adding/updating entry in leaderboard:', error);
        res.status(500).json({ error: 'Failed to add/update entry in leaderboard' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
