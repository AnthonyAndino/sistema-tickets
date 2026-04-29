const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@Zomboy59',
    database: 'tickets_db'
});

connection.connect(err => {
    if (err) {
        console.error('Error', err);
        return;
    }
    console.log('Conectado a MySQL');
});

module.exports = connection;