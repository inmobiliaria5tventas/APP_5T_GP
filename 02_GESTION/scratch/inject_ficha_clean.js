const fs = require('fs');

let code = fs.readFileSync('02_GESTION/js/forms.js', 'utf8');
const logoB64 = fs.readFileSync('02_GESTION/scratch/logo_base64.txt', 'utf8').trim();

// 1. Constante del logo
const logoDefinition = '  const LOGO_5T_BASE64 = "data:image/jpeg;base64,' + logoB64 + '";\n\n';

// 2. Modificación de _generarPDFConJsPDF para agregar logo al comprobante de reserva
const oldHeaderCode = [
  "    // Header",
  "    const hc = _hexToRgb('#2c3e50');",
  "    doc.setFillColor(hc.r, hc.g, hc.b);",
  "    doc.rect(mg, y, cw, 10, 'F');",
  "    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg+4, y+6.8, {bold:true, size:9, color:'#ffffff'});",
  "    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-55, y+6.8, {size:8, color:'#ffffff'});",
  "    y += 14;"
].join('\n');

const newHeaderCode = [
  "    // Header con Logo Corporativo 5 Tierras",
  "    try {",
  "      if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {",
  "        doc.addImage(LOGO_5T_BASE64, 'JPEG', mg, y - 1, 14, 14);",
  "      }",
  "    } catch(errLogo) {}",
  "    const hc = _hexToRgb('#2c3e50');",
  "    doc.setFillColor(hc.r, hc.g, hc.b);",
  "    doc.rect(mg + 17, y, cw - 17, 10, 'F');",
  "    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg + 21, y+6.8, {bold:true, size:9, color:'#ffffff'});",
  "    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-50, y+6.8, {size:8, color:'#ffffff'});",
  "    y += 14;"
].join('\n');

if (code.includes(oldHeaderCode)) {
  code = code.replace(oldHeaderCode, newHeaderCode);
  console.log('Logo integrado a comprobantes de reserva existentes.');
} else {
  console.log('Aviso: oldHeaderCode no encontrado exactamente por saltos de linea.');
}

