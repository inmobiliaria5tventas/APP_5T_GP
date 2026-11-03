const fs = require('fs');
const path = require('path');

const basePath = 'c:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/APP_5T_GP/02_GESTION';
const cssPath = path.join(basePath, 'theme-inmo.css');
const chartsPath = path.join(basePath, 'js', 'charts.js');
const indexPath = path.join(basePath, 'index.html');

console.log('--- 1. Updating theme-inmo.css ---');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const extraCss = `
/* ==========================================================================
   16. REDISEÑO TOTAL SIDEBAR INMOCMS (ELIMINACIÓN DE BLOQUES OSCUROS Y NEÓN)
   Inspirado en el menú limpio lateral de InmoCMS sobre fondo blanco puro
   ========================================================================== */
[data-theme="inmo"] .sidebar,
body.theme-inmo .sidebar {
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.03) !important;
}

[data-theme="inmo"] .sidebar-nav {
  background: #ffffff !important;
}

/* Desmontar bloques oscuros de neón del perfil Administrador y Gerencia */
[data-theme="inmo"] .sidebar-block,
[data-theme="inmo"] .sidebar-block-emerald,
[data-theme="inmo"] .sidebar-block-cyan,
[data-theme="inmo"] .sidebar-block-purple,
[data-theme="inmo"] .sidebar-block-amber,
body.theme-inmo .sidebar-block {
  background: transparent !important;
  border: none !important;
  border-left: none !important;
  box-shadow: none !important;
  margin: 6px 8px 14px 8px !important;
  padding: 0 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

[data-theme="inmo"] .sidebar-block:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* Encabezados de sección estilo InmoCMS (subtítulo sutil, elegante y limpio) */
[data-theme="inmo"] .sidebar-block-header,
body.theme-inmo .sidebar-block-header {
  background: transparent !important;
  border: none !important;
  border-bottom: none !important;
  padding: 12px 12px 6px 12px !important;
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  color: #64748b !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

[data-theme="inmo"] .sidebar-block-header i,
body.theme-inmo .sidebar-block-header i {
  font-size: 0.8rem !important;
  color: #64748b !important;
}

[data-theme="inmo"] .sidebar-block-emerald .sidebar-block-header,
[data-theme="inmo"] .sidebar-block-emerald .sidebar-block-header i {
  color: #059669 !important;
}

[data-theme="inmo"] .sidebar-block-cyan .sidebar-block-header,
[data-theme="inmo"] .sidebar-block-cyan .sidebar-block-header i {
  color: #0284c7 !important;
}

[data-theme="inmo"] .sidebar-block-purple .sidebar-block-header,
[data-theme="inmo"] .sidebar-block-purple .sidebar-block-header i {
  color: #7c3aed !important;
}

[data-theme="inmo"] .sidebar-block-amber .sidebar-block-header,
[data-theme="inmo"] .sidebar-block-amber .sidebar-block-header i {
  color: #d97706 !important;
}

/* Contenido de bloque */
[data-theme="inmo"] .sidebar-block-content,
body.theme-inmo .sidebar-block-content {
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}

/* Ítems del menú inactivos en todos los bloques (Alto contraste, legibilidad máxima) */
[data-theme="inmo"] .sidebar .nav-item,
[data-theme="inmo"] .sidebar-block .nav-item,
[data-theme="inmo"] .sidebar-block-content .nav-item,
body.theme-inmo .sidebar .nav-item,
body.theme-inmo .sidebar-block .nav-item,
body.theme-inmo .sidebar-block-content .nav-item {
  color: #334155 !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 10px !important;
  margin: 1px 4px !important;
  padding: 9px 12px !important;
  font-size: 0.88rem !important;
  font-weight: 600 !important;
  transition: all 0.16s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

[data-theme="inmo"] .sidebar .nav-item span,
[data-theme="inmo"] .sidebar-block .nav-item span,
[data-theme="inmo"] .sidebar-block-content .nav-item span,
body.theme-inmo .sidebar .nav-item span,
body.theme-inmo .sidebar-block .nav-item span,
body.theme-inmo .sidebar-block-content .nav-item span {
  color: #334155 !important;
  font-weight: 600 !important;
}

[data-theme="inmo"] .sidebar .nav-item i,
[data-theme="inmo"] .sidebar-block .nav-item i,
[data-theme="inmo"] .sidebar-block-content .nav-item i,
body.theme-inmo .sidebar .nav-item i,
body.theme-inmo .sidebar-block .nav-item i,
body.theme-inmo .sidebar-block-content .nav-item i {
  color: #64748b !important;
  font-size: 0.95rem !important;
  transition: color 0.16s ease !important;
}

/* Hover de ítems */
[data-theme="inmo"] .sidebar .nav-item:hover,
[data-theme="inmo"] .sidebar-block .nav-item:hover,
[data-theme="inmo"] .sidebar-block-content .nav-item:hover,
body.theme-inmo .sidebar .nav-item:hover,
body.theme-inmo .sidebar-block .nav-item:hover,
body.theme-inmo .sidebar-block-content .nav-item:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  transform: none !important;
}

[data-theme="inmo"] .sidebar .nav-item:hover span,
[data-theme="inmo"] .sidebar-block .nav-item:hover span,
[data-theme="inmo"] .sidebar-block-content .nav-item:hover span,
body.theme-inmo .sidebar .nav-item:hover span,
body.theme-inmo .sidebar-block .nav-item:hover span,
body.theme-inmo .sidebar-block-content .nav-item:hover span {
  color: #0f172a !important;
}

[data-theme="inmo"] .sidebar .nav-item:hover i,
[data-theme="inmo"] .sidebar-block .nav-item:hover i,
[data-theme="inmo"] .sidebar-block-content .nav-item:hover i,
body.theme-inmo .sidebar .nav-item:hover i,
body.theme-inmo .sidebar-block .nav-item:hover i,
body.theme-inmo .sidebar-block-content .nav-item:hover i {
  color: #2563eb !important;
}

/* Ítem Activo (Azul Royal InmoCMS con fondo vibrante y texto blanco puro) */
[data-theme="inmo"] .sidebar .nav-item.active,
[data-theme="inmo"] .sidebar-block .nav-item.active,
[data-theme="inmo"] .sidebar-block-content .nav-item.active,
body.theme-inmo .sidebar .nav-item.active,
body.theme-inmo .sidebar-block .nav-item.active,
body.theme-inmo .sidebar-block-content .nav-item.active {
  background: #2563eb !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
}

[data-theme="inmo"] .sidebar .nav-item.active span,
[data-theme="inmo"] .sidebar-block .nav-item.active span,
[data-theme="inmo"] .sidebar-block-content .nav-item.active span,
[data-theme="inmo"] .sidebar .nav-item.active i,
[data-theme="inmo"] .sidebar-block .nav-item.active i,
[data-theme="inmo"] .sidebar-block-content .nav-item.active i,
body.theme-inmo .sidebar .nav-item.active span,
body.theme-inmo .sidebar-block .nav-item.active span,
body.theme-inmo .sidebar-block-content .nav-item.active span,
body.theme-inmo .sidebar .nav-item.active i,
body.theme-inmo .sidebar-block .nav-item.active i,
body.theme-inmo .sidebar-block-content .nav-item.active i {
  color: #ffffff !important;
}

/* Badges de notificación en el Sidebar */
[data-theme="inmo"] .sidebar .nav-badge,
[data-theme="inmo"] .sidebar .badge,
body.theme-inmo .sidebar .nav-badge,
body.theme-inmo .sidebar .badge {
  background: #0284c7 !important;
  color: #ffffff !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  border-radius: 9999px !important;
  padding: 2px 7px !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35) !important;
}

[data-theme="inmo"] .sidebar .nav-item.active .nav-badge,
body.theme-inmo .sidebar .nav-item.active .nav-badge {
  background: #ffffff !important;
  color: #2563eb !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

/* ==========================================================================
   17. FICHA DE LOTE Y BOTTOM SHEET (ESTILO INMOCMS MODERNO Y LIMPIO)
   Diseño de tarjeta blanca pura, bordes suaves, tipografía nítida y botones vibrantes
   ========================================================================== */
[data-theme="inmo"] .bottom-sheet,
body.theme-inmo .bottom-sheet {
  background: #ffffff !important;
  border-top: 2px solid #2563eb !important;
  box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.16) !important;
  color: #0f172a !important;
}

[data-theme="inmo"] .bottom-sheet-handle {
  background: #ffffff !important;
}

[data-theme="inmo"] .handle-bar {
  background: #cbd5e1 !important;
  opacity: 1 !important;
}

[data-theme="inmo"] .bottom-sheet-close {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #475569 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

[data-theme="inmo"] .bottom-sheet-close:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

[data-theme="inmo"] .bottom-sheet-content,
[data-theme="inmo"] .lote-panel {
  background: #ffffff !important;
  color: #0f172a !important;
}

/* Lote Header & Specs */
[data-theme="inmo"] .lote-header h3,
[data-theme="inmo"] .lote-header h2,
[data-theme="inmo"] #lote-title,
[data-theme="inmo"] .bottom-sheet h3 {
  color: #0f172a !important;
  font-weight: 800 !important;
}

[data-theme="inmo"] .lote-header span,
[data-theme="inmo"] #lote-project,
[data-theme="inmo"] .bottom-sheet .lote-header span {
  color: #64748b !important;
}

[data-theme="inmo"] .spec-label {
  color: #64748b !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  font-size: 0.72rem !important;
  letter-spacing: 0.5px !important;
}

[data-theme="inmo"] .spec-value,
[data-theme="inmo"] #lote-area,
[data-theme="inmo"] #lote-price,
[data-theme="inmo"] .bottom-sheet .spec-value {
  color: #0f172a !important;
  font-weight: 800 !important;
}

/* Modificación de Precio Oficial de Lista (Caja Gerencial) */
[data-theme="inmo"] #gerente-ficha-info > div:first-child,
[data-theme="inmo"] #lote-action-form > div:first-child,
[data-theme="inmo"] #bs-lote-action-form > div:first-child {
  background: #f8fafc !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 12px !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03) !important;
}

[data-theme="inmo"] #gerente-ficha-info label,
[data-theme="inmo"] #bs-lote-action-form label {
  color: #334155 !important;
  font-weight: 700 !important;
}

[data-theme="inmo"] #gerente-precio-lista-input,
[data-theme="inmo"] #bs-lote-action-form input {
  background: #ffffff !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #0f172a !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
}

[data-theme="inmo"] #btn-gerente-guardar-precio-info,
[data-theme="inmo"] #btn-guardar-precio-lista-direct {
  background: #2563eb !important;
  border: 1px solid #1d4ed8 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25) !important;
  font-weight: 700 !important;
}

[data-theme="inmo"] #btn-nueva-venta-directa {
  background: #2563eb !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
}

[data-theme="inmo"] #btn-nueva-venta-directa:hover {
  background: #1d4ed8 !important;
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4) !important;
}

[data-theme="inmo"] #btn-gerente-bloquear-info,
[data-theme="inmo"] #btn-gerente-bloquear {
  background: #f1f5f9 !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #475569 !important;
  border-radius: 10px !important;
  font-weight: 600 !important;
}

[data-theme="inmo"] #btn-gerente-bloquear-info:hover,
[data-theme="inmo"] #btn-gerente-bloquear:hover {
  background: #e2e8f0 !important;
  color: #0f172a !important;
}

/* Fichas Comerciales de Negociación (Estados Reservada, Promesada, Vendida) */
[data-theme="inmo"] .lote-ficha,
[data-theme="inmo"] .negociacion-tracking-container,
[data-theme="inmo"] .commercial-tracking-card,
[data-theme="inmo"] .tracking-phase-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
  border-radius: 12px !important;
}

[data-theme="inmo"] .empty-state {
  color: #64748b !important;
}
[data-theme="inmo"] .empty-state i {
  color: #2563eb !important;
}
[data-theme="inmo"] .empty-state h3 {
  color: #0f172a !important;
  font-weight: 700 !important;
}
[data-theme="inmo"] .empty-state p {
  color: #64748b !important;
}

/* ==========================================================================
   18. TÍTULOS DE GRÁFICOS Y TARJETAS SIN ESPACIO EN STYLE
   Garantiza que etiquetas y números dentro de tarjetas se lean perfectamente
   ========================================================================== */
[data-theme="inmo"] .chart-card h3,
[data-theme="inmo"] .chart-card h4,
[data-theme="inmo"] .data-card h2,
[data-theme="inmo"] .data-card h3,
[data-theme="inmo"] .data-card h4,
[data-theme="inmo"] .card-title,
[data-theme="inmo"] .chart-title,
[data-theme="inmo"] #embudo-metricas-sub,
[data-theme="inmo"] #embudo-tasa-efectividad,
[data-theme="inmo"] [style*="color:#ffffff"],
[data-theme="inmo"] [style*="color: #ffffff"],
[data-theme="inmo"] [style*="color:#fff"],
[data-theme="inmo"] [style*="color: #fff"],
[data-theme="inmo"] [style*="color:white"],
[data-theme="inmo"] [style*="color: white"] {
  color: #0f172a !important;
}

/* Badge de tasa de efectividad (ej: "97% Conversión a Promesa") */
[data-theme="inmo"] #embudo-tasa-efectividad {
  background: #ecfdf5 !important;
  border: 1px solid #a7f3d0 !important;
  color: #047857 !important;
  font-weight: 700 !important;
}

/* Selectores de Años y Botones de Gráficos (Lotes / Monto $) */
[data-theme="inmo"] .chart-card select,
[data-theme="inmo"] .data-card select {
  background-color: #f1f5f9 !important;
  border: 1.5px solid #cbd5e1 !important;
  color: #0f172a !important;
}

[data-theme="inmo"] .btn-toggle-group,
[data-theme="inmo"] .chart-actions {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
}

[data-theme="inmo"] .btn-toggle-group .btn-toggle,
[data-theme="inmo"] .chart-actions button {
  color: #475569 !important;
}

[data-theme="inmo"] .btn-toggle-group .btn-toggle.active,
[data-theme="inmo"] .chart-actions button.active {
  background: #2563eb !important;
  color: #ffffff !important;
}
`;

