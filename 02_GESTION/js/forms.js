/**
 * =====================================================
 * FORMS.JS — APP5T_Forms
 * Formularios dinámicos para CRM & GIS — 5 Tierras
 * =====================================================
 */
const APP5T_Forms = (() => {
  'use strict';

  function _resolveActiveVendedor(vendedores) {
    if (!vendedores || vendedores.length === 0) {
      return { id: 1182247629, rut: '33.333.333-3', nombre: 'Admin (Respaldo)' }; 
    }
    const rawUser = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        const cleanRut = String(u.rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
        if (cleanRut) {
          const match = vendedores.find(v => String(v.rut || '').replace(/[^0-9kK]/g, '').toUpperCase() === cleanRut);
          if (match) return match;
        }
      } catch (e) {}
    }
    return vendedores[0]; 
  }

  /* ══════════════════════════════════════════════════════
     ENTITY SCHEMAS (field definitions for CRUD)
     ══════════════════════════════════════════════════════ */
  const ENTITY_SCHEMA = {
    vendedores: {
      pk: 'id_vendedor', label: 'Vendedor',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', required: true, validate: 'rut' },
        { key: 'nombre', label: 'Nombre', type: 'text', required: true },
        { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date' },
        { key: 'ciudad', label: 'Ciudad', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'cargo', label: 'Cargo', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ]
    },
    clientes: {
      pk: 'id_cliente', label: 'Cliente',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', required: true, validate: 'rut' },
        { key: 'nombres', label: 'Nombres', type: 'text', required: true },
        { key: 'apellidos', label: 'Apellidos', type: 'text', required: true },
        { key: 'profesion', label: 'Profesión', type: 'text' },
        { key: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
        { key: 'direccion', label: 'Dirección', type: 'text' },
        { key: 'comuna', label: 'Comuna', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'estado_civil', label: 'Estado Civil', type: 'select', options: ['Soltero', 'Casado', 'Viudo', 'Separado'] },
        { key: 'regimen_matrimonial', label: 'Régimen Matrimonial', type: 'select', options: ['Sociedad Conyugal', 'Separación de Bienes', 'Participación en los Gananciales'] },
        { key: 'canal_captacion', label: 'Canal de Captación', type: 'select', options: ['Directo', 'WhatsApp', 'Web', 'Instagram', 'Facebook'] },
        { key: 'id_vendedor', label: 'Vendedor Asignado', type: 'ref', ref: 'vendedores', refLabel: 'nombre' },
        { key: 'motivo_busqueda', label: 'Motivo de Búsqueda', type: 'select', options: ['Vivienda', 'Inversión', 'Recreacional'] },
        { key: 'notas', label: 'Notas', type: 'textarea' },
        { key: 'estado_cliente', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ]
    },
    directorio: {
      pk: 'id_director', label: 'Director',
      fields: [
        { key: 'rut', label: 'RUT', type: 'text', validate: 'rut' },
        { key: 'nombre', label: 'Nombre', type: 'text', required: true },
        { key: 'cargo', label: 'Cargo', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'tel', validate: 'telefono' },
        { key: 'email', label: 'Correo Electrónico', type: 'email', validate: 'email' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['Disponible', 'Licencia', 'Viaje', 'No Disponible'], default: 'Disponible' },
        { key: 'auth_reserva', label: 'Autoriza Reserva', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_reserva', label: 'Firma Reserva', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'auth_promesa', label: 'Autoriza Promesa', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_promesa', label: 'Firma Promesa', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'auth_venta', label: 'Autoriza Venta', type: 'select', options: ['S', 'N'], default: 'N' },
        { key: 'firma_venta', label: 'Firma Venta', type: 'select', options: ['S', 'N'], default: 'N' }
      ]
    },
    proyectos: {
      pk: 'id_proyecto', label: 'Proyecto',
      fields: [
        { key: 'nombre_proyecto', label: 'Nombre', type: 'text', required: true },
        { key: 'ubicacion', label: 'Ubicación', type: 'text' },
        { key: 'comuna', label: 'Comuna', type: 'text' },
        { key: 'url', label: 'Plano de Loteo (URL Google Drive)', type: 'text' },
        { key: 'coordenadas', label: 'Coordenadas', type: 'text' },
        { key: 'superficie', label: 'Superficie', type: 'text' },
        { key: 'rol', label: 'Rol', type: 'text' },
        { key: 'deslindes', label: 'Deslindes', type: 'textarea' },
        { key: 'infraestructura', label: 'Infraestructura', type: 'textarea' },
        { key: 'caracteristicas', label: 'Características', type: 'textarea' },
        { key: 'estado_proyecto', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo', 'En Desarrollo'], default: 'Activo' }
      ]
    },
    etapas: {
      pk: 'id_etapa', label: 'Etapa',
      fields: [
        { key: 'id_proyecto', label: 'Proyecto', type: 'ref', ref: 'proyectos', refLabel: 'nombre_proyecto', required: true },
        { key: 'nombre_etapa', label: 'Nombre Etapa', type: 'text', required: true },
        { key: 'nro_lotes', label: 'Nro. Lotes', type: 'number' },
        { key: 'superficie', label: 'Superficie', type: 'text' },
        { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date' },
        { key: 'fecha_dom', label: 'Fecha DOM', type: 'date' },
        { key: 'estado_etapa', label: 'Estado', type: 'select', options: ['Activa', 'Cerrada', 'En Desarrollo'], default: 'Activa' }
      ]
    },
    propiedades: {
      pk: 'id', label: 'Propiedad',
      fields: [
        { key: 'nombre', label: 'Nombre / ID Lote', type: 'text', required: true },
        { key: 'id_proyecto', label: 'Proyecto', type: 'ref', ref: 'proyectos', refLabel: 'nombre_proyecto', required: true },
        { key: 'id_etapa', label: 'Etapa', type: 'ref', ref: 'etapas', refLabel: 'nombre_etapa', required: true },
        { key: 'rol', label: 'Rol SII', type: 'text' },
        { key: 'superficie', label: 'Superficie (m²)', type: 'number' },
        { key: 'valor_final', label: 'Valor Venta', type: 'number' },
        { key: 'abono', label: 'Monto Reserva Estándar', type: 'number' },
        { key: 'url', label: 'Carpeta Google Drive (Expediente Digital)', type: 'url' },
        { key: 'estado', label: 'Estado', type: 'select', options: ['Disponible', 'Pendiente', 'Reservada', 'Promesada', 'Venta_Directa', 'Vendida', 'Bloqueado'], default: 'Disponible' }
      ]
    },
    documentos: {
      pk: 'id_documento', label: 'Documento',
      fields: [
        { key: 'nombre', label: 'Nombre Documento', type: 'text', required: true },
        { key: 'tipo_documento', label: 'Tipo', type: 'select', options: ['Carpeta', 'Contrato', 'Plano', 'Escritura', 'Certificado', 'Otro'], required: true },
        { key: 'url_drive', label: 'URL Google Drive', type: 'url', required: true },
        { key: 'id_proyecto', label: 'Proyecto', type: 'ref', ref: 'proyectos', refLabel: 'nombre_proyecto' },
        { key: 'id_propiedad', label: 'Lote / Propiedad', type: 'ref', ref: 'propiedades', refLabel: 'nombre' },
        { key: 'fecha_ingreso', label: 'Fecha Carga', type: 'date' }
      ]
    }
  };

  /* ══════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════ */

  /** Create a labeled form group */
  function _group(label, inputHTML, id) {
    return `<div class="form-group" ${id ? `id="group-${id}"` : ''}>
      <label for="${id || ''}">${label}</label>
      ${inputHTML}
    </div>`;
  }

  /** Run field-level validation. Returns error message or '' */
  function _validateField(value, rule) {
    if (!value && rule !== 'required') return '';
    if (rule === 'rut')      return APP5T_Utils.validarRUT(value) ? '' : 'RUT inválido (ej: 12.345.678-5)';
    if (rule === 'telefono') return APP5T_Utils.validarTelefono(value) ? '' : 'Teléfono inválido';
    if (rule === 'email')    return APP5T_Utils.validarEmail(value) ? '' : 'Email inválido';
    return '';
  }

  /** Collect and validate a dynamic form. Returns {ok, data, errors} */
  function _collectForm(formEl, schema) {
    const data = {};
    const errors = [];
    schema.fields.forEach(f => {
      const el = formEl.querySelector(`[name="${f.key}"]`);
      if (!el) return;
      let val = el.value.trim();

      // Required check
      if (f.required && !val) {
        errors.push(`${f.label} es requerido`);
        el.classList.add('input-error');
        return;
      }
      el.classList.remove('input-error');

      // Type-specific validation
      if (f.validate && val) {
        const msg = _validateField(val, f.validate);
        if (msg) { errors.push(msg); el.classList.add('input-error'); return; }
      }

      if (f.type === 'number') val = APP5T_Utils.sanitizeNumber(val);
      data[f.key] = val;
    });
    return { ok: errors.length === 0, data, errors };
  }

  /** Build an HTML <select> from reference table */
  function _refSelect(name, refTable, refLabel, selected) {
    const items = APP5T_DB.getAll(refTable) || [];
    let opts = `<option value="">— Seleccionar —</option>`;
    items.forEach(r => {
      const id = r[ENTITY_SCHEMA[refTable]?.pk] || r.id;
      const label = r[refLabel] || r.nombre || id;
      const sel = String(id) === String(selected) ? 'selected' : '';
      opts += `<option value="${id}" ${sel}>${label}</option>`;
    });
    return `<select name="${name}" class="form-control">${opts}</select>`;
  }

  function generarHTMLComprobanteReserva(propiedad, neg, cliente, proyectoNom, precioVentaFmt, dateStr) {
    const clienteNom = cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—';
    const clienteRut = cliente ? cliente.rut : '—';
    const negIdStr = neg ? String(neg.id).padStart(2, '0') : '00';
    const pieFmt = neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '—';
    const metodoPago = neg ? (neg.metodo_pago || 'Transferencia Bancaria') : '—';
    const cuotasStr = neg ? (neg.cantidad_cuotas || 'Sin cuotas') : '—';

    return `
      <div class="pdf-page" style="background: #ffffff; color: #1e293b; font-family: 'Inter', Arial, sans-serif; box-sizing: border-box; padding: 40px; min-height: 600px; display: flex; flex-direction: column; gap: 16px; position: relative;">
        <div class="pdf-page-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 15px;">
          <div class="pdf-page-header-logo" style="display: flex; align-items: center; gap: 8px;">
            <img src="../04_RECURSOS/logo5t.png?v=1.1.9" alt="5T" style="height: 32px;">
            <strong style="font-size: 1.1rem; color: #2c3e50;">5 TIERRAS</strong>
          </div>
          <div class="pdf-page-header-meta" style="text-align: right;">
            <div class="pdf-page-header-meta-title" style="font-size: 0.65rem; color: #7f8c8d; font-weight: bold; letter-spacing: 0.5px;">DOCUMENTO DIGITAL</div>
            <div class="pdf-page-header-meta-subtitle" style="font-size: 0.75rem; font-weight: bold; color: #2c3e50;">Cód: PROC-Venta-${negIdStr}</div>
          </div>
        </div>
        
        <div class="pdf-watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 4.5rem; color: rgba(0,0,0,0.025); font-weight: 900; letter-spacing: 5px; pointer-events: none; white-space: nowrap; user-select: none;">
          5 TIERRAS
        </div>
        
        <div class="pdf-page-title-container" style="text-align: center; margin-bottom: 10px;">
          <h2 class="pdf-page-title" style="margin: 0; color: #e74c3c; font-size: 1.15rem; font-weight: 700; letter-spacing: 0.5px;">COMPROBANTE DE RESERVA DE PROPIEDAD</h2>
          <span class="pdf-page-subtitle" style="font-size: 0.68rem; color: #7f8c8d;">Emitido el ${dateStr}</span>
        </div>
        
        <div class="pdf-section-box" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 5px;">
          <div class="pdf-grid-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.76rem;">
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">LOTE INDIVIDUADO:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">Lote ${propiedad.nombre}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">PROYECTO:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${proyectoNom}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">CLIENTE:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${clienteNom}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">RUT CLIENTE:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${clienteRut}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">SUPERFICIE:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${APP5T_Utils.formatSuperficie(propiedad.superficie)}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">ROL DE AVALÚO:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${propiedad.rol || 'En Trámite'}</span></div>
          </div>
        </div>
        
        <p class="pdf-text" style="font-size: 0.76rem; color: #334155; line-height: 1.5; margin: 0; text-align: justify;">Este documento certifica la recepción de la solicitud de reserva y abono de garantía para la parcela singularizada precedentemente.</p>
        
        <div class="pdf-section-box" style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 5px;">
          <h4 class="pdf-section-title" style="margin: 0 0 6px 0; color: #2c3e50; font-size: 0.78rem; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">Resumen de la Transacción</h4>
          <div class="pdf-grid-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.76rem;">
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">PRECIO FINAL ACORDADO:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${precioVentaFmt}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">MONTO RESERVA (PIE):</strong> <span class="pdf-value bold green" style="color: #10b981; font-weight: bold;">${pieFmt}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">MÉTODO DE PAGO:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${metodoPago}</span></div>
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">CANTIDAD CUOTAS:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${cuotasStr}</span></div>
          </div>
        </div>
        
        <p class="pdf-note" style="font-size: 0.7rem; color: #64748b; font-style: italic; line-height: 1.4; margin: 0; text-align: justify;">Nota: Este comprobante es digital y cuenta con firma electrónica del Directorio de Inmobiliaria 5 Tierras. Se inicia el período de 30 días para revisión legal y confección de la Promesa de Compraventa.</p>
        
        <div class="pdf-signature-area" style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; font-size: 0.7rem;">
          <div class="pdf-signature-block" style="text-align: center; width: 45%;">
            <div class="pdf-signature-line" style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 4px; display: flex; align-items: flex-end; justify-content: center;">
              <span class="pdf-signature-text sign-director" style="font-family: 'Dancing Script', cursive; font-size: 1rem; color: #1e3a8a;">Daniel Gajardo P.</span>
            </div>
            <strong class="pdf-signature-title" style="display: block; color: #334155; font-size: 0.68rem;">DIRECTOR EJECUTIVO</strong>
            <div class="pdf-signature-sub" style="color: #64748b; font-size: 0.62rem;">5 Tierras S.A.</div>
          </div>
          <div class="pdf-signature-block" style="text-align: center; width: 45%;">
            <div class="pdf-signature-line" style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 4px; display: flex; align-items: flex-end; justify-content: center;">
              <span class="pdf-signature-text sign-client" style="font-family: 'Dancing Script', cursive; font-size: 1rem; color: #1e3a8a;">${clienteNom}</span>
            </div>
            <strong class="pdf-signature-title" style="display: block; color: #334155; font-size: 0.68rem;">CLIENTE COMPRADOR</strong>
            <div class="pdf-signature-sub" style="color: #64748b; font-size: 0.62rem;">RUT: ${clienteRut}</div>
          </div>
        </div>
      </div>
    `;
  }

  function _showSimulatedPDF(title, type, propiedad, neg, cliente, proyectoNom, precioVentaFmt) {
    const clienteNom = cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—';
    const clienteRut = cliente ? cliente.rut : '—';
    const dateStr = APP5T_Utils.fechaHoy();
    
    let docTitle = title;
    let docHeader = '';
    let docBodyHTML = '';
    
    if (type === 'promesa') {
      docHeader = 'CONTRATO DE PROMESA DE COMPRAVENTA';
      docBodyHTML = `
        <p class="pdf-text justify">
          En Chillán, a ${dateStr}, entre <strong>Inmobiliaria 5 Tierras S.A.</strong>, representada por don <strong>DANIEL GAJARDO PEREIRA</strong>, en adelante "La Promitente Vendedora", y don(a) <strong>${clienteNom}</strong>, RUT <strong>${clienteRut}</strong>, en adelante "El Promitente Comprador", se ha convenido el siguiente contrato de promesa de compraventa de bien raíz:
        </p>
        
        <p class="pdf-text justify">
          <strong>PRIMERO:</strong> La Promitente Vendedora es dueña exclusiva de la parcela identificada como <strong>Lote ${propiedad.nombre}</strong> del proyecto <strong>${proyectoNom}</strong>, ubicada en la comuna de Chillán, Región de Ñuble, cuya superficie es de 5.000 metros cuadrados aproximados.
        </p>
        
        <p class="pdf-text justify">
          <strong>SEGUNDO:</strong> Por el presente instrumento, las partes se obligan a celebrar contrato de compraventa definitiva de la propiedad descrita en la cláusula anterior. La compraventa definitiva se firmará una vez cumplidas las condiciones comerciales e inscripciones registrales correspondientes.
        </p>
        
        <p class="pdf-text justify">
          <strong>TERCERO:</strong> El precio de la venta definitiva será la suma de <strong>${precioVentaFmt}</strong>, que se cancelará de la siguiente forma: a) Un abono inicial de reserva de <strong>${APP5T_Utils.formatMoneda(neg ? neg.pie : 0)}</strong>, ya pagado y verificado; b) El saldo restante de conformidad con el plan de pagos convenido.
        </p>
        
        <p class="pdf-text justify">
          <strong>CUARTO:</strong> Las partes fijan como plazo estimado para la suscripción de la escritura pública de compraventa definitiva en la Notaría Quinta de Chillán la fecha indicada en la ficha comercial de la negociación.
        </p>
      `;
    } else if (type === 'escritura') {
      docHeader = 'ESCRITURA PÚBLICA DE COMPRAVENTA DEFINITIVA';
      docBodyHTML = `
        <p class="pdf-text justify">
          En Chillán, a ${dateStr}, ante mí, Notario Público de la Quinta Notaría de Chillán, comparecen: <strong>Inmobiliaria 5 Tierras S.A.</strong>, representada por don <strong>DANIEL GAJARDO PEREIRA</strong>, en adelante "La Vendedora", y don(a) <strong>${clienteNom}</strong>, RUT <strong>${clienteRut}</strong>, en adelante "El Comprador". Los comparecientes mayores de edad, quienes acreditan su identidad y exponen: Que han convenido celebrar el siguiente contrato de compraventa definitiva de bien raíz:
        </p>
        
        <p class="pdf-text justify">
          <strong>PRIMERO:</strong> La Vendedora vende, cede y transfiere a título de compraventa definitiva al Comprador, quien compra y adquiere para sí, el predio rústico denominado <strong>Lote ${propiedad.nombre}</strong> del proyecto <strong>${proyectoNom}</strong>.
        </p>
        
        <p class="pdf-text justify">
          <strong>SEGUNDO:</strong> El precio de la venta es la suma de <strong>${precioVentaFmt}</strong>, el cual se encuentra completamente pagado por el Comprador y recibido a entera satisfacción de la Vendedora, declarándose extinguida toda obligación pendiente por este concepto.
        </p>
        
        <p class="pdf-text justify">
          <strong>TERCERO:</strong> La propiedad se vende como cuerpo cierto, libre de todo gravamen, prohibición o embargo, respondiendo la Vendedora por el saneamiento de evicción conforme a derecho.
        </p>
        
        <p class="pdf-text justify">
          <strong>CUARTO:</strong> Se faculta al portador de copia autorizada de la presente escritura para requerir al Conservador de Bienes Raíces respectivo las inscripciones, subinscripciones y anotaciones que procedan.
        </p>
      `;
    }
    
    let pageHTML = '';
    if (type === 'reserva') {
      pageHTML = generarHTMLComprobanteReserva(propiedad, neg, cliente, proyectoNom, precioVentaFmt, dateStr);
    } else {
      pageHTML = `
        <div class="pdf-page">
          <div class="pdf-page-header">
            <div class="pdf-page-header-logo">
              <img src="../04_RECURSOS/logo5t.png?v=1.1.9" alt="5T">
              <strong>5 TIERRAS</strong>
            </div>
            <div class="pdf-page-header-meta">
              <div class="pdf-page-header-meta-title">DOCUMENTO DIGITAL</div>
              <div class="pdf-page-header-meta-subtitle">Cód: PROC-Venta-${neg ? neg.id.toString().padStart(2, '0') : '00'}</div>
            </div>
          </div>
          
          <div class="pdf-watermark">
            5 TIERRAS
          </div>
          
          <div class="pdf-page-title-container">
            <h2 class="pdf-page-title">${docHeader}</h2>
            <span class="pdf-page-subtitle">Emitido el ${dateStr}</span>
          </div>
          
          ${docBodyHTML}
          
          <div class="pdf-signature-area">
            <div class="pdf-signature-block">
              <div class="pdf-signature-line">
                <span class="pdf-signature-text sign-director">Daniel Gajardo P.</span>
              </div>
              <strong class="pdf-signature-title">DIRECTOR EJECUTIVO</strong>
              <div class="pdf-signature-sub">5 Tierras S.A.</div>
            </div>
            <div class="pdf-signature-block">
              <div class="pdf-signature-line">
                <span class="pdf-signature-text sign-client">${clienteNom}</span>
              </div>
              <strong class="pdf-signature-title">CLIENTE COMPRADOR</strong>
              <div class="pdf-signature-sub">RUT: ${clienteRut}</div>
            </div>
          </div>
        </div>
      `;
    }
    
    const viewerHTML = `
      <div class="simulated-pdf-viewer" data-pdf-type="${type}" data-pdf-lote="${propiedad.nombre||''}" data-pdf-proyecto="${proyectoNom||''}" data-pdf-superficie="${propiedad.superficie ? APP5T_Utils.formatSuperficie(propiedad.superficie) : ''}" data-pdf-rol="${propiedad.rol||'En Tramite'}" data-pdf-cliente="${clienteNom}" data-pdf-rut="${clienteRut}" data-pdf-precio="${precioVentaFmt||''}" data-pdf-pie="${neg?APP5T_Utils.formatMoneda(neg.pie||0):''}" data-pdf-metodo="${neg?(neg.metodo_pago||'Transferencia Bancaria'):''}" data-pdf-cuotas="${neg?String(neg.cantidad_cuotas||'Sin cuotas'):''}" data-pdf-negid="${neg?String(neg.id).padStart(2,'0'):'00'}" data-pdf-date="${dateStr}" data-pdf-header="${docHeader}">
        <div class="pdf-toolbar">
          <div class="pdf-toolbar-title">
            <i class="fa-solid fa-file-pdf"></i>
            <span>${docTitle}</span>
          </div>
          <div class="pdf-toolbar-actions">
            <button onclick="APP5T_Utils.showToast('Impresora no conectada', 'warning')" title="Imprimir"><i class="fa-solid fa-print"></i></button>
            <button onclick="APP5T_Forms.descargarPDFSimulado(this, '${docTitle}')" title="Descargar"><i class="fa-solid fa-download"></i></button>
          </div>
        </div>
        
        <div class="pdf-canvas-area">
          ${pageHTML}
        </div>
      </div>
    `;
    
    if (window.APP5T && typeof window.APP5T.openModal === 'function') {
      window.APP5T.openModal(docTitle, viewerHTML);
    } else {
      alert("Error: No se pudo abrir la ventana emergente.");
    }
  }


  const LOGO_5T_BASE64 = "data:image/png;base64,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";
  if (typeof window !== 'undefined') window.APP5T_LOGO_BASE64 = LOGO_5T_BASE64;

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
      var cliNom = cliente ? (cliente.nombres + ' ' + (cliente.apellidos || '')).trim() : 'Sin cliente asignado';
      var cliRut = cliente ? (cliente.rut || 'No informado') : 'No informado';
      var cliTel = cliente ? (cliente.telefono || 'No informado') : 'No informado';
      var cliEmail = cliente ? (cliente.email || 'No informado') : 'No informado';
      var cliDireccion = cliente ? (cliente.direccion || 'Chillan / Nuble') : 'Chillan / Nuble';
      var cliCivil = cliente ? (cliente.estado_civil || 'Soltero/a') : 'No especificado';
      var cliProfesion = cliente ? (cliente.profesion || 'Particular') : 'Particular';
      var precioTotal = (neg && neg.precio_acordado) ? neg.precio_acordado : (prop.valor_final || 0);
      var precioFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(precioTotal) : ('$' + Number(precioTotal).toLocaleString('es-CL'));
      var pieVal = (neg && neg.pie) ? neg.pie : (prop.abono || 0);
      var pieFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(pieVal) : ('$' + Number(pieVal).toLocaleString('es-CL'));
      var saldoVal = Math.max(0, precioTotal - pieVal);
      var saldoFmt = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(saldoVal) : ('$' + Number(saldoVal).toLocaleString('es-CL'));
      var cuotasCant = (neg && neg.cantidad_cuotas) ? String(neg.cantidad_cuotas) : 'Sin cuotas (Contado)';
      var metodoPago = (neg && neg.metodo_pago) ? neg.metodo_pago : 'Transferencia Bancaria';
      var notaria = 'Notaria Quinta de Chillan';
      var JsPDF = null;
      if (window.jspdf && window.jspdf.jsPDF) JsPDF = window.jspdf.jsPDF;
      else if (window.jsPDF) JsPDF = window.jsPDF;
      if (!JsPDF && window._jsPDFCtor) JsPDF = window._jsPDFCtor;
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
      try {
        if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {
          doc.addImage(LOGO_5T_BASE64, 'PNG', mg, y - 2, 22, 22);
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
      var tituloDoc = isEscritura ? 'MINUTA DE ANTECEDENTES - ESCRITURA DEFINITIVA' : 'FICHA DE ANTECEDENTES - PROMESA DE COMPRAVENTA';
      _pdfRect(doc, mg, y, cw, 9, '#f1f5f9', '#cbd5e1');
      _pdfTxt(doc, tituloDoc, W / 2, y + 6.2, {bold:true, size:10.5, color:'#1e3a8a', align:'center'});
      y += 13;
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
      _pdfRect(doc, mg, y, cw, 22, '#f8fafc', '#e2e8f0');
      _pdfTxt(doc, 'INSTRUCCIONES PARA LA REDACCION:', mg + 4, y + 4.5, {bold:true, size:7.2, color:'#1e3a8a'});
      var instText = 'Se solicita a la asesoria legal confeccionar el borrador correspondiente conforme a las condiciones precedentes y remitirlo a Gerencia para revision previa a la firma en Notaria. Los antecedentes de titulos de dominio se encuentran archivados en el repositorio documental corporativo de 5 Tierras.';
      _pdfWrap(doc, instText, mg + 4, y + 8.5, cw - 8, 4, {size:7.2, color:'#334155'});
      y += 27;
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
      var cleanProy = proyNom.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      var cleanLote = loteNom.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
      var cleanCli = cliNom.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '');
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

  // ── jsPDF helpers ────────────────────────────────────────────────────────
  function _hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
    return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : {r:0,g:0,b:0};
  }
  function _pdfLine(doc, x1, y1, x2, y2, hex) {
    const c = _hexToRgb(hex || '#94a3b8'); doc.setDrawColor(c.r,c.g,c.b); doc.line(x1,y1,x2,y2);
  }
  function _pdfRect(doc, x, y, w, h, fHex, sHex) {
    const f=_hexToRgb(fHex||'#f8fafc'), s=_hexToRgb(sHex||'#e2e8f0');
    doc.setFillColor(f.r,f.g,f.b); doc.setDrawColor(s.r,s.g,s.b);
    doc.roundedRect(x,y,w,h,2,2,'FD');
  }
  function _pdfTxt(doc, text, x, y, opts) {
    const o=opts||{}, c=_hexToRgb(o.color||'#1e293b');
    doc.setFont('helvetica', o.bold?'bold':'normal');
    doc.setFontSize(o.size||9); doc.setTextColor(c.r,c.g,c.b);
    doc.text(String(text||''), x, y, {align: o.align||'left', maxWidth: o.maxWidth});
  }
  function _pdfWrap(doc, text, x, y, maxW, lh, opts) {
    const lines = doc.splitTextToSize(String(text||''), maxW);
    lines.forEach((ln,i) => _pdfTxt(doc, ln, x, y+i*lh, opts));
    return y + lines.length * lh;
  }

  function descargarPDFSimulado(btn, docTitle) {
    const viewer = btn.closest('.simulated-pdf-viewer');
    if (!viewer) return;

    APP5T_Utils.showToast('Generando PDF...', 'info');

    const cleanTitle = (docTitle||'Documento').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9-_]/g,'_');
    const filename   = cleanTitle + '_' + new Date().toISOString().split('T')[0] + '.pdf';

    // Read data attributes set by _showSimulatedPDF
    const d = viewer.dataset;
    const hasPayload = !!d.pdfType;

    if (hasPayload) {
      try {
        _generarPDFConJsPDF({
          type:       d.pdfType,
          docHeader:  d.pdfHeader  || '',
          dateStr:    d.pdfDate    || '',
          lote:       d.pdfLote    || '',
          proyecto:   d.pdfProyecto|| '',
          superficie: d.pdfSuperficie || '',
          rol:        d.pdfRol     || 'En Tramite',
          clienteNom: d.pdfCliente || '',
          clienteRut: d.pdfRut     || '',
          precio:     d.pdfPrecio  || '',
          pie:        d.pdfPie     || '',
          metodoPago: d.pdfMetodo  || '',
          cuotas:     d.pdfCuotas  || '',
          negId:      d.pdfNegid   || '00',
          bodyText:   '',
        }, filename);
        return;
      } catch(e) {
        console.error('jsPDF failed, falling back to html2canvas:', e);
      }
    }

    // ── Fallback: html2canvas (for promesa/escritura or if jsPDF fails) ──────
    const page = viewer.querySelector('.pdf-page');
    if (!page) { alert('No se pudo generar el PDF.'); return; }
    if (typeof html2pdf === 'undefined') { alert('Libreria pdf no cargada.'); return; }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;top:0;left:0;z-index:999999;background:#ffffff;width:794px;padding:0;margin:0;box-sizing:border-box;';
    wrapper.innerHTML = page.outerHTML;
    const inner = wrapper.querySelector('.pdf-page');
    if (inner) inner.style.cssText = 'background:#ffffff;color:#1e293b;width:100%;box-sizing:border-box;display:block;opacity:1;filter:none;transform:none;padding:40px;min-height:600px;';
    document.body.appendChild(wrapper);

    const imgs = Array.from(wrapper.querySelectorAll('img'));
    Promise.all(imgs.map(img => new Promise(res => {
      if (img.complete) { res(); return; }
      img.onload = res; img.onerror = res;
    }))).then(() => {
      setTimeout(() => {
        html2pdf().set({
          margin: 0.3, filename: filename,
          image: { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        }).from(wrapper).save().then(() => {
          if (wrapper.parentNode) document.body.removeChild(wrapper);
          APP5T_Utils.showToast('PDF descargado con exito.', 'success');
        }).catch(err => {
          if (wrapper.parentNode) document.body.removeChild(wrapper);
          alert('Error: ' + err.message);
        });
      }, 300);
    });
  }

  function _generarPDFConJsPDF(p, filename) {
    // Obtain jsPDF constructor
    let JsPDF = null;
    if (window.jspdf && window.jspdf.jsPDF)  JsPDF = window.jspdf.jsPDF;
    else if (window.jsPDF)                    JsPDF = window.jsPDF;
    if (!JsPDF) {
      // Try to extract from html2pdf bundle
      if (typeof html2pdf !== 'undefined') {
        try {
          const w = document.createElement('div');
          document.body.appendChild(w);
          html2pdf().set({ jsPDF: { unit:'mm', format:'a4' } }).from(w).get('jsPDF').then(doc => {
            document.body.removeChild(w);
            if (doc && doc.constructor) {
              window._jsPDFCtor = doc.constructor;
            }
          }).catch(() => document.body.removeChild(w));
        } catch(e) {}
      }
      if (window._jsPDFCtor) JsPDF = window._jsPDFCtor;
      else { alert('jsPDF no disponible. Intente de nuevo en unos segundos.'); return; }
    }

    const doc = new JsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const W = 215.9, mg = 18, cw = W - mg * 2;
    let y = mg;

    // Header con Logo Corporativo 5 Tierras
    try {
      if (typeof LOGO_5T_BASE64 !== 'undefined' && LOGO_5T_BASE64) {
        doc.addImage(LOGO_5T_BASE64, 'PNG', mg, y - 1, 14, 14);
      }
    } catch(errLogo) {}
    const hc = _hexToRgb('#2c3e50');
    doc.setFillColor(hc.r, hc.g, hc.b);
    doc.rect(mg + 17, y, cw - 17, 10, 'F');
    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg + 21, y+6.8, {bold:true, size:9, color:'#ffffff'});
    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-50, y+6.8, {size:8, color:'#ffffff'});
    y += 14;

    // Title
    const ttl = p.type === 'reserva' ? 'COMPROBANTE DE RESERVA DE PROPIEDAD' : (p.docHeader || 'DOCUMENTO');
    _pdfTxt(doc, ttl, W/2, y, {bold:true, size:13, color:'#c0392b', align:'center'});
    y += 5;
    _pdfTxt(doc, 'Emitido el '+p.dateStr, W/2, y, {size:8, color:'#7f8c8d', align:'center'});
    y += 8;
    _pdfLine(doc, mg, y, mg+cw, y, '#e2e8f0');
    y += 6;

    if (p.type === 'reserva') {
      const col2 = mg + cw/2 + 2;

      // Info grid box
      _pdfRect(doc, mg, y, cw, 42, '#f8fafc', '#e2e8f0');
      const rows = [
        ['LOTE:',       'Lote '+p.lote,  'PROYECTO:',    p.proyecto  ],
        ['CLIENTE:',     p.clienteNom,    'RUT:',         p.clienteRut],
        ['SUPERFICIE:',  p.superficie,    'ROL AVALUO:',  p.rol       ],
        ['FECHA:',       p.dateStr,       'CODIGO:',      'PROC-Venta-'+p.negId],
      ];
      let iy = y + 5;
      rows.forEach(([l1,v1,l2,v2]) => {
        _pdfTxt(doc, l1, mg+3,  iy,   {bold:true, size:7,   color:'#64748b'});
        _pdfTxt(doc, v1, mg+3,  iy+4, {bold:true, size:8.5, color:'#0f172a'});
        _pdfTxt(doc, l2, col2,  iy,   {bold:true, size:7,   color:'#64748b'});
        _pdfTxt(doc, v2, col2,  iy+4, {bold:true, size:8.5, color:'#0f172a'});
        iy += 10;
      });
      y += 46;

      // Body text
      const body = 'Este documento certifica la recepcion de la solicitud de reserva y abono de garantia para la parcela singularizada precedentemente.';
      y = _pdfWrap(doc, body, mg, y, cw, 5, {size:8.5, color:'#334155'}) + 6;

      // Transaction box
      _pdfRect(doc, mg, y, cw, 32, '#f8fafc', '#e2e8f0');
      _pdfTxt(doc, 'RESUMEN DE LA TRANSACCION', mg+4, y+6, {bold:true, size:8, color:'#2c3e50'});
      _pdfLine(doc, mg+2, y+8, mg+cw-2, y+8, '#e2e8f0');
      const txRows = [
        ['PRECIO ACORDADO:', p.precio,     'MONTO RESERVA:', p.pie     ],
        ['METODO DE PAGO:',  p.metodoPago, 'CUOTAS:',        p.cuotas  ],
      ];
      let ty = y + 13;
      txRows.forEach(([l1,v1,l2,v2]) => {
        _pdfTxt(doc, l1, mg+3,  ty,     {bold:true, size:7, color:'#64748b'});
        _pdfTxt(doc, v1, mg+3,  ty+4.5, {bold:true, size:9, color:'#0f172a'});
        _pdfTxt(doc, l2, col2,  ty,     {bold:true, size:7, color:'#64748b'});
        _pdfTxt(doc, v2, col2,  ty+4.5, {bold:true, size:9, color:'#10b981'});
        ty += 11;
      });
      y += 36;

      // Note
      const note = 'Nota: Este comprobante digital tiene firma electronica del Directorio. Se inician 30 dias para confeccion de la Promesa de Compraventa.';
      y = _pdfWrap(doc, note, mg, y, cw, 4.5, {size:7.5, color:'#64748b'}) + 8;
    } else {
      y = _pdfWrap(doc, p.bodyText||'', mg, y, cw, 5.5, {size:9, color:'#334155'}) + 10;
    }

    // Signatures
    _pdfLine(doc, mg, y, mg+cw, y, '#e2e8f0');
    y += 4;
    const sigW = cw/2 - 8, sig2x = mg+cw/2+8;

    _pdfTxt(doc, 'Daniel Gajardo P.',    mg+sigW/2,    y+12, {size:11, color:'#1e3a8a', align:'center'});
    _pdfLine(doc, mg, y+14, mg+sigW, y+14, '#94a3b8');
    _pdfTxt(doc, 'DIRECTOR EJECUTIVO',   mg+sigW/2,    y+19, {bold:true, size:7.5, color:'#334155', align:'center'});
    _pdfTxt(doc, '5 Tierras S.A.',       mg+sigW/2,    y+23, {size:7,   color:'#64748b', align:'center'});

    _pdfTxt(doc, p.clienteNom,           sig2x+sigW/2, y+12, {size:10, color:'#1e3a8a', align:'center'});
    _pdfLine(doc, sig2x, y+14, sig2x+sigW, y+14, '#94a3b8');
    _pdfTxt(doc, 'CLIENTE COMPRADOR',    sig2x+sigW/2, y+19, {bold:true, size:7.5, color:'#334155', align:'center'});
    _pdfTxt(doc, 'RUT: '+p.clienteRut,  sig2x+sigW/2, y+23, {size:7,   color:'#64748b', align:'center'});

    y += 32;
    _pdfLine(doc, mg, y, mg+cw, y, '#e2e8f0');
    y += 4;
    _pdfTxt(doc, '5 Tierras S.A.  |  Chillan, Region de Nuble  |  Documento generado digitalmente', W/2, y, {size:7, color:'#94a3b8', align:'center'});

    doc.save(filename);
    APP5T_Utils.showToast('PDF descargado con exito.', 'success');
  }

    /* ── FICHA AUDITORIA ADMIN ──────────────────────── */
  function _renderFichaAuditoriaAdmin(container, propiedad, neg) {
    const estado = (propiedad.estado || '').trim();
    let btnVerExpediente = '';
    let detallesAuditoria = '';

    const precioFmt = APP5T_Utils.formatMoneda(propiedad.valor_final || 0);
    const abonoFmt = APP5T_Utils.formatMoneda(propiedad.abono || 0);

    // Fechas
    const fIngreso = propiedad.fecha_ingreso || '—';
    const fReserva = propiedad.fecha_reserva || '—';

    // Días de estancamiento / reserva
    let diasEstancamiento = 0;
    if (fReserva !== '—') {
      const parts = fReserva.split('/');
      if (parts.length === 3) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(d)) {
          const hoy = new Date();
          const diffTime = Math.abs(hoy - d);
          diasEstancamiento = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      }
    }

    let btnCtaCte = '';
    let btnEscritura = '';

    if (neg) {
      const cli = APP5T_DB.getById('clientes', neg.id_cliente);
      const vend = APP5T_DB.getById('vendedores', neg.id_vendedor);
      const vendNom = vend ? vend.nombre : '—';
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '—';
      const cliRut = cli ? (cli.rut || '—') : '—';
      
      const isVendida = estado === 'Vendida' || estado === 'Escriturada';
      
      const extraRow = isVendida
        ? `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-circle-check" style="margin-right: 4px; color: var(--accent-green);"></i> Estado</span>
            <strong style="color: var(--accent-green);">100% Pagado (Cerrado)</strong>
          </div>
        `
        : `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-calendar-day" style="margin-right: 4px;"></i> Días Reservado</span>
            <strong style="color: ${diasEstancamiento > 15 ? 'var(--accent-red)' : 'var(--accent-orange)'};">${diasEstancamiento} días</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-hand-holding-dollar" style="margin-right: 4px;"></i> Monto Abono</span>
            <strong style="color: var(--accent-green);">${abonoFmt}</strong>
          </div>
        `;

      detallesAuditoria = `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-user" style="margin-right: 4px;"></i> Cliente</span>
            <strong style="color: var(--text-white); text-align: right;">${cliNom}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-id-card" style="margin-right: 4px;"></i> RUT</span>
            <strong style="color: var(--text-white);">${cliRut}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 6px; font-size: 0.8rem;">
            <span style="color: var(--text-dim);"><i class="fa-solid fa-user-tie" style="margin-right: 4px;"></i> Vendedor</span>
            <strong style="color: var(--text-white);">${vendNom}</strong>
          </div>
          ${extraRow}
        </div>
      `;

      if (estado !== 'Vendida' && estado !== 'Escriturada') {
        btnVerExpediente = `
          <button type="button" class="btn btn-primary" onclick="if(window.APP5T) { window.APP5T.closeModal(true); window.APP5T.switchTab('mesa'); }" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: var(--accent-blue); border-color: var(--accent-blue); font-size: 0.82rem; padding: 8px 12px;">
            <i class="fa-solid fa-list-check"></i> Ver en Mesa Documental
          </button>
        `;
      }
      
      if (estado === 'Promesada' || estado === 'Venta_Directa') {
        btnCtaCte = `
          <button type="button" class="btn btn-info" onclick="if(window.APP5T && window.APP5T.goToCuentaCorriente) window.APP5T.goToCuentaCorriente('${neg.id_cliente}', '${propiedad.id}');" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: var(--accent-purple); border-color: var(--accent-purple); color: white; font-size: 0.82rem; padding: 8px 12px;">
            <i class="fa-solid fa-file-invoice-dollar"></i> Cuenta Corriente
          </button>
        `;
      }
      
      if (estado === 'Vendida' || estado === 'Escriturada') {
        btnEscritura = `
          <button type="button" id="btn-ver-escritura" class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; border-color: var(--accent-green); color: var(--accent-green); font-size: 0.82rem; padding: 8px 12px;">
            <i class="fa-solid fa-file-signature"></i> Ver Copia Escritura
          </button>
        `;
      }
    } else {
      detallesAuditoria = `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 10px; text-align: center; font-size: 0.85rem; color: var(--text-dim); margin-bottom: 12px;">
          <i class="fa-solid fa-circle-info" style="color: var(--accent-blue); margin-right: 4px;"></i>
          Este lote está <strong>${estado}</strong>. No hay negociación activa registrada.
        </div>
      `;
    }

    // plano
    const etapa = propiedad.id_etapa ? APP5T_DB.getById('etapas', propiedad.id_etapa) : null;
    const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
    let btnPlano = '';
    if (proy && proy.url) {
      btnPlano = `
        <button type="button" class="btn btn-success" onclick="window.open('${proy.url}', '_blank')" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background-color: var(--accent-green); border-color: var(--accent-green); color: white; font-size: 0.82rem; padding: 8px 12px; font-weight: 600; cursor: pointer;">
          <i class="fa-solid fa-map"></i> Ver Plano del Loteo
        </button>
      `;
    }

    const accentColor = (estado === 'Vendida' || estado === 'Escriturada') ? 'var(--accent-green, #2ecc71)' : 'var(--accent-orange, #f39c12)';
    const headerIcon = (estado === 'Vendida' || estado === 'Escriturada') ? 'fa-solid fa-circle-check' : 'fa-solid fa-shield-halved';
    const headerColor = (estado === 'Vendida' || estado === 'Escriturada') ? 'var(--accent-green)' : 'var(--accent-orange)';
    const headerTitle = (estado === 'Vendida' || estado === 'Escriturada') ? 'Detalles de Venta' : 'Resumen Administrativo';

    const html = `
      <div class="lote-ficha" style="padding: 12px; border-left: 4px solid ${accentColor}; margin-bottom: 15px; background: rgba(255,255,255,0.01); border-radius: 0 8px 8px 0;">
        <div class="lote-ficha-header" style="margin-bottom: 10px; display: flex; align-items: center; gap: 6px; padding-bottom: 6px;">
          <i class="${headerIcon}" style="color: ${headerColor}; font-size: 1rem;"></i>
          <h4 style="margin: 0; color: var(--text-white); font-size: 0.9rem; font-weight: 600;">${headerTitle}</h4>
        </div>
        
        ${detallesAuditoria}

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${btnPlano}
          ${btnVerExpediente}
          ${btnCtaCte}
          ${btnEscritura}
        </div>
      </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    const adminCardEl = tempDiv.firstElementChild;
    container.insertBefore(adminCardEl, container.firstChild);

    // Bind click for Escritura button if it exists
    const btnVerEscrituraEl = container.querySelector('#btn-ver-escritura');
    if (btnVerEscrituraEl) {
      btnVerEscrituraEl.addEventListener('click', () => {
        let urlReal = null;
        if (propiedad.url && propiedad.url.trim() !== '') {
          urlReal = propiedad.url;
        } else if (typeof APP5T_DB !== 'undefined') {
          const docsLote = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];
          const doc = docsLote.find(d => 
            String(d.nombre || '').toLowerCase().includes('escritura') || 
            String(d.tipo_documento || '').toLowerCase().includes('escritura')
          );
          if (doc && doc.url_drive) urlReal = doc.url_drive;
        }
        
        if (urlReal) {
          window.open(urlReal, '_blank');
        } else {
          const etapa = propiedad.id_etapa ? APP5T_DB.getById('etapas', propiedad.id_etapa) : null;
          const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
          const proyectoNom = proy ? (proy.nombre_proyecto || proy.nombre || '') : '—';
          const precioVentaFmt = APP5T_Utils.formatMoneda(neg ? neg.valor_final : (propiedad.valor_final || 0));
          const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
          
          _showSimulatedPDF(
            `Escritura Definitiva — Lote ${propiedad.nombre}`, 
            'escritura', 
            propiedad, 
            neg, 
            cli, 
            proyectoNom, 
            precioVentaFmt
          );
        }
      });
    }
  }
  
  function _renderFichaGerencial(container, propiedad, neg) {
    if (!neg) {
      container.innerHTML = `
        <div class="lote-ficha accent-primary">
          <div class="lote-ficha-header">
            <i class="fa-solid fa-circle-info"></i>
            <h4>Ficha Gerencial</h4>
          </div>
          <p class="text-dim" style="font-size:0.82rem;">No se encontraron negociaciones activas para este lote.</p>
        </div>`;
      return;
    }

    const cliente = APP5T_DB.getById('clientes', neg.id_cliente);
    const clienteNom = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : '—';
    const clienteRut = cliente ? (cliente.rut || '—') : '—';

    const vendedor = APP5T_DB.getById('vendedores', neg.id_vendedor);
    const vendedorNom = vendedor ? vendedor.nombre : '—';

    const proy = APP5T_DB.getById('proyectos', propiedad.id_proyecto);
    const proyectoNom = proy ? (proy.nombre_proyecto || proy.nombre || '') : '—';

    const precioVenta = neg.valor_final || propiedad.valor_final || 0;
    const precioVentaFmt = APP5T_Utils.formatMoneda(precioVenta);

    const abono = neg.pie || neg.monto_reserva || 0;
    const abonoFmt = APP5T_Utils.formatMoneda(abono);

    const saldo = Math.max(0, precioVenta - abono);
    const saldoFmt = APP5T_Utils.formatMoneda(saldo);

    // Date formatting helper
    function formatSpanishDate(dateStr) {
      if (!dateStr || dateStr === '—') return '—';
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const year = parts[2];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${months[monthIndex]} ${year}`;
      }
      return dateStr;
    }

    const estado = (propiedad.estado || '').trim();
    const fechaRes = neg.fecha_negociacion || neg.fecha_solicitud || neg.created_at || '—';
    const fechaResFmt = formatSpanishDate(fechaRes);

    // Determine current milestone details based on state
    let hitoIcon = 'fa-solid fa-hourglass-half';
    let hitoTitle = 'Estado de la Operación';
    let hitoDesc = '';
    let accentClass = 'accent-orange';

    if (estado === 'Reservada') {
      hitoIcon = 'fa-solid fa-hourglass-half';
      hitoTitle = 'Reserva Habilitada';
      hitoDesc = `Reserva confirmada el <strong>${fechaResFmt}</strong>. Operación legal en revisión, a la espera de firma de Promesa de Compraventa.`;
      accentClass = 'accent-orange';
    } else if (estado === 'Promesada') {
      hitoIcon = 'fa-solid fa-file-signature';
      hitoTitle = 'Promesa de Compraventa';
      const fechaProm = neg.fecha_promesa || '—';
      const fechaPromFmt = formatSpanishDate(fechaProm);
      hitoDesc = `Contrato de promesa firmado el <strong>${fechaPromFmt !== '—' ? fechaPromFmt : fechaResFmt}</strong>. Lote en proceso de tramitación y escrituración definitiva.`;
      accentClass = 'accent-blue';
    } else if (estado === 'Vendida' || estado === 'Escriturada') {
      hitoIcon = 'fa-solid fa-circle-check';
      hitoTitle = 'Venta Definitiva';
      const fechaVenta = propiedad.fecha_venta || neg.fecha_escritura || '—';
      const fechaVentaFmt = formatSpanishDate(fechaVenta);
      hitoDesc = `Escritura definitiva firmada el <strong>${fechaVentaFmt !== '—' ? fechaVentaFmt : fechaResFmt}</strong>. Operación inscrita y cerrada exitosamente.`;
      accentClass = 'accent-success';
    } else if (estado === 'Venta_Directa') {
      hitoIcon = 'fa-solid fa-bolt';
      hitoTitle = 'Venta Directa Habilitada';
      hitoDesc = `Venta Directa autorizada por Gerencia el <strong>${fechaResFmt}</strong>. Operación pendiente de escrituración por Administración.`;
      accentClass = 'accent-purple';
    }

    // Consulta de cuenta corriente
    let ctacteHtml = '';
    if (typeof APP5T_DB !== 'undefined') {
      const cuotas = APP5T_DB.query('cuenta_corriente', c => String(c.id_propiedad) === String(propiedad.id)) || [];
      if (cuotas.length > 0) {
        const cuotasPagadas = cuotas.filter(c => c.estado_cuota === 'Pagada');
        const cuotasPendientes = cuotas.filter(c => c.estado_cuota !== 'Pagada');
        
        let proximoInfo = 'Al día / Completo';
        if (cuotasPendientes.length > 0) {
          const sortedPendientes = cuotasPendientes.sort((a, b) => {
            const da = APP5T_Utils.parseFecha(a.fecha_vencimiento);
            const db = APP5T_Utils.parseFecha(b.fecha_vencimiento);
            return da - db;
          });
          const prox = sortedPendientes[0];
          proximoInfo = `${prox.fecha_vencimiento} (${APP5T_Utils.formatMoneda(prox.monto_cuota || 0)})`;
        }

        ctacteHtml = `
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(255,255,255,0.05); margin-top: 4px; padding-top: 4px; font-size: 0.76rem;">
            <span><span style="color:var(--text-dim);">Cuotas:</span> <strong style="color:var(--text-white); font-weight:600;">${cuotasPagadas.length}/${cuotas.length}</strong></span>
            <span><span style="color:var(--text-dim);">Próxima:</span> <strong style="color:${cuotasPendientes.length > 0 ? 'var(--accent-orange)' : 'var(--accent-green)'}; font-weight:600;">${proximoInfo}</strong></span>
          </div>
        `;
      }
    }

    // Dynamic buttons (Botón único de acceso directo al documento)
    let btnComprobanteHTML = '';
    if (estado === 'Reservada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.82rem; padding: 8px 12px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; border-radius: 6px; transition: all 0.2s;">
          <i class="fa-solid fa-file-pdf"></i> Recibo de Reserva <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; opacity: 0.8;"></i>
        </button>
      `;
    } else if (estado === 'Promesada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-revisar-borrador" class="btn btn-outline" style="width: 100%; font-size: 0.82rem; padding: 8px 12px; border-color: var(--accent-blue); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; border-radius: 6px; transition: all 0.2s;">
          <i class="fa-solid fa-file-contract"></i> Ver Contrato Promesa <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; opacity: 0.8;"></i>
        </button>
      `;
    } else if (estado === 'Vendida' || estado === 'Escriturada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-ver-escritura" class="btn btn-outline" style="width: 100%; font-size: 0.82rem; padding: 8px 12px; border-color: var(--accent-green); color: var(--accent-green); display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; border-radius: 6px; transition: all 0.2s;">
          <i class="fa-solid fa-file-signature"></i> Ver Copia Escritura <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; opacity: 0.8;"></i>
        </button>
      `;
    }

    // Render the financials section dynamically based on state
    let financialHtml = '';
    const isVendida = estado === 'Vendida' || estado === 'Escriturada';

    if (isVendida) {
      financialHtml = `
        <div style="display:flex; justify-content:space-between; font-size:0.78rem; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.04);">
          <span><span style="color:var(--text-dim);">Valor Venta:</span> <strong style="color:var(--accent-green); font-weight:700;">${precioVentaFmt}</strong></span>
          <strong style="color:var(--accent-green); font-weight:600; font-size:0.74rem;">100% Pagado (Cerrado)</strong>
        </div>
      `;
    } else {
      financialHtml = `
        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.04); margin-top: 4px; padding-top: 4px; font-size: 0.78rem;">
          <span><span style="color:var(--text-dim);">Abono:</span> <strong style="color:var(--accent-green); font-weight:600;">${abonoFmt}</strong></span>
          <span><span style="color:var(--text-dim);">Saldo:</span> <strong style="color:var(--accent-red); font-weight:700;">${saldoFmt}</strong></span>
        </div>
        ${ctacteHtml}
      `;
    }

    container.innerHTML = `
      <div class="negociacion-tracking-container" style="padding: 0;">
        <div class="lote-ficha ${accentClass}" style="padding: 10px; border-radius: 8px;">
          <div class="lote-ficha-header" style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="${hitoIcon}" style="font-size: 1.15rem;"></i>
              <h4 style="margin:0; font-size: 0.88rem; font-weight:700;">${hitoTitle}</h4>
            </div>
            <!-- Menú discreto ⋮ exclusivo para Gerente -->
            <div class="menu-gerente-wrapper" style="position: relative;">
              <button type="button" class="btn-dots-gerente" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: var(--text-dim); width: 28px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem;" title="Opciones avanzadas">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
              <div class="dropdown-gerente-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 1000; min-width: 225px; padding: 4px;">
                <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; padding: 6px 10px 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); letter-spacing: 0.05em; display:flex; align-items:center; gap:5px;">
                  <i class="fa-solid fa-user-shield" style="color:var(--accent-green);"></i> Acceso Gerencial
                </div>
                <button type="button" class="btn-item-revertir-gerente" style="width: 100%; text-align: left; background: none; border: none; color: #ef4444; padding: 8px 10px; font-size: 0.74rem; font-weight: 600; display: flex; align-items: center; gap: 8px; border-radius: 4px; cursor: pointer;">
                  <i class="fa-solid fa-rotate-left" style="color: #ef4444;"></i> Revertir Operación a Disponible
                </button>
              </div>
            </div>
          </div>
          
          <div class="info-grid-vertical" style="gap: 2px;">
            <div style="display:flex; flex-direction:column; gap:1px; font-size:0.76rem; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.05);">
              <span style="color:var(--text-dim); font-size:0.68rem; text-transform:uppercase; letter-spacing:0.02em;">Cliente</span>
              <strong style="color:var(--text-white); font-weight:600; font-size:0.82rem; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${clienteNom}">${clienteNom}</strong>
              <span style="color:var(--text-dim); font-size:0.72rem;">RUT: ${clienteRut}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.76rem; padding: 4px 0;">
              <span><span style="color:var(--text-dim);">Vendedor:</span> <strong style="color:var(--text-white); font-weight:500;">${vendedorNom}</strong></span>
            </div>
            
            ${financialHtml}
          </div>
          
          <p style="margin: 10px 0 0 0; font-size: 0.78rem; line-height: 1.4; color: var(--text-dim); border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;">
            ${hitoDesc}
          </p>
          
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            ${btnComprobanteHTML}
          </div>

        </div>
      </div>
    `;

    // Bind event listeners
    const dotsBtn = container.querySelector('.btn-dots-gerente');
    const dropdownMenu = container.querySelector('.dropdown-gerente-menu');
    if (dotsBtn && dropdownMenu) {
      dotsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isShown ? 'none' : 'block';
      });

      const onDocClick = (e) => {
        if (!dotsBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.style.display = 'none';
        }
      };
      document.addEventListener('click', onDocClick);
    }

    const btnItemRevertir = container.querySelector('.btn-item-revertir-gerente');
    if (btnItemRevertir) {
      btnItemRevertir.addEventListener('click', (e) => {
        if (dropdownMenu) dropdownMenu.style.display = 'none';
        if (window.APP5T && typeof window.APP5T._revertirVentaDirecta === 'function') {
          window.APP5T._revertirVentaDirecta(propiedad.id, e);
        }
      });
    }

    const btnComprobante = container.querySelector('#btn-ver-comprobante');
    if (btnComprobante) {
      btnComprobante.addEventListener('click', () => {
        let urlReal = null;
        if (propiedad.url && propiedad.url.trim() !== '') {
          urlReal = propiedad.url;
        } else if (neg && neg.url && neg.url.trim() !== '') {
          urlReal = neg.url;
        } else if (typeof APP5T_DB !== 'undefined') {
          const docsLote = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];
          const doc = docsLote.find(d => 
            String(d.nombre || '').toLowerCase().includes('reserva') || 
            String(d.nombre || '').toLowerCase().includes('comprobante') || 
            String(d.tipo_documento || '').toLowerCase().includes('reserva')
          );
          if (doc && doc.url_drive) urlReal = doc.url_drive;
        }
        
        if (urlReal) {
          window.open(urlReal, '_blank');
        } else {
          // Generar PDF directo sin mostrar visor
          const dateStr   = APP5T_Utils.fechaHoy();
          const negId     = neg ? String(neg.id).padStart(2,'0') : '00';
          const loteNom   = propiedad.nombre || '';
          const cleanLote = loteNom.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9-_]/g,'_');
          const filename  = 'Comprobante_Reserva_Lote' + cleanLote + '_' + new Date().toISOString().split('T')[0] + '.pdf';
          _generarPDFConJsPDF({
            type:       'reserva',
            docHeader:  'COMPROBANTE DE RESERVA DE PROPIEDAD',
            dateStr,
            lote:       loteNom,
            proyecto:   proyectoNom || '',
            superficie: propiedad.superficie ? APP5T_Utils.formatSuperficie(propiedad.superficie) : '',
            rol:        propiedad.rol || 'En Tramite',
            clienteNom: cliente ? (cliente.nombres + ' ' + cliente.apellidos) : '',
            clienteRut: cliente ? (cliente.rut || '') : '',
            precio:     precioVentaFmt || '',
            pie:        neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '',
            metodoPago: neg ? (neg.metodo_pago || 'Transferencia Bancaria') : '',
            cuotas:     neg ? String(neg.cantidad_cuotas || 'Sin cuotas') : '',
            negId,
            bodyText:   '',
          }, filename);
        }
      });
    }

    const btnBorrador = container.querySelector('#btn-revisar-borrador');
    if (btnBorrador) {
      btnBorrador.addEventListener('click', () => {
        let urlReal = null;
        if (propiedad.url && propiedad.url.trim() !== '') {
          urlReal = propiedad.url;
        } else if (neg && neg.url && neg.url.trim() !== '') {
          urlReal = neg.url;
        } else if (typeof APP5T_DB !== 'undefined') {
          const docsLote = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];
          const doc = docsLote.find(d => 
            String(d.nombre || '').toLowerCase().includes('promesa') || 
            String(d.tipo_documento || '').toLowerCase().includes('promesa') ||
            String(d.tipo_documento || '').toLowerCase().includes('contrato')
          );
          if (doc && doc.url_drive) urlReal = doc.url_drive;
        }
        
        if (urlReal) {
          window.open(urlReal, '_blank');
        } else {
          _showSimulatedPDF(
            `Contrato de Promesa — Lote ${propiedad.nombre}`, 
            'promesa', 
            propiedad, 
            neg, 
            cliente, 
            proyectoNom, 
            precioVentaFmt
          );
        }
      });
    }

    const btnVerEscritura = container.querySelector('#btn-ver-escritura');
    if (btnVerEscritura) {
      btnVerEscritura.addEventListener('click', () => {
        let urlReal = null;
        if (propiedad.url && propiedad.url.trim() !== '') {
          urlReal = propiedad.url;
        } else if (typeof APP5T_DB !== 'undefined') {
          const docsLote = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];
          const doc = docsLote.find(d => 
            String(d.nombre || '').toLowerCase().includes('escritura') || 
            String(d.tipo_documento || '').toLowerCase().includes('escritura')
          );
          if (doc && doc.url_drive) urlReal = doc.url_drive;
        }
        
        if (urlReal) {
          window.open(urlReal, '_blank');
        } else {
          _showSimulatedPDF(
            `Escritura Definitiva — Lote ${propiedad.nombre}`, 
            'escritura', 
            propiedad, 
            neg, 
            cliente, 
            proyectoNom, 
            precioVentaFmt
          );
        }
      });
    }
  }

  function _appendDriveDocuments(container, propiedad) {
    if (!container || !propiedad || typeof APP5T_DB === 'undefined') return;
    
    // Solo mostramos documentos complementarios si existen en la tabla 'documentos' (Planos, Carpetas, etc.)
    // El documento principal (Contrato / Recibo / Escritura) ya es accesible mediante el botón único superior
    const docs = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];

    // Excluimos duplicados del contrato/promesa/recibo principal
    const extraDocs = docs.filter(d => {
      const nom = String(d.nombre || '').toLowerCase();
      const tipo = String(d.tipo_documento || '').toLowerCase();
      return !nom.includes('contrato') && !nom.includes('promesa') && !nom.includes('recibo') && !tipo.includes('contrato') && !tipo.includes('promesa');
    });

    if (extraDocs.length > 0) {
      let docsHtml = `
        <div class="lote-ficha" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: 8px;">
          <div class="lote-ficha-header" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-brands fa-google-drive" style="color: var(--accent-blue); font-size: 1.05rem;"></i>
            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700;">Documentos Complementarios</h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">`;
      
      extraDocs.forEach(d => {
        let icon = 'fa-file-pdf';
        let color = 'var(--accent-blue)';
        if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
        else if (d.tipo_documento === 'Carpeta') { icon = 'fa-folder-open'; color = 'var(--accent-orange)'; }
        
        docsHtml += `
          <a href="${d.url_drive}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; font-size: 0.78rem; color: var(--text-white); background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 4px;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
            <span><i class="fa-solid ${icon}" style="color: ${color}; margin-right: 6px;"></i> ${d.nombre}</span>
            <i class="fa-solid fa-external-link" style="font-size: 0.65rem; color: var(--text-dim);"></i>
          </a>`;
      });
      docsHtml += `</div></div>`;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = docsHtml.trim();
      container.appendChild(tempDiv.firstElementChild);
    }
  }

  /* ══════════════════════════════════════════════════════
     renderLoteForm
     ══════════════════════════════════════════════════════ */
    function renderLoteForm(container, propiedad, role) {
    if (!container || !propiedad) return;

    // 1. Limpiar el contenedor
    container.innerHTML = '';

    // 2. Si el rol es administrador, mostramos un form limpio si es Disponible
    // de lo contrario, si es vendedor, se muestra el "Solicitar Reserva".
    const estado = (propiedad.estado || '').trim();
    if (estado === 'Disponible' && role === 'administrador') {
        // El administrador no debe ver el formulario de solicitar reserva
    } else {
        _renderLoteFormBase(container, propiedad, role);
    }

    // 3. Añadir el Panel de Auditoría para Administrador (prepended)
    if (role === 'administrador') {
      let neg = null;
      if (estado !== 'Disponible' && estado !== 'Bloqueado') {
        const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id));
        neg = negs && negs.length ? negs[negs.length - 1] : null;
      }
      
      _renderFichaAuditoriaAdmin(container, propiedad, neg);
    }

    // 4. Agregar documentos en Drive si existen
    _appendDriveDocuments(container, propiedad);
  }



  function _renderLoteFormBase(container, propiedad, role) {
    if (!container || !propiedad) return;
    const estado = (propiedad.estado || '').trim();

    // ── GERENTE: FICHA COMERCIAL para Reservada, Promesada, Venta_Directa y Vendida ──
    if (role === 'gerente' && (estado === 'Reservada' || estado === 'Promesada' || estado === 'Venta_Directa' || estado === 'Vendida')) {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id));
      const neg = negs && negs.length ? negs[negs.length - 1] : null;
      _renderFichaGerencial(container, propiedad, neg);
      return;
    }

    // ── DISPONIBLE ────────────────────────────────────
    if (estado === 'Disponible') {
      if (role === 'gerente') {
        const precioFmt = APP5T_Utils.formatMoneda(propiedad.valor_final || 0);
        const abonoFmt = APP5T_Utils.formatMoneda(propiedad.abono || 0);
        const vendedores = APP5T_DB.getAll('vendedores') || [];
        const vendedoresOptions = vendedores.map(v => `<option value="${v.id}">${v.nombre}</option>`).join('');

        container.innerHTML = `
          <!-- FICHA INFORMATIVA / ACCIONES GERENCIALES -->
          <div id="gerente-ficha-info" style="padding:12px 6px; font-size:0.8rem; text-align:center;">
            <!-- Modificación rápida de Precio de Lista para Gerencia -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:8px; padding:12px; margin-bottom:14px; text-align:left; box-sizing:border-box; width:100%;">
              <label style="font-size:0.75rem; font-weight:700; color:var(--text-white); text-transform:uppercase; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                <i class="fa-solid fa-tags" style="color:var(--accent-green);"></i> Precio de Venta / Lista Oficial
              </label>
              <div style="display:flex; gap:6px; align-items:center; width:100%; box-sizing:border-box;">
                <input type="text" id="gerente-precio-lista-input" class="form-control" value="${precioFmt}" style="flex:1; min-width:0; padding:7px 10px; font-size:0.88rem; font-weight:700; color:var(--text-white); background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; box-sizing:border-box;">
                <button type="button" id="btn-gerente-guardar-precio-info" class="btn btn-success" style="flex-shrink:0; padding:7px 12px; font-size:0.78rem; font-weight:700; white-space:nowrap; display:flex; align-items:center; gap:5px; border-radius:6px; cursor:pointer;" title="Guardar Precio Oficial">
                  <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
              </div>
              <small style="display:block; font-size:0.68rem; color:var(--text-dim); margin-top:4px;">
                Actualiza el valor oficial de este lote para todo el sistema y vendedores.
              </small>
            </div>

            <p style="margin-bottom: 12px; color: var(--text-dim); font-size: 0.85rem; font-weight: 500;">O selecciona una operación comercial para este lote:</p>
            <button type="button" id="btn-nueva-venta-directa" class="btn btn-primary" style="width:100%; margin-bottom:10px; padding:12px; font-weight:700; font-size:0.88rem; display:flex; align-items:center; justify-content:center; gap:8px; background: #00e5ff; color: #0b1e33; border: none; box-shadow: 0 0 12px rgba(0, 229, 255, 0.3); border-radius: 8px; cursor: pointer;"><i class="fa-solid fa-bolt"></i> Nueva Venta Directa / Reserva</button>
            <button type="button" id="btn-gerente-bloquear-info" class="btn btn-outline" style="width:100%; padding:12px; font-size:0.85rem; font-weight:600; border: 1.5px solid rgba(255,255,255,0.2); color: var(--text-white); background: rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; gap:8px; border-radius: 8px; cursor: pointer;"><i class="fa-solid fa-lock"></i> Bloquear Propiedad</button>
          </div>

          <!-- FORMULARIO DE ASIGNACIÓN DIRECTA (Oculto por defecto) -->
          <form id="frm-direct-assignment" class="lote-ficha accent-success" style="padding: 12px; font-size: 0.8rem; border-radius: 8px; display:none;">
            <div class="lote-ficha-header" style="margin-bottom: 8px; display:flex; align-items:center; gap:6px;">
              <button type="button" id="btn-volver-info" style="background:none; border:none; color:var(--text-dim); cursor:pointer; font-size:1rem; padding:4px 8px; margin-right:4px;"><i class="fa-solid fa-arrow-left"></i></button>
              <i class="fa-solid fa-bolt" style="color:var(--accent-orange); font-size:1.15rem;"></i>
              <h4 style="margin:0; font-size: 0.9rem; font-weight:700;">Asignación Directa y Cierre</h4>
            </div>

            <!-- Client section -->
            <div id="client-match-banner-slot"></div>
            <div class="form-group" id="group-new_rut" style="position:relative; margin-bottom: 8px;">
              <label for="new_rut" style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">RUT Cliente *</label>
              <div class="rut-validation-wrapper" style="position:relative; display:flex; align-items:center;">
                <input type="text" name="new_rut" id="new_rut" class="form-control" placeholder="Ej: 12.345.678-9" required autocomplete="off" style="width:100%; padding: 6px 30px 6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
                <span class="rut-validation-icon" id="rut-icon" style="position:absolute; right:8px; color:var(--text-dim); font-size:0.8rem;"><i class="fa-solid fa-ellipsis"></i></span>
              </div>
              <div class="rut-format-hint neutral" id="rut-hint" style="font-size:0.68rem; color:var(--text-dim); margin-top:2px;">Ingresa el RUT del cliente</div>
              <div class="autocomplete-dropdown" id="rut-autocomplete" style="position:absolute; top:100%; left:0; right:0; z-index:1000; background:var(--bg-glass); border:1px solid var(--glass-border); border-radius:4px; max-height:150px; overflow-y:auto; display:none;"></div>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" id="group-new_nombres" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Nombres *</label>
                <input type="text" name="new_nombres" class="form-control" placeholder="Juan Pablo" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
              <div class="form-group" id="group-new_apellidos" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Apellidos *</label>
                <input type="text" name="new_apellidos" class="form-control" placeholder="Pérez Gómez" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" id="group-new_telefono" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Teléfono *</label>
                <input type="tel" name="new_telefono" class="form-control" placeholder="+56 9 1234 5678" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
              <div class="form-group" id="group-new_email" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Email *</label>
                <input type="email" name="new_email" class="form-control" placeholder="juan.perez@email.com" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
            </div>

            <div class="form-group" id="group-id_vendedor" style="margin-bottom: 8px;">
              <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Vendedor Asignado *</label>
              <select name="id_vendedor" class="form-control" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
                ${vendedoresOptions}
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 4px;">
              <div class="form-group" id="group-precio_oferta" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Precio Venta *</label>
                <input type="text" name="precio_oferta" class="form-control" value="${precioFmt}" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
              <div class="form-group" id="group-monto_reserva" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Monto Reserva</label>
                <input type="text" name="monto_reserva" class="form-control" value="${abonoFmt}" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
              <div class="form-group" id="group-cantidad_cuotas" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Cant. Cuotas (Financ.)</label>
                <input type="number" name="cantidad_cuotas" class="form-control" placeholder="Ej: 12" min="1" max="120" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
            </div>

            <!-- Botón para guardar modificación de Precio de Lista de la parcela -->
            <button type="button" id="btn-guardar-precio-lista-direct" class="btn btn-outline" style="width:100%; margin-bottom:10px; font-size:0.78rem; padding:6px 10px; border:1px solid var(--accent-green); color:var(--accent-green); background:rgba(46,204,113,0.06); font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:4px; cursor:pointer;" title="Guardar este Precio de Venta como el nuevo Precio de Lista oficial del lote">
              <i class="fa-solid fa-floppy-disk"></i> Guardar Modificación de Precio
            </button>

            <div class="form-group" id="group-metodo_pago" style="margin-bottom: 8px;">
              <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Método de Pago</label>
              <select name="metodo_pago" class="form-control" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
                <option>Transferencia</option><option>Vale Vista</option><option>Efectivo</option><option>Depósito</option><option>Cheque</option>
              </select>
            </div>

            <div class="form-group" id="group-notas" style="margin-bottom: 12px;">
              <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Notas / Observaciones</label>
              <textarea name="notas" class="form-control" rows="2" placeholder="Notas sobre el cierre..." style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white); font-family:inherit; resize:vertical;"></textarea>
            </div>

            <!-- Action buttons -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px;">
              <button type="button" id="btn-gerente-reserva" class="btn btn-success" style="font-size:0.75rem; padding: 8px 4px; display:flex; align-items:center; justify-content:center; gap:4px;" title="Promesa en cuotas tradicional"><i class="fa-solid fa-file-contract"></i> Promesa</button>
              <button type="button" id="btn-gerente-saldo-precio" class="btn btn-outline" style="font-size:0.75rem; padding: 8px 4px; border-color:#9b59b6; color:#c39bd3; background:rgba(155, 89, 182, 0.12); display:flex; align-items:center; justify-content:center; gap:4px;" title="Escritura inmediata con Hipoteca y cuotas de saldo"><i class="fa-solid fa-landmark"></i> Saldo Precio</button>
              <button type="button" id="btn-gerente-venta" class="btn btn-outline" style="font-size:0.75rem; padding: 8px 4px; border-color:var(--accent-warning); color:var(--accent-warning); display:flex; align-items:center; justify-content:center; gap:4px;" title="Venta 100% al contado"><i class="fa-solid fa-bolt"></i> Contado</button>
            </div>
            
            <button type="button" id="btn-gerente-bloquear" class="btn btn-outline" style="width: 100%; font-size:0.78rem; padding: 6px; border-color:var(--text-dim); color:var(--text-dim); margin-top:8px; display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fa-solid fa-lock"></i> Bloquear Propiedad</button>
          </form>
        `;

        // ── Autocomplete / Validation Engine for Gerente ──────────
        const rutInput     = container.querySelector('#new_rut');
        const rutIcon      = container.querySelector('#rut-icon');
        const rutHint      = container.querySelector('#rut-hint');
        const acDropdown   = container.querySelector('#rut-autocomplete');
        const bannerSlot   = container.querySelector('#client-match-banner-slot');
        let   acActiveIdx  = -1;
        let   selectedClientId = null;

        function _autoFormatRUT(raw) {
          let clean = raw.replace(/[^0-9kK]/gi, '').toUpperCase();
          if (clean.length === 0) return '';
          let dv = '', body = clean;
          if (clean.length > 1) {
            dv = clean.slice(-1);
            body = clean.slice(0, -1);
          }
          let formatted = '';
          let cnt = 0;
          for (let i = body.length - 1; i >= 0; i--) {
            formatted = body[i] + formatted;
            cnt++;
            if (cnt % 3 === 0 && i > 0) formatted = '.' + formatted;
          }
          return clean.length > 1 ? formatted + '-' + dv : formatted;
        }

        function _searchClients(query) {
          const allClientes = APP5T_DB.getAll('clientes') || [];
          if (!query || query.length < 2) return [];
          const q = query.replace(/[\.\-]/g, '').toLowerCase();
          return allClientes.filter(c => {
            const rutMatch = c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase().includes(q);
            const nameMatch = (c.nombres + ' ' + c.apellidos).toLowerCase().includes(q);
            return rutMatch || nameMatch;
          }).slice(0, 6);
        }

        function _renderAC(matches) {
          if (!matches.length) {
            acDropdown.innerHTML = '';
            acDropdown.style.display = 'none';
            return;
          }
          acDropdown.innerHTML = matches.map((c, i) => {
            const initials = ((c.nombres || '')[0] || '') + ((c.apellidos || '')[0] || '');
            const rutFmt = c.rut ? APP5T_Utils.formatRUT(c.rut) : '—';
            return `<div class="ac-item${i === acActiveIdx ? ' ac-active' : ''}" data-idx="${i}" style="display:flex; align-items:center; gap:8px; padding:6px 8px; cursor:pointer; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.02);">
              <div class="ac-avatar" style="width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:600; color:var(--text-white);">${initials}</div>
              <div class="ac-info" style="display:flex; flex-direction:column; min-width:0; flex:1;">
                <span class="ac-name" style="color:var(--text-white); font-weight:500; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${c.nombres || ''} ${c.apellidos || ''}</span>
                <span class="ac-rut" style="color:var(--text-dim); font-size:0.65rem;">${rutFmt}</span>
              </div>
            </div>`;
          }).join('');
          acDropdown.style.display = 'block';

          acDropdown.querySelectorAll('.ac-item').forEach(item => {
            item.addEventListener('mousedown', (ev) => {
              ev.preventDefault();
              const idx = parseInt(item.dataset.idx, 10);
              _selectClient(matches[idx]);
            });
          });
        }

        function _selectClient(cliente) {
          selectedClientId = cliente.id;
          const frm = container.querySelector('#frm-direct-assignment');
          const fields = {
            'new_rut':       APP5T_Utils.formatRUT(cliente.rut || ''),
            'new_nombres':   cliente.nombres || '',
            'new_apellidos': cliente.apellidos || '',
            'new_telefono':  cliente.telefono || '',
            'new_email':     cliente.email || ''
          };
          Object.entries(fields).forEach(([name, val]) => {
            const inp = frm.querySelector(`[name="${name}"]`);
            if (inp) {
              inp.value = val;
              const group = inp.closest('.form-group');
              if (group && name !== 'new_rut') {
                group.classList.add('autofill-highlight');
                setTimeout(() => group.classList.remove('autofill-highlight'), 1200);
              }
            }
          });

          rutInput.classList.remove('rut-invalid', 'input-error');
          rutInput.classList.add('rut-valid');
          rutIcon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--accent-green);"></i>';
          rutHint.textContent = APP5T_Utils.formatRUT(cliente.rut);
          rutHint.style.color = 'var(--accent-green)';

          bannerSlot.innerHTML = `<div class="client-match-banner found" style="display:flex; align-items:center; gap:6px; background:rgba(46,204,113,0.1); border:1px solid rgba(46,204,113,0.3); border-radius:4px; padding:6px 8px; margin-bottom:8px; font-size:0.75rem; color:var(--text-white);">
            <i class="fa-solid fa-user-check" style="font-size:0.9rem; color:var(--accent-green);"></i>
            <span><strong>${cliente.nombres} ${cliente.apellidos}</strong> — cliente encontrado</span>
          </div>`;

          acDropdown.style.display = 'none';
          acActiveIdx = -1;
        }

        function _clearAutofill() {
          selectedClientId = null;
          const frm = container.querySelector('#frm-direct-assignment');
          ['new_nombres', 'new_apellidos', 'new_telefono', 'new_email'].forEach(name => {
            const inp = frm.querySelector(`[name="${name}"]`);
            if (inp) inp.value = '';
          });
          bannerSlot.innerHTML = '';
        }

        let rutDebounce = null;
        rutInput.addEventListener('input', () => {
          const cursorPos = rutInput.selectionStart;
          const prevLen = rutInput.value.length;
          const formatted = _autoFormatRUT(rutInput.value);
          rutInput.value = formatted;
          const newLen = formatted.length;
          const diff = newLen - prevLen;
          rutInput.setSelectionRange(cursorPos + diff, cursorPos + diff);

          const clean = APP5T_Utils.limpiarRUT(formatted);

          if (selectedClientId !== null) {
            const currentClient = APP5T_DB.getById('clientes', selectedClientId);
            const currentClientRut = currentClient && currentClient.rut ? APP5T_Utils.limpiarRUT(currentClient.rut) : '';
            if (clean !== currentClientRut) {
              _clearAutofill();
            }
          }

          if (clean.length < 2) {
            rutInput.classList.remove('rut-valid', 'rut-invalid');
            rutIcon.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
            rutHint.textContent = 'Ingresa el RUT del cliente';
            rutHint.style.color = 'var(--text-dim)';
          } else if (clean.length >= 7) {
            if (APP5T_Utils.validarRUT(formatted)) {
              rutInput.classList.remove('rut-invalid', 'input-error');
              rutInput.classList.add('rut-valid');
              rutIcon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--accent-green);"></i>';
              rutHint.textContent = '✓ RUT válido';
              rutHint.style.color = 'var(--accent-green)';
            } else {
              rutInput.classList.remove('rut-valid');
              rutInput.classList.add('rut-invalid');
              rutIcon.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:var(--accent-red);"></i>';
              rutHint.textContent = '✗ Dígito verificador incorrecto';
              rutHint.style.color = 'var(--accent-red)';
            }
          }

          if (clean.length >= 7) {
            const allClientes = APP5T_DB.getAll('clientes') || [];
            const normalRut = clean.toLowerCase();
            const exactMatch = allClientes.find(c => 
              c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase() === normalRut
            );
            if (exactMatch && !selectedClientId) {
              _selectClient(exactMatch);
            }
          }

          clearTimeout(rutDebounce);
          rutDebounce = setTimeout(() => {
            const matches = _searchClients(formatted);
            acActiveIdx = -1;
            _renderAC(matches);
          }, 180);
        });

        rutInput.addEventListener('keydown', (ev) => {
          const items = acDropdown.querySelectorAll('.ac-item');
          if (!items.length || acDropdown.style.display === 'none') return;
          
          if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            acActiveIdx = Math.min(acActiveIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('ac-active', i === acActiveIdx));
          } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            acActiveIdx = Math.max(acActiveIdx - 1, 0);
            items.forEach((el, i) => el.classList.toggle('ac-active', i === acActiveIdx));
          } else if (ev.key === 'Enter' && acActiveIdx >= 0) {
            ev.preventDefault();
            const matches = _searchClients(rutInput.value);
            if (matches[acActiveIdx]) _selectClient(matches[acActiveIdx]);
          } else if (ev.key === 'Escape') {
            acDropdown.style.display = 'none';
            acActiveIdx = -1;
          }
        });

        rutInput.addEventListener('blur', () => {
          setTimeout(() => {
            acDropdown.style.display = 'none';
            acActiveIdx = -1;
          }, 200);
        });

        const formEl = container.querySelector('#frm-direct-assignment');

        // Validation helper
        function _validateForm() {
          const rutVal = formEl.querySelector('[name="new_rut"]').value.trim();
          const nombresVal = formEl.querySelector('[name="new_nombres"]').value.trim();
          const apellidosVal = formEl.querySelector('[name="new_apellidos"]').value.trim();
          const telVal = formEl.querySelector('[name="new_telefono"]').value.trim();
          const emailVal = formEl.querySelector('[name="new_email"]').value.trim();

          if (!rutVal) { APP5T_Utils.showToast('RUT es requerido', 'warning'); return null; }
          if (!nombresVal) { APP5T_Utils.showToast('Nombres son requeridos', 'warning'); return null; }
          if (!apellidosVal) { APP5T_Utils.showToast('Apellidos son requeridos', 'warning'); return null; }
          if (!telVal) { APP5T_Utils.showToast('Teléfono es requerido', 'warning'); return null; }
          if (!emailVal) { APP5T_Utils.showToast('Correo electrónico es requerido', 'warning'); return null; }

          if (!APP5T_Utils.validarRUT(rutVal)) {
            APP5T_Utils.showToast('RUT inválido', 'warning');
            return null;
          }
          return { rutVal, nombresVal, apellidosVal, telVal, emailVal };
        }

        function _getOrCreateClient(clientData, idVendedor) {
          let idCliente;
          if (selectedClientId) {
            idCliente = selectedClientId;
            APP5T_DB.update('clientes', idCliente, {
              rut: clientData.rutVal,
              nombres: clientData.nombresVal,
              apellidos: clientData.apellidosVal,
              telefono: clientData.telVal,
              email: clientData.emailVal
            });
          } else {
            const existingClients = APP5T_DB.query('clientes', c => c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase() === clientData.rutVal.replace(/[\.\-]/g, '').toLowerCase());
            if (existingClients && existingClients.length > 0) {
              idCliente = existingClients[0].id;
              APP5T_DB.update('clientes', idCliente, {
                nombres: clientData.nombresVal,
                apellidos: clientData.apellidosVal,
                telefono: clientData.telVal,
                email: clientData.emailVal
              });
            } else {
              const nuevoCliente = {
                rut: clientData.rutVal,
                nombres: clientData.nombresVal,
                apellidos: clientData.apellidosVal,
                telefono: clientData.telVal,
                email: clientData.emailVal,
                fecha_ingreso: APP5T_Utils.fechaHoy(),
                id_vendedor: idVendedor,
                estado_cliente: 'Activo',
                canal_captacion: 'Directo'
              };
              const clientInsertRes = APP5T_DB.insert('clientes', nuevoCliente);
              if (clientInsertRes && !clientInsertRes.success) {
                APP5T_Utils.showToast(`Error al registrar cliente: ${clientInsertRes.error}`, 'error');
                return null;
              }
              idCliente = clientInsertRes.id;
            }
          }
          return idCliente;
        }

        function _findDirectorId() {
          const activeUserNom = (window.APP5T && typeof window.APP5T.getActiveUser === 'function')
            ? window.APP5T.getActiveUser()
            : 'Gerente';
          let dirs = APP5T_DB.getAll('directorio') || [];
          if (dirs.length === 0) {
            const newDir = {
              rut: '12.345.678-9',
              nombre: activeUserNom,
              cargo: 'Director',
              fecha_ingreso: APP5T_Utils.fechaHoy(),
              estado: 'Disponible',
              auth_reserva: 'S',
              firma_reserva: 'S'
            };
            const insertRes = APP5T_DB.insert('directorio', newDir);
            if (insertRes && insertRes.success) dirs = APP5T_DB.getAll('directorio') || [];
          }
          let dirAuth = dirs.find(d => String(d.nombre || '').toLowerCase().trim().includes(String(activeUserNom).toLowerCase().trim()));
          if (!dirAuth) dirAuth = dirs.find(d => String(d.auth_reserva || '').trim().toUpperCase() === 'S');
          if (!dirAuth) dirAuth = dirs[0];
          return dirAuth ? dirAuth.id : 0;
        }

        // Action: Registrar Reserva
        container.querySelector('#btn-gerente-reserva').addEventListener('click', () => {
          const cData = _validateForm();
          if (!cData) return;

          const idVendedor = parseInt(formEl.querySelector('[name="id_vendedor"]').value, 10);
          if (!idVendedor || isNaN(idVendedor)) {
            APP5T_Utils.showToast('Seleccione un vendedor válido de la lista', 'warning');
            return;
          }
          const idCliente = _getOrCreateClient(cData, idVendedor);
          if (!idCliente) return;

          const payload = {
            valor_final:     APP5T_Utils.parseMoneda(formEl.querySelector('[name="precio_oferta"]').value),
            pie:             APP5T_Utils.parseMoneda(formEl.querySelector('[name="monto_reserva"]').value),
            metodo_pago:     formEl.querySelector('[name="metodo_pago"]').value,
            notas:           formEl.querySelector('[name="notas"]').value,
            tipo_operacion:  'Reserva'
          };

          const solRes = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
          if (solRes && !solRes.success) {
            APP5T_Utils.showToast(`Error al crear negocio: ${solRes.error}`, 'error');
            return;
          }

          const idDir = _findDirectorId();
          const appRes = APP5T_DB.aprobarReserva(solRes.id_negociacion, idDir);
          if (appRes && !appRes.success) {
            APP5T_Utils.showToast(`Error al autorizar reserva: ${appRes.error}`, 'error');
            return;
          }

          APP5T_Utils.showToast('Reserva registrada y aprobada de inmediato 💰', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          window.APP5T.closeModal(true);
        });

        // Action: Saldo de Precio
        container.querySelector('#btn-gerente-saldo-precio').addEventListener('click', () => {
          const cData = _validateForm();
          if (!cData) return;

          const idVendedor = parseInt(formEl.querySelector('[name="id_vendedor"]').value, 10);
          if (!idVendedor || isNaN(idVendedor)) {
            APP5T_Utils.showToast('Seleccione un vendedor válido de la lista', 'warning');
            return;
          }
          const idCliente = _getOrCreateClient(cData, idVendedor);
          if (!idCliente) return;

          const payload = {
            valor_final:     APP5T_Utils.parseMoneda(formEl.querySelector('[name="precio_oferta"]').value),
            pie:             APP5T_Utils.parseMoneda(formEl.querySelector('[name="monto_reserva"]').value),
            cantidad_cuotas: parseInt(formEl.querySelector('[name="cantidad_cuotas"]')?.value, 10) || 0,
            metodo_pago:     formEl.querySelector('[name="metodo_pago"]').value,
            notas:           formEl.querySelector('[name="notas"]').value,
            tipo_operacion:  'Saldo_Precio'
          };

          const solRes = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
          if (solRes && !solRes.success) {
            APP5T_Utils.showToast(`Error al crear negocio: ${solRes.error}`, 'error');
            return;
          }

          const idDir = _findDirectorId();
          const appRes = APP5T_DB.aprobarReserva(solRes.id_negociacion, idDir);
          if (appRes && !appRes.success) {
            APP5T_Utils.showToast(`Error al autorizar Saldo de Precio: ${appRes.error}`, 'error');
            return;
          }

          APP5T_Utils.showToast('Venta con Saldo de Precio aprobada e ingresada 🏛️', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          window.APP5T.closeModal(true);
        });

        // Action: Venta Directa
        container.querySelector('#btn-gerente-venta').addEventListener('click', () => {
          const cData = _validateForm();
          if (!cData) return;

          const idVendedor = parseInt(formEl.querySelector('[name="id_vendedor"]').value, 10);
          if (!idVendedor || isNaN(idVendedor)) {
            APP5T_Utils.showToast('Seleccione un vendedor válido de la lista', 'warning');
            return;
          }
          const idCliente = _getOrCreateClient(cData, idVendedor);
          if (!idCliente) return;

          const payload = {
            valor_final:     APP5T_Utils.parseMoneda(formEl.querySelector('[name="precio_oferta"]').value),
            pie:             0,
            metodo_pago:     formEl.querySelector('[name="metodo_pago"]').value,
            notas:           formEl.querySelector('[name="notas"]').value,
            tipo_operacion:  'Venta_Directa'
          };

          const solRes = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
          if (solRes && !solRes.success) {
            APP5T_Utils.showToast(`Error al crear negocio: ${solRes.error}`, 'error');
            return;
          }

          const idDir = _findDirectorId();
          const appRes = APP5T_DB.aprobarReserva(solRes.id_negociacion, idDir);
          if (appRes && !appRes.success) {
            APP5T_Utils.showToast(`Error al autorizar venta: ${appRes.error}`, 'error');
            return;
          }

          APP5T_Utils.showToast('Venta Directa registrada y aprobada exitosamente ⚡', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          window.APP5T.closeModal(true);
        });

        // Action: Bloquear Propiedad
        function _bloquearLote() {
          const confirmMsg = `¿Desea bloquear administrativamente el lote ${propiedad.nombre}? Quedará retirado de la venta pública.`;
          if (!confirm(confirmMsg)) return;

          APP5T_DB.update('propiedades', propiedad.id, { estado: 'Bloqueado' });
          if (APP5T_DB.logAudit) APP5T_DB.logAudit('Sistema', 'Gerente', 'propiedades', 'Bloqueo Administrativo', propiedad.id, 'Propiedad: ' + propiedad.nombre);

          APP5T_Utils.showToast('Propiedad bloqueada administrativamente 🔒', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          if (window.APP5T && typeof window.APP5T.closeModal === 'function') window.APP5T.closeModal(true);
        }

        const btnBloquear = container.querySelector('#btn-gerente-bloquear');
        if (btnBloquear) btnBloquear.addEventListener('click', _bloquearLote);

        const btnBloquearInfo = container.querySelector('#btn-gerente-bloquear-info');
        if (btnBloquearInfo) btnBloquearInfo.addEventListener('click', _bloquearLote);

        // Toggle Views: Nueva Venta Directa vs Menu Acciones
        const btnNuevaVenta = container.querySelector('#btn-nueva-venta-directa');
        if (btnNuevaVenta) {
          btnNuevaVenta.addEventListener('click', () => {
            const fichaInfo = container.querySelector('#gerente-ficha-info');
            const frmDirect = container.querySelector('#frm-direct-assignment');
            if (fichaInfo) fichaInfo.style.display = 'none';
            if (frmDirect) frmDirect.style.display = 'block';
          });
        }

        const btnVolver = container.querySelector('#btn-volver-info');
        if (btnVolver) {
          btnVolver.addEventListener('click', () => {
            const fichaInfo = container.querySelector('#gerente-ficha-info');
            const frmDirect = container.querySelector('#frm-direct-assignment');
            if (frmDirect) frmDirect.style.display = 'none';
            if (fichaInfo) fichaInfo.style.display = 'block';
          });
        }

        // ── Formateo y Guardado de Precio de Lista / Venta ──────────
        const priceInputInfo = container.querySelector('#gerente-precio-lista-input');
        if (priceInputInfo) {
          priceInputInfo.addEventListener('blur', () => {
            const val = APP5T_Utils.parseMoneda(priceInputInfo.value) || 0;
            priceInputInfo.value = APP5T_Utils.formatMoneda(val);
          });
        }

        const priceInputDirect = formEl ? formEl.querySelector('[name="precio_oferta"]') : null;
        if (priceInputDirect) {
          priceInputDirect.addEventListener('blur', () => {
            const val = APP5T_Utils.parseMoneda(priceInputDirect.value) || 0;
            priceInputDirect.value = APP5T_Utils.formatMoneda(val);
          });
        }

        const reservaInputDirect = formEl ? formEl.querySelector('[name="monto_reserva"]') : null;
        if (reservaInputDirect) {
          reservaInputDirect.addEventListener('blur', () => {
            const val = APP5T_Utils.parseMoneda(reservaInputDirect.value) || 0;
            reservaInputDirect.value = APP5T_Utils.formatMoneda(val);
          });
        }

        function _guardarPrecioLista(precioRaw) {
          const nuevoValor = APP5T_Utils.parseMoneda(precioRaw);
          if (!nuevoValor || nuevoValor <= 0) {
            APP5T_Utils.showToast('Por favor ingrese un precio de venta válido mayor a $ 0', 'warning');
            return;
          }
          const res = APP5T_DB.update('propiedades', propiedad.id, { valor_final: nuevoValor });
          if (res && !res.success) {
            APP5T_Utils.showToast(`Error al guardar precio: ${res.error}`, 'error');
            return;
          }
          if (APP5T_DB.logAudit) {
            APP5T_DB.logAudit('Sistema', 'Gerente', 'propiedades', 'Modificación Precio Venta', propiedad.id, `${propiedad.nombre || 'Lote ' + propiedad.id}: ${APP5T_Utils.formatMoneda(nuevoValor)}`);
          }
          APP5T_Utils.showToast(`Precio de Venta actualizado a ${APP5T_Utils.formatMoneda(nuevoValor)} 💾`, 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          if (window.APP5T && window.APP5T.onLoteSelected) {
            const updatedLote = APP5T_DB.getById('propiedades', propiedad.id);
            if (updatedLote) window.APP5T.onLoteSelected(updatedLote);
          }
        }

        const btnGuardarPrecioInfo = container.querySelector('#btn-gerente-guardar-precio-info');
        if (btnGuardarPrecioInfo) {
          btnGuardarPrecioInfo.addEventListener('click', () => {
            const val = priceInputInfo ? priceInputInfo.value : '';
            _guardarPrecioLista(val);
          });
        }

        const btnGuardarPrecioDirect = container.querySelector('#btn-guardar-precio-lista-direct');
        if (btnGuardarPrecioDirect) {
          btnGuardarPrecioDirect.addEventListener('click', () => {
            const val = priceInputDirect ? priceInputDirect.value : '';
            _guardarPrecioLista(val);
          });
        }

        return;
      } else {
        const precioFmt = APP5T_Utils.formatMoneda(propiedad.valor_final || 0);
        const montoReservaFmt = propiedad.abono ? APP5T_Utils.formatMoneda(propiedad.abono) : '$ 200.000';

        container.innerHTML = `
          <form id="frm-pre-reserva" class="lote-ficha accent-success">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-handshake"></i>
              <h4 id="frm-pre-reserva-title">Solicitar Reserva</h4>
            </div>


            <!-- Tipo de Operación -->
            <div class="form-group" style="margin-bottom:14px;">
              <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--text-dim);letter-spacing:.05em;display:block;margin-bottom:6px;">Tipo de Operación *</label>
              <div class="segmented-control" style="display: flex; gap: 8px;">
                <label class="segment-btn active" style="flex:1; text-align:center; padding: 10px 4px; background: rgba(46, 204, 113, 0.2); border: 1px solid var(--accent-green); border-radius: 8px; cursor: pointer; color: var(--text-white); font-weight: 600; font-size: 0.76rem; transition: all 0.2s;">
                  <input type="radio" name="tipo_operacion" value="Reserva" checked style="display:none;">
                  💰 Promesa (Cuotas)
                </label>
                <label class="segment-btn" style="flex:1; text-align:center; padding: 10px 4px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; color: var(--text-dim); font-weight: 600; font-size: 0.76rem; transition: all 0.2s;">
                  <input type="radio" name="tipo_operacion" value="Saldo_Precio" style="display:none;">
                  🏛️ Saldo de Precio
                </label>
                <label class="segment-btn" style="flex:1; text-align:center; padding: 10px 4px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; color: var(--text-dim); font-weight: 600; font-size: 0.76rem; transition: all 0.2s;">
                  <input type="radio" name="tipo_operacion" value="Venta_Directa" style="display:none;">
                  ⚡ Venta Contado
                </label>
              </div>
              <p id="tipo-operacion-hint" style="margin-top: 8px; font-size: 0.75rem; color: #a7f3d0; background: rgba(46, 204, 113, 0.08); padding: 7px 10px; border-radius: 6px; border-left: 3px solid var(--accent-green);">
                El lote pasará a estado Reservado y requerirá firma de Promesa en cuotas.
              </p>
            </div>


            <h5 style="margin-top:10px; margin-bottom:12px; font-weight:700; color:var(--text-white); border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-user"></i> Datos del Cliente</h5>
            <div id="client-match-banner-slot"></div>
            <div class="form-group" id="group-new_rut" style="position:relative;">
              <label for="new_rut">RUT *</label>
              <div class="rut-validation-wrapper">
                <input type="text" name="new_rut" id="new_rut" class="form-control" placeholder="Ej: 12.345.678-9" required autocomplete="off">
                <span class="rut-validation-icon" id="rut-icon"><i class="fa-solid fa-circle-check"></i></span>
              </div>
              <div class="rut-format-hint neutral" id="rut-hint">Ingresa el RUT del cliente</div>
              <div class="autocomplete-dropdown" id="rut-autocomplete"></div>
            </div>
            ${_group('Nombres *', `<input type="text" name="new_nombres" class="form-control" placeholder="Ej: Juan Pablo" required>`, 'new_nombres')}
            ${_group('Apellidos *', `<input type="text" name="new_apellidos" class="form-control" placeholder="Ej: Pérez Gómez" required>`, 'new_apellidos')}
            ${_group('Profesión', `<input type="text" name="new_profesion" class="form-control" placeholder="Ej: Arquitecto">`, 'new_profesion')}
            ${_group('Fecha Nacimiento', `<input type="date" name="new_fecha_nacimiento" class="form-control">`, 'new_fecha_nacimiento')}
            ${_group('Dirección', `<input type="text" name="new_direccion" class="form-control" placeholder="Ej: Av. Principal 123">`, 'new_direccion')}
            ${_group('Comuna', `<input type="text" name="new_comuna" class="form-control" placeholder="Ej: Santiago">`, 'new_comuna')}
            ${_group('Teléfono *', `<input type="tel" name="new_telefono" class="form-control" placeholder="Ej: +56 9 1234 5678" required>`, 'new_telefono')}
            ${_group('Correo Electrónico *', `<input type="email" name="new_email" class="form-control" placeholder="Ej: juan.perez@email.com" required>`, 'new_email')}
            ${_group('Estado Civil', `<select name="new_estado_civil" class="form-control">
              <option value="">Seleccione...</option><option value="Soltero">Soltero</option><option value="Casado">Casado</option><option value="Viudo">Viudo</option><option value="Separado">Separado</option>
            </select>`, 'new_estado_civil')}
            ${_group('Régimen Matrimonial', `<select name="new_regimen_matrimonial" class="form-control">
              <option value="">Seleccione...</option><option value="Sociedad Conyugal">Sociedad Conyugal</option><option value="Separación de Bienes">Separación de Bienes</option><option value="Participación en los Gananciales">Participación en los Gananciales</option>
            </select>`, 'new_regimen_matrimonial')}

            <h5 style="margin-top:20px; margin-bottom:12px; font-weight:700; color:var(--text-white); border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-money-bill-wave"></i> Datos de la Oferta</h5>
            ${_group('Precio Ofertado', `<input type="text" name="precio_oferta" class="form-control" value="${precioFmt}" readonly style="background:rgba(255,255,255,0.03); color:var(--text-dim); cursor:not-allowed;" title="Precio de lista oficial. Solo modificable por Gerencia."><small style="display:block; font-size:0.7rem; color:var(--text-dim); margin-top:2px;">(Precio de lista oficial — solo modificable por Gerencia)</small>`, 'precio_oferta')}
            ${_group('Monto Pie / Anticipo', `<input type="text" name="monto_reserva" class="form-control" value="$ 0">`, 'monto_reserva')}
            ${_group('Cant. Cuotas (Financ.)', `<input type="number" name="cantidad_cuotas" class="form-control" placeholder="Ej: 12" min="1" max="120">`, 'cantidad_cuotas')}
            ${_group('Método de Pago', `<select name="metodo_pago" class="form-control">
              <option>Transferencia</option><option>Vale Vista</option><option>Efectivo</option><option>Depósito</option><option>Cheque</option>
            </select>`, 'metodo_pago')}
            ${_group('Notas', `<textarea name="notas" class="form-control" rows="3" placeholder="Observaciones adicionales..."></textarea>`, 'notas')}
            
            <div class="d-flex gap-2" style="margin-top: 10px;">
              <button type="reset" class="btn btn-outline" style="flex: 1;"><i class="fa-solid fa-broom"></i> Limpiar</button>
              <button type="submit" id="frm-pre-reserva-btn" class="btn btn-success" style="flex: 2;"><i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Reserva</button>
            </div>
          </form>
        `;

        // ── RUT Autocomplete & Validation Engine ──────────────────
        const rutInput     = container.querySelector('#new_rut');
        const rutIcon      = container.querySelector('#rut-icon');
        const rutHint      = container.querySelector('#rut-hint');
        const acDropdown   = container.querySelector('#rut-autocomplete');
        const bannerSlot   = container.querySelector('#client-match-banner-slot');
        let   acActiveIdx  = -1;
        let   selectedClientId = null;

        /** Format RUT as user types: 12345678-9 → 12.345.678-9 */
        function _autoFormatRUT(raw) {
          let clean = raw.replace(/[^0-9kK]/gi, '').toUpperCase();
          if (clean.length === 0) return '';
          let dv = '', body = clean;
          if (clean.length > 1) {
            dv = clean.slice(-1);
            body = clean.slice(0, -1);
          }
          let formatted = '';
          let cnt = 0;
          for (let i = body.length - 1; i >= 0; i--) {
            formatted = body[i] + formatted;
            cnt++;
            if (cnt % 3 === 0 && i > 0) formatted = '.' + formatted;
          }
          return clean.length > 1 ? formatted + '-' + dv : formatted;
        }

        /** Search clients by RUT or name */
        function _searchClients(query) {
          const allClientes = APP5T_DB.getAll('clientes') || [];
          if (!query || query.length < 2) return [];
          const q = query.replace(/[\.\-]/g, '').toLowerCase();
          return allClientes.filter(c => {
            const rutMatch = c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase().includes(q);
            const nameMatch = (c.nombres + ' ' + c.apellidos).toLowerCase().includes(q);
            return rutMatch || nameMatch;
          }).slice(0, 6);
        }

        /** Render autocomplete dropdown */
        function _renderAC(matches) {
          if (!matches.length) {
            acDropdown.innerHTML = '';
            acDropdown.classList.remove('visible');
            return;
          }
          acDropdown.innerHTML = matches.map((c, i) => {
            const initials = ((c.nombres || '')[0] || '') + ((c.apellidos || '')[0] || '');
            const rutFmt = c.rut ? APP5T_Utils.formatRUT(c.rut) : '—';
            return `<div class="ac-item${i === acActiveIdx ? ' ac-active' : ''}" data-idx="${i}">
              <div class="ac-avatar">${initials}</div>
              <div class="ac-info">
                <span class="ac-name">${c.nombres || ''} ${c.apellidos || ''}</span>
                <span class="ac-rut">${rutFmt}</span>
              </div>
            </div>`;
          }).join('');
          acDropdown.classList.add('visible');

          // Bind click on items
          acDropdown.querySelectorAll('.ac-item').forEach(item => {
            item.addEventListener('mousedown', (ev) => {
              ev.preventDefault();
              const idx = parseInt(item.dataset.idx, 10);
              _selectClient(matches[idx]);
            });
          });
        }

        /** Auto-fill form fields when a client is selected */
        function _selectClient(cliente) {
          selectedClientId = cliente.id;
          const frm = container.querySelector('#frm-pre-reserva');
          const fields = {
            'new_rut':       APP5T_Utils.formatRUT(cliente.rut || ''),
            'new_nombres':   cliente.nombres || '',
            'new_apellidos': cliente.apellidos || '',
            'new_profesion': cliente.profesion || '',
            'new_fecha_nacimiento': cliente.fecha_nacimiento || '',
            'new_direccion': cliente.direccion || '',
            'new_comuna':    cliente.comuna || '',
            'new_estado_civil': cliente.estado_civil || '',
            'new_regimen_matrimonial': cliente.regimen_matrimonial || '',
            'new_telefono':  cliente.telefono || '',
            'new_email':     cliente.email || ''
          };
          Object.entries(fields).forEach(([name, val]) => {
            const inp = frm.querySelector(`[name="${name}"]`);
            if (inp) {
              inp.value = val;
              // Trigger autofill highlight animation
              const group = inp.closest('.form-group');
              if (group && name !== 'new_rut') {
                group.classList.add('autofill-highlight');
                setTimeout(() => group.classList.remove('autofill-highlight'), 1200);
              }
            }
          });

          // Update RUT validation state
          rutInput.classList.remove('rut-invalid', 'input-error');
          rutInput.classList.add('rut-valid');
          rutIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
          rutIcon.className = 'rut-validation-icon valid';
          rutHint.textContent = APP5T_Utils.formatRUT(cliente.rut);
          rutHint.className = 'rut-format-hint valid';

          // Show match banner
          bannerSlot.innerHTML = `<div class="client-match-banner found">
            <i class="fa-solid fa-user-check" style="font-size:1rem;"></i>
            <span><strong>${cliente.nombres} ${cliente.apellidos}</strong> — cliente existente encontrado</span>
          </div>`;

          // Close dropdown
          acDropdown.classList.remove('visible');
          acActiveIdx = -1;
        }

        /** Clear autofill state */
        function _clearAutofill() {
          selectedClientId = null;
          const frm = container.querySelector('#frm-pre-reserva');
          ['new_nombres', 'new_apellidos', 'new_profesion', 'new_fecha_nacimiento', 'new_direccion', 'new_comuna', 'new_estado_civil', 'new_regimen_matrimonial', 'new_telefono', 'new_email'].forEach(name => {
            const inp = frm.querySelector(`[name="${name}"]`);
            if (inp) inp.value = '';
          });
          bannerSlot.innerHTML = '';
        }

        // ── RUT Input Event Listeners ──
        let rutDebounce = null;
         rutInput.addEventListener('input', () => {
          // Auto-format RUT
          const cursorPos = rutInput.selectionStart;
          const prevLen = rutInput.value.length;
          const formatted = _autoFormatRUT(rutInput.value);
          rutInput.value = formatted;
          // Adjust cursor position after format
          const newLen = formatted.length;
          const diff = newLen - prevLen;
          rutInput.setSelectionRange(cursorPos + diff, cursorPos + diff);

          const clean = APP5T_Utils.limpiarRUT(formatted);

          // Reset selected client if user modifies RUT so it no longer matches the selected client's RUT
          if (selectedClientId !== null) {
            const currentClient = APP5T_DB.getById('clientes', selectedClientId);
            const currentClientRut = currentClient && currentClient.rut ? APP5T_Utils.limpiarRUT(currentClient.rut) : '';
            if (clean !== currentClientRut) {
              _clearAutofill();
            }
          }

          // Real-time RUT validation
          if (clean.length < 2) {
            rutInput.classList.remove('rut-valid', 'rut-invalid');
            rutIcon.className = 'rut-validation-icon';
            rutHint.textContent = 'Ingresa el RUT del cliente';
            rutHint.className = 'rut-format-hint neutral';
          } else if (clean.length >= 7) {
            if (APP5T_Utils.validarRUT(formatted)) {
              rutInput.classList.remove('rut-invalid', 'input-error');
              rutInput.classList.add('rut-valid');
              rutIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
              rutIcon.className = 'rut-validation-icon valid';
              rutHint.textContent = '✓ RUT válido — ' + APP5T_Utils.formatRUT(formatted);
              rutHint.className = 'rut-format-hint valid';
            } else {
              rutInput.classList.remove('rut-valid');
              rutInput.classList.add('rut-invalid');
              rutIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
              rutIcon.className = 'rut-validation-icon invalid';
              rutHint.textContent = '✗ Dígito verificador incorrecto';
              rutHint.className = 'rut-format-hint invalid';
            }
          } else {
            rutInput.classList.remove('rut-valid', 'rut-invalid');
            rutIcon.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
            rutIcon.className = 'rut-validation-icon typing';
            rutHint.textContent = 'Formato: XX.XXX.XXX-X';
            rutHint.className = 'rut-format-hint neutral';
          }

          // Check immediately for exact client match by RUT
          if (clean.length >= 7) {
            const allClientes = APP5T_DB.getAll('clientes') || [];
            const normalRut = clean.toLowerCase();
            const exactMatch = allClientes.find(c => 
              c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase() === normalRut
            );
            if (exactMatch && !selectedClientId) {
              _selectClient(exactMatch);
            }
          }

          // Debounced autocomplete search
          clearTimeout(rutDebounce);
          rutDebounce = setTimeout(() => {
            const matches = _searchClients(formatted);
            acActiveIdx = -1;
            _renderAC(matches);
          }, 180);
        });

        // Keyboard navigation for autocomplete
        rutInput.addEventListener('keydown', (ev) => {
          const items = acDropdown.querySelectorAll('.ac-item');
          if (!items.length || !acDropdown.classList.contains('visible')) return;
          
          if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            acActiveIdx = Math.min(acActiveIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('ac-active', i === acActiveIdx));
          } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            acActiveIdx = Math.max(acActiveIdx - 1, 0);
            items.forEach((el, i) => el.classList.toggle('ac-active', i === acActiveIdx));
          } else if (ev.key === 'Enter' && acActiveIdx >= 0) {
            ev.preventDefault();
            const matches = _searchClients(rutInput.value);
            if (matches[acActiveIdx]) _selectClient(matches[acActiveIdx]);
          } else if (ev.key === 'Escape') {
            acDropdown.classList.remove('visible');
            acActiveIdx = -1;
          }
        });

        // Close dropdown on blur
        rutInput.addEventListener('blur', () => {
          setTimeout(() => {
            acDropdown.classList.remove('visible');
            acActiveIdx = -1;
          }, 200);
        });

        // ── Tipo de Operación toggle ──
        const tipoRadios = container.querySelectorAll('input[name="tipo_operacion"]');
        const formTitle  = container.querySelector('#frm-pre-reserva-title');
        const submitBtn  = container.querySelector('#frm-pre-reserva-btn');
        const groupMontoReserva = container.querySelector('#group-monto_reserva');
        const groupCantidadCuotas = container.querySelector('#group-cantidad_cuotas');
        const tipoHint = container.querySelector('#tipo-operacion-hint');
        
        if (tipoRadios) {
          tipoRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
              container.querySelectorAll('.segment-btn').forEach(lbl => {
                lbl.style.background = 'rgba(255, 255, 255, 0.05)';
                lbl.style.borderColor = 'var(--glass-border)';
                lbl.style.color = 'var(--text-dim)';
              });
              const selectedLbl = e.target.parentElement;
              
              if (e.target.value === 'Venta_Directa') {
                selectedLbl.style.background = 'rgba(243, 156, 18, 0.2)';
                selectedLbl.style.borderColor = 'var(--accent-warning)';
                selectedLbl.style.color = 'var(--text-white)';

                formTitle.textContent = 'Solicitar Venta al Contado (Directa)';
                submitBtn.innerHTML   = '<i class="fa-solid fa-bolt"></i> Enviar Solicitud Venta al Contado';
                submitBtn.className   = 'btn btn-success w-100 mt-3';
                if (tipoHint) {
                  tipoHint.textContent = 'Pago 100% al contado. Pasará directamente a Escritura definitiva (sin cuotas de crédito).';
                  tipoHint.style.borderLeftColor = 'var(--accent-warning)';
                  tipoHint.style.color = '#fde68a';
                  tipoHint.style.background = 'rgba(243, 156, 18, 0.08)';
                }
                
                if (groupMontoReserva) {
                  groupMontoReserva.style.display = 'none';
                  const inp = groupMontoReserva.querySelector('input');
                  if (inp) inp.value = '0';
                }
                if (groupCantidadCuotas) {
                  groupCantidadCuotas.style.display = 'none';
                  const inp = groupCantidadCuotas.querySelector('input');
                  if (inp) inp.value = '0';
                }
              } else if (e.target.value === 'Saldo_Precio') {
                selectedLbl.style.background = 'rgba(155, 89, 182, 0.25)';
                selectedLbl.style.borderColor = '#9b59b6';
                selectedLbl.style.color = 'var(--text-white)';

                formTitle.textContent = 'Solicitar Venta con Saldo de Precio';
                submitBtn.innerHTML   = '<i class="fa-solid fa-landmark"></i> Enviar Solicitud Saldo de Precio';
                submitBtn.className   = 'btn btn-success w-100 mt-3';
                if (tipoHint) {
                  tipoHint.textContent = 'Se escriturará de inmediato con Hipoteca y Prohibición a favor de 5 Tierras, pagando el saldo en cuotas mensuales.';
                  tipoHint.style.borderLeftColor = '#9b59b6';
                  tipoHint.style.color = '#e9d5ff';
                  tipoHint.style.background = 'rgba(155, 89, 182, 0.1)';
                }

                if (groupMontoReserva) {
                  groupMontoReserva.style.display = '';
                  const lbl = groupMontoReserva.querySelector('label');
                  if (lbl) lbl.textContent = 'Pie / Anticipo Inicial';
                  const inp = groupMontoReserva.querySelector('input');
                  if (inp && inp.value === '0') inp.value = '$ 0';
                }
                if (groupCantidadCuotas) {
                  groupCantidadCuotas.style.display = '';
                  const lbl = groupCantidadCuotas.querySelector('label');
                  if (lbl) lbl.textContent = 'Cant. Cuotas Saldo de Precio *';
                }
              } else {
                selectedLbl.style.background = 'rgba(46, 204, 113, 0.2)';
                selectedLbl.style.borderColor = 'var(--accent-green)';
                selectedLbl.style.color = 'var(--text-white)';

                formTitle.textContent = 'Solicitar Promesa en Cuotas';
                submitBtn.innerHTML   = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Reserva';
                submitBtn.className   = 'btn btn-success w-100 mt-3';
                if (tipoHint) {
                  tipoHint.textContent = 'El lote pasará a estado Reservado y requerirá firma de Promesa en cuotas.';
                  tipoHint.style.borderLeftColor = 'var(--accent-green)';
                  tipoHint.style.color = '#a7f3d0';
                  tipoHint.style.background = 'rgba(46, 204, 113, 0.08)';
                }

                if (groupMontoReserva) {
                  groupMontoReserva.style.display = '';
                  const lbl = groupMontoReserva.querySelector('label');
                  if (lbl) lbl.textContent = 'Monto Pie / Anticipo';
                  const inp = groupMontoReserva.querySelector('input');
                  if (inp && inp.value === '0') inp.value = '$ 0';
                }
                if (groupCantidadCuotas) {
                  groupCantidadCuotas.style.display = '';
                  const lbl = groupCantidadCuotas.querySelector('label');
                  if (lbl) lbl.textContent = 'Cant. Cuotas (Financ.)';
                }
              }
            });
          });
        }

        container.querySelector('#frm-pre-reserva').addEventListener('submit', e => {
          e.preventDefault();
          try {
            const frm = e.target;
            const rutVal = frm.querySelector('[name="new_rut"]').value.trim();
            const nombresVal = frm.querySelector('[name="new_nombres"]').value.trim();
            const apellidosVal = frm.querySelector('[name="new_apellidos"]').value.trim();
            const profesionVal = (frm.querySelector('[name="new_profesion"]') || {}).value || '';
            const fechaNacVal = (frm.querySelector('[name="new_fecha_nacimiento"]') || {}).value || '';
            const direccionVal = (frm.querySelector('[name="new_direccion"]') || {}).value || '';
            const comunaVal = (frm.querySelector('[name="new_comuna"]') || {}).value || '';
            const estadoCivilVal = (frm.querySelector('[name="new_estado_civil"]') || {}).value || '';
            const regimenVal = (frm.querySelector('[name="new_regimen_matrimonial"]') || {}).value || '';
            const telVal = frm.querySelector('[name="new_telefono"]').value.trim();
            const emailVal = frm.querySelector('[name="new_email"]').value.trim();

            if (!rutVal) { APP5T_Utils.showToast('RUT del cliente es requerido', 'warning'); return; }
            if (!nombresVal) { APP5T_Utils.showToast('Nombres del cliente son requeridos', 'warning'); return; }
            if (!apellidosVal) { APP5T_Utils.showToast('Apellidos del cliente son requeridos', 'warning'); return; }
            if (!telVal) { APP5T_Utils.showToast('Teléfono del cliente es requerido', 'warning'); return; }
            if (!emailVal) { APP5T_Utils.showToast('Correo electrónico del cliente es requerido', 'warning'); return; }

            // Validaciones de formato
            if (!APP5T_Utils.validarRUT(rutVal)) {
              APP5T_Utils.showToast('RUT inválido (ej: 12.345.678-5)', 'warning');
              frm.querySelector('[name="new_rut"]').classList.add('input-error');
              return;
            }
            frm.querySelector('[name="new_rut"]').classList.remove('input-error');

            if (!APP5T_Utils.validarTelefono(telVal)) {
              APP5T_Utils.showToast('Teléfono inválido', 'warning');
              frm.querySelector('[name="new_telefono"]').classList.add('input-error');
              return;
            }
            frm.querySelector('[name="new_telefono"]').classList.remove('input-error');

            if (!APP5T_Utils.validarEmail(emailVal)) {
              APP5T_Utils.showToast('Email inválido', 'warning');
              frm.querySelector('[name="new_email"]').classList.add('input-error');
              return;
            }
            frm.querySelector('[name="new_email"]').classList.remove('input-error');

            // Determine vendedor
            const vendedores = APP5T_DB.getAll('vendedores') || [];
            const vendActivo = _resolveActiveVendedor(vendedores);
            const idVendedor = vendActivo ? vendActivo.id : 0;

            if (!idVendedor || idVendedor === 0) {
              APP5T_Utils.showToast('Error: No se pudo identificar el vendedor. Espere unos segundos a que termine la sincronización o intente iniciar sesión nuevamente.', 'error');
              return;
            }

            // Use autocomplete-selected client if available, otherwise look up or create
            let idCliente;
            if (selectedClientId) {
              idCliente = selectedClientId;
              // Update contact info in case it was edited after autofill
              APP5T_DB.update('clientes', idCliente, {
                rut: rutVal,
                nombres: nombresVal,
                apellidos: apellidosVal,
                profesion: profesionVal,
                fecha_nacimiento: fechaNacVal,
                direccion: direccionVal,
                comuna: comunaVal,
                estado_civil: estadoCivilVal,
                regimen_matrimonial: regimenVal,
                telefono: telVal,
                email: emailVal
              });
            } else {
              // Check if client with this RUT already exists to avoid duplication
              const existingClients = APP5T_DB.query('clientes', c => c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase() === rutVal.replace(/[\.\-]/g, '').toLowerCase());
              if (existingClients && existingClients.length > 0) {
                idCliente = existingClients[0].id;
                // Update client contact info
                APP5T_DB.update('clientes', idCliente, {
                  nombres: nombresVal,
                  apellidos: apellidosVal,
                  profesion: profesionVal,
                  fecha_nacimiento: fechaNacVal,
                  direccion: direccionVal,
                  comuna: comunaVal,
                  estado_civil: estadoCivilVal,
                  regimen_matrimonial: regimenVal,
                  telefono: telVal,
                  email: emailVal
                });
              } else {
                // Create a brand new client
                const nuevoCliente = {
                  rut: rutVal,
                  nombres: nombresVal,
                  apellidos: apellidosVal,
                  profesion: profesionVal,
                  fecha_nacimiento: fechaNacVal,
                  direccion: direccionVal,
                  comuna: comunaVal,
                  estado_civil: estadoCivilVal,
                  regimen_matrimonial: regimenVal,
                  telefono: telVal,
                  email: emailVal,
                  fecha_ingreso: APP5T_Utils.fechaHoy(),
                  id_vendedor: idVendedor,
                  estado_cliente: 'Activo',
                  canal_captacion: 'Directo'
                };

                const clientInsertRes = APP5T_DB.insert('clientes', nuevoCliente);
                if (clientInsertRes && !clientInsertRes.success) {
                  APP5T_Utils.showToast(`Error al registrar cliente: ${clientInsertRes.error || 'Desconocido'}`, 'error');
                  return;
                }
                idCliente = clientInsertRes.id;
              }
            }

            const operacionVal = frm.querySelector('input[name="tipo_operacion"]:checked') ? frm.querySelector('input[name="tipo_operacion"]:checked').value : 'Reserva';
            const esVentaDirecta = (operacionVal === 'Venta_Directa');
            const payload = {
              valor_final:     APP5T_Utils.parseMoneda(frm.querySelector('[name="precio_oferta"]').value),
              pie:             esVentaDirecta ? 0 : APP5T_Utils.parseMoneda(frm.querySelector('[name="monto_reserva"]').value),
              cantidad_cuotas: parseInt(frm.querySelector('[name="cantidad_cuotas"]')?.value, 10) || 0,
              metodo_pago:     frm.querySelector('[name="metodo_pago"]').value,
              notas:           frm.querySelector('[name="notas"]').value,
              tipo_operacion:  operacionVal
            };

            const res = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al solicitar habilitación: ${res.error || 'Desconocido'}`, 'error');
              return;
            }
            let msgToast = 'Habilitación de reserva solicitada al Gerente 💰';
            if (esVentaDirecta) {
              msgToast = 'Solicitud de Venta al Contado enviada al Gerente ⚡';
            } else if (operacionVal === 'Saldo_Precio') {
              msgToast = 'Solicitud de Venta con Saldo de Precio enviada al Gerente 🏛️';
            }
            APP5T_Utils.showToast(msgToast, 'success');
            if (window.APP5T && typeof window.APP5T._sendWhatsAppGerencia === 'function') {
              window.APP5T._sendWhatsAppGerencia(res.id_negociacion, propiedad.id, idCliente);
            }
            if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            window.APP5T.closeModal(true);
          } catch (err) {
            console.error(err);
            alert(`Error al solicitar habilitación: ${err.message}`);
          }
        });
        return;
      }
    }

    // ── PENDIENTE + gerente ───────────────────────────
    if (estado === 'Pendiente' && role === 'gerente') {
      // Find the negociación for this property
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id) && n.estado_avance === 'En Curso');
      const neg = negs && negs.length ? negs[0] : null;
      const cliente = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const clienteNom = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : 'Sin cliente';
      const monto = neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '$ 0';
      const precioOf = neg ? APP5T_Utils.formatMoneda(neg.valor_final || 0) : '$ 0';
      const precioLista = propiedad.valor_final || 0;
      const precioOfNum = neg ? (neg.valor_final || 0) : 0;
      const margen = precioLista > 0 ? (((precioOfNum - precioLista) / precioLista) * 100).toFixed(1) : '0.0';

      container.innerHTML = `
        <div class="lote-ficha accent-warning">
          <div class="lote-ficha-header">
            <i class="fa-solid fa-stamp"></i>
            <h4>Aprobación de Reserva</h4>
          </div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">${clienteNom}</span></div>
            <div class="info-item"><span class="info-label">Abono:</span> <span class="info-value">${monto}</span></div>
            <div class="info-item"><span class="info-label">Precio Final:</span> <span class="info-value">${precioOf}</span></div>
            <div class="info-item"><span class="info-label">Margen:</span> <span class="info-value">${margen}%</span></div>
          </div>
          <div style="margin-top: 15px;">
            <button type="button" id="btn-ir-aprobaciones" class="btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700; padding: 12px; background: rgba(238, 93, 80, 0.08); border: 1.5px solid var(--accent-red); color: var(--accent-red); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 8px rgba(238, 93, 80, 0.1);" onmouseover="this.style.background='rgba(238, 93, 80, 0.18)'; this.style.color='#ffffff';" onmouseout="this.style.background='rgba(238, 93, 80, 0.08)'; this.style.color='var(--accent-red)';">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-red); display: inline-block; animation: blink-amber 1.5s infinite; box-shadow: 0 0 6px var(--accent-red);"></span>
              Aprobación Pendiente
            </button>
          </div>
        </div>`;

      const btnGo = container.querySelector('#btn-ir-aprobaciones');
      if (btnGo) {
        btnGo.addEventListener('click', () => {
          if (window.APP5T && typeof window.APP5T.switchTab === 'function') {
            window.APP5T.switchTab('aprobaciones');
          }
        });
      }
      return;
    }

    // ── PENDIENTE + vendedor ───────────────────────────
    if (estado === 'Pendiente' && role === 'vendedor') {
      container.innerHTML = `
        <div class="lote-ficha accent-warning">
          <div class="lote-ficha-header">
            <i class="fa-solid fa-hourglass-half"></i>
            <h4>Reserva Pendiente</h4>
          </div>
          <p class="info-text-box warning">
            <i class="fa-solid fa-circle-info"></i>
            <span>La solicitud de habilitación para este lote fue enviada al Gerente y se encuentra en proceso de revisión.</span>
          </p>
          <div class="info-grid-vertical" style="margin-top: 5px;">
            <div><span style="color:var(--text-dim);">Estado actual:</span> <strong style="color:var(--text-light);">En espera de aprobación por Gerencia.</strong></div>
          </div>
        </div>`;
      return;
    }

    // ── RESERVADA ─────────────────────────────────────
    if (estado === 'Reservada') {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id) && n.id_proceso === 'Reserva' && (n.estado_avance === 'Aprobado' || n.estado_avance === 'En Curso'));
      const neg = negs && negs.length ? negs[0] : null;
      const hasClient = neg && neg.id_cliente > 0;

      // Case A: Salesperson or Manager, and the client details are not yet complete
      if ((role === 'vendedor' || role === 'gerente') && !hasClient) {
        const clientes = (APP5T_DB.getAll('clientes') || []).filter(c => c.estado_cliente === 'Activo');
        const precioFmt = APP5T_Utils.formatMoneda(propiedad.valor_final || 0);
        const montoReservaFmt = propiedad.abono ? APP5T_Utils.formatMoneda(propiedad.abono) : '$ 200.000';
        let clienteOpts = `<option value="">— Seleccionar cliente —</option>`;
        clientes.forEach(c => {
          const lbl = `${c.nombres || ''} ${c.apellidos || ''} (${c.rut || 'S/RUT'})`;
          clienteOpts += `<option value="${c.id}">${lbl}</option>`;
        });

        container.innerHTML = `
          <form id="frm-completar-reserva" class="lote-ficha accent-orange">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-user-pen"></i>
              <h4>Completar Datos de Reserva</h4>
            </div>
            <p class="info-text-box">
              <i class="fa-solid fa-circle-info"></i>
              <span>Este lote ha sido habilitado por Gerencia. Por favor ingresa los datos del cliente para finalizar la reserva.</span>
            </p>

            <div class="form-group">
              <label>Cliente Asignado *</label>
              <div style="display: flex; gap: 8px; align-items: center; width: 100%;">
                <button type="button" id="btn-toggle-new-client" class="btn btn-primary" style="padding: 0 12px; height: 38px; min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; border-radius: var(--radius-sm);" title="Registrar Nuevo Cliente">
                  <span style="font-size: 1.1rem; font-weight: bold; line-height: 1;">+</span><i class="fa-solid fa-user" style="font-size: 0.9rem;"></i>
                </button>
                <select name="id_cliente" class="form-control" required style="flex: 1; min-height: 38px; height: 38px;">${clienteOpts}</select>
              </div>
            </div>
            
            <div id="new-client-fields" style="display:none; margin: 5px 0 15px; padding: 15px; background: var(--bg-hover); border: 1px dashed var(--glass-border2); border-radius: var(--radius-md);">
              <h5 style="margin-top:0; margin-bottom:12px; font-weight:700; color:var(--text-white); border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-user-plus"></i> Datos del Nuevo Cliente</h5>
              ${_group('Nombres *', `<input type="text" name="new_nombres" class="form-control" placeholder="Ej: Juan Pablo">`, 'new_nombres')}
              ${_group('Apellidos *', `<input type="text" name="new_apellidos" class="form-control" placeholder="Ej: Pérez Gómez">`, 'new_apellidos')}
              ${_group('Profesión', `<input type="text" name="new_profesion" class="form-control" placeholder="Ej: Arquitecto">`, 'new_profesion')}
              ${_group('Fecha Nacimiento', `<input type="date" name="new_fecha_nacimiento" class="form-control">`, 'new_fecha_nacimiento')}
              ${_group('Dirección', `<input type="text" name="new_direccion" class="form-control" placeholder="Ej: Av. Principal 123">`, 'new_direccion')}
              ${_group('Comuna', `<input type="text" name="new_comuna" class="form-control" placeholder="Ej: Santiago">`, 'new_comuna')}
              ${_group('Teléfono *', `<input type="tel" name="new_telefono" class="form-control" placeholder="Ej: +56 9 1234 5678">`, 'new_telefono')}
              ${_group('Correo Electrónico *', `<input type="email" name="new_email" class="form-control" placeholder="Ej: juan.perez@email.com">`, 'new_email')}
              ${_group('Estado Civil', `<select name="new_estado_civil" class="form-control">
                <option value="">Seleccione...</option><option value="Soltero">Soltero</option><option value="Casado">Casado</option><option value="Viudo">Viudo</option><option value="Separado">Separado</option>
              </select>`, 'new_estado_civil')}
              ${_group('Régimen Matrimonial', `<select name="new_regimen_matrimonial" class="form-control">
                <option value="">Seleccione...</option><option value="Sociedad Conyugal">Sociedad Conyugal</option><option value="Separación de Bienes">Separación de Bienes</option><option value="Participación en los Gananciales">Participación en los Gananciales</option>
              </select>`, 'new_regimen_matrimonial')}
            </div>

            ${_group('Precio Ofertado', `<input type="text" name="precio_oferta" class="form-control" value="${precioFmt}" ${role === 'vendedor' ? 'readonly style="background:rgba(255,255,255,0.03); color:var(--text-dim); cursor:not-allowed;" title="Precio de lista oficial. Solo modificable por Gerencia."' : ''}>${role === 'vendedor' ? '<small style="display:block; font-size:0.7rem; color:var(--text-dim); margin-top:2px;">(Precio de lista oficial — solo modificable por Gerencia)</small>' : ''}`, 'precio_oferta')}
            ${_group('Monto Reserva', `<input type="text" name="monto_reserva" class="form-control" value="$ 0">`, 'monto_reserva')}
            ${_group('Método de Pago', `<select name="metodo_pago" class="form-control">
              <option>Transferencia</option><option>Vale Vista</option><option>Efectivo</option><option>Depósito</option><option>Cheque</option>
            </select>`, 'metodo_pago')}
            ${_group('Notas', `<textarea name="notas" class="form-control" rows="3" placeholder="Observaciones adicionales..."></textarea>`, 'notas')}
            
            ${role === 'gerente' ? `
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="submit" class="btn btn-primary" style="flex: 1;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
                <button type="button" id="btn-gerente-cancelar-reserva" class="btn btn-danger" style="flex: 1;"><i class="fa-solid fa-xmark"></i> Rechazar / Anular</button>
              </div>
            ` : `
              <button type="submit" class="btn btn-primary" style="width: 100%;"><i class="fa-solid fa-floppy-disk"></i> Guardar Reserva</button>
            `}
          </form>`;

        const btnToggle = container.querySelector('#btn-toggle-new-client');
        const selectCliente = container.querySelector('[name="id_cliente"]');
        const newClientFields = container.querySelector('#new-client-fields');
        const newClientInputs = newClientFields.querySelectorAll('input, select');

        btnToggle.addEventListener('click', () => {
          const isNewActive = newClientFields.style.display === 'none';
          if (isNewActive) {
            newClientFields.style.display = 'block';
            selectCliente.value = '';
            selectCliente.setAttribute('disabled', '');
            selectCliente.removeAttribute('required');
            newClientInputs.forEach(input => {
              if (input.name === 'new_nombres' || input.name === 'new_apellidos' || input.name === 'new_telefono' || input.name === 'new_email') input.setAttribute('required', '');
            });
          } else {
            newClientFields.style.display = 'none';
            selectCliente.removeAttribute('disabled');
            selectCliente.setAttribute('required', '');
            newClientInputs.forEach(input => {
              input.removeAttribute('required');
              input.classList.remove('input-error');
            });
          }
        });

        // btn-gerente-cancelar-reserva event listener
        if (role === 'gerente' && neg) {
          const btnCancel = container.querySelector('#btn-gerente-cancelar-reserva');
          if (btnCancel) {
            btnCancel.addEventListener('click', () => {
              try {
                if (!confirm('¿Desea rechazar y anular esta reserva habilitada?')) return;
                const res = APP5T_DB.rechazarReserva(neg.id, 'Anulado por Gerente desde panel Completar Reserva');
                if (res && !res.success) {
                  APP5T_Utils.showToast(`Error al anular reserva: ${res.error}`, 'error');
                  return;
                }
                APP5T_Utils.showToast('Reserva anulada y lote disponible', 'success');
                if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
                if (window.APP5T && window.APP5T.onLoteSelected) {
                  const updatedLote = APP5T_DB.getById('propiedades', propiedad.id);
                  window.APP5T.onLoteSelected(updatedLote);
                }
              } catch (err) {
                console.error(err);
                alert(`Error al anular reserva: ${err.message}`);
              }
            });
          }
        }

        container.querySelector('#frm-completar-reserva').addEventListener('submit', e => {
          e.preventDefault();
          try {
            const frm = e.target;
            const isNewClient = newClientFields.style.display === 'block';
            let idCliente = '';
            if (isNewClient) {
              idCliente = 'NUEVO';
            } else {
              idCliente = frm.querySelector('[name="id_cliente"]').value;
            }
            if (!idCliente && !isNewClient) { APP5T_Utils.showToast('Seleccione un cliente', 'warning'); return; }

            // Determine vendedor
            const vendedores = APP5T_DB.getAll('vendedores') || [];
            const vendActivo = _resolveActiveVendedor(vendedores);
            const idVendedor = vendActivo ? vendActivo.id : 0;

            if (!idVendedor || idVendedor === 0) {
              APP5T_Utils.showToast('Error: No se pudo identificar el vendedor. Espere unos segundos a que termine la sincronización o intente iniciar sesión nuevamente.', 'error');
              return;
            }

            // Si se seleccionó registrar un nuevo cliente exprés
            if (isNewClient) {
              const rutVal = frm.querySelector('[name="new_rut"]').value.trim();
              const nombresVal = frm.querySelector('[name="new_nombres"]').value.trim();
              const apellidosVal = frm.querySelector('[name="new_apellidos"]').value.trim();
              const telVal = frm.querySelector('[name="new_telefono"]').value.trim();
              const emailVal = frm.querySelector('[name="new_email"]').value.trim();

              if (!rutVal) { APP5T_Utils.showToast('RUT del cliente es requerido', 'warning'); return; }
              if (!nombresVal) { APP5T_Utils.showToast('Nombres del cliente son requeridos', 'warning'); return; }
              if (!apellidosVal) { APP5T_Utils.showToast('Apellidos del cliente son requeridos', 'warning'); return; }
              if (!telVal) { APP5T_Utils.showToast('Teléfono del cliente es requerido', 'warning'); return; }
              if (!emailVal) { APP5T_Utils.showToast('Correo electrónico del cliente es requerido', 'warning'); return; }

              // Validaciones de formato
              if (!APP5T_Utils.validarRUT(rutVal)) {
                APP5T_Utils.showToast('RUT inválido (ej: 12.345.678-5)', 'warning');
                frm.querySelector('[name="new_rut"]').classList.add('input-error');
                return;
              }
              frm.querySelector('[name="new_rut"]').classList.remove('input-error');

              if (!APP5T_Utils.validarTelefono(telVal)) {
                APP5T_Utils.showToast('Teléfono inválido', 'warning');
                frm.querySelector('[name="new_telefono"]').classList.add('input-error');
                return;
              }
              frm.querySelector('[name="new_telefono"]').classList.remove('input-error');

              if (!APP5T_Utils.validarEmail(emailVal)) {
                APP5T_Utils.showToast('Email inválido', 'warning');
                frm.querySelector('[name="new_email"]').classList.add('input-error');
                return;
              }
              frm.querySelector('[name="new_email"]').classList.remove('input-error');

              // Validar RUT duplicado
              const allClientes = APP5T_DB.getAll('clientes') || [];
              const normalRut = rutVal.replace(/[\.\-]/g, '').toLowerCase();
              const existe = allClientes.some(c => c.rut && c.rut.replace(/[\.\-]/g, '').toLowerCase() === normalRut);
              if (existe) {
                APP5T_Utils.showToast('Ya existe un cliente registrado con ese RUT', 'warning');
                frm.querySelector('[name="new_rut"]').classList.add('input-error');
                return;
              }

              // Crear objeto del nuevo cliente
              const nuevoCliente = {
                rut: rutVal,
                nombres: nombresVal,
                apellidos: apellidosVal,
                telefono: telVal,
                email: emailVal,
                fecha_ingreso: APP5T_Utils.fechaHoy(),
                id_vendedor: idVendedor,
                estado_cliente: 'Activo',
                canal_captacion: 'Directo'
              };

              const clientInsertRes = APP5T_DB.insert('clientes', nuevoCliente);
              if (clientInsertRes && !clientInsertRes.success) {
                APP5T_Utils.showToast(`Error al registrar cliente: ${clientInsertRes.error || 'Desconocido'}`, 'error');
                return;
              }
              idCliente = clientInsertRes.id;
            }

            const payload = {
              id_cliente: idCliente,
              valor_final: APP5T_Utils.parseMoneda(frm.querySelector('[name="precio_oferta"]').value),
              pie: APP5T_Utils.parseMoneda(frm.querySelector('[name="monto_reserva"]').value),
              metodo_pago: frm.querySelector('[name="metodo_pago"]').value,
              notas: frm.querySelector('[name="notas"]').value
            };

            // Update negotiation directly
            const res = APP5T_DB.update('negociaciones', neg.id, payload);
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al guardar datos de reserva: ${res.error || 'Desconocido'}`, 'error');
              return;
            }
            APP5T_Utils.showToast('Reserva completada exitosamente', 'success');
            if (window.APP5T && typeof window.APP5T._sendWhatsAppGerencia === 'function') {
              window.APP5T._sendWhatsAppGerencia(neg.id, propiedad.id, idCliente);
            }
            if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            window.APP5T.closeModal(true);
          } catch (err) {
            console.error(err);
            alert(`Error al guardar datos de reserva: ${err.message}`);
          }
        });
        return;
      }

      // Case B: Client details are already complete, and the role is Administrador (Firma Promesa)
            // Case B: Client details are already complete, and the role is Administrador (Firma Promesa)
      if (role === 'administrador') {
        if (!hasClient) {
          container.innerHTML = `
            <div class="lote-ficha accent-orange">
              <div class="lote-ficha-header">
                <i class="fa-solid fa-hourglass-half"></i>
                <h4>Firma de Promesa</h4>
              </div>
              <p class="info-text-box warning">
                <i class="fa-solid fa-circle-info"></i>
                <span>La reserva ha sido aprobada por Gerencia, pero a&uacute;n est&aacute; pendiente que el vendedor complete los datos del cliente.</span>
              </p>
            </div>`;
          return;
        }

        const hoyISO = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthISO = nextMonth.toISOString().split('T')[0];

        container.innerHTML = `
          <form id="frm-promesa" class="lote-ficha accent-orange">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-file-signature"></i>
              <h4>Firmar Promesa de Compraventa</h4>
            </div>
            ${_group('Fecha Promesa', `<input type="date" name="fecha_promesa" class="form-control" value="${hoyISO}">`, 'fecha_promesa')}
            ${_group('Notar\u00eda', `<input type="text" name="notaria" class="form-control" placeholder="Ej: Notar\u00eda San Carlos">`, 'notaria')}
            
            <h5 style="margin-top:15px; margin-bottom:10px; font-weight:700; color:var(--text-white); border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; font-size: 0.8rem; text-transform: uppercase;"><i class="fa-solid fa-calculator"></i> Plan de Pagos</h5>
            ${_group('Cantidad de Cuotas *', `<input type="number" name="cantidad_cuotas" class="form-control" value="12" min="1" required>`, 'cantidad_cuotas')}
            ${_group('Vencimiento Primera Cuota *', `<input type="date" name="fecha_vencimiento_cuota" class="form-control" value="${nextMonthISO}" required>`, 'fecha_vencimiento_cuota')}
            
            <button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>
          </form>`;

        container.querySelector('#btn-submit-promesa').addEventListener('click', e => {
          e.preventDefault();
          try {
            const frm = container.querySelector('#frm-promesa');
            
            const toDdMmYyyy = yyyyMmDd => {
              if (!yyyyMmDd) return '';
              const parts = yyyyMmDd.split('-');
              if (parts.length !== 3) return yyyyMmDd;
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            };

            const fPromesa = toDdMmYyyy(frm.querySelector('[name="fecha_promesa"]').value);
            const fVencCuota = toDdMmYyyy(frm.querySelector('[name="fecha_vencimiento_cuota"]').value);
            const cantCuotas = parseInt(frm.querySelector('[name="cantidad_cuotas"]').value, 10) || 0;

            if (cantCuotas <= 0) {
              APP5T_Utils.showToast('La cantidad de cuotas debe ser mayor a 0', 'warning');
              return;
            }

            const res = APP5T_DB.firmarPromesa(neg.id, {
              fecha_promesa: fPromesa,
              notaria: frm.querySelector('[name="notaria"]').value,
              cantidad_cuotas: cantCuotas,
              fecha_vencimiento_cuota: fVencCuota,
              fecha_fin_promesa: fPromesa
            });
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al firmar promesa: ${res.error || 'Desconocido'}`, 'error');
              return;
            }
            APP5T_Utils.showToast('Promesa firmada exitosamente', 'success');
            if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            window.APP5T.closeModal(true);
          } catch (err) {
            console.error(err);
            alert(`Error al firmar promesa: ${err.message}`);
          }
        });
        return;
      }

      // Case C: Vendedor or Gerente viewing a fully completed reservation (info panel)
      if (hasClient) {
        const cliente = APP5T_DB.getById('clientes', neg.id_cliente);
        const clienteNom = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : '—';
        const clienteRut = cliente ? (cliente.rut || '—') : '—';
        const clienteMail = cliente ? (cliente.email || '—') : '—';
        const clienteFono = cliente ? (cliente.telefono || '—') : '—';

        const vendedor = APP5T_DB.getById('vendedores', neg.id_vendedor);
        const vendedorNom = vendedor ? vendedor.nombre : '—';
        const fechaReserva = neg.fecha_solicitud || neg.created_at || '—';
        
        container.innerHTML = `
          <div class="lote-ficha accent-orange">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-circle-check" style="color: var(--accent-orange);"></i>
              <h4>Reserva Completada</h4>
            </div>
            <div class="info-grid-vertical" style="margin-top:10px;">
              <div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">${clienteNom}</span></div>
              <div class="info-item"><span class="info-label">RUT:</span> <span class="info-value">${clienteRut}</span></div>
              <div class="info-item"><span class="info-label">Correo:</span> <span class="info-value">${clienteMail}</span></div>
              <div class="info-item"><span class="info-label">Teléfono:</span> <span class="info-value">${clienteFono}</span></div>
              <hr style="border:none; border-top:1px solid rgba(255,255,255,0.05); margin:6px 0;">
              <div class="info-item"><span class="info-label">Vendedor:</span> <span class="info-value">${vendedorNom}</span></div>
              <div class="info-item"><span class="info-label">Monto Reserva:</span> <span class="info-value">${APP5T_Utils.formatMoneda(neg.pie || neg.monto_reserva || 0)}</span></div>
              <div class="info-item"><span class="info-label">Precio Final:</span> <span class="info-value">${APP5T_Utils.formatMoneda(neg.valor_final || propiedad.valor_final || 0)}</span></div>
              <div class="info-item"><span class="info-label">Fecha Solicitud:</span> <span class="info-value">${APP5T_Utils.formatFecha(fechaReserva)}</span></div>
            </div>
            <p class="info-text-box">
              <i class="fa-solid fa-circle-info"></i>
              <span>Estado actual: En espera de firma de promesa (Operación Legal).</span>
            </p>
          </div>`;
        return;
      }
    }

    // ── VENTA_DIRECTA + vendedor (solo lectura) ──────
    if (estado === 'Venta_Directa' && role === 'vendedor') {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id) && n.id_proceso === 'Venta_Directa');
      const neg = negs && negs.length ? negs[0] : null;
      const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '—';
      const valorFmt = APP5T_Utils.formatMoneda(neg ? neg.valor_final : propiedad.valor_final);

      container.innerHTML = `
        <div class="lote-ficha" style="border-left:4px solid var(--accent-purple, #8b5cf6); padding:15px;">
          <div class="lote-ficha-header" style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-bolt" style="color:var(--accent-purple, #8b5cf6); font-size:1.25rem;"></i>
            <h4 style="margin:0; color:var(--text-white); font-size:1.1rem; font-weight:700;">Venta Directa Aprobada</h4>
          </div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">${cliNom}</span></div>
            <div class="info-item"><span class="info-label">Valor:</span> <span class="info-value">${valorFmt}</span></div>
          </div>
          <p class="info-text-box">
            <i class="fa-solid fa-circle-info"></i>
            <span>Venta Directa aprobada por Gerencia. Pendiente de escrituración por Administración.</span>
          </p>
        </div>`;
      return;
    }

    // ── PROMESADA + vendedor/gerente ──────────────────
    if (estado === 'Promesada' && (role === 'vendedor' || role === 'gerente')) {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id) && n.id_proceso === 'Promesa');
      const neg = negs && negs.length ? negs[negs.length - 1] : null;
      const anyNeg = neg || (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id))).pop();

      if (anyNeg) {
        const cliente = APP5T_DB.getById('clientes', anyNeg.id_cliente);
        const clienteNom = cliente ? `${cliente.nombres || ''} ${cliente.apellidos || ''}` : '—';
        const clienteRut = cliente ? (cliente.rut || '—') : '—';
        const clienteMail = cliente ? (cliente.email || '—') : '—';
        const clienteFono = cliente ? (cliente.telefono || '—') : '—';
        
        const vendedor = APP5T_DB.getById('vendedores', anyNeg.id_vendedor);
        const vendedorNom = vendedor ? vendedor.nombre : '—';
        const fechaPromesa = anyNeg.fecha_promesa || anyNeg.created_at || '—';
        const precioFinal = anyNeg.valor_final || propiedad.valor_final || 0;
        const abono = anyNeg.pie || anyNeg.monto_reserva || 0;

        container.innerHTML = `
          <div class="lote-ficha accent-blue">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-file-contract" style="color: var(--accent-blue);"></i>
              <h4>Promesa Firmada</h4>
            </div>
            <div class="info-grid-vertical" style="margin-top:10px;">
              <div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">${clienteNom}</span></div>
              <div class="info-item"><span class="info-label">RUT:</span> <span class="info-value">${clienteRut}</span></div>
              <div class="info-item"><span class="info-label">Correo:</span> <span class="info-value">${clienteMail}</span></div>
              <div class="info-item"><span class="info-label">Teléfono:</span> <span class="info-value">${clienteFono}</span></div>
              <hr style="border:none; border-top:1px solid rgba(255,255,255,0.05); margin:6px 0;">
              <div class="info-item"><span class="info-label">Vendedor:</span> <span class="info-value">${vendedorNom}</span></div>
              <div class="info-item"><span class="info-label">Monto Reserva/Abono:</span> <span class="info-value">${APP5T_Utils.formatMoneda(abono)}</span></div>
              <div class="info-item"><span class="info-label">Precio Final Venta:</span> <span class="info-value">${APP5T_Utils.formatMoneda(precioFinal)}</span></div>
              <div class="info-item"><span class="info-label">Fecha Promesa:</span> <span class="info-value">${APP5T_Utils.formatFecha(fechaPromesa)}</span></div>
            </div>
            <p class="info-text-box">
              <i class="fa-solid fa-circle-info"></i>
              <span>Promesa de compraventa firmada. Pendiente de escrituración por Administración.</span>
            </p>
          </div>`;
        return;
      } else {
        container.innerHTML = `
          <div class="lote-ficha accent-blue">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-file-contract" style="color: var(--accent-blue);"></i>
              <h4>Promesa Firmada</h4>
            </div>
            <p class="info-text-box warning" style="margin-top: 10px;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>No se encontraron detalles de la negociación asociados a este lote promesado.</span>
            </p>
          </div>
        `;
        return;
      }
    }

    // ── PROMESADA + administrador ─────────────────────
    if (estado === 'Promesada' && role === 'administrador') {
      const hoy = APP5T_Utils.fechaHoy();
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id));
      const neg = negs && negs.length ? negs[0] : null;

      const cuotas = APP5T_DB.query('cuenta_corriente', c => String(c.id_propiedad) === String(propiedad.id));
      const cuotasPendientes = cuotas.filter(c => c.estado_cuota !== 'Pagada');

      if (cuotasPendientes.length > 0) {
        container.innerHTML = `
          <div class="lote-ficha accent-red">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <h4>Bloqueo de Escrituración</h4>
            </div>
            <p class="info-text-box warning" style="margin-top: 10px;">
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>No se puede firmar escritura. El cliente mantiene <strong>${cuotasPendientes.length} cuotas pendientes</strong> de pago.</span>
            </p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <form id="frm-escritura" class="lote-ficha accent-blue">
            <div class="lote-ficha-header">
              <i class="fa-solid fa-gavel"></i>
              <h4>Firmar Escritura Pública</h4>
            </div>
            ${_group('Fecha Escritura', `<input type="date" name="fecha_escritura" class="form-control" value="${hoy}">`, 'fecha_escritura')}
            ${_group('Fojas', `<input type="text" name="fojas" class="form-control" placeholder="Ej: 1234">`, 'fojas')}
            ${_group('Notaría', `<input type="text" name="notaria" class="form-control" placeholder="Notaría de inscripción">`, 'notaria')}
            <button type="submit" class="btn btn-danger"><i class="fa-solid fa-scale-balanced"></i> Firmar Escritura</button>
          </form>`;
      }

      const frmEscritura = container.querySelector('#frm-escritura');
      if (frmEscritura) {
        frmEscritura.addEventListener('submit', e => {
          e.preventDefault();
          try {
            const frm = e.target;
            if (!neg) { APP5T_Utils.showToast('No se encontró negociación asociada', 'error'); return; }
            const res = APP5T_DB.firmarEscritura(neg.id, {
              fecha_escritura: frm.querySelector('[name="fecha_escritura"]').value,
              fojas: frm.querySelector('[name="fojas"]').value,
              notaria: frm.querySelector('[name="notaria"]').value
            });
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al firmar escritura: ${res.error || 'Desconocido'}`, 'error');
              return;
            }
            APP5T_Utils.showToast('Escritura firmada — Lote vendido', 'success');
            if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            window.APP5T.closeModal(true);
          } catch (err) {
            console.error(err);
            alert(`Error al firmar escritura: ${err.message}`);
          }
        });
      }
      return;
    }

    // ── VENTA_DIRECTA + administrador ────────────────
    if (estado === 'Venta_Directa' && role === 'administrador') {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id) && n.id_proceso === 'Venta_Directa');
      const neg = negs && negs.length ? negs[0] : null;
      const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';
      const valorFmt = APP5T_Utils.formatMoneda(neg ? neg.valor_final : propiedad.valor_final);

      container.innerHTML = `
        <div class="lote-ficha" style="border-left:4px solid var(--accent-purple, #8b5cf6); padding:15px;">
          <div class="lote-ficha-header" style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-bolt" style="color:var(--accent-purple, #8b5cf6); font-size:1.25rem;"></i>
            <h4 style="margin:0; color:var(--text-white); font-size:1.1rem; font-weight:700;">Venta Directa — Pendiente Escrituración</h4>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,.05); padding-bottom:6px;">
              <span style="color:var(--text-dim);font-size:0.85rem;">Cliente</span>
              <span style="color:var(--text-white);font-weight:600;">${cliNom}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,.05); padding-bottom:6px;">
              <span style="color:var(--text-dim);font-size:0.85rem;">Valor Total</span>
              <span style="color:#2ecc71;font-weight:700;">${valorFmt}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:var(--text-dim);font-size:0.85rem;">Estado</span>
              <span class="tag tag-venta-directa"><i class="fa-solid fa-bolt"></i> Venta Directa</span>
            </div>
          </div>
          <button type="button" id="btn-escritura-directa" class="btn" style="width:100%;background:var(--accent-purple,#8b5cf6);color:#fff;font-size:0.95rem;">
            <i class="fa-solid fa-gavel"></i> Registrar Escrituración
          </button>
        </div>`;

      container.querySelector('#btn-escritura-directa').addEventListener('click', () => {
        if (window.APP5T && window.APP5T._signEscrituraDirecta) {
          window.APP5T._signEscrituraDirecta(propiedad.id);
        }
      });
      return;
    }

    // ── BLOQUEADA ─────────────────────────────────────
    if (estado === 'Bloqueado' || estado === 'Bloqueada') {
      if (role === 'gerente') {
        container.innerHTML = `
          <div class="form-card locked-panel" style="border-left: 4px solid var(--text-dim, #718096);">
            <div class="locked-icon" style="color: var(--text-dim);"><i class="fa-solid fa-ban"></i></div>
            <h4>LOTE BLOQUEADO</h4>
            <p style="font-size: 0.82rem; line-height: 1.4; color: var(--text-dim); text-align: center; margin-bottom: 15px;">
              Este lote se encuentra bloqueado administrativamente y no está disponible para ventas.
            </p>
            <button type="button" id="btn-gerente-bloquear" class="btn btn-success" style="width: 100%;"><i class="fa-solid fa-unlock"></i> Desbloquear Propiedad</button>
          </div>
        `;

        container.querySelector('#btn-gerente-bloquear').addEventListener('click', () => {
          try {
            if (!confirm(`¿Desea desbloquear el ${propiedad.nombre} y ponerlo Disponible para ventas?`)) return;
            const res = APP5T_DB.update('propiedades', propiedad.id, { estado: 'Disponible' });
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al desbloquear lote: ${res.error}`, 'error');
              return;
            }
            APP5T_Utils.showToast('Lote desbloqueado y disponible para la venta 🔓', 'success');
            if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
            // Re-select lote to refresh panel
            if (window.APP5T && window.APP5T.onLoteSelected) {
              const updatedLote = APP5T_DB.getById('propiedades', propiedad.id);
              window.APP5T.onLoteSelected(updatedLote);
            }
          } catch (err) {
            console.error(err);
            alert(`Error al desbloquear lote: ${err.message}`);
          }
        });
        return;
      } else {
        container.innerHTML = `
          <div class="form-card locked-panel">
            <div class="locked-icon"><i class="fa-solid fa-lock"></i></div>
            <h4>LOTE BLOQUEADO</h4>
            <p style="font-size: 0.8rem; line-height: 1.4; color: var(--text-dim); text-align: center;">
              Este lote está reservado administrativamente por la gerencia y no está disponible para reserva.
            </p>
          </div>
        `;
        return;
      }
    }

    // ── VENDIDA (any role) ────────────────────────────
    if (estado === 'Vendida') {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id)) || [];
      const neg = negs.length ? negs[negs.length - 1] : null;
      let cliente = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      if (!cliente && propiedad.id_cliente) {
        cliente = APP5T_DB.getById('clientes', propiedad.id_cliente);
      }
      let clienteNombre = '—';
      if (cliente) {
        if (cliente.apellidos && !cliente.nombres.toLowerCase().includes(cliente.apellidos.toLowerCase()) && cliente.apellidos !== 'Inversiones' && cliente.apellidos !== 'Particular' && cliente.apellidos !== '—') {
          clienteNombre = `${cliente.nombres} ${cliente.apellidos}`.trim();
        } else {
          clienteNombre = cliente.nombres || '—';
        }
      } else if (propiedad.comprador) {
        clienteNombre = propiedad.comprador;
      }
      const fechaVenta = propiedad.fecha_venta || (neg && (neg.fecha_escritura || neg.fecha_negociacion || neg.fecha_promesa)) || '—';
      const precioFinal = APP5T_Utils.formatMoneda((neg && neg.valor_final) ? neg.valor_final : (propiedad.valor_final || 0));

      container.innerHTML = `
        <div class="lote-ficha locked-panel">
          <div class="locked-icon"><i class="fa-solid fa-lock"></i></div>
          <h4>LOTE VENDIDO — Escritura inscrita</h4>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">${clienteNombre}</span></div>
            <div class="info-item"><span class="info-label">Precio Final:</span> <span class="info-value">${precioFinal}</span></div>
            <div class="info-item"><span class="info-label">Fecha Venta:</span> <span class="info-value">${fechaVenta}</span></div>
          </div>
        </div>`;
      return;
    }

    // ── DEFAULT: No permissions ───────────────────────
    container.innerHTML = `
      <div class="form-card info-panel">
        <i class="fa-solid fa-circle-info"></i>
        <p>No tienes permisos para esta acción en el estado actual del lote.</p>
        <small>Estado: <strong>${estado}</strong> | Rol: <strong>${role}</strong></small>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════
     renderCRUDTable
     ══════════════════════════════════════════════════════ */
  function renderCRUDTable(container, entity) {
    if (!container) return;
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) { container.innerHTML = '<p class="text-muted">Entidad no soportada.</p>'; return; }

    const records = APP5T_DB.getAll(entity) || [];
    const visibleFields = schema.fields.slice(0, 6); // Show first 6 columns in table

    // ── Build table ──
    let thead = '<tr><th>#</th>';
    visibleFields.forEach(f => { thead += `<th>${f.label}</th>`; });
    thead += '<th class="text-center">Acciones</th></tr>';

    let tbody = '';
    if (records.length === 0) {
      tbody = `<tr><td colspan="${visibleFields.length + 2}" class="text-center text-muted">Sin registros</td></tr>`;
    } else {
      records.forEach((rec, idx) => {
        const pk = rec[schema.pk] || rec.id || idx;
        tbody += `<tr><td>${idx + 1}</td>`;
        visibleFields.forEach(f => {
          let val = rec[f.key] || '';
          if (f.type === 'ref') {
            const refRec = APP5T_DB.getById(f.ref, val);
            val = refRec ? (refRec[f.refLabel] || refRec.nombre || val) : val;
          }
          if (f.key === 'url_drive' && val) {
            val = `<a href="${val}" target="_blank" class="btn btn-sm btn-outline" style="color:var(--accent-blue,#6366f1); border-color:var(--accent-blue,#6366f1); text-decoration:none; display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; font-weight:600;"><i class="fa-brands fa-google-drive"></i> Abrir Enlace</a>`;
          }
          tbody += `<td>${val}</td>`;
        });
        tbody += `<td class="text-center">
          <button class="btn btn-sm btn-outline" onclick="APP5T_Forms._editRecord('${entity}','${pk}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm btn-outline btn-outline-danger" onclick="APP5T_Forms._deleteRecord('${entity}','${pk}')"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
      });
    }

    container.innerHTML = `
      <div class="crud-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h4 style="margin: 0;"><i class="fa-solid fa-table-list"></i> ${schema.label}s (${records.length})</h4>
        <button class="btn btn-primary btn-sm" onclick="APP5T_Forms._addRecord('${entity}')">
          <i class="fa-solid fa-plus"></i> Agregar
        </button>
      </div>
      <div class="table-responsive">
        <table class="premium-table">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>`;
  }

  /* ── CRUD Modal Helpers ── */

  function _buildFormHTML(schema, record, isForceNew = false) {
    const isEdit = !!record && !isForceNew;
    let html = `<form id="frm-crud" class="form-grid">`;
    schema.fields.forEach(f => {
      const val = record ? (record[f.key] !== undefined ? record[f.key] : '') : (f.default || '');
      const reqAttr = f.required ? 'required' : '';
      let input = '';
      switch (f.type) {
        case 'select':
          input = `<select name="${f.key}" class="form-control" ${reqAttr}>
            <option value="">— Seleccionar —</option>
            ${(f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>`;
          break;
        case 'ref':
          input = _refSelect(f.key, f.ref, f.refLabel, val);
          break;
        case 'textarea':
          input = `<textarea name="${f.key}" class="form-control" rows="3" ${reqAttr}>${val}</textarea>`;
          break;
        case 'date':
          input = `<input type="date" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
          break;
        case 'number':
          input = `<input type="number" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
          break;
        default:
          if (f.key === 'url' || f.key === 'url_drive') {
            input = `
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="url" name="${f.key}" class="form-control" placeholder="https://drive.google.com/..." value="${val}" ${reqAttr} style="flex:1;">
                ${val ? `<a href="${val}" target="_blank" class="btn btn-sm btn-outline-success" style="white-space:nowrap; padding: 6px 10px; display:inline-flex; align-items:center; gap:5px; text-decoration:none;" title="Abrir carpeta en Google Drive"><i class="fa-solid fa-arrow-up-right-from-square"></i> Probar</a>` : ''}
              </div>
              <small class="text-muted" style="display:block; margin-top:4px; font-size:0.75rem;">Enlace compartido a la carpeta del lote en Google Drive.</small>
            `;
          } else {
            input = `<input type="${f.type || 'text'}" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
          }
      }
      html += _group(f.label + (f.required ? ' *' : ''), input, f.key);
    });
    html += `<div class="form-actions">
      <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> ${isEdit ? 'Actualizar' : 'Guardar'}</button>
    </div></form>`;
    return html;
  }

  function _addRecord(entity, defaultData = null) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    const html = _buildFormHTML(schema, defaultData, true);
    window.APP5T.openModal(`Agregar ${schema.label}`, html);
    const frm = document.getElementById('frm-crud');
    frm.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const result = _collectForm(frm, schema);
        if (!result.ok) { APP5T_Utils.showToast(result.errors[0], 'warning'); return; }
        // Generate ID
        const existing = APP5T_DB.getAll(entity) || [];
        result.data[schema.pk] = APP5T_Utils.generarId(existing);
        result.data.fecha_ingreso = result.data.fecha_ingreso || APP5T_Utils.fechaHoy();
        const res = APP5T_DB.insert(entity, result.data);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al guardar: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast(`${schema.label} agregado correctamente`, 'success');
        window.APP5T.closeModal(true);
        // Re-render the CRUD table
        const crudContent = document.getElementById('crud-content');
        if (crudContent) renderCRUDTable(crudContent, entity);
      } catch (err) {
        console.error(err);
        alert(`Error al guardar registro: ${err.message}\nConsulte la consola del navegador para más detalles.`);
      }
    });
  }

  function _editRecord(entity, id) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    const record = APP5T_DB.getById(entity, id);
    if (!record) { APP5T_Utils.showToast('Registro no encontrado', 'error'); return; }
    const html = _buildFormHTML(schema, record);
    window.APP5T.openModal(`Editar ${schema.label}`, html);
    const frm = document.getElementById('frm-crud');
    frm.addEventListener('submit', e => {
      e.preventDefault();
      try {
        const result = _collectForm(frm, schema);
        if (!result.ok) { APP5T_Utils.showToast(result.errors[0], 'warning'); return; }
        const res = APP5T_DB.update(entity, id, result.data);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al actualizar: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast(`${schema.label} actualizado correctamente`, 'success');
        window.APP5T.closeModal(true);
        const crudContent = document.getElementById('crud-content');
        if (crudContent) {
          renderCRUDTable(crudContent, entity);
        } else {
          if (window.APP5T && typeof window.APP5T.refreshAll === 'function') {
            window.APP5T.refreshAll();
          }
        }
      } catch (err) {
        console.error(err);
        alert(`Error al actualizar registro: ${err.message}\nConsulte la consola del navegador para más detalles.`);
      }
    });
  }

  function _deleteRecord(entity, id) {
    const schema = ENTITY_SCHEMA[entity];
    if (!schema) return;
    if (!confirm(`¿Eliminar este ${schema.label}?`)) return;
    APP5T_DB.remove(entity, id);
    APP5T_Utils.showToast(`${schema.label} eliminado`, 'info');
    const crudContent = document.getElementById('crud-content');
    if (crudContent) {
      renderCRUDTable(crudContent, entity);
    } else {
      if (window.APP5T && typeof window.APP5T.refreshAll === 'function') {
        window.APP5T.refreshAll();
      }
    }
  }

  /* ══════════════════════════════════════════════════════
     renderPagoForm (Redirección a Ficha Unificada)
     ══════════════════════════════════════════════════════ */
  function renderPagoForm(container, ctaCte) {
    return renderEditarCuotaForm(container, ctaCte);
  }

  /* ══════════════════════════════════════════════════════
     renderActivarCtaCteForm
     ══════════════════════════════════════════════════════ */
  function renderActivarCtaCteForm(container, neg) {
    if (!container || !neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '—') : '—';
    const loteProy = prop ? `${prop.nombre} / ${proyNom}` : `Lote ${neg.id_propiedad}`;
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : `ID: ${neg.id_cliente}`;

    const defaultValorFinal = neg.valor_final || (prop ? prop.valor_final : 0);
    const defaultPie = neg.pie || 0;
    const defaultCantCuotas = neg.cantidad_cuotas || 12;
    const defaultFechaVenc = neg.fecha_vencimiento_cuota || APP5T_Utils.fechaHoy();

    container.innerHTML = `
      <form id="frm-activar-ctacte" class="form-card" style="padding: 10px;">
        <h4 style="margin-top: 0; display: flex; align-items: center; gap: 8px; color: var(--text-white);"><i class="fa-solid fa-bolt" style="color: var(--accent-orange);"></i> Activar Cuenta Corriente</h4>
        <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1.25rem;">
          Configure y confirme el plan de financiamiento para el cliente <strong>${cliNom}</strong> en el lote <strong>${loteProy}</strong>.
        </p>

        <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.25rem; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px; border: 1px solid var(--glass-border);">
          <div class="info-item" style="display: flex; flex-direction: column;"><span class="info-label" style="font-size: 0.75rem; color: var(--text-dim);">Cliente:</span> <span class="info-value" style="font-weight: 600; color: var(--text-white);">${cliNom}</span></div>
          <div class="info-item" style="display: flex; flex-direction: column;"><span class="info-label" style="font-size: 0.75rem; color: var(--text-dim);">Propiedad:</span> <span class="info-value" style="font-weight: 600; color: var(--text-white);">${loteProy}</span></div>
        </div>

        ${_group('Valor Final Lote', `<input type="text" name="valor_final" class="form-control" value="${APP5T_Utils.formatMoneda(defaultValorFinal)}">`, 'valor_final')}
        ${_group('Pie / Enganche', `<input type="text" name="pie" class="form-control" value="${APP5T_Utils.formatMoneda(defaultPie)}">`, 'pie')}
        
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 4px; color: var(--text-white); font-size: 0.85rem;">Saldo a Financiar</label>
          <div id="ctacte-saldo-financiar" style="font-weight: 700; font-size: 1.1rem; color: var(--accent-orange); padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid var(--glass-border);">
            ${APP5T_Utils.formatMoneda(defaultValorFinal - defaultPie)}
          </div>
        </div>

        ${_group('Cantidad de Cuotas', `<input type="number" name="cantidad_cuotas" class="form-control" min="1" max="120" value="${defaultCantCuotas}">`, 'cantidad_cuotas')}
        ${_group('Fecha Primer Vencimiento', `<input type="date" name="fecha_vencimiento_cuota" class="form-control" value="${defaultFechaVenc}">`, 'fecha_vencimiento_cuota')}

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 15px; display: flex; justify-content: center; align-items: center; gap: 8px;">
          <i class="fa-solid fa-circle-check"></i> Activar y Generar Cuotas
        </button>
      </form>`;

    // Add dynamic calculation of Saldo a Financiar
    const inputValorFinal = container.querySelector('[name="valor_final"]');
    const inputPie = container.querySelector('[name="pie"]');
    const displaySaldo = container.querySelector('#ctacte-saldo-financiar');

    function recalculate() {
      const v = APP5T_Utils.parseMoneda(inputValorFinal.value) || 0;
      const p = APP5T_Utils.parseMoneda(inputPie.value) || 0;
      displaySaldo.textContent = APP5T_Utils.formatMoneda(v - p);
    }

    inputValorFinal.addEventListener('input', recalculate);
    inputPie.addEventListener('input', recalculate);
    inputValorFinal.addEventListener('blur', () => {
      const val = APP5T_Utils.parseMoneda(inputValorFinal.value) || 0;
      inputValorFinal.value = APP5T_Utils.formatMoneda(val);
    });
    inputPie.addEventListener('blur', () => {
      const val = APP5T_Utils.parseMoneda(inputPie.value) || 0;
      inputPie.value = APP5T_Utils.formatMoneda(val);
    });

    container.querySelector('#frm-activar-ctacte').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const frm = e.target;
        const valorFinal = APP5T_Utils.parseMoneda(frm.querySelector('[name="valor_final"]').value) || 0;
        const pie = APP5T_Utils.parseMoneda(frm.querySelector('[name="pie"]').value) || 0;
        const cantidadCuotas = Number(frm.querySelector('[name="cantidad_cuotas"]').value) || 0;
        const fechaVenc = frm.querySelector('[name="fecha_vencimiento_cuota"]').value;

        if (valorFinal <= 0) {
          APP5T_Utils.showToast('El valor final del lote debe ser mayor a cero', 'warning');
          return;
        }
        if (pie < 0) {
          APP5T_Utils.showToast('El pie no puede ser negativo', 'warning');
          return;
        }
        if (valorFinal - pie <= 0) {
          APP5T_Utils.showToast('El valor final debe ser mayor que el pie para financiar', 'warning');
          return;
        }
        if (cantidadCuotas <= 0) {
          APP5T_Utils.showToast('La cantidad de cuotas debe ser al menos 1', 'warning');
          return;
        }
        if (!fechaVenc) {
          APP5T_Utils.showToast('Seleccione la fecha de vencimiento para la primera cuota', 'warning');
          return;
        }

        const res = APP5T_DB.activarCuentaCorriente(neg.id, {
          valor_final: valorFinal,
          pie: pie,
          cantidad_cuotas: cantidadCuotas,
          fecha_vencimiento_cuota: fechaVenc
        });

        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al activar cuenta corriente: ${res.error || 'Desconocido'}`, 'error');
          return;
        }

        APP5T_Utils.showToast('Cuenta corriente activada y cuotas generadas exitosamente', 'success');
        if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
        window.APP5T.closeModal(true);
      } catch (err) {
        console.error(err);
        alert(`Error al activar cuenta corriente: ${err.message}`);
      }
    });
  }

  function vincularDocumentoLote(propiedadId) {
    const propiedad = APP5T_DB.getById('propiedades', propiedadId);
    if (!propiedad) return;

    const html = `
      <form id="frm-vincular-lote" class="lote-ficha" style="padding: 16px; font-size: 0.85rem;">
        <h4 style="margin: 0 0 12px 0; color: var(--text-white); font-weight: 700; font-size: 0.95rem;">
          <i class="fa-brands fa-google-drive" style="color: var(--accent-blue); margin-right: 6px;"></i> Vincular Documento Principal: Lote ${propiedad.nombre}
        </h4>
        <div class="form-group" style="margin-bottom: 14px;">
          <label style="font-size: 0.76rem; color: var(--text-dim); display: block; margin-bottom: 4px; font-weight: 600;">Enlace de Google Drive *</label>
          <input type="url" id="lote-drive-url" class="form-control" placeholder="https://drive.google.com/..." value="${propiedad.url || ''}" required style="width: 100%; padding: 6px 8px; font-size: 0.8rem; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 4px; color: var(--text-white);">
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="APP5T_Modals.close('modal-generic')" style="padding: 6px 12px; font-size: 0.8rem;">Cancelar</button>
          <button type="submit" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 600;">Guardar</button>
        </div>
      </form>
    `;

    window.APP5T.openModal(`Vincular Documento`, html);

    const frm = document.getElementById('frm-vincular-lote');
    frm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const urlVal = document.getElementById('lote-drive-url').value.trim();

      if (urlVal && !urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
        APP5T_Utils.showToast('Por favor, ingresa una URL válida (ej: https://drive.google.com/...)', 'warning');
        return;
      }

      try {
        const res = APP5T_DB.update('propiedades', propiedad.id, { url: urlVal });
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al actualizar: ${res.error}`, 'error');
          return;
        }

        APP5T_Utils.showToast('Documento vinculado con éxito', 'success');
        window.APP5T.closeModal(true);

        // Force immediate refresh of current view
        if (window.APP5T && typeof window.APP5T.refreshAll === 'function') {
          window.APP5T.refreshAll();
        }
      } catch (err) {
        console.error(err);
        APP5T_Utils.showToast('Error al vincular el documento', 'error');
      }
    });
  }

  function mostrarComprobanteReservaSimulado(idNeg) {
    const neg  = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    if (!prop) return;
    const cli  = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : '';
    const precioVentaFmt = APP5T_Utils.formatMoneda(neg.valor_final || 0);
    const dateStr   = APP5T_Utils.fechaHoy();
    const negId     = String(neg.id).padStart(2,'0');
    const loteNom   = prop.nombre || '';
    const cleanLote = loteNom.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9-_]/g,'_');
    const filename  = 'Comprobante_Reserva_Lote' + cleanLote + '_' + new Date().toISOString().split('T')[0] + '.pdf';
    _generarPDFConJsPDF({
      type:       'reserva',
      docHeader:  'COMPROBANTE DE RESERVA DE PROPIEDAD',
      dateStr,
      lote:       loteNom,
      proyecto:   proyNom,
      superficie: prop.superficie ? APP5T_Utils.formatSuperficie(prop.superficie) : '',
      rol:        prop.rol || 'En Tramite',
      clienteNom: cli ? (cli.nombres + ' ' + cli.apellidos) : '',
      clienteRut: cli ? (cli.rut || '') : '',
      precio:     precioVentaFmt,
      pie:        APP5T_Utils.formatMoneda(neg.pie || 0),
      metodoPago: neg.metodo_pago || 'Transferencia Bancaria',
      cuotas:     String(neg.cantidad_cuotas || 'Sin cuotas'),
      negId,
      bodyText:   '',
    }, filename);
  }

      /* ══════════════════════════════════════════════════════
     renderMatrizCuotasDinamicas (Matriz de Cuotas Dinámicas)
     Frontend Minimalista, Intuitivo y de Alto Desempeño
     ══════════════════════════════════════════════════════ */
  function renderMatrizCuotasDinamicas(container, target) {
    if (!container || !target) return;

    // Ampliar modal a pantalla ancha
    const modalCard = container.closest('.modal-card');
    if (modalCard) {
      modalCard.classList.add('modal-card-wide');
    }

    const toIsoDate = ddMmYyyy => {
      if (!ddMmYyyy) return '';
      if (ddMmYyyy.includes('-') && ddMmYyyy.split('-')[0].length === 4) return ddMmYyyy;
      const parts = ddMmYyyy.split('/');
      if (parts.length !== 3) return ddMmYyyy;
      return parts[2] + '-' + parts[1] + '-' + parts[0];
    };

    const toDdMmYyyy = yyyyMmDd => {
      if (!yyyyMmDd) return '';
      const parts = yyyyMmDd.split('-');
      if (parts.length !== 3) return yyyyMmDd;
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    };

    // Identificar cliente y propiedad desde target
    let idCliente = target.id_cliente;
    let idPropiedad = target.id_propiedad;
    const highlightCuotaId = target.id || null;

    if (!idCliente || !idPropiedad) {
      if (target.id) {
        const found = APP5T_DB.getById('cuenta_corriente', target.id);
        if (found) {
          idCliente = found.id_cliente;
          idPropiedad = found.id_propiedad;
        }
      }
    }

    const cli = APP5T_DB.getById('clientes', idCliente);
    const prop = APP5T_DB.getById('propiedades', idPropiedad);
    const proy = prop && prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '—') : '—';
    const loteNom = prop ? prop.nombre : ('Lote ' + idPropiedad);
    const cliNom = cli ? (cli.nombres + ' ' + cli.apellidos) : ('ID: ' + idCliente);
    const cliRut = cli && cli.rut ? cli.rut : '';

    // Obtener negociación para conocer el Saldo a Financiar
    const allNegs = APP5T_DB.getAll('negociaciones') || [];
    const neg = allNegs.find(n => String(n.id_cliente) === String(idCliente) && String(n.id_propiedad) === String(idPropiedad))
      || allNegs.find(n => String(n.id_propiedad) === String(idPropiedad));

    const precioVenta = neg ? (Number(neg.valor_final) || 0) : (prop ? (Number(prop.valor_final) || 0) : 0);
    const pieInicial = neg ? (Number(neg.pie) || 0) : 0;
    const saldoAFinanciar = Math.max(0, precioVenta - pieInicial);

    // Obtener todas las cuotas de este cliente y lote
    let ctas = (APP5T_DB.getAll('cuenta_corriente') || []).filter(q =>
      String(q.id_cliente) === String(idCliente) &&
      String(q.id_propiedad) === String(idPropiedad)
    );

    // Ordenar cronológicamente
    ctas.sort((a, b) => {
      const da = APP5T_Utils.parseFecha(a.fecha_vencimiento) || new Date(0);
      const db = APP5T_Utils.parseFecha(b.fecha_vencimiento) || new Date(0);
      if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
      return (Number(a.cuota_nro) || 0) - (Number(b.cuota_nro) || 0);
    });

    // Lista en memoria
    let rows = ctas.map((c, idx) => ({
      id: c.id,
      tempKey: 'row_' + idx + '_' + Math.random().toString(36).substr(2, 6),
      cuota_nro: idx + 1,
      fecha_vencimiento: toIsoDate(c.fecha_vencimiento),
      valor_cuota: Number(c.valor_cuota) || 0,
      estado_cuota: c.estado_cuota || 'Pendiente Pago',
      valor_pagado: Number(c.valor_pagado) || 0,
      fecha_pago: toIsoDate(c.fecha_pago),
      metodo_pago: c.metodo_pago || 'Transferencia',
      url: c.url || '',
      isHighlight: (highlightCuotaId && String(c.id) === String(highlightCuotaId))
    }));

    if (rows.length === 0) {
      const hoyIso = new Date().toISOString().split('T')[0];
      rows.push({
        id: null,
        tempKey: 'row_init_' + Math.random().toString(36).substr(2, 6),
        cuota_nro: 1,
        fecha_vencimiento: hoyIso,
        valor_cuota: saldoAFinanciar,
        estado_cuota: 'Pendiente Pago',
        valor_pagado: 0,
        fecha_pago: '',
        metodo_pago: 'Transferencia',
        url: '',
        isHighlight: false
      });
    }

    const deletedIds = [];

    // Render Estructura Minimalista
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-family: 'Inter', -apple-system, sans-serif;">
        
        <!-- HEADER FINANCIERO INTEGRADO -->
        <div class="matriz-header-card">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.1rem; font-weight: 700; color: #ffffff;">${cliNom}</span>
              ${cliRut ? `<span style="font-size: 0.78rem; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px;">${cliRut}</span>` : ''}
            </div>
            <div style="font-size: 0.82rem; color: #38bdf8; margin-top: 3px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-map-location-dot" style="font-size: 0.75rem;"></i>
              ${loteNom} <span style="color: #64748b;">•</span> ${proyNom}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div class="matriz-kpi-pill" style="border-color: rgba(56, 189, 248, 0.3);">
              <span class="pill-label" style="color: #38bdf8;">Saldo a Financiar</span>
              <span class="pill-val" style="color: #38bdf8;">${APP5T_Utils.formatMoneda(saldoAFinanciar)}</span>
              <span style="font-size: 0.65rem; color: #64748b; margin-top: 1px;">Venta ${APP5T_Utils.formatMoneda(precioVenta)} - Pie ${APP5T_Utils.formatMoneda(pieInicial)}</span>
            </div>

            <div class="matriz-kpi-pill">
              <span class="pill-label">Pactado en Cuotas</span>
              <span class="pill-val" id="matriz-sum-pactado">$ 0</span>
              <span style="font-size: 0.65rem; color: #94a3b8; margin-top: 1px;" id="matriz-cuotas-conteo">0 cuotas</span>
            </div>

            <div class="matriz-kpi-pill" style="min-width: 160px;">
              <span class="pill-label">Cuadratura</span>
              <div id="matriz-badge-cuadratura" style="margin-top: 3px;"></div>
            </div>
          </div>
        </div>

        <!-- BARRA DE PROGRESO DE COBRANZA -->
        <div style="background: rgba(15,23,42,0.5); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
          <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden; position: relative;">
            <div id="matriz-prog-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 9999px; transition: width 0.3s ease;"></div>
          </div>
          <div id="matriz-prog-text" style="font-size: 0.75rem; color: #94a3b8; white-space: nowrap; font-variant-numeric: tabular-nums;">
            0% pagado • $ 0
          </div>
        </div>

        <!-- TOOLBAR MINIMALISTA -->
        <div class="matriz-toolbar">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button type="button" id="btn-matriz-add-cuota" class="matriz-btn matriz-btn-primary">
              <i class="fa-solid fa-plus"></i> Nueva Cuota
            </button>
            <button type="button" id="btn-matriz-distribuir-saldo" class="matriz-btn matriz-btn-magic" title="Equilibra equitativamente el saldo pendiente en las cuotas restantes">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Distribuir Parejo
            </button>

            <!-- Frecuencia directa con Chips -->
            <div style="display: flex; align-items: center; gap: 6px; margin-left: 6px;">
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Frecuencia:</span>
              <div class="matriz-freq-group">
                <button type="button" class="matriz-freq-chip" data-freq="1">Mensual</button>
                <button type="button" class="matriz-freq-chip" data-freq="2">Bimestral</button>
                <button type="button" class="matriz-freq-chip" data-freq="3">Trimestral</button>
                <button type="button" class="matriz-freq-chip" data-freq="6">Semestral</button>
              </div>
            </div>
          </div>

          <div style="font-size: 0.74rem; color: #64748b;">
            <i class="fa-solid fa-bolt" style="color: #38bdf8;"></i> Clic en <strong>⚡</strong> para marcar cuota pagada al instante.
          </div>
        </div>

        <!-- TABLA SPREADSHEET OSCURA -->
        <div class="matriz-table-container">
          <table class="matriz-table">
            <thead>
              <tr>
                <th style="width: 36px; text-align: center;">#</th>
                <th style="width: 135px;">Vencimiento</th>
                <th style="width: 140px; text-align: right;">Monto Cuota</th>
                <th style="width: 125px;">Estado</th>
                <th style="width: 135px; text-align: right;">Monto Pagado</th>
                <th style="width: 125px;">Fecha Pago</th>
                <th style="width: 110px;">Método</th>
                <th style="width: 100px;">Ref / Op</th>
                <th style="width: 65px; text-align: center;">Acción</th>
              </tr>
            </thead>
            <tbody id="matriz-tbody">
              <!-- Filas dinámicas -->
            </tbody>
          </table>
        </div>

        <!-- FOOTER LIMPIO -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 10px;">
          <div id="matriz-footer-text" style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">
            <!-- X cuotas • $ Y pagado • $ Z por cobrar -->
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-matriz-cancelar" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; border-radius: 6px; padding: 7px 16px; font-size: 0.82rem; font-weight: 600; cursor: pointer;">
              Cerrar
            </button>
            <button type="button" id="btn-matriz-guardar" style="background: #10b981; color: #ffffff; border: none; border-radius: 6px; padding: 7px 18px; font-size: 0.84rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 7px; box-shadow: 0 2px 10px rgba(16,185,129,0.3);">
              <i class="fa-solid fa-check"></i> Guardar Cronograma
            </button>
          </div>
        </div>

      </div>
    `;

    const tbody = container.querySelector('#matriz-tbody');
    const badgeCuadratura = container.querySelector('#matriz-badge-cuadratura');
    const displaySumPactado = container.querySelector('#matriz-sum-pactado');
    const displayCuotasConteo = container.querySelector('#matriz-cuotas-conteo');
    const progBar = container.querySelector('#matriz-prog-bar');
    const progText = container.querySelector('#matriz-prog-text');
    const footerText = container.querySelector('#matriz-footer-text');

    // Recalcular métricas
    function recalcularTotales() {
      let sumPactado = 0;
      let sumPagado = 0;
      let pagadasCount = 0;
      let pendientesCount = 0;

      rows.forEach(r => {
        if (r.estado_cuota !== 'Anulada') {
          sumPactado += (Number(r.valor_cuota) || 0);
        }
        sumPagado += (Number(r.valor_pagado) || 0);
        if (r.estado_cuota === 'Pagada' || (r.valor_pagado >= r.valor_cuota && r.valor_cuota > 0)) {
          pagadasCount++;
        } else if (r.estado_cuota !== 'Anulada') {
          pendientesCount++;
        }
      });

      const diferencia = saldoAFinanciar - sumPactado;
      const saldoPendienteReal = Math.max(0, saldoAFinanciar - sumPagado);
      const pctPagado = saldoAFinanciar > 0 ? Math.min(100, Math.round((sumPagado / saldoAFinanciar) * 100)) : 0;

      displaySumPactado.textContent = APP5T_Utils.formatMoneda(sumPactado);
      displayCuotasConteo.textContent = rows.length + ' cuotas pactadas';

      progBar.style.width = pctPagado + '%';
      progText.innerHTML = `<strong style="color: #34d399;">${pctPagado}% pagado</strong> (${APP5T_Utils.formatMoneda(sumPagado)}) &bull; Saldo pendiente: <strong style="color: #f59e0b;">${APP5T_Utils.formatMoneda(saldoPendienteReal)}</strong>`;

      if (diferencia === 0) {
        badgeCuadratura.innerHTML = `
          <span style="background: rgba(16,185,129,0.18); color: #34d399; border: 1px solid rgba(16,185,129,0.35); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-check"></i> Cuadrado al peso ($0)
          </span>`;
      } else if (diferencia > 0) {
        badgeCuadratura.innerHTML = `
          <div style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="background: rgba(245,158,11,0.18); color: #fbbf24; border: 1px solid rgba(245,158,11,0.35); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">
              <i class="fa-solid fa-triangle-exclamation"></i> Faltan ${APP5T_Utils.formatMoneda(diferencia)}
            </span>
            <button type="button" id="btn-quick-autocuadrar" style="background: #f59e0b; color: #000; border: none; padding: 3px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;" title="Ajusta la última cuota o distribuye para cuadrar en $0">
              Auto-cuadrar
            </button>
          </div>`;
        const btnAuto = badgeCuadratura.querySelector('#btn-quick-autocuadrar');
        if (btnAuto) {
          btnAuto.addEventListener('click', autoCuadrarSaldo);
        }
      } else {
        badgeCuadratura.innerHTML = `
          <div style="display: inline-flex; align-items: center; gap: 5px;">
            <span style="background: rgba(239,68,68,0.18); color: #f87171; border: 1px solid rgba(239,68,68,0.35); padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">
              <i class="fa-solid fa-circle-exclamation"></i> Sobran ${APP5T_Utils.formatMoneda(Math.abs(diferencia))}
            </span>
            <button type="button" id="btn-quick-autocuadrar" style="background: #ef4444; color: #fff; border: none; padding: 3px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
              Auto-cuadrar
            </button>
          </div>`;
        const btnAuto = badgeCuadratura.querySelector('#btn-quick-autocuadrar');
        if (btnAuto) {
          btnAuto.addEventListener('click', autoCuadrarSaldo);
        }
      }

      footerText.innerHTML = `Total: <strong>${rows.length}</strong> cuotas &bull; <span style="color: #34d399;">${pagadasCount} pagadas</span> &bull; <span style="color: #38bdf8;">${pendientesCount} pendientes</span>`;
    }

    // Auto-cuadrar inteligente
    function autoCuadrarSaldo() {
      const cuotasVariables = rows.filter(r => r.estado_cuota !== 'Pagada' && r.estado_cuota !== 'Anulada' && r.valor_pagado === 0);
      if (cuotasVariables.length === 0) {
        APP5T_Utils.showToast('No hay cuotas pendientes libres para cuadrar', 'info');
        return;
      }
      const sumFijas = rows.reduce((s, r) => (!cuotasVariables.includes(r) && r.estado_cuota !== 'Anulada') ? s + r.valor_cuota : s, 0);
      const rem = Math.max(0, saldoAFinanciar - sumFijas);
      const perRow = Math.floor(rem / cuotasVariables.length);

      cuotasVariables.forEach((r, idx) => {
        const isLast = (idx === cuotasVariables.length - 1);
        r.valor_cuota = isLast ? Math.max(0, rem - (perRow * (cuotasVariables.length - 1))) : perRow;
      });

      renderTableRows();
      recalcularTotales();
      APP5T_Utils.showToast('Cronograma auto-cuadrado exitosamente al 100%', 'success');
    }

    // Render de Filas
    function renderTableRows() {
      tbody.innerHTML = '';
      rows.forEach((r, idx) => {
        r.cuota_nro = idx + 1;
        const isPaid = (r.estado_cuota === 'Pagada' || r.valor_pagado >= r.valor_cuota && r.valor_cuota > 0);
        const tr = document.createElement('tr');
        if (isPaid) tr.classList.add('row-paid');

        let statusClass = 'status-pendiente';
        if (r.estado_cuota === 'Pagada') statusClass = 'status-pagada';
        else if (r.estado_cuota === 'Abonada') statusClass = 'status-abonada';
        else if (r.estado_cuota === 'Vencida') statusClass = 'status-vencida';
        else if (r.estado_cuota === 'Anulada') statusClass = 'status-anulada';

        tr.innerHTML = `
          <td style="text-align: center; font-weight: 700; color: #64748b; font-size: 0.75rem;">
            ${r.cuota_nro}
          </td>
          <td>
            <input type="date" class="matriz-input input-venc" value="${r.fecha_vencimiento}">
          </td>
          <td>
            <input type="text" class="matriz-input matriz-input-amount input-pactado" value="${APP5T_Utils.formatMoneda(r.valor_cuota)}">
          </td>
          <td>
            <select class="matriz-select-status ${statusClass} input-estado" style="width: 100%;">
              <option value="Pendiente Pago" ${r.estado_cuota === 'Pendiente Pago' ? 'selected' : ''}>Pendiente</option>
              <option value="Pagada" ${r.estado_cuota === 'Pagada' || r.estado_cuota === 'Pagado' ? 'selected' : ''}>Pagada</option>
              <option value="Abonada" ${r.estado_cuota === 'Abonada' ? 'selected' : ''}>Abonada</option>
              <option value="Vencida" ${r.estado_cuota === 'Vencida' ? 'selected' : ''}>Vencida</option>
              <option value="Anulada" ${r.estado_cuota === 'Anulada' ? 'selected' : ''}>Anulada</option>
            </select>
          </td>
          <td>
            <input type="text" class="matriz-input matriz-input-paid input-pagado" value="${APP5T_Utils.formatMoneda(r.valor_pagado)}" style="color: ${r.valor_pagado > 0 ? '#34d399' : '#64748b'}; font-weight: ${r.valor_pagado > 0 ? '700' : '400'};">
          </td>
          <td>
            <input type="date" class="matriz-input input-fecha-pago" value="${r.fecha_pago}" style="opacity: ${r.valor_pagado > 0 || r.estado_cuota === 'Pagada' ? '1' : '0.45'};">
          </td>
          <td>
            <select class="matriz-input input-metodo" style="font-size: 0.75rem; padding: 5px 6px !important;">
              <option value="Transferencia" ${r.metodo_pago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
              <option value="Efectivo" ${r.metodo_pago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
              <option value="Cheque" ${r.metodo_pago === 'Cheque' ? 'selected' : ''}>Cheque</option>
              <option value="Vale Vista" ${r.metodo_pago === 'Vale Vista' ? 'selected' : ''}>Vale Vista</option>
              <option value="Depósito" ${r.metodo_pago === 'Depósito' ? 'selected' : ''}>Depósito</option>
            </select>
          </td>
          <td>
            <input type="text" class="matriz-input input-ref" value="${r.url || ''}" placeholder="Voucher" style="font-size: 0.75rem; padding: 5px 6px !important;">
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <button type="button" class="matriz-row-action act-pay btn-quick-pay" title="${isPaid ? 'Pagada (Clic para revertir)' : 'Marcar como Pagada al día'}">
              <i class="fa-solid ${isPaid ? 'fa-rotate-left' : 'fa-check'}" style="color: ${isPaid ? '#94a3b8' : '#34d399'};"></i>
            </button>
            <button type="button" class="matriz-row-action act-del btn-delete-row" title="Eliminar cuota">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;

        const inputVenc = tr.querySelector('.input-venc');
        const inputPact = tr.querySelector('.input-pactado');
        const selEstado = tr.querySelector('.input-estado');
        const inputPag = tr.querySelector('.input-pagado');
        const inputFecPag = tr.querySelector('.input-fecha-pago');
        const selMet = tr.querySelector('.input-metodo');
        const inputRef = tr.querySelector('.input-ref');
        const btnPay = tr.querySelector('.btn-quick-pay');
        const btnDel = tr.querySelector('.btn-delete-row');

        inputVenc.addEventListener('change', () => {
          r.fecha_vencimiento = inputVenc.value;
        });

        inputPact.addEventListener('blur', () => {
          const val = APP5T_Utils.parseMoneda(inputPact.value) || 0;
          r.valor_cuota = val;
          inputPact.value = APP5T_Utils.formatMoneda(val);
          recalcularTotales();
        });

        selEstado.addEventListener('change', () => {
          r.estado_cuota = selEstado.value;
          if (r.estado_cuota === 'Pagada' && r.valor_pagado === 0) {
            r.valor_pagado = r.valor_cuota;
            inputPag.value = APP5T_Utils.formatMoneda(r.valor_pagado);
            if (!r.fecha_pago) {
              r.fecha_pago = new Date().toISOString().split('T')[0];
              inputFecPag.value = r.fecha_pago;
            }
          } else if (r.estado_cuota === 'Anulada') {
            r.valor_cuota = 0;
            r.valor_pagado = 0;
            inputPact.value = APP5T_Utils.formatMoneda(0);
            inputPag.value = APP5T_Utils.formatMoneda(0);
          }
          renderTableRows();
          recalcularTotales();
        });

        inputPag.addEventListener('blur', () => {
          const val = APP5T_Utils.parseMoneda(inputPag.value) || 0;
          r.valor_pagado = val;
          inputPag.value = APP5T_Utils.formatMoneda(val);
          if (val >= r.valor_cuota && r.valor_cuota > 0) {
            r.estado_cuota = 'Pagada';
            if (!r.fecha_pago) r.fecha_pago = new Date().toISOString().split('T')[0];
          } else if (val > 0 && val < r.valor_cuota) {
            r.estado_cuota = 'Abonada';
            if (!r.fecha_pago) r.fecha_pago = new Date().toISOString().split('T')[0];
          } else if (val === 0 && r.estado_cuota === 'Pagada') {
            r.estado_cuota = 'Pendiente Pago';
          }
          renderTableRows();
          recalcularTotales();
        });

        inputFecPag.addEventListener('change', () => {
          r.fecha_pago = inputFecPag.value;
        });

        selMet.addEventListener('change', () => {
          r.metodo_pago = selMet.value;
        });

        inputRef.addEventListener('input', () => {
          r.url = inputRef.value;
        });

        btnPay.addEventListener('click', () => {
          if (isPaid) {
            r.valor_pagado = 0;
            r.estado_cuota = 'Pendiente Pago';
            r.fecha_pago = '';
            APP5T_Utils.showToast('Cuota #' + r.cuota_nro + ' devuelta a Pendiente', 'info');
          } else {
            r.valor_pagado = r.valor_cuota;
            r.estado_cuota = 'Pagada';
            r.fecha_pago = new Date().toISOString().split('T')[0];
            APP5T_Utils.showToast('Cuota #' + r.cuota_nro + ' marcada como Pagada', 'success');
          }
          renderTableRows();
          recalcularTotales();
        });

        btnDel.addEventListener('click', () => {
          if (r.valor_pagado > 0) {
            if (!confirm('Esta cuota tiene un pago registrado de ' + APP5T_Utils.formatMoneda(r.valor_pagado) + '. ¿Seguro que desea eliminarla?')) {
              return;
            }
          }
          if (r.id) {
            deletedIds.push(r.id);
          }
          rows = rows.filter(item => item !== r);
          renderTableRows();
          recalcularTotales();
        });

        tbody.appendChild(tr);
      });
    }

    // Botón Agregar Cuota
    container.querySelector('#btn-matriz-add-cuota').addEventListener('click', () => {
      let ultimaFecha = new Date();
      if (rows.length > 0) {
        const ult = rows[rows.length - 1];
        const d = ult.fecha_vencimiento ? new Date(ult.fecha_vencimiento + 'T00:00:00') : new Date();
        d.setMonth(d.getMonth() + 1);
        ultimaFecha = d;
      }
      const isoNueva = ultimaFecha.toISOString().split('T')[0];

      const sumPact = rows.reduce((s, r) => r.estado_cuota !== 'Anulada' ? s + (Number(r.valor_cuota) || 0) : s, 0);
      const dif = Math.max(0, saldoAFinanciar - sumPact);
      const sugerido = dif > 0 ? dif : (rows.length > 0 ? rows[rows.length - 1].valor_cuota : 0);

      rows.push({
        id: null,
        tempKey: 'row_add_' + Math.random().toString(36).substr(2, 6),
        cuota_nro: rows.length + 1,
        fecha_vencimiento: isoNueva,
        valor_cuota: sugerido,
        estado_cuota: 'Pendiente Pago',
        valor_pagado: 0,
        fecha_pago: '',
        metodo_pago: 'Transferencia',
        url: '',
        isHighlight: false
      });

      renderTableRows();
      recalcularTotales();
      // Scroll al final
      const c = container.querySelector('.matriz-table-container');
      if (c) c.scrollTop = c.scrollHeight;
    });

    // Botón Distribuir Saldo Parejo
    container.querySelector('#btn-matriz-distribuir-saldo').addEventListener('click', autoCuadrarSaldo);

    // Chips de Frecuencia Rápida (1 Clic)
    container.querySelectorAll('.matriz-freq-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const freq = parseInt(chip.getAttribute('data-freq'), 10);
        if (!freq || isNaN(freq) || rows.length === 0) return;

        container.querySelectorAll('.matriz-freq-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const baseDate = rows[0].fecha_vencimiento ? new Date(rows[0].fecha_vencimiento + 'T00:00:00') : new Date();
        const targetDay = baseDate.getDate();

        rows.forEach((r, idx) => {
          if (idx > 0) {
            const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + (idx * freq), 1);
            const maxDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            d.setDate(Math.min(targetDay, maxDays));
            r.fecha_vencimiento = d.toISOString().split('T')[0];
          }
        });

        renderTableRows();
        APP5T_Utils.showToast('Vencimientos reprogramados con frecuencia seleccionada', 'success');
      });
    });

    // Botón Cancelar
    container.querySelector('#btn-matriz-cancelar').addEventListener('click', () => {
      if (modalCard) modalCard.classList.remove('modal-card-wide');
      if (window.APP5T && window.APP5T.closeModal) window.APP5T.closeModal(true);
    });

    // Botón Guardar Cronograma
    container.querySelector('#btn-matriz-guardar').addEventListener('click', () => {
      try {
        if (rows.length === 0) {
          APP5T_Utils.showToast('Debe haber al menos 1 cuota en el cronograma', 'warning');
          return;
        }

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r.fecha_vencimiento) {
            APP5T_Utils.showToast('La cuota #' + (i + 1) + ' no tiene fecha válida', 'warning');
            return;
          }
          if (r.valor_cuota < 0) {
            APP5T_Utils.showToast('El monto de la cuota #' + (i + 1) + ' no puede ser negativo', 'warning');
            return;
          }
        }

        const sumPactado = rows.reduce((s, r) => r.estado_cuota !== 'Anulada' ? s + (Number(r.valor_cuota) || 0) : s, 0);
        const dif = saldoAFinanciar - sumPactado;

        if (dif !== 0 && saldoAFinanciar > 0) {
          const msg = 'Advertencia de Cuadratura:\n\n' +
            'La suma de las cuotas pactadas (' + APP5T_Utils.formatMoneda(sumPactado) + ') tiene una diferencia de ' +
            APP5T_Utils.formatMoneda(Math.abs(dif)) + ' con respecto al Saldo a Financiar (' + APP5T_Utils.formatMoneda(saldoAFinanciar) + ').\n\n' +
            '¿Desea guardar de todos modos este cronograma personalizado?';
          if (!confirm(msg)) {
            return;
          }
        }

        // Eliminar borradas
        deletedIds.forEach(delId => {
          APP5T_DB.remove('cuenta_corriente', delId);
        });

        // Ordenar cronológicamente
        rows.sort((a, b) => {
          const da = new Date(a.fecha_vencimiento + 'T00:00:00');
          const db = new Date(b.fecha_vencimiento + 'T00:00:00');
          return da.getTime() - db.getTime();
        });

        // Guardar cada cuota
        rows.forEach((r, idx) => {
          const cuotaData = {
            id_cliente: idCliente,
            id_propiedad: idPropiedad,
            cuota_nro: idx + 1,
            fecha_vencimiento: toDdMmYyyy(r.fecha_vencimiento),
            valor_cuota: r.valor_cuota,
            estado_cuota: r.estado_cuota,
            valor_pagado: r.valor_pagado,
            fecha_pago: r.valor_pagado > 0 ? toDdMmYyyy(r.fecha_pago || r.fecha_vencimiento) : null,
            metodo_pago: r.valor_pagado > 0 ? (r.metodo_pago || 'Transferencia') : null,
            url: r.url || ''
          };

          if (r.id) {
            APP5T_DB.update('cuenta_corriente', r.id, cuotaData);
          } else {
            const insRes = APP5T_DB.insert('cuenta_corriente', cuotaData);
            if (insRes && insRes.data && insRes.data.id) {
              r.id = insRes.data.id;
            }
          }
        });

        // Actualizar cantidad en negociación
        if (neg && neg.id) {
          APP5T_DB.update('negociaciones', neg.id, {
            cantidad_cuotas: String(rows.length)
          });
        }

        // Sincronización Supabase
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pushTable === 'function') {
          try {
            APP5T_Sync.pushTable('cuenta_corriente');
            APP5T_Sync.pushTable('negociaciones');
          } catch (syncErr) {
            console.warn('Sync push error:', syncErr);
          }
        }

        if (modalCard) modalCard.classList.remove('modal-card-wide');
        if (window.APP5T && window.APP5T.closeModal) window.APP5T.closeModal(true);
        if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();

        APP5T_Utils.showToast('¡Cronograma guardado exitosamente!', 'success');
      } catch (err) {
        console.error('Error al guardar matriz:', err);
        alert('Ocurrió un error al guardar: ' + err.message);
      }
    });

    // Render inicial
    renderTableRows();
    recalcularTotales();
  }

  /* ══════════════════════════════════════════════════════
     renderEditarCuotaForm (Redirección a Matriz de Cuotas Dinámicas)
     ══════════════════════════════════════════════════════ */
  function renderEditarCuotaForm(container, ctaCte) {
    return renderMatrizCuotasDinamicas(container, ctaCte);
  }

  /* ══════════════════════════════════════════════════════
     mostrarModalReprogramacion
     Asistente para reprogramar cuotas pendientes de un cliente/lote
     ══════════════════════════════════════════════════════ */
  function mostrarModalReprogramacion(idCliente, idPropiedad) {
    const filterCliEl = document.getElementById('ctacte-filter-cliente');
    const filterLotEl = document.getElementById('ctacte-filter-lote');
    const selectedClientId = idCliente || (filterCliEl && filterCliEl.value !== 'all' ? filterCliEl.value : null);
    const selectedLoteId = idPropiedad || (filterLotEl && filterLotEl.value !== 'all' ? filterLotEl.value : null);

    const ctasAll = APP5T_DB.getAll('cuenta_corriente') || [];
    const allClientes = APP5T_DB.getAll('clientes') || [];
    const allProps = APP5T_DB.getAll('propiedades') || [];

    // Filter available clients who have pending cuotas
    const clientsWithPending = allClientes.filter(c => {
      const ctas = ctasAll.filter(q => String(q.id_cliente) === String(c.id));
      return ctas.some(q => q.estado_cuota !== 'Pagada' && q.estado_cuota !== 'Pagado' && Number(q.valor_pagado) < Number(q.valor_cuota));
    });

    if (clientsWithPending.length === 0) {
      APP5T_Utils.showToast('No hay clientes con cuotas pendientes para reprogramar', 'info');
      return;
    }

    const html = `<div id="modal-reprogramacion-form"></div>`;
    if (window.APP5T && window.APP5T.openModal) {
      window.APP5T.openModal('Reprogramar Cuotas de Cuenta Corriente', html);
    }

    setTimeout(() => {
      const container = document.getElementById('modal-reprogramacion-form');
      if (!container) return;

      const activeClientId = selectedClientId || (clientsWithPending[0] ? String(clientsWithPending[0].id) : '');

      let clientOptions = clientsWithPending.map(c => `
        <option value="${c.id}" ${String(c.id) === String(activeClientId) ? 'selected' : ''}>${c.nombres} ${c.apellidos} (${c.rut})</option>
      `).join('');

      container.innerHTML = `
        <form id="frm-reprogramar" class="form-card" style="padding: 10px;">
          <h4 style="margin-top: 0; color: var(--text-white); display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-calendar-alt" style="color: var(--accent-orange);"></i> Asistente de Reprogramación de Deuda
          </h4>
          <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1.2rem;">
            Esta herramienta recalcula y reprograma únicamente las <strong>cuotas pendientes</strong> acordadas con el cliente, conservando intactas las cuotas ya pagadas.
          </p>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 4px; color: var(--text-white); font-size: 0.85rem;">Cliente:</label>
            <select id="reprog-cliente" class="form-control" style="background-color: var(--glass-bg); color: var(--text-white); border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: 4px; width: 100%;">
              ${clientOptions}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 4px; color: var(--text-white); font-size: 0.85rem;">Propiedad / Lote:</label>
            <select id="reprog-propiedad" class="form-control" style="background-color: var(--glass-bg); color: var(--text-white); border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: 4px; width: 100%;">
            </select>
          </div>

          <div id="reprog-summary-box" style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); border-radius: 6px; padding: 12px; margin-bottom: 1.2rem;">
            <!-- Dynamic balance summary -->
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            ${_group('Nueva Cantidad de Cuotas', `<input type="number" id="reprog-cant-cuotas" class="form-control" min="1" max="120" value="12">`, 'reprog_cant')}
            ${_group('Fecha Primer Vencimiento', `<input type="date" id="reprog-fecha-inicio" class="form-control" value="${new Date().toISOString().split('T')[0]}">`, 'reprog_fecha')}
          </div>

          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 4px; color: var(--text-white); font-size: 0.85rem;">Nuevo Valor Cuota Sugerido</label>
            <div id="reprog-nuevo-valor-cuota" style="font-weight: 700; font-size: 1.15rem; color: var(--accent-green); padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid var(--glass-border);">
              $ 0
            </div>
          </div>

          <button type="submit" class="btn btn-warning" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: 600;">
            <i class="fa-solid fa-arrows-rotate"></i> Aplicar Reprogramación
          </button>
        </form>
      `;

      const selCli = container.querySelector('#reprog-cliente');
      const selProp = container.querySelector('#reprog-propiedad');
      const summaryBox = container.querySelector('#reprog-summary-box');
      const inputCant = container.querySelector('#reprog-cant-cuotas');
      const displayNuevoValor = container.querySelector('#reprog-nuevo-valor-cuota');

      let currentSaldoPendiente = 0;
      let lastPaidCuotaNro = 0;

      function updateProps() {
        const cId = selCli.value;
        const ctasCli = ctasAll.filter(q => String(q.id_cliente) === String(cId));
        const propIds = Array.from(new Set(ctasCli.map(q => String(q.id_propiedad)).filter(Boolean)));
        
        selProp.innerHTML = propIds.map(pId => {
          const p = allProps.find(pr => String(pr.id) === String(pId));
          const pNom = p ? p.nombre : `Lote ${pId}`;
          return `<option value="${pId}" ${selectedLoteId && String(pId) === String(selectedLoteId) ? 'selected' : ''}>${pNom}</option>`;
        }).join('');

        updateSummary();
      }

      function updateSummary() {
        const cId = selCli.value;
        const pId = selProp.value;
        const ctasTarget = ctasAll.filter(q => String(q.id_cliente) === String(cId) && String(q.id_propiedad) === String(pId));
        
        const pagadas = ctasTarget.filter(q => q.estado_cuota === 'Pagada' || q.estado_cuota === 'Pagado' || Number(q.valor_pagado) >= Number(q.valor_cuota));
        const pendientes = ctasTarget.filter(q => !pagadas.includes(q) && !String(q.estado_cuota).includes('Anulada'));
        
        const montoPagado = pagadas.reduce((sum, q) => sum + (Number(q.valor_pagado) || 0), 0);
        currentSaldoPendiente = pendientes.reduce((sum, q) => sum + Math.max(0, (Number(q.valor_cuota) || 0) - (Number(q.valor_pagado) || 0)), 0);
        
        lastPaidCuotaNro = pagadas.length > 0 ? Math.max(...pagadas.map(q => Number(q.cuota_nro) || 0)) : 0;

        summaryBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="color: var(--text-dim);">Cuotas Pagadas:</span>
            <strong style="color: var(--accent-green);">${pagadas.length} cuotas (${APP5T_Utils.formatMoneda(montoPagado)})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="color: var(--text-dim);">Cuotas Pendientes a Reemplazar:</span>
            <strong style="color: var(--accent-orange);">${pendientes.length} cuotas</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.95rem; border-top: 1px dashed var(--glass-border); padding-top: 6px; margin-top: 6px;">
            <span style="color: var(--text-white); font-weight: 600;">Saldo Pendiente a Financiar:</span>
            <strong style="color: var(--accent-orange); font-size: 1.1rem;">${APP5T_Utils.formatMoneda(currentSaldoPendiente)}</strong>
          </div>
        `;

        recalcSuggested();
      }

      function recalcSuggested() {
        const cant = Number(inputCant.value) || 1;
        if (cant > 0 && currentSaldoPendiente > 0) {
          const nuevoValor = Math.round(currentSaldoPendiente / cant);
          displayNuevoValor.textContent = APP5T_Utils.formatMoneda(nuevoValor);
        } else {
          displayNuevoValor.textContent = '$ 0';
        }
      }

      selCli.addEventListener('change', updateProps);
      selProp.addEventListener('change', updateSummary);
      inputCant.addEventListener('input', recalcSuggested);

      updateProps();

      container.querySelector('#frm-reprogramar').addEventListener('submit', e => {
        e.preventDefault();
        try {
          const cId = selCli.value;
          const pId = selProp.value;
          const cantCuotas = Number(inputCant.value) || 0;
          const fechaInicio = container.querySelector('#reprog-fecha-inicio').value;

          if (!cId || !pId) {
            APP5T_Utils.showToast('Seleccione un cliente y lote', 'warning');
            return;
          }
          if (cantCuotas <= 0) {
            APP5T_Utils.showToast('La cantidad de cuotas debe ser al menos 1', 'warning');
            return;
          }
          if (currentSaldoPendiente <= 0) {
            APP5T_Utils.showToast('El saldo pendiente debe ser mayor a 0 para reprogramar', 'warning');
            return;
          }
          if (!fechaInicio) {
            APP5T_Utils.showToast('Seleccione la fecha del primer vencimiento', 'warning');
            return;
          }

          const ctasTarget = APP5T_DB.getAll('cuenta_corriente').filter(q => String(q.id_cliente) === String(cId) && String(q.id_propiedad) === String(pId));
          const pagadas = ctasTarget.filter(q => q.estado_cuota === 'Pagada' || q.estado_cuota === 'Pagado' || Number(q.valor_pagado) >= Number(q.valor_cuota));
          const pendientes = ctasTarget.filter(q => !pagadas.includes(q));

          // Remove pending cuotas
          pendientes.forEach(q => {
            APP5T_DB.remove('cuenta_corriente', q.id);
          });

          // Generate new installments
          const valorPorCuota = Math.round(currentSaldoPendiente / cantCuotas);
          const parts = fechaInicio.split('-');
          const baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

          for (let i = 0; i < cantCuotas; i++) {
            const vDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate());
            const dStr = `${String(vDate.getDate()).padStart(2, '0')}/${String(vDate.getMonth() + 1).padStart(2, '0')}/${vDate.getFullYear()}`;
            
            APP5T_DB.insert('cuenta_corriente', {
              id_cliente: Number(cId),
              id_propiedad: Number(pId),
              cuota_nro: lastPaidCuotaNro + i + 1,
              valor_cuota: valorPorCuota,
              fecha_vencimiento: dStr,
              valor_pagado: 0,
              fecha_pago: '',
              url: '',
              estado_cuota: 'Pendiente Pago',
              metodo_pago: 'Transferencia'
            });
          }

          APP5T_Utils.showToast('Reprogramación ejecutada exitosamente', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          window.APP5T.closeModal(true);
        } catch (err) {
          console.error(err);
          alert('Error en reprogramación: ' + err.message);
        }
      });
    }, 50);
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  const api = { renderLoteForm, renderCRUDTable, renderPagoForm, renderEditarCuotaForm, renderMatrizCuotasDinamicas, renderActivarCtaCteForm, mostrarModalReprogramacion, _addRecord, _editRecord, _deleteRecord, vincularDocumentoLote, descargarPDFSimulado, descargarFichaLegal, generarHTMLComprobanteReserva, mostrarComprobanteReservaSimulado };
  window.APP5T_Forms = api;
  return api;
})();






