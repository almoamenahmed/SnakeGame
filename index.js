const express = require('express');
const path = require('path');
const db = require('./server'); // This imports the db connection from server.js
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/submit-score', (req, res) => {
    db.query('INSERT INTO scores SET ?', req.body, (error, results) => {
        if (error) {
            // Send a JSON response with an error message
            res.status(500).json({ message: "Internal server error" });
        } else {
            // Send a JSON response indicating success
            res.status(200).json({ message: "Score submitted successfully" });
        }
    });
});

app.get('/high-scores', (req, res) => {
    const query = 'SELECT * FROM scores ORDER BY score DESC LIMIT 10';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Error retrieving scores');
        } else {
            res.json(results);
        }
    });
});

// Server-side endpoint to clear scores
app.post('/clear-scores', (req, res) => {
    db.query('TRUNCATE TABLE scores', (error, results) => {
        if (error) {
            console.error('Failed to clear scores:', error);
            res.status(500).json({ message: "Internal server error" });
        } else {
            console.log('Scores cleared successfully');
            res.status(200).json({ message: "Scores cleared successfully" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
