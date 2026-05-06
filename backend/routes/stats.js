const express = require('express');
const router = express.Router();
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');
const { verificarRol } = require('../middleware/roleMiddleware');

// Obtener estadísticas (solo admin)
router.get('/', verificarToken, verificarRol('admin'), (req, res) => {
    // Total tickets
    db.query('SELECT COUNT(*) as total FROM tickets', (err, totalResult) => {
        if (err) return res.status(500).json(err);
        
        // Tickets por estado
        db.query('SELECT estado, COUNT(*) as cantidad FROM tickets GROUP BY estado', (err, estadoResult) => {
            if (err) return res.status(500).json(err);
            
            // Tickets resueltos por técnico
            db.query(`SELECT tecnicos.nombre, COUNT(*) as resueltos 
                       FROM tickets 
                       LEFT JOIN tecnicos ON tickets.tecnico_id = tecnicos.id 
                       WHERE tickets.estado = 'Resuelto' 
                       GROUP BY tecnico_id, tecnicos.nombre`, (err, tecnicosResult) => {
                if (err) return res.status(500).json(err);
                
                // Tiempo promedio de resolución (simulado)
                db.query(`SELECT AVG(DATEDIFF(NOW(), created_at)) as promedio_dias FROM tickets WHERE estado = 'Resuelto'`, (err, tiempoResult) => {
                    if (err) {
                        // Si no existe columna created_at, devolver valor por defecto
                        return res.json({
                            total: totalResult[0].total,
                            porEstado: estadoResult,
                            porTecnico: tecnicosResult,
                            tiempoPromedio: 'N/A (columna created_at no existe)'
                        });
                    }
                    
                    res.json({
                        total: totalResult[0].total,
                        porEstado: estadoResult,
                        porTecnico: tecnicosResult,
                        tiempoPromedio: tiempoResult[0].promedio_dias || 'N/A'
                    });
                });
            });
        });
    });
});

module.exports = router;
