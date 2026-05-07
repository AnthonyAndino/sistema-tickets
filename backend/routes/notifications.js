const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

// Auto-crear tabla notificaciones si no existe
db.query(`CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    ticket_id INT,
    leida BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
)`, (err) => {
    if (err) console.error('Error creando tabla notificaciones:', err.message);
    else console.log('Tabla notificaciones lista');
});

// Obtener notificaciones del usuario autenticado
router.get('/', verificarToken, (req, res) => {
    const sql = `SELECT notificaciones.*, tickets.titulo as ticket_titulo 
                 FROM notificaciones 
                 LEFT JOIN tickets ON notificaciones.ticket_id = tickets.id 
                 WHERE notificaciones.user_id = ? 
                 ORDER BY fecha DESC 
                 LIMIT 20`;
    
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Obtener conteo de notificaciones no leídas
router.get('/count', verificarToken, (req, res) => {
    db.query('SELECT COUNT(*) as total FROM notificaciones WHERE user_id = ? AND leida = FALSE', 
        [req.user.id], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json({ count: results[0].total });
        });
});

// Marcar todas como leídas
router.put('/leer', verificarToken, (req, res) => {
    db.query('UPDATE notificaciones SET leida = TRUE WHERE user_id = ?', 
        [req.user.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Notificaciones marcadas como leídas' });
        });
});

// Marcar una notificación como leída
router.put('/:id/leer', verificarToken, (req, res) => {
    db.query('UPDATE notificaciones SET leida = TRUE WHERE id = ? AND user_id = ?', 
        [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Notificación leída' });
        });
});

// Función helper para crear notificación (usada por otros módulos)
function crearNotificacion(userId, tipo, mensaje, ticketId = null) {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO notificaciones (user_id, tipo, mensaje, ticket_id) VALUES (?, ?, ?, ?)',
            [userId, tipo, mensaje, ticketId], (err, result) => {
                if (err) {
                    console.error('Error creando notificación:', err.message);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
    });
}

module.exports = router;
module.exports.crearNotificacion = crearNotificacion;
