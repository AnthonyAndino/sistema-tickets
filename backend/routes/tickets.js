const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roleMiddleware');

// Crear ticket (admin y usuario) - se asigna automaticamente al jefe
router.post('/', verificarToken, (req, res) => {
    const { titulo, descripcion } = req.body;

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
        
        const sql = 'INSERT INTO tickets (titulo, descripcion, estado, tecnico_id, user_id) VALUES (?, ?, "Pendiente", ?, ?)';

        db.query(sql, [titulo, descripcion, jefeId, req.user.id], (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({ mensaje: 'Ticket creado y asignado al jefe' });
        });
    });
});

// Obtener tickets con filtros (admin ve todos, usuario ve solo los suyos)
router.get('/', verificarToken, (req, res) => {
    let sql = `SELECT tickets.*, tecnicos.nombre AS tecnico, usuarios.username 
               FROM tickets 
               LEFT JOIN tecnicos ON tickets.tecnico_id = tecnicos.id
               LEFT JOIN usuarios ON tickets.user_id = usuarios.id`;
    let params = [];
    let conditions = [];
    
    // Si no es admin, solo sus tickets
    if (req.user.rol !== 'admin') {
        conditions.push('tickets.user_id = ?');
        params.push(req.user.id);
    }
    
    // Filtro por estado
    if (req.query.estado) {
        conditions.push('tickets.estado = ?');
        params.push(req.query.estado);
    }
    
    // Filtro por tecnico
    if (req.query.tecnico_id) {
        conditions.push('tickets.tecnico_id = ?');
        params.push(req.query.tecnico_id);
    }
    
    // Filtro por prioridad
    if (req.query.prioridad) {
        conditions.push('tickets.prioridad = ?');
        params.push(req.query.prioridad);
    }
    
    // Búsqueda por título o descripción
    if (req.query.busqueda) {
        conditions.push('(tickets.titulo LIKE ? OR tickets.descripcion LIKE ?)');
        params.push(`%${req.query.busqueda}%`, `%${req.query.busqueda}%`);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY FIELD(prioridad, "Urgente", "Alta", "Media", "Baja")';
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
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