if (!cssContent.includes('REDISEÑO TOTAL SIDEBAR INMOCMS')) {
  fs.writeFileSync(cssPath, cssContent + '\n' + extraCss, 'utf8');
  console.log('theme-inmo.css updated successfully.');
} else {
  console.log('theme-inmo.css already contained the extra styles.');
}

console.log('--- 2. Updating charts.js ---');
let chartsCode = fs.readFileSync(chartsPath, 'utf8');

// A. Insert theme helper functions at the beginning of APP5T_Charts IIFE
const themeHelpers = `
    // ── Inmo Theme Chart Helpers ──────────────────────────────────────────
    function _isThemeInmo() {
        return (typeof document !== 'undefined') && (
            document.documentElement.getAttribute('data-theme') === 'inmo' ||
            (document.body && document.body.classList.contains('theme-inmo')) ||
            (typeof localStorage !== 'undefined' && localStorage.getItem('app5t_design_theme') === 'inmo')
        );
    }

    function _getChartTextColor() {
        return _isThemeInmo() ? '#334155' : '#ffffff';
    }

    function _getChartMutedColor() {
        return _isThemeInmo() ? '#64748b' : '#94a3b8';
    }

    function _getChartGridColor() {
        return _isThemeInmo() ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)';
    }

    function _syncChartDefaults() {
        if (typeof Chart !== 'undefined') {
            const txt = _getChartTextColor();
            Chart.defaults.animation = false;
            Chart.defaults.color = txt;
            if (Chart.defaults.plugins && Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
                Chart.defaults.plugins.legend.labels.color = txt;
            }
        }
    }
    _syncChartDefaults();
`;

