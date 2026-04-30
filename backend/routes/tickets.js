const express = require('express');
const router = express.Router();
const db = require('../db');

// Crear ticket
router.post('/', (req, res) => {
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);

    const { titulo, descripcion, tecnico_id } = req.body || {};

    if (!titulo || !descripcion) {
        return res.status(400).json({
            error: "Datos no recibidos correctamente"
        });
    }

    const sql = 'INSERT INTO tickets (titulo, descripcion, estado, tecnico_id) VALUES (?, ?, "Pendiente", ?)';

    db.query(sql, [titulo, descripcion, tecnico_id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket creado correctamente' });
    });
});

// Obtener tickets
router.get('/', (req, res) => {
    db.query('SELECT tickets.*, tecnicos.nombre AS tecnico FROM tickets LEFT JOIN tecnicos ON tickets.tecnico_id = tecnicos.id',
        (err, results) => {
            if (err) return res.status(500).json(err);

            res.json(results);
        });
});

//cambiar estdo de ticket
router.put('/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'UPDATE tickets SET estado = "Resuelto" WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket actualizado' });
    });
});

//eliminar ticket
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM tickets WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({ mensaje: 'Ticket eliminado' });
    });
});

module.exports = router;

