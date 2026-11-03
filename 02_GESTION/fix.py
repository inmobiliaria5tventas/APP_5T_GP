import re

with open('c:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/02_GESTION/js/charts.js', 'r', encoding='utf-8') as f:
    content = f.read()

func = '''    function exportChartReport(chartId, title) {
        if (typeof html2pdf === 'undefined') {
            alert("La librería de generación de PDF no está cargada.");
            return;
        }

        let chart = null;
        let htmlElement = null;
        try { chart = Chart.getChart(chartId); } catch(e){}
        
        if (!chart) {
            htmlElement = document.getElementById(chartId);
            if (!htmlElement) {
                alert("No se encontró el gráfico o contenedor activo para exportar.");
                return;
            }
        }

        const container = document.createElement('div');
        container.style.padding = '30px';
        container.style.fontFamily = 'sans-serif';
        container.style.color = '#334155';

        const dateStr = new Date().toLocaleString('es-CL');
        const roleEl = document.getElementById('user-role');
        const nameEl = document.getElementById('user-name');
        const userRole = roleEl ? roleEl.innerText : '';
        const userName = nameEl ? nameEl.innerText : '';

        let contentHtml = \
            <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <h2 style="margin: 0; color: #0f172a; font-size: 24px;">5 Tierras - Reporte de Gestión</h2>
                    <h3 style="margin: 5px 0 0 0; color: #3b82f6; font-size: 18px; text-transform: uppercase;">\</h3>
                </div>
                <div style="text-align: right; font-size: 12px; color: #64748b;">
                    <p style="margin: 0;">Generado el: <strong>\</strong></p>
                    <p style="margin: 2px 0 0 0;">Usuario: <strong>\ (\)</strong></p>
                </div>
            </div>
        \;

        if (chart) {
            const chartImage = chart.toBase64Image();
            let tableHtml = '<table style="width:100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: sans-serif;">';
            const labels = chart.data.labels || [];
            const datasets = chart.data.datasets || [];

            tableHtml += '<tr style="background:#f1f5f9; border-bottom: 2px solid #cbd5e1;">';
            tableHtml += '<th style="padding: 8px; text-align: left;">Categoría</th>';
            datasets.forEach(ds => {
                tableHtml += \<th style="padding: 8px; text-align: right;">\</th>\;
            });
            tableHtml += '</tr>';

            labels.forEach((label, i) => {
                tableHtml += '<tr style="border-bottom: 1px solid #e2e8f0;">';
                tableHtml += \<td style="padding: 8px;">\</td>\;
                datasets.forEach(ds => {
                    const val = ds.data[i] !== undefined ? ds.data[i] : '-';
                    const valStr = typeof val === 'number' && val > 10000 ? '$' + val.toLocaleString('es-CL') : val;
                    tableHtml += \<td style="padding: 8px; text-align: right;">\</td>\;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table>';

            contentHtml += \
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="\" style="max-width: 100%; height: auto; max-height: 400px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px;" />
                </div>
                <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Detalle de Datos</h3>
                \
            \;
        } else {
            contentHtml += \
                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    \
                </div>
            \;
        }
        
        container.innerHTML = contentHtml;

        const opt = {
            margin:       10,
            filename:     \Reporte_5Tierras_\_\.pdf\,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(container).save().then(() => {
            console.log("PDF generado exitosamente.");
        });
    }'''

content = re.sub(r'    function exportChartReport\(chartId, title\).*?// ── Public API ──', func + r'\n\n    // ── Public API ──', content, flags=re.DOTALL)

with open('c:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/02_GESTION/js/charts.js', 'w', encoding='utf-8') as f:
    f.write(content)
