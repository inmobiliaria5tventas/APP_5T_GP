const fs = require('fs');
let code = fs.readFileSync('js/forms.js', 'utf8');

// 1. Inject WhatsApp notification for Vendedor
code = code.replace(
  /APP5T_Utils\.showToast\(msgToast, 'success'\);(\s+if \(window\.APP5T)/g,
  "APP5T_Utils.showToast(msgToast, 'success');\n              if (window.APP5T && window.APP5T._sendWhatsAppGerencia) { window.APP5T._sendWhatsAppGerencia(res.id_negociacion, propiedad.id, idCliente); }$1"
);

// 2. Add the buttons to _renderFichaGerencial
let newButtons = `
          <button type="button" id="btn-gerente-ficha-abogado" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-blue); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 8px;">
            <i class="fa-solid fa-file-pdf"></i> Ficha Legal (Abogado)
          </button>
          \${neg && !neg.autorizado_promesa ? \`
          <button type="button" id="btn-gerente-autorizar-promesa-ficha" class="btn btn-warning" style="width: 100%; padding: 8px; margin-bottom: 8px;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>
          \` : (neg && neg.autorizado_promesa ? \`
          <button type="button" class="btn btn-warning" style="width: 100%; padding: 8px; margin-bottom: 8px; opacity: 0.5; cursor: not-allowed;" disabled><i class="fa-solid fa-check-double"></i> Promesa Autorizada</button>
          \` : '')}
`;

code = code.replace(
  /<button type="button" id="btn-ver-comprobante"[\s\S]*?Recibo Reserva\s*<\/button>/,
  `$&${newButtons}`
);

// 3. Add event listeners for the new buttons in _renderFichaGerencial
let newEventListeners = `
      const btnFichaAbogado = container.querySelector('#btn-gerente-ficha-abogado');
      if (btnFichaAbogado) {
        btnFichaAbogado.addEventListener('click', () => {
          _generarPDFAbogado(propiedad, neg, cliente, vendedor);
        });
      }

      const btnAuthFicha = container.querySelector('#btn-gerente-autorizar-promesa-ficha');
      if (btnAuthFicha) {
        btnAuthFicha.addEventListener('click', () => {
          if (!confirm('¿Confirma que se ha firmado en notaría y autoriza continuar el proceso de promesa?')) return;
          const res = APP5T_DB.autorizarPromesa(neg.id);
          if (res && !res.success) {
            APP5T_Utils.showToast("Error: " + res.error, 'error');
            return;
          }
          APP5T_Utils.showToast('Promesa autorizada correctamente', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
        });
      }
`;

code = code.replace(
  /const btnComprobante = container\.querySelector\('#btn-ver-comprobante'\);/,
  `${newEventListeners}\n      const btnComprobante = container.querySelector('#btn-ver-comprobante');`
);


// 4. Restore the block in _renderLoteFormBase for Administrador
code = code.replace(
  /<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"><\/i> Firmar Promesa<\/button>/,
  `\${neg && !neg.autorizado_promesa ? "\\n            <p class=\\"info-text-box warning\\" style=\\"margin-top: 10px;\\">\\n              <i class=\\"fa-solid fa-lock\\"><\/i>\\n              <span>Firma bloqueada: Requiere que Gerencia autorice el proceso luego de ir a notaría.<\/span>\\n            <\/p>\\n            <button type=\\"button\\" class=\\"btn btn-primary\\" style=\\"margin-top: 10px; opacity: 0.5; cursor: not-allowed;\\"><i class=\\"fa-solid fa-file-contract\\"><\/i> Firmar Promesa (Bloqueado)<\/button>\\n            " : "\\n            <button type=\\"button\\" id=\\"btn-submit-promesa\\" class=\\"btn btn-primary\\" style=\\"margin-top: 10px;\\"><i class=\\"fa-solid fa-file-contract\\"><\/i> Firmar Promesa<\/button>\\n            "}`
);

// 5. Add _generarPDFAbogado function
let pdfFunc = `
  function _generarPDFAbogado(propiedad, neg, cliente, vendedor) {
    const dateStr = APP5T_Utils.fechaHoy();
    const cleanLote = (propiedad.nombre || '').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = 'Ficha_Legal_Lote_' + cleanLote + '_' + new Date().toISOString().split('T')[0] + '.pdf';
    
    const proy = APP5T_DB.getById('proyectos', propiedad.id_proyecto);
    const proyectoNom = proy ? proy.nombre_proyecto : '---';
    const cliNom = cliente ? \`\${cliente.nombres || ''} \${cliente.apellidos || ''}\` : '---';
    const cliRut = cliente ? (cliente.rut || '---') : '---';
    const cliDir = cliente ? (cliente.direccion || '---') : '---';
    const cliComuna = cliente ? (cliente.comuna || '---') : '---';
    const cliFono = cliente ? (cliente.telefono || '---') : '---';
    const cliEmail = cliente ? (cliente.email || '---') : '---';
    const cliEstadoCivil = cliente ? (cliente.estado_civil || '---') : '---';
    const cliRegimen = cliente ? (cliente.regimen_matrimonial || '---') : '---';
    const cliProf = cliente ? (cliente.profesion || '---') : '---';

    _generarPDFConJsPDF({
      type: 'abogado',
      docHeader: 'FICHA LEGAL - INSTRUCCIÓN PARA PROMESA',
      dateStr: dateStr,
      lote: propiedad.nombre || '',
      proyecto: proyectoNom,
      superficie: propiedad.superficie || '',
      rol: propiedad.rol || 'En Trámite',
      clienteNom: cliNom,
      clienteRut: cliRut,
      precio: APP5T_Utils.formatMoneda(neg.valor_final || 0),
      pie: APP5T_Utils.formatMoneda(neg.pie || 0),
      metodoPago: neg.metodo_pago || 'Transferencia',
      cuotas: neg.cantidad_cuotas || '0',
      negId: String(neg.id).padStart(2,'0'),
      bodyText: \`DATOS DEL COMPRADOR:
Nombre: \${cliNom}
RUT: \${cliRut}
Estado Civil: \${cliEstadoCivil}
Régimen Matrimonial: \${cliRegimen}
Profesión/Oficio: \${cliProf}
Dirección: \${cliDir}, \${cliComuna}
Teléfono: \${cliFono}
Email: \${cliEmail}

CONDICIONES COMERCIALES:
Precio Final: \${APP5T_Utils.formatMoneda(neg.valor_final || 0)}
Monto Reserva/Pie: \${APP5T_Utils.formatMoneda(neg.pie || 0)}
Forma de Pago Pie: \${neg.metodo_pago || 'Transferencia'}

VENDEDOR RESPONSABLE: \${vendedor ? vendedor.nombre : '---'}\`
    }, filename);
  }
`;

code = code.replace(/function _generarPDFConJsPDF/, pdfFunc + '\n  function _generarPDFConJsPDF');

fs.writeFileSync('js/forms.js', code);
console.log('Done modifying forms.js');
