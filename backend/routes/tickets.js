const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roleMiddleware');

// Crear ticket (admin y usuario) - se asigna automaticamente al jefe
router.post('/', verificarToken, (req, res) => {
    const { titulo, descripcion, prioridad } = req.body;

    if (!titulo) {
        return res.status(400).json({ error: 'El titulo es obligatorio' });
    }

    if (typeof titulo !== 'string' || titulo.length > 255) {
        return res.status(400).json({ error: 'El titulo debe ser texto y maximo 255 caracteres' });
    }

    // Obtener el tecnico jefe automaticamente
    db.query('SELECT id FROM tecnicos WHERE es_jefe = TRUE LIMIT 1', (err, results) => {
        if (err) return res.status(500).json(err);
        
        const jefeId = results.length > 0 ? results[0].id : null;
        
        const prioridadFinal = ['Baja', 'Media', 'Alta', 'Urgente'].includes(prioridad) ? prioridad : 'Media';
        const sql = 'INSERT INTO tickets (titulo, descripcion, estado, prioridad, tecnico_id, user_id) VALUES (?, ?, "Pendiente", ?, ?, ?)';

        db.query(sql, [titulo, descripcion, prioridadFinal, jefeId, req.user.id], (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({ mensaje: 'Ticket creado y asignado al jefe' });
        });
    });
});

// Obtener tickets (admin ve todos, usuario ve solo los suyos)
router.get('/', verificarToken, (req, res) => {
    let sql = `SELECT tickets.*, tecnicos.nombre AS tecnico, usuarios.username 
               FROM tickets 
               LEFT JOIN tecnicos ON tickets.tecnico_id = tecnicos.id
               LEFT JOIN usuarios ON tickets.user_id = usuarios.id
               ORDER BY FIELD(prioridad, 'Urgente', 'Alta', 'Media', 'Baja')`;
    let params = [];
    
    if (req.user.rol !== 'admin') {
        sql += ' WHERE tickets.user_id = ?';
        params.push(req.user.id);
    }
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

// Editar ticket (solo admin)
router.put('/:id', verificarToken, verificarRol('admin'), (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, estado, tecnico_id } = req.body;

    let sql = 'UPDATE tickets SET';
    let params = [];
    
    if (titulo !== undefined && titulo !== '') {
        sql += ' titulo = ?,';
        params.push(titulo);
    }
    
    if (descripcion !== undefined && descripcion !== '') {
        sql += ' descripcion = ?,';
        params.push(descripcion);
    }
    
    if (estado) {
        sql += ' estado = ?,';
        params.push(estado);
    }
    
    if (tecnico_id !== undefined) {
        sql += ' tecnico_id = ?,';
        params.push(tecnico_id || null);
    }
    
    // Remover última coma
    sql = sql.replace(/,$/, '');
    sql += ' WHERE id = ?';
    params.push(id);

    if (params.length === 1) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket actualizado' });
    });
});

//eliminar ticket (solo admin)
router.delete('/:id', verificarToken, verificarRol('admin'), (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM tickets WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket eliminado' });
    });
});

module.exports = router;
