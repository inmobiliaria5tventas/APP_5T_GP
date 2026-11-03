const fs = require('fs');

let code = fs.readFileSync('02_GESTION/js/forms.js', 'utf8');
const logoB64 = fs.readFileSync('02_GESTION/scratch/logo_base64.txt', 'utf8').trim();

// 1. Inyectar LOGO_5T_BASE64 antes de _hexToRgb si no existe
const logoConst = '  const LOGO_5T_BASE64 = "data:image/jpeg;base64,' + logoB64 + '";\n\n';
if (!code.includes('LOGO_5T_BASE64')) {
  code = code.replace('  // ── jsPDF helpers ────────────────────────────────────────────────────────', logoConst + '  // ── jsPDF helpers ────────────────────────────────────────────────────────');
}

// 2. Modificar _generarPDFConJsPDF para agregar el logo en los comprobantes de reserva
const oldHeaderCode = `    // Header
    const hc = _hexToRgb('#2c3e50');
    doc.setFillColor(hc.r, hc.g, hc.b);
    doc.rect(mg, y, cw, 10, 'F');
    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg+4, y+6.8, {bold:true, size:9, color:'#ffffff'});
    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-55, y+6.8, {size:8, color:'#ffffff'});
    y += 14;`;

const newHeaderCode = `    // Header con Logo Corporativo 5 Tierras
    try {
      if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {
        doc.addImage(LOGO_5T_BASE64, 'JPEG', mg, y - 1, 14, 14);
      }
    } catch(errLogo) {}
    const hc = _hexToRgb('#2c3e50');
    doc.setFillColor(hc.r, hc.g, hc.b);
    doc.rect(mg + 17, y, cw - 17, 10, 'F');
    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg + 21, y+6.8, {bold:true, size:9, color:'#ffffff'});
    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-50, y+6.8, {size:8, color:'#ffffff'});
    y += 14;`;

if (code.includes(oldHeaderCode)) {
  code = code.replace(oldHeaderCode, newHeaderCode);
}

