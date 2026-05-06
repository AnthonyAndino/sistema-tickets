const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

//registro
router.post('/register', async (req, res) => {
    const { username, password, rol } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres' })
    }
    if (password.length < 0) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRole = rol === 'admin' ? 'admin' : 'usuario';

    const sql = 'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)';

    db.query(sql, [username, hashed, userRole], (err) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Usuario registrado' });
    });
});

//login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

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

        const userRole = user.rol || 'usuario';
        const token = jwt.sign({ id: user.id, username: user.username, rol: userRole }, SECRET, { expiresIn: '2h' });

        res.json({ token, username: user.username, rol: userRole });
    });
});

module.exports = router;