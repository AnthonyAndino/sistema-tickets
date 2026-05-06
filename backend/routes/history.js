const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

// Obtener historial de un ticket
router.get('/:ticketId', verificarToken, (req, res) => {
    const { ticketId } = req.params;
    
    db.query(`SELECT historial_cambios.*, usuarios.username 
               FROM historial_cambios 
               LEFT JOIN usuarios ON historial_cambios.user_id = usuarios.id 
               WHERE ticket_id = ? 
               ORDER BY fecha DESC`, [ticketId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Registrar cambio (función interna)
function registrarCambio(ticketId, userId, campo, valorAnterior, valorNuevo) {
    if (valorAnterior === valorNuevo) return;
    
    db.query('INSERT INTO historial_cambios (ticket_id, user_id, campo, valor_anterior, valor_nuevo) VALUES (?, ?, ?, ?, ?)',
        [ticketId, userId, campo, valorAnterior, valorNuevo], (err) => {
            if (err) console.error('Error registrando cambio:', err.message);
        });
}

module.exports = { router, registrarCambio };
