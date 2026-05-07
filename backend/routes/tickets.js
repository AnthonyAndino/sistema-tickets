const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roleMiddleware');
const { crearNotificacion } = require('./notifications');

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

            // Notificar a todos los administradores sobre el nuevo ticket
            const ticketId = result.insertId;
            db.query("SELECT id FROM usuarios WHERE rol = 'admin'", (err2, admins) => {
                if (!err2 && admins) {
                    admins.forEach(admin => {
                        if (admin.id !== req.user.id) {
                            crearNotificacion(
                                admin.id, 
                                'nuevo_ticket', 
                                `${req.user.username} creó un nuevo ticket: "${titulo}" (${prioridadFinal})`, 
                                ticketId
                            );
                        }
                    });
                }
            });

            res.json({ mensaje: 'Ticket creado y asignado al jefe', ticketId });
        });
    });
});

// Obtener tickets (admin ve todos, usuario ve solo los suyos)
router.get('/', verificarToken, (req, res) => {
    let sql = `SELECT tickets.*, tecnicos.nombre AS tecnico, usuarios.username 
               FROM tickets 
               LEFT JOIN tecnicos ON tickets.tecnico_id = tecnicos.id
               LEFT JOIN usuarios ON tickets.user_id = usuarios.id`;
    let params = [];
    
    if (req.user.rol !== 'admin') {
        sql += ' WHERE tickets.user_id = ?';
        params.push(req.user.id);
    }
    
    sql += ` ORDER BY FIELD(prioridad, 'Urgente', 'Alta', 'Media', 'Baja')`;
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

// Editar ticket (solo admin)
router.put('/:id', verificarToken, verificarRol('admin'), (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const { titulo, descripcion, estado, tecnico_id } = body;

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

        // Si cambió el estado, notificar al creador del ticket
        if (estado) {
            db.query('SELECT user_id, titulo FROM tickets WHERE id = ?', [id], (err2, ticketData) => {
                if (!err2 && ticketData && ticketData.length > 0) {
                    const ownerId = ticketData[0].user_id;
                    const ticketTitulo = ticketData[0].titulo;
                    if (ownerId && ownerId !== req.user.id) {
                        crearNotificacion(
                            ownerId, 
                            'estado_cambio', 
                            `Tu ticket "${ticketTitulo}" fue actualizado a: ${estado}`, 
                            parseInt(id)
                        );
                    }
                }
            });
        }

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
