const fs = require('fs');

let code = fs.readFileSync('forms.js', 'utf8');

const targetBtnHtml = `      if (estado === 'Reservada') {
        btnComprobanteHTML = \`
          <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 4px;">
            <i class="fa-solid fa-file-pdf"></i> Recibo Reserva
          </button>
        \`;`;

const replaceBtnHtml = `      if (estado === 'Reservada') {
        btnComprobanteHTML = \`
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 4px;">
              <i class="fa-solid fa-file-pdf"></i> Recibo Reserva
            </button>
            \${neg && !neg.autorizado_promesa ? \`<button type="button" id="btn-gerente-autorizar-promesa-ficha" class="btn btn-warning" style="width: 100%;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>\` : ''}
          </div>
        \`;`;

const targetListener = `      // Bind event listeners
      const btnComprobante = container.querySelector('#btn-ver-comprobante');`;

const replaceListener = `      // Bind event listeners
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

function safeReplace(original, target, replacement) {
    let normTarget = target.replace(/\r\n/g, '\n');
    let normOrig = original.replace(/\r\n/g, '\n');
    if (normOrig.includes(normTarget)) {
        return normOrig.replace(normTarget, replacement);
    }
    console.log("NOT FOUND: ", target.substring(0, 50));
    return original;
}

code = safeReplace(code, targetBtnHtml, replaceBtnHtml);
code = safeReplace(code, targetListener, replaceListener);

fs.writeFileSync('forms.js', code);
console.log('Ficha patched');
