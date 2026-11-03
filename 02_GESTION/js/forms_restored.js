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
        { key: 'url', label: 'URL Documento Principal (Drive)', type: 'url' },
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
            <div><strong class="pdf-label" style="color: #64748b; font-weight: 600;">SUPERFICIE:</strong> <span class="pdf-value bold" style="color: #0f172a; font-weight: bold;">${propiedad.superficie ? propiedad.superficie.toLocaleString() + ' m²' : '—'}</span></div>
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
      <div class="simulated-pdf-viewer" data-pdf-type="${type}" data-pdf-lote="${propiedad.nombre||''}" data-pdf-proyecto="${proyectoNom||''}" data-pdf-superficie="${propiedad.superficie?propiedad.superficie.toLocaleString()+' m2':''}" data-pdf-rol="${propiedad.rol||'En Tramite'}" data-pdf-cliente="${clienteNom}" data-pdf-rut="${clienteRut}" data-pdf-precio="${precioVentaFmt||''}" data-pdf-pie="${neg?APP5T_Utils.formatMoneda(neg.pie||0):''}" data-pdf-metodo="${neg?(neg.metodo_pago||'Transferencia Bancaria'):''}" data-pdf-cuotas="${neg?String(neg.cantidad_cuotas||'Sin cuotas'):''}" data-pdf-negid="${neg?String(neg.id).padStart(2,'0'):'00'}" data-pdf-date="${dateStr}" data-pdf-header="${docHeader}">
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

    // Header
    const hc = _hexToRgb('#2c3e50');
    doc.setFillColor(hc.r, hc.g, hc.b);
    doc.rect(mg, y, cw, 10, 'F');
    _pdfTxt(doc, '5 TIERRAS  |  DOCUMENTO DIGITAL', mg+4, y+6.8, {bold:true, size:9, color:'#ffffff'});
    _pdfTxt(doc, 'Cod: PROC-Venta-'+p.negId, mg+cw-55, y+6.8, {size:8, color:'#ffffff'});
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

    // Dynamic buttons
    let btnComprobanteHTML = '';
    if (estado === 'Reservada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-ver-comprobante" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-orange); color: var(--accent-orange); display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fa-solid fa-file-pdf"></i> Recibo Reserva
        </button>
      `;
    } else if (estado === 'Promesada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-revisar-borrador" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-blue); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fa-solid fa-file-contract"></i> Ver Contrato Promesa
        </button>
      `;
    } else if (estado === 'Vendida' || estado === 'Escriturada') {
      btnComprobanteHTML = `
        <button type="button" id="btn-ver-escritura" class="btn btn-outline" style="width: 100%; font-size: 0.8rem; padding: 6px; border-color: var(--accent-green); color: var(--accent-green); display: flex; align-items: center; justify-content: center; gap: 4px;">
          <i class="fa-solid fa-file-signature"></i> Ver Copia Escritura
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
          <div class="lote-ficha-header" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="${hitoIcon}" style="font-size: 1.15rem;"></i>
            <h4 style="margin:0; font-size: 0.88rem; font-weight:700;">${hitoTitle}</h4>
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
            superficie: propiedad.superficie ? propiedad.superficie.toLocaleString() + ' m2' : '',
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
    const docs = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(propiedad.id)) || [];
    
    // Resolve active negotiation for this property to get contract URL if any
    const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedad.id)) || [];
    const neg = negs && negs.length ? negs[negs.length - 1] : null;

    const hasDocs = docs.length > 0 || 
                    (propiedad.url && propiedad.url.trim() !== '') || 
                    (neg && neg.url && neg.url.trim() !== '');

    if (hasDocs) {
      let docsHtml = `
        <div class="lote-ficha" style="margin-top: 12px; padding: 10px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: 8px;">
          <div class="lote-ficha-header" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-brands fa-google-drive" style="color: var(--accent-blue); font-size: 1.1rem;"></i>
            <h4 style="margin: 0; font-size: 0.88rem; font-weight: 700;">Documentos en Drive</h4>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">`;
          
      if (propiedad.url && propiedad.url.trim() !== '') {
        docsHtml += `
          <a href="${propiedad.url}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; font-size: 0.78rem; color: var(--accent-green); background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 4px;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
            <span><i class="fa-solid fa-file-contract" style="margin-right: 6px;"></i> Documento Principal (Drive)</span>
            <i class="fa-solid fa-external-link" style="font-size: 0.65rem; color: var(--text-dim);"></i>
          </a>`;
      }
      
      if (neg && neg.url && neg.url.trim() !== '') {
        let docTitle = neg.id_proceso === 'Promesa' ? 'Contrato de Promesa' : 'Recibo / Ficha';
        let docIcon = neg.id_proceso === 'Promesa' ? 'fa-file-signature' : 'fa-receipt';
        let docColor = neg.id_proceso === 'Promesa' ? 'var(--accent-purple)' : 'var(--text-white)';
        docsHtml += `
          <a href="${neg.url}" target="_blank" style="display: flex; align-items: center; justify-content: space-between; text-decoration: none; font-size: 0.78rem; color: ${docColor}; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 4px;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
            <span><i class="fa-solid ${docIcon}" style="margin-right: 6px;"></i> ${docTitle}</span>
            <i class="fa-solid fa-external-link" style="font-size: 0.65rem; color: var(--text-dim);"></i>
          </a>`;
      }
      
      docs.forEach(d => {
        let icon = 'fa-file-pdf';
        let color = 'var(--accent-blue)';
        if (d.tipo_documento === 'Contrato') { icon = 'fa-file-signature'; color = 'var(--accent-purple)'; }
        else if (d.tipo_documento === 'Escritura') { icon = 'fa-gavel'; color = 'var(--accent-red)'; }
        else if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
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
          <form id="frm-direct-assignment" class="lote-ficha accent-success" style="padding: 12px; font-size: 0.8rem; border-radius: 8px;">
            <div class="lote-ficha-header" style="margin-bottom: 8px; display:flex; align-items:center; gap:6px;">
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

            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div class="form-group" id="group-precio_oferta" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Precio Venta *</label>
                <input type="text" name="precio_oferta" class="form-control" value="${precioFmt}" required style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
              <div class="form-group" id="group-monto_reserva" style="flex:1;">
                <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Monto Reserva</label>
                <input type="text" name="monto_reserva" class="form-control" value="${abonoFmt}" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
              </div>
            </div>

            <div class="form-group" id="group-metodo_pago" style="margin-bottom: 8px;">
              <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Método de Pago</label>
              <select name="metodo_pago" class="form-control" style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white);">
                <option>Transferencia</option><option>Depósito</option><option>Cheque</option>
              </select>
            </div>

            <div class="form-group" id="group-notas" style="margin-bottom: 12px;">
              <label style="font-size:0.75rem; font-weight:600; color:var(--text-dim); display:block; margin-bottom:2px;">Notas / Observaciones</label>
              <textarea name="notas" class="form-control" rows="2" placeholder="Notas sobre el cierre..." style="width:100%; padding:6px 8px; font-size:0.8rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:4px; color:var(--text-white); font-family:inherit; resize:vertical;"></textarea>
            </div>

            <!-- Action buttons -->
            <div style="display:flex; gap:8px;">
              <button type="button" id="btn-gerente-reserva" class="btn btn-success" style="flex:1; font-size:0.78rem; padding: 8px; display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fa-solid fa-money-bill-wave"></i> Registrar Reserva</button>
              <button type="button" id="btn-gerente-venta" class="btn btn-outline" style="flex:1; font-size:0.78rem; padding: 8px; border-color:var(--accent-purple); color:var(--accent-purple); display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fa-solid fa-bolt"></i> Venta Directa</button>
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
        container.querySelector('#btn-gerente-bloquear').addEventListener('click', () => {
          const confirmMsg = `¿Desea bloquear administrativamente el lote ${propiedad.nombre}? Quedará retirado de la venta pública.`;
          if (!confirm(confirmMsg)) return;

          APP5T_DB.update('propiedades', propiedad.id, { estado: 'Bloqueado' });
          APP5T_DB.logAudit('Sistema', 'Gerente', 'propiedades', 'Bloqueo Administrativo', propiedad.id, 'Propiedad: ' + propiedad.nombre);

          APP5T_Utils.showToast('Propiedad bloqueada administrativamente 🔒', 'success');
          if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
          window.APP5T.closeModal(true);
        });

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
              <div class="segmented-control" style="display: flex; gap: 10px;">
                <label class="segment-btn active" style="flex:1; text-align:center; padding: 12px 8px; background: rgba(46, 204, 113, 0.2); border: 1px solid var(--accent-green); border-radius: 8px; cursor: pointer; color: var(--text-white); font-weight: 600; transition: all 0.2s;">
                  <input type="radio" name="tipo_operacion" value="Reserva" checked style="display:none;">
                  💰 Reserva
                </label>
                <label class="segment-btn" style="flex:1; text-align:center; padding: 12px 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; color: var(--text-dim); font-weight: 600; transition: all 0.2s;">
                  <input type="radio" name="tipo_operacion" value="Venta_Directa" style="display:none;">
                  ⚡ Venta Directa
                </label>
              </div>
              <p id="tipo-operacion-hint" style="margin-top: 8px; font-size: 0.75rem; color: var(--text-dim);">
                El lote pasará a estado Reservado y requerirá firma de Promesa.
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
            ${_group('Precio Ofertado', `<input type="text" name="precio_oferta" class="form-control" value="${precioFmt}">`, 'precio_oferta')}
            ${_group('Monto Pie / Anticipo', `<input type="text" name="monto_reserva" class="form-control" value="$ 0">`, 'monto_reserva')}
            ${_group('Método de Pago', `<select name="metodo_pago" class="form-control">
              <option>Transferencia</option><option>Depósito</option><option>Cheque</option>
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

                formTitle.textContent = 'Solicitar Venta Directa';
                submitBtn.innerHTML   = '<i class="fa-solid fa-bolt"></i> Enviar Solicitud Venta Directa';
                submitBtn.className   = 'btn btn-success w-100 mt-3'; // Aseguramos que siempre sea success
                if (tipoHint) tipoHint.textContent = 'El lote saltará la etapa de promesa y pasará directamente a Escritura.';
                
                if (groupMontoReserva) {
                  groupMontoReserva.style.display = 'none';
                  const inp = groupMontoReserva.querySelector('input');
                  if (inp) inp.value = '0';
                }
              } else {
                selectedLbl.style.background = 'rgba(46, 204, 113, 0.2)';
                selectedLbl.style.borderColor = 'var(--accent-green)';
                selectedLbl.style.color = 'var(--text-white)';

                formTitle.textContent = 'Solicitar Reserva';
                submitBtn.innerHTML   = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Reserva';
                submitBtn.className   = 'btn btn-success w-100 mt-3'; // Aseguramos que siempre sea success
                if (tipoHint) tipoHint.textContent = 'El lote pasará a estado Reservado y requerirá firma de Promesa.';

                if (groupMontoReserva) {
                  groupMontoReserva.style.display = '';
                  const inp = groupMontoReserva.querySelector('input');
                  if (inp && inp.value === '0') inp.value = '$ 0';
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
              metodo_pago:     frm.querySelector('[name="metodo_pago"]').value,
              notas:           frm.querySelector('[name="notas"]').value,
              tipo_operacion:  operacionVal

            };

            const res = APP5T_DB.solicitarReserva(propiedad.id, idVendedor, idCliente, payload);
            if (res && !res.success) {
              APP5T_Utils.showToast(`Error al solicitar habilitación: ${res.error || 'Desconocido'}`, 'error');
              return;
            }
            const msgToast = esVentaDirecta
              ? 'Solicitud de Venta Directa enviada al Gerente ⚡'
              : 'Habilitación de reserva solicitada al Gerente';
            APP5T_Utils.showToast(msgToast, 'success');
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
            <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${clienteNom}</span></div>
            <div class="info-item"><span class="info-label">Abono</span><span class="info-value">${monto}</span></div>
            <div class="info-item"><span class="info-label">Precio Final</span><span class="info-value">${precioOf}</span></div>
            <div class="info-item"><span class="info-label">Margen</span><span class="info-value">${margen}%</span></div>
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

            ${_group('Precio Ofertado', `<input type="text" name="precio_oferta" class="form-control" value="${precioFmt}">`, 'precio_oferta')}
            ${_group('Monto Reserva', `<input type="text" name="monto_reserva" class="form-control" value="$ 0">`, 'monto_reserva')}
            ${_group('Método de Pago', `<select name="metodo_pago" class="form-control">
              <option>Transferencia</option><option>Depósito</option><option>Cheque</option>
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
              <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${clienteNom}</span></div>
              <div class="info-item"><span class="info-label">RUT</span><span class="info-value">${clienteRut}</span></div>
              <div class="info-item"><span class="info-label">Correo</span><span class="info-value">${clienteMail}</span></div>
              <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">${clienteFono}</span></div>
              <hr style="border:none; border-top:1px solid rgba(255,255,255,0.05); margin:6px 0;">
              <div class="info-item"><span class="info-label">Vendedor</span><span class="info-value">${vendedorNom}</span></div>
              <div class="info-item"><span class="info-label">Monto Reserva</span><span class="info-value">${APP5T_Utils.formatMoneda(neg.pie || neg.monto_reserva || 0)}</span></div>
              <div class="info-item"><span class="info-label">Precio Final</span><span class="info-value">${APP5T_Utils.formatMoneda(neg.valor_final || propiedad.valor_final || 0)}</span></div>
              <div class="info-item"><span class="info-label">Fecha Solicitud</span><span class="info-value">${APP5T_Utils.formatFecha(fechaReserva)}</span></div>
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
            <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${cliNom}</span></div>
            <div class="info-item"><span class="info-label">Valor</span><span class="info-value">${valorFmt}</span></div>
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
              <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${clienteNom}</span></div>
              <div class="info-item"><span class="info-label">RUT</span><span class="info-value">${clienteRut}</span></div>
              <div class="info-item"><span class="info-label">Correo</span><span class="info-value">${clienteMail}</span></div>
              <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">${clienteFono}</span></div>
              <hr style="border:none; border-top:1px solid rgba(255,255,255,0.05); margin:6px 0;">
              <div class="info-item"><span class="info-label">Vendedor</span><span class="info-value">${vendedorNom}</span></div>
              <div class="info-item"><span class="info-label">Monto Reserva/Abono</span><span class="info-value">${APP5T_Utils.formatMoneda(abono)}</span></div>
              <div class="info-item"><span class="info-label">Precio Final Venta</span><span class="info-value">${APP5T_Utils.formatMoneda(precioFinal)}</span></div>
              <div class="info-item"><span class="info-label">Fecha Promesa</span><span class="info-value">${APP5T_Utils.formatFecha(fechaPromesa)}</span></div>
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
      const cliente = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      container.innerHTML = `
        <div class="form-card locked-panel">
          <div class="locked-icon"><i class="fa-solid fa-lock"></i></div>
          <h4>LOTE VENDIDO — Escritura inscrita</h4>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${cliente ? `${cliente.nombres} ${cliente.apellidos}` : '—'}</span></div>
            <div class="info-item"><span class="info-label">Precio Final</span><span class="info-value">${APP5T_Utils.formatMoneda(neg ? neg.valor_final : propiedad.valor_final)}</span></div>
            <div class="info-item"><span class="info-label">Fecha Venta</span><span class="info-value">${propiedad.fecha_venta || '—'}</span></div>
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
          input = `<input type="${f.type || 'text'}" name="${f.key}" class="form-control" value="${val}" ${reqAttr}>`;
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
     renderPagoForm
     ══════════════════════════════════════════════════════ */
  function renderPagoForm(container, ctaCte) {
    if (!container || !ctaCte) return;

    const toIsoDate = ddMmYyyy => {
      if (!ddMmYyyy) return '';
      const parts = ddMmYyyy.split('/');
      if (parts.length !== 3) return ddMmYyyy;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const toDdMmYyyy = yyyyMmDd => {
      if (!yyyyMmDd) return '';
      const parts = yyyyMmDd.split('-');
      if (parts.length !== 3) return yyyyMmDd;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const defaultFechaPago = toIsoDate(ctaCte.fecha_vencimiento) || new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <form id="frm-pago" class="form-card">
        <h4><i class="fa-solid fa-money-check-dollar"></i> Registrar Pago</h4>
        <div class="info-grid" style="margin-bottom:1rem;">
          <div class="info-item"><span class="info-label">Cuota</span><span class="info-value">#${ctaCte.cuota_nro || '—'}</span></div>
          <div class="info-item"><span class="info-label">Valor Cuota</span><span class="info-value">${APP5T_Utils.formatMoneda(ctaCte.valor_cuota || 0)}</span></div>
        </div>
        ${_group('Valor Pagado', `<input type="text" name="valor_pagado" class="form-control" value="${APP5T_Utils.formatMoneda(ctaCte.valor_cuota || 0)}">`, 'valor_pagado')}
        ${_group('Fecha de Pago', `<input type="date" name="fecha_pago" class="form-control" value="${defaultFechaPago}">`, 'fecha_pago')}
        ${_group('Modalidad de Pago', `
          <select name="metodo_pago" class="form-control" style="background-color: var(--glass-bg); color: var(--text-white); border: 1px solid var(--glass-border); padding: 6px 12px; border-radius: 4px; width: 100%;">
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Cheque">Cheque</option>
          </select>
        `, 'metodo_pago')}
        ${_group('URL Comprobante', `<input type="url" name="url_comprobante" class="form-control" placeholder="https://...">`, 'url_comprobante')}
        <button type="submit" class="btn btn-primary" style="margin-top: 10px; width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;"><i class="fa-solid fa-receipt"></i> Registrar Pago</button>
      </form>`;

    container.querySelector('#frm-pago').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const frm = e.target;
        const valorPagado = APP5T_Utils.parseMoneda(frm.querySelector('[name="valor_pagado"]').value);
        const fechaPago = toDdMmYyyy(frm.querySelector('[name="fecha_pago"]').value);
        const url = frm.querySelector('[name="url_comprobante"]').value;
        const metodoPago = frm.querySelector('[name="metodo_pago"]').value;

        if (!valorPagado || valorPagado <= 0) {
          APP5T_Utils.showToast('Ingrese un valor de pago válido', 'warning');
          return;
        }

        const res = APP5T_DB.registrarPago(ctaCte.id, valorPagado, fechaPago, url, metodoPago);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al registrar pago: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast('Pago registrado exitosamente', 'success');
        if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
        window.APP5T.closeModal(true);
      } catch (err) {
        console.error(err);
        alert(`Error al registrar pago: ${err.message}`);
      }
    });
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
          <div class="info-item" style="display: flex; flex-direction: column;"><span class="info-label" style="font-size: 0.75rem; color: var(--text-dim);">Cliente</span><span class="info-value" style="font-weight: 600; color: var(--text-white);">${cliNom}</span></div>
          <div class="info-item" style="display: flex; flex-direction: column;"><span class="info-label" style="font-size: 0.75rem; color: var(--text-dim);">Propiedad</span><span class="info-value" style="font-weight: 600; color: var(--text-white);">${loteProy}</span></div>
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
      superficie: prop.superficie ? prop.superficie.toLocaleString() + ' m2' : '',
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
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  const api = { renderLoteForm, renderCRUDTable, renderPagoForm, renderActivarCtaCteForm, _addRecord, _editRecord, _deleteRecord, vincularDocumentoLote, descargarPDFSimulado, generarHTMLComprobanteReserva, mostrarComprobanteReservaSimulado };
  window.APP5T_Forms = api;
  return api;
})();






