/* ==========================================================================
   APP5T_Charts  –  Dashboard KPIs & Charts (Chart.js)
   5 Tierras CRM & GIS
   ========================================================================== */

const APP5T_Charts = (function () {
    'use strict';


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


    // ── State ──────────────────────────────────────────────────────────────
    let compositionChart = null;
    let evolucionVentasChart = null;
    let projectsChart    = null;
    let velocityChart    = null;
    let goalsChart       = null; // Will keep if used
    let leaderboardChart = null;
    let cashflowChart = null;
    let funnelGeneralChart = null;
    let morosidadChart = null;
    let embudoLegalChart = null;
    let cobranzaMesCharts = {};
    let funnelPersonalChart = null;

    let selectedYearEvolucion = new Date().getFullYear();
    let selectedModeEvolucion = 'units'; // 'units' | 'money'
    let selectedYearCobranza = new Date().getFullYear();
    let selectedYearCashflow = new Date().getFullYear();
    let yearsPopulated = false;

    // ── Status colours (mirrors map.js) ────────────────────────────────────
    const COLORS = {
        'Disponible': 'rgba(255, 255, 255, 0.6)',
        'Pendiente':  '#f1c40f',
        'Reservada':  '#f39c12',
        'Promesada':  '#3498db',
        'Vendida':    '#2ecc71'
    };

    // ── KPI icon map ───────────────────────────────────────────────────────
    const KPI_ICONS = {
        leads:            'fa-solid fa-users',
        reservasEnviadas: 'fa-solid fa-paper-plane',
        reservasAprobadas:'fa-solid fa-circle-check',
        comision:         'fa-solid fa-coins',
        ingresoTotal:     'fa-solid fa-chart-line',
        promesas:         'fa-solid fa-handshake',
        caja:             'fa-solid fa-vault',
        lotesVendidos:    'fa-solid fa-house-circle-check',
        cuotasPendientes: 'fa-solid fa-clock',
        montoPendiente:   'fa-solid fa-file-invoice-dollar',
        montoRecaudado:   'fa-solid fa-sack-dollar',
        promesasActivas:  'fa-solid fa-file-signature'
    };

    // ── Helper: build a single KPI card HTML ───────────────────────────────
    function _kpiCard(icon, label, value) {
        return (
            '<div class="kpi-card">' +
                '<div class="kpi-icon"><i class="' + icon + '"></i></div>' +
                '<div class="kpi-info">' +
                    '<span class="kpi-label">' + label.toUpperCase() + '</span>' +
                    '<span class="kpi-value">' + value + '</span>' +
                '</div>' +
            '</div>'
        );
    }

    // ── Render KPIs by role ────────────────────────────────────────────────
    function _renderKPIs(stats, role) {
        const container = document.getElementById('kpi-grid');
        if (!container) return;

        let html = '';

        if (role === 'vendedor') {
            // Leads Activos – count clientes assigned (approximate from propiedades)
            const leadsCount = stats.pendientes + stats.reservadas;
            html += _kpiCard(KPI_ICONS.leads, 'Leads Activos', leadsCount);

            // Reservas Enviadas
            html += _kpiCard(KPI_ICONS.reservasEnviadas, 'Reservas Enviadas', stats.pendientes);

            // Reservas Aprobadas
            html += _kpiCard(KPI_ICONS.reservasAprobadas, 'Reservas Aprobadas', stats.reservadas);

            // Comisión Estimada (3% of reservadas value)
            const reservadasProps = APP5T_DB.query('propiedades', function (p) {
                return p.estado === 'Reservada';
            });
            let sumReservadas = 0;
            reservadasProps.forEach(function (p) { sumReservadas += (p.valor_final || 0); });
            const comision = sumReservadas * 0.03;
            html += _kpiCard(KPI_ICONS.comision, 'Comisión Estimada', APP5T_Utils.formatMoneda(comision));

        } else if (role === 'gerente') {
            const montoVentasCerradas = stats.ingresoRecaudado || stats.montoVendidas || 0;
            const montoProyectado = (stats.ingresoComprometido || 0) + (stats.ingresoProyectado || 0);
            const parcelasEnCierre = (stats.promesadas || 0) + (stats.reservadas || 0) + (stats.pendientes || 0);
            const parcelasVendidas = stats.vendidas || 0;

            html = `
                <div class="gerencia-kpi-card">
                    <div class="gerencia-kpi-header">
                        <span class="gerencia-kpi-title">Ventas Totales (Escrituradas)</span>
                    </div>
                    <div class="gerencia-kpi-value">${APP5T_Utils.formatMoneda(montoVentasCerradas)}</div>
                    <div class="gerencia-kpi-footer">
                        <span style="color:#ffffff;"><i class="fa-solid fa-circle-check" style="color:#22c55e;"></i> ${parcelasVendidas} parcelas escrituradas</span>
                    </div>
                </div>
                <div class="gerencia-kpi-card">
                    <div class="gerencia-kpi-header">
                        <span class="gerencia-kpi-title">Ingresos Proyectados</span>
                    </div>
                    <div class="gerencia-kpi-value">${APP5T_Utils.formatMoneda(montoProyectado)}</div>
                    <div class="gerencia-kpi-footer">
                        <span style="color:#ffffff;"><i class="fa-regular fa-clock" style="color:#00e5ff;"></i> En cierre: ${parcelasEnCierre} parcelas (${stats.promesadas || 0} promesas)</span>
                    </div>
                </div>
            `;
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            container.style.gap = '20px';
            container.innerHTML = html;
            return; // exit early for gerente

        } else if (role === 'administrador') {
            html += _kpiCard(KPI_ICONS.cuotasPendientes, 'Cuotas Pendientes', stats.cuotasPendientes || 0);
            html += _kpiCard(KPI_ICONS.montoPendiente, 'Monto Pendiente Cuotas', APP5T_Utils.formatMoneda(stats.montoPendienteCuotas || 0));
            html += _kpiCard(KPI_ICONS.montoRecaudado, 'Monto Recaudado Cuotas', APP5T_Utils.formatMoneda(stats.montoRecaudadoCuotas || 0));
            html += _kpiCard(KPI_ICONS.promesasActivas, 'Promesas Activas', stats.promesadas || 0);
        }

        container.innerHTML = html;
    }

    // ── Chart.js centre-text plugin (doughnut) ─────────────────────────────
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function (chart) {
            if (chart.config.type !== 'doughnut') return;

            const total = chart.config.data.datasets[0].data.reduce(function (a, b) { return a + b; }, 0);
            const ctx = chart.ctx;
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            ctx.save();
            ctx.font = 'bold 28px "Inter", "Segoe UI", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total, centerX, centerY - 10);

            ctx.font = 'bold 12px "Inter", "Segoe UI", sans-serif';
            ctx.fillStyle = '#00e5ff';
            ctx.fillText('TOTAL LOTES', centerX, centerY + 14);
            ctx.restore();
        }
    };

    // ── Render Composition Doughnut ────────────────────────────────────────
    function _renderCompositionChart(stats, projectId = 'all') {
        const canvas = document.getElementById('chart-composition');
        if (!canvas) return;

        // Populate filter dropdown if needed
        const filterSelect = document.getElementById('filter-composition-project');
        if (filterSelect && filterSelect.options.length <= 1) {
            const proyectos = APP5T_DB.getAll('proyectos') || [];
            proyectos.forEach(pr => {
                const opt = document.createElement('option');
                opt.value = pr.id;
                opt.textContent = pr.nombre;
                filterSelect.appendChild(opt);
            });
            filterSelect.value = projectId;
        }

        if (compositionChart) {
            compositionChart.destroy();
            compositionChart = null;
        }

        let dataValues = [
            stats.disponibles || 0,
            stats.pendientes  || 0,
            stats.reservadas  || 0,
            stats.promesadas  || 0,
            stats.vendidas    || 0
        ];

        if (projectId !== 'all') {
            const props = APP5T_DB.getAll('propiedades') || [];
            const etapas = APP5T_DB.getAll('etapas') || [];
            let disp=0, pend=0, res=0, prom=0, vend=0;
            
            props.forEach(p => {
                let pId = p.id_proyecto;
                if (!pId && p.id_etapa) {
                    const et = etapas.find(e => Number(e.id) === Number(p.id_etapa));
                    if (et) pId = et.id_proyecto;
                }
                if (String(pId) === String(projectId)) {
                    switch (p.estado) {
                        case 'Disponible': disp++; break;
                        case 'Pendiente': pend++; break;
                        case 'Reservada': res++; break;
                        case 'Promesada': prom++; break;
                        case 'Vendida': vend++; break;
                    }
                }
            });
            dataValues = [disp, pend, res, prom, vend];
        }

        const ctx = canvas.getContext('2d');
        compositionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Pendiente', 'Reservada', 'Promesada', 'Vendida'],
                datasets: [{
                    data: dataValues,
                    backgroundColor: [
                        COLORS['Disponible'],
                        COLORS['Pendiente'],
                        COLORS['Reservada'],
                        COLORS['Promesada'],
                        COLORS['Vendida']
                    ],
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            plugins: [centerTextPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: window.innerWidth <= 768 ? 8 : 16,
                            usePointStyle: true,
                            pointStyleWidth: window.innerWidth <= 768 ? 8 : 12,
                            font: { size: window.innerWidth <= 768 ? 10 : 12, family: '"Inter", "Segoe UI", sans-serif' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,25,0.92)',
                        titleColor: '#ffffff',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                                const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return ' ' + context.label + ': ' + context.parsed + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // ── Render Projects Stacked Bar ────────────────────────────────────────
    function _renderProjectsChart(stats) {
        const canvas = document.getElementById('chart-projects');
        if (!canvas) return;

        if (projectsChart) {
            projectsChart.destroy();
            projectsChart = null;
        }

        const perProject = stats.perProject || {};
        const projectNames = Object.keys(perProject);

        // Build dataset arrays (include Pendiente)
        const statuses = ['Disponible', 'Pendiente', 'Reservada', 'Promesada', 'Vendida'];
        const statusKeys = { 
            'Disponible': 'disponibles', 
            'Pendiente':  'pendientes', 
            'Reservada':  'reservadas', 
            'Promesada':  'promesadas', 
            'Vendida':    'vendidas' 
        };

        const datasets = statuses.map(function (status) {
            return {
                label: status,
                data: projectNames.map(function (name) {
                    var p = perProject[name];
                    return p ? (p[statusKeys[status]] || 0) : 0;
                }),
                backgroundColor: COLORS[status],
                borderColor: 'rgba(0,0,0,0.2)',
                borderWidth: 1,
                borderRadius: 4
            };
        });

        const ctx = canvas.getContext('2d');

        projectsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: projectNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: _getChartTextColor(),
                            font: { size: 11, family: '"Inter", "Segoe UI", sans-serif' }
                        },
                        grid: {
                            color: _getChartGridColor(),
                            drawBorder: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { color: _getChartTextColor(),
                            stepSize: 5,
                            font: { size: 11, family: '"Inter", "Segoe UI", sans-serif' }
                        },
                        grid: {
                            color: _getChartGridColor(),
                            drawBorder: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12, family: '"Inter", "Segoe UI", sans-serif' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,15,25,0.92)',
                        titleColor: '#ffffff',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12
                    }
                }
            }
        });
    }

    // ── Render Monthly Sales by Project (real data) ────────────────────────
    function _renderVelocityChart(stats) {
        const canvas = document.getElementById('chart-velocity');
        if (!canvas) return;
        if (velocityChart) { velocityChart.destroy(); velocityChart = null; }

        // ── Build last 12 months labels ──
        const now = new Date();
        const months = [];
        const monthKeys = []; // 'YYYY-MM'
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toLocaleString('es-CL', { month: 'short', year: '2-digit' }));
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        // ── Get real data ──
        const proyectos  = APP5T_DB.getAll('proyectos')  || [];
        const etapas     = APP5T_DB.getAll('etapas')     || [];
        const propiedades= APP5T_DB.getAll('propiedades')|| [];
        const negociaciones = APP5T_DB.getAll('negociaciones') || [];

        // Build prop → proyecto map
        const propToProyecto = {};
        propiedades.forEach(p => {
            let idProy = p.id_proyecto;
            if (!idProy && p.id_etapa) {
                const etapa = etapas.find(e => Number(e.id) === Number(p.id_etapa));
                if (etapa) idProy = etapa.id_proyecto;
            }
            if (idProy) propToProyecto[p.id] = idProy;
        });

        // Count closed/active negotiations per project per month
        // Active = estado_avance in ['Aprobado','Finalizado','En Curso']
        const ACTIVE_STATES = ['aprobado', 'finalizado', 'en curso'];
        const countsByProyecto = {}; // { proyId: { 'YYYY-MM': count } }

        negociaciones.forEach(neg => {
            const status = String(neg.estado_avance || '').trim().toLowerCase();
            if (!ACTIVE_STATES.includes(status)) return;

            const rawDate = neg.fecha_negociacion || neg.fecha_promesa || neg.fecha_inicio || '';
            if (!rawDate) return;
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return;
            const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthKeys.includes(mk)) return;

            const idProp = neg.id_propiedad;
            const idProy = propToProyecto[idProp];
            if (!idProy) return;

            if (!countsByProyecto[idProy]) countsByProyecto[idProy] = {};
            countsByProyecto[idProy][mk] = (countsByProyecto[idProy][mk] || 0) + 1;
        });

        // ── Palette: one vibrant color per project ──
        const PALETTE = [
            { border: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
            { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
            { border: '#10b981', bg: 'rgba(16,185,129,0.15)' },
            { border: '#f43f5e', bg: 'rgba(244,63,94,0.15)'  },
            { border: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  }
        ];

        const proyectosConDatos = proyectos.filter(pr => countsByProyecto[pr.id]);
        // If no data at all, show all projects with zero
        const proyectosRender = proyectosConDatos.length > 0 ? proyectosConDatos : proyectos.slice(0, 5);

        const datasets = proyectosRender.map((pr, i) => {
            const col = PALETTE[i % PALETTE.length];
            const counts = countsByProyecto[pr.id] || {};
            return {
                label: pr.nombre_proyecto || pr.nombre || `Proyecto ${pr.id}`,
                data: monthKeys.map(mk => counts[mk] || 0),
                borderColor: col.border,
                backgroundColor: col.bg,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: col.border,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7
            };
        });

        const ctx = canvas.getContext('2d');
        velocityChart = new Chart(ctx, {
            type: 'line',
            data: { labels: months, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: { color: _getChartTextColor(), font: { size: 11, family: '"Inter", sans-serif' } },
                        grid: { color: _getChartGridColor(), drawBorder: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: _getChartTextColor(),
                            stepSize: 1,
                            precision: 0,
                            font: { size: 11, family: '"Inter", sans-serif' }
                        },
                        grid: { color: _getChartGridColor(), drawBorder: false }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 14,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            font: { size: 12, family: '"Inter", "Segoe UI", sans-serif' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10,12,30,0.93)',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: ${ctx.parsed.y} negociación${ctx.parsed.y !== 1 ? 'es' : ''}`;
                            }
                        }
                    }
                }
            }
        });

        // ── Render rentability panel (injected below chart-card) ──
        _renderRentabilityPanel(proyectos, etapas, propiedades, negociaciones, propToProyecto, PALETTE);
    }

    // ── Rentability Panel: table below velocity chart ──────────────────────
    function _renderRentabilityPanel(proyectos, etapas, propiedades, negociaciones, propToProyecto, PALETTE) {
        const containerId = 'chart-rentability-panel';
        let panel = document.getElementById(containerId);
        if (!panel) return; // injected in HTML

        const ACTIVE_STATES = ['aprobado', 'finalizado', 'en curso'];

        const rows = proyectos.map((pr, i) => {
            const col = PALETTE[i % PALETTE.length];
            const lotes = propiedades.filter(p => {
                let idProy = p.id_proyecto;
                if (!idProy && p.id_etapa) {
                    const et = etapas.find(e => Number(e.id) === Number(p.id_etapa));
                    if (et) idProy = et.id_proyecto;
                }
                return Number(idProy) === Number(pr.id);
            });

            const total = lotes.length;
            const vendidas  = lotes.filter(p => p.estado === 'Vendida').length;
            const promesadas= lotes.filter(p => p.estado === 'Promesada').length;
            const reservadas= lotes.filter(p => p.estado === 'Reservada' || p.estado === 'Venta_Directa').length;
            const disponibles = lotes.filter(p => p.estado === 'Disponible').length;
            const ocupados  = vendidas + promesadas + reservadas;
            const pct       = total > 0 ? Math.round((ocupados / total) * 100) : 0;

            // Ingresos: sum valor_final de negociaciones activas de este proyecto
            let ingresos = 0;
            negociaciones.forEach(neg => {
                const status = String(neg.estado_avance || '').trim().toLowerCase();
                if (!ACTIVE_STATES.includes(status)) return;
                const idProp = neg.id_propiedad;
                if (Number(propToProyecto[idProp]) !== Number(pr.id)) return;
                ingresos += Number(neg.valor_final || 0);
            });

            // Acción recomendada
            let accion = '', accionColor = '';
            if (pct >= 80)       { accion = '✅ En meta';        accionColor = '#10b981'; }
            else if (pct >= 50)  { accion = '⚡ Impulsar ventas'; accionColor = '#f59e0b'; }
            else                 { accion = '🚨 Acción urgente';  accionColor = '#f43f5e'; }

            // Progress bar
            const barVendida  = total > 0 ? (vendidas   / total * 100).toFixed(1) : 0;
            const barPromesa  = total > 0 ? (promesadas  / total * 100).toFixed(1) : 0;
            const barReserva  = total > 0 ? (reservadas  / total * 100).toFixed(1) : 0;
            const barDisp     = total > 0 ? (disponibles / total * 100).toFixed(1) : 0;

            return `
            <tr style="border-bottom:1px solid rgba(99,102,241,0.08);">
              <td style="padding:10px 12px;min-width:130px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${col.border};flex-shrink:0;"></span>
                  <strong style="font-size:0.82rem;color:#ffffff;">${pr.nombre_proyecto || pr.nombre || '—'}</strong>
                </div>
              </td>
              <td style="padding:10px 8px;text-align:center;font-size:0.82rem;color:#334155;">${total}</td>
              <td style="padding:10px 8px;min-width:140px;">
                <div style="height:8px;border-radius:6px;overflow:hidden;display:flex;background:rgba(15,23,42,0.07);">
                  <div style="width:${barVendida}%;background:#e74c3c;" title="Vendida"></div>
                  <div style="width:${barPromesa}%;background:#3498db;" title="Promesada"></div>
                  <div style="width:${barReserva}%;background:#f39c12;" title="Reservada"></div>
                  <div style="width:${barDisp}%;background:rgba(15,23,42,0.07);" title="Disponible"></div>
                </div>
                <div style="font-size:0.7rem;color:#64748b;margin-top:3px;">${ocupados} ocupados de ${total}</div>
              </td>
              <td style="padding:10px 8px;text-align:center;">
                <span style="font-size:0.9rem;font-weight:700;color:${pct>=70?'#10b981':pct>=40?'#f59e0b':'#f43f5e'};">${pct}%</span>
              </td>
              <td style="padding:10px 8px;text-align:right;font-size:0.8rem;color:#ffffff;white-space:nowrap;">
                ${APP5T_Utils.formatMoneda(ingresos)}
              </td>
              <td style="padding:10px 8px;text-align:center;">
                <span style="font-size:0.75rem;font-weight:600;color:${accionColor};">${accion}</span>
              </td>
            </tr>`;
        }).join('');

        panel.innerHTML = `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:rgba(99,102,241,0.06);border-bottom:2px solid rgba(99,102,241,0.15);">
                <th style="padding:9px 12px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Proyecto</th>
                <th style="padding:9px 8px;text-align:center;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Lotes</th>
                <th style="padding:9px 8px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Progreso</th>
                <th style="padding:9px 8px;text-align:center;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Ocupación</th>
                <th style="padding:9px 8px;text-align:right;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Ingresos activos</th>
                <th style="padding:9px 8px;text-align:center;font-size:0.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">Estado</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">Sin datos de proyectos</td></tr>'}</tbody>
          </table>`;
    }


    // ── Render Goals Doughnut (Gauge) ──────────────────────────────────────
    function _renderGoalsChart(stats) {
        const canvas = document.getElementById('chart-goals');
        if (!canvas) return;
        if (goalsChart) { goalsChart.destroy(); goalsChart = null; }

        const meta = 500000000; // Meta anual fija 500M (ejemplo)
        const logrado = stats.ingresoRecaudado || 0;
        const porcentaje = Math.min((logrado / meta) * 100, 100).toFixed(1);
        const restante = Math.max(meta - logrado, 0);

        const centerProgressPlugin = {
            id: 'centerProgressText',
            beforeDraw: function(chart) {
                if (chart.config.type !== 'doughnut') return;
                const ctx = chart.ctx;
                const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                ctx.save();
                ctx.font = 'bold 24px "Inter", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(porcentaje + '%', centerX, centerY);
                ctx.restore();
            }
        };

        const ctx = canvas.getContext('2d');
        goalsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Logrado', 'Restante'],
                datasets: [{
                    data: [logrado, restante],
                    backgroundColor: ['#f1c40f', 'rgba(255, 255, 255, 0.12)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            plugins: [centerProgressPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return ' ' + context.label + ': ' + APP5T_Utils.formatMoneda(context.parsed); }
                        }
                    }
                }
            }
        });
    }

    // ── Nuevos Gráficos por Rol ─────────────────────────────────────────────

    // -- Gerente --
    function _renderLeaderboardChart(stats) {
        const canvas = document.getElementById('chart-leaderboard');
        if (!canvas) return;
        if (leaderboardChart) { leaderboardChart.destroy(); }

        const vendedores = APP5T_DB.getAll('vendedores') || [];
        const negociaciones = APP5T_DB.getAll('negociaciones') || [];
        
        const rank = {};
        vendedores.forEach(v => rank[v.id] = { nombre: v.nombre_vendedor || v.nombre || 'Vendedor', total: 0 });
        
        negociaciones.forEach(neg => {
            const st = String(neg.estado_avance || '').toLowerCase();
            if (st === 'aprobado' || st === 'finalizado' || st === 'en curso') {
                if (neg.id_vendedor && rank[neg.id_vendedor]) {
                    rank[neg.id_vendedor].total += Number(neg.valor_final || 0);
                }
            }
        });

        const dataArr = Object.values(rank).sort((a,b) => b.total - a.total).slice(0, 5); // Top 5
        
        const ctx = canvas.getContext('2d');
        leaderboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dataArr.map(d => d.nombre),
                datasets: [{
                    label: 'Ventas Activas',
                    data: dataArr.map(d => d.total),
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { 
                        ticks: { color: _getChartTextColor(), callback: v => (v/1000000) + 'M',
                            stepSize: 1000000 } 
                    } 
                }
            }
        });
    }

    function _renderCashflowChart(stats, overrideId, projectId = 'all') {
        const id = overrideId || 'chart-cashflow';
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (cashflowChart) { cashflowChart.destroy(); }
        
        const year = typeof selectedYearCashflow !== 'undefined' ? selectedYearCashflow : new Date().getFullYear();
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        const cuotasAll = APP5T_DB.getAll('cuenta_corriente') || [];
        let cuotas = cuotasAll;
        if (projectId !== 'all') {
            const propiedades = APP5T_DB.getAll('propiedades') || [];
            cuotas = cuotasAll.filter(c => {
                const prop = propiedades.find(p => String(p.id) === String(c.id_propiedad));
                return prop && String(prop.id_proyecto) === String(projectId);
            });
        }
        
        const dataFlujo = new Array(12).fill(0);
        cuotas.forEach(c => {
            if (!c.fecha_vencimiento) return;
            const d = APP5T_Utils.parseFecha(c.fecha_vencimiento);
            if (d && !isNaN(d.getTime()) && d.getFullYear() === year) {
                const mes = d.getMonth();
                const valorTotal = c.valor_cuota || 0;
                const valorPagado = c.valor_pagado || 0;
                dataFlujo[mes] += Math.max(0, valorTotal - valorPagado);
            }
        });

        const ctx = canvas.getContext('2d');
        cashflowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames.map(m => m + ' ' + year),
                datasets: [{
                    label: 'Flujo Esperado (Pendiente)',
                    data: dataFlujo,
                    borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.2)', fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { grid: { display: false }, border: { display: false }, ticks: { color: _getChartTextColor(), font: { size: 9 }, maxRotation: 45, minRotation: 45 } },
                    y: { 
                        grid: { color: 'rgba(0,0,0,0.04)' }, border: { display: false },
                        ticks: { color: _getChartTextColor(), callback: v => (v/1000000) + 'M', stepSize: 10000000 }
                    }
                }
            }
        });
    }

    function _renderGeneralFunnelChart(stats) {
        const canvas = document.getElementById('chart-funnel-general');
        if (!canvas) return;
        if (funnelGeneralChart) { funnelGeneralChart.destroy(); }
        
        const ctx = canvas.getContext('2d');
        funnelGeneralChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Disponibles', 'Reservadas', 'Promesadas', 'Vendidas'],
                datasets: [{
                    label: 'Lotes',
                    data: [stats.disponibles || 0, stats.reservadas || 0, stats.promesadas || 0, stats.vendidas || 0],
                    backgroundColor: [COLORS['Disponible'], COLORS['Reservada'], COLORS['Promesada'], COLORS['Vendida']],
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // -- Administrador --
    function _renderMorosidadChart(stats, overrideId) {
        const id = overrideId || 'chart-morosidad';
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (morosidadChart) { morosidadChart.destroy(); }
        
        const ctactes = APP5T_DB.getAll('cuenta_corriente') || [];
        let alDia = 0, vencidas = 0;
        ctactes.forEach(c => {
            const st = String(c.estado || c.estado_cuota || '').toLowerCase();
            const pag = Number(c.valor_pagado) || 0;
            const pact = Number(c.valor_cuota) || 0;
            if (st.includes('pagad') || (pag >= pact && pact > 0)) {
                alDia++;
            } else if (st === 'abonada' || pag > 0) {
                alDia++;
            } else if (st === 'vencida') {
                vencidas++;
            } else if (st === 'pendiente' || st === 'pendiente pago') {
                if (c.fecha_vencimiento) {
                    const dt = APP5T_Utils.parseFecha(c.fecha_vencimiento);
                    const now = new Date(); now.setHours(0,0,0,0);
                    if (dt && dt < now) vencidas++;
                    else alDia++;
                } else {
                    alDia++;
                }
            }
        });
        if (alDia === 0 && vencidas === 0) alDia = 1;

        const ctx = canvas.getContext('2d');
        
        const total = alDia + vencidas;
        const realTotal = (alDia === 1 && vencidas === 0 && ctactes.length === 0) ? 0 : total;
        const percent = realTotal > 0 ? ((vencidas / realTotal) * 100).toFixed(1) : 0;
        
        // Update HTML overlay instead of canvas plugin
        const percentElement = document.getElementById('morosidad-percent-text-gerencia');
        if (percentElement) {
            percentElement.innerText = percent + "%";
            percentElement.style.color = (parseFloat(percent) > 10) ? '#ff1744' : 'var(--text-white, #1e293b)';
        }

        morosidadChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Al Día', 'Con Deuda'],
                datasets: [{ 
                    data: [alDia, vencidas], 
                    backgroundColor: ['#00E676', '#FF1744'], 
                    hoverBackgroundColor: ['#00C853', '#D50000'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: { 
                circumference: 180,
                rotation: -90,
                responsive: true, 
                maintainAspectRatio: false,
                cutout: '76%',
                layout: {
                    padding: {
                        top: 5,
                        bottom: 0,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom', 
                        labels: { 
                            usePointStyle: true, 
                            boxWidth: 8,
                            padding: 12,
                            font: { family: "'Inter', sans-serif", size: 11, weight: '700' },
                            color: '#ffffff'
                        } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: "'Inter', sans-serif", size: 12 },
                        bodyFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
                        padding: 10,
                        cornerRadius: 8,
                        boxPadding: 4,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    function _renderLegalFunnelChart(stats) {
        const canvas = document.getElementById('chart-embudo-legal');
        if (!canvas) return;
        if (embudoLegalChart) { embudoLegalChart.destroy(); }
        
        const tramites = APP5T_DB.getAll('tramites') || [];
        let redaccion = 0, notaria = 0, cbr = 0, entregado = 0;
        tramites.forEach(t => {
            const st = String(t.estado_tramite || '').toLowerCase();
            if (st.includes('redac')) redaccion++;
            else if (st.includes('notar')) notaria++;
            else if (st.includes('cbr') || st.includes('bienes')) cbr++;
            else entregado++;
        });

        const ctx = canvas.getContext('2d');
        embudoLegalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Redacción', 'Notaría', 'CBR', 'Entregado'],
                datasets: [{
                    label: 'Trámites',
                    data: [redaccion, notaria, cbr, entregado],
                    backgroundColor: '#8e44ad', borderRadius: 4
                }]
            },
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: {
                    x: {
                        ticks: { color: _getChartTextColor(), font: { size: 11, family: '"Inter", sans-serif' } },
                        grid: { color: _getChartGridColor() }
                    },
                    y: {
                        ticks: { color: _getChartTextColor(), font: { size: 12, weight: '600', family: '"Inter", sans-serif' } },
                        grid: { display: false }
                    }
                },
                plugins: { legend: { display: false } } 
            }
        });
    }

    function _renderCobranzaMesChart(stats, overrideId, projectId = 'all') {
        const id = overrideId || 'chart-cobranza-mes';
        const canvas = document.getElementById(id);
        if (!canvas) return;
        if (cobranzaMesCharts[id]) { cobranzaMesCharts[id].destroy(); }
        
        const filterId = id === 'chart-cobranza-mes-gerencia' ? 'filter-cobranza-project-gerencia' : 'filter-cobranza-project';
        const filterSelect = document.getElementById(filterId);
        if (filterSelect && filterSelect.options.length <= 1) {
            const proyectos = APP5T_DB.getAll('proyectos') || [];
            proyectos.forEach(pr => {
                const opt = document.createElement('option');
                opt.value = pr.id;
                opt.textContent = pr.nombre;
                filterSelect.appendChild(opt);
            });
            filterSelect.value = projectId;
        }

        const cuotasAll = APP5T_DB.getAll('cuenta_corriente') || [];
        let cuotas = cuotasAll;
        if (projectId !== 'all') {
            const propiedades = APP5T_DB.getAll('propiedades') || [];
            cuotas = cuotasAll.filter(c => {
                const prop = propiedades.find(p => String(p.id) === String(c.id_propiedad));
                return prop && String(prop.id_proyecto) === String(projectId);
            });
        }
        
        const monthlyData = {};
        
        cuotas.forEach(c => {
            if (!c.fecha_vencimiento) return;
            const d = APP5T_Utils.parseFecha(c.fecha_vencimiento);
            if (!d || isNaN(d.getTime())) return;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const key = yyyy + '-' + mm; // YYYY-MM
            
            if (!monthlyData[key]) {
                monthlyData[key] = { recaudado: 0, pendiente: 0 };
            }
            
            const valorTotal = c.valor_cuota || 0;
            const valorPagado = c.valor_pagado || 0;
            
            monthlyData[key].recaudado += valorPagado;
            monthlyData[key].pendiente += Math.max(0, valorTotal - valorPagado);
        });
        
        const labels = [];
        const dataRecaudado = [];
        const dataPendiente = [];
        
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const year = typeof selectedYearCobranza !== 'undefined' ? selectedYearCobranza : new Date().getFullYear();
        
        // 12 meses: Año calendario seleccionado
        for (let i = 0; i < 12; i++) {
            const mm = String(i + 1).padStart(2, '0');
            const key = year + '-' + mm;
            
            labels.push(monthNames[i] + ' ' + year);
            
            if (monthlyData[key]) {
                dataRecaudado.push(monthlyData[key].recaudado);
                dataPendiente.push(monthlyData[key].pendiente);
            } else {
                dataRecaudado.push(0);
                dataPendiente.push(0);
            }
        }
        
        const ctx = canvas.getContext('2d');
        cobranzaMesCharts[id] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Recaudado', data: dataRecaudado, backgroundColor: '#3498db', maxBarThickness: 20 },
                    { label: 'Por Recaudar', data: dataPendiente, backgroundColor: '#94a3b8', maxBarThickness: 20 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        stacked: true, 
                        grid: { display: false },
                        ticks: { color: _getChartTextColor(), font: { size: 9 }, maxRotation: 45, minRotation: 45 }
                    },
                    y: { 
                        stacked: true, 
                        border: { display: false },
                        ticks: { color: _getChartTextColor(), callback: v => (v/1000000) + 'M',
                            stepSize: 1000000 } 
                    }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } }
                }
            }
        });
    }

    // -- Vendedor --
    function _renderPersonalFunnelChart(stats) {
        const canvas = document.getElementById('chart-funnel-personal');
        if (!canvas) return;
        if (funnelPersonalChart) { funnelPersonalChart.destroy(); }
        
        // Simulado: en prod se filtraria por el vendedor logueado
        const ctx = canvas.getContext('2d');
        funnelPersonalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mis Leads', 'Mis Reservas', 'Mis Promesas', 'Mis Ventas'],
                datasets: [{
                    label: 'Unidades',
                    data: [12, Math.floor((stats.reservadas||0)/3), Math.floor((stats.promesadas||0)/3), Math.floor((stats.vendidas||0)/3)],
                    backgroundColor: ['#95a5a6', COLORS['Reservada'], COLORS['Promesada'], COLORS['Vendida']], borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // _renderPersonalMetaChart removed

    function _renderAlertasReservas() {
        const panel = document.getElementById('chart-alertas-vendedor-panel');
        if (!panel) return;
        
        const negs = APP5T_DB.getAll('negociaciones') || [];
        const props = APP5T_DB.getAll('propiedades') || [];
        
        let html = '';
        const porVencer = negs.filter(n => String(n.estado_avance||'').toLowerCase() === 'reserva_enviada' || String(n.estado_avance||'').toLowerCase() === 'reserva_aprobada').slice(0,4);
        
        if (porVencer.length === 0) {
            html = '<div style="color:#64748b;padding:10px;">No hay reservas próximas a vencer.</div>';
        } else {
            porVencer.forEach(n => {
                const prop = props.find(p => p.id === n.id_propiedad);
                const propName = prop ? prop.nombre : `Lote ${n.id_propiedad}`;
                html += `
                <div style="background:rgba(231,76,60,0.1); border-left:4px solid #e74c3c; padding:10px; margin-bottom:8px; border-radius:4px;">
                    <strong style="color:#c0392b;">${propName}</strong> - Cliente: ${n.id_cliente} <br>
                    <small style="color:#e74c3c;">Revisar plazo de reserva (ID Negociación: ${n.id})</small>
                </div>`;
            });
        }
        panel.innerHTML = html;
    }

    // -- Alertas Admin (Próximos Vencimientos a 30 días) --
    function _renderAlertasAdmin() {
        const panel = document.getElementById('chart-alertas-admin-panel');
        if (!panel) return;
        
        const cuotas = APP5T_DB.getAll('cuenta_corriente') || [];
        const clientes = APP5T_DB.getAll('clientes') || [];
        
        const hoy = new Date();
        const en30Dias = new Date();
        en30Dias.setDate(hoy.getDate() + 30);
        
        let proximas = cuotas.filter(c => {
            if (c.estado_cuota !== 'Pendiente Pago' && c.estado_cuota !== 'Vencida') return false;
            if (!c.fecha_vencimiento) return false;
            const fVenc = APP5T_Utils.parseFecha(c.fecha_vencimiento);
            if (!fVenc || isNaN(fVenc.getTime())) return false;
            // Que venza pronto (entre hoy-algo y 30 días) o ya esté vencida
            return fVenc <= en30Dias;
        });
        
        // Ordenar por fecha_vencimiento
        proximas.sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        
        // Limitar a 6 para no saturar
        proximas = proximas.slice(0, 6);
        
        let html = '';
        if (proximas.length === 0) {
            html = '<div style="color:#64748b;padding:10px;">No hay cuotas por vencer en los próximos 30 días.</div>';
        } else {
            proximas.forEach(c => {
                const clienteObj = clientes.find(cl => String(cl.id) === String(c.id_cliente));
                const nombreCliente = clienteObj ? clienteObj.nombres + ' ' + clienteObj.apellidos : 'Cliente ID: ' + c.id_cliente;
                const dVenc = APP5T_Utils.parseFecha(c.fecha_vencimiento);
                const isVencida = dVenc && (dVenc.getTime() < hoy.getTime());
                const colorBorder = isVencida ? '#e74c3c' : '#f39c12';
                const bgColor = isVencida ? 'rgba(231,76,60,0.1)' : 'rgba(243,156,18,0.1)';
                
                html += `
                <div style="background:${bgColor}; border-left:4px solid ${colorBorder}; padding:10px; margin-bottom:8px; border-radius:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:${colorBorder};">Cuota ${c.cuota_nro || '-'} • ${APP5T_Utils.formatMoneda(c.valor_cuota || 0)}</strong>
                        <span style="font-size:0.8rem; font-weight:600; color:${colorBorder};">${isVencida ? 'VENCIDA' : 'Pronto a vencer'}</span>
                    </div>
                    <div style="font-size:0.9rem; margin-top:4px; color:var(--text-light);">
                        <i class="fa-solid fa-user"></i> ${nombreCliente}<br>
                        <i class="fa-regular fa-calendar"></i> Vence: ${c.fecha_vencimiento}
                    </div>
                </div>`;
            });
        }
        panel.innerHTML = html;
    }


    // ── Helper: Render offline warning when Chart.js is missing ────────────
    function _renderOfflineWarning() {
        const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-leaderboard', 'chart-cashflow', 'chart-funnel-general', 'chart-morosidad', 'chart-embudo-legal', 'chart-cobranza-mes', 'chart-funnel-personal'];
        ids.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.style.display = 'none';
                    let warn = parent.querySelector('.chart-offline-warning');
                    if (!warn) {
                        warn = document.createElement('div');
                        warn.className = 'chart-offline-warning';
                        warn.style.cssText = 'color:var(--text-dim);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:150px;font-size:13px;gap:8px;padding:20px;text-align:center;';
                        warn.innerHTML = '<i class="fa-solid fa-cloud-slash" style="font-size:24px;color:var(--primary);opacity:0.7;"></i><span>Gráficos no disponibles</span>';
                        parent.appendChild(warn);
                    }
                }
            }
        });
    }

    const chartInstances = {};

    // --- NEW GERENCIA CHARTS ---
    function _renderTendenciaMensual(stats) {
        const canvas = document.getElementById('chart-tendencia-mensual');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (chartInstances['chart-tendencia-mensual']) chartInstances['chart-tendencia-mensual'].destroy();
        
        chartInstances['chart-tendencia-mensual'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ventas ($)',
                    data: [120000000, 150000000, 100000000, 200000000, 280000000, 240000000],
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { grid: { display: false }, border: { display: false } },
                    y: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    function _bindEvolucionToggleButtons() {
        const btnUnits = document.getElementById('btn-evolucion-unidades');
        const btnMoney = document.getElementById('btn-evolucion-monto');
        if (btnUnits && !btnUnits.dataset.bound) {
            btnUnits.dataset.bound = 'true';
            btnUnits.addEventListener('click', () => {
                selectedModeEvolucion = 'units';
                btnUnits.style.background = '#2563eb';
                btnUnits.style.color = '#ffffff';
                if (btnMoney) {
                    btnMoney.style.background = 'transparent';
                    btnMoney.style.color = '#94a3b8';
                }
                const dbFilter = document.getElementById('dashboard-filter-proyecto');
                const idProyecto = dbFilter ? dbFilter.value : 'all';
                _renderEvolucionVentas(APP5T_DB.getStats(idProyecto));
            });
        }
        if (btnMoney && !btnMoney.dataset.bound) {
            btnMoney.dataset.bound = 'true';
            btnMoney.addEventListener('click', () => {
                selectedModeEvolucion = 'money';
                btnMoney.style.background = '#2563eb';
                btnMoney.style.color = '#ffffff';
                if (btnUnits) {
                    btnUnits.style.background = 'transparent';
                    btnUnits.style.color = '#94a3b8';
                }
                const dbFilter = document.getElementById('dashboard-filter-proyecto');
                const idProyecto = dbFilter ? dbFilter.value : 'all';
                _renderEvolucionVentas(APP5T_DB.getStats(idProyecto));
            });
        }
    }

    function _renderEvolucionVentas(stats) {
        const canvas = document.getElementById('chart-evolucion-ventas');
        if (!canvas) return;
        if (evolucionVentasChart) { evolucionVentasChart.destroy(); }
        
        _bindEvolucionToggleButtons();

        const propiedades = APP5T_DB.getAll('propiedades') || [];
        const negociaciones = APP5T_DB.getAll('negociaciones') || [];
        
        const dbFilter = document.getElementById('dashboard-filter-proyecto');
        const idProyecto = dbFilter ? dbFilter.value : 'all';

        const year = typeof selectedYearEvolucion !== 'undefined' ? selectedYearEvolucion : new Date().getFullYear();
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        const promesasCount = new Array(12).fill(0);
        const promesasMonto = new Array(12).fill(0);
        const escriturasCount = new Array(12).fill(0);
        const escriturasMonto = new Array(12).fill(0);

        // Mapa de propiedades
        const propMap = {};
        propiedades.forEach(p => { propMap[p.id] = p; });

        const countedProps = new Set();

        negociaciones.forEach(n => {
            const p = propMap[n.id_propiedad];
            if (!p) return;
            if (idProyecto !== 'all' && String(p.id_proyecto) !== String(idProyecto)) return;

            const monto = Number(n.valor_final) || Number(p.valor_final) || 0;
            const esEscritura = (p.estado === 'Vendida' || p.estado === 'Escriturada' || n.id_proceso === 'Escritura' || n.tipo_operacion === 'Venta Directa');

            // 1. Promesas
            const fechaPromStr = n.fecha_promesa || n.fecha_negociacion || p.fecha_venta;
            if (fechaPromStr) {
                const dProm = APP5T_Utils.parseFecha(fechaPromStr);
                if (dProm && !isNaN(dProm.getTime()) && dProm.getFullYear() === year) {
                    const m = dProm.getMonth();
                    promesasCount[m]++;
                    promesasMonto[m] += monto;
                }
            }

            // 2. Escrituras
            if (esEscritura) {
                const fechaEscStr = p.fecha_venta || n.fecha_promesa || n.fecha_negociacion;
                if (fechaEscStr) {
                    const dEsc = APP5T_Utils.parseFecha(fechaEscStr);
                    if (dEsc && !isNaN(dEsc.getTime()) && dEsc.getFullYear() === year) {
                        const m = dEsc.getMonth();
                        escriturasCount[m]++;
                        escriturasMonto[m] += monto;
                    }
                }
            }

            countedProps.add(p.id);
        });

        // Complemento de inventario para propiedades sin negociación explícita
        propiedades.forEach(p => {
            if (countedProps.has(p.id)) return;
            if (idProyecto !== 'all' && String(p.id_proyecto) !== String(idProyecto)) return;

            const monto = Number(p.valor_final) || 0;
            if (p.estado === 'Promesada' && p.fecha_venta) {
                const d = APP5T_Utils.parseFecha(p.fecha_venta);
                if (d && !isNaN(d.getTime()) && d.getFullYear() === year) {
                    const m = d.getMonth();
                    promesasCount[m]++;
                    promesasMonto[m] += monto;
                }
            } else if ((p.estado === 'Vendida' || p.estado === 'Escriturada') && p.fecha_venta) {
                const d = APP5T_Utils.parseFecha(p.fecha_venta);
                if (d && !isNaN(d.getTime()) && d.getFullYear() === year) {
                    const m = d.getMonth();
                    escriturasCount[m]++;
                    escriturasMonto[m] += monto;
                }
            }
        });

        // Totales de año para los mini KPIs
        const totProm = promesasCount.reduce((a, b) => a + b, 0);
        const totEsc = escriturasCount.reduce((a, b) => a + b, 0);
        const totMonto = promesasMonto.reduce((a, b) => a + b, 0);

        const elKpiProm = document.getElementById('kpi-prom-total');
        const elKpiEsc = document.getElementById('kpi-esc-total');
        const elKpiMonto = document.getElementById('kpi-monto-total');
        if (elKpiProm) elKpiProm.innerText = totProm;
        if (elKpiEsc) elKpiEsc.innerText = totEsc;
        if (elKpiMonto) elKpiMonto.innerText = APP5T_Utils.formatMoneda(totMonto);

        const isUnits = (selectedModeEvolucion === 'units');
        const dataPromesas = isUnits ? promesasCount : promesasMonto;
        const dataEscrituras = isUnits ? escriturasCount : escriturasMonto;

        const ctx = canvas.getContext('2d');
        evolucionVentasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: isUnits ? 'Promesas (Lotes)' : 'Promesas ($)',
                        data: dataPromesas,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    },
                    {
                        label: isUnits ? 'Escrituras (Lotes)' : 'Escrituras ($)',
                        data: dataEscrituras,
                        backgroundColor: '#10b981',
                        borderRadius: 4,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            boxWidth: 10,
                            font: { size: 11, weight: '600', family: '"Inter", sans-serif' }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw || 0;
                                if (isUnits) {
                                    return `${context.dataset.label}: ${val} lote(s)`;
                                } else {
                                    return `${context.dataset.label}: ${APP5T_Utils.formatMoneda(val)}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: _getChartTextColor(),
                            font: { size: 10, family: '"Inter", sans-serif' },
                            callback: function(value) {
                                if (isUnits) return value;
                                if (value >= 1000000) return '$' + Math.round(value / 1000000) + 'M';
                                return '$' + value;
                            }
                        },
                        grid: { color: _getChartGridColor() }
                    },
                    x: {
                        ticks: { color: _getChartTextColor(), font: { size: 11, family: '"Inter", sans-serif' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function _renderEmbudoVentas(stats, idProyecto = 'all') {
        const canvas = document.getElementById('chart-embudo-ventas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (chartInstances['chart-embudo-ventas']) chartInstances['chart-embudo-ventas'].destroy();

        const reservadas = stats.reservadas || 0;
        const promesadas = stats.promesadas || 0;
        const vendidas = stats.vendidas || 0;

        const totalOperaciones = reservadas + promesadas + vendidas;
        const avanzaronAPromesa = promesadas + vendidas;

        // Tasas de conversión
        const convPromesa = totalOperaciones > 0 ? Math.round((avanzaronAPromesa / totalOperaciones) * 100) : 0;
        const convEscritura = avanzaronAPromesa > 0 ? Math.round((vendidas / avanzaronAPromesa) * 100) : 0;

        // Actualizar badges en la cabecera
        const elEf = document.getElementById('embudo-tasa-efectividad');
        const elConvP = document.getElementById('embudo-conv-promesa');
        const elConvE = document.getElementById('embudo-conv-escritura');
        const elLead = document.getElementById('embudo-lead-time');

        if (elEf) elEf.innerText = `${convPromesa}% Conversión a Promesa`;
        if (elConvP) elConvP.innerText = `${convPromesa}%`;
        if (elConvE) elConvE.innerText = `${convEscritura}%`;

        // Calcular Lead time promedio
        const negociaciones = APP5T_DB.getAll('negociaciones') || [];
        let sumDias = 0;
        let countDias = 0;
        negociaciones.forEach(n => {
            if (n.fecha_negociacion && n.fecha_promesa) {
                const d1 = APP5T_Utils.parseFecha(n.fecha_negociacion);
                const d2 = APP5T_Utils.parseFecha(n.fecha_promesa);
                if (d1 && d2 && d2 >= d1) {
                    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                    if (diff >= 0 && diff <= 180) {
                        sumDias += diff;
                        countDias++;
                    }
                }
            }
        });
        const leadProm = countDias > 0 ? Math.round(sumDias / countDias) : null;
        if (elLead) {
            elLead.innerText = leadProm !== null ? `⏱️ Prom. firma: ${leadProm} días` : `⏱️ Pipeline Activo`;
        }

        chartInstances['chart-embudo-ventas'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [
                    `1. Reservas (${reservadas})`,
                    `2. Promesas (${promesadas})`,
                    `3. Escrituras (${vendidas})`
                ],
                datasets: [{
                    label: 'Negocios',
                    data: [reservadas, promesadas, vendidas],
                    backgroundColor: ['#6366f1', '#3b82f6', '#10b981'],
                    borderRadius: 5,
                    barPercentage: 0.65
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: _getChartTextColor(), font: { size: 11, family: '"Inter", sans-serif' }, stepSize: 1 },
                        grid: { color: _getChartGridColor() }
                    },
                    y: {
                        ticks: { color: _getChartTextColor(), font: { size: 11, weight: '600', family: '"Inter", sans-serif' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const cantidad = context.raw;
                                const dataIndex = context.dataIndex;
                                let montoFinal = 0;
                                let conversionLabel = '';

                                if (dataIndex === 0) {
                                    montoFinal = stats.montoReservadas || 0;
                                    conversionLabel = 'Etapa Inicial (100%)';
                                } else if (dataIndex === 1) {
                                    montoFinal = stats.montoPromesadas || 0;
                                    conversionLabel = `Conversión desde Reserva: ${convPromesa}%`;
                                } else if (dataIndex === 2) {
                                    montoFinal = stats.montoVendidas || 0;
                                    conversionLabel = `Conversión desde Promesa: ${convEscritura}%`;
                                }
                                
                                const formattedMonto = APP5T_Utils.formatMoneda(montoFinal);
                                return [
                                    `Negocios: ${cantidad} lotes`,
                                    `Monto Comprometido: ${formattedMonto}`,
                                    conversionLabel
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    function _renderEstadoInventario(stats) {
        const canvas = document.getElementById('chart-estado-inventario');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (chartInstances['chart-estado-inventario']) chartInstances['chart-estado-inventario'].destroy();
        
        chartInstances['chart-estado-inventario'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Disponible', 'Reservado', 'Vendido'],
                datasets: [{
                    data: [60, 25, 15],
                    backgroundColor: ['#6366f1', '#818cf8', '#e2e8f0'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            },
            plugins: [{
                id: 'textCenter',
                beforeDraw: function(chart) {
                    var width = chart.width, height = chart.height, ctx = chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 80).toFixed(2);
                    ctx.font = "bold " + fontSize + "em Inter";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#ffffff";
                    var text = "124", textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2 - 10;
                    ctx.fillText(text, textX, textY);
                    ctx.font = "600 " + (fontSize*0.3) + "em Inter";
                    ctx.fillStyle = "#00e5ff";
                    var text2 = "UNIDADES", text2X = Math.round((width - ctx.measureText(text2).width) / 2), text2Y = height / 2 + 15;
                    ctx.fillText(text2, text2X, text2Y);
                    ctx.save();
                }
            }]
        });
    }

    function _renderAvanceEtapa(stats) {
        const container = document.getElementById('avance-etapa-container');
        if (!container) return;
        
        const proyectos = APP5T_DB.getAll('proyectos') || [];
        const etapas = APP5T_DB.getAll('etapas') || [];
        const propiedades = APP5T_DB.getAll('propiedades') || [];
        
        if (!proyectos.length || !etapas.length) {
            container.innerHTML = '<div style="font-size:12px;color:#64748b;">No hay datos de avance.</div>';
            return;
        }

        let html = '';
        const PALETTE = ['#4338ca', '#6366f1', '#818cf8', '#10b981', '#f59e0b'];

        etapas.forEach((etapa, index) => {
            const proyecto = proyectos.find(p => Number(p.id) === Number(etapa.id_proyecto));
            const nombreProy = proyecto ? proyecto.nombre : 'Proyecto';
            const nombreCompleto = `${nombreProy} - ${etapa.nombre}`;
            
            const propsEnEtapa = propiedades.filter(p => Number(p.id_etapa) === Number(etapa.id));
            const totalProps = propsEnEtapa.length;
            let vendidas = 0;
            if (totalProps > 0) {
                vendidas = propsEnEtapa.filter(p => ['Vendida', 'Promesada', 'Reservada'].includes(p.estado)).length;
            }
            
            const pct = totalProps > 0 ? Math.round((vendidas / totalProps) * 100) : 0;
            const color = PALETTE[index % PALETTE.length];

            html += `
            <div style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#ffffff; margin-bottom:5px;"><span>${nombreCompleto}</span><span>${pct}%</span></div>
              <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px;"><div style="width:${pct}%; height:100%; background:${color}; border-radius:4px;"></div></div>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    function _renderConversionLeads(stats) {
        const container = document.getElementById('conversion-leads-container');
        if (!container) return;
        container.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#6366f1; margin-bottom:5px; text-transform:uppercase;"><span>Promedio Global</span><span>6.8%</span></div>
          <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; margin-bottom:10px;"><div style="width:6.8%; height:100%; background:#6366f1; border-radius:4px;"></div></div>
          <div style="color:#64748b; font-size:11px; text-align:center;">% CONVERSIÓN DE MARKETING A CIERRE: 6.8%</div>
        `;
    }

    function _populateYearSelects() {
        if (yearsPopulated) return;
        const years = new Set([new Date().getFullYear()]);
        const propiedades = APP5T_DB.getAll('propiedades') || [];
        propiedades.forEach(p => {
            if (p.fecha_venta) {
                const d = APP5T_Utils.parseFecha(p.fecha_venta);
                if (d && !isNaN(d.getTime())) years.add(d.getFullYear());
            }
        });
        const cuotas = APP5T_DB.getAll('cuenta_corriente') || [];
        cuotas.forEach(c => {
            if (c.fecha_vencimiento) {
                const d = APP5T_Utils.parseFecha(c.fecha_vencimiento);
                if (d && !isNaN(d.getTime())) years.add(d.getFullYear());
            }
        });
        
        const sortedYears = Array.from(years).sort((a,b) => b - a);
        let opts = '';
        sortedYears.forEach(y => {
            opts += '<option value="'+y+'">'+y+'</option>';
        });
        
        const selects = [
            { id: 'filter-year-evolucion', varKey: 'evolucion' },
            { id: 'filter-year-cobranza', varKey: 'cobranza' },
            { id: 'filter-year-cashflow', varKey: 'cashflow' }
        ];
        
        selects.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) {
                el.innerHTML = opts;
                el.value = new Date().getFullYear();
                el.addEventListener('change', (e) => {
                    const y = parseInt(e.target.value, 10);
                    const dbFilter = document.getElementById('dashboard-filter-proyecto');
                    const idProyecto = dbFilter ? dbFilter.value : 'all';
                    const stats = APP5T_DB.getStats(idProyecto);
                    
                    if (s.varKey === 'evolucion') {
                        selectedYearEvolucion = y;
                        _renderEvolucionVentas(stats);
                    } else if (s.varKey === 'cobranza') {
                        selectedYearCobranza = y;
                        _renderCobranzaMesChart(stats, 'chart-cobranza-mes-gerencia', idProyecto);
                    } else if (s.varKey === 'cashflow') {
                        selectedYearCashflow = y;
                        _renderCashflowChart(stats, 'chart-cashflow-gerencia', idProyecto);
                    }
                });
            }
        });
        yearsPopulated = true;
    }

    // ── Public: renderDashboard ────────────────────────────────────────────
    function renderDashboard(role) {
        destroy();
        const dbFilter = document.getElementById('dashboard-filter-proyecto');
        let idProyecto = 'all';
        
        if (dbFilter) {
            // Llenar el filtro si está vacío
            if (!dbFilter.dataset.populated) {
                const proys = APP5T_DB.getAll('proyectos') || [];
                let opts = '<option value="all">-- Todos los Proyectos --</option>';
                proys.forEach(p => { opts += '<option value="' + p.id + '">' + p.nombre_proyecto + '</option>'; });
                dbFilter.innerHTML = opts;
                dbFilter.dataset.populated = "true";
                dbFilter.addEventListener('change', () => {
                    renderDashboard(role);
                });
            }
            idProyecto = dbFilter.value;
        }

        _populateYearSelects();

        const stats = APP5T_DB.getStats(idProyecto);
        _renderKPIs(stats, role);

        // 1. Toggle visibility based on role
        const roleClass = 'role-' + role;
        const chartElements = document.querySelectorAll('.role-chart');
        chartElements.forEach(el => {
            if (el.classList.contains(roleClass)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Showing offline fallback.');
            _renderOfflineWarning();
            return;
        }

        // Make sure canvas elements are visible if Chart is available
        const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-leaderboard', 'chart-cashflow', 'chart-funnel-general', 'chart-morosidad', 'chart-embudo-legal', 'chart-cobranza-mes', 'chart-funnel-personal', 'chart-tendencia-mensual', 'chart-embudo-ventas', 'chart-estado-inventario', 'chart-morosidad-gerencia', 'chart-cobranza-mes-gerencia', 'chart-cashflow-gerencia', 'chart-evolucion-ventas'];
        ids.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                canvas.style.display = '';
                const warn = canvas.parentElement ? canvas.parentElement.querySelector('.chart-offline-warning') : null;
                if (warn) warn.remove();
            }
        });

        // 2. Render charts based on role
        if (role === 'gerente') {
            _renderEmbudoVentas(stats, idProyecto);
            _renderEvolucionVentas(stats);
            _renderAvanceEtapa(stats, idProyecto);
            _renderMorosidadChart(stats, 'chart-morosidad-gerencia', idProyecto);
            _renderCobranzaMesChart(stats, 'chart-cobranza-mes-gerencia', idProyecto);
            _renderCashflowChart(stats, 'chart-cashflow-gerencia', idProyecto);
        } else if (role === 'administrador') {
            _renderCompositionChart(stats, idProyecto);
            _renderMorosidadChart(stats, 'chart-morosidad', idProyecto);
            _renderCobranzaMesChart(stats, 'chart-cobranza-mes', idProyecto);
            _renderAlertasAdmin();
        } else if (role === 'vendedor') {
            _renderPersonalFunnelChart(stats);
            _renderAlertasReservas();
        }
    }

    // ── Public: destroy ────────────────────────────────────────────────────
    function destroy() {
        if (compositionChart) { compositionChart.destroy(); compositionChart = null; }
        if (evolucionVentasChart) { evolucionVentasChart.destroy(); evolucionVentasChart = null; }
        if (projectsChart) { projectsChart.destroy(); projectsChart = null; }
        if (velocityChart) { velocityChart.destroy(); velocityChart = null; }
        if (goalsChart) { goalsChart.destroy(); goalsChart = null; }
        
        if (leaderboardChart) { leaderboardChart.destroy(); leaderboardChart = null; }
        if (cashflowChart) { cashflowChart.destroy(); cashflowChart = null; }
        if (funnelGeneralChart) { funnelGeneralChart.destroy(); funnelGeneralChart = null; }
        if (morosidadChart) { morosidadChart.destroy(); morosidadChart = null; }
        if (embudoLegalChart) { embudoLegalChart.destroy(); embudoLegalChart = null; }
        Object.keys(cobranzaMesCharts).forEach(k => {
            if (cobranzaMesCharts[k]) cobranzaMesCharts[k].destroy();
        });
        cobranzaMesCharts = {};
        if (funnelPersonalChart) { funnelPersonalChart.destroy(); funnelPersonalChart = null; }
    }

    // ── Export: PDF Report ──────────────────────────────────────────────────
    function _applyLightExportTheme(chart) {
        if (!chart || !chart.options) return null;
        const backup = { scales: {}, legend: null };

        // 1. Scales & Ticks (Ejes X e Y oscuros de alto contraste para fondo blanco)
        if (chart.options.scales) {
            Object.keys(chart.options.scales).forEach(k => {
                const s = chart.options.scales[k];
                if (!s) return;
                backup.scales[k] = {
                    ticksColor: s.ticks?.color,
                    ticksWeight: s.ticks?.font?.weight,
                    ticksSize: s.ticks?.font?.size,
                    gridColor: s.grid?.color
                };
                if (!s.ticks) s.ticks = {};
                s.ticks.color = '#0f172a'; // Negro azulado nítido para PDF
                if (!s.ticks.font) s.ticks.font = {};
                s.ticks.font.weight = '700'; // Negrita para máxima legibilidad
                if (!s.ticks.font.size || s.ticks.font.size < 10) s.ticks.font.size = 10;
                if (s.grid) s.grid.color = 'rgba(0, 0, 0, 0.12)';
            });
        }

        // 2. Leyendas
        if (chart.options.plugins?.legend?.labels) {
            backup.legend = {
                color: chart.options.plugins.legend.labels.color,
                weight: chart.options.plugins.legend.labels.font?.weight,
                size: chart.options.plugins.legend.labels.font?.size
            };
            chart.options.plugins.legend.labels.color = '#0f172a';
            if (!chart.options.plugins.legend.labels.font) chart.options.plugins.legend.labels.font = {};
            chart.options.plugins.legend.labels.font.weight = '700';
            if (!chart.options.plugins.legend.labels.font.size || chart.options.plugins.legend.labels.font.size < 11) {
                chart.options.plugins.legend.labels.font.size = 11;
            }
        }

        chart.update('none');
        return backup;
    }

    function _restoreDarkTheme(chart, backup) {
        if (!chart || !chart.options || !backup) return;
        if (chart.options.scales && backup.scales) {
            Object.keys(backup.scales).forEach(k => {
                const s = chart.options.scales[k];
                const b = backup.scales[k];
                if (s && b) {
                    if (s.ticks) {
                        s.ticks.color = b.ticksColor || '#ffffff';
                        if (s.ticks.font) {
                            s.ticks.font.weight = b.ticksWeight || 'normal';
                            if (b.ticksSize) s.ticks.font.size = b.ticksSize;
                        }
                    }
                    if (s.grid) s.grid.color = b.gridColor || 'rgba(255, 255, 255, 0.08)';
                }
            });
        }
        if (chart.options.plugins?.legend?.labels && backup.legend) {
            chart.options.plugins.legend.labels.color = backup.legend.color || '#ffffff';
            if (chart.options.plugins.legend.labels.font) {
                chart.options.plugins.legend.labels.font.weight = backup.legend.weight || '600';
                if (backup.legend.size) chart.options.plugins.legend.labels.font.size = backup.legend.size;
            }
        }
        chart.update('none');
    }

    function exportChartReport(chartId, title) {
        if (typeof html2pdf === 'undefined') {
            alert("La librería de generación de PDF no está cargada.");
            return;
        }

        // Bloquear actualizaciones de UI por sincronización automática durante la exportación
        window.APP5T_PDF_EXPORTING = true;

        let chart = null;
        let htmlElement = null;
        try { chart = Chart.getChart(chartId); } catch(e){}
        
        if (!chart) {
            htmlElement = document.getElementById(chartId);
            if (!htmlElement) {
                alert("No se encontró el gráfico o contenedor activo para exportar.");
                window.APP5T_PDF_EXPORTING = false;
                return;
            }
        }

        const dateStr = new Date().toLocaleString('es-CL');
        const roleEl = document.getElementById('user-role');
        const nameEl = document.getElementById('user-name');
        const userRole = roleEl ? roleEl.innerText : '';
        const userName = nameEl ? nameEl.innerText : '';

        try {
            if (chart) {
                // Caso 1: Exportar un solo gráfico
                // Para un solo gráfico, lo exportamos creando un contenedor offscreen con la imagen
                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = '0';
                container.style.top = '20000px'; // Posicionar abajo para evitar parpadeos y problemas de coordenadas negativas
                container.style.width = '1200px';
                container.style.padding = '40px';
                container.style.fontFamily = 'sans-serif';
                container.style.color = '#334155';
                container.style.backgroundColor = '#ffffff';
                document.body.appendChild(container);

                // Cabecera del PDF
                const header = document.createElement('div');
                header.style.borderBottom = '2px solid #e2e8f0';
                header.style.paddingBottom = '15px';
                header.style.marginBottom = '25px';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'flex-end';
                header.innerHTML = `
                    <div>
                        <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-family: sans-serif;">5 Tierras - Reporte de Gestión</h2>
                        <h3 style="margin: 5px 0 0 0; color: #3b82f6; font-size: 18px; text-transform: uppercase; font-family: sans-serif;">${title}</h3>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #64748b; font-family: sans-serif;">
                        <p style="margin: 0;">Generado el: <strong>${dateStr}</strong></p>
                        <p style="margin: 2px 0 0 0;">Usuario: <strong>${userName} (${userRole})</strong></p>
                    </div>
                `;
                container.appendChild(header);

                let backup = _applyLightExportTheme(chart);
                let originalDPR = chart.options.devicePixelRatio || window.devicePixelRatio;
                chart.options.devicePixelRatio = 3;
                chart.resize();
                const chartImage = chart.toBase64Image();
                chart.options.devicePixelRatio = originalDPR;
                chart.resize();
                _restoreDarkTheme(chart, backup);
                
                let tableHtml = '<table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: sans-serif;">';
                const labels = chart.data.labels || [];
                const datasets = chart.data.datasets || [];

                tableHtml += '<tr style="background:#f1f5f9; border-bottom: 2px solid #cbd5e1;">';
                tableHtml += '<th style="padding: 8px; text-align: left;">Categoría</th>';
                datasets.forEach(ds => {
                    tableHtml += `<th style="padding: 8px; text-align: right;">${ds.label || 'Valor'}</th>`;
                });
                tableHtml += '</tr>';

                labels.forEach((label, i) => {
                    tableHtml += '<tr style="border-bottom: 1px solid #e2e8f0;">';
                    tableHtml += `<td style="padding: 8px;">${label}</td>`;
                    datasets.forEach(ds => {
                        const val = ds.data[i] !== undefined ? ds.data[i] : '-';
                        const valStr = typeof val === 'number' && val > 10000 ? '$' + val.toLocaleString('es-CL') : val;
                        tableHtml += `<td style="padding: 8px; text-align: right;">${valStr}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                tableHtml += '</table>';

                const singleChartWrapper = document.createElement('div');
                singleChartWrapper.innerHTML = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="${chartImage}" style="max-width: 100%; height: auto; max-height: 400px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px;" />
                    </div>
                    <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Detalle de Datos</h3>
                    ${tableHtml}
                `;
                container.appendChild(singleChartWrapper);

                // Esperar que la imagen se cargue en el contenedor temporal y exportar
                const img = singleChartWrapper.querySelector('img');
                const runExport = () => {
                    const opt = {
                        margin:       10,
                        filename:     `Reporte_5Tierras_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
                        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
                    };

                    html2pdf().set(opt).from(container).save().then(() => {
                        if (container.parentNode) container.parentNode.removeChild(container);
                        window.APP5T_PDF_EXPORTING = false;
                    }).catch(err => {
                        console.error("Error generando PDF del gráfico:", err);
                        alert("Error generando PDF del gráfico: " + err.message);
                        if (container.parentNode) container.parentNode.removeChild(container);
                        window.APP5T_PDF_EXPORTING = false;
                    });
                };

                if (img.complete) {
                    runExport();
                } else {
                    img.onload = runExport;
                    img.onerror = runExport;
                }
            } else {
                // Caso 2: Dashboard completo — generado con jsPDF puro (sin html2canvas)

                // ── Detectar rol activo (via body classList, más confiable) ────────
                const isAdministrador = document.body.classList.contains('role-administrador');

                // ── Collect KPI data from the live DOM ──────────────────────────────
                const kpiData = [];
                if (isAdministrador) {
                    // Administrador: KPIs con clase .kpi-card / .kpi-label / .kpi-value
                    const kpiCards = document.querySelectorAll('#kpi-grid .kpi-card');
                    kpiCards.forEach(card => {
                        const titleEl = card.querySelector('.kpi-label');
                        const valueEl = card.querySelector('.kpi-value');
                        kpiData.push({
                            title:  titleEl ? titleEl.innerText.trim() : '',
                            value:  valueEl ? valueEl.innerText.trim() : '',
                            footer: '',
                        });
                    });
                } else {
                    // Gerente: KPIs con clase .gerencia-kpi-card
                    const kpiCards = document.querySelectorAll('.gerencia-kpi-card');
                    kpiCards.forEach(card => {
                        const titleEl = card.querySelector('.gerencia-kpi-title');
                        const valueEl = card.querySelector('.gerencia-kpi-value');
                        const footerEl = card.querySelector('.gerencia-kpi-footer');
                        kpiData.push({
                            title:  titleEl  ? titleEl.innerText.trim()  : '',
                            value:  valueEl  ? valueEl.innerText.trim()  : '',
                            footer: footerEl ? footerEl.innerText.trim() : '',
                        });
                    });
                }

                // ── Collect chart images preserving aspect ratio ───────────────────
                const chartInfo = isAdministrador
                    ? [
                        { id: 'chart-composition',  label: 'Composición del Inventario' },
                        { id: 'chart-cobranza-mes', label: 'Cobranza del Mes' },
                    ]
                    : [
                        { id: 'chart-embudo-ventas',          label: 'Embudo de Ventas' },
                        { id: 'chart-evolucion-ventas',       label: 'Evolución de Ventas' },
                        { id: 'chart-morosidad-gerencia',     label: 'Morosidad' },
                        { id: 'chart-cobranza-mes-gerencia',  label: 'Cobranza Mensual' },
                        { id: 'chart-cashflow-gerencia',      label: 'Flujo de Caja Estimado' },
                    ];
                const chartImgs = [];
                chartInfo.forEach(ci => {
                    const cvs = document.getElementById(ci.id);
                    if (!cvs) return;
                    try {
                        const chart = Chart.getChart(ci.id);
                        let backup = null;
                        if (chart) {
                            backup = _applyLightExportTheme(chart);
                        }

                        const srcW = (chart ? chart.width  : 0) || cvs.width  || cvs.clientWidth  || 800;
                        const srcH = (chart ? chart.height : 0) || cvs.height || cvs.clientHeight || 400;

                        // Canvas temporal con fondo blanco para evitar fondo negro en JPEG
                        const tmpCvs = document.createElement('canvas');
                        tmpCvs.width  = srcW;
                        tmpCvs.height = srcH;
                        const tmpCtx = tmpCvs.getContext('2d');
                        tmpCtx.fillStyle = '#ffffff';
                        tmpCtx.fillRect(0, 0, srcW, srcH);
                        try { tmpCtx.drawImage(cvs, 0, 0, srcW, srcH); } catch(e) {}

                        // Si es el gráfico de Morosidad, dibujar el porcentaje y etiqueta en el centro
                        if (ci.id.includes('morosidad')) {
                            const percentEl = document.getElementById('morosidad-percent-text-gerencia') || document.getElementById('morosidad-percent-text');
                            const pctText = percentEl ? percentEl.innerText.trim() : '';
                            if (pctText) {
                                tmpCtx.font = 'bold 26px "Inter", sans-serif';
                                tmpCtx.fillStyle = '#0f172a';
                                tmpCtx.textAlign = 'center';
                                tmpCtx.textBaseline = 'middle';
                                tmpCtx.fillText(pctText, srcW / 2, srcH / 2 - 8);
                                tmpCtx.font = 'bold 11px "Inter", sans-serif';
                                tmpCtx.fillStyle = '#64748b';
                                tmpCtx.fillText('MOROSIDAD', srcW / 2, srcH / 2 + 16);
                            }
                        }

                        const dataUrl = tmpCvs.toDataURL('image/jpeg', 0.98);
                        const ratio   = srcW / srcH || 2;
                        chartImgs.push({ label: ci.label, img: dataUrl, ratio });

                        if (chart && backup) {
                            _restoreDarkTheme(chart, backup);
                        }
                    } catch(e) {
                        console.warn('Error capturando gráfico para PDF:', ci.id, e);
                    }
                });


                window.APP5T_PDF_EXPORTING = false;

                // ── Build PDF with jsPDF ─────────────────────────────────────────────
                let JsPDF = null;
                if (window.jspdf && window.jspdf.jsPDF)  JsPDF = window.jspdf.jsPDF;
                else if (window.jsPDF)                    JsPDF = window.jsPDF;
                if (!JsPDF) {
                    alert('jsPDF no disponible. Recarga la página e intenta nuevamente.');
                    return;
                }

                const doc  = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
                const PW   = 297;
                const PH   = 210;
                const mg   = 14;
                const cw   = PW - mg * 2;

                const hexRgb = hex => {
                    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000');
                    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : {r:0,g:0,b:0};
                };
                const txt = (text, x, y, opts) => {
                    const o = opts || {};
                    const c = hexRgb(o.color || '#1e293b');
                    doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
                    doc.setFontSize(o.size || 9);
                    doc.setTextColor(c.r, c.g, c.b);
                    doc.text(String(text || ''), x, y, { align: o.align || 'left', maxWidth: o.maxWidth });
                };
                const hline = (x1, y1, x2, hex) => {
                    const c = hexRgb(hex || '#e2e8f0');
                    doc.setDrawColor(c.r, c.g, c.b);
                    doc.line(x1, y1, x2, y1);
                };

                let y = mg;

                // Header
                const hc = hexRgb('#0f172a');
                doc.setFillColor(hc.r, hc.g, hc.b);
                doc.rect(mg, y, cw, 12, 'F');
                const logoB64 = (typeof window !== 'undefined' && window.APP5T_LOGO_BASE64) ? window.APP5T_LOGO_BASE64 : null;
                let titleOffset = 4;
                if (logoB64) {
                    try {
                        doc.addImage(logoB64, 'PNG', mg + 2, y + 1, 10, 10);
                        titleOffset = 15;
                    } catch(eLogoCharts){}
                }
                txt('5 Tierras  |  Reporte de Gestión', mg + titleOffset, y + 7.8, { bold: true, size: 11, color: '#ffffff' });
                txt(title, mg + cw / 2, y + 7.8, { bold: true, size: 10, color: '#3b82f6', align: 'center' });
                txt('Generado: ' + dateStr, mg + cw - 2, y + 4.5, { size: 7, color: 'rgba(255,255,255,0.85)', align: 'right' });
                txt(userName + ' (' + userRole + ')', mg + cw - 2, y + 9, { size: 7, color: 'rgba(255,255,255,0.85)', align: 'right' });
                y += 16;

                // KPIs
                if (kpiData.length > 0) {
                    const kpiW  = (cw - (kpiData.length - 1) * 4) / kpiData.length;
                    kpiData.forEach((kpi, i) => {
                        const kx = mg + i * (kpiW + 4);
                        const bc = hexRgb('#f8fafc');
                        const sc = hexRgb('#e2e8f0');
                        doc.setFillColor(bc.r, bc.g, bc.b);
                        doc.setDrawColor(sc.r, sc.g, sc.b);
                        doc.roundedRect(kx, y, kpiW, 28, 2, 2, 'FD');
                        txt(kpi.title.toUpperCase(), kx + 4, y + 6, { size: 6.5, color: '#ffffff', bold: true, maxWidth: kpiW - 8 });
                        txt(kpi.value, kx + 4, y + 15, { size: 13, color: '#0f172a', bold: true, maxWidth: kpiW - 8 });
                        hline(kx + 2, y + 18, kx + kpiW - 2, '#e2e8f0');
                        txt(kpi.footer, kx + 4, y + 24, { size: 6.5, color: '#10b981', maxWidth: kpiW - 8 });
                    });
                    y += 32;
                }

                // Charts
                if (chartImgs.length === 0) {
                    txt('(Sin gráficos disponibles para exportar)', PW / 2, y + 10, { size: 9, color: 'rgba(255,255,255,0.85)', align: 'center' });
                } else {
                    const cols = 2;
                    const colW = (cw - 8) / cols;
                    let rowMaxH = 0;

                    chartImgs.forEach((ci, idx) => {
                        const col = idx % cols;
                        const cx  = mg + col * (colW + 8);
                        
                        const imgH = colW / (ci.ratio || 2);
                        if (imgH > rowMaxH) rowMaxH = imgH;

                        // Next row logic
                        if (col === 0 && idx > 0) {
                            y += rowMaxH + 16;
                            rowMaxH = imgH; // reset for new row
                            if (y + rowMaxH + 20 > PH - mg) {
                                doc.addPage();
                                y = mg;
                            }
                        }

                        // Draw
                        txt(ci.label.toUpperCase(), cx, y + 5, { bold: true, size: 7.5, color: '#334155' });
                        hline(cx, y + 7, cx + colW, '#e2e8f0');
                        try {
                            doc.addImage(ci.img, 'JPEG', cx, y + 11, colW, imgH);
                        } catch(e) {}
                    });
                }

                const footerY = PH - 6;
                hline(mg, footerY - 3, mg + cw, '#e2e8f0');
                txt('5 Tierras S.A.  |  Documento generado digitalmente  |  Datos al ' + dateStr, PW / 2, footerY, { size: 6.5, color: 'rgba(255,255,255,0.85)', align: 'center' });

                const pdfFilename = 'Reporte_5Tierras_' + title.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf';
                doc.save(pdfFilename);
            }
        } catch (globalError) {
            console.error("Error crítico en exportChartReport:", globalError);
            alert("Error crítico en la generación del reporte PDF: " + globalError.message);
            window.APP5T_PDF_EXPORTING = false;
        }
    }

    function exportDashboardExcel() {
        if (typeof XLSX === 'undefined') {
            alert("La librería Excel (SheetJS) no está cargada.");
            return;
        }
        
        const dbFilter = document.getElementById('dashboard-filter-proyecto');
        const idProyecto = dbFilter ? dbFilter.value : 'all';
        const nombreProyecto = (dbFilter && dbFilter.options[dbFilter.selectedIndex]) 
            ? dbFilter.options[dbFilter.selectedIndex].text 
            : "Todos los Proyectos";

        const stats = APP5T_DB.getStats(idProyecto);
        const wb = XLSX.utils.book_new();
        
        // 1. Resumen General
        const resumenData = [
            ["Métrica", "Valor"],
            ["Proyecto", nombreProyecto],
            ["Fecha Reporte", new Date().toLocaleString('es-CL')],
            ["", ""],
            ["Unidades Disponibles", stats.disponibles || 0],
            ["Unidades Pendientes", stats.pendientes || 0],
            ["Unidades Reservadas", stats.reservadas || 0],
            ["Unidades Promesadas", stats.promesadas || 0],
            ["Unidades Vendidas", stats.vendidas || 0],
            ["", ""],
            ["Ventas Totales (CLP)", (stats.ingresoRecaudado || 0) + (stats.ingresoComprometido || 0)],
            ["Ingresos Proyectados (CLP)", stats.ingresoProyectado ?? 0],
            ["Comisión Estimada (CLP)", ((stats.ingresoRecaudado || 0) + (stats.ingresoComprometido || 0)) * 0.03]
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, ws1, "Resumen General");

        // -- EXTRACCIÓN DE DATOS PARA HOJAS DETALLADAS --
        const allProyectos = APP5T_DB.getAll('proyectos') || [];
        const allPropiedades = APP5T_DB.getAll('propiedades') || [];
        const allClientes = APP5T_DB.getAll('clientes') || [];
        const allNegociaciones = APP5T_DB.getAll('negociaciones') || [];
        const allCuotas = APP5T_DB.getAll('cuenta_corriente') || [];

        // Diccionarios para cruces rápidos
        const mapProyecto = {}; allProyectos.forEach(p => mapProyecto[p.id] = p.nombre_proyecto || p.nombre);
        const mapPropiedad = {}; allPropiedades.forEach(p => mapPropiedad[p.id] = p);
        const mapClienteById = {}; allClientes.forEach(c => mapClienteById[c.id || c.rut] = c);

        // 2. Sábana de Ventas
        const ventasData = [
            ["Proyecto", "Parcela", "Cliente RUT", "Cliente Nombre", "Estado Comercial", "Fecha Negociación", "Valor Venta (CLP)", "Pie (CLP)", "Saldo a Financiar (CLP)", "N° Cuotas"]
        ];
        
        allNegociaciones.forEach(neg => {
            const prop = mapPropiedad[neg.id_propiedad];
            if (!prop) return;
            if (idProyecto !== 'all' && String(prop.id_proyecto) !== String(idProyecto)) return;
            
            const cli = mapClienteById[neg.id_cliente] || {};
            const nombreCli = cli.nombres ? (cli.nombres + ' ' + (cli.apellidos || '')) : (cli.nombre || 'Desconocido');
            const rutCli = cli.rut || 'N/A';
            const nomProy = mapProyecto[prop.id_proyecto] || "Desconocido";
            const nomProp = prop.nombre || prop.rol || "Sin Nombre";
            
            const valorFinal = parseFloat(neg.valor_final) || 0;
            const pie = parseFloat(neg.pie) || 0;
            const saldo = valorFinal - pie;
            
            ventasData.push([
                nomProy, nomProp, rutCli, nombreCli.trim(), 
                neg.estado_avance || prop.estado || "N/A", 
                neg.fecha_negociacion || "N/A", 
                valorFinal, pie, saldo, neg.cantidad_cuotas || 0
            ]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(ventasData);
        if (ws2['!ref']) ws2['!autofilter'] = { ref: ws2['!ref'] }; // Filtros dinámicos
        XLSX.utils.book_append_sheet(wb, ws2, "Sábana de Ventas");

        // 3. Detalle Cuenta Corriente & 4. Cartera en Mora Detallada
        const ccData = [
            ["Proyecto", "Parcela", "Cliente RUT", "Cliente Nombre", "N° Cuota", "Monto Cuota (CLP)", "Fecha Vencimiento", "Estado", "Monto Pagado", "Fecha Pago"]
        ];
        
        const moraData = [
            ["Proyecto", "Parcela", "Cliente RUT", "Cliente Nombre", "N° Cuota", "Fecha Vencimiento", "Monto Adeudado (CLP)", "Días de Atraso", "Tramo Mora"]
        ];

        const hoy = new Date();
        hoy.setHours(0,0,0,0);

        allCuotas.forEach(cuota => {
            const prop = mapPropiedad[cuota.id_propiedad];
            if (idProyecto !== 'all') {
                if (!prop || String(prop.id_proyecto) !== String(idProyecto)) return;
            }
            
            const cli = mapClienteById[cuota.id_cliente] || {};
            const nombreCli = cli.nombres ? (cli.nombres + ' ' + (cli.apellidos || '')) : (cli.nombre || 'Desconocido');
            const rutCli = cli.rut || 'N/A';
            const nomProy = prop ? (mapProyecto[prop.id_proyecto] || "Desconocido") : "N/A";
            const nomProp = prop ? (prop.nombre || prop.rol || "Sin Nombre") : "N/A";
            
            const monto = parseFloat(cuota.valor_cuota) || 0;
            const pagado = parseFloat(cuota.valor_pagado) || 0;
            const estado = cuota.estado_cuota || cuota.estado || 'pendiente';
            
            ccData.push([
                nomProy, nomProp, rutCli, nombreCli.trim(), 
                cuota.cuota_nro || 0, monto, cuota.fecha_vencimiento || "N/A", 
                estado, pagado, cuota.fecha_pago || "N/A"
            ]);
            
            // Filtro de Mora
            const estL = estado.toLowerCase();
            if ((estL === 'pendiente' || estL === 'vencida') && cuota.fecha_vencimiento) {
                const fVenc = APP5T_Utils.parseFecha(cuota.fecha_vencimiento);
                if (fVenc && !isNaN(fVenc.getTime())) {
                    fVenc.setHours(0,0,0,0);
                    const diffTime = hoy.getTime() - fVenc.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 0) {
                        const deuda = monto - pagado;
                        let tramo = "1-30 días";
                        if (diffDays > 90) tramo = "90+ días";
                        else if (diffDays > 60) tramo = "61-90 días";
                        else if (diffDays > 30) tramo = "31-60 días";
                        
                        moraData.push([
                            nomProy, nomProp, rutCli, nombreCli.trim(), 
                            cuota.cuota_nro || 0, cuota.fecha_vencimiento, deuda, diffDays, tramo
                        ]);
                    }
                }
            }
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(ccData);
        if (ws3['!ref']) ws3['!autofilter'] = { ref: ws3['!ref'] }; // Filtros dinámicos
        XLSX.utils.book_append_sheet(wb, ws3, "Detalle Cta. Corriente");
        
        const ws4 = XLSX.utils.aoa_to_sheet(moraData);
        if (ws4['!ref']) ws4['!autofilter'] = { ref: ws4['!ref'] }; // Filtros dinámicos
        XLSX.utils.book_append_sheet(wb, ws4, "Cartera en Mora");

        // Guardar Archivo
        const projNameSafe = nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `Reporte_Financiero_${projNameSafe}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

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

    // ── Public API ─────────────────────────────────────────────────────────
    return {
        renderDashboard: renderDashboard,
        updateTheme:     updateTheme,
        destroy:         destroy,
        exportChartReport: exportChartReport,
        exportDashboardExcel: exportDashboardExcel,
        updateCompositionFilter: function(projectId) {
            const stats = APP5T_DB.getStats();
            _renderCompositionChart(stats, projectId);
        },
        updateCobranzaFilter: function(projectId, chartId) {
            const stats = APP5T_DB.getStats();
            _renderCobranzaMesChart(stats, chartId, projectId);
        }
    };

})();
