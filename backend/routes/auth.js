const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = "secreto123";

//registro
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';

    db.query(sql, [username, hashed], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Usuario registrado' });
    });
});

//login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length === 0) {
            return res.status(400).json({ error: 'Usuario no existe' });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ error: 'Constraseña incorrecta' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '2h' });

        res.json({ token });
    });
});

module.exports = router;