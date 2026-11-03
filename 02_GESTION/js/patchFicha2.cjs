const fs = require('fs');
let code = fs.readFileSync('forms.js', 'utf8');

// The block to replace:
//      if (estado === 'Reservada') {
//        btnComprobanteHTML = `
//          <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 4px;">
//            <i class="fa-solid fa-file-pdf"></i> Recibo Reserva
//          </button>
//        `;
//      } else if (estado === 'Promesada') {

let target = /if \(estado === 'Reservada'\) \{\s*btnComprobanteHTML = `\s*<button type="button" id="btn-ver-comprobante"[^>]+>\s*<i class="fa-solid fa-file-pdf"><\/i> Recibo Reserva\s*<\/button>\s*`;\s*\}/;

let replacement = `if (estado === 'Reservada') {
        btnComprobanteHTML = \`
          <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 8px;">
            <i class="fa-solid fa-file-pdf"></i> Recibo Reserva
          </button>
          \${neg && !neg.autorizado_promesa ? \`
          <button type="button" id="btn-gerente-autorizar-promesa-ficha" class="btn btn-warning" style="width: 100%; padding: 8px;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>
          \` : ''}
        \`;
      }`;

if (target.test(code)) {
    code = code.replace(target, replacement);
    console.log("Button patched.");
} else {
    console.log("Button not found.");
}

let targetListener = /\/\/ Bind event listeners\s*const btnComprobante = container\.querySelector\('#btn-ver-comprobante'\);/;
let replaceListener = `// Bind event listeners
      const btnAuthFicha = container.querySelector('#btn-gerente-autorizar-promesa-ficha');
      if (btnAuthFicha) {
        btnAuthFicha.addEventListener('click', () => {
          if (!confirm('¿Confirma que se ha firmado en notaría y autoriza continuar el proceso?')) return;
          const res = APP5T_DB.autorizarPromesa(neg.id);
          if (res && !res.success) {
            APP5T_Utils.showToast("Error: " + res.error, 'error');
            return;
          }
          APP5T_Utils.showToast('Promesa autorizada correctamente', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
        });
      }

      const btnComprobante = container.querySelector('#btn-ver-comprobante');`;

if (targetListener.test(code)) {
    code = code.replace(targetListener, replaceListener);
    console.log("Listener patched.");
} else {
    console.log("Listener not found.");
}

fs.writeFileSync('forms.js', code);
