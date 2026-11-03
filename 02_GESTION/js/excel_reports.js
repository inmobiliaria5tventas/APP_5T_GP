/**
 * ============================================================================
 * APP5T_Excel - Módulo Generador de Libros Excel Profesionales (Grado Bancario)
 * Inmobiliaria 5 Tierras S.A.
 * ============================================================================
 */
const APP5T_Excel = (() => {
  'use strict';

  function _checkXLSX() {
    if (typeof XLSX === 'undefined') {
      if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast('Librería Excel (SheetJS) no disponible en el sistema.', 'error');
      } else {
        alert('Librería Excel no disponible.');
      }
      return false;
    }
    return true;
  }

  // Calcula anchos automáticos de columna basados en contenido
  function _calcColWidths(dataAoA, minWidth = 12) {
    if (!dataAoA || dataAoA.length === 0) return [];
    const maxCols = Math.max(...dataAoA.map(r => (r ? r.length : 0)));
    const colWidths = [];

    for (let c = 0; c < maxCols; c++) {
      let maxLen = minWidth;
      for (let r = 0; r < dataAoA.length; r++) {
        const row = dataAoA[r];
        if (row && row[c] !== undefined && row[c] !== null) {
          const strVal = String(row[c]);
          if (strVal.length > maxLen) {
            maxLen = Math.min(strVal.length + 3, 50); // cap max 50
          }
        }
      }
      colWidths.push({ wch: maxLen });
    }
    return colWidths;
  }

  /**
   * Exporta Reporte Consolidado de Operaciones (Promesas y Escrituras)
   * Grado Directorio / Financiero
   */
  function exportarOperaciones(items, mesLabel = 'Todos', anioLabel = 'Todos') {
    if (!_checkXLSX()) return;
    if (!items || items.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('No hay operaciones para exportar en este período', 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const fechaEmision = new Date().toLocaleString('es-CL');

    // ── HOJA 1: RESUMEN EJECUTIVO (KPIs BANCO / DIRECTORIO) ──
    let totalVentas = 0;
    let totalRecibidoCaja = 0;
    let totalPorRecibir = 0;
    let totalPie = 0;

    items.forEach(it => {
      totalVentas += (Number(it.valorVenta) || 0);
      totalPie += (Number(it.pie) || 0);
      totalRecibidoCaja += (Number(it.totalRecibido) || 0);
      totalPorRecibir += (Number(it.totalPorRecibir) || 0);
    });

    const resumenAoA = [
      ['INMOBILIARIA 5 TIERRAS S.A. - INFORME EJECUTIVO DE OPERACIONES'],
      ['Período:', `${mesLabel} ${anioLabel}`, 'Fecha Emisión:', fechaEmision],
      [''],
      ['Métrica Financiera Clave', 'Monto Consolidado (CLP)', 'Detalle Operativo'],
      ['Total Unidades Informadas', items.length, 'Parcelas con promesas o ventas'],
      ['Valor Total Contratado (Ventas)', totalVentas, 'Suma de precios pactados'],
      ['Monto Total Pie / Anticipos', totalPie, 'Garantías y abonos percibidos'],
      ['Total Recaudado Efectivo (Caja)', totalRecibidoCaja, 'Flujo de caja liquidado'],
      ['Total Cartera por Recibir (Crédito)', totalPorRecibir, 'Activo exigible en cuotas'],
      [''],
      ['* Documento generado por Sistema de Gestión Integral 5 Tierras. Cifras cuadradas con cuenta corriente.']
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenAoA);
    wsResumen['!cols'] = [ { wch: 35 }, { wch: 25 }, { wch: 35 } ];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

    // ── HOJA 2: SÁBANA MAESTRA DE OPERACIONES (DETALLE TABULAR CON AUTOFILTER) ──
    const headers = [
      'Fecha Operación', 'Proyecto', 'Lote', 'Cliente', 'RUT Cliente',
      'Estado Lote', 'Tipo Operación', 'Valor Venta (CLP)', 'Pie / Anticipo (CLP)',
      'Cuotas Pagadas', 'Monto Pagado (CLP)', 'Cuotas Pendientes', 'Monto Pendiente (CLP)',
      'Total Caja Recibido (CLP)', 'Cartera por Cobrar (CLP)'
    ];

    const rows = [headers];
    items.forEach(it => {
      const p = it.propiedad || {};
      const n = it.negociacion || {};

      let tipoOp = 'Venta Tradicional';
      if (n.tipo_operacion === 'Saldo_Precio' || n.id_proceso === 'Saldo_Precio') {
        tipoOp = 'Venta con Saldo de Precio (Escriturada)';
      } else if (p.estado === 'Venta_Directa' || n.tipo_operacion === 'Venta_Directa' || n.id_proceso === 'Venta_Directa') {
        tipoOp = 'Venta Directa (Contado)';
      } else if (p.estado === 'Reservada') {
        tipoOp = 'Reserva';
      } else if (p.estado === 'Promesada') {
        tipoOp = 'Promesa de Compraventa';
      } else if (p.estado === 'Vendida' || p.estado === 'Escriturada') {
        const cantCtas = Number(n.cantidad_cuotas) || 0;
        tipoOp = cantCtas > 0 ? 'Venta a Plazo (Escriturada)' : 'Venta Definitiva (Contado)';
      } else if (n.tipo_operacion) {
        tipoOp = n.tipo_operacion;
      }

      rows.push([
        it.fechaOperacion || 'N/A',
        it.proyectoNombre || '5 Tierras',
        p.nombre || `Lote ${p.id || ''}`,
        it.clienteNombreCompleto || 'Sin nombre',
        it.clienteRut || 'N/A',
        p.estado || 'N/A',
        tipoOp,
        Number(it.valorVenta) || 0,
        Number(it.pie) || 0,
        Number(it.numCuotasPagadas) || 0,
        Number(it.montoCuotasPagadas) || 0,
        Number(it.numCuotasPendientes) || 0,
        Number(it.montoCuotasPendientes) || 0,
        Number(it.totalRecibido) || 0,
        Number(it.totalPorRecibir) || 0
      ]);
    });

    // Fila de Totales Sumatorios
    rows.push([
      'TOTAL CONSOLIDADO', '', '', '', '', '', '',
      totalVentas, totalPie, '', '', '', '', totalRecibidoCaja, totalPorRecibir
    ]);

    const wsDetalle = XLSX.utils.aoa_to_sheet(rows);
    if (wsDetalle['!ref']) {
      // Autofilter solo sobre el rango de datos (sin incluir fila de totales)
      const range = XLSX.utils.decode_range(wsDetalle['!ref']);
      const filterRange = { s: { r: 0, c: 0 }, e: { r: range.e.r - 1, c: range.e.c } };
      wsDetalle['!autofilter'] = { ref: XLSX.utils.encode_range(filterRange) };
    }
    wsDetalle['!cols'] = _calcColWidths(rows);
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Sábana Operaciones');

    // Descarga
    const filename = `Informe_Financiero_Operaciones_${mesLabel}_${anioLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Libro Excel exportado con éxito.', 'success');
  }

  /**
   * Exporta Detalle de Cuenta Corriente y Cobranzas
   */
  function exportarCuentaCorriente(cuotas, idProyecto = 'all') {
    if (!_checkXLSX()) return;
    const allCuotas = cuotas || (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('cuenta_corriente') : []);
    if (allCuotas.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('No hay datos de cuenta corriente para exportar', 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const mapProp = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('propiedades') : []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
    const mapProy = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('proyectos') : []).reduce((acc, pr) => { acc[pr.id] = pr.nombre || pr.nombre_proyecto; return acc; }, {});
    const mapCli = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('clientes') : []).reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

    const headers = [
      'Proyecto', 'Lote', 'RUT Cliente', 'Cliente', 'N° Cuota',
      'Valor Pactado (CLP)', 'Fecha Vencimiento', 'Estado Cuota',
      'Monto Pagado (CLP)', 'Saldo Adeudado (CLP)', 'Fecha de Pago', 'Modalidad Pago'
    ];

    const dataRows = [headers];
    let totPactado = 0, totPagado = 0, totSaldo = 0;

    allCuotas.forEach(c => {
      const p = mapProp[c.id_propiedad];
      if (idProyecto !== 'all' && p && String(p.id_proyecto) !== String(idProyecto)) return;

      const proyNom = p ? (mapProy[p.id_proyecto] || '5 Tierras') : '5 Tierras';
      const loteNom = p ? (p.nombre || `Lote ${p.id}`) : `Lote ${c.id_propiedad}`;
      const cli = mapCli[c.id_cliente] || {};
      const cliNom = cli.nombres ? `${cli.nombres} ${cli.apellidos || ''}`.trim() : 'Sin Cliente';
      const cliRut = cli.rut || 'N/A';

      const vCuota = Number(c.valor_cuota) || 0;
      const vPagado = Number(c.valor_pagado) || 0;
      const vSaldo = Math.max(0, vCuota - vPagado);

      totPactado += vCuota;
      totPagado += vPagado;
      totSaldo += vSaldo;

      dataRows.push([
        proyNom, loteNom, cliRut, cliNom, c.cuota_nro || 0,
        vCuota, c.fecha_vencimiento || 'N/A', c.estado_cuota || 'Pendiente',
        vPagado, vSaldo, c.fecha_pago || '', c.metodo_pago || 'Transferencia'
      ]);
    });

    dataRows.push([
      'TOTAL GENERAL', '', '', '', '',
      totPactado, '', '', totPagado, totSaldo, '', ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      const filterRange = { s: { r: 0, c: 0 }, e: { r: range.e.r - 1, c: range.e.c } };
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(filterRange) };
    }
    ws['!cols'] = _calcColWidths(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle Cuotas');

    const filename = `Cartera_Cuenta_Corriente_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Cuenta Corriente exportada en Excel.', 'success');
  }

  /**
   * Exporta Base de Clientes en formato Excel estructurado
   */
  function exportarClientes(clientes) {
    if (!_checkXLSX()) return;
    const clis = clientes || (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('clientes') : []);
    if (clis.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('No hay clientes para exportar', 'warning');
      return;
    }

    const wb = XLSX.utils.book_new();
    const headers = [
      'Nombres', 'Apellidos', 'RUT', 'Email', 'Teléfono',
      'Profesión / Ocupación', 'Estado Civil', 'Dirección', 'Comuna', 'Estado Cliente', 'Fecha Registro'
    ];
    const rows = [headers];

    clis.forEach(c => {
      rows.push([
        c.nombres || '', c.apellidos || '', c.rut || '', c.email || '', c.telefono || '',
        c.profesion || '', c.estado_civil || '', c.direccion || '', c.comuna || '',
        c.estado_cliente || 'Activo', c.fecha_registro ? c.fecha_registro.split('T')[0] : ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!cols'] = _calcColWidths(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Cartera Clientes');

    const filename = `Directorio_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Directorio de Clientes exportado en Excel.', 'success');
  }

  return {
    exportarOperaciones,
    exportarCuentaCorriente,
    exportarClientes
  };
})();

if (typeof window !== 'undefined') {
  window.APP5T_Excel = APP5T_Excel;
}
