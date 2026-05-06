document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const calendarEl = document.getElementById('calendar');
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                const res = await fetch('http://localhost:3000/api/tickets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const tickets = await res.json();
                
                const events = tickets.map(t => ({
                    title: t.titulo,
                    start: t.fecha_creacion || new Date(),
                    color: t.estado === 'Resuelto' ? 'green' : 'orange',
                    extendedProps: { ticketId: t.id }
                }));
                
                successCallback(events);
            } catch (err) {
                failureCallback(err);
            }
        },
        eventClick: (info) => {
            window.location.href = `index.html#ticket-${info.event.extendedProps.ticketId}`;
        }
    });

    calendar.render();
});