// Replace lines 9-16 in charts.js
const oldChartDefaults = `    // Desactivar animaciones globales en Chart.js y configurar color blanco por defecto para todos los textos/etiquetas
    if (typeof Chart !== 'undefined') {
        Chart.defaults.animation = false;
        Chart.defaults.color = '#ffffff';
        if (Chart.defaults.plugins && Chart.defaults.plugins.legend && Chart.defaults.plugins.legend.labels) {
            Chart.defaults.plugins.legend.labels.color = '#ffffff';
        }
    }`;

if (chartsCode.includes(oldChartDefaults)) {
  chartsCode = chartsCode.replace(oldChartDefaults, themeHelpers);
  console.log('Inserted theme helper functions in charts.js');
}

// B. Replace hardcoded white ticks and grids in chart definitions
chartsCode = chartsCode.replace(/ticks:\s*\{\s*color:\s*'#ffffff'/g, "ticks: { color: _getChartTextColor()");
chartsCode = chartsCode.replace(/ticks:\s*\{\s*color:\s*'#ffffff',/g, "ticks: { color: _getChartTextColor(),");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*font:\s*\{\s*size:\s*11,\s*family:\s*'"Inter",\s*"Segoe UI",\s*sans-serif'\s*\}/g, "color: _getChartTextColor(), font: { size: 11, family: '\"Inter\", \"Segoe UI\", sans-serif' }");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*stepSize:\s*5/g, "color: _getChartTextColor(), stepSize: 5");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*stepSize:\s*1/g, "color: _getChartTextColor(), stepSize: 1");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*font:\s*\{\s*size:\s*12/g, "color: _getChartTextColor(), font: { size: 12");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*font:\s*\{\s*size:\s*10/g, "color: _getChartTextColor(), font: { size: 10");
chartsCode = chartsCode.replace(/color:\s*'#ffffff',\s*font:\s*\{\s*size:\s*9\s*\}/g, "color: _getChartTextColor(), font: { size: 9 }");
chartsCode = chartsCode.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.08\)'/g, "color: _getChartGridColor()");

