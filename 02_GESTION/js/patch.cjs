const fs = require('fs');
let code = fs.readFileSync('forms.js', 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

const t1 = '              <div style="display: flex; gap: 8px; margin-top: 10px;">\n                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>\n                <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>\n              </div>';

const r1 = '              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">\n                <div style="display: flex; gap: 8px;">\n                  <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>\n                  <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>\n                </div>\n                ${neg && !neg.autorizado_promesa ? "\\n                <button type=\\"button\\" id=\\"btn-gerente-autorizar-promesa\\" class=\\"btn btn-warning\\" style=\\"width: 100%;\\"><i class=\\"fa-solid fa-file-signature\\"></i> Notaría: Autorizar Promesa</button>\\n                " : \'\'}\n              </div>';

const t2 = '<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>';

const r2 = '${neg && !neg.autorizado_promesa ? "\\n            <p class=\\"info-text-box warning\\" style=\\"margin-top: 10px;\\">\\n              <i class=\\"fa-solid fa-lock\\"></i>\\n              <span>Firma bloqueada: Requiere que Gerencia autorice el proceso luego de ir a notaría.</span>\\n            </p>\\n            <button type=\\"button\\" class=\\"btn btn-primary\\" style=\\"margin-top: 10px; opacity: 0.5; cursor: not-allowed;\\"><i class=\\"fa-solid fa-file-contract\\"></i> Firmar Promesa (Bloqueado)</button>\\n            " : "\\n            <button type=\\"button\\" id=\\"btn-submit-promesa\\" class=\\"btn btn-primary\\" style=\\"margin-top: 10px;\\"><i class=\\"fa-solid fa-file-contract\\"></i> Firmar Promesa</button>\\n            "}';

const t3 = '// btn-gerente-cancelar-reserva event listener\n        if (role === \'gerente\' && neg) {';
const r3 = '// btn-gerente-autorizar-promesa event listener\n        if (role === \'gerente\' && neg) {\n          const btnAuth = container.querySelector(\'#btn-gerente-autorizar-promesa\');\n          if (btnAuth) {\n            btnAuth.addEventListener(\'click\', () => {\n              if (!confirm(\'¿Confirma que se ha firmado en notaría y autoriza continuar el proceso?\')) return;\n              const res = APP5T_DB.autorizarPromesa(neg.id);\n              if (res && !res.success) {\n                APP5T_Utils.showToast("Error: " + res.error, \'error\');\n                return;\n              }\n              APP5T_Utils.showToast(\'Promesa autorizada correctamente\', \'success\');\n              if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();\n            });\n          }\n        }\n\n        // btn-gerente-cancelar-reserva event listener\n        if (role === \'gerente\' && neg) {';

if (code.includes(t1)) code = code.replace(t1, r1);
else console.log("t1 not found");

if (code.includes(t2)) code = code.replace(t2, r2);
else console.log("t2 not found");

if (code.includes(t3)) code = code.replace(t3, r3);
else console.log("t3 not found");

code = code.replace(/APP5T_Utils\.showToast\('Reserva registrada y aprobada de inmediato[^']+', 'success'\);/g,
"APP5T_Utils.showToast('Reserva registrada y aprobada de inmediato', 'success');\n          const cData = _validateForm();\n          const wPhone = '+56972154441';\n          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;\n          const wOpName = 'Reserva';\n          const wText = encodeURIComponent('Hola, acabo de ingresar una solicitud de ' + wOpName + ' para el lote ' + propiedad.nombre + ' a nombre de ' + wClientName + '.');\n          window.open('https://wa.me/' + wPhone + '?text=' + wText, '_blank');");

code = code.replace(/APP5T_Utils\.showToast\('Venta Directa registrada y aprobada exitosamente[^']+', 'success'\);/g,
"APP5T_Utils.showToast('Venta Directa registrada y aprobada exitosamente', 'success');\n          const wPhone = '+56972154441';\n          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;\n          const wOpName = 'Venta Directa';\n          const wText = encodeURIComponent('Hola, acabo de ingresar una solicitud de ' + wOpName + ' para el lote ' + propiedad.nombre + ' a nombre de ' + wClientName + '.');\n          window.open('https://wa.me/' + wPhone + '?text=' + wText, '_blank');");

fs.writeFileSync('forms.js', code);
console.log('Patched correctly');
