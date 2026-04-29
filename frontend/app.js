const API_URL = 'http://localhost:3000/api/tickets';

const form = document.getElementById('ticketForm');
const ticketDiv = document.getElementById('tickets');

let ticketsGlobal = [];
let filtroActual = 'todos';

//Obtener tickets
async function obtenerTickets() {
    const res = await fetch(API_URL);
    const data = await res.json();

    ticketsGlobal = data;
    mostrarTickets();
}

function mostrarTickets() {
    ticketDiv.innerHTML = '';

    let ticketsFiltrados = ticketsGlobal;

    if (filtroActual !== 'todos') {
        ticketsFiltrados = ticketsGlobal.filter(t => t.estado === filtroActual);
    }

    ticketsFiltrados.forEach(ticket => {
        const estadoClase = ticket.estado === "Pendiente" ? "pendiente" : "resuelto";

        ticketDiv.innerHTML += `
            <div class="ticket ${estadoClase}">
                <h3>${ticket.titulo}</h3>
                <p>${ticket.descripcion}</p>
                <strong>${ticket.estado}</strong>

                ${ticket.estado === "Pendiente" ?
                `<button onclick="resolverTicket(${ticket.id})">Resolver</button>`
                : ""}

                <button onclick="eliminarTicket(${ticket.id})">Eliminar</button>
            </div>
        `;
    });
}

//funcion filtar
function filtrar(tipo) {
    filtroActual = tipo;
    mostrarTickets();
}

//Crear tickets
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value;
    const descripcion = document.getElementById('descripcion').value;

    await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ titulo, descripcion })
    });

    form.reset();
    obtenerTickets();
})

//funcion para resolver
async function resolverTicket(id) {
    await fetch(`${API_URL}/${id}`, {
        method: 'PUT'
    });

    obtenerTickets();
}

//funcion eliminar
async function eliminarTicket(id) {
    await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    obtenerTickets();
}

//cargar al inicio
obtenerTickets();
