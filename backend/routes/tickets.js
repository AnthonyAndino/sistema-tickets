const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roleMiddleware');

// Crear ticket (admin y usuario)
router.post('/', verificarToken, (req, res) => {
    const { titulo, descripcion, tecnico_id } = req.body;

    if (!titulo) {
        return res.status(400).json({ error: 'El titulo es obligatoio ' });
    }

    if (typeof titulo !== 'string' || titulo.length > 255) {
        return res.status(400).json({ error: 'El titulo debe ser texto y maximo 255 caracteres' });
    }

    // Solo admin puede asignar tecnico
    let finalTecnicoId = null;
    if (req.user.rol === 'admin' && tecnico_id) {
        if (!Number.isInteger(Number(tecnico_id)) || tecnico_id <= 0) {
            return res.status(400).json({ error: 'El ID del tecnico debe ser un numero valido' });
        }
        finalTecnicoId = tecnico_id;
    }

    const sql = 'INSERT INTO tickets (titulo, descripcion, estado, tecnico_id, user_id) VALUES (?, ?, "Pendiente", ?, ?)';

    db.query(sql, [titulo, descripcion, finalTecnicoId, req.user.id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket creado correctamente' });
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
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

//cambiar estdo de ticket y asignar tecnico (solo admin)
router.put('/:id', verificarToken, verificarRol('admin'), (req, res) => {
    const { id } = req.params;
    const { estado, tecnico_id } = req.body;

    let sql = 'UPDATE tickets SET estado = ?';
    let params = [estado || 'Resuelto'];
    
    if (tecnico_id) {
        sql += ', tecnico_id = ?';
        params.push(tecnico_id);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);

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