// C. Add updateTheme function before the return
const updateThemeFunc = `
    function updateTheme() {
        _syncChartDefaults();
        const textColor = _getChartTextColor();
        const gridColor = _getChartGridColor();
        const charts = [
            compositionChart,
            evolucionVentasChart,
            projectsChart,
            velocityChart,
            goalsChart,
            leaderboardChart,
            cashflowChart,
            funnelGeneralChart,
            morosidadChart,
            embudoLegalChart,
            funnelPersonalChart
        ];
        if (cobranzaMesCharts && typeof cobranzaMesCharts === 'object') {
            Object.values(cobranzaMesCharts).forEach(c => { if (c) charts.push(c); });
        }
        charts.forEach(chart => {
            if (!chart) return;
            try {
                if (chart.options) {
                    if (chart.options.scales) {
                        ['x', 'y', 'r'].forEach(axis => {
                            const scale = chart.options.scales[axis];
                            if (scale) {
                                if (scale.ticks) scale.ticks.color = textColor;
                                if (scale.grid) scale.grid.color = gridColor;
                            }
                        });
                    }
                    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                        chart.options.plugins.legend.labels.color = textColor;
                    }
                }
                chart.update();
            } catch (e) {
                console.warn('Error updating chart theme', e);
            }
        });
    }
`;

