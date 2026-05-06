document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    async function cargarStats() {
        try {
            const res = await fetch('http://localhost:3000/api/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al cargar estadísticas');

            const data = await res.json();
            mostrarStats(data);
        } catch (err) {
            mostrarMensaje(err.message, "error");
        }
    }

    function mostrarStats(data) {
        // Total tickets
        document.getElementById('totalTickets').textContent = data.total || 0;

        // Por estado
        const porEstado = document.getElementById('porEstado');
        porEstado.innerHTML = '';
        if (data.porEstado) {
            data.porEstado.forEach(item => {
                const p = document.createElement('p');
                p.textContent = `${item.estado}: ${item.cantidad}`;
                porEstado.appendChild(p);
            });
        }

        // Por técnico
        const porTecnico = document.getElementById('porTecnico');
        porTecnico.innerHTML = '';
        if (data.porTecnico) {
            data.porTecnico.forEach(item => {
                const p = document.createElement('p');
                p.textContent = `${item.nombre}: ${item.resueltos} tickets`;
                porTecnico.appendChild(p);
            });
        }

        // Tiempo promedio
        if (data.tiempoPromedio) {
            document.getElementById('tiempoPromedio').textContent = data.tiempoPromedio;
        }
    }

    cargarStats();
});
