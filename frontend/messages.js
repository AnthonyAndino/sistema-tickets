// Sistema de mensajes visuales (toast)
function mostrarMensaje(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('mensajes');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + tipo;
    toast.textContent = mensaje;
    
    let bgColor = '#2196F3';
    if (tipo === 'error') bgColor = '#f44336';
    if (tipo === 'exito') bgColor = '#4CAF50';
    
    toast.style.cssText = 
        'position: fixed;' +
        'top: 20px;' +
        'right: 20px;' +
        'padding: 15px 20px;' +
        'border-radius: 5px;' +
        'color: white;' +
        'font-weight: bold;' +
        'z-index: 9999;' +
        'margin-bottom: 10px;' +
        'background-color: ' + bgColor + ';' +
        'animation: slideIn 0.3s ease;';

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Agregar estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = 
    '@keyframes slideIn {' +
    '    from { transform: translateX(400px); opacity: 0; }' +
    '    to { transform: translateX(0); opacity: 1; }' +
    '}' +
    '@keyframes slideOut {' +
    '    from { transform: translateX(0); opacity: 1; }' +
    '    to { transform: translateX(400px); opacity: 0; }' +
    '}' +
    '.toast {' +
    '    animation: slideIn 0.3s ease;' +
    '}';
document.head.appendChild(style);