// 3. Definir descargarFichaLegal
const fichaLegalFunc = `
  function descargarFichaLegal(idProp, tipoDoc = 'promesa') {
    try {
      if (typeof APP5T_DB === 'undefined') {
        APP5T_Utils.showToast('Base de datos no disponible', 'error');
        return;
      }
      let prop = APP5T_DB.getById('propiedades', idProp);
      let neg = null;

      if (prop) {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
        neg = negs.find(n => n.estado_avance === 'Aprobado') || negs[negs.length - 1];
      } else {
        neg = APP5T_DB.getById('negociaciones', idProp);
        if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
      }

      if (!prop) {
        APP5T_Utils.showToast('No se encontró información del lote para la ficha.', 'error');
        return;
      }

      const isEscritura = tipoDoc === 'escritura';
      const etapa = prop.id_etapa ? APP5T_DB.getById('etapas', prop.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : (prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null);
      const cliente = (neg && neg.id_cliente) ? APP5T_DB.getById('clientes', neg.id_cliente) : null;

      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || 'Proyecto 5 Tierras') : (prop.proyecto || 'Proyecto 5 Tierras');
      const loteNom = prop.nombre || ('Lote ' + prop.id);
      const etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || 'Etapa 1') : 'Etapa 1';
      const supFmt = prop.superficie ? ((typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(prop.superficie) : (prop.superficie + ' m²')) : '5.000 m² aprox.';
      const rolAvaluo = prop.rol || 'En trámite / Matriz';

      // Cliente
      const cliNom = cliente ? (cliente.nombres + ' ' + (cliente.apellidos || '')).trim() : 'Sin cliente asignado';
      const cliRut = cliente ? (cliente.rut || 'No informado') : 'No informado';
      const cliTel = cliente ? (cliente.telefono || 'No informado') : 'No informado';
      const cliEmail = cliente ? (cliente.email || 'No informado') : 'No informado';
      const cliDireccion = cliente ? (cliente.direccion || 'Chillán / Ñuble') : 'Chillán / Ñuble';
      const cliCivil = cliente ? (cliente.estado_civil || 'Soltero/a') : 'No especificado';
      const cliProfesion = cliente ? (cliente.profesion || 'Particular') : 'Particular';

      // Condiciones Comerciales
      const precioTotal = (neg && neg.precio_acordado) ? neg.precio_acordado : (prop.valor_final || 0);
      const precioFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(precioTotal) : ('$' + Number(precioTotal).toLocaleString('es-CL'));
      const pieVal = (neg && neg.pie) ? neg.pie : (prop.abono || 0);
      const pieFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(pieVal) : ('$' + Number(pieVal).toLocaleString('es-CL'));
      const saldoVal = Math.max(0, precioTotal - pieVal);
      const saldoFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(saldoVal) : ('$' + Number(saldoVal).toLocaleString('es-CL'));
      const cuotasCant = (neg && neg.cantidad_cuotas) ? String(neg.cantidad_cuotas) : 'Sin cuotas (Contado)';
      const metodoPago = (neg && neg.metodo_pago) ? neg.metodo_pago : 'Transferencia Bancaria';
      const notaria = 'Notaría Quinta de Chillán';

      // Instancia de jsPDF
      let JsPDF = null;
      if (window.jspdf && window.jspdf.jsPDF)  JsPDF = window.jspdf.jsPDF;
      else if (window.jsPDF)                    JsPDF = window.jsPDF;
      if (!JsPDF && window._jsPDFCtor)          JsPDF = window._jsPDFCtor;

      if (!JsPDF) {
        if (typeof html2pdf !== 'undefined') {
          const w = document.createElement('div');
          document.body.appendChild(w);
          html2pdf().set({ jsPDF: { unit:'mm', format:'letter' } }).from(w).get('jsPDF').then(doc => {
            document.body.removeChild(w);
            if (doc && doc.constructor) {
              window._jsPDFCtor = doc.constructor;
              descargarFichaLegal(idProp, tipoDoc);
            }
          }).catch(() => document.body.removeChild(w));
          return;
        }
        alert('jsPDF no disponible temporalmente. Intente nuevamente.');
        return;
      }

      const doc = new JsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
      const W = 215.9, mg = 16, cw = W - mg * 2;
      let y = mg;

      // ── ENCABEZADO CON LOGO 5 TIERRAS ──
      try {
        if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {
          doc.addImage(LOGO_5T_BASE64, 'JPEG', mg, y - 2, 22, 22);
        }
      } catch(e) {
        console.warn('Logo no se pudo incrustar:', e);
      }

      _pdfTxt(doc, 'INMOBILIARIA 5 TIERRAS S.A.', mg + 26, y + 4, {bold:true, size:13, color:'#0f172a'});
      _pdfTxt(doc, 'EXPEDIENTE JURÍDICO & ANTECEDENTES PARA REDACCIÓN LEGAL', mg + 26, y + 9, {bold:true, size:8, color:'#64748b'});
      _pdfTxt(doc, 'NOTARÍA DESIGNADA: ' + notaria.toUpperCase(), mg + 26, y + 13.5, {bold:true, size:7.5, color:'#2563eb'});

      const fechaHoyStr = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.fechaHoy) ? APP5T_Utils.fechaHoy() : new Date().toLocaleDateString('es-CL');
      _pdfTxt(doc, 'FECHA EMISIÓN:', mg + cw - 42, y + 4, {bold:true, size:7, color:'#64748b'});
      _pdfTxt(doc, fechaHoyStr, mg + cw - 42, y + 8, {bold:true, size:8.5, color:'#0f172a'});
      _pdfTxt(doc, 'REF: EXP-' + (isEscritura ? 'ESC' : 'PROM') + '-' + (prop.id || '00'), mg + cw - 42, y + 13.5, {size:7.5, color:'#64748b'});

      y += 20;
      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');
      y += 5;

      // ── TÍTULO DOCUMENTO ──
      const tituloDoc = isEscritura ? 'MINUTA DE ANTECEDENTES - ESCRITURA DEFINITIVA' : 'FICHA DE ANTECEDENTES - PROMESA DE COMPRAVENTA';
      _pdfRect(doc, mg, y, cw, 9, '#f1f5f9', '#cbd5e1');
      _pdfTxt(doc, tituloDoc, W / 2, y + 6.2, {bold:true, size:10.5, color:'#1e3a8a', align:'center'});
      y += 13;

      // ── SECCIÓN 1: INDIVIDUALIZACIÓN DEL COMPRADOR (CLIENTE) ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '1. INDIVIDUALIZACIÓN DE LA PARTE COMPRADORA / PROMITENTE COMPRADOR', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 28, '#ffffff', '#e2e8f0');
      const cRows = [
        ['NOMBRE COMPLETO:', cliNom, 'R.U.T.:', cliRut],
        ['ESTADO CIVIL:', cliCivil, 'PROFESIÓN / OFICIO:', cliProfesion],
        ['DOMICILIO:', cliDireccion, 'TELÉFONO:', cliTel],
        ['CORREO ELECTRÓNICO:', cliEmail, 'CÓDIGO CLIENTE:', cliente ? ('CLI-' + cliente.id) : 'S/I']
      ];
      let cy = y + 4;
      cRows.forEach(([l1,v1,l2,v2]) => {
        _pdfTxt(doc, l1, mg + 3, cy, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v1), mg + 35, cy, {bold:true, size:7.5, color:'#0f172a'});
        _pdfTxt(doc, l2, mg + cw/2 + 2, cy, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v2), mg + cw/2 + 36, cy, {bold:true, size:7.5, color:'#0f172a'});
        cy += 6;
      });
      y += 32;

      // ── SECCIÓN 2: INDIVIDUALIZACIÓN DEL INMUEBLE (PARCELA / LOTE) ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '2. INDIVIDUALIZACIÓN DEL INMUEBLE (PARCELA / LOTE)', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 23, '#ffffff', '#e2e8f0');
      const pRows = [
        ['PROYECTO INMOBILIARIO:', proyNom, 'ETAPA:', etapaNom],
        ['PARCELA / LOTE:', loteNom, 'SUPERFICIE OFICIAL:', supFmt],
        ['ROL DE AVALÚO:', rolAvaluo, 'UBICACIÓN / COMUNA:', 'Región de Ñuble, Chile']
      ];
      let py = y + 4;
      pRows.forEach(([l1,v1,l2,v2]) => {
        _pdfTxt(doc, l1, mg + 3, py, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v1), mg + 39, py, {bold:true, size:7.5, color:'#0f172a'});
        _pdfTxt(doc, l2, mg + cw/2 + 2, py, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v2), mg + cw/2 + 36, py, {bold:true, size:7.5, color:'#0f172a'});
        py += 6.5;
      });
      y += 27;

      // ── SECCIÓN 3: CONDICIONES ECONÓMICAS Y FORMA DE PAGO ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '3. CONDICIONES ECONÓMICAS DE LA OPERACIÓN Y FORMA DE PAGO', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 30, '#ffffff', '#e2e8f0');
      const eRows = [
        ['PRECIO TOTAL DE VENTA:', precioFmt, 'MONTO RESERVA PAGADO:', pieFmt],
        ['SALDO A PAGAR:', saldoFmt, 'CANTIDAD DE CUOTAS:', cuotasCant],
        ['MODALIDAD DE PAGO:', metodoPago, 'NOTARÍA COMPARECENCIA:', notaria],
        ['ESTADO OPERATIVO:', isEscritura ? 'Listo para Escrituración' : 'Listo para Firma de Promesa', 'ID NEGOCIACIÓN:', neg ? ('NEG-' + neg.id) : 'S/I']
      ];
      let ey = y + 4;
      eRows.forEach(([l1,v1,l2,v2]) => {
        _pdfTxt(doc, l1, mg + 3, ey, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v1), mg + 39, ey, {bold:true, size:7.8, color:(l1.startsWith('PRECIO') ? '#047857' : '#0f172a')});
        _pdfTxt(doc, l2, mg + cw/2 + 2, ey, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(v2), mg + cw/2 + 36, ey, {bold:true, size:7.8, color:'#0f172a'});
        ey += 6.5;
      });
      y += 34;

      // ── SECCIÓN 4: INSTRUCCIONES Y OBSERVACIONES JURÍDICAS ──
      _pdfRect(doc, mg, y, cw, 22, '#f8fafc', '#e2e8f0');
      _pdfTxt(doc, 'INSTRUCCIONES PARA LA REDACCIÓN:', mg + 4, y + 4.5, {bold:true, size:7.2, color:'#1e3a8a'});
      const instText = 'Se solicita a la asesoría legal confeccionar el borrador correspondiente conforme a las condiciones precedentes y remitirlo a Gerencia para revisión previa a la firma en Notaría. Los antecedentes de títulos de dominio se encuentran archivados en el repositorio documental corporativo de 5 Tierras.';
      _pdfWrap(doc, instText, mg + 4, y + 8.5, cw - 8, 4, {size:7.2, color:'#334155'});
      y += 27;

      // ── FIRMAS DE VALIDACIÓN GERENCIAL ──
      _pdfLine(doc, mg, y, mg + cw, y, '#e2e8f0');
      y += 4;
      const sigW = cw / 2 - 12, sig2x = mg + cw / 2 + 12;

      _pdfTxt(doc, 'Daniel Gajardo P.', mg + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});
      _pdfLine(doc, mg, y + 12, mg + sigW, y + 12, '#94a3b8');
      _pdfTxt(doc, 'GERENCIA GENERAL / COMERCIAL', mg + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});
      _pdfTxt(doc, 'Inmobiliaria 5 Tierras S.A.', mg + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});

      _pdfTxt(doc, 'Asesoría Jurídica & Notarial', sig2x + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});
      _pdfLine(doc, sig2x, y + 12, sig2x + sigW, y + 12, '#94a3b8');
      _pdfTxt(doc, 'RECEPCIÓN Y REDACCIÓN LEGAL', sig2x + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});
      _pdfTxt(doc, 'Notaría Quinta de Chillán', sig2x + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});

      y += 26;
      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');
      y += 4;
      _pdfTxt(doc, '5 Tierras S.A. · Sistema de Gestión Inmobiliaria · Chillán, Región de Ñuble · Documento Legal Confidencial', W / 2, y, {size:6.8, color:'#94a3b8', align:'center'});

      // Guardar archivo
      const cleanProy = proyNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      const cleanLote = loteNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      const cleanCli = cliNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      const filename = 'Ficha_Legal_' + (isEscritura ? 'Escritura' : 'Promesa') + '_' + cleanProy + '_' + cleanLote + '_' + cleanCli + '.pdf';

      doc.save(filename);
      if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast('Ficha Legal descargada exitosamente en PDF.', 'success');
      }
    } catch(err) {
      console.error('Error generando Ficha Legal:', err);
      alert('Error al generar la Ficha Legal: ' + err.message);
    }
  }
`;

if (!code.includes('function descargarFichaLegal')) {
  code = code.replace('  // ── jsPDF helpers ────────────────────────────────────────────────────────', fichaLegalFunc + '\n  // ── jsPDF helpers ────────────────────────────────────────────────────────');
}

// 4. Exportar descargarFichaLegal en api de forms.js
code = code.replace('vincularDocumentoLote, descargarPDFSimulado', 'vincularDocumentoLote, descargarPDFSimulado, descargarFichaLegal');

fs.writeFileSync('02_GESTION/js/forms.js', code, 'utf8');
console.log('02_GESTION/js/forms.js actualizado exitosamente.');