if (!chartsCode.includes('function updateTheme()')) {
  // Insert before public API
  const apiMarker = '// ─── Public API ────────────────────────────────────────────────────────────────';
  if (chartsCode.includes(apiMarker)) {
    chartsCode = chartsCode.replace(apiMarker, updateThemeFunc + '\n    ' + apiMarker);
  } else {
    chartsCode = chartsCode.replace('return {', updateThemeFunc + '\n    return {');
  }

  // Add updateTheme to returned object
  chartsCode = chartsCode.replace('renderDashboard: renderDashboard,', 'renderDashboard: renderDashboard,\n        updateTheme:     updateTheme,');
  console.log('Added updateTheme function to charts.js');
}

fs.writeFileSync(chartsPath, chartsCode, 'utf8');
console.log('charts.js updated successfully.');

console.log('--- 3. Updating index.html Theme Toggle Event ---');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const toggleTarget = "localStorage.setItem('app5t_design_theme', nextTheme);";
const updateChartsCall = `localStorage.setItem('app5t_design_theme', nextTheme);
            if (typeof APP5T_Charts !== 'undefined' && APP5T_Charts.updateTheme) {
              APP5T_Charts.updateTheme();
            }`;

if (indexHtml.includes(toggleTarget) && !indexHtml.includes('APP5T_Charts.updateTheme()')) {
  indexHtml = indexHtml.replace(toggleTarget, updateChartsCall);
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('index.html updated successfully with APP5T_Charts.updateTheme()');
}

console.log('ALL TASKS COMPLETED SUCCESSFULLY!');
