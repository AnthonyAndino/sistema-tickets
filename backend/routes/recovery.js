const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '../.env' });
const SECRET = process.env.JWT_SECRET;

// Solicitar recuperación (simulado - solo genera token)
router.post('/solicitar', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Usuario requerido' });
    }
    
    db.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.status(400).json({ error: 'Usuario no existe' });
        }
        
        const user = results[0];
        const token = jwt.sign({ id: user.id, purpose: 'recovery' }, SECRET, { expiresIn: '1h' });
        
        // En un sistema real, aquí se enviaría un email
        // Por ahora, devolvemos el token (solo para pruebas)
        res.json({ mensaje: 'Token generado (simulado)', token });
    });
});

// Restablecer contraseña
router.post('/restablecer', async (req, res) => {
    const { token, nuevaPassword } = req.body;
    
    if (!token || !nuevaPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }
    
    jwt.verify(token, SECRET, async (err, decoded) => {
        if (err || decoded.purpose !== 'recovery') {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }
        
        const hashed = await bcrypt.hash(nuevaPassword, 10);
        
        db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, decoded.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Contraseña actualizada correctamente' });
        });
    });
});

module.exports = router;
