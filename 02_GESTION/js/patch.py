import os

with open('forms.js', 'r', encoding='utf8') as f:
    content = f.read()

t1 = """            ${role === 'gerente' ? `
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
              </div>
            ` : `"""

r1 = """            ${role === 'gerente' ? `
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <div style="display: flex; gap: 8px;">
                  <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                  <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
                </div>
                ${neg && !neg.autorizado_promesa ? `
                <button type="button" id="btn-gerente-autorizar-promesa" class="btn btn-warning" style="width: 100%; margin-top: 10px;"><i class="fa-solid fa-file-signature"></i> Notaría: Autorizar Promesa</button>
                ` : ''}
              </div>
            ` : `"""

t2 = """<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>"""

r2 = """${neg && !neg.autorizado_promesa ? `
            <p class="info-text-box warning" style="margin-top: 10px;">
              <i class="fa-solid fa-lock"></i>
              <span>Firma bloqueada: Requiere que Gerencia autorice el proceso luego de ir a notaría.</span>
            </p>
            <button type="button" class="btn btn-primary" style="margin-top: 10px; opacity: 0.5; cursor: not-allowed;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa (Bloqueado)</button>
            ` : `
            <button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>
            `}"""

t3 = """// btn-gerente-cancelar-reserva event listener
        if (role === 'gerente' && neg) {"""

r3 = """// btn-gerente-autorizar-promesa event listener
        if (role === 'gerente' && neg) {
          const btnAuth = container.querySelector('#btn-gerente-autorizar-promesa');
          if (btnAuth) {
            btnAuth.addEventListener('click', () => {
              if (!confirm('¿Confirma que se ha firmado en notaría y autoriza continuar el proceso?')) return;
              const res = APP5T_DB.autorizarPromesa(neg.id);
              if (res && !res.success) {
                APP5T_Utils.showToast(`Error: ${res.error}`, 'error');
                return;
              }
              APP5T_Utils.showToast('Promesa autorizada correctamente', 'success');
              if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            });
          }
        }

        // btn-gerente-cancelar-reserva event listener
        if (role === 'gerente' && neg) {"""

import re
content = re.sub(r"APP5T_Utils\.showToast\('Reserva registrada y aprobada de inmediato[^']+', 'success'\);",
"""APP5T_Utils.showToast('Reserva registrada y aprobada de inmediato \u23F3', 'success');
          const cData = _validateForm();
          const wPhone = '+56972154441';
          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;
          const wOpName = 'Reserva';
          const wText = encodeURIComponent(`Hola, acabo de ingresar una solicitud de ${wOpName} para el lote ${propiedad.nombre} a nombre de ${wClientName}.`);
          window.open(`https://wa.me/${wPhone}?text=${wText}`, '_blank');""", content)

content = re.sub(r"APP5T_Utils\.showToast\('Venta Directa registrada y aprobada exitosamente[^']+', 'success'\);",
"""APP5T_Utils.showToast('Venta Directa registrada y aprobada exitosamente \uD83C\uDF89', 'success');
          const wPhone = '+56972154441';
          const wClientName = cData.nombres ? cData.nombres + ' ' + cData.apellidos : cData.rut;
          const wOpName = 'Venta Directa';
          const wText = encodeURIComponent(`Hola, acabo de ingresar una solicitud de ${wOpName} para el lote ${propiedad.nombre} a nombre de ${wClientName}.`);
          window.open(`https://wa.me/${wPhone}?text=${wText}`, '_blank');""", content)

content = content.replace(t1, r1)
content = content.replace(t2, r2)
content = content.replace(t3, r3)

with open('forms.js', 'w', encoding='utf8') as f:
    f.write(content)

print("Patched with python")
