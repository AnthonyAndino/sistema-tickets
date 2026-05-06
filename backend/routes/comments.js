const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

// Obtener comentarios de un ticket
router.get('/:ticketId', verificarToken, (req, res) => {
    const { ticketId } = req.params;
    
    db.query(`SELECT comentarios.*, usuarios.username 
               FROM comentarios 
               LEFT JOIN usuarios ON comentarios.user_id = usuarios.id 
               WHERE ticket_id = ? 
               ORDER BY fecha ASC`, [ticketId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Agregar comentario
router.post('/', verificarToken, (req, res) => {
    const { ticket_id, comentario } = req.body;
    
    if (!ticket_id || !comentario) {
        return res.status(400).json({ error: 'Ticket y comentario son obligatorios' });
    }
    
    db.query('INSERT INTO comentarios (ticket_id, user_id, comentario) VALUES (?, ?, ?)', 
        [ticket_id, req.user.id, comentario], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Comentario agregado correctamente' });
        });
});

module.exports = router;
