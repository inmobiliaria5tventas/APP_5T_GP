const fs = require('fs');
let lines = fs.readFileSync('forms.js', 'utf8').split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="btn-gerente-cancelar-reserva"')) {
    if (!lines[i+1].includes('btn-gerente-autorizar-promesa')) {
      lines.splice(i + 1, 0,
        "              </div>",
        "              ${neg && !neg.autorizado_promesa ? `",
        "              <button type=\"button\" id=\"btn-gerente-autorizar-promesa\" class=\"btn btn-warning\" style=\"width: 100%; margin-top: 10px;\"><i class=\"fa-solid fa-file-signature\"></i> Notaría: Autorizar Promesa</button>",
        "              ` : ''}"
      );
      // Wait, we need to remove the original </div> which was at i+1 (now i+5)
      // Actually original was at i+1
      lines[i] = lines[i].replace('class="btn btn-danger"', 'class="btn btn-danger"'); // No-op to mark we found it
      lines.splice(i+5, 1); // remove the old </div>
      
      // But wait! We need to make the parent flex-direction column. The parent was at i-2
      lines[i-2] = lines[i-2].replace('display: flex; gap:', 'display: flex; flex-direction: column; gap:');
      // And wrap the two buttons in a new div:
      lines.splice(i-1, 0, "                <div style=\"display: flex; gap: 8px;\">");
      // Which means everything shifts. Let's do it cleanly by rewriting the block.
    }
  }
}

// Cleaner way:
let code = fs.readFileSync('forms.js', 'utf8');
code = code.replace(
  /<div style="display: flex; gap: 8px; margin-top: 10px;">\s*<button type="submit"[^>]+><i[^>]+><\/i> Guardar Reserva<\/button>\s*<button type="button" id="btn-gerente-cancelar-reserva"[^>]+><i[^>]+><\/i> Rechazar \/ Anular<\/button>\s*<\/div>/,
  `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <div style="display: flex; gap: 8px;">
                  <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                  <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
                </div>
                \${neg && !neg.autorizado_promesa ? \`
                <button type="button" id="btn-gerente-autorizar-promesa" class="btn btn-warning" style="width: 100%;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>
                \` : ''}
              </div>`
);

code = code.replace(
  /<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"><\/i> Firmar Promesa<\/button>/,
  `\${neg && !neg.autorizado_promesa ? \`
            <p class="info-text-box warning" style="margin-top: 10px;">
              <i class="fa-solid fa-lock"></i>
              <span>Firma bloqueada: Requiere que Gerencia autorice el proceso luego de ir a notaría.</span>
            </p>
            <button type="button" class="btn btn-primary" style="margin-top: 10px; opacity: 0.5; cursor: not-allowed;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa (Bloqueado)</button>
            \` : \`
            <button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>
            \`}`
);

code = code.replace(
  /\/\/ btn-gerente-cancelar-reserva event listener\s*if \(role === 'gerente' && neg\) {/,
  `// btn-gerente-autorizar-promesa event listener
        if (role === 'gerente' && neg) {
          const btnAuth = container.querySelector('#btn-gerente-autorizar-promesa');
          if (btnAuth) {
            btnAuth.addEventListener('click', () => {
              if (!confirm('¿Confirma que se ha firmado en notaría y autoriza continuar el proceso?')) return;
              const res = APP5T_DB.autorizarPromesa(neg.id);
              if (res && !res.success) {
                APP5T_Utils.showToast(\`Error: \${res.error}\`, 'error');
                return;
              }
              APP5T_Utils.showToast('Promesa autorizada correctamente', 'success');
              if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            });
          }
        }

        // btn-gerente-cancelar-reserva event listener
        if (role === 'gerente' && neg) {`
);

fs.writeFileSync('forms.js', code);
console.log('Patched correctly with regex!');
