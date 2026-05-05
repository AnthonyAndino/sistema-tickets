# Sistema de Tickets

Un sistema web para la gestión de tickets de soporte técnico, permitiendo crear, visualizar y dar seguimiento a incidencias asignadas a técnicos.

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL** (mysql2) - Base de datos
- **JWT** (jsonwebtoken) - Autenticación
- **bcrypt** - Encriptación de contraseñas
- **dotenv** - Variables de entorno
- **cors** - Manejo de CORS

### Frontend
- **HTML5 / CSS3 / JavaScript** - Sin frameworks
- **localStorage** - Persistencia de sesión

## Estructura del Proyecto

```
sistema-tickets/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tickets.js
│   │   └── tecnicos.js
│   ├── db.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── app.js
│   ├── login.js
│   ├── authCheck.js
│   └── style.css
├── .env.example
├── .gitignore
└── package.json
```

## Instalación

### Prerrequisitos
- Node.js instalado
- Servidor MySQL en ejecución

### Pasos

1. Clona el repositorio:
```bash
git clone https://github.com/AnthonyAndino/sistema-tickets.git
cd sistema-tickets
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno (ver sección siguiente).

4. Crea la base de datos y tablas en MySQL:
```sql
CREATE DATABASE tickets_db;

USE tickets_db;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('Pendiente', 'Resuelto') DEFAULT 'Pendiente',
    tecnico_id INT,
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
);
```

5. Inicia el servidor:
```bash
node backend/server.js
```

O en modo desarrollo con nodemon:
```bash
npx nodemon backend/server.js
```

El servidor corre en `http://localhost:3000`

## Configuración de Variables de Entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tickets_db
JWT_SECRET=clave_secreta_segura
```

## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |

### Tickets (Requiere JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tickets` | Obtener todos los tickets |
| POST | `/api/tickets` | Crear nuevo ticket |
| PUT | `/api/tickets/:id` | Marcar como resuelto |
| DELETE | `/api/tickets/:id` | Eliminar ticket |

### Técnicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tecnicos` | Obtener lista de técnicos |

### Autenticación JWT
Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Frontend

Abre `frontend/login.html` en el navegador. El sistema incluye:
- Página de login/registro
- Dashboard de tickets con filtros
- Asignación de técnicos
- Interfaz responsive con tema oscuro

## Licencia

ISC
