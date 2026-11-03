const fs = require('fs');
const lines = fs.readFileSync('C:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/02_GESTION/js/app.js', 'utf8').split('\n');
lines[1272] = '           htmlRows += <tr><td colspan="8" style="text-align: right; background-color: var(--glass-bg); padding: 10px;"><button class="btn btn-sm btn-outline" onclick="window.APP5T._showActivarCtaCteModal(\\'\\')" style="color: var(--accent-orange); border-color: var(--accent-orange);"><i class="fa-solid fa-rotate"></i> Regenerar Plan de Pagos (Corrige fechas)</button></td></tr>;';
fs.writeFileSync('C:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/02_GESTION/js/app.js', lines.join('\n'));
