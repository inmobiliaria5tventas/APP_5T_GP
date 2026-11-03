const fs = require('fs');
let content = fs.readFileSync('js/charts.js', 'utf8');

content = content.replace(
    \"const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-leaderboard', 'chart-cashflow', 'chart-funnel-general', 'chart-morosidad', 'chart-embudo-legal', 'chart-cobranza-mes', 'chart-funnel-personal', 'chart-meta-personal'];\",
    \"const ids = ['chart-composition', 'chart-projects', 'chart-velocity', 'chart-leaderboard', 'chart-cashflow', 'chart-funnel-general', 'chart-morosidad', 'chart-embudo-legal', 'chart-cobranza-mes', 'chart-funnel-personal', 'chart-meta-personal', 'chart-tendencia-mensual', 'chart-embudo-ventas', 'chart-estado-inventario'];\"
);

let gerente_old = \          if (role === 'gerente') {
              _renderCompositionChart(stats);
              _renderProjectsChart(stats);
              _renderVelocityChart(stats);
              _renderLeaderboardChart(stats);
              _renderCashflowChart(stats);
              _renderGeneralFunnelChart(stats);
              // Rentability panel handles itself inside velocity chart, or we can call it here if needed, but it's called inside _renderVelocityChart
          } else if (role === 'administrador') {\;

let gerente_new = \          if (role === 'gerente') {
              _renderTendenciaMensual(stats);
              _renderEmbudoVentas(stats);
              _renderEstadoInventario(stats);
              _renderAvanceEtapa(stats);
              _renderVendedorDelMes(stats);
              _renderConversionLeads(stats);
          } else if (role === 'administrador') {\;

content = content.replace(gerente_old, gerente_new);

let funcs = \
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
                      backgroundColor: '#6366f1',
                      borderRadius: 4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, display: false }, x: { grid: { display: false } } }
              }
          });
      }

      function _renderEmbudoVentas(stats) {
          const canvas = document.getElementById('chart-embudo-ventas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (chartInstances['chart-embudo-ventas']) chartInstances['chart-embudo-ventas'].destroy();
          
          chartInstances['chart-embudo-ventas'] = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: ['LEADS', 'RESERVAS', 'PROMESAS', 'ESCRITURAS'],
                  datasets: [{
                      data: [1248, 412, 156, 84],
                      backgroundColor: ['#1e1b4b', '#4338ca', '#6366f1', '#818cf8'],
                      borderRadius: 4,
                      barPercentage: 0.6
                  }]
              },
              options: {
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: false }, y: { grid: { display: false } } }
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
                      ctx.fillStyle = "#0f172a";
                      var text = "124", textX = Math.round((width - ctx.measureText(text).width) / 2), textY = height / 2 - 10;
                      ctx.fillText(text, textX, textY);
                      ctx.font = "600 " + (fontSize*0.3) + "em Inter";
                      ctx.fillStyle = "#64748b";
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
          container.innerHTML = \
            <div style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#1e293b; margin-bottom:5px;"><span>Lomas de Maule - Etapa I</span><span>95%</span></div>
              <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px;"><div style="width:95%; height:100%; background:#4338ca; border-radius:4px;"></div></div>
            </div>
            <div style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#1e293b; margin-bottom:5px;"><span>Praderas del Ñuble - Etapa III</span><span>42%</span></div>
              <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px;"><div style="width:42%; height:100%; background:#6366f1; border-radius:4px;"></div></div>
            </div>
            <div style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:#1e293b; margin-bottom:5px;"><span>Bosque Sagrado - Preventa</span><span>18%</span></div>
              <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px;"><div style="width:18%; height:100%; background:#818cf8; border-radius:4px;"></div></div>
            </div>
          \;
      }

      function _renderVendedorDelMes(stats) {
          const container = document.getElementById('vendedor-del-mes-container');
          if (!container) return;
          container.innerHTML = \
            <div style="width:40px; height:40px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
               <i class="fa-solid fa-user-tie" style="color:#94a3b8; font-size:20px;"></i>
            </div>
            <div>
              <div style="font-weight:700; color:#1e293b; font-size:14px;">Marta Figueroa</div>
              <div style="color:#64748b; font-size:12px;">24 Ventas Cerradas</div>
            </div>
          \;
      }

      function _renderConversionLeads(stats) {
          const container = document.getElementById('conversion-leads-container');
          if (!container) return;
          container.innerHTML = \
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; color:#6366f1; margin-bottom:5px; text-transform:uppercase;"><span>Promedio Global</span><span>6.8%</span></div>
            <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; margin-bottom:20px;"><div style="width:6.8%; height:100%; background:#6366f1; border-radius:4px;"></div></div>
            <div style="color:#64748b; font-size:11px; text-align:center;">% CONVERSIÓN TOTAL DE MARKETING A CIERRE: 6.8%</div>
          \;
      }
\;

content = content.replace('function renderDashboard(role) {', funcs + '      function renderDashboard(role) {');

fs.writeFileSync('js/charts.js', content, 'utf8');
console.log('Done');
