// Dark mode toggle
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    updateDarkButton();
}

function updateDarkButton() {
    const btn = document.querySelector('button[onclick="toggleDarkMode()"]');
    if (btn) {
        btn.textContent = localStorage.getItem('darkMode') === 'true' ? '☀️' : '🌙';
    }
}

// Aplicar dark mode al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateDarkButton();
});