// 3. Función descargarFichaLegal
const fichaLegalFunc = `
  function descargarFichaLegal(idProp, tipoDoc) {
    var tipo = tipoDoc || 'promesa';
    try {
      if (typeof APP5T_DB === 'undefined') {
        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
          APP5T_Utils.showToast('Base de datos no disponible', 'error');
        }
        return;
      }
      var prop = APP5T_DB.getById('propiedades', idProp);
      var neg = null;

      if (prop) {
        var negs = APP5T_DB.query('negociaciones', function(n) {
          return n && String(n.id_propiedad) === String(prop.id);
        }) || [];
        neg = negs.find(function(n) { return n.estado_avance === 'Aprobado'; }) || negs[negs.length - 1];
      } else {
        neg = APP5T_DB.getById('negociaciones', idProp);
        if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
      }

      if (!prop) {
        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
          APP5T_Utils.showToast('No se encontro informacion del lote para la ficha.', 'error');
        }
        return;
      }

      var isEscritura = (tipo === 'escritura');
      var etapa = prop.id_etapa ? APP5T_DB.getById('etapas', prop.id_etapa) : null;
      var proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : (prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null);
      var cliente = (neg && neg.id_cliente) ? APP5T_DB.getById('clientes', neg.id_cliente) : null;

      var proyNom = proy ? (proy.nombre_proyecto || proy.nombre || 'Proyecto 5 Tierras') : (prop.proyecto || 'Proyecto 5 Tierras');
      var loteNom = prop.nombre || ('Lote ' + prop.id);
      var etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || 'Etapa 1') : 'Etapa 1';
      var supFmt = prop.superficie ? ((typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(prop.superficie) : (prop.superficie + ' m2')) : '5.000 m2 aprox.';
      var rolAvaluo = prop.rol || 'En tramite / Matriz';

      // Cliente
      var cliNom = cliente ? (cliente.nombres + ' ' + (cliente.apellidos || '')).trim() : 'Sin cliente asignado';
      var cliRut = cliente ? (cliente.rut || 'No informado') : 'No informado';
      var cliTel = cliente ? (cliente.telefono || 'No informado') : 'No informado';
      var cliEmail = cliente ? (cliente.email || 'No informado') : 'No informado';
      var cliDireccion = cliente ? (cliente.direccion || 'Chillan / Nuble') : 'Chillan / Nuble';
      var cliCivil = cliente ? (cliente.estado_civil || 'Soltero/a') : 'No especificado';
      var cliProfesion = cliente ? (cliente.profesion || 'Particular') : 'Particular';

      // Condiciones Comerciales
      var precioTotal = (neg && neg.precio_acordado) ? neg.precio_acordado : (prop.valor_final || 0);
      var precioFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(precioTotal) : ('$' + Number(precioTotal).toLocaleString('es-CL'));
      var pieVal = (neg && neg.pie) ? neg.pie : (prop.abono || 0);
      var pieFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(pieVal) : ('$' + Number(pieVal).toLocaleString('es-CL'));
      var saldoVal = Math.max(0, precioTotal - pieVal);
      var saldoFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(saldoVal) : ('$' + Number(saldoVal).toLocaleString('es-CL'));
      var cuotasCant = (neg && neg.cantidad_cuotas) ? String(neg.cantidad_cuotas) : 'Sin cuotas (Contado)';
      var metodoPago = (neg && neg.metodo_pago) ? neg.metodo_pago : 'Transferencia Bancaria';
      var notaria = 'Notaria Quinta de Chillan';

      // Instancia de jsPDF
      var JsPDF = null;
      if (window.jspdf && window.jspdf.jsPDF)  JsPDF = window.jspdf.jsPDF;
      else if (window.jsPDF)                    JsPDF = window.jsPDF;
      if (!JsPDF && window._jsPDFCtor)          JsPDF = window._jsPDFCtor;

      if (!JsPDF) {
        if (typeof html2pdf !== 'undefined') {
          var w = document.createElement('div');
          document.body.appendChild(w);
          html2pdf().set({ jsPDF: { unit:'mm', format:'letter' } }).from(w).get('jsPDF').then(function(doc) {
            document.body.removeChild(w);
            if (doc && doc.constructor) {
              window._jsPDFCtor = doc.constructor;
              descargarFichaLegal(idProp, tipo);
            }
          }).catch(function() { document.body.removeChild(w); });
          return;
        }
        alert('jsPDF no disponible temporalmente. Intente nuevamente en unos segundos.');
        return;
      }

      var doc = new JsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
      var W = 215.9, mg = 16, cw = W - mg * 2;
      var y = mg;

      // ── ENCABEZADO CON LOGO 5 TIERRAS ──
      try {
        if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {
          doc.addImage(LOGO_5T_BASE64, 'JPEG', mg, y - 2, 22, 22);
        }
      } catch(eLogo) {
        console.warn('Logo no se pudo incrustar:', eLogo);
      }

      _pdfTxt(doc, 'INMOBILIARIA 5 TIERRAS S.A.', mg + 26, y + 4, {bold:true, size:13, color:'#0f172a'});
      _pdfTxt(doc, 'EXPEDIENTE JURIDICO & ANTECEDENTES PARA REDACCION LEGAL', mg + 26, y + 9, {bold:true, size:8, color:'#64748b'});
      _pdfTxt(doc, 'NOTARIA DESIGNADA: ' + notaria.toUpperCase(), mg + 26, y + 13.5, {bold:true, size:7.5, color:'#2563eb'});

      var fechaHoyStr = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.fechaHoy) ? APP5T_Utils.fechaHoy() : new Date().toLocaleDateString('es-CL');
      _pdfTxt(doc, 'FECHA EMISION:', mg + cw - 42, y + 4, {bold:true, size:7, color:'#64748b'});
      _pdfTxt(doc, fechaHoyStr, mg + cw - 42, y + 8, {bold:true, size:8.5, color:'#0f172a'});
      _pdfTxt(doc, 'REF: EXP-' + (isEscritura ? 'ESC' : 'PROM') + '-' + (prop.id || '00'), mg + cw - 42, y + 13.5, {size:7.5, color:'#64748b'});

      y += 20;
      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');
      y += 5;

      // ── TITULO DOCUMENTO ──
      var tituloDoc = isEscritura ? 'MINUTA DE ANTECEDENTES - ESCRITURA DEFINITIVA' : 'FICHA DE ANTECEDENTES - PROMESA DE COMPRAVENTA';
      _pdfRect(doc, mg, y, cw, 9, '#f1f5f9', '#cbd5e1');
      _pdfTxt(doc, tituloDoc, W / 2, y + 6.2, {bold:true, size:10.5, color:'#1e3a8a', align:'center'});
      y += 13;

      // ── SECCION 1: INDIVIDUALIZACION DEL COMPRADOR (CLIENTE) ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '1. INDIVIDUALIZACION DE LA PARTE COMPRADORA / PROMITENTE COMPRADOR', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 28, '#ffffff', '#e2e8f0');
      var cRows = [
        ['NOMBRE COMPLETO:', cliNom, 'R.U.T.:', cliRut],
        ['ESTADO CIVIL:', cliCivil, 'PROFESION / OFICIO:', cliProfesion],
        ['DOMICILIO:', cliDireccion, 'TELEFONO:', cliTel],
        ['CORREO ELECTRONICO:', cliEmail, 'CODIGO CLIENTE:', cliente ? ('CLI-' + cliente.id) : 'S/I']
      ];
      var cy = y + 4;
      cRows.forEach(function(row) {
        _pdfTxt(doc, row[0], mg + 3, cy, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[1]), mg + 35, cy, {bold:true, size:7.5, color:'#0f172a'});
        _pdfTxt(doc, row[2], mg + cw/2 + 2, cy, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, cy, {bold:true, size:7.5, color:'#0f172a'});
        cy += 6;
      });
      y += 32;

      // ── SECCION 2: INDIVIDUALIZACION DEL INMUEBLE (PARCELA / LOTE) ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '2. INDIVIDUALIZACION DEL INMUEBLE (PARCELA / LOTE)', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 23, '#ffffff', '#e2e8f0');
      var pRows = [
        ['PROYECTO INMOBILIARIO:', proyNom, 'ETAPA:', etapaNom],
        ['PARCELA / LOTE:', loteNom, 'SUPERFICIE OFICIAL:', supFmt],
        ['ROL DE AVALUO:', rolAvaluo, 'UBICACION / COMUNA:', 'Region de Nuble, Chile']
      ];
      var py = y + 4;
      pRows.forEach(function(row) {
        _pdfTxt(doc, row[0], mg + 3, py, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[1]), mg + 39, py, {bold:true, size:7.5, color:'#0f172a'});
        _pdfTxt(doc, row[2], mg + cw/2 + 2, py, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, py, {bold:true, size:7.5, color:'#0f172a'});
        py += 6.5;
      });
      y += 27;

      // ── SECCION 3: CONDICIONES ECONOMICAS Y FORMA DE PAGO ──
      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');
      _pdfTxt(doc, '3. CONDICIONES ECONOMICAS DE LA OPERACION Y FORMA DE PAGO', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});
      y += 6.5;

      _pdfRect(doc, mg, y, cw, 30, '#ffffff', '#e2e8f0');
      var eRows = [
        ['PRECIO TOTAL DE VENTA:', precioFmt, 'MONTO RESERVA PAGADO:', pieFmt],
        ['SALDO A PAGAR:', saldoFmt, 'CANTIDAD DE CUOTAS:', cuotasCant],
        ['MODALIDAD DE PAGO:', metodoPago, 'NOTARIA COMPARECENCIA:', notaria],
        ['ESTADO OPERATIVO:', isEscritura ? 'Listo para Escrituracion' : 'Listo para Firma de Promesa', 'ID NEGOCIACION:', neg ? ('NEG-' + neg.id) : 'S/I']
      ];
      var ey = y + 4;
      eRows.forEach(function(row) {
        _pdfTxt(doc, row[0], mg + 3, ey, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[1]), mg + 39, ey, {bold:true, size:7.8, color:(row[0].indexOf('PRECIO') === 0 ? '#047857' : '#0f172a')});
        _pdfTxt(doc, row[2], mg + cw/2 + 2, ey, {bold:true, size:6.8, color:'#64748b'});
        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, ey, {bold:true, size:7.8, color:'#0f172a'});
        ey += 6.5;
      });
      y += 34;

      // ── SECCION 4: INSTRUCCIONES Y OBSERVACIONES JURIDICAS ──
      _pdfRect(doc, mg, y, cw, 22, '#f8fafc', '#e2e8f0');
      _pdfTxt(doc, 'INSTRUCCIONES PARA LA REDACCION:', mg + 4, y + 4.5, {bold:true, size:7.2, color:'#1e3a8a'});
      var instText = 'Se solicita a la asesoria legal confeccionar el borrador correspondiente conforme a las condiciones precedentes y remitirlo a Gerencia para revision previa a la firma en Notaria. Los antecedentes de titulos de dominio se encuentran archivados en el repositorio documental corporativo de 5 Tierras.';
      _pdfWrap(doc, instText, mg + 4, y + 8.5, cw - 8, 4, {size:7.2, color:'#334155'});
      y += 27;

      // ── FIRMAS DE VALIDACION GERENCIAL ──
      _pdfLine(doc, mg, y, mg + cw, y, '#e2e8f0');
      y += 4;
      var sigW = cw / 2 - 12, sig2x = mg + cw / 2 + 12;

      _pdfTxt(doc, 'Daniel Gajardo P.', mg + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});
      _pdfLine(doc, mg, y + 12, mg + sigW, y + 12, '#94a3b8');
      _pdfTxt(doc, 'GERENCIA GENERAL / COMERCIAL', mg + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});
      _pdfTxt(doc, 'Inmobiliaria 5 Tierras S.A.', mg + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});

      _pdfTxt(doc, 'Asesoria Juridica & Notarial', sig2x + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});
      _pdfLine(doc, sig2x, y + 12, sig2x + sigW, y + 12, '#94a3b8');
      _pdfTxt(doc, 'RECEPCION Y REDACCION LEGAL', sig2x + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});
      _pdfTxt(doc, 'Notaria Quinta de Chillan', sig2x + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});

      y += 26;
      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');
      y += 4;
      _pdfTxt(doc, '5 Tierras S.A. | Sistema de Gestion Inmobiliaria | Chillan, Region de Nuble | Documento Legal Confidencial', W / 2, y, {size:6.8, color:'#94a3b8', align:'center'});

      // Guardar archivo
      var cleanProy = proyNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      var cleanLote = loteNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      var cleanCli = cliNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      var filename = 'Ficha_Legal_' + (isEscritura ? 'Escritura' : 'Promesa') + '_' + cleanProy + '_' + cleanLote + '_' + cleanCli + '.pdf';

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

// Insertar antes de _hexToRgb
const insertMarker = '  // ── jsPDF helpers ────────────────────────────────────────────────────────';
code = code.replace(insertMarker, logoDefinition + fichaLegalFunc + '\n' + insertMarker);

// 4. Exportar descargarFichaLegal en api
code = code.replace('vincularDocumentoLote, descargarPDFSimulado', 'vincularDocumentoLote, descargarPDFSimulado, descargarFichaLegal');

fs.writeFileSync('02_GESTION/js/forms.js', code, 'utf8');
console.log('02_GESTION/js/forms.js generado correctamente.');
