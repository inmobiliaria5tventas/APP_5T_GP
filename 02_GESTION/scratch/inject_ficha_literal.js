const fs = require('fs');

let code = fs.readFileSync('02_GESTION/js/forms.js', 'utf8');
const logoB64 = fs.readFileSync('02_GESTION/scratch/logo_base64.txt', 'utf8').trim();

// 1. Constante del logo
const logoDefinition = '\n  const LOGO_5T_BASE64 = "data:image/jpeg;base64,' + logoB64 + '";\n\n';

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
  const parts = code.split(oldHeaderCode);
  code = parts[0] + newHeaderCode + parts.slice(1).join(oldHeaderCode);
  console.log('Logo integrado a comprobantes de reserva existentes.');
}

// 3. Ficha Legal
const lines = [];
lines.push("  function descargarFichaLegal(idProp, tipoDoc) {");
lines.push("    var tipo = tipoDoc || 'promesa';");
lines.push("    try {");
lines.push("      if (typeof APP5T_DB === 'undefined') {");
lines.push("        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {");
lines.push("          APP5T_Utils.showToast('Base de datos no disponible', 'error');");
lines.push("        }");
lines.push("        return;");
lines.push("      }");
lines.push("      var prop = APP5T_DB.getById('propiedades', idProp);");
lines.push("      var neg = null;");
lines.push("      if (prop) {");
lines.push("        var negs = APP5T_DB.query('negociaciones', function(n) {");
lines.push("          return n && String(n.id_propiedad) === String(prop.id);");
lines.push("        }) || [];");
lines.push("        neg = negs.find(function(n) { return n.estado_avance === 'Aprobado'; }) || negs[negs.length - 1];");
lines.push("      } else {");
lines.push("        neg = APP5T_DB.getById('negociaciones', idProp);");
lines.push("        if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);");
lines.push("      }");
lines.push("      if (!prop) {");
lines.push("        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {");
lines.push("          APP5T_Utils.showToast('No se encontro informacion del lote para la ficha.', 'error');");
lines.push("        }");
lines.push("        return;");
lines.push("      }");
lines.push("      var isEscritura = (tipo === 'escritura');");
lines.push("      var etapa = prop.id_etapa ? APP5T_DB.getById('etapas', prop.id_etapa) : null;");
lines.push("      var proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : (prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null);");
lines.push("      var cliente = (neg && neg.id_cliente) ? APP5T_DB.getById('clientes', neg.id_cliente) : null;");
lines.push("      var proyNom = proy ? (proy.nombre_proyecto || proy.nombre || 'Proyecto 5 Tierras') : (prop.proyecto || 'Proyecto 5 Tierras');");
lines.push("      var loteNom = prop.nombre || ('Lote ' + prop.id);");
lines.push("      var etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || 'Etapa 1') : 'Etapa 1';");
lines.push("      var supFmt = prop.superficie ? ((typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(prop.superficie) : (prop.superficie + ' m2')) : '5.000 m2 aprox.';");
lines.push("      var rolAvaluo = prop.rol || 'En tramite / Matriz';");
lines.push("      var cliNom = cliente ? (cliente.nombres + ' ' + (cliente.apellidos || '')).trim() : 'Sin cliente asignado';");
lines.push("      var cliRut = cliente ? (cliente.rut || 'No informado') : 'No informado';");
lines.push("      var cliTel = cliente ? (cliente.telefono || 'No informado') : 'No informado';");
lines.push("      var cliEmail = cliente ? (cliente.email || 'No informado') : 'No informado';");
lines.push("      var cliDireccion = cliente ? (cliente.direccion || 'Chillan / Nuble') : 'Chillan / Nuble';");
lines.push("      var cliCivil = cliente ? (cliente.estado_civil || 'Soltero/a') : 'No especificado';");
lines.push("      var cliProfesion = cliente ? (cliente.profesion || 'Particular') : 'Particular';");
lines.push("      var precioTotal = (neg && neg.precio_acordado) ? neg.precio_acordado : (prop.valor_final || 0);");
lines.push("      var precioFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(precioTotal) : ('$' + Number(precioTotal).toLocaleString('es-CL'));");
lines.push("      var pieVal = (neg && neg.pie) ? neg.pie : (prop.abono || 0);");
lines.push("      var pieFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(pieVal) : ('$' + Number(pieVal).toLocaleString('es-CL'));");
lines.push("      var saldoVal = Math.max(0, precioTotal - pieVal);");
lines.push("      var saldoFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(saldoVal) : ('$' + Number(saldoVal).toLocaleString('es-CL'));");
lines.push("      var cuotasCant = (neg && neg.cantidad_cuotas) ? String(neg.cantidad_cuotas) : 'Sin cuotas (Contado)';");
lines.push("      var metodoPago = (neg && neg.metodo_pago) ? neg.metodo_pago : 'Transferencia Bancaria';");
lines.push("      var notaria = 'Notaria Quinta de Chillan';");
lines.push("      var JsPDF = null;");
lines.push("      if (window.jspdf && window.jspdf.jsPDF) JsPDF = window.jspdf.jsPDF;");
lines.push("      else if (window.jsPDF) JsPDF = window.jsPDF;");
lines.push("      if (!JsPDF && window._jsPDFCtor) JsPDF = window._jsPDFCtor;");
lines.push("      if (!JsPDF) {");
lines.push("        if (typeof html2pdf !== 'undefined') {");
lines.push("          var w = document.createElement('div');");
lines.push("          document.body.appendChild(w);");
lines.push("          html2pdf().set({ jsPDF: { unit:'mm', format:'letter' } }).from(w).get('jsPDF').then(function(doc) {");
lines.push("            document.body.removeChild(w);");
lines.push("            if (doc && doc.constructor) {");
lines.push("              window._jsPDFCtor = doc.constructor;");
lines.push("              descargarFichaLegal(idProp, tipo);");
lines.push("            }");
lines.push("          }).catch(function() { document.body.removeChild(w); });");
lines.push("          return;");
lines.push("        }");
lines.push("        alert('jsPDF no disponible temporalmente. Intente nuevamente en unos segundos.');");
lines.push("        return;");
lines.push("      }");
lines.push("      var doc = new JsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });");
lines.push("      var W = 215.9, mg = 16, cw = W - mg * 2;");
lines.push("      var y = mg;");
lines.push("      try {");
lines.push("        if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {");
lines.push("          doc.addImage(LOGO_5T_BASE64, 'JPEG', mg, y - 2, 22, 22);");
lines.push("        }");
lines.push("      } catch(eLogo) {");
lines.push("        console.warn('Logo no se pudo incrustar:', eLogo);");
lines.push("      }");
lines.push("      _pdfTxt(doc, 'INMOBILIARIA 5 TIERRAS S.A.', mg + 26, y + 4, {bold:true, size:13, color:'#0f172a'});");
lines.push("      _pdfTxt(doc, 'EXPEDIENTE JURIDICO & ANTECEDENTES PARA REDACCION LEGAL', mg + 26, y + 9, {bold:true, size:8, color:'#64748b'});");
lines.push("      _pdfTxt(doc, 'NOTARIA DESIGNADA: ' + notaria.toUpperCase(), mg + 26, y + 13.5, {bold:true, size:7.5, color:'#2563eb'});");
lines.push("      var fechaHoyStr = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.fechaHoy) ? APP5T_Utils.fechaHoy() : new Date().toLocaleDateString('es-CL');");
lines.push("      _pdfTxt(doc, 'FECHA EMISION:', mg + cw - 42, y + 4, {bold:true, size:7, color:'#64748b'});");
lines.push("      _pdfTxt(doc, fechaHoyStr, mg + cw - 42, y + 8, {bold:true, size:8.5, color:'#0f172a'});");
lines.push("      _pdfTxt(doc, 'REF: EXP-' + (isEscritura ? 'ESC' : 'PROM') + '-' + (prop.id || '00'), mg + cw - 42, y + 13.5, {size:7.5, color:'#64748b'});");
lines.push("      y += 20;");
lines.push("      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');");
lines.push("      y += 5;");
lines.push("      var tituloDoc = isEscritura ? 'MINUTA DE ANTECEDENTES - ESCRITURA DEFINITIVA' : 'FICHA DE ANTECEDENTES - PROMESA DE COMPRAVENTA';");
lines.push("      _pdfRect(doc, mg, y, cw, 9, '#f1f5f9', '#cbd5e1');");
lines.push("      _pdfTxt(doc, tituloDoc, W / 2, y + 6.2, {bold:true, size:10.5, color:'#1e3a8a', align:'center'});");
lines.push("      y += 13;");
lines.push("      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');");
lines.push("      _pdfTxt(doc, '1. INDIVIDUALIZACION DE LA PARTE COMPRADORA / PROMITENTE COMPRADOR', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});");
lines.push("      y += 6.5;");
lines.push("      _pdfRect(doc, mg, y, cw, 28, '#ffffff', '#e2e8f0');");
lines.push("      var cRows = [");
lines.push("        ['NOMBRE COMPLETO:', cliNom, 'R.U.T.:', cliRut],");
lines.push("        ['ESTADO CIVIL:', cliCivil, 'PROFESION / OFICIO:', cliProfesion],");
lines.push("        ['DOMICILIO:', cliDireccion, 'TELEFONO:', cliTel],");
lines.push("        ['CORREO ELECTRONICO:', cliEmail, 'CODIGO CLIENTE:', cliente ? ('CLI-' + cliente.id) : 'S/I']");
lines.push("      ];");
lines.push("      var cy = y + 4;");
lines.push("      cRows.forEach(function(row) {");
lines.push("        _pdfTxt(doc, row[0], mg + 3, cy, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[1]), mg + 35, cy, {bold:true, size:7.5, color:'#0f172a'});");
lines.push("        _pdfTxt(doc, row[2], mg + cw/2 + 2, cy, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, cy, {bold:true, size:7.5, color:'#0f172a'});");
lines.push("        cy += 6;");
lines.push("      });");
lines.push("      y += 32;");
lines.push("      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');");
lines.push("      _pdfTxt(doc, '2. INDIVIDUALIZACION DEL INMUEBLE (PARCELA / LOTE)', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});");
lines.push("      y += 6.5;");
lines.push("      _pdfRect(doc, mg, y, cw, 23, '#ffffff', '#e2e8f0');");
lines.push("      var pRows = [");
lines.push("        ['PROYECTO INMOBILIARIO:', proyNom, 'ETAPA:', etapaNom],");
lines.push("        ['PARCELA / LOTE:', loteNom, 'SUPERFICIE OFICIAL:', supFmt],");
lines.push("        ['ROL DE AVALUO:', rolAvaluo, 'UBICACION / COMUNA:', 'Region de Nuble, Chile']");
lines.push("      ];");
lines.push("      var py = y + 4;");
lines.push("      pRows.forEach(function(row) {");
lines.push("        _pdfTxt(doc, row[0], mg + 3, py, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[1]), mg + 39, py, {bold:true, size:7.5, color:'#0f172a'});");
lines.push("        _pdfTxt(doc, row[2], mg + cw/2 + 2, py, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, py, {bold:true, size:7.5, color:'#0f172a'});");
lines.push("        py += 6.5;");
lines.push("      });");
lines.push("      y += 27;");
lines.push("      _pdfRect(doc, mg, y, cw, 6.5, '#0f172a', '#0f172a');");
lines.push("      _pdfTxt(doc, '3. CONDICIONES ECONOMICAS DE LA OPERACION Y FORMA DE PAGO', mg + 4, y + 4.5, {bold:true, size:7.5, color:'#ffffff'});");
lines.push("      y += 6.5;");
lines.push("      _pdfRect(doc, mg, y, cw, 30, '#ffffff', '#e2e8f0');");
lines.push("      var eRows = [");
lines.push("        ['PRECIO TOTAL DE VENTA:', precioFmt, 'MONTO RESERVA PAGADO:', pieFmt],");
lines.push("        ['SALDO A PAGAR:', saldoFmt, 'CANTIDAD DE CUOTAS:', cuotasCant],");
lines.push("        ['MODALIDAD DE PAGO:', metodoPago, 'NOTARIA COMPARECENCIA:', notaria],");
lines.push("        ['ESTADO OPERATIVO:', isEscritura ? 'Listo para Escrituracion' : 'Listo para Firma de Promesa', 'ID NEGOCIACION:', neg ? ('NEG-' + neg.id) : 'S/I']");
lines.push("      ];");
lines.push("      var ey = y + 4;");
lines.push("      eRows.forEach(function(row) {");
lines.push("        _pdfTxt(doc, row[0], mg + 3, ey, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[1]), mg + 39, ey, {bold:true, size:7.8, color:(row[0].indexOf('PRECIO') === 0 ? '#047857' : '#0f172a')});");
lines.push("        _pdfTxt(doc, row[2], mg + cw/2 + 2, ey, {bold:true, size:6.8, color:'#64748b'});");
lines.push("        _pdfTxt(doc, String(row[3]), mg + cw/2 + 36, ey, {bold:true, size:7.8, color:'#0f172a'});");
lines.push("        ey += 6.5;");
lines.push("      });");
lines.push("      y += 34;");
lines.push("      _pdfRect(doc, mg, y, cw, 22, '#f8fafc', '#e2e8f0');");
lines.push("      _pdfTxt(doc, 'INSTRUCCIONES PARA LA REDACCION:', mg + 4, y + 4.5, {bold:true, size:7.2, color:'#1e3a8a'});");
lines.push("      var instText = 'Se solicita a la asesoria legal confeccionar el borrador correspondiente conforme a las condiciones precedentes y remitirlo a Gerencia para revision previa a la firma en Notaria. Los antecedentes de titulos de dominio se encuentran archivados en el repositorio documental corporativo de 5 Tierras.';");
lines.push("      _pdfWrap(doc, instText, mg + 4, y + 8.5, cw - 8, 4, {size:7.2, color:'#334155'});");
lines.push("      y += 27;");
lines.push("      _pdfLine(doc, mg, y, mg + cw, y, '#e2e8f0');");
lines.push("      y += 4;");
lines.push("      var sigW = cw / 2 - 12, sig2x = mg + cw / 2 + 12;");
lines.push("      _pdfTxt(doc, 'Daniel Gajardo P.', mg + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});");
lines.push("      _pdfLine(doc, mg, y + 12, mg + sigW, y + 12, '#94a3b8');");
lines.push("      _pdfTxt(doc, 'GERENCIA GENERAL / COMERCIAL', mg + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});");
lines.push("      _pdfTxt(doc, 'Inmobiliaria 5 Tierras S.A.', mg + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});");
lines.push("      _pdfTxt(doc, 'Asesoria Juridica & Notarial', sig2x + sigW/2, y + 10, {bold:true, size:9.5, color:'#1e3a8a', align:'center'});");
lines.push("      _pdfLine(doc, sig2x, y + 12, sig2x + sigW, y + 12, '#94a3b8');");
lines.push("      _pdfTxt(doc, 'RECEPCION Y REDACCION LEGAL', sig2x + sigW/2, y + 16, {bold:true, size:7, color:'#334155', align:'center'});");
lines.push("      _pdfTxt(doc, 'Notaria Quinta de Chillan', sig2x + sigW/2, y + 19.5, {size:6.8, color:'#64748b', align:'center'});");
lines.push("      y += 26;");
lines.push("      _pdfLine(doc, mg, y, mg + cw, y, '#cbd5e1');");
lines.push("      y += 4;");
lines.push("      _pdfTxt(doc, '5 Tierras S.A. | Sistema de Gestion Inmobiliaria | Chillan, Region de Nuble | Documento Legal Confidencial', W / 2, y, {size:6.8, color:'#94a3b8', align:'center'});");
lines.push("      var cleanProy = proyNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');");
lines.push("      var cleanLote = loteNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');");
lines.push("      var cleanCli = cliNom.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');");
lines.push("      var filename = 'Ficha_Legal_' + (isEscritura ? 'Escritura' : 'Promesa') + '_' + cleanProy + '_' + cleanLote + '_' + cleanCli + '.pdf';");
lines.push("      doc.save(filename);");
lines.push("      if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {");
lines.push("        APP5T_Utils.showToast('Ficha Legal descargada exitosamente en PDF.', 'success');");
lines.push("      }");
lines.push("    } catch(err) {");
lines.push("      console.error('Error generando Ficha Legal:', err);");
lines.push("      alert('Error al generar la Ficha Legal: ' + err.message);");
lines.push("    }");
lines.push("  }");

const fichaLegalCode = lines.join('\n') + '\n\n';

// Insertar usando split/join para evitar interpretación de $ en replace
const insertMarker = '  // ── jsPDF helpers ────────────────────────────────────────────────────────';
const parts = code.split(insertMarker);
code = parts[0] + logoDefinition + fichaLegalCode + insertMarker + parts.slice(1).join(insertMarker);

// 4. Exportar en api
code = code.split('vincularDocumentoLote, descargarPDFSimulado').join('vincularDocumentoLote, descargarPDFSimulado, descargarFichaLegal');

fs.writeFileSync('02_GESTION/js/forms.js', code, 'utf8');
console.log('02_GESTION/js/forms.js generado y escrito correctamente sin replace regex.');
