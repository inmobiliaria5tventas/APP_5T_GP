const fs = require('fs');
const path = require('path');

const chartsPath = 'c:/Users/usuario/Documents/RODRIGO/GEOCONECTA/5TIERRAS/APP_5T/APP_5T_GP/02_GESTION/js/charts.js';
let code = fs.readFileSync(chartsPath, 'utf8');

// The updateTheme function code to extract and place properly
const updateThemeBlock = `    function updateTheme() {
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
    }`;

// 1. Remove the misplaced updateTheme from datasets.map
const misplacedRegex = /\s*function updateTheme\(\) \{[\s\S]*?\}\s*return \{/;
code = code.replace(misplacedRegex, '\n            return {');

// 2. Put updateTheme right before '// ── Public API ──'
const publicApiComment = '// ── Public API';
if (code.includes(publicApiComment)) {
  code = code.replace(publicApiComment, updateThemeBlock + '\n\n    ' + publicApiComment);
} else {
  code = code.replace('return {', updateThemeBlock + '\n\n    return {');
}

fs.writeFileSync(chartsPath, code, 'utf8');
console.log('Successfully repositioned updateTheme in charts.js');
