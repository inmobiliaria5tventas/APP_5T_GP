const fs = require('fs');
let code = fs.readFileSync('forms.js', 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

const t1 = `              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
              </div>`;

const r1 = `              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <div style="display: flex; gap: 8px;">
                  <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                  <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
                </div>
                ${neg && !neg.autorizado_promesa ? \`
                <button type="button" id="btn-gerente-autorizar-promesa" class="btn btn-warning" style="width: 100%;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>
                \` : ''}
              </div>`;

if (!code.includes(t1)) console.log("t1 not found!");

const t2 = `<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>`;
const r2 = `${neg && !neg.autorizado_promesa ? \`
            <p class="info-text-box warning" style="margin-top: 10px;">
              <i class="fa-solid fa-lock"></i>
              <span>Firma bloqueada: Requiere que Gerencia autorice el proceso luego de ir a notaría.</span>
            </p>
            <button type="button" class="btn btn-primary" style="margin-top: 10px; opacity: 0.5; cursor: not-allowed;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa (Bloqueado)</button>
            \` : \`
            <button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>
            \`}`;

if (!code.includes(t2)) console.log("t2 not found!");

const t3 = `// btn-gerente-cancelar-reserva event listener
        if (role === 'gerente' && neg) {`;
const r3 = `// btn-gerente-autorizar-promesa event listener
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
        if (role === 'gerente' && neg) {`;

if (!code.includes(t3)) console.log("t3 not found!");

code = code.replace(/APP5T_Utils\.showToast\('Reserva registrada y aprobada de inmediato[^']+', 'success'\);/g,
`APP5T_Utils.showToast('Reserva registrada y aprobada de inmediato', 'success');
          const cData = _validateForm();
          const wPhone = '+56972154441';
          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;
          const wOpName = 'Reserva';
          const wText = encodeURIComponent(\`Hola, acabo de ingresar una solicitud de \${wOpName} para el lote \${propiedad.nombre} a nombre de \${wClientName}.\`);
          window.open(\`https://wa.me/\${wPhone}?text=\${wText}\`, '_blank');`);

code = code.replace(/APP5T_Utils\.showToast\('Venta Directa registrada y aprobada exitosamente[^']+', 'success'\);/g,
`APP5T_Utils.showToast('Venta Directa registrada y aprobada exitosamente', 'success');
          const wPhone = '+56972154441';
          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;
          const wOpName = 'Venta Directa';
          const wText = encodeURIComponent(\`Hola, acabo de ingresar una solicitud de \${wOpName} para el lote \${propiedad.nombre} a nombre de \${wClientName}.\`);
          window.open(\`https://wa.me/\${wPhone}?text=\${wText}\`, '_blank');`);

code = code.replace(t1, r1);
code = code.replace(t2, r2);
code = code.replace(t3, r3);

fs.writeFileSync('forms.js', code);
console.log('Applied safely.');
