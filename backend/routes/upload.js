const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configurar multer para guardar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// Subir archivo
router.post('/', upload.single('archivo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    res.json({
        mensaje: 'Archivo subido correctamente',
        nombre: req.file.originalname,
        ruta: `/uploads/${req.file.filename}`
    });
});

module.exports = router;
