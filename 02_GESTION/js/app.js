/**
 * =====================================================
 * APP.JS - APP5T  (Main SPA Controller)
 * CRM & GIS Unificado - 5 Tierras
 * =====================================================
 */
const APP5T = (() => {
  'use strict';

  /* ══════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════ */
  let activeRole = 'gerente';
  function _cleanWAPhone(telRaw) {
    if (!telRaw) return '56994455663';
    let digits = String(telRaw).replace(/[^0-9]/g, '');
    if (!digits) return '56994455663';
    if (digits.length === 9 && digits.startsWith('9')) {
      digits = '56' + digits;
    }
    return digits;
  }

  function _showWAFallbackModal(url, phone) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Abrir WhatsApp',
        html: 'Tu navegador ha bloqueado la ventana emergente.<br><br>Haz clic en el botón para enviar el mensaje a <strong>+' + phone + '</strong>:',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-brands fa-whatsapp"></i> Abrir WhatsApp Ahora',
        confirmButtonColor: '#25D366',
        cancelButtonText: 'Cerrar'
      }).then(function(res) {
        if (res.isConfirmed) {
          window.open(url, '_blank') || (window.location.href = url);
        }
      });
    } else {
      if (window.confirm('Tu navegador bloqueó la ventana emergente. Haz clic en Aceptar para enviar mensaje por WhatsApp (+' + phone + '):')) {
        window.location.href = url;
      }
    }
  }

  function _openWhatsApp(telRaw, text) {
    const cleanTel = _cleanWAPhone(telRaw);
    const encodedText = encodeURIComponent(text || '');
    const url = 'https://api.whatsapp.com/send?phone=' + cleanTel + '&text=' + encodedText;

    try {
      const win = window.open(url, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        _showWAFallbackModal(url, cleanTel);
      }
    } catch (e) {
      console.warn('APP5T: Popup emergente bloqueado por navegador, mostrando enlace directo.', e);
      _showWAFallbackModal(url, cleanTel);
    }
  }

  function _getWAConfig() {
    let telGerente = '56994455663'; // Fallback por defecto
    try {
      if (typeof APP5T_DB !== 'undefined' && APP5T_DB.query) {
        const directorio = (typeof APP5T_DB.getAll === 'function' ? APP5T_DB.getAll('directorio') : (typeof APP5T_DB.query === 'function' ? APP5T_DB.query('directorio') : [])) || [];
        if (directorio && directorio.length) {
          const gerente = directorio.find(function(d) {
            return d.cargo && (d.cargo.toLowerCase().includes('gerente') || d.cargo.toLowerCase().includes('director'));
          });
          if (gerente && gerente.telefono) {
            const cleanTel = _cleanWAPhone(gerente.telefono);
            if (cleanTel) telGerente = cleanTel;
          }
        }
      }
    } catch (e) {
      console.warn('APP5T: Error al resolver teléfono de Gerencia desde Directorio.', e);
    }

    return {
      tel: telGerente,
      msgGer: '⏳ *SOLICITUD DE RESERVA - 5 TIERRAS*\n\n📍 *Proyecto*: #PROYECTO#\n🏡 *Lote*: #LOTE#\n👤 *Cliente*: #CLIENTE#\n💼 *Vendedor*: #VENDEDOR#\n💰 *Pie*: #PIE#\n\nPor favor ingresar al sistema para revisar y aprobar la reserva.',
      msgEsc: '⚖️ *SOLICITUD DE ESCRITURACIÓN - 5 TIERRAS*\n\n📍 *Proyecto*: #PROYECTO#\n🏡 *Lote*: #LOTE#\n👤 *Cliente*: #CLIENTE#\n\nEstado: Pagado 100% / Ficha Legal Generada.\nPor favor ingresar al sistema para revisar y autorizar la firma en Notaría.'
    };
  }

  if (typeof window !== 'undefined') {
    window._getWAConfig = _getWAConfig;
    window.APP5T_openWhatsApp = _openWhatsApp;
  function _limpiarLoteGlobal(idOrNombre) {
    if (typeof APP5T_DB !== 'undefined' && typeof APP5T_DB.limpiarLotePorId === 'function') {
      const res = APP5T_DB.limpiarLotePorId(idOrNombre);
      if (res.success) {
        if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Lote ' + idOrNombre + ' limpiado con éxito.', 'success');
        if (typeof refreshAll === 'function') refreshAll();
      } else {
        if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast(res.error, 'error');
      }
      return res;
    }
  }

  if (typeof window !== 'undefined') {
    window.APP5T_limpiarLote = _limpiarLoteGlobal;

  }
  }

  let activeTab = 'mapa';
  let _lastActiveProject = null; // Recuerda el último proyecto activo/visitado
  let isMobile = window.innerWidth < 768;
  let adminUnlocked = false;
  let lastFilteredInformes = [];
  let _approvalsPollInterval = null; // auto-pull timer (kept for cleanup only)
  let _mesaGerenciaActiveTab = 0;   // 0 = cerrado por defecto (1|2|3 para abrir)
  let _mesaGerenciaManualTab = true; // true para no forzar apertura automatica

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
        const userNom = String(u.nombre || u.name || '').trim().toLowerCase();
        if (userNom) {
          const matchNom = vendedores.find(v => String(v.nombre || '').trim().toLowerCase() === userNom);
          if (matchNom) return matchNom;
        }
      } catch (e) {}
    }
    return vendedores[0]; 
  }

  let activeGestionTab = {
    vendedor: 'leads',
    gerente: 'aprobaciones',
    administrador: 'mesa'
  };

  /* ══════════════════════════════════════════════════════
     MENU CONFIGURATION PER ROLE
     ══════════════════════════════════════════════════════ */
  const ALL_MENUS = [
    { 
      id: 'proyectos_group', 
      icon: 'fa-map-location-dot', 
      label: 'Proyectos', 
      isGroup: true,
      children: [
        { id: 'mapa-todos', label: 'Todos los Proyectos' },
        { id: 'mapa-El Copihue', label: 'El Copihue' },
        { id: 'mapa-Las Brisas', label: 'Las Brisas' },
        { id: 'mapa-Los Encinos', label: 'Los Encinos' },
        { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
      ]
    },
    { id: 'dashboard',  icon: 'fa-chart-line',           label: 'Dashboard' },
    { id: 'leads',      icon: 'fa-users',                label: 'Mis Clientes' },
    { id: 'aprobaciones',icon: 'fa-stamp',               label: 'Aprobaciones' },
    { id: 'mesa',       icon: 'fa-file-contract',        label: 'Mesa Documental' },
    { id: 'ctacte',     icon: 'fa-money-check-dollar',   label: 'Cuenta Corriente' },
    { id: 'informes',   icon: 'fa-file-invoice-dollar',  label: 'Informes Mensuales' },      
    { id: 'carga',      icon: 'fa-database',             label: 'Carga de Datos' },
    { id: 'inventario', icon: 'fa-list-check',           label: 'Inventario' },
    { id: 'auditoria',  icon: 'fa-clock-rotate-left',    label: 'Auditoría' }
  ];

  /* Secciones visuales en bloques diferenciados para perfil Administración */
  /* Secciones visuales optimizadas para perfil Administración:
     Prioridad absoluta en Operación Diaria (Mesa Documental & Cuenta Corriente) */
  const ADMIN_SECTIONS = [
    {
      title: 'Operación Diaria',
      icon: 'fa-bolt',
      theme: 'cyan',
      items: [
        { id: 'mesa',       icon: 'fa-file-contract',        label: 'Mesa Documental', hasBadge: true, badgeType: 'mesa' },
        { id: 'ctacte',     icon: 'fa-money-check-dollar',   label: 'Cuenta Corriente' }
      ]
    },
    {
      title: 'Gestión Comercial y Terrenos',
      icon: 'fa-building-circle-check',
      theme: 'emerald',
      items: [
        { id: 'inventario', icon: 'fa-list-check',           label: 'Inventario' },
        { id: 'leads',      icon: 'fa-users',                label: 'Clientes' },
        { 
          id: 'proyectos_group', 
          icon: 'fa-map-location-dot', 
          label: 'Proyectos y Mapa', 
          isGroup: true,
          children: [
            { id: 'mapa-todos', label: 'Todos los Proyectos' },
            { id: 'mapa-El Copihue', label: 'El Copihue' },
            { id: 'mapa-Las Brisas', label: 'Las Brisas' },
            { id: 'mapa-Los Encinos', label: 'Los Encinos' },
            { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
          ]
        }
      ]
    },
    {
      title: 'Análisis y Sistema',
      icon: 'fa-sliders',
      theme: 'purple',
      items: [
        { id: 'dashboard',  icon: 'fa-chart-line',           label: 'Dashboard' },
        { id: 'informes',   icon: 'fa-file-invoice-dollar',  label: 'Informes Mensuales' },
        { id: 'carga',      icon: 'fa-database',             label: 'Carga de Datos' },
        { id: 'auditoria',  icon: 'fa-clock-rotate-left',    label: 'Auditoría' }
      ]
    }
  ];

  /* Secciones ejecutivas para perfil Gerencia:
     Prioridad #1: Aprobaciones (con indicador en vivo de pendientes)
     Flujo móvil rápido y supervisión estratégica */
  const GERENTE_SECTIONS = [
    {
      title: 'Toma de Decisiones',
      icon: 'fa-stamp',
      theme: 'amber',
      items: [
        { id: 'aprobaciones', icon: 'fa-stamp', label: 'Bandeja Aprobaciones', hasBadge: true, badgeType: 'aprobaciones' }
      ]
    },
    {
      title: 'Visión Estratégica',
      icon: 'fa-chart-pie',
      theme: 'cyan',
      items: [
        { id: 'dashboard',    icon: 'fa-chart-line',         label: 'Dashboard Ejecutivo' },
        { 
          id: 'proyectos_group', 
          icon: 'fa-map-location-dot', 
          label: 'Proyectos y Mapa', 
          isGroup: true,
          children: [
            { id: 'mapa-todos', label: 'Todos los Proyectos' },
            { id: 'mapa-El Copihue', label: 'El Copihue' },
            { id: 'mapa-Las Brisas', label: 'Las Brisas' },
            { id: 'mapa-Los Encinos', label: 'Los Encinos' },
            { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
          ]
        }
      ]
    },
    {
      title: 'Supervisión y Control',
      icon: 'fa-shield-halved',
      theme: 'purple',
      items: [
        { id: 'inventario', icon: 'fa-list-check',          label: 'Inventario General' },
        { id: 'leads',      icon: 'fa-users',               label: 'Clientes y Ventas' },
        { id: 'informes',   icon: 'fa-file-invoice-dollar', label: 'Informes Financieros' },
        { id: 'auditoria',  icon: 'fa-clock-rotate-left',   label: 'Auditoría' }
      ]
    }
  ];

  /* Menú enfocado para Vendedor:
     Minimalista, directo al mapa y gestión de clientes */
  const VENDEDOR_MENUS = [
    { 
      id: 'proyectos_group', 
      icon: 'fa-map-location-dot', 
      label: 'Proyectos y Mapa', 
      isGroup: true,
      children: [
        { id: 'mapa-todos', label: 'Todos los Proyectos' },
        { id: 'mapa-El Copihue', label: 'El Copihue' },
        { id: 'mapa-Las Brisas', label: 'Las Brisas' },
        { id: 'mapa-Los Encinos', label: 'Los Encinos' },
        { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
      ]
    },
    { id: 'leads',      icon: 'fa-users',      label: 'Mis Clientes' },
    { id: 'inventario', icon: 'fa-list-check', label: 'Inventario' }
  ];

  const ADMIN_MENUS = ADMIN_SECTIONS.flatMap(sec => sec.items);
  const GERENTE_MENUS = GERENTE_SECTIONS.flatMap(sec => sec.items);

  const MENUS = {
    vendedor: VENDEDOR_MENUS,
    gerente: GERENTE_MENUS,
    administrador: ADMIN_MENUS
  };

  const ROLE_NAMES = {
    vendedor:      { name: 'Manuel Matus',  title: 'Fuerza de Ventas' },
    administrador: { name: 'Pia Erices',    title: 'Administración' },
    gerente:       { name: 'Daniel Gajardo',title: 'Gerencia' }
  };

  /* ══════════════════════════════════════════════════════
     STATUS BADGE HELPER
     ══════════════════════════════════════════════════════ */
  function getStatusBadgeHTML(estado) {
    if (estado === 'Venta_Directa') {
      return `<span class="tag tag-venta-directa"><i class="fa-solid fa-bolt"></i> Venta Directa</span>`;
    }
    const clean = (estado || '').toLowerCase().replace(/\s+/g, '-');
    return `<span class="tag tag-${clean}">${estado || '-'}</span>`;
  }

  /* ══════════════════════════════════════════════════════
     SIDEBAR & NAV
     ══════════════════════════════════════════════════════ */
  const TAB_PERMISSIONS = {
    dashboard: 'Dashboard_Financiero',
    mapa: 'Buscador_Mapa',
    'mapa-todos': 'Buscador_Mapa',
    proyectos_group: 'Buscador_Mapa',
    leads: 'Mis_Leads',
    aprobaciones: 'Bandeja_Aprobaciones',
    precios: 'Control_Precios',
    mesa: 'Mesa_Documental',
    catalogo: 'Mesa_Documental',
    ctacte: 'Cuenta_Corriente',
    informes: 'Cuenta_Corriente',
    carga: 'Carga_Datos',
    inventario: 'Inventario',
    auditoria: 'Auditoria',
    'admin-general': 'Configuracion_Sistema'
  };

  function mapRole(rolSheet) {
    const r = String(rolSheet || '').trim().toLowerCase();
    if (r === 'vendedor') return 'vendedor';
    if (r === 'gerencia' || r === 'gerente') return 'gerente';
    if (r === 'administracion' || r === 'administrador') return 'administrador';
    return 'vendedor';
  }

  function getRoleKey(rol) {
    const r = String(rol || '').trim().toLowerCase();
    if (r === 'vendedor') return 'Vendedor';
    if (r === 'gerencia' || r === 'gerente') return 'Gerencia';
    if (r === 'administracion' || r === 'administrador') return 'Administracion';
    return 'Vendedor';
  }

  function hasPermission(moduleName, queryRole = null) {
    // Mis_Leads (Cartera de Clientes / Búsqueda) está disponible para todos los roles (Vendedor, Gerencia y Administración)
    if (moduleName === 'Mis_Leads') return true;

    const userSession = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
    const u = userSession ? JSON.parse(userSession) : {};
    const roleToUse = queryRole ? getRoleKey(queryRole) : (typeof activeRole !== 'undefined' && activeRole ? getRoleKey(activeRole) : getRoleKey(u.rol || u.Rol));

    // Gerencia tiene habilitados los módulos clave de su vista ejecutiva
    if (roleToUse === 'Gerencia' && ['Dashboard_Financiero', 'Bandeja_Aprobaciones', 'Buscador_Mapa', 'Inventario', 'Mis_Leads', 'Mesa_Documental', 'Cuenta_Corriente', 'Auditoria'].includes(moduleName)) {
      return true;
    }

    if (!userSession) return false;
    const permsRaw = sessionStorage.getItem('app5t_permisos') || localStorage.getItem('app5t_permisos') || '[]';
    let perms = [];
    try { perms = JSON.parse(permsRaw); } catch(e) { perms = []; }
    
    const perm = perms.find(p => (p.Componente_Modulo || p.componente_modulo) === moduleName);
    if (!perm) return false; // Zero-trust default
    
    const roleColUpper = 'Acceso_' + roleToUse;
    const roleColLower = 'acceso_' + roleToUse.toLowerCase();
    const val = perm[roleColUpper] !== undefined ? perm[roleColUpper] : perm[roleColLower];
    
    return val === true || String(val).toUpperCase() === 'TRUE';
  }

  function evaluarPermisosYRenderizar(permisos, rolUsuario) {
    if (!Array.isArray(permisos)) permisos = [];
    const roleKey = getRoleKey(rolUsuario);
    const roleColUpper = 'Acceso_' + roleKey;
    const roleColLower = 'acceso_' + roleKey.toLowerCase();
    const pMap = {};
    permisos.forEach(p => {
      const val = p[roleColUpper] !== undefined ? p[roleColUpper] : p[roleColLower];
      const mod = p.Componente_Modulo || p.componente_modulo;
      pMap[mod] = val === true || String(val).toUpperCase() === 'TRUE';
    });

    // Mis_Leads siempre visible para todos los perfiles
    pMap['Mis_Leads'] = true;

    // Para Gerencia, habilitar paneles de su menú ejecutivo
    if (roleKey === 'Gerencia') {
      pMap['Cuenta_Corriente'] = true; // Permite el panel-informes
      pMap['Auditoria'] = true;
      pMap['Dashboard_Financiero'] = true;
      pMap['Bandeja_Aprobaciones'] = true;
      pMap['Buscador_Mapa'] = true;
      pMap['Inventario'] = true;
    }

    Object.entries(TAB_PERMISSIONS).forEach(([tabId, permName]) => {
      const hasAccess = pMap[permName];
      const panel = document.getElementById('panel-' + tabId);
      if (panel) {
        if (hasAccess) {
          panel.classList.remove('hidden-by-permission');
        } else {
          panel.classList.add('hidden-by-permission');
          panel.classList.remove('active');
        }
      }
    });

    let styleEl = document.getElementById('security-rules');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'security-rules';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `.hidden-by-permission { display: none !important; }`;

    if (pMap['Formulario_Reserva'] === false) {
      const els = document.querySelectorAll('#lote-action-form, #lote-action-form-mobile, .btn-reservar, .btn-reserva');
      els.forEach(el => el.style.display = 'none');
    }
    if (pMap['Carga_PDF_Promesa'] === false) {
      const els = document.querySelectorAll('.btn-upload-promesa, .upload-promesa-container');
      els.forEach(el => el.style.display = 'none');
    }
    
    if (roleKey === 'Administracion') {
      adminUnlocked = true;
    } else {
      adminUnlocked = false;
    }
  }

  function _isTabVisible(role, tabId, item) {
    if (item && item.isSection) return true;
    if (!tabId) return true;
    if (tabId === 'proyectos_group' || tabId === 'mapa' || tabId === 'mapa-todos' || (typeof tabId === 'string' && tabId.startsWith('mapa-'))) {
      return hasPermission('Buscador_Mapa', getRoleKey(role));
    }
    if (role === 'gerente') {
      const allowedGerenteTabs = ['dashboard', 'aprobaciones', 'proyectos_group', 'inventario', 'leads', 'informes', 'auditoria'];
      if (allowedGerenteTabs.includes(tabId)) return true;
    }
    const permName = TAB_PERMISSIONS[tabId];
    if (!permName) return true;
    return hasPermission(permName, getRoleKey(role));
  }

  function _buildSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // Helper to calculate live pending counts for badges
    function _getSidebarBadgeHtml(item) {
      if (typeof APP5T_DB === 'undefined' || !APP5T_DB.getAll) return '';
      try {
        const props = APP5T_DB.getAll('propiedades') || [];
        if (item.id === 'aprobaciones') {
          const pendCount = props.filter(p => String(p.estado || '').toLowerCase() === 'pendiente').length;
          if (pendCount > 0) {
            return `<span class="nav-badge" style="margin-left:auto; background:#f59e0b; color:#0f172a; font-weight:800; font-size:0.72rem; padding:2px 7px; border-radius:10px; box-shadow:0 0 10px rgba(245,158,11,0.5); border:1px solid rgba(255,255,255,0.2);">${pendCount}</span>`;
          }
        } else if (item.id === 'mesa') {
          const resCount = props.filter(p => {
            const st = String(p.estado || '').toLowerCase();
            return st === 'reservada' || st === 'reservado';
          }).length;
          if (resCount > 0) {
            return `<span class="nav-badge" style="margin-left:auto; background:#00e5ff; color:#0f172a; font-weight:800; font-size:0.72rem; padding:2px 7px; border-radius:10px; box-shadow:0 0 10px rgba(0,229,255,0.4); border:1px solid rgba(255,255,255,0.2);">${resCount}</span>`;
          }
        }
      } catch (e) {
        console.warn('Error calculating sidebar badge:', e);
      }
      return '';
    }

    if (role === 'administrador' || role === 'gerente') {
      const sections = (role === 'gerente') ? GERENTE_SECTIONS : ADMIN_SECTIONS;
      // Perfiles Gerencia y Administración: Bloques visuales estructurados y diferenciados con riel neón 3D
      nav.innerHTML = sections.map(sec => {
        let secItems = sec.items.filter(m => _isTabVisible(role, m.id));
        if (role === 'administrador' && sec.title.includes('Sistema') && adminUnlocked) {
          secItems = secItems.concat([{ id: 'admin-general', icon: 'fa-gears', label: 'Admin. General' }]);
        } else if (role === 'gerente' && sec.title.includes('Supervisión') && adminUnlocked) {
          secItems = secItems.concat([{ id: 'admin-general', icon: 'fa-gears', label: 'Admin. General' }]);
        }
        if (secItems.length === 0) return '';

        const itemsHTML = secItems.map(m => {
          const badgeHtml = _getSidebarBadgeHtml(m);
          if (m.isGroup) {
            return `
              <div class="nav-group" style="position: relative;">
                <a href="#" class="nav-item group-toggle" data-tab="${m.id}">
                  <i class="fa-solid ${m.icon}"></i>
                  <span>${m.label}</span>
                  ${badgeHtml}
                  <i class="fa-solid fa-chevron-right group-arrow" style="margin-left: auto; font-size: 0.75rem; transition: transform 0.2s;"></i>
                </a>
                <div class="nav-group-children" id="group-${m.id}" style="display: none; flex-direction: column;">
                  ${m.children.map(child => `
                    <a href="#" class="nav-item child-item${child.id === activeTab ? ' active' : ''}" data-tab="${child.id}" style="font-size: 0.88rem; padding: 9px 12px; white-space: nowrap;">
                      <i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 8px;"></i>
                      <span>${child.label}</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            // Priority highlight for aprobaciones when pending
            const isPriority = m.id === 'aprobaciones' && badgeHtml !== '';
            const priorityStyle = isPriority ? 'background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700;' : '';
            return `
              <a href="#" class="nav-item${m.id === activeTab ? ' active' : ''}" data-tab="${m.id}" style="${priorityStyle}">
                <i class="fa-solid ${m.icon}" style="${isPriority ? 'color: #f59e0b;' : ''}"></i>
                <span>${m.label}</span>
                ${badgeHtml}
              </a>
            `;
          }
        }).join('');

        return `
          <div class="sidebar-block sidebar-block-${sec.theme || 'cyan'}">
            <div class="sidebar-block-header">
              <i class="fa-solid ${sec.icon}"></i>
              <span>${sec.title}</span>
            </div>
            <div class="sidebar-block-content">
              ${itemsHTML}
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Vendedor: formato enfocado y limpio
      let items = MENUS[role] || [];
      items = items.filter(m => _isTabVisible(role, m.id));

      if (adminUnlocked) {
        items = items.concat([{ id: 'admin-general', icon: 'fa-gears', label: 'Admin. General' }]);
      }
      
      nav.innerHTML = items.map(m => {
        if (m.isGroup) {
          return `
            <div class="nav-group" style="position: relative;">
              <a href="#" class="nav-item group-toggle" data-tab="${m.id}">
                <i class="fa-solid ${m.icon}"></i>
                <span>${m.label}</span>
                <i class="fa-solid fa-chevron-right group-arrow" style="margin-left: auto; font-size: 0.8rem; transition: transform 0.2s;"></i>
              </a>
              <div class="nav-group-children" id="group-${m.id}" style="display: none; flex-direction: column;">
                ${m.children.map(child => `
                  <a href="#" class="nav-item child-item${child.id === activeTab ? ' active' : ''}" data-tab="${child.id}" style="font-size: 0.9rem; padding: 10px 12px; white-space: nowrap;">
                    <i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 8px;"></i>
                    <span>${child.label}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          return `
            <a href="#" class="nav-item${m.id === activeTab ? ' active' : ''}" data-tab="${m.id}">
              <i class="fa-solid ${m.icon}"></i>
              <span>${m.label}</span>
            </a>
          `;
        }
      }).join('');
    }

    // Attach click listeners
    nav.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (link.classList.contains('group-toggle')) {
           e.stopPropagation();
           const parent = link.closest('.nav-group');
           const childrenContainer = parent.querySelector('.nav-group-children');
           const arrow = link.querySelector('.group-arrow');
           const isVisible = childrenContainer && childrenContainer.style.display !== 'none';
           
           // Cerrar cualquier otro grupo abierto
           document.querySelectorAll('.nav-group-children').forEach(el => { el.style.display = 'none'; });
           document.querySelectorAll('.group-toggle .group-arrow').forEach(arr => { arr.style.transform = 'rotate(0deg)'; });

           if (!isVisible && childrenContainer) {
             childrenContainer.style.display = 'flex';
             if (arrow) arrow.style.transform = 'rotate(90deg)';
           }
           return;
        }
        const tabId = link.getAttribute('data-tab');
        if (link.classList.contains('child-item')) {
           const parent = link.closest('.nav-group');
           if (parent) {
             const childrenContainer = parent.querySelector('.nav-group-children');
             const arrow = parent.querySelector('.group-arrow');
             if (childrenContainer) childrenContainer.style.display = 'none';
             if (arrow) arrow.style.transform = 'rotate(0deg)';
           }
        }
        switchTab(tabId);
      });
    });

    // Cerrar submenú al hacer clic fuera o presionar Escape
    if (!window._navGroupOutsideListenerAttached) {
      window._navGroupOutsideListenerAttached = true;
      document.addEventListener('click', e => {
        if (!e.target.closest('.nav-group')) {
          document.querySelectorAll('.nav-group-children').forEach(el => {
            el.style.display = 'none';
          });
          document.querySelectorAll('.group-toggle .group-arrow').forEach(arr => {
            arr.style.transform = 'rotate(0deg)';
          });
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.nav-group-children').forEach(el => {
            el.style.display = 'none';
          });
          document.querySelectorAll('.group-toggle .group-arrow').forEach(arr => {
            arr.style.transform = 'rotate(0deg)';
          });
        }
      });
    }
  }

  function _updateUserInfo(role) {
    const sessionUser = sessionStorage.getItem('app5t_user');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    
    if (sessionUser) {
      const u = JSON.parse(sessionUser);
      if (nameEl) nameEl.textContent = u.Nombre || u.nombre || 'Usuario';
      
      let title = u.Rol || u.rol;
      if (title === 'Vendedor') title = 'Fuerza de Ventas';
      if (title === 'Gerencia') title = 'Dirección Comercial';
      if (title === 'Administracion') title = 'Administración General';
      if (roleEl) roleEl.textContent = title;
    } else {
      const info = ROLE_NAMES[role] || ROLE_NAMES.vendedor;
      if (nameEl) nameEl.textContent = info.name;
      if (roleEl) roleEl.textContent = info.title;
    }
  }

  function _updateBreadcrumb(tabId) {
    const bc = document.getElementById('breadcrumb-current');
    if (bc) {
      const items = MENUS[activeRole] || [];
      let found = items.find(m => m.id === tabId);
      if (!found) {
        for (const m of items) {
          if (m.children) {
            found = m.children.find(c => c.id === tabId);
            if (found) break;
          }
        }
      }
      bc.textContent = found ? found.label : (tabId === 'admin-general' ? 'Admin. General' : tabId);
    }

        // Botón dinámico 'Volver al Mapa' (Ícono representativo) a la izquierda del header
    const btnBackMap = document.getElementById('btn-header-back-map');
    if (btnBackMap) {
      const isMap = tabId.startsWith('mapa-') || tabId === 'mapa';
      if (isMap) {
        btnBackMap.style.display = 'none';
      } else {
        btnBackMap.style.display = 'inline-flex';
        const targetProj = _lastActiveProject && _lastActiveProject !== 'todos' && _lastActiveProject !== 'all' ? _lastActiveProject : '';
        btnBackMap.title = targetProj ? `Volver al Mapa (${targetProj})` : 'Volver al Mapa';
      }
    }
  }

  function goBackToMap() {
    if (_lastActiveProject && _lastActiveProject !== 'todos' && _lastActiveProject !== 'all') {
      switchTab('mapa-' + _lastActiveProject);
    } else {
      switchTab('mapa');
    }
  }

  /* ══════════════════════════════════════════════════════
     SWITCH ROLE
     ══════════════════════════════════════════════════════ */
  function switchRole(role) {
    if (!MENUS[role]) role = 'vendedor';
    activeRole = role;

    // Track active role on document body classes for CSS targeting
    document.body.classList.remove('role-vendedor', 'role-gerente', 'role-administrador');
    document.body.classList.add('role-' + role);

    // Re-evaluate permissions for the active role
    const permsRaw = sessionStorage.getItem('app5t_permisos') || localStorage.getItem('app5t_permisos');
    if (permsRaw) {
      try {
        const perms = JSON.parse(permsRaw);
        evaluarPermisosYRenderizar(perms, getRoleKey(role));
      } catch(e) {}
    }

    _updateUserInfo(role);
    _buildSidebar(role);

    // Sync role buttons active class
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-role') === role);
    });

    // Hide map status filter group for vendedor and reset map filters
    const statusFilterGroup = document.getElementById('map-status-filter-group');
    if (statusFilterGroup) {
      statusFilterGroup.style.display = (role === 'vendedor') ? 'none' : 'flex';
    }
    const mapFilter = document.getElementById('map-status-filter');
    if (mapFilter && role === 'vendedor') {
      mapFilter.value = 'todos';
      if (typeof APP5T_Map !== 'undefined' && APP5T_Map.applyFilter) {
        APP5T_Map.applyFilter('todos');
      }
    }

    // Switch to first tab of the new role that is permitted
    let visibleMenus = (MENUS[role] || []).filter(m => !m.isSection && _isTabVisible(role, m.id, m));
    if (visibleMenus.length > 0) {
      let firstMenu = visibleMenus[0];
      let firstTabId = firstMenu.id;
      if (firstMenu.isGroup && firstMenu.children && firstMenu.children.length > 0) {
        firstTabId = firstMenu.children[0].id;
      }
      switchTab(firstTabId);
    }

    // Refresh currently selected lote panel if one is active on map and we are on the map tab
    const isMap = activeTab && (activeTab.startsWith('mapa-') || activeTab === 'mapa');
    if (isMap && typeof APP5T_Map !== 'undefined' && APP5T_Map.getSelectedLote) {
      const selected = APP5T_Map.getSelectedLote();
      if (selected) {
        const freshLote = APP5T_DB.getById('propiedades', selected.id);
        if (freshLote) {
          onLoteSelected(freshLote);
        }
      }
    }

    refreshAll();
  }

  /* ══════════════════════════════════════════════════════
     SWITCH TAB
     ══════════════════════════════════════════════════════ */
  
  function goToCuentaCorriente(idCliente, idPropiedad) {
    if (typeof closeModal === 'function') closeModal(true);
    switchTab('ctacte');
    
    // Allow DOM to update and initial render to complete
    setTimeout(() => {
      const cliEl = document.getElementById('ctacte-filter-cliente');
      if (cliEl) {
        cliEl.value = idCliente;
        cliEl.dispatchEvent(new Event('change'));
        
        // Wait for lot options to populate
        setTimeout(() => {
          const lotEl = document.getElementById('ctacte-filter-lote');
          if (lotEl) {
            lotEl.value = idPropiedad;
            lotEl.dispatchEvent(new Event('change'));
          }
        }, 100);
      }
    }, 300);
  }

  function switchTab(tabId) {
    const isMap = tabId.startsWith('mapa-') || tabId === 'mapa';
    const panelId = isMap ? 'panel-mapa' : `panel-${tabId}`;
    const baseTabId = isMap ? 'mapa' : tabId;

    // Zero-Trust validation: check if user has permission to see this tab
    const permName = TAB_PERMISSIONS[baseTabId];
    if (permName && !hasPermission(permName)) {
        console.warn('Acceso denegado a la pestaña:', baseTabId, 'Requiere:', permName);
        if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Acceso denegado: No tiene permisos para este módulo', 'error');
        return;
      }

    // Hide all panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    // Show target panel
    const target = document.getElementById(panelId);
    if (target) target.classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
    });

    _updateBreadcrumb(tabId);

    // Save active sub-tab for Gestion if applicable
    if (!isMap && tabId !== 'dashboard' && tabId !== 'admin-general') {
      activeGestionTab[activeRole] = tabId;
    }

    activeTab = tabId;

    // Refresh mobile navigation highlights
    _buildMobileNav(activeRole);
    _buildMobileChips();

    // Close bottom sheet & clear lot selection card when switching tabs
    clearLoteSelection();

    // Throttled background sync on tab switch (ensures multi-user updates are visible immediately)
    if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
      const now = Date.now();
      if (!window._lastTabSync || (now - window._lastTabSync > 5000)) {
        window._lastTabSync = now;
        APP5T_Sync.pullAll(true).catch(() => {});
      }
    }

    // ── Special tab actions ──
    if (tabId === 'admin-general') {
      _renderSettingsPermissionsMatrix();
    }

    if (tabId === 'ctacte') {
      if (_currentSelectedPropiedadId) {
        window._syncCtacteWithSelectedLot = true;
      }
      if (typeof _renderCtaCte === 'function') _renderCtaCte();
    }
    
    if (tabId === 'catalogo') {
      if (typeof _renderCatalogoDocumentos === 'function') _renderCatalogoDocumentos();
    }

    if (tabId === 'leads') {
      if (typeof _renderLeads === 'function') _renderLeads();
    }

    if (tabId === 'informes') {
      const ctacteCliente = document.getElementById('rep-ctacte-cliente');
      const ctacteLote = document.getElementById('rep-ctacte-lote');
      const ctacteProyecto = document.getElementById('rep-ctacte-proyecto');
      if (ctacteCliente) ctacteCliente.value = '';
      if (ctacteLote) ctacteLote.value = '';
      if (ctacteProyecto) ctacteProyecto.value = 'all';
      if (typeof _updateCtaCteCascadingFilters === 'function') _updateCtaCteCascadingFilters();
      
      _renderInformes();
    }
    

    if (isMap) {
      // Si se navega a 'mapa' de forma genérica (ej. desde el menú inferior móvil o botón volver),
      // retornar al último proyecto activo si existe, en lugar de resetear a vista regional 'todos'.
      let effectiveTabId = tabId;
      if (tabId === 'mapa' && _lastActiveProject && _lastActiveProject !== 'todos' && _lastActiveProject !== 'all') {
        effectiveTabId = 'mapa-' + _lastActiveProject;
      }
      const projectName = (effectiveTabId === 'mapa' || effectiveTabId === 'mapa-todos') ? 'todos' : effectiveTabId.replace('mapa-', '');
      if (projectName && projectName !== 'todos' && projectName !== 'all') {
        _lastActiveProject = projectName;
      }
      setTimeout(() => {
        // Guard against Leaflet missing offline
        if (typeof L === 'undefined') {
          console.warn('Leaflet is not loaded. Map cannot be initialized.');
          const mapEl = document.getElementById('map-element');
          if (mapEl) {
            mapEl.style.display = 'flex';
            mapEl.style.alignItems = 'center';
            mapEl.style.justifyContent = 'center';
            mapEl.style.flexDirection = 'column';
            mapEl.style.background = 'var(--bg-hover)';
            mapEl.style.color = 'var(--text-dim)';
            mapEl.style.gap = '12px';
            mapEl.style.height = '100%';
            mapEl.innerHTML = '<i class="fa-solid fa-cloud-slash" style="font-size:32px;color:var(--primary);opacity:0.7;"></i><span>Mapa satelital no disponible (sin conexión)</span>';
          }
          return;
        }

        // Init map on first switch
        if (typeof APP5T_Map !== 'undefined' && !APP5T_Map._initialized) {
          APP5T_Map.init('map-element', onLoteSelected);
          APP5T_Map._initialized = true;
        }
        // Load projects: full rebuild only on first visit or if layer is missing; otherwise just refresh colors
        if (typeof APP5T_Map !== 'undefined') {
          // Verify that polygons are actually rendered (not just flag-based)
          const cl = APP5T_Map._currentLayer;
          const hasRealLayers = cl && (typeof cl.getLayers === 'function') && cl.getLayers().length > 0;
          const hasLayer = APP5T_Map._initialized && APP5T_Map._layerLoaded && hasRealLayers;
          if (!hasLayer) {
            APP5T_Map.loadAllProjects(projectName);
            APP5T_Map._layerLoaded = true;
          } else {
            try { APP5T_Map.refreshColors(); } catch(e) {}
          }
          if (APP5T_Map._mapInstance) {
            APP5T_Map._mapInstance.invalidateSize({ animate: false });
          }
          APP5T_Map.zoomToProject(projectName);
          const projSel = document.getElementById('map-project-select');
          if (projSel) {
            projSel.value = projectName;
          }
        }
      }, 200);
    }

    if (tabId === 'dashboard') {
      if (typeof APP5T_Charts !== 'undefined') {
        APP5T_Charts.renderDashboard(activeRole);
      }
    }

    if (tabId === 'carga') {
      const crudContent = document.getElementById('crud-content');
      if (crudContent && typeof APP5T_Forms !== 'undefined') {
        // Activate the first CRUD tab by default
        const firstCrudTab = document.querySelector('.crud-tab.active');
        const entity = firstCrudTab ? firstCrudTab.getAttribute('data-entity') : 'vendedores';
        APP5T_Forms.renderCRUDTable(crudContent, entity || 'vendedores');
      }
    }

    if (tabId === 'aprobaciones') {
      renderMesaGerencia();
    }

    if (tabId === 'mesa') {
      _renderMesaPromesas();
      _renderMesaPromesasCurso();
      _renderMesaEscrituras();
    }

    // Close sidebar on mobile
    if (isMobile) {
      _closeSidebar();
    }

    // Toggle class on body for map-specific styles
    document.body.classList.toggle('map-tab-active', isMap);

    // ── Cleanup any leftover poll timer ──
    // Auto-poll removed: push-on-save from vendor side ensures gerente gets
    // fresh data on login via pullAll. Periodic overwrite was destroying local data.
    if (_approvalsPollInterval) {
      clearInterval(_approvalsPollInterval);
      _approvalsPollInterval = null;
    }

    activeTab = tabId;
  }

  /* ══════════════════════════════════════════════════════
     SIDEBAR TOGGLE (MOBILE)
     ══════════════════════════════════════════════════════ */
  function _openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
  }

  function _closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }

  /* ══════════════════════════════════════════════════════
     MODAL
     ══════════════════════════════════════════════════════ */
  function openModal(title, contentHTML) {
    const modal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (modalTitle) modalTitle.textContent = title || '';
    if (modalBody) modalBody.innerHTML = contentHTML || '';
    if (modal) {
      modal.classList.add('active');
      modal.classList.add('visible');
    }
    // Reset dirty state on modal open
    window.APP5T_isFormDirty = false;
  }

  function closeModal(force = false) {
    if (force === true) window.APP5T_isFormDirty = false;
    const shouldConfirm = (force !== true) && window.APP5T_isFormDirty;
    if (shouldConfirm) {
      if (!confirm('Tiene cambios sin guardar en el formulario. ¿Está seguro de que desea salir?')) {
        return;
      }
    }
    const modal = document.getElementById('action-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('visible');
      const card = modal.querySelector('.modal-card');
      if (card) card.classList.remove('modal-card-wide');
    }
    window.APP5T_isFormDirty = false;
  }

  /* ══════════════════════════════════════════════════════
     MOBILE BOTTOM SHEET
     ══════════════════════════════════════════════════════ */
  let _sheetState = 'collapsed'; // collapsed | half | full
  const SNAP_COLLAPSED = 140;
  const SNAP_HALF = Math.round(window.innerHeight * 0.5);
  const SNAP_FULL = Math.round(window.innerHeight * 0.85);

  function _initBottomSheet() {
    const handle = document.getElementById('bottom-sheet-handle');
    const sheet = document.getElementById('bottom-sheet');
    const closeBtn = document.getElementById('bottom-sheet-close');
    if (!sheet) return;

    let startY = 0;
    let startHeight = SNAP_COLLAPSED;

    if (handle) {
      handle.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
        startHeight = sheet.offsetHeight;
        sheet.style.transition = 'none';
      }, { passive: true });

      handle.addEventListener('touchmove', e => {
        const dy = startY - e.touches[0].clientY;
        const newH = Math.max(SNAP_COLLAPSED, Math.min(SNAP_FULL, startHeight + dy));
        sheet.style.height = newH + 'px';
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        sheet.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        const h = sheet.offsetHeight;
        // Snap to nearest point
        const dists = [
          { state: 'collapsed', dist: Math.abs(h - SNAP_COLLAPSED) },
          { state: 'half',      dist: Math.abs(h - SNAP_HALF) },
          { state: 'full',      dist: Math.abs(h - SNAP_FULL) }
        ];
        dists.sort((a, b) => a.dist - b.dist);
        _setSheetState(dists[0].state);
      });

      // Click toggles between collapsed and half
      handle.addEventListener('click', () => {
        if (_sheetState === 'collapsed') _setSheetState('half');
        else _setSheetState('collapsed');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.preventDefault();
        _closeBottomSheet();
      });
    }
  }

  function _closeBottomSheet() {
    const sheet = document.getElementById('bottom-sheet');
    if (!sheet) return;
    sheet.classList.remove('open', 'peek', 'expanded');
    sheet.classList.add('hidden');
    _sheetState = 'collapsed';

    // Deselect feature on map to match closed state
    if (typeof APP5T_Map !== 'undefined' && (APP5T_Map.deselectPrevious || APP5T_Map._deselectPrevious)) {
      try { (APP5T_Map.deselectPrevious || APP5T_Map._deselectPrevious)(); } catch(e) {}
    }
  }

  function _setSheetState(state) {
    const sheet = document.getElementById('bottom-sheet');
    if (!sheet) return;
    _sheetState = state;
    
    sheet.classList.remove('hidden');
    sheet.classList.add('open');

    sheet.classList.remove('peek', 'expanded');
    if (state === 'collapsed') {
      sheet.classList.add('peek');
    } else if (state === 'full') {
      sheet.classList.add('expanded');
    }

    const heights = { collapsed: SNAP_COLLAPSED, half: SNAP_HALF, full: SNAP_FULL };
    sheet.style.height = (heights[state] || SNAP_COLLAPSED) + 'px';
  }

  function _expandBottomSheet() {
    _setSheetState('full');
  }

  /* ══════════════════════════════════════════════════════
     MOBILE NAV BUILDERS
     ══════════════════════════════════════════════════════ */
  function _buildMobileNav(role) {
    const nav = document.getElementById('mobile-nav-bar');
    if (!nav) return;
    
    let html = '';
    const canSeeMap = _isTabVisible(role, 'mapa');
    const canSeeDash = _isTabVisible(role, 'dashboard');

    if (role === 'vendedor') {
      const canSeeLeads = _isTabVisible(role, 'leads');
      const canSeeInv = _isTabVisible(role, 'inventario');
      if (canSeeMap) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab.startsWith('mapa') ? ' active' : ''}" data-tab="mapa">
            <i class="fa-solid fa-map-location-dot"></i>
            <span>Mapa</span>
          </a>
        `;
      }
      if (canSeeLeads) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab === 'leads' ? ' active' : ''}" data-tab="leads">
            <i class="fa-solid fa-users"></i>
            <span>Clientes</span>
          </a>
        `;
      }
      if (canSeeInv) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab === 'inventario' ? ' active' : ''}" data-tab="inventario">
            <i class="fa-solid fa-list-check"></i>
            <span>Inventario</span>
          </a>
        `;
      }
    } else if (role === 'gerente') {
      // Prioridad Absoluta: Aprobaciones con contador en vivo
      let pendBadge = '';
      try {
        const props = (typeof APP5T_DB !== 'undefined' && APP5T_DB.getAll) ? (APP5T_DB.getAll('propiedades') || []) : [];
        const pendCount = props.filter(p => String(p.estado || '').toLowerCase() === 'pendiente').length;
        if (pendCount > 0) {
          pendBadge = `<span style="position:absolute; top:2px; right:16px; background:#f59e0b; color:#0f172a; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:10px; border:1.5px solid #0b1a28;">${pendCount}</span>`;
        }
      } catch(e) {}

      html += `
        <a href="#" class="mobile-nav-item${activeTab === 'aprobaciones' ? ' active' : ''}" data-tab="aprobaciones" style="position:relative;">
          <i class="fa-solid fa-stamp" style="${activeTab === 'aprobaciones' ? 'color:#f59e0b;' : ''}"></i>
          <span>Aprobar</span>
          ${pendBadge}
        </a>
      `;
      if (canSeeDash) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
            <i class="fa-solid fa-chart-line"></i>
            <span>Dashboard</span>
          </a>
        `;
      }
      if (canSeeMap) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab.startsWith('mapa') ? ' active' : ''}" data-tab="mapa">
            <i class="fa-solid fa-map-location-dot"></i>
            <span>Mapa</span>
          </a>
        `;
      }
      html += `
        <a href="#" class="mobile-nav-item${activeTab === 'inventario' ? ' active' : ''}" data-tab="inventario">
          <i class="fa-solid fa-list-check"></i>
          <span>Inventario</span>
        </a>
      `;
    } else if (role === 'administrador') {
      // Prioridad 1: Mesa Documental
      let mesaBadge = '';
      try {
        const props = (typeof APP5T_DB !== 'undefined' && APP5T_DB.getAll) ? (APP5T_DB.getAll('propiedades') || []) : [];
        const resCount = props.filter(p => {
          const st = String(p.estado || '').toLowerCase();
          return st === 'reservada' || st === 'reservado';
        }).length;
        if (resCount > 0) {
          mesaBadge = `<span style="position:absolute; top:2px; right:16px; background:#00e5ff; color:#0f172a; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:10px; border:1.5px solid #0b1a28;">${resCount}</span>`;
        }
      } catch(e) {}

      html += `
        <a href="#" class="mobile-nav-item${activeTab === 'mesa' ? ' active' : ''}" data-tab="mesa" style="position:relative;">
          <i class="fa-solid fa-file-contract"></i>
          <span>Mesa</span>
          ${mesaBadge}
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'ctacte' ? ' active' : ''}" data-tab="ctacte">
          <i class="fa-solid fa-money-check-dollar"></i>
          <span>Cta. Cte.</span>
        </a>
      `;
      if (canSeeDash) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
            <i class="fa-solid fa-chart-line"></i>
            <span>Dashboard</span>
          </a>
        `;
      }
      if (canSeeMap) {
        html += `
          <a href="#" class="mobile-nav-item${activeTab.startsWith('mapa') ? ' active' : ''}" data-tab="mapa">
            <i class="fa-solid fa-map-location-dot"></i>
            <span>Mapa</span>
          </a>
        `;
      }
    }
    nav.innerHTML = html;

    // Attach click events
    nav.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');
        if (targetTab === 'gestion') {
          switchTab(activeGestionTab[activeRole]);
        } else {
          switchTab(targetTab);
        }
      });
    });
  }

  function _buildMobileChips() {
    const chipsBar = document.getElementById('mobile-chips-bar');
    if (chipsBar) {
      chipsBar.style.display = 'none';
    }
  }

  function clearLoteSelection() {
    window.APP5T_isFormDirty = false;
    const details = document.getElementById('lote-details');
    const empty = document.getElementById('lote-empty');
    if (details) details.style.display = 'none';
    if (empty) empty.style.display = 'block';

    const formContainer = document.getElementById('lote-action-form');
    if (formContainer) formContainer.innerHTML = '';

    const bsContent = document.getElementById('bs-lote-action-form');
    if (bsContent) bsContent.innerHTML = '';

    if (typeof APP5T_Map !== 'undefined') {
      if (typeof APP5T_Map.deselectPrevious === 'function') APP5T_Map.deselectPrevious();
      if (typeof APP5T_Map.closePopup === 'function') APP5T_Map.closePopup();
    }
    _closeBottomSheet();
  }

  /* ══════════════════════════════════════════════════════
     ON LOTE SELECTED (called from map)
     ══════════════════════════════════════════════════════ */
    /* ==========================================================================
     3D LOTE SELECTION BRIDGE
     ========================================================================== */
  window.APP5T_onLote3DSelect = function(loteNom, proyNom) {
    try {
      const props = (typeof APP5T_DB !== 'undefined') ? APP5T_DB.getAll('propiedades') : [];
      const targetNum = String(loteNom || '').replace(/[^0-9A-Za-z]/g, '');
      const cleanNom = String(loteNom || '').trim().toLowerCase();
      
      let match = null;
      if (proyNom) {
        match = props.find(p => {
          const pNum = String(p.numero || p.nombre || '').replace(/[^0-9A-Za-z]/g, '');
          const pProy = p.proyecto || (p.id_proyecto ? (APP5T_DB.getById('proyectos', p.id_proyecto) || {}).nombre : '');
          return (pNum === targetNum || (p.nombre && p.nombre.toLowerCase() === cleanNom)) && (!pProy || pProy.toLowerCase().includes(String(proyNom).toLowerCase()));
        });
      }
      if (!match) {
        match = props.find(p => {
          const pNom = String(p.nombre || '').trim().toLowerCase();
          return pNom === cleanNom || pNom === 'lote ' + cleanNom || 'lote ' + pNom === cleanNom;
        }) || props.find(p => {
          const pNum = String(p.numero || p.nombre || '').replace(/[^0-9A-Za-z]/g, '');
          return targetNum && pNum === targetNum;
        });
      }

      if (match) {
        onLoteSelected(match);
        if (window.innerWidth <= 768 && typeof _openMobileBottomSheet === 'function') {
          _openMobileBottomSheet(match);
        }
      } else {
        console.warn('APP5T_onLote3DSelect: No match found for lote', loteNom, 'in DB');
        // Fallback: create mock property object if DB is empty so panel still opens
        const mockProp = {
          id: targetNum || '1',
          nombre: loteNom || ('Lote ' + targetNum),
          estado: 'Disponible',
          superficie: '5.000 m²',
          valor_final: 25000000
        };
        onLoteSelected(mockProp);
      }
    } catch(err) {
      console.error('Error en APP5T_onLote3DSelect:', err);
    }
  };

  let _currentSelectedPropiedadId = null;
  function openLoteHistorialCurrent() {
    if (_currentSelectedPropiedadId) {
      openLoteHistorial(_currentSelectedPropiedadId);
    }
  }

  function onLoteSelected(propiedadData) {
    if (propiedadData) {
      _currentSelectedPropiedadId = propiedadData.id;
      window._syncCtacteWithSelectedLot = true;
      
      // Memorizar el proyecto del lote seleccionado para retorno inteligente al mapa
      try {
        let pName = null;
        if (propiedadData.id_etapa && typeof APP5T_DB !== 'undefined') {
          const etapa = APP5T_DB.getById('etapas', propiedadData.id_etapa);
          const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
          if (proy) pName = proy.nombre || proy.nombre_proyecto;
        }
        if (!pName && propiedadData.id_proyecto && typeof APP5T_DB !== 'undefined') {
          const proy = APP5T_DB.getById('proyectos', propiedadData.id_proyecto);
          if (proy) pName = proy.nombre || proy.nombre_proyecto;
        }
        if (!pName && propiedadData.proyecto) {
          pName = propiedadData.proyecto;
        }
        if (pName) {
          _lastActiveProject = pName;
        }
      } catch (err) {}
    }
    if (!propiedadData) return;
    window.APP5T_isFormDirty = false;

    // Desktop: populate sidebar detail panel
    const details = document.getElementById('lote-details');
    const empty = document.getElementById('lote-empty');
    if (details) details.style.display = 'block';
    if (empty) empty.style.display = 'none';

    // Title & info
    const titleEl = document.getElementById('lote-title');
    const projEl = document.getElementById('lote-project');
    const areaEl = document.getElementById('lote-area');
    const priceEl = document.getElementById('lote-price');
    const badgeEl = document.getElementById('lote-status-badge');

    if (titleEl) titleEl.textContent = propiedadData.nombre || `Lote ${propiedadData.id}`;
    if (projEl) {
      // Resolve project, stage, and lot details
      const etapa = propiedadData.id_etapa ? APP5T_DB.getById('etapas', propiedadData.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '') : '-';
      const etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || '') : '-';
      const loteNom = propiedadData.nombre || '';
      
      const etapaLabel = etapaNom ? (etapaNom.toLowerCase().startsWith('etapa') ? etapaNom : ('Etapa ' + etapaNom)) : '-';
      projEl.innerHTML = '<strong>Proyecto:</strong> ' + proyNom + ' &nbsp;·&nbsp; <strong>' + etapaLabel + '</strong>';
    }
    if (areaEl) areaEl.textContent = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(propiedadData.superficie) : (propiedadData.superficie || '-');
    if (priceEl) priceEl.textContent = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);
    if (badgeEl) badgeEl.innerHTML = getStatusBadgeHTML(propiedadData.estado);



    // Render the action form / complete operation card
    const formContainer = document.getElementById('lote-action-form');
    if (formContainer && typeof APP5T_Forms !== 'undefined') {
      APP5T_Forms.renderLoteForm(formContainer, propiedadData, activeRole);
    }

    // Mobile/Tablet: Open full lot details in Bottom Sheet over the map
    if (window.innerWidth < 1024) {
      openLoteBottomSheet(propiedadData.id);
      return;
    }
  }

  
  function openLoteHistorial(idLote) {
    try {
      const propiedad = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getById('propiedades', idLote) : null;
      if (!propiedad) {
        alert('No se encontró la información del lote.');
        return;
      }

      const etapa = propiedad.id_etapa ? APP5T_DB.getById('etapas', propiedad.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto || propiedad.id_proyecto) : (propiedad.id_proyecto ? APP5T_DB.getById('proyectos', propiedad.id_proyecto) : null);
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || 'Proyecto') : 'Proyecto';
      const etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || '') : '';
      const loteNom = propiedad.nombre || ('Lote ' + propiedad.id);

      // Recopilar negociaciones asociadas a este lote
      const allNegs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('negociaciones') : []) || [];
      const negs = allNegs.filter(n => n && String(n.id_propiedad) === String(propiedad.id));

      // Recopilar cuenta corriente
      const allCuotas = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('cuenta_corriente') : []) || [];
      const cuotas = allCuotas.filter(c => c && String(c.id_propiedad) === String(propiedad.id));

      // Construir la lista cronológica de eventos
      const eventos = [];

      // 1. Ingreso a Inventario
      eventos.push({
        tipo: 'ingreso',
        fecha: propiedad.fecha_ingreso || 'Registro inicial',
        titulo: 'Ingreso a Inventario (Disponible)',
        icono: 'fa-solid fa-layer-group',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        detalles: 'Superficie: <strong>' + APP5T_Utils.formatSuperficie(propiedad.superficie) + '</strong> &middot; Precio Lista: <strong>' + APP5T_Utils.formatMoneda(propiedad.valor_final || 0) + '</strong>'
      });

      // 2. Procesar negociaciones (ciclo(s) de reserva / promesa / venta)
      if (negs.length > 0) {
        negs.forEach((neg, index) => {
          const cliente = neg.id_cliente ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
          const vendedor = neg.id_vendedor ? APP5T_DB.getById('vendedores', neg.id_vendedor) : null;
          const clienteNom = cliente ? ((cliente.nombres || '') + ' ' + (cliente.apellidos || '')).trim() : 'Cliente sin registrar';
          const clienteRut = cliente && cliente.rut ? ('(RUT: ' + cliente.rut + ')') : '';
          const vendedorNom = vendedor ? (vendedor.nombre || 'Vendedor') : 'Venta Directa / Sistema';
          const esMultiCiclo = negs.length > 1;
          const cicloPrefijo = esMultiCiclo ? ('[Proceso ' + (index + 1) + '] ') : '';

          // Solicitud de Reserva / Saldo de Precio / Venta Directa
          const isSaldoPrecio = neg.id_proceso === 'Saldo_Precio' || neg.tipo_operacion === 'Saldo_Precio';
          const esVentaDirecta = neg.id_proceso === 'Venta_Directa' || neg.tipo_operacion === 'Venta_Directa';
          const fechaNeg = neg.fecha_negociacion || propiedad.fecha_reserva || '-';
          
          let titSol = 'Reserva Solicitada (Promesa)';
          let iconSol = 'fa-solid fa-hand-holding-dollar';
          let colorSol = '#10b981';
          let bgSol = 'rgba(16, 185, 129, 0.15)';
          if (isSaldoPrecio) {
            titSol = 'Venta con Saldo de Precio (c/ Hipoteca)';
            iconSol = 'fa-solid fa-landmark';
            colorSol = '#8b5cf6';
            bgSol = 'rgba(139, 92, 246, 0.15)';
          } else if (esVentaDirecta) {
            titSol = 'Venta al Contado Registrada';
            iconSol = 'fa-solid fa-bolt';
            colorSol = '#f59e0b';
            bgSol = 'rgba(245, 158, 11, 0.15)';
          }

          eventos.push({
            tipo: 'solicitud',
            fecha: fechaNeg,
            titulo: cicloPrefijo + titSol,
            icono: iconSol,
            color: colorSol,
            bg: bgSol,
            detalles: '<div><strong>Cliente:</strong> ' + clienteNom + ' ' + clienteRut + '</div>' +
                       '<div><strong>Vendedor:</strong> ' + vendedorNom + (cliente && cliente.canal_captacion ? (' &middot; <em>(' + cliente.canal_captacion + ')</em>') : '') + '</div>' +
                       '<div><strong>Pie / Anticipo:</strong> ' + APP5T_Utils.formatMoneda(neg.pie || propiedad.abono || 0) + ' &middot; <strong>Valor Negociado:</strong> ' + APP5T_Utils.formatMoneda(neg.valor_final || propiedad.valor_final || 0) + (neg.cantidad_cuotas ? (' &middot; <strong>Cuotas Saldo:</strong> ' + neg.cantidad_cuotas) : '') + '</div>'
          });

          // Aprobación de Reserva
          if (neg.estado_avance === 'Aprobado' || neg.autorizado_promesa || ['Reservada', 'Promesada', 'En Promesa', 'Vendida', 'Escriturada'].includes(propiedad.estado)) {
            eventos.push({
              tipo: 'aprobacion',
              fecha: fechaNeg,
              titulo: cicloPrefijo + 'Reserva Aprobada',
              icono: 'fa-solid fa-circle-check',
              color: '#8b5cf6',
              bg: 'rgba(139, 92, 246, 0.15)',
              detalles: '<div><strong>Autorizado por:</strong> Gerencia / Administración</div>' +
                         '<div><strong>Condición:</strong> Aprobado para avanzar a Promesa de Compraventa</div>'
            });
          }

          // Promesa de Compraventa
          if (neg.fecha_promesa || neg.autorizado_promesa || ['Promesada', 'En Promesa', 'Vendida', 'Escriturada'].includes(propiedad.estado)) {
            const fechaPromesa = neg.fecha_promesa || propiedad.fecha_fin_promesa || fechaNeg;
            const modalidad = (neg.cantidad_cuotas && Number(neg.cantidad_cuotas) > 0)
              ? ('Crédito Directo (' + neg.cantidad_cuotas + ' cuotas de ' + APP5T_Utils.formatMoneda(((neg.valor_final || propiedad.valor_final || 0) - (neg.pie || 0)) / Number(neg.cantidad_cuotas)) + ')')
              : 'Pago al Contado / Transferencia';
            
            eventos.push({
              tipo: 'promesa',
              fecha: fechaPromesa,
              titulo: cicloPrefijo + 'Promesa de Compraventa',
              icono: 'fa-solid fa-file-contract',
              color: '#3b82f6',
              bg: 'rgba(59, 130, 246, 0.15)',
              detalles: '<div><strong>Pie Acordado:</strong> ' + APP5T_Utils.formatMoneda(neg.pie || 0) + '</div>' +
                         '<div><strong>Plan de Pago:</strong> ' + modalidad + '</div>' +
                         '<div><strong>Estado Legal:</strong> ' + (neg.ficha_abogado_generada ? 'Ficha de antecedentes confeccionada' : 'Borrador en curso') + '</div>'
            });
          }

          // Escrituración & Venta
          if (propiedad.estado === 'Vendida' || propiedad.estado === 'Escriturada' || propiedad.fecha_venta || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]') || neg.autorizado_escriturar === true || neg.autorizado_escriturar === 'true') {
            eventos.push({
              tipo: 'escritura',
              fecha: propiedad.fecha_venta || neg.fecha_envio_abogado || fechaNeg,
              titulo: cicloPrefijo + 'Escrituración & Venta Finalizada',
              icono: 'fa-solid fa-award',
              color: '#10b981',
              bg: 'rgba(16, 185, 129, 0.15)',
              detalles: '<div><strong>Cierre Legal:</strong> Autorizado para firma final e inscripción de dominio en CBR.</div>'
            });
          }
        });
      } else if (propiedad.estado !== 'Disponible') {
        eventos.push({
          tipo: 'estado_directo',
          fecha: propiedad.fecha_reserva || propiedad.fecha_venta || '-',
          titulo: 'Estado Actual: ' + propiedad.estado,
          icono: 'fa-solid fa-circle-info',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.15)',
          detalles: '<div>Lote en estado <strong>' + propiedad.estado + '</strong> con valor de <strong>' + APP5T_Utils.formatMoneda(propiedad.valor_final || 0) + '</strong>.</div>'
        });
      }

      // Estado de Cuenta Corriente (si existen cuotas)
      if (cuotas.length > 0) {
        const pagadas = cuotas.filter(c => {
          const est = String(c.estado_cuota || '').toLowerCase();
          return est === 'pagada' || est === 'pagado' || (Number(c.valor_pagado) >= Number(c.valor_cuota));
        });
        const montoTotal = cuotas.reduce((acc, c) => acc + (Number(c.valor_cuota) || 0), 0);
        const montoPagado = cuotas.reduce((acc, c) => acc + (Number(c.valor_pagado) || 0), 0);
        eventos.push({
          tipo: 'pagos',
          fecha: cuotas[0].fecha_vencimiento || '-',
          titulo: 'Cuenta Corriente & Cuotas',
          icono: 'fa-solid fa-receipt',
          color: '#06b6d4',
          bg: 'rgba(6, 182, 212, 0.15)',
          detalles: '<div><strong>Avance:</strong> ' + pagadas.length + ' de ' + cuotas.length + ' cuotas pagadas</div>' +
                     '<div><strong>Total Recaudado:</strong> ' + APP5T_Utils.formatMoneda(montoPagado) + ' de ' + APP5T_Utils.formatMoneda(montoTotal) + '</div>'
        });
      }

      // Renderizar items del timeline
      const timelineHTML = eventos.map((ev, i) => `
        <div style="display: flex; gap: 12px; align-items: flex-start; position: relative;">
          ${i < eventos.length - 1 ? '<div style="position: absolute; left: 13px; top: 28px; bottom: -10px; width: 2px; background: rgba(255,255,255,0.12);"></div>' : ''}
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${ev.bg}; color: ${ev.color}; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; flex-shrink: 0; z-index: 1;">
            <i class="${ev.icono}"></i>
          </div>
          <div style="flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; gap: 8px; flex-wrap: wrap;">
              <strong style="color: #ffffff; font-size: 0.88rem;">${ev.titulo}</strong>
              <span style="font-size: 0.74rem; color: #94a3b8;"><i class="fa-regular fa-calendar"></i> ${ev.fecha}</span>
            </div>
            <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
              ${ev.detalles}
            </div>
          </div>
        </div>
      `).join('');

      const contentHTML = `
        <div style="font-family: inherit; color: var(--text-light, #e2e8f0); max-width: 520px; margin: 0 auto;">
          <!-- Header Lote -->
          <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border, rgba(255,255,255,0.1)); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
              <h4 style="margin:0 0 2px 0; font-size:1.15rem; font-weight:700; color: #fff;">${loteNom}</h4>
              <div style="font-size:0.8rem; color: var(--text-dim, #94a3b8);">${proyNom} ${etapaNom ? ('&middot; ' + etapaNom) : ''}</div>
            </div>
            <div>
              ${getStatusBadgeHTML(propiedad.estado)}
            </div>
          </div>

          <!-- Titulo Seccion -->
          <div style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim, #94a3b8); margin-bottom: 12px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-clock-rotate-left" style="color: #60a5fa;"></i> Recorrido Histórico del Lote
          </div>

          <!-- Lista Cronologica -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${timelineHTML}
          </div>

          <!-- Boton de Cierre -->
          <div style="margin-top: 18px; text-align: right;">
            <button type="button" class="btn btn-secondary" onclick="if(window.APP5T && window.APP5T.closeModal) { window.APP5T.closeModal(true); } const m = document.getElementById('action-modal'); if(m) { m.classList.remove('active', 'visible'); }" style="padding: 6px 18px; font-size: 0.82rem; border-radius: 6px; cursor: pointer;">
              Cerrar
            </button>
          </div>
        </div>
      `;

      openModal('Historial de Venta · ' + loteNom, contentHTML);
    } catch (e) {
      console.error('Error abriendo historial del lote:', e);
      alert('Error al cargar el historial del lote: ' + e.message);
    }
  }

  /* ══════════════════════════════════════════════════════
     MOBILE BOTTOM SHEET
     ══════════════════════════════════════════════════════ */
  function openLoteBottomSheet(idLote) {
    try {
      const propiedadData = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getById('propiedades', idLote) : null;
      if (!propiedadData) {
        alert("Error: No se encontró la propiedad en la base de datos local.");
        return;
      }
      
      const bsContent = document.getElementById('bottom-sheet-content');
      if (!bsContent) {
        alert("Error: No se encontró el contenedor del panel inferior (bottom-sheet-content).");
        return;
      }

      const etapa = propiedadData.id_etapa ? APP5T_DB.getById('etapas', propiedadData.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '') : '-';
      const etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || '') : '-';
      const loteNom = propiedadData.nombre || '';
      const formattedPrice = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);

      bsContent.innerHTML = `
        <div style="padding: 15px;">
          <div class="lote-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; gap: 8px;">
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin:0 0 4px 0; font-size:1.2rem; font-weight:700; color:var(--text-white); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${loteNom}</h3>
              <span style="font-size:0.85rem; color:var(--text-dim); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${proyNom} · ${etapaNom}</span>
            </div>
            <span class="status-badge" style="flex-shrink:0;">${getStatusBadgeHTML(propiedadData.estado)}</span>
          </div>
          <div class="lote-specs" style="display:flex; gap:10px; margin-bottom:20px; font-size:0.85rem;">
            <div class="spec" style="flex:1;">
              <span class="spec-label" style="color:var(--text-dim); display:block; font-size:0.75rem; margin-bottom:2px;">Superficie</span>
              <strong class="spec-value" style="color:var(--text-white);">${(typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(propiedadData.superficie) : (propiedadData.superficie || '-')}</strong>
            </div>
            <div class="spec" style="flex:1;">
              <span class="spec-label" style="color:var(--text-dim); display:block; font-size:0.75rem; margin-bottom:2px;">Precio Lista</span>
              <strong class="spec-value" style="color:var(--text-white);">${formattedPrice}</strong>
            </div>
          </div>
          <div id="bs-lote-action-form"></div>
        </div>
      `;

      const popupFormContainer = bsContent.querySelector('#bs-lote-action-form');
      if (popupFormContainer && typeof APP5T_Forms !== 'undefined') {
        APP5T_Forms.renderLoteForm(popupFormContainer, propiedadData, activeRole);
      }
      
      _expandBottomSheet();
      
      if (typeof APP5T_Map !== 'undefined' && APP5T_Map.closePopup) {
         APP5T_Map.closePopup();
      }
    } catch (e) {
      console.error(e);
      alert("Error crítico abriendo el panel inferior: " + e.message);
    }
  }

  function _safeRender(renderFunc, name) {
    if (typeof renderFunc === 'function') {
      try {
        renderFunc();
      } catch (err) {
        console.error(`APP5T: Error en renderizado de ${name}:`, err);
      }
    }
  }

  function refreshAll() {
    _safeRender(_populateMapProjects, 'MapProjects');
    
    let stats = null;
    try {
      stats = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getStats() : null;
    } catch(err) {
      console.error('APP5T: Error al calcular stats', err);
    }

    // ── 1. KPI cards (if stats available) ──
    if (stats) {
      try {
        _setContent('kpi-total', stats.totales);
        _setContent('kpi-disponibles', stats.disponibles);
        _setContent('kpi-reservadas', (stats.reservadas || 0) + (stats.solicitadas || 0));
        _setContent('kpi-promesadas', stats.enPromesa || stats.promesadas || 0);
        _setContent('kpi-vendidas', stats.vendidas);
        _setContent('kpi-ingreso', APP5T_Utils.formatMoneda(stats.ingresoRecaudado || 0));
      } catch(err) {
        console.error('APP5T: Error al actualizar KPIs', err);
      }
    }

    // ── 2. Dashboard charts ──
        if (activeTab === 'dashboard' && typeof APP5T_Charts !== 'undefined') {
      const dbFilter = document.getElementById('dashboard-filter-proyecto');
      if (dbFilter && !dbFilter.dataset.populated) {
          const proys = APP5T_DB.getAll('proyectos') || [];
          let opts = '<option value="all">-- Todos los Proyectos --</option>';
          proys.forEach(p => { opts += '<option value="' + p.id + '">' + p.nombre_proyecto + '</option>'; });
          dbFilter.innerHTML = opts;
          dbFilter.dataset.populated = "true";
          dbFilter.addEventListener('change', () => {
              if (typeof APP5T_Charts !== 'undefined') APP5T_Charts.renderDashboard(activeRole);
          });
      }
      _safeRender(() => APP5T_Charts.renderDashboard(activeRole), 'Dashboard');
    }

    // ── 3. Recent transactions ──
    _safeRender(_renderTransactions, 'Transactions');

    // ── 4. Approvals table ──
    _safeRender(_renderAprobaciones, 'Aprobaciones');
    _safeRender(renderMesaGerencia, 'MesaGerencia');

    // ── 5. Price control table ──
    _safeRender(_renderPrecios, 'Precios');

    // ── 6. Mesa Documental: Promesas ──
    _safeRender(_renderMesaPromesas, 'MesaPromesas');
    _safeRender(_renderMesaPromesasCurso, 'MesaPromesasCurso');

    // ── 7. Mesa Documental: Escrituras ──
    _safeRender(_renderMesaEscrituras, 'MesaEscrituras');

    // ── 8. Cuenta Corriente ──
    _safeRender(_renderCtaCte, 'CtaCte');

    // ── 8b. Informes ──
    _safeRender(_renderInformes, 'Informes');

    // ── 9. Inventario ──
    _safeRender(_renderInventario, 'Inventario');

    // ── 10. Auditoría ──
    _safeRender(_renderAuditoria, 'Auditoria');

    // ── 11. Leads ──
    _safeRender(_renderLeads, 'Leads');
    _safeRender(_renderPendingApprovals, 'PendingApprovals');

    // ── 12. Refresh map colors ──
    if (typeof APP5T_Map !== 'undefined') {
      try { APP5T_Map.refreshColors(); } catch (e) { /* map not initialized */ }
    }
  }

  /* ── Table renderers ── */

  function _setContent(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '-';
  }

  function _renderTransactions() {
    const tbody = document.getElementById('tbody-transactions');
    if (!tbody) return;
    const negs = (APP5T_DB.getAll('negociaciones') || []).slice(-10).reverse();
    if (negs.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin negociaciones</td></tr>'; return; }
    tbody.innerHTML = negs.map(n => { if(!n) return '';
      const prop = APP5T_DB.getById('propiedades', n.id_propiedad);
      const cli = APP5T_DB.getById('clientes', n.id_cliente);
      const vend = APP5T_DB.getById('vendedores', n.id_vendedor);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      const loteProy = prop ? `${prop.nombre} / ${proy ? proy.nombre_proyecto : '-'}` : `Lote ${n.id_propiedad}`;
      return `<tr>
        <td>${n.fecha_negociacion || '-'}</td>
        <td>${loteProy}</td>
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '-'}</td>
        <td>${vend ? vend.nombre : '-'}</td>
        <td>${APP5T_Utils.formatMoneda(n.valor_final || 0)}</td>
        <td>${getStatusBadgeHTML(n.estado_avance)}</td>
      </tr>`;
    }).join('');
  }
  /* ══════════════════════════════════════════════════════════════════
     MESA DE GERENCIA — Panel 3 Pestañas
     ══════════════════════════════════════════════════════════════════ */
  // _mesaGerenciaActiveTab declarado arriba
  // _mesaGerenciaManualTab declarado arriba

  /* ══════════════════════════════════════════════════════════════════
     MESA DE GERENCIA — Bandeja de Aprobaciones Desplegable (Optimizado Móvil)
     ══════════════════════════════════════════════════════════════════ */
  function _isNeg100Paid(neg) {
    if (!neg || !neg.id_propiedad) return false;
    const ctas = typeof APP5T_DB !== 'undefined' ? (APP5T_DB.getAll('cuenta_corriente') || []) : [];
    const cuotasProp = ctas.filter(q => Number(q.id_propiedad) === Number(neg.id_propiedad));
    if (cuotasProp.length === 0) return false;
    const pendientes = cuotasProp.filter(q => {
      const pagado = Number(q.valor_pagado || 0);
      const cuota  = Number(q.valor_cuota  || 0);
      if (cuota <= 0) return false;
      if (q.estado_cuota) {
        const est = String(q.estado_cuota).trim().toLowerCase();
        if (est.includes('anulad') || est.includes('reprogramad')) return false;
        return est !== 'pagado' && est !== 'pagada' && est !== 'paid';
      }
      return pagado < cuota;
    });
    return pendientes.length === 0;
  }

  function _getTab3ActiveNegs() {
    const allNegs = typeof APP5T_DB !== 'undefined' ? (APP5T_DB.getAll('negociaciones') || []) : [];
    const validNegs = allNegs.filter(n => {
      if (!n || !n.id_propiedad) return false;
      const stAvance = String(n.estado_avance || '').trim().toLowerCase();
      if (stAvance.includes('anulad') || stAvance.includes('rescind') || stAvance.includes('cancelad') || stAvance.includes('rechazad')) return false;
      
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      if (!p || p.estado === 'Disponible' || p.estado === 'Vendida' || p.estado === 'Escriturada') return false;
      if (n.estado_escrituracion === 'Autorizada' || (n.notas || '').indexOf('[AUTORIZADO_ESCRITURAR:TRUE]') !== -1) return false;
      
      return (n.estado_escrituracion === 'Pendiente' || (n.notas || '').includes('[AUTORIZADO_ESCRITURAR') || _isNeg100Paid(n));
    });

    const mapByProp = {};
    validNegs.forEach(n => {
      const key = String(n.id_propiedad);
      if (!mapByProp[key] || Number(n.id) > Number(mapByProp[key].id)) {
        mapByProp[key] = n;
      }
    });
    return Object.values(mapByProp);
  }

  window._mesaOpenTabs = window._mesaOpenTabs || { 1: false, 2: false, 3: false };

  function _switchMesaTab(n) {
    if (!window._mesaOpenTabs) window._mesaOpenTabs = {};
    window._mesaOpenTabs[n] = !window._mesaOpenTabs[n];
    _mesaGerenciaActiveTab = window._mesaOpenTabs[n] ? n : 0;
    _mesaGerenciaManualTab = true;
    _renderAprobaciones();
  }

  function _renderAprobaciones() {
    const listContainer = document.getElementById('list-aprobaciones');
    if (!listContainer) return;

    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const countTab1 = propiedades.filter(p => String(p.estado || '').toLowerCase() === 'pendiente').length;
    const countTab2 = propiedades.filter(p => {
      const st = String(p.estado || '').toLowerCase();
      return st === 'reservada' || st === 'reservado';
    }).length;
    const countTab3 = _getTab3ActiveNegs().length;

    const apQuery = (window._aprobacionesSearchQuery || '').trim();

    // Render row contents
    const rows1 = _getMesaTab1Rows();
    const rows2 = _getMesaTab2Rows();
    const rows3 = _getMesaTab3Rows();

    const hasMatches1 = apQuery && rows1.hasMatches;
    const hasMatches2 = apQuery && rows2.hasMatches;
    const hasMatches3 = apQuery && rows3.hasMatches;

    function _buildAcordeon(num, icon, title, count, rowsHtml, hasMatches) {
      if (!window._mesaOpenTabs) window._mesaOpenTabs = {};
      const isOpen = !!window._mesaOpenTabs[num] || (_mesaGerenciaActiveTab === num) || (apQuery && hasMatches);
      const hasPending = count > 0;
      const statusTxt = hasPending ? (count + ' En Proceso') : 'Al Día';
      const statusColor = hasPending ? '#f59e0b' : '#10b981';
      const statusBg    = hasPending ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
      const statusBdr   = hasPending ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)';
      const chevron     = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
      const cardBorder  = isOpen ? 'border: 1px solid rgba(0, 229, 255, 0.35); box-shadow: 0 4px 16px rgba(0, 229, 255, 0.08);' : 'border: 1px solid rgba(255,255,255,0.08);';

      return '<div style="' + cardBorder + 'border-radius:10px;margin-bottom:8px;overflow:hidden;background:rgba(10, 26, 40, 0.75);">'
        + '<button type="button" onclick="window.APP5T._switchMesaTab(' + num + ')"'
        + ' style="width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;'
        + 'background:' + (isOpen ? 'linear-gradient(90deg, rgba(0,229,255,0.12) 0%, rgba(12,38,58,0.5) 100%)' : 'rgba(255,255,255,0.02)') + ';'
        + 'border:none;cursor:pointer;text-align:left;'
        + (isOpen ? 'border-bottom:1px solid rgba(255, 255, 255, 0.08);' : '')
        + '">'
        + '<div style="width:32px;height:32px;border-radius:6px;background:' + (isOpen ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ' + (isOpen ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)') + ';">'
        + '<i class="' + icon + '" style="font-size:0.95rem;color:' + (isOpen ? 'var(--primary)' : 'var(--text-dim)') + ';"></i>'
        + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-weight:700;color:var(--text-white);font-size:0.92rem;letter-spacing:0.2px;">' + title + '</div>'
        + '</div>'
        + '<span style="font-size:0.72rem;font-weight:700;color:' + statusColor + ';background:' + statusBg + ';border:1px solid ' + statusBdr + ';border-radius:20px;padding:3px 10px;white-space:nowrap;flex-shrink:0;">' + statusTxt + '</span>'
        + '<i class="fa-solid fa-chevron-right" style="color:' + (isOpen ? 'var(--primary)' : 'var(--text-dim)') + ';font-size:0.75rem;flex-shrink:0;transition:transform 0.2s;transform:' + chevron + ';margin-left:4px;"></i>'
        + '</button>'
        + '<div style="display:' + (isOpen ? 'block' : 'none') + ';padding:8px 10px 10px;background:rgba(2, 10, 16, 0.55);">'
        + '<div class="table-responsive" style="margin: 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(5, 15, 25, 0.4); max-height: calc(100vh - 270px); overflow-y: auto;">'
        + '<table class="premium-table">'
        + '<thead><tr>'
        + '<th>FECHA</th>'
        + '<th>LOTE / PROYECTO</th>'
        + '<th>TIPO</th>'
        + '<th>CLIENTE</th>'
        + '<th>VALOR</th>'
        + '<th>DOCUMENTOS</th>'
        + '<th style="text-align:right;">ACCIÓN</th>'
        + '</tr></thead>'
        + '<tbody>' + rowsHtml + '</tbody>'
        + '</table>'
        + '</div>'
        + '</div>'
        + '</div>';
    }

    listContainer.innerHTML = _buildAcordeon(1, 'fa-solid fa-stamp', '1. Reserva', countTab1, rows1.html, hasMatches1)
      + _buildAcordeon(2, 'fa-solid fa-file-signature', '2. Promesa', countTab2, rows2.html, hasMatches2)
      + _buildAcordeon(3, 'fa-solid fa-gavel', '3. Cierre Final', countTab3, rows3.html, hasMatches3);
  }

  /* ── PESTAÑA 1: Solicitudes de Reserva / Venta por Aprobar ── */
  function _getMesaTab1Rows() {
    let rows = [];
    (APP5T_DB.getAll('propiedades') || []).forEach(p => {
      const st = String(p.estado || '').toLowerCase();
      if (st === 'pendiente') {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
        const neg  = negs.find(n => n.estado_avance === 'Solicitada' || n.estado_avance === 'En Curso' || n.estado_avance === 'Pendiente') || negs[negs.length - 1];
        rows.push({ p, neg });
      }
    });

    const apQuery = (window._aprobacionesSearchQuery || '').trim().toLowerCase();
    if (apQuery) {
      const qClean = apQuery.replace(/[^0-9kK]/g, '').toLowerCase();
      rows = rows.filter(({ p, neg }) => {
        const cli  = neg ? APP5T_DB.getById('clientes',  neg.id_cliente) : null;
        const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        const lote = (p.nombre || `Lote ${p.id}`).toLowerCase();
        const proyNom = (proy ? (proy.nombre_proyecto || proy.nombre || '') : '').toLowerCase();
        const cliName = (cli ? `${cli.nombres||''} ${cli.apellidos||''}` : '').toLowerCase();
        const rut = (cli ? (cli.rut || '') : '').replace(/[^0-9kK]/g, '').toLowerCase();
        return lote.includes(apQuery) || proyNom.includes(apQuery) || cliName.includes(apQuery) || (qClean && rut.includes(qClean));
      });
    }

    const emptyMsg = apQuery ? 'No se encontraron solicitudes para la búsqueda' : 'Sin solicitudes de reserva pendientes por aprobar';
    if (rows.length === 0) {
      return {
        html: `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px; text-align: center; color: var(--text-dim);"><i class="fa-solid fa-inbox" style="font-size:1.3rem;opacity:0.4;display:block;margin-bottom:8px;"></i>${emptyMsg}</td></tr>`,
        hasMatches: false
      };
    }

    const html = rows.map(({ p, neg }) => {
      const cli    = neg ? APP5T_DB.getById('clientes',  neg.id_cliente)   : null;
      const proy   = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto)   : null;
      const fecha  = neg ? (neg.fecha_negociacion || neg.fecha_ingreso || p.fecha_reserva || APP5T_Utils.fechaHoy()) : (p.fecha_reserva || APP5T_Utils.fechaHoy());
      const lote      = p.nombre || `Lote ${p.id}`;
      const proyNom   = proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-';
      const loteProy  = `<strong style="color: var(--accent-green); font-size: 1.02em;">${lote} / ${proyNom}</strong>`;
      const cliName   = cli  ? `${cli.nombres||''} ${cli.apellidos||''}`.trim() : 'Cliente';
      const rut       = cli  ? (cli.rut || '-') : '-';
      const monto     = APP5T_Utils.formatMoneda((neg ? (neg.pie || neg.valor_final || p.valor_final || 0) : (p.valor_final || 0)));

      const isSaldoPrecio = neg && (neg.tipo_operacion === 'Saldo_Precio' || neg.id_proceso === 'Saldo_Precio');
      const isVentaDirecta = neg && (neg.tipo_operacion === 'Venta_Directa' || neg.id_proceso === 'Venta_Directa');
      
      let tipoBadge = '<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);"><i class="fa-solid fa-file-contract"></i> Promesa en Cuotas</span>';
      let b1 = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._aprobarReservaDirecta('${p.id}',event)" title="Aprobar Reserva Directa" style="padding: 6px 14px; background: rgba(22, 163, 74, 0.2); border: 1px solid #16a34a; color: #4ade80; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-check"></i> 1. Aprobar Reserva</button>`;

      if (isSaldoPrecio) {
        tipoBadge = '<span class="tag" style="font-size:0.72rem; background: rgba(147, 51, 234, 0.15); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.3); font-weight:700;"><i class="fa-solid fa-landmark"></i> Saldo de Precio</span>';
        b1 = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._aprobarReservaDirecta('${p.id}',event)" title="Aprobar Saldo de Precio" style="padding: 6px 14px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; color: #c084fc; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-landmark"></i> 1. Aprobar Saldo Precio</button>`;
      } else if (isVentaDirecta) {
        tipoBadge = '<span class="tag tag-venta-directa" style="font-size:0.72rem; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); font-weight:700;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>';
        b1 = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._aprobarReservaDirecta('${p.id}',event)" title="Aprobar Venta Contado" style="padding: 6px 14px; background: rgba(217, 119, 6, 0.2); border: 1px solid #d97706; color: #fbbf24; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-bolt"></i> 1. Aprobar Venta Contado</button>`;
      }

      const cantCtasInfo = (neg && neg.cantidad_cuotas && Number(neg.cantidad_cuotas) > 0) ? `<div style="font-size:0.72rem; color:var(--text-dim);">${neg.cantidad_cuotas} cuotas</div>` : '';
      const docsBadge = `<span class="tag" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.72rem; font-weight:600;">1. Pendiente</span>`;

      return `<tr>
        <td data-label="Fecha">${fecha}</td>
        <td data-label="Lote / Proyecto">${loteProy}</td>
        <td data-label="Tipo">${tipoBadge}</td>
        <td data-label="Cliente"><div style="text-align:right;"><span style="font-weight:600;">${cliName}</span> <span style="font-size:0.74rem; color:var(--text-dim);">(${rut})</span></div></td>
        <td data-label="Valor"><div style="font-weight:700; color:#10b981;">${monto}</div>${cantCtasInfo}</td>
        <td data-label="Documentos">${docsBadge}</td>
        <td data-label="Acción" style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            ${b1}
            <button class="btn btn-sm btn-outline btn-icon-only" onclick="window.APP5T.openLoteHistorial('${p.id}')" title="Ver Historial del Lote" style="padding: 6px 10px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
            <button class="btn btn-sm btn-outline danger-action btn-icon-only" onclick="window.APP5T._rechazarReservaDirecta('${p.id}',event)" title="Rechazar/Cancelar Reserva" style="padding: 6px 10px;">
              <i class="fa-solid fa-ban" style="color: var(--accent-red);"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');

    return { html, hasMatches: true };
  }

  /* ── PESTAÑA 2: Ficha Abogado y Firma Promesa ── */
  function _getMesaTab2Rows() {
    let rows = [];
    (APP5T_DB.getAll('propiedades') || []).forEach(p => {
      const st = String(p.estado || '').toLowerCase();
      if (st === 'reservada' || st === 'reservado') {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
        const neg  = negs.find(n => n.estado_avance === 'Aprobado') || negs[negs.length - 1];
        rows.push({ p, neg });
      }
    });

    const apQuery = (window._aprobacionesSearchQuery || '').trim().toLowerCase();
    if (apQuery) {
      const qClean = apQuery.replace(/[^0-9kK]/g, '').toLowerCase();
      rows = rows.filter(({ p, neg }) => {
        const cli    = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
        const proy   = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        const lote   = (p.nombre || `Lote ${p.id}`).toLowerCase();
        const proyNom= (proy ? (proy.nombre_proyecto || proy.nombre || '') : '').toLowerCase();
        const cliName= (cli ? `${cli.nombres||''} ${cli.apellidos||''}` : '').toLowerCase();
        const rut    = (cli ? (cli.rut || '') : '').replace(/[^0-9kK]/g, '').toLowerCase();
        return lote.includes(apQuery) || proyNom.includes(apQuery) || cliName.includes(apQuery) || (qClean && rut.includes(qClean));
      });
    }

    const emptyMsg = apQuery ? 'No se encontraron reservas para la búsqueda' : 'Sin reservas aprobadas en etapa de Promesa';
    if (rows.length === 0) {
      return {
        html: `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px; text-align: center; color: var(--text-dim);"><i class="fa-solid fa-inbox" style="font-size:1.3rem;opacity:0.4;display:block;margin-bottom:8px;"></i>${emptyMsg}</td></tr>`,
        hasMatches: false
      };
    }

    const html = rows.map(({ p, neg }) => {
      const cli    = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const proy   = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const fecha  = p.fecha_reserva || (neg ? (neg.fecha_negociacion || neg.fecha_ingreso) : '-') || APP5T_Utils.fechaHoy();
      const lote   = p.nombre || `Lote ${p.id}`;
      const proyNom= proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-';
      const loteProy = `<strong style="color: var(--accent-green); font-size: 1.02em;">${lote} / ${proyNom}</strong>`;
      const cliName= cli ? `${cli.nombres||''} ${cli.apellidos||''}`.trim() : 'Cliente';
      const rut    = cli ? (cli.rut || '-') : '-';
      const monto  = APP5T_Utils.formatMoneda((neg ? (neg.valor_final || p.valor_final || 0) : (p.valor_final || 0)));

      const isSaldoPrecio = neg && (neg.tipo_operacion === 'Saldo_Precio' || neg.id_proceso === 'Saldo_Precio');
      const isVentaDirecta = neg && (neg.tipo_operacion === 'Venta_Directa' || neg.id_proceso === 'Venta_Directa');
      let tipoBadge = '<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);"><i class="fa-solid fa-file-contract"></i> Promesa en Cuotas</span>';
      if (isSaldoPrecio) {
        tipoBadge = '<span class="tag" style="font-size:0.72rem; background: rgba(147, 51, 234, 0.15); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.3); font-weight:700;"><i class="fa-solid fa-landmark"></i> Saldo de Precio</span>';
      } else if (isVentaDirecta) {
        tipoBadge = '<span class="tag tag-venta-directa" style="font-size:0.72rem; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); font-weight:700;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>';
      }

      const isFichaGen = !!p.ficha_abogado_generada || (neg && (!!neg.ficha_abogado_generada || (neg.notas || '').includes('[FICHA_ABOGADO:GENERADA]')));
      const isAutorizadoPromesa = !!p.autorizado_promesa || (neg && (!!neg.autorizado_promesa || (neg.notas || '').includes('[AUTORIZADO_PROMESA:TRUE]')));
      const isPromesaFirmada = String(p.estado || '').toLowerCase().includes('promesa') || (neg && !!neg.promesa_firmada);

      let docsBadge = '', b2 = '', b3 = '';

      if (!isFichaGen) {
        docsBadge = `<span class="tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; font-weight:600;">2. Pend. Ficha Legal</span>`;
        b2 = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._enviarFichaAbogado('${p.id}', 'promesa')" title="Descargar Ficha Legal para Abogado" style="padding: 6px 14px; background: rgba(37, 99, 235, 0.2); border: 1px solid #2563eb; color: #60a5fa; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-file-pdf"></i> Ficha Legal</button>`;
        b3 = `<button class="btn btn-sm btn-outline btn-action-main" disabled title="Descargue primero la Ficha Legal" style="padding: 6px 10px; opacity: 0.5; cursor: not-allowed; background: rgba(255,255,255,0.02);"><i class="fa-solid fa-lock"></i> Pend. Ficha</button>`;
      } else if (isFichaGen && !isAutorizadoPromesa && !isPromesaFirmada) {
        docsBadge = `<span class="tag" style="background: rgba(59, 130, 246, 0.15); color: #3498db; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 0.72rem; font-weight:600;">3. Ficha Emitida</span>`;
        b2 = `<button class="btn btn-sm btn-outline btn-action-main" onclick="window.APP5T._enviarFichaAbogado('${p.id}', 'promesa')" title="Re-descargar Ficha Legal" style="padding: 6px 12px; border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; font-weight:600;"><i class="fa-solid fa-file-circle-check"></i> Ficha ✓</button>`;
        b3 = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._autorizarFirmaPromesaDirecta('${p.id}', event)" title="Autorizar Firma de Promesa en Administración" style="padding: 6px 14px; background: rgba(124, 58, 237, 0.2); border: 1px solid #7c3aed; color: #c084fc; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-file-signature"></i> Autorizar Firma</button>`;
      } else {
        docsBadge = `<span class="tag" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.72rem; font-weight:600;">4. Autorizada ✓</span>`;
        b2 = `<button class="btn btn-sm btn-outline btn-action-main" onclick="window.APP5T._enviarFichaAbogado('${p.id}', 'promesa')" title="Re-descargar Ficha Legal" style="padding: 6px 8px; border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; font-weight:600;"><i class="fa-solid fa-file-circle-check"></i> Ficha ✓</button>`;
        b3 = `<button class="btn btn-sm btn-action-main" onclick="APP5T_Utils.showToast('Firma de Promesa autorizada por Gerencia. Proceso habilitado en Administración.', 'info')" title="Firma ya autorizada" style="padding: 6px 8px; background: rgba(22, 163, 74, 0.2); border: 1px solid #16a34a; color: #4ade80; font-weight:700; border-radius: 6px;"><i class="fa-solid fa-check-double"></i> Autorizada ✓</button>`;
      }

      return `<tr>
        <td data-label="Fecha">${fecha}</td>
        <td data-label="Lote / Proyecto">${loteProy}</td>
        <td data-label="Tipo">${tipoBadge}</td>
        <td data-label="Cliente"><div style="text-align:right;"><span style="font-weight:600;">${cliName}</span> <span style="font-size:0.74rem; color:var(--text-dim);">(${rut})</span></div></td>
        <td data-label="Valor"><div style="font-weight:700; color:#10b981;">${monto}</div></td>
        <td data-label="Documentos">${docsBadge}</td>
        <td data-label="Acción" style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            ${b2}
            ${b3}
            <button class="btn btn-sm btn-outline btn-icon-only" onclick="window.APP5T.openLoteHistorial('${p.id}')" title="Ver Historial del Lote" style="padding: 6px 10px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
            <button class="btn btn-sm btn-outline danger-action btn-icon-only" onclick="window.APP5T._rechazarReservaDirecta('${p.id}',event)" title="Cancelar Reserva" style="padding: 6px 10px;">
              <i class="fa-solid fa-ban" style="color: var(--accent-red);"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');

    return { html, hasMatches: true };
  }

  /* ── PESTAÑA 3: Cierre Final y Escrituración ── */
  function _getMesaTab3Rows() {
    let negs = _getTab3ActiveNegs();
    const apQuery = (window._aprobacionesSearchQuery || '').trim().toLowerCase();
    if (apQuery) {
      const qClean = apQuery.replace(/[^0-9kK]/g, '').toLowerCase();
      negs = negs.filter(neg => {
        const p    = APP5T_DB.getById('propiedades', neg.id_propiedad);
        const cli  = APP5T_DB.getById('clientes', neg.id_cliente);
        const proy = p && p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        const lote    = (p ? (p.nombre || `Lote ${p.id}`) : `Lote ${neg.id_propiedad}`).toLowerCase();
        const proyNom = (proy ? (proy.nombre_proyecto || proy.nombre || '') : '').toLowerCase();
        const cliName = (cli ? `${cli.nombres||''} ${cli.apellidos||''}` : '').toLowerCase();
        const rut     = (cli ? (cli.rut || '') : '').replace(/[^0-9kK]/g, '').toLowerCase();
        return lote.includes(apQuery) || proyNom.includes(apQuery) || cliName.includes(apQuery) || (qClean && rut.includes(qClean));
      });
    }

    const emptyMsg = apQuery ? 'No se encontraron procesos para la búsqueda' : 'Sin procesos en etapa de Cierre Final y Escrituración';
    if (negs.length === 0) {
      return {
        html: `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px; text-align: center; color: var(--text-dim);"><i class="fa-solid fa-inbox" style="font-size:1.3rem;opacity:0.4;display:block;margin-bottom:8px;"></i>${emptyMsg}</td></tr>`,
        hasMatches: false
      };
    }

    const html = negs.map(neg => {
      const p    = APP5T_DB.getById('propiedades', neg.id_propiedad);
      const cli  = APP5T_DB.getById('clientes', neg.id_cliente);
      const proy = p && p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const lote    = p ? (p.nombre || `Lote ${p.id}`) : `Lote ${neg.id_propiedad}`;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-';
      const loteProy = `<strong style="color: var(--accent-green); font-size: 1.02em;">${lote} / ${proyNom}</strong>`;
      const cliName = cli ? `${cli.nombres||''} ${cli.apellidos||''}`.trim() : 'Sin cliente';
      const rut     = cli ? (cli.rut || '-') : '-';
      const monto   = APP5T_Utils.formatMoneda(neg.valor_final || (p ? p.valor_final : 0) || 0);

      const isSaldoPrecio = (neg.tipo_operacion === 'Saldo_Precio' || neg.id_proceso === 'Saldo_Precio');
      const isVentaDirecta = (neg.tipo_operacion === 'Venta_Directa' || neg.id_proceso === 'Venta_Directa');
      let tipoBadge = '<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);"><i class="fa-solid fa-file-contract"></i> Promesa en Cuotas</span>';
      if (isSaldoPrecio) {
        tipoBadge = '<span class="tag" style="font-size:0.72rem; background: rgba(147, 51, 234, 0.15); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.3); font-weight:700;"><i class="fa-solid fa-landmark"></i> Saldo de Precio</span>';
      } else if (isVentaDirecta) {
        tipoBadge = '<span class="tag tag-venta-directa" style="font-size:0.72rem; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); font-weight:700;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>';
      }

      const isFichaEscrituraGen = !!(p && p.ficha_escritura_generada) || !!neg.ficha_escritura_generada || (neg.notas || '').includes('[FICHA_ESCRITURA:GENERADA]');
      const isEscrituraAutorizada = (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]');
      const bId = `bfe-${neg.id}`;
      
      const btnFichaEscritura = `<button class="btn btn-sm btn-action-main" onclick="window.APP5T._enviarFichaAbogado('${p ? p.id : neg.id_propiedad}', 'escritura')" title="Descargar Ficha para Escrituración" style="padding: 6px 8px; background: rgba(37, 99, 235, 0.2); border: 1px solid #2563eb; color: #60a5fa; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-file-contract"></i> ${isFichaEscrituraGen ? 'Ficha ✓' : 'Ficha Legal'}</button>`;
      
      let btnFirmaEscritura = '';
      if (isEscrituraAutorizada) {
        btnFirmaEscritura = `<button class="btn btn-sm btn-action-main" disabled style="padding: 6px 8px; background: rgba(22, 163, 74, 0.2); border: 1px solid #16a34a; color: #4ade80; font-weight:700; border-radius: 6px;"><i class="fa-solid fa-check-double"></i> Autorizada ✓</button>`;
      } else if (isFichaEscrituraGen) {
        btnFirmaEscritura = `<button class="btn btn-sm btn-action-main" id="${bId}" onclick="window.APP5T._aprobarAutorizacionEscrituracion('${neg.id}');var b=document.getElementById('${bId}');if(b){b.disabled=true;b.style.opacity='0.5';b.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Firmado';}" title="Autorizar Escrituración Notarial" style="padding: 6px 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-weight:700; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-check"></i> Autorizar</button>`;
      } else {
        btnFirmaEscritura = `<button class="btn btn-sm btn-outline btn-action-main" disabled title="Descargue primero la Ficha de Escritura" style="padding: 6px 8px; opacity: 0.5; cursor: not-allowed; background: rgba(255,255,255,0.02);"><i class="fa-solid fa-lock"></i> Pend. Ficha</button>`;
      }

      const docsBadge = `<span class="tag" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; font-weight:700;">100% Pagado</span>`;

      return `<tr>
        <td data-label="Fecha">${neg.fecha_negociacion || '-'}</td>
        <td data-label="Lote / Proyecto">${loteProy}</td>
        <td data-label="Tipo">${tipoBadge}</td>
        <td data-label="Cliente"><div style="text-align:right;"><span style="font-weight:600;">${cliName}</span> <span style="font-size:0.74rem; color:var(--text-dim);">(${rut})</span></div></td>
        <td data-label="Valor"><div style="font-weight:700; color:#10b981;">${monto}</div></td>
        <td data-label="Documentos">${docsBadge}</td>
        <td data-label="Acción" style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            ${btnFichaEscritura}
            ${btnFirmaEscritura}
            <button class="btn btn-sm btn-outline btn-icon-only" onclick="window.APP5T.openLoteHistorial('${p ? p.id : neg.id_propiedad}')" title="Ver Historial del Lote" style="padding: 6px 10px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');

    return { html, hasMatches: true };
  }

  /* ── Acciones auxiliares Mesa ── */
  function _enviarFichaAbogado(idProp, tipoDoc = 'promesa') {
    let prop = APP5T_DB.getById('propiedades', idProp);
    let neg = null;

    if (prop) {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
      neg = negs.find(n => n.estado_avance === 'Aprobado') || negs[0];
    } else {
      neg = APP5T_DB.getById('negociaciones', idProp);
      if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad en la base de datos.', 'error');
      return;
    }

    const isEscritura = tipoDoc === 'escritura';
    const tagKey = isEscritura ? '[FICHA_ESCRITURA:GENERADA]' : '[FICHA_ABOGADO:GENERADA]';
    const fieldKey = isEscritura ? 'ficha_escritura_generada' : 'ficha_abogado_generada';

    // 1. Marca la propiedad y todas las negociaciones asociadas con etiqueta persistente
    const propUpdate = {};
    propUpdate[fieldKey] = true;
    APP5T_DB.update('propiedades', prop.id, propUpdate);

    const allNegs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
    allNegs.forEach(n => {
      const existingNotas = n.notas || '';
      const newNotas = existingNotas.includes(tagKey) ? existingNotas : (existingNotas + '\n' + tagKey).trim();
      const negUpdate = {
        fecha_envio_abogado: APP5T_Utils.fechaHoy(),
        notas: newNotas
      };
      negUpdate[fieldKey] = true;
      APP5T_DB.update('negociaciones', n.id, negUpdate);
    });

    // 2. Genera y descarga el PDF de la Ficha Legal
    if (typeof APP5T_Forms !== 'undefined' && typeof APP5T_Forms.descargarFichaLegal === 'function') {
      APP5T_Forms.descargarFichaLegal(prop.id, tipoDoc);
    }

    // 3. Sincroniza en Supabase y refresca la UI
    if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
      APP5T_Sync.syncLocalToRemote().catch(() => {});
    }

    APP5T_Utils.showToast(`Ficha Legal (${isEscritura ? 'Escritura' : 'Promesa'}) descargada exitosamente.`, 'success');
    refreshAll();
    _renderAprobaciones();
  }

  function _validarPagoPromesa(idNeg) {
    if (!confirm('¿Confirma que el pago ha sido validado?\nEl proceso avanzará a Cierre Final y Escrituración.')) return;
    const neg = APP5T_DB.getById('negociaciones', parseInt(idNeg, 10));
    if (!neg) { APP5T_Utils.showToast('Negociación no encontrada', 'error'); return; }
    APP5T_DB.update('negociaciones', neg.id, { estado_escrituracion: 'Pendiente' });
    if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') APP5T_Sync.syncLocalToRemote().catch(() => {});
    APP5T_Utils.showToast('Pago validado — proceso en Cierre Final y Escrituración', 'success');
    _mesaGerenciaActiveTab = 3;
    _renderAprobaciones();
    if (typeof refreshAll === 'function') refreshAll();
  }

  function _renderPrecios() {
    const tbody = document.getElementById('tbody-precios');
    if (!tbody) return;
    const filter = document.getElementById('precios-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => String(p.id_proyecto) === String(proy.id));
      }
    }
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin propiedades</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '-';
      return `<tr>
        <td>${p.nombre || p.id}</td>
        <td data-label="Proyecto">${proyectoNombre}</td>
        <td>${(typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(p.superficie) : (p.superficie || '-')}</td>
        <td>${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>
      </tr>`;
    }).join('');
  }

  function _renderMesaPromesas() {
    const tbody = document.getElementById('tbody-mesa-promesas');
    if (!tbody) return;
    const negs = (APP5T_DB.getAll('negociaciones') || []).filter(n =>
      (n.id_proceso === 'Reserva' || n.id_proceso === 'Saldo_Precio' || n.tipo_operacion === 'Saldo_Precio') && (n.estado_avance === 'Aprobado' || n.estado_avance === 'En Curso')
    );
    let items = negs.filter(n => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      return p && p.estado === 'Reservada';
    });
    items.sort((a, b) => b.id - a.id);

    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin Reservas Pendientes</td></tr>'; return; }
    tbody.innerHTML = items.map((n, idx) => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      const c = APP5T_DB.getById('clientes', n.id_cliente);
      const proy = p ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      let loteProy = p ? `${p.nombre} / ${proy ? proy.nombre_proyecto : '-'}` : `Lote ${n.id_propiedad}`;
      if (idx === 0) {
        loteProy = `<strong style="color: var(--accent-green); font-size: 1.05em;">${loteProy}</strong>`;
      }

      let docsHtml = `<span class="tag" style="color: var(--text-dim); font-size: 0.75rem; border: 1px solid rgba(0,0,0,0.1);">Sin Rev.</span>`;
      const isSaldoPrecio = (n.tipo_operacion === 'Saldo_Precio' || n.id_proceso === 'Saldo_Precio');
      let tipoBadge = `<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);">Generar Promesa</span>`;
      if (isSaldoPrecio) {
        tipoBadge = `<span class="tag" style="font-size:0.72rem; background: rgba(147, 51, 234, 0.15); color: #7e22ce; border: 1px solid rgba(147, 51, 234, 0.3); font-weight:700;"><i class="fa-solid fa-landmark"></i> Saldo de Precio</span>`;
      }

      const isAutorizadoPromesaDoc = !!(n.autorizado_promesa || (n.notas || '').includes('[AUTORIZADO_PROMESA:TRUE]') || (p && p.autorizado_promesa));
      const btnTitle = isSaldoPrecio ? 'Registrar Escritura con Hipoteca' : 'Registrar Promesa de Compraventa';
      const btnIcon = isSaldoPrecio ? 'fa-solid fa-landmark' : 'fa-solid fa-file-signature';
      const btnText = isSaldoPrecio ? 'Escritura' : 'Promesa';
      const btnPromesaDoc = isAutorizadoPromesaDoc
        ? `<button class="btn btn-sm btn-outline" onclick="window.APP5T._signPromesa('${n.id}', event)" title="${btnTitle}" style="padding: 5px 10px; background: #eff6ff; border-color: #2563eb; color: #1d4ed8; font-weight:700;"><i class="${btnIcon}" style="color: #2563eb;"></i> ${btnText}</button>`
        : `<button disabled title="Requiere confirmación previa de Gerencia en Pestaña 2" style="padding: 5px 10px; opacity: 0.55; cursor: not-allowed; background: #f1f5f9; border-color: #cbd5e1; color: #94a3b8;"><i class="fa-solid fa-lock" style="color: #94a3b8;"></i> Bloqueado</button>`;

      return `<tr>
        <td>${n.fecha_negociacion || APP5T_Utils.fechaHoy()}</td>
        <td>${loteProy}</td>
        <td>${tipoBadge}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '-'}</td>
        <td>${APP5T_Utils.formatMoneda(n.valor_final || 0)}</td>
        <td>${docsHtml}</td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${btnPromesaDoc}
            <button class="btn btn-sm btn-outline" onclick="APP5T_Forms.mostrarComprobanteReservaSimulado('${n.id}')" title="Generar Recibo" style="padding: 5px 10px;">
              <i class="fa-solid fa-file-invoice-dollar" style="color: #10b981;"></i> Recibo
            </button>
            <button class="btn btn-sm btn-outline btn-icon-only" onclick="window.APP5T.openLoteHistorial('${n.id_propiedad}')" title="Ver Historial del Lote" style="padding: 5px 8px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
            <button class="btn btn-sm btn-outline danger-action btn-icon-only" onclick="window.APP5T._rechazarReservaDirecta('${n.id_propiedad}', event)" title="Cancelar Reserva" style="padding: 5px 10px;">
              <i class="fa-solid fa-ban" style="color: var(--accent-red);"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }


  function _autorizarFirmaPromesaDirecta(idOrProp, event) {
    if (event) event.stopPropagation();
    let prop = APP5T_DB.getById('propiedades', idOrProp);
    let neg = null;

    if (prop) {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
      neg = negs.find(n => n.estado_avance === 'Aprobado') || negs[0];
    } else {
      neg = APP5T_DB.getById('negociaciones', idOrProp);
      if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad asociada.', 'error');
      return;
    }

    if (!confirm(`¿Confirma la autorización de Gerencia para habilitar la Firma de la Promesa de Compraventa del lote ${prop.nombre || `Lote ${prop.id}`} en Administración?`)) return;

    // 1. Marcar autorización en la propiedad y en todas las negociaciones del lote
    APP5T_DB.update('propiedades', prop.id, {
      autorizado_promesa: true
    });

    const allNegs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
    allNegs.forEach(n => {
      const existingNotas = n.notas || '';
      const newNotas = existingNotas.includes('[AUTORIZADO_PROMESA:TRUE]') ? existingNotas : (existingNotas + '\n[AUTORIZADO_PROMESA:TRUE]').trim();
      APP5T_DB.update('negociaciones', n.id, {
        autorizado_promesa: true,
        notas: newNotas
      });
    });

    APP5T_Utils.showToast('Firma de Promesa autorizada por Gerencia. Botón "Promesa" habilitado en la Mesa Documental de Administración.', 'success');

    if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
      APP5T_Sync.syncLocalToRemote().catch(() => {});
    }
    refreshAll();
    _renderAprobaciones();
  }

  function _autorizarPromesaEscrituracion(idNeg) {
    if (!idNeg) return;
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;

    if (window.confirm('Se enviará una solicitud al Gerente para autorizar la escrituración de esta Promesa. ¿Deseas continuar?')) {
      neg.notas = (neg.notas || '').replace('[AUTORIZADO_ESCRITURAR:TRUE]', '').trim();
      if (!neg.notas.includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]')) {
         neg.notas = (neg.notas ? neg.notas + ' ' : '') + '[AUTORIZADO_ESCRITURAR:PENDIENTE]';
      }
      APP5T_DB.update('negociaciones', neg.id, neg);
      
      const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
      const cli = APP5T_DB.getById('clientes', neg.id_cliente);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      
      const loteNom = prop ? prop.nombre : '-';
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre) : '-';
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '-';
      
      const text = `⚖️ *Solicitud de Autorización de Escritura*\n\nHola. Te informo que el *Lote ${loteNom}* del proyecto *${proyNom}* ha finalizado el pago de su cuenta corriente al 100%.\n\nPor favor, revisa y aprueba la solicitud en tu panel de aprobaciones para habilitar la firma de la escritura de venta a nombre de *${cliNom}*.`;
      const waCfg = _getWAConfig(); const tel = waCfg.tel;
      const url = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
      
      if (window.confirm('¡Solicitud Enviada!\n\n¿Deseas enviar la notificación a Gerencia por WhatsApp ahora?')) {
        window.open(url, '_blank');
      }
      
      refreshAll();
      if (typeof APP5T_Sync !== 'undefined') APP5T_Sync.syncLocalToRemote();
    }
  }

  function _aprobarAutorizacionEscrituracion(idNeg) {
    if (!idNeg) return;
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;

    if (window.confirm('¿Aprobar el paso a Escrituración de esta propiedad?')) {
      neg.notas = (neg.notas || '').replace('[AUTORIZADO_ESCRITURAR:PENDIENTE]', '').trim();
      if (!neg.notas.includes('[AUTORIZADO_ESCRITURAR:TRUE]')) {
         neg.notas = (neg.notas ? neg.notas + ' ' : '') + '[AUTORIZADO_ESCRITURAR:TRUE]';
      }
      APP5T_DB.update('negociaciones', neg.id, neg);
      APP5T_Utils.showToast('¡Escrituración autorizada con éxito!', 'success');
      refreshAll();
      if (typeof APP5T_Sync !== 'undefined') APP5T_Sync.syncLocalToRemote();
    }
  }

  async function _cancelarPromesaYLiberarLote(idProp, idNeg, loteNom) {
    if (!idNeg) return;
    const prop = idProp ? APP5T_DB.getById('propiedades', idProp) : null;
    const nombreLote = loteNom || (prop ? prop.nombre : `Lote #${idProp}`);

    const confirmMsg = `⚠️ ADVERTENCIA CRÍTICA:\n\n¿Está seguro de que desea CANCELAR la Promesa del lote "${nombreLote}" y volver el lote al estado DISPONIBLE?\n\nEsta acción ejecutará lo siguiente:\n1. Cambiará el estado de la parcela a "Disponible".\n2. Borrará todos los trámites legales y documentos asociados.\n3. Anulará y eliminará las cuotas pendientes de Cuenta Corriente.\n4. Eliminará la negociación en curso.\n\n¿Desea confirmar y proceder?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = APP5T_DB.rechazarReserva(Number(idNeg), `Promesa cancelada y lote liberado por Administración (${APP5T_Utils.fechaHoy()})`);
      if (res && res.success === false) {
        APP5T_Utils.showToast(`Error al cancelar promesa: ${res.error}`, 'error');
        return;
      }

      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.deleteCascadePropiedad === 'function') {
        await APP5T_Sync.deleteCascadePropiedad(idProp, idNeg);
      }

      APP5T_Utils.showToast(`✅ Promesa cancelada. El lote ${nombreLote} ahora está DISPONIBLE y sus trámites han sido borrados.`, 'success');

      if (typeof refreshAll === 'function') {
        refreshAll();
      } else if (window.APP5T && typeof window.APP5T.refreshAll === 'function') {
        window.APP5T.refreshAll();
      }

      if (typeof _renderMesaPromesasCurso === 'function') _renderMesaPromesasCurso();
      if (typeof _renderMesaOperaciones === 'function') _renderMesaOperaciones();
      if (typeof _renderMesaControlLegal === 'function') _renderMesaControlLegal();
      if (typeof _renderMesaEscrituras === 'function') _renderMesaEscrituras();
      if (typeof _renderAdminTable === 'function') _renderAdminTable();
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
        await APP5T_Sync.syncLocalToRemote();
      }
    } catch (err) {
      console.error('Error en _cancelarPromesaYLiberarLote:', err);
      alert(`Error al cancelar promesa: ${err.message}`);
    }
  }

  function _renderMesaPromesasCurso() {
    const tbody = document.getElementById('tbody-mesa-promesas-curso');
    if (!tbody) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Promesada');
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin promesas en curso</td></tr>'; return; }
    
    const todasCtaCte = APP5T_DB.getAll('cuenta_corriente') || [];
    let itemsHtml = '';

    props.forEach(p => {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
      const neg = negs.sort((a, b) => b.id - a.id)[0];
      if (!neg || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]')) return;

      const c = APP5T_DB.getById('clientes', neg.id_cliente);
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      
      let todasPagadas = true;
      let cuotasPendientes = 0;
      const cuotasProp = todasCtaCte.filter(q => Number(q.id_propiedad) === Number(p.id));
      if (cuotasProp.length > 0) {
        const pendientes = cuotasProp.filter(q => {
          const pagado = Number(q.valor_pagado || 0);
          const cuota  = Number(q.valor_cuota  || 0);
          if (cuota <= 0) return false;
          if (q.estado_cuota) {
            const est = String(q.estado_cuota).trim().toLowerCase();
            if (est.includes('anulad') || est.includes('reprogramad')) return false;
            return est !== 'pagado' && est !== 'pagada' && est !== 'paid';
          }
          return pagado < cuota;
        });
        cuotasPendientes = pendientes.length;
        todasPagadas = cuotasPendientes === 0;
      }

      let lockHtml = '';
      let tooltipText = '';
      if (!todasPagadas) {
        tooltipText = cuotasPendientes + ' cuota' + (cuotasPendientes > 1 ? 's' : '') + ' pendiente' + (cuotasPendientes > 1 ? 's' : '') + ' de pago';
        lockHtml = ' <i class="fa-solid fa-lock text-danger" style="font-size:0.75rem; margin-left:4px;" title="Bloqueado: ' + tooltipText + '"></i>';
      }

      const loteProy = p.nombre + ' / ' + (proy ? proy.nombre_proyecto : '-') + lockHtml;

      const docs = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(p.id)) || [];
      const docTypes = ['Cédula/RUT', 'Comprobantes', 'Reserva', 'Promesa', 'Escritura'];
      let requiredCount = 4;
      

      let docsHtml = '<span class="tag" style="color: var(--text-dim); font-size: 0.75rem; border: 1px solid rgba(0,0,0,0.1);">Sin Rev.</span>';

      const tipoBadge = '<span class="tag" style="font-size:0.72rem; background: rgba(243, 156, 18, 0.15); color: #f39c12; border: 1px solid rgba(243, 156, 18, 0.25);"><i class="fa-solid fa-file-signature"></i> Promesa en Curso</span>';

      let actionItemHtml = '';
      if (!todasPagadas) {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.55; cursor: not-allowed; padding: 5px 10px;" title="${tooltipText}"><i class="fa-solid fa-lock" style="color: var(--text-dim);"></i> Bloqueado</button>`;
      } else if (neg.autorizado_escriturar === 'Pendiente') {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.6; cursor: not-allowed; padding: 5px 10px;"><i class="fa-solid fa-clock" style="color: var(--accent-orange);"></i> Pendiente Autorización</button>`;
      } else {
        actionItemHtml = `<button class="btn btn-sm btn-outline" onclick="window.APP5T._autorizarPromesaEscrituracion('${neg.id}')" title="Solicitar Escrituración" style="padding: 5px 10px;"><i class="fa-solid fa-check" style="color: var(--accent-green);"></i> Solicitar</button>`;
      }

      const cancelBtnHtml = `<button class="btn btn-sm" onclick="window.APP5T._cancelarPromesaYLiberarLote('${p.id}', '${neg.id}', '${(p.nombre || '').replace(/'/g, "\\'")}')" title="⚠️ ADVERTENCIA: Cancelar promesa, anular trámites y volver el lote a Disponible" style="padding: 5px 8px; background: rgba(255, 23, 68, 0.12); color: #ff1744; border: 1px solid rgba(255, 23, 68, 0.45); border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;"><i class="fa-solid fa-circle-xmark" style="color: #ff1744; font-size: 0.95rem;"></i></button>`;

      itemsHtml += '<tr>' +
        '<td>' + (neg.fecha_negociacion || neg.fecha_ingreso || APP5T_Utils.fechaHoy()) + '</td>' +
        '<td>' + loteProy + '</td>' +
        '<td>' + tipoBadge + '</td>' +
        '<td>' + (c ? c.nombres + ' ' + c.apellidos : '-') + '</td>' +
        '<td>' + APP5T_Utils.formatMoneda(neg.valor_final || 0) + '</td>' +
        '<td>' + docsHtml + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">' +
             actionItemHtml +
             cancelBtnHtml +
          '</div>' +
        '</td>' +
      '</tr>';
    });

    if (!itemsHtml) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin promesas en curso</td></tr>'; return; }
    tbody.innerHTML = itemsHtml;
  }

  function _renderMesaEscrituras() {
    const tbody = document.getElementById('tbody-mesa-escrituras');
    if (!tbody) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => {
      if (p.estado === 'Venta_Directa') return true;
      if (p.estado === 'Promesada') {
         const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
         const neg = negs.sort((a, b) => b.id - a.id)[0];
         return (neg && (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]'));
      }
      return false;
    });
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin escrituras pendientes</td></tr>'; return; }

    const todasCtaCte = APP5T_DB.getAll('cuenta_corriente') || [];

    tbody.innerHTML = props.map(p => {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
      const neg = negs.sort((a, b) => b.id - a.id)[0];
      const c = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const esVD = p.estado === 'Venta_Directa';
      const tipoBadge = esVD
        ? `<span class="tag tag-venta-directa" style="font-size:0.72rem;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>`
        : `<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(231, 76, 60, 0.15); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.25);">Firma Escritura</span>`;

      // ── Verificar cuotas de cuenta corriente ──
      let todasPagadas = true;
      let cuotasPendientes = 0;
      const propId = p.id;
      const cuotasProp = todasCtaCte.filter(q => Number(q.id_propiedad) === Number(propId));
      if (cuotasProp.length > 0) {
        const pendientes = cuotasProp.filter(q => {
          const pagado = Number(q.valor_pagado || 0);
          const cuota  = Number(q.valor_cuota  || 0);
          if (cuota <= 0) return false;
          if (q.estado_cuota) {
            const est = String(q.estado_cuota).trim().toLowerCase();
            if (est.includes('anulad') || est.includes('reprogramad')) return false;
            return est !== 'pagado' && est !== 'pagada' && est !== 'paid';
          }
          return pagado < cuota;
        });
        cuotasPendientes = pendientes.length;
        todasPagadas = cuotasPendientes === 0;
      }

      let lockHtml = '';
      let tooltipText = '';
      if (!todasPagadas) {
        tooltipText = `${cuotasPendientes} cuota${cuotasPendientes > 1 ? 's' : ''} pendiente${cuotasPendientes > 1 ? 's' : ''} de pago`;
        lockHtml = ` <i class="fa-solid fa-lock text-danger" style="font-size:0.75rem; margin-left:4px;" title="Escrituración Bloqueada: ${tooltipText}"></i>`;
      }
      
      const loteProy = `${p.nombre} / ${proy ? proy.nombre_proyecto : '-'}${lockHtml}`;

      // Query documents for this lot/property
      const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(p.id)) : []) || [];
      const docTypes = ['Cédula/RUT', 'Comprobantes', 'Reserva', 'Promesa', 'Escritura'];
      let requiredCount = 4; // Default for Promesada
      if (p && (p.estado === 'Vendida' || p.estado === 'Escriturada')) requiredCount = 5;
      
      

      let docsHtml = `<span class="tag" style="color: var(--text-dim); font-size: 0.75rem; border: 1px solid rgba(0,0,0,0.1);">Sin Rev.</span>`;

      let actionItemHtml = '';
      if (!todasPagadas) {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.55; cursor: not-allowed; padding: 5px 10px;" title="${tooltipText}"><i class="fa-solid fa-lock" style="color: var(--text-dim);"></i> Bloqueada</button>`;
      } else if (!neg || (!neg.estado_escrituracion && !(neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:'))) {
        actionItemHtml = `<button class="btn btn-sm btn-outline" onclick="window.APP5T._solicitarAutorizacionEscritura('${neg ? neg.id : ''}')" style="padding: 5px 10px;"><i class="fa-solid fa-file-pdf" style="color: var(--accent-orange);"></i> Solicitar Firma</button>`;
      } else if (neg.estado_escrituracion === 'Pendiente' || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]')) {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.6; cursor: not-allowed; padding: 5px 10px;"><i class="fa-solid fa-clock" style="color: var(--accent-orange);"></i> Pendiente Autorización</button>`;
      } else if (neg.estado_escrituracion === 'Autorizada' || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]')) {
        if (esVD) {
          actionItemHtml = `<button class="btn btn-sm btn-outline" onclick="window.APP5T._signEscrituraDirecta('${p.id}')" style="padding: 5px 10px;"><i class="fa-solid fa-bolt" style="color: var(--accent-purple);"></i> Escriturar</button>`;
        } else {
          actionItemHtml = `<button class="btn btn-sm btn-outline" onclick="window.APP5T._signEscritura('${p.id}')" style="padding: 5px 10px;"><i class="fa-solid fa-gavel" style="color: var(--accent-red);"></i> Escriturar</button>`;
        }
      }

      return `<tr>
        <td>${neg ? neg.fecha_negociacion : (p.fecha_ingreso || '-')}</td>
        <td>${loteProy}</td>
        <td>${tipoBadge}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '-'}</td>
        <td>${APP5T_Utils.formatMoneda(neg ? neg.valor_final : p.valor_final)}</td>
        <td>${docsHtml}</td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${actionItemHtml}
            <button class="btn btn-sm btn-outline danger-action btn-icon-only" onclick="window.APP5T._rechazarReservaDirecta('${p.id}', event)" title="Cancelar Venta" style="padding: 5px 10px;">
              <i class="fa-solid fa-ban" style="color: var(--accent-red);"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }


  function _renderCtaCte() {
    const tbody = document.getElementById('tbody-ctacte');
    if (!tbody) return;

    const summaryContainer = document.getElementById('ctacte-summary-cards');
    const docContainer = document.getElementById('ctacte-documents-container');
    const actionGroup = document.getElementById('ctacte-actions');

    // Helper to format Lote / Proyecto
    const getLoteProyStr = (prop, fallbackId) => {
      if (!prop) return `Lote ${fallbackId || '-'}`;
      const etapa = prop.id_etapa ? APP5T_DB.getById('etapas', prop.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : (prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null);
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-';
      return `${prop.nombre} / ${proyNom}`;
    };

    // Populate the client filter dropdown
    const filterSelect = document.getElementById('ctacte-filter-cliente');
    let selectedClientId = filterSelect ? filterSelect.value : 'all';
    
    const lotGroup = document.getElementById('ctacte-filter-lote-group');
    const lotSelect = document.getElementById('ctacte-filter-lote');
    let selectedLoteId = lotSelect ? lotSelect.value : 'all';

    // Purge test client '10.709.197-1' / 'Rodrigo F' / 'Rodrigo Rivera' if present in local DB
    if (typeof APP5T_DB !== 'undefined' && typeof APP5T_DB.remove === 'function') {
      (APP5T_DB.getAll('clientes') || []).forEach(c => {
        if (!c) return;
        const fullNom = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().trim();
        const rut = String(c.rut || '').trim();
        if (rut.includes('10.709.197') || fullNom.includes('rodrigo f') || fullNom.includes('rodrigo rivera')) {
          APP5T_DB.remove('clientes', c.id);
        }
      });
    }

    const allClientes = (APP5T_DB.getAll('clientes') || []).filter(Boolean);
    const negs = (APP5T_DB.getAll('negociaciones') || []).filter(Boolean);
    const ctasAll = (APP5T_DB.getAll('cuenta_corriente') || []).filter(Boolean);

    // If navigated directly from map selection
    if (_currentSelectedPropiedadId && window._syncCtacteWithSelectedLot) {
      const selectedProp = APP5T_DB.getById('propiedades', _currentSelectedPropiedadId);
      window._syncCtacteWithSelectedLot = false;

      if (selectedProp) {
        const propCuotas = ctasAll.filter(c => c && (String(c.id_propiedad) === String(selectedProp.id) || String(c.id_propiedad) === String(selectedProp.nombre)));
        const negMatch = negs.find(n => n && (String(n.id_propiedad) === String(selectedProp.id) || String(n.id_propiedad) === String(selectedProp.nombre)));
        const targetClientId = (negMatch && negMatch.id_cliente) ? String(negMatch.id_cliente) : ((propCuotas.length && propCuotas[0].id_cliente) ? String(propCuotas[0].id_cliente) : (selectedProp.id_cliente ? String(selectedProp.id_cliente) : null));

        if (selectedProp.estado === 'Disponible') {
          if (filterSelect) filterSelect.value = 'all';
          if (lotGroup) lotGroup.style.display = 'none';
          if (docContainer) { docContainer.style.display = 'none'; docContainer.innerHTML = ''; }
          if (actionGroup) actionGroup.style.display = 'none';
          if (summaryContainer) summaryContainer.innerHTML = '';

          const loteProy = getLoteProyStr(selectedProp, selectedProp.id);
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center" style="padding: 40px 20px;">
                <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                  <i class="fa-solid fa-tree" style="font-size: 3rem; color: var(--accent-green); opacity: 0.85;"></i>
                  <div style="color: var(--text-white); font-weight: 600; font-size: 1.15rem;">Propiedad Disponible</div>
                  <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 520px; line-height: 1.5;">
                    El lote <strong>${loteProy}</strong> se encuentra <strong>Disponible</strong> para la venta.
                    La Cuenta Corriente se activa automáticamente al registrar una Promesa de Compraventa con financiamiento en cuotas.
                  </div>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        if ((selectedProp.estado === 'Vendida' || selectedProp.estado === 'Escriturada') && propCuotas.length === 0) {
          if (filterSelect && targetClientId) filterSelect.value = targetClientId;
          if (lotGroup) lotGroup.style.display = 'none';
          if (docContainer) { docContainer.style.display = 'none'; docContainer.innerHTML = ''; }
          if (actionGroup) actionGroup.style.display = 'none';
          if (summaryContainer) summaryContainer.innerHTML = '';

          const loteProy = getLoteProyStr(selectedProp, selectedProp.id);
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center" style="padding: 40px 20px;">
                <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                  <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--accent-green); opacity: 0.85;"></i>
                  <div style="color: var(--text-white); font-weight: 600; font-size: 1.15rem;">Venta Cerrada / Escriturada</div>
                  <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 520px; line-height: 1.5;">
                    El lote <strong>${loteProy}</strong> se encuentra en estado <strong>${selectedProp.estado}</strong> (Venta Histórica Cerrada).
                    Esta propiedad no posee cobros pendientes ni cuenta corriente activa en curso.
                  </div>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        if (targetClientId) {
          selectedClientId = targetClientId;
          selectedLoteId = String(selectedProp.id);
        } else if (propCuotas.length > 0) {
          selectedLoteId = String(selectedProp.id);
        }
      }
    }

    // 1. Filtrar los clientes que tienen cuotas registradas o que corresponden al lote seleccionado
    const clientIdsWithCtas = new Set(ctasAll.map(c => c && String(c.id_cliente)).filter(Boolean));
    if (selectedClientId !== 'all') {
      clientIdsWithCtas.add(String(selectedClientId));
    }

    const activeClientes = allClientes.filter(c => {
      if (!c) return false;
      const fullNom = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().trim();
      const rut = String(c.rut || '').trim();
      if (rut.includes('10.709.197') || fullNom.includes('rodrigo f') || fullNom.includes('rodrigo rivera')) return false;
      return clientIdsWithCtas.has(String(c.id));
    });

    // Poblar datalist del Buscador Inteligente
    const searchDatalist = document.getElementById('dl-ctacte-search');
    if (searchDatalist) {
      searchDatalist.innerHTML = activeClientes.map(c => `<option value="${c.nombres} ${c.apellidos}">RUT: ${c.rut || '-'}</option>`).join('');
    }

    if (filterSelect) {
      let html = '<option value="all">-- Todos los Clientes con Cuenta Corriente --</option>';
      activeClientes.forEach(c => {
        const isSel = String(c.id) === String(selectedClientId) ? 'selected' : '';
        html += `<option value="${c.id}" ${isSel}>${c.nombres} ${c.apellidos} (${c.rut})</option>`;
      });
      filterSelect.innerHTML = html;
      filterSelect.value = selectedClientId;

      if (!filterSelect.dataset.listenerAttached) {
        filterSelect.addEventListener('change', () => {
          window._syncCtacteWithSelectedLot = false;
          const lotSelectEl = document.getElementById('ctacte-filter-lote');
          if (lotSelectEl) lotSelectEl.value = 'all';
          _renderCtaCte();
        });
        filterSelect.dataset.listenerAttached = 'true';
      }
    }

    // Si hay texto en el buscador, verificar si coincide con un cliente específico para activar acciones de Reprogramar y Documentos
    const searchInputVal = (document.getElementById('ctacte-search')?.value || '').trim().toLowerCase();
    if (searchInputVal) {
      const cleanSearch = searchInputVal.replace(/[\.\-]/g, '');
      const matchedCli = activeClientes.find(c => {
        const fullNom = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().trim();
        const rutClean = String(c.rut || '').toLowerCase().replace(/[\.\-]/g, '');
        return fullNom === searchInputVal || (cleanSearch.length >= 7 && rutClean === cleanSearch);
      });
      if (matchedCli) {
        selectedClientId = String(matchedCli.id);
        if (filterSelect) filterSelect.value = selectedClientId;
      }
    }

    // 2. Poblar el filtro de lotes para el cliente seleccionado
    if (selectedClientId !== 'all' && lotSelect && lotGroup) {
      lotGroup.style.display = 'flex';
      
      const clientCtas = ctasAll.filter(c => c && String(c.id_cliente) === String(selectedClientId));
      const propIdsForClient = new Set(clientCtas.map(c => String(c.id_propiedad)).filter(Boolean));
      negs.filter(n => n && String(n.id_cliente) === String(selectedClientId)).forEach(n => {
        if (n.id_propiedad) propIdsForClient.add(String(n.id_propiedad));
      });

      const clientProps = Array.from(propIdsForClient).map(pId => {
        const p = APP5T_DB.getById('propiedades', pId);
        if (!p) return null;
        const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        return { id: p.id, nombre: `${p.nombre} (${proy ? (proy.nombre_proyecto || proy.nombre || '—') : '—'})` };
      }).filter(Boolean);

      let lotHtml = '<option value="all">-- Todos los Lotes del Cliente --</option>';
      clientProps.forEach(p => {
        const isSel = String(p.id) === String(selectedLoteId) ? 'selected' : '';
        lotHtml += `<option value="${p.id}" ${isSel}>${p.nombre}</option>`;
      });
      lotSelect.innerHTML = lotHtml;
      if (selectedLoteId !== 'all' && propIdsForClient.has(selectedLoteId)) {
        lotSelect.value = selectedLoteId;
      } else {
        lotSelect.value = 'all';
        selectedLoteId = 'all';
      }

      if (!lotSelect.dataset.listenerAttached) {
        lotSelect.addEventListener('change', () => {
          _renderCtaCte();
        });
        lotSelect.dataset.listenerAttached = 'true';
      }
    } else if (lotGroup) {
      lotGroup.style.display = 'none';
      selectedLoteId = 'all';
    }

    if (actionGroup) {
      if (selectedClientId !== 'all' && selectedLoteId !== 'all') {
        const prop = APP5T_DB.getById('propiedades', selectedLoteId);
        const estado = prop ? (prop.estado_general || 'Disponible') : '';
        if (estado === 'Vendida' || estado === 'Escriturada') {
          actionGroup.style.display = 'none';
        } else {
          actionGroup.style.display = 'flex';
        }
      } else {
        actionGroup.style.display = 'none';
      }
    }

    // Fetch and display documents for the selected client/lote in CtaCte header
    if (docContainer) {
      if (selectedClientId === 'all') {
        docContainer.style.display = 'none';
        docContainer.innerHTML = '';
      } else {
        const clientNegs = negs.filter(n => n && String(n.id_cliente) === selectedClientId);
        const targetNegs = selectedLoteId !== 'all' 
          ? clientNegs.filter(n => n && String(n.id_propiedad) === selectedLoteId)
          : clientNegs;
        
        const propIds = targetNegs.map(n => n && String(n.id_propiedad)).filter(Boolean);
        const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => d && d.id_propiedad && propIds.includes(String(d.id_propiedad))) : []) || [];
        
        let totalDocs = targetNegs.filter(n => n && n.url).length + docs.length;
        if (totalDocs === 0) {
          docContainer.style.display = 'none';
          docContainer.innerHTML = '';
        } else {
          docContainer.style.display = 'inline-block';
          
          let itemsHtml = '';
          targetNegs.forEach(n => {
            if (n && n.url) {
              const prop = APP5T_DB.getById('propiedades', n.id_propiedad);
              const label = prop ? `Ficha/Recibo ${prop.nombre}` : 'Recibo Reserva';
              itemsHtml += `<li><a href="${n.url}" target="_blank" class="dropdown-item" style="color: #fff;"><i class="fa-solid fa-receipt"></i> ${label}</a></li>`;
            }
          });
          
          docs.forEach(d => {
            if (d && d.url_drive) {
              let icon = 'fa-file-pdf';
              let color = 'var(--accent-blue)';
              if (d.tipo_documento === 'Contrato') { icon = 'fa-file-signature'; color = 'var(--accent-purple)'; }
              else if (d.tipo_documento === 'Escritura') { icon = 'fa-gavel'; color = 'var(--accent-red)'; }
              else if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
              else if (d.tipo_documento === 'Carpeta') { icon = 'fa-folder-open'; color = 'var(--accent-orange)'; }
              
              const prop = APP5T_DB.getById('propiedades', d.id_propiedad);
              const propPrefix = prop ? `${prop.nombre}: ` : '';
              itemsHtml += `<li><a href="${d.url_drive}" target="_blank" class="dropdown-item" style="color: ${color};"><i class="fa-solid ${icon}"></i> ${propPrefix}${d.nombre}</a></li>`;
            }
          });
          
          docContainer.innerHTML = `
            <button class="btn btn-sm btn-outline dropdown-toggle" onclick="window.APP5T.toggleDropdown(event)" style="border-color: var(--accent-blue); color: var(--accent-blue); padding: 6px 12px; border-radius: 4px; display: flex; align-items: center; gap: 6px; font-weight: 600;">
              <i class="fa-solid fa-folder-open"></i> Documentos (${totalDocs}) <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 2px;"></i>
            </button>
            <ul class="dropdown-menu" style="right: 0; left: auto;">
              ${itemsHtml}
            </ul>
          `;
        }
      }
    }

    // Buscador Rápido Multicriterio (Cliente, RUT, Lote o Proyecto)
    const searchInput = document.getElementById('ctacte-search');
    const btnClearSearch = document.getElementById('btn-clear-ctacte-search');
    const searchQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();

    if (btnClearSearch) {
      btnClearSearch.style.display = searchQuery ? 'block' : 'none';
      if (!btnClearSearch.dataset.listenerAttached) {
        btnClearSearch.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          _renderCtaCte();
          if (searchInput) searchInput.focus();
        });
        btnClearSearch.dataset.listenerAttached = 'true';
      }
    }

    if (searchInput && !searchInput.dataset.listenerAttached) {
      searchInput.addEventListener('input', () => {
        if (filterSelect && filterSelect.value !== 'all' && searchInput.value.trim() !== '') {
          filterSelect.value = 'all';
          selectedClientId = 'all';
          if (lotGroup) lotGroup.style.display = 'none';
        }
        _renderCtaCte();
      });
      searchInput.dataset.listenerAttached = 'true';
    }

    let ctas = (APP5T_DB.getAll('cuenta_corriente') || []).filter(Boolean);
    ctas.sort((a, b) => (Number(a.cuota_nro) || 0) - (Number(b.cuota_nro) || 0));

    if (selectedClientId !== 'all') {
      ctas = ctas.filter(c => c && String(c.id_cliente) === selectedClientId);
    }
    if (selectedLoteId !== 'all') {
      const propObj = APP5T_DB.getById('propiedades', selectedLoteId);
      const propNombre = propObj ? String(propObj.nombre) : null;
      ctas = ctas.filter(c => c && (String(c.id_propiedad) === String(selectedLoteId) || (propNombre && String(c.id_propiedad) === propNombre)));
    }

    // Filtrar por texto de búsqueda libre
    if (searchQuery) {
      const cleanQuery = searchQuery.replace(/[\.\-]/g, '');
      ctas = ctas.filter(c => {
        const cli = APP5T_DB.getById('clientes', c.id_cliente);
        const cliNom = cli ? `${cli.nombres || ''} ${cli.apellidos || ''}`.toLowerCase() : '';
        const cliRut = cli ? String(cli.rut || '').toLowerCase().replace(/[\.\-]/g, '') : '';
        const prop = APP5T_DB.getById('propiedades', c.id_propiedad);
        const propNom = prop ? String(prop.nombre || '').toLowerCase() : '';
        const proy = prop && prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
        const proyNom = proy ? String(proy.nombre_proyecto || proy.nombre || '').toLowerCase() : '';

        return cliNom.includes(searchQuery) ||
               cliRut.includes(cleanQuery) ||
               propNom.includes(searchQuery) ||
               proyNom.includes(searchQuery) ||
               `lote ${propNom}`.includes(searchQuery);
      });
    }

    if (searchQuery && ctas.length === 0) {
      if (summaryContainer) summaryContainer.innerHTML = '';
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center" style="padding: 40px 20px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-dim);">
              <i class="fa-solid fa-user-slash" style="font-size: 2.8rem; color: #64748b; opacity: 0.7;"></i>
              <div style="color: #fff; font-weight: 600; font-size: 1.1rem;">No se encontraron cuotas para "${searchQuery}"</div>
              <div style="font-size: 0.85rem; max-width: 440px; line-height: 1.4;">
                Intente buscando por el <strong>nombre</strong>, <strong>apellido</strong>, <strong>RUT</strong> o el número de <strong>lote</strong> del comprador.
              </div>
            </div>
          </td>
        </tr>`;
      return;
    }

    if (selectedClientId === 'all') {
      ctas.sort((a, b) => {
        const parseDate = (dstr) => {
          if (!dstr) return Infinity;
          const p = dstr.includes('/') ? dstr.split('/') : dstr.split('-');
          if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]).getTime();
          return Infinity;
        };
        return parseDate(a.fecha_vencimiento) - parseDate(b.fecha_vencimiento);
      });
    }

    // If a specific client or lot is selected and they have no active cuotas
    if (selectedClientId !== 'all' && ctas.length === 0) {
      if (summaryContainer) summaryContainer.innerHTML = '';
      const clientNegs = negs.filter(n => n && String(n.id_cliente) === selectedClientId);
      
      let activeNeg = null;
      if (selectedLoteId !== 'all') {
        activeNeg = clientNegs.find(n => n && String(n.id_propiedad) === selectedLoteId);
      } else {
        activeNeg = clientNegs.find(n => n.estado_avance === 'En Curso' || n.estado_avance === 'Aprobado') || clientNegs[0];
      }

      const targetPropId = selectedLoteId !== 'all' ? selectedLoteId : (activeNeg ? activeNeg.id_propiedad : null);
      const prop = targetPropId ? APP5T_DB.getById('propiedades', targetPropId) : null;
      const loteProy = getLoteProyStr(prop, targetPropId);

      if (prop && (prop.estado === 'Vendida' || prop.estado === 'Escriturada')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 40px 20px;">
              <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--accent-green); opacity: 0.85;"></i>
                <div style="color: var(--text-white); font-weight: 600; font-size: 1.15rem;">Venta Cerrada / Escriturada</div>
                <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 520px; line-height: 1.5;">
                  El lote <strong>${loteProy}</strong> se encuentra en estado <strong>${prop.estado}</strong> (Venta Histórica Cerrada).
                  Esta propiedad no posee cobros pendientes ni cuenta corriente activa en curso.
                </div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      if (prop && prop.estado === 'Disponible') {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 40px 20px;">
              <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <i class="fa-solid fa-tree" style="font-size: 3rem; color: var(--accent-green); opacity: 0.85;"></i>
                <div style="color: var(--text-white); font-weight: 600; font-size: 1.15rem;">Propiedad Disponible</div>
                <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 520px; line-height: 1.5;">
                  El lote <strong>${loteProy}</strong> se encuentra <strong>Disponible</strong> para la venta.
                  La Cuenta Corriente se activa automáticamente al registrar una Promesa de Compraventa con financiamiento en cuotas.
                </div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      if (activeNeg) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 40px 20px;">
              <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <i class="fa-solid fa-money-check-dollar" style="font-size: 3rem; color: var(--accent-orange); opacity: 0.8;"></i>
                <div style="color: var(--text-white); font-weight: 600; font-size: 1.1rem;">La Cuenta Corriente no está activa</div>
                <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 500px; line-height: 1.5;">
                  El cliente tiene una negociación en estado de Promesa para el lote <strong>${loteProy}</strong> pero aún no se han generado sus cuotas de financiamiento.
                </div>
                <button class="btn btn-primary" onclick="window.APP5T._showActivarCtaCteModal('${activeNeg.id}')" style="margin-top: 10px; display: flex; align-items: center; gap: 8px; margin-left: auto; margin-right: auto;">
                  <i class="fa-solid fa-bolt"></i> Activar Cuenta Corriente
                </button>
              </div>
            </td>
          </tr>
        `;
        return;
      } else {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding: 30px;">El cliente o lote seleccionado no posee una negociación en Promesa activa para gestionar su Cuenta Corriente.</td></tr>';
        return;
      }
    }

    // Update Summary KPI Cards for Cuenta Corriente
    if (summaryContainer) {
      if (ctas.length === 0) {
        summaryContainer.innerHTML = '';
      } else {
        let totalContrato = 0;
        let totalPie = 0;
        let totalRecaudadoCuotas = 0;
        let totalSaldoPendiente = 0;
        let cantPagadas = 0;
        let cantAbonadas = 0;
        let cantPendientes = 0;
        let cantVencidas = 0;

        if (selectedClientId !== 'all') {
          const targetNegs = selectedLoteId !== 'all'
            ? negs.filter(n => n && String(n.id_cliente) === selectedClientId && String(n.id_propiedad) === selectedLoteId)
            : negs.filter(n => n && String(n.id_cliente) === selectedClientId);
          
          targetNegs.forEach(n => {
            totalContrato += Number(n.valor_final) || 0;
            totalPie += Number(n.pie) || 0;
          });
        }

        let cantAnuladas = 0;
        ctas.forEach(c => {
          const valorCuota = Number(c.valor_cuota) || 0;
          const valorPagado = Number(c.valor_pagado) || 0;
          const isPaid = (c.estado_cuota === 'Pagada' || c.estado_cuota === 'Pagado' || c.estado_cuota === 'Paid' || (valorPagado >= valorCuota && valorCuota > 0));
          const isAbonada = !isPaid && (c.estado_cuota === 'Abonada' || (valorPagado > 0 && valorPagado < valorCuota));
          const isAnulada = String(c.estado_cuota).includes('Anulada');

          totalRecaudadoCuotas += valorPagado;
          if (isAnulada) {
            cantAnuladas++;
          } else if (isPaid) {
            cantPagadas++;
          } else {
            if (isAbonada) cantAbonadas++;
            const pendiente = Math.max(0, valorCuota - valorPagado);
            totalSaldoPendiente += pendiente;

            let isVencida = false;
            // Solo se considera vencida en el resumen si NO está pagada, NO tiene abonos (valorPagado === 0) y su fecha venció
            if (!isAbonada && valorPagado === 0 && c.fecha_vencimiento) {
              let rawDate = c.fecha_vencimiento.includes('T') ? c.fecha_vencimiento.split('T')[0] : c.fecha_vencimiento;
              const p = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
              if (p.length === 3) {
                const dt = p[0].length === 4
                  ? new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10))
                  : new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
                const now = new Date(); now.setHours(0, 0, 0, 0);
                if (dt < now) isVencida = true;
              }
            }
            if (isVencida) cantVencidas++;
            else cantPendientes++;
          }
        });

        const totalRecaudadoGlobal = totalRecaudadoCuotas + totalPie;
        if (totalContrato > 0) {
          // Si el total de contrato está fijado, el saldo pendiente real es el valor total menos lo efectivamente recaudado
          totalSaldoPendiente = Math.max(0, totalContrato - totalRecaudadoGlobal);
        } else {
          totalContrato = totalRecaudadoGlobal + totalSaldoPendiente;
        }

        const cuotasActivasCount = Math.max(0, ctas.length - cantAnuladas);

        summaryContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 20px;">
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); border-radius: 8px; padding: 14px 18px; border-left: 4px solid var(--accent-blue);">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-dim); font-weight: 600; letter-spacing: 0.5px;">Valor Total Contrato</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--text-white); margin-top: 4px;">${APP5T_Utils.formatMoneda(totalContrato)}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${totalPie > 0 ? `Pie: ${APP5T_Utils.formatMoneda(totalPie)}` : `${cuotasActivasCount} cuotas emitidas`}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); border-radius: 8px; padding: 14px 18px; border-left: 4px solid var(--accent-green);">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-dim); font-weight: 600; letter-spacing: 0.5px;">Total Recaudado</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--accent-green); margin-top: 4px;">${APP5T_Utils.formatMoneda(totalRecaudadoGlobal)}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${cantPagadas} cuotas pagadas ${cantAbonadas > 0 ? `+ ${cantAbonadas} con abono ` : ''}${totalPie > 0 ? '+ Pie' : ''}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); border-radius: 8px; padding: 14px 18px; border-left: 4px solid var(--accent-orange);">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-dim); font-weight: 600; letter-spacing: 0.5px;">Saldo Pendiente Total</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--accent-orange); margin-top: 4px;">${APP5T_Utils.formatMoneda(totalSaldoPendiente)}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 2px;">${cantPendientes + cantVencidas + cantAbonadas} cuotas por cobrar / saldar</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); border-radius: 8px; padding: 14px 18px; border-left: 4px solid ${cantVencidas > 0 ? 'var(--accent-red)' : 'var(--accent-purple)'};">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-dim); font-weight: 600; letter-spacing: 0.5px;">Estado de Cuotas</div>
              <div style="font-size: 1.35rem; font-weight: 700; color: var(--text-white); margin-top: 4px;">${cuotasActivasCount} <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-dim);">cuotas activas</span></div>
              <div style="font-size: 0.75rem; color: ${cantVencidas > 0 ? 'var(--accent-red)' : 'var(--text-dim)'}; margin-top: 2px; font-weight: ${cantVencidas > 0 ? '600' : '400'};">
                ${cantVencidas > 0 ? `<i class="fa-solid fa-triangle-exclamation"></i> ${cantVencidas} vencida(s)` : '<i class="fa-solid fa-circle-check" style="color:var(--accent-green);"></i> Al día'}${cantAnuladas > 0 ? ` • ${cantAnuladas} anulada(s)` : ''}
              </div>
            </div>
          </div>
        `;
      }
    }

    if (ctas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding: 30px;">Sin registros de Cuenta Corriente</td></tr>';
      return;
    }

    let htmlRows = '';
    htmlRows += ctas.map(c => {
      if (!c) return '';
      const cli = APP5T_DB.getById('clientes', c.id_cliente);
      const prop = APP5T_DB.getById('propiedades', c.id_propiedad);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      const loteProy = prop ? `${prop.nombre} / ${proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-'}` : `Lote ${c.id_propiedad}`;
      const metodoHtml = c.metodo_pago && c.estado_cuota !== 'Pendiente Pago' ? `<br><small style="color: var(--text-dim); font-size: 0.75rem;"><i class="fa-solid fa-credit-card"></i> ${c.metodo_pago}</small>` : '';

      const valorCuotaNum = Number(c.valor_cuota) || 0;
      const valorPagadoNum = Number(c.valor_pagado) || 0;
      const saldoRemanente = Math.max(0, valorCuotaNum - valorPagadoNum);

      // 1. Respetar Pagada si fue guardada como tal o si cubrió el total pactado
      const isPaid = (c.estado_cuota === 'Pagada' || c.estado_cuota === 'Pagado' || c.estado_cuota === 'Paid' || (valorPagadoNum >= valorCuotaNum && valorCuotaNum > 0));
      // 2. Si hubo pago parcial (>0) y no fue dada por Pagada completa, es Abonada
      const isAbonada = !isPaid && (c.estado_cuota === 'Abonada' || (valorPagadoNum > 0 && valorPagadoNum < valorCuotaNum));
      const isAnulada = String(c.estado_cuota).includes('Anulada');

      let estadoMostrar = c.estado_cuota || 'Pendiente Pago';
      if (isPaid) {
        estadoMostrar = 'Pagada';
      } else if (isAbonada) {
        estadoMostrar = 'Abonada';
      } else if (!isAnulada && c.fecha_vencimiento) {
        // Solo cuotas con $0 pagado pueden quedar marcadas como Vencida
        let rawDate = c.fecha_vencimiento.includes('T') ? c.fecha_vencimiento.split('T')[0] : c.fecha_vencimiento;
        const p = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
        if (p.length === 3) {
          const dt = p[0].length === 4
            ? new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10))
            : new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (dt < now) estadoMostrar = 'Vencida';
        }
      }

      const rowStyle = isPaid ? 'color: var(--text-dim); background-color: rgba(255,255,255,0.02);' : '';
      return `<tr style="${rowStyle}">
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '-'}</td>
        <td>${loteProy}</td>
        <td><strong>#${c.cuota_nro || '-'}</strong></td>
        <td><strong style="color: var(--text-white);">${APP5T_Utils.formatMoneda(valorCuotaNum)}</strong></td>
        <td>${c.fecha_vencimiento || '-'}</td>
        <td>${APP5T_Utils.formatMoneda(valorPagadoNum)}${metodoHtml}</td>
        <td>
          ${getStatusBadgeHTML(estadoMostrar)}
          ${isAbonada && saldoRemanente > 0 ? `<br><small style="color: #38bdf8; font-size: 0.72rem; font-weight: 600; display: inline-block; margin-top: 2px;">Saldo: ${APP5T_Utils.formatMoneda(saldoRemanente)}</small>` : ''}
        </td>
        <td style="text-align:right; white-space:nowrap;">
          ${isPaid ? `
            <button class="btn btn-sm" onclick="window.APP5T._editCuota('${c.id}')" title="Ver detalle o modificar cuota pagada" style="padding: 5px 12px; border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; background: rgba(59, 130, 246, 0.12); border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-file-invoice-dollar"></i> Ver / Editar
            </button>
          ` : isAnulada ? `
            <button class="btn btn-sm" onclick="window.APP5T._editCuota('${c.id}')" title="Ver ficha de cuota anulada" style="padding: 5px 12px; border: 1px solid rgba(148, 163, 184, 0.4); color: #94a3b8; background: rgba(148, 163, 184, 0.1); border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-ban"></i> Ficha Anulada
            </button>
          ` : `
            <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
              <button class="btn btn-sm" onclick="window.APP5T._pagarTotalDirecto('${c.id}')" title="Registrar Pago Total sin abrir formulario" style="padding: 5px 11px; border: 1px solid rgba(16, 185, 129, 0.6); color: #10b981; background: rgba(16, 185, 129, 0.18); border-radius: 6px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-bolt"></i> Pagar Total
              </button>
              <button class="btn btn-sm" onclick="window.APP5T._editCuota('${c.id}')" title="Gestionar cuota, fechas o registrar abono" style="padding: 5px 11px; border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; background: rgba(59, 130, 246, 0.12); border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-credit-card"></i> Gestionar / Pagar
              </button>
            </div>
          `}
        </td>
      </tr>`;
    }).join('');
    tbody.innerHTML = htmlRows;
  }
  window.APP5T_toggleClientCard = function(btn) {
    if (!btn) return;
    const card = btn.closest('.client-card-compact');
    if (!card) return;
    const drawer = card.querySelector('.client-detail-drawer');
    if (!drawer) return;
    const isHidden = drawer.style.display === 'none' || !drawer.style.display;
    drawer.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden
      ? '<i class="fa-solid fa-chevron-up"></i> Ocultar Ficha'
      : '<i class="fa-solid fa-chevron-down"></i> Ver Ficha Completa';
  };

  function _renderLeads() {
    const container = document.getElementById('leads-container');
    if (!container) return;
    const feedbackEl = document.getElementById('leads-search-feedback');
    const searchInput = document.getElementById('leads-search-input');
    const clearBtn = document.getElementById('leads-search-clear');

    // Helper para escapar HTML de forma segura (hoisted al inicio)
    function _safeEscape(str) {
      return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
    }

    const query = (window._leadsSearchQuery !== undefined)
      ? String(window._leadsSearchQuery).trim()
      : (searchInput ? searchInput.value.trim() : '');

    if (clearBtn) {
      clearBtn.style.display = query ? 'block' : 'none';
    }

    const vendedores = APP5T_DB.getAll('vendedores') || [];
    const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : (typeof activeRole !== 'undefined' ? activeRole : 'vendedor');
    const roleNormalized = String(currentRole || activeRole || '').trim().toLowerCase();
    const isManagement = (
      roleNormalized === 'gerente' ||
      roleNormalized === 'gerencia' ||
      roleNormalized === 'administrador' ||
      roleNormalized === 'administracion' ||
      roleNormalized === 'admin'
    );

    const selectVendedor = document.getElementById('leads-filter-vendedor');
    if (selectVendedor) {
      if (isManagement) {
        selectVendedor.style.display = 'block';
        if (selectVendedor.options.length <= 1) {
          let opts = '<option value="all">Todos los Vendedores</option>';
          vendedores.forEach(v => {
            const vId = v.id !== undefined ? v.id : v.id_vendedor;
            opts += `<option value="${vId}">${_safeEscape(v.nombre)}</option>`;
          });
          selectVendedor.innerHTML = opts;
        }
        selectVendedor.value = window._leadsSelectedVendedor || 'all';
      } else {
        selectVendedor.style.display = 'none';
      }
    }

    const subtitleEl = document.querySelector('#panel-leads .card-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = isManagement 
        ? 'Cartera global de clientes y seguimiento comercial' 
        : 'Seguimiento de clientes y prospectos asignados';
    }

    let filterVendedorId = null;
    let vendActivo = null;
    if (isManagement) {
      if (window._leadsSelectedVendedor && window._leadsSelectedVendedor !== 'all') {
        filterVendedorId = window._leadsSelectedVendedor;
        vendActivo = vendedores.find(v => String(v.id !== undefined ? v.id : v.id_vendedor) === String(filterVendedorId));
      }
    } else {
      vendActivo = _resolveActiveVendedor(vendedores);
      filterVendedorId = vendActivo ? (vendActivo.id !== undefined ? vendActivo.id : vendActivo.id_vendedor) : null;
    }
    const idVend = filterVendedorId;

    let clientes = APP5T_DB.getAll('clientes') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const propiedades = APP5T_DB.getAll('propiedades') || [];

    // Clientes que tienen negociaciones o promesas directas con este vendedor (si aplica filtro)
    const clientIdsFromNegs = new Set();
    if (filterVendedorId) {
      negociaciones.forEach(n => {
        const isVendMatch = String(n.id_vendedor) === String(filterVendedorId)
          || (vendActivo && vendActivo.id_vendedor && String(n.id_vendedor) === String(vendActivo.id_vendedor))
          || (vendActivo && String(n.vendedor || '').trim().toLowerCase() === String(vendActivo.nombre || '').trim().toLowerCase());
        if (isVendMatch && n.id_cliente) {
          clientIdsFromNegs.add(String(n.id_cliente));
        }
      });

      propiedades.forEach(p => {
        const isVendMatch = String(p.id_vendedor) === String(filterVendedorId)
          || (vendActivo && vendActivo.id_vendedor && String(p.id_vendedor) === String(vendActivo.id_vendedor));
        if (isVendMatch && p.id_cliente) {
          clientIdsFromNegs.add(String(p.id_cliente));
        }
      });

      clientes = clientes.filter(c => {
        const cId = String(c.id !== undefined && c.id !== null ? c.id : (c.id_cliente !== undefined ? c.id_cliente : ''));
        const isDirectVend = String(c.id_vendedor) === String(filterVendedorId)
          || (vendActivo && vendActivo.id_vendedor && String(c.id_vendedor) === String(vendActivo.id_vendedor))
          || (vendActivo && String(c.vendedor_asignado || c.vendedor || '').trim().toLowerCase() === String(vendActivo.nombre || '').trim().toLowerCase());
        const isNegVend = cId ? clientIdsFromNegs.has(cId) : false;
        return isDirectVend || isNegVend;
      });
    }

    const totalAsignados = clientes.length;

    // Helper para resaltar coincidencias de búsqueda visualmente
    function _highlightMatch(text, q) {
      if (!text || !q) return _safeEscape(text);
      const str = String(text);
      const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return str.split(regex).map((part, i) => {
        if (i % 2 === 1) {
          return `<mark style="background: rgba(245, 158, 11, 0.35); color: #fff; padding: 1px 4px; border-radius: 4px; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.55);">${_safeEscape(part)}</mark>`;
        }
        return _safeEscape(part);
      }).join('');
    }

    // Filtrar clientes si hay un término de búsqueda activo
    let clientesFiltrados = clientes;
    if (query) {
      const qLower = query.toLowerCase();
      const qClean = query.replace(/[^0-9kK]/g, '').toLowerCase();

      clientesFiltrados = clientes.filter(c => {
        const nombres = (c.nombres || '').toLowerCase();
        const apellidos = (c.apellidos || '').toLowerCase();
        const nombreCompleto = `${nombres} ${apellidos}`.trim();
        const rut = String(c.rut || '').toLowerCase();
        const rutClean = rut.replace(/[^0-9kK]/g, '');
        const email = String(c.email || '').toLowerCase();
        const telefono = String(c.telefono || '').replace(/[\s\+]/g, '');

        // Revisar si coincide con el vendedor asignado
        const vId = c.id_vendedor;
        const vendObj = vId ? vendedores.find(v => String(v.id !== undefined ? v.id : v.id_vendedor) === String(vId)) : null;
        const vendNombre = vendObj ? vendObj.nombre.toLowerCase() : String(c.vendedor_asignado || c.vendedor || '').toLowerCase();

        // Revisar si coincide con el lote o proyecto asignado
        const negsCliente = negociaciones.filter(n => String(n.id_cliente) === String(c.id));
        const neg = negsCliente.find(n => idVend && String(n.id_vendedor) === String(idVend)) || negsCliente[0];
        let loteNombre = '';
        let proyNombre = '';
        if (neg) {
          const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
          if (prop) {
            loteNombre = String(prop.nombre || prop.nombre_lote || '').toLowerCase();
            const proy = APP5T_DB.getById('proyectos', prop.id_proyecto);
            if (proy) proyNombre = String(proy.nombre_proyecto || proy.nombre || '').toLowerCase();
          }
        }

        return (
          nombreCompleto.includes(qLower) ||
          (qClean && rutClean.includes(qClean)) ||
          rut.includes(qLower) ||
          email.includes(qLower) ||
          telefono.includes(qLower) ||
          vendNombre.includes(qLower) ||
          loteNombre.includes(qLower) ||
          proyNombre.includes(qLower)
        );
      });
    }

    // Renderizar barra de estado y feedback visual de búsqueda
    if (feedbackEl) {
      if (query) {
        feedbackEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.28); border-radius: 8px; font-size: 0.82rem; color: var(--text-white);">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <i class="fa-solid fa-magnifying-glass" style="color: var(--accent-blue);"></i>
              <span>Mostrando <strong>${clientesFiltrados.length}</strong> de <strong>${totalAsignados}</strong> clientes para la búsqueda:</span>
              <span style="background: rgba(59, 130, 246, 0.35); color: #93c5fa; border: 1px solid rgba(59, 130, 246, 0.5); padding: 2px 10px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                "${_safeEscape(query)}"
              </span>
            </div>
            <button onclick="if(window.APP5T && window.APP5T.clearLeadsSearch) window.APP5T.clearLeadsSearch();" 
                    style="background: transparent; border: none; color: #93c5fa; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='transparent'">
              <i class="fa-solid fa-xmark"></i> Limpiar filtro
            </button>
          </div>
        `;
      } else {
        feedbackEl.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-dim); padding: 4px 2px;">
            <span><i class="fa-solid fa-users" style="color: var(--accent-blue); margin-right: 6px;"></i> Total: <strong>${totalAsignados}</strong> clientes asignados</span>
          </div>
        `;
      }
    }

    if (totalAsignados === 0) { 
      container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-dim);"><i class="fa-solid fa-users-slash" style="font-size: 1.8rem; margin-bottom: 8px; display: block;"></i>Sin clientes asignados</div>'; 
      return; 
    }

    if (clientesFiltrados.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--glass-border); border-radius: 12px;">
          <i class="fa-solid fa-user-xmark" style="font-size: 2.2rem; color: var(--accent-orange); margin-bottom: 12px; display: block;"></i>
          <h4 style="color: var(--text-white); margin-bottom: 6px; font-weight: 600;">No se encontraron clientes</h4>
          <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 16px;">Ningún cliente coincide con la búsqueda "<strong>${_safeEscape(query)}</strong>"</p>
          <button class="btn btn-sm btn-outline-primary" onclick="if(window.APP5T && window.APP5T.clearLeadsSearch) window.APP5T.clearLeadsSearch();" style="display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-rotate-left"></i> Restablecer búsqueda
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = clientesFiltrados.map(c => {
      const nombres = (c.nombres || '').trim();
      const apellidos = (c.apellidos || '').trim();
      const nombreCompleto = `${nombres} ${apellidos}`.trim() || 'Cliente Sin Nombre';
      const initial = (nombres ? nombres[0] : (apellidos ? apellidos[0] : 'C')).toUpperCase();

      const rutFmt = c.rut ? (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatRUT ? APP5T_Utils.formatRUT(c.rut) : c.rut) : '—';
      const telefono = c.telefono ? String(c.telefono).trim() : '—';
      let waNum = telefono !== '—' ? telefono.replace(/[\s\+]/g, '') : '';
      if (waNum && (waNum.length === 9 || waNum.length === 8)) waNum = '56' + waNum;
      const waLink = waNum ? `https://wa.me/${waNum}` : '';
      const emailObj = c.email ? String(c.email).trim() : '—';

      const direccion = c.direccion ? (c.comuna ? `${c.direccion}, ${c.comuna}` : c.direccion) : (c.comuna || '—');
      const profesion = c.profesion || '—';
      let estadoCivil = c.estado_civil || '—';
      if (c.regimen_matrimonial && estadoCivil === 'Casado') {
        estadoCivil += ` (${c.regimen_matrimonial})`;
      }

      // Buscar negociaciones asociadas (priorizando las de este vendedor)
      const negsCliente = negociaciones.filter(n => String(n.id_cliente) === String(c.id));
      const neg = negsCliente.find(n => idVend && String(n.id_vendedor) === String(idVend)) || negsCliente[0];

      let loteInfoHtml = '<span style="color:var(--text-dim); font-style:italic;">Sin lote asignado</span>';
      let resumenFinancieroHtml = '';
      let docsListHtml = '';
      let propId = null;
      let loteNombreClean = '';
      let proyNombreClean = '';

      if (neg) {
        propId = neg.id_propiedad;
        const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
        if (prop) {
          loteNombreClean = prop.nombre || prop.nombre_lote || '';
          const proy = APP5T_DB.getById('proyectos', prop.id_proyecto);
          proyNombreClean = proy ? (proy.nombre_proyecto || proy.nombre || '') : '';
          const rolStr = prop.rol ? ` | ROL: ${_safeEscape(prop.rol)}` : '';
          const loteNomDisplay = query ? _highlightMatch(loteNombreClean, query) : _safeEscape(loteNombreClean);
          const proyNomDisplay = query ? _highlightMatch(proyNombreClean, query) : _safeEscape(proyNombreClean);
          loteInfoHtml = `<strong style="color:var(--accent-blue); font-weight:700;">${loteNomDisplay}</strong> <span style="color:var(--text-dim);">(${proyNomDisplay}${rolStr})</span>`;
        } else {
          loteInfoHtml = `<strong style="color:var(--accent-blue);">Lote ID ${_safeEscape(neg.id_propiedad)}</strong>`;
        }

        const formatM = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda : (v => '$' + v);
        const precioVenta = formatM(neg.valor_final || 0);
        const pieVal = neg.pie ? formatM(neg.pie) : '$ 0';
        const cuotasVal = neg.cantidad_cuotas ? `${neg.cantidad_cuotas} cuotas` : 'Sin cuotas';
        resumenFinancieroHtml = `
          <div style="display: flex; justify-content: space-between; font-size: 0.74rem; border-top: 1px dashed var(--glass-border); padding-top: 4px; margin-top: 4px;">
            <span><span style="color:var(--text-dim);">Precio:</span> <strong style="color:var(--accent-green);">${precioVenta}</strong></span>
            <span><span style="color:var(--text-dim);">Pie/Cuotas:</span> <strong style="color:var(--text-white);">${pieVal} (${cuotasVal})</strong></span>
          </div>
        `;

        const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(neg.id_propiedad)) : []) || [];
        if (neg.url || docs.length > 0) {
          let docsLinks = [];
          if (neg.url) {
            docsLinks.push(`<a href="${neg.url}" target="_blank" style="color:var(--text-white); text-decoration:none; font-size:0.68rem; display:inline-flex; align-items:center; gap:3px; border:1px solid var(--glass-border); border-radius:4px; padding:2px 5px; background:rgba(255,255,255,0.06);"><i class="fa-solid fa-receipt" style="color:var(--accent-green);"></i> Recibo</a>`);
          }
          docs.forEach(d => {
            let icon = 'fa-file-pdf';
            let color = 'var(--accent-blue)';
            if (d.tipo_documento === 'Contrato') { icon = 'fa-file-signature'; color = 'var(--accent-purple)'; }
            else if (d.tipo_documento === 'Escritura') { icon = 'fa-gavel'; color = 'var(--accent-red)'; }
            else if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
            else if (d.tipo_documento === 'Carpeta') { icon = 'fa-folder-open'; color = 'var(--accent-orange)'; }

            docsLinks.push(`<a href="${d.url_drive}" target="_blank" style="color:${color}; text-decoration:none; font-size:0.68rem; display:inline-flex; align-items:center; gap:3px; border:1px solid ${color}44; border-radius:4px; padding:2px 5px; background:${color}15;"><i class="fa-solid ${icon}"></i> ${_safeEscape(d.nombre)}</a>`);
          });

          docsListHtml = `
            <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; border-top: 1px dashed var(--glass-border); padding-top: 4px;">
              <span style="font-size:0.68rem; text-transform:uppercase; color:var(--text-dim); font-weight:700;"><i class="fa-solid fa-folder-open" style="color:var(--accent-blue);"></i> Docs:</span>
              ${docsLinks.join('')}
            </div>
          `;
        }
      }

      const ingreso = c.fecha_ingreso ? (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatFecha ? APP5T_Utils.formatFecha(c.fecha_ingreso) : c.fecha_ingreso) : '—';
      const canal = c.canal_captacion || 'Directo';

      // Resaltado de nombres y RUT al buscar
      const nombreDisplay = query ? _highlightMatch(nombreCompleto, query) : _safeEscape(nombreCompleto);
      const rutDisplay = query ? _highlightMatch(rutFmt, query) : _safeEscape(rutFmt);

      // Si el cliente fue vinculado a través de una negociación/promesa
      const isLinkedByNeg = clientIdsFromNegs.has(String(c.id)) && String(c.id_vendedor) !== String(idVend);
      const vinculacionBadge = isLinkedByNeg 
        ? `<span class="tag" style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;" title="Cliente vinculado por negociación o promesa"><i class="fa-solid fa-file-contract"></i> Con Venta</span>`
        : '';

      let vendedorBadgeHtml = '';
      if (isManagement) {
        const vId = c.id_vendedor || (neg ? neg.id_vendedor : null);
        const vendObj = vId ? vendedores.find(v => String(v.id !== undefined ? v.id : v.id_vendedor) === String(vId)) : null;
        const vendNombre = vendObj ? vendObj.nombre : (c.vendedor_asignado || c.vendedor || 'Sin vendedor');
        vendedorBadgeHtml = `<span class="tag" style="background: rgba(147, 51, 234, 0.15); color: #c084fc; border: 1px solid rgba(147, 51, 234, 0.3); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;" title="Vendedor asignado"><i class="fa-solid fa-user-tie"></i> ${_safeEscape(vendNombre)}</span>`;
      }

      const cardSearchStyle = query ? 'border-color: rgba(59, 130, 246, 0.45); box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);' : '';

      return `
        <div class="client-card-compact" style="${cardSearchStyle}">
          
          <!-- ENCABEZADO COMPACTO CON BOTONES ACCIÓN INLINE -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-blue), #1e40af); color: #ffffff; font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${initial}
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <h4 style="margin: 0; color: var(--text-white); font-size: 0.9rem; font-weight: 700; word-break: break-word; line-height: 1.2;">${nombreDisplay}</h4>
                  <span style="flex-shrink: 0;">${getStatusBadgeHTML(c.estado_cliente)}</span>
                  ${vinculacionBadge}
                  ${vendedorBadgeHtml}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 2px;">
                  <i class="fa-solid fa-id-card" style="color: var(--accent-blue); margin-right: 3px;"></i>${rutDisplay}
                </div>
              </div>
            </div>

            <!-- BOTONES RÁPIDOS DE CONTACTO (MICRO ICONOS) -->
            <div style="display: flex; gap: 5px; flex-shrink: 0;">
              ${telefono !== '—' ? `<a href="tel:${telefono}" class="circle-btn circle-btn-call" style="width: 28px; height: 28px; font-size: 0.75rem;" title="Llamar"><i class="fa-solid fa-phone"></i></a>` : ''}
              ${waLink ? `<a href="${waLink}" target="_blank" class="circle-btn circle-btn-wa" style="width: 28px; height: 28px; font-size: 0.8rem;" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
              ${emailObj !== '—' ? `<a href="mailto:${emailObj}" class="circle-btn circle-btn-email" style="width: 28px; height: 28px; font-size: 0.75rem;" title="Correo"><i class="fa-regular fa-envelope"></i></a>` : ''}
            </div>
          </div>

          <!-- RESUMEN DE PROPIEDAD ASOCIADA -->
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--glass-border); font-size: 0.75rem; word-break: break-word;">
            <i class="fa-solid fa-key" style="color: var(--accent-green); margin-right: 4px;"></i>${loteInfoHtml}
          </div>

          <!-- TOGGLE EXPANDIR FICHA COMPLETA -->
          <div style="margin-top: 4px; text-align: right;">
            <button type="button" onclick="window.APP5T_toggleClientCard(this)" style="background: transparent; border: none; color: var(--accent-blue); font-size: 0.72rem; font-weight: 600; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-chevron-down"></i> Ver Ficha Completa
            </button>
          </div>

          <!-- DRAWER CON DETALLES COMPLETOS (DESPLEGABLE) -->
          <div class="client-detail-drawer" style="display: none; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--glass-border); font-size: 0.75rem;">
            <div class="client-detail-drawer-box" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px;">
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-phone" style="color:var(--accent-blue);"></i> Teléfono:</span> <strong style="color: var(--text-white);">${telefono}</strong></div>
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-envelope" style="color:var(--accent-blue);"></i> Email:</span> <strong style="color: var(--text-white); word-break: break-all;">${emailObj}</strong></div>
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-location-dot" style="color:var(--accent-orange);"></i> Dirección:</span> <strong style="color: var(--text-white);">${direccion}</strong></div>
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-briefcase" style="color:var(--accent-purple);"></i> Profesión:</span> <strong style="color: var(--text-white);">${profesion}</strong></div>
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-heart" style="color:var(--accent-pink, #e84393);"></i> Est. Civil:</span> <strong style="color: var(--text-white);">${estadoCivil}</strong></div>
              <div><span style="color: var(--text-dim);"><i class="fa-solid fa-calendar-day"></i> Registrado:</span> <strong style="color: var(--text-white);">${ingreso} (${canal})</strong></div>
            </div>
            ${resumenFinancieroHtml}
            ${docsListHtml}
          </div>

        </div>
      `;
    }).join('');
  }

    /* =====================================================================
     CATÁLOGO DOCUMENTAL (CHECKLIST)
     ===================================================================== */
  function _renderCatalogoDocumentos() {
    const tbody = document.getElementById('tbody-catalogo-documentos');
    if (!tbody) return;

    let props = APP5T_DB.getAll('propiedades') || [];
    // Filtrar solo las que tengan algún proceso de venta activo o cerrado
    props = props.filter(p => ['Promesada', 'Venta_Directa', 'Vendida', 'Escriturada', 'Reservada'].includes(p.estado));

    // Populate filter
    let currentVal = 'all';
    const selectProyecto = document.getElementById('filtro-catalogo-proyecto');
    if (selectProyecto) {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      currentVal = selectProyecto.value || 'all';
      
      if (selectProyecto.options.length <= 1) {
        let optionsHtml = '<option value="all">Todos los proyectos</option>';
        proyectos.forEach(p => {
          optionsHtml += `<option value="${p.id}">${p.nombre_proyecto || p.nombre}</option>`;
        });
        selectProyecto.innerHTML = optionsHtml;
        selectProyecto.value = currentVal;
      }
      
      if (currentVal !== 'all') {
        props = props.filter(p => String(p.id_proyecto) === String(currentVal));
        if (document.getElementById('th-catalogo-proyecto')) document.getElementById('th-catalogo-proyecto').style.display = 'none';
      } else {
        if (document.getElementById('th-catalogo-proyecto')) document.getElementById('th-catalogo-proyecto').style.display = '';
      }
    }

    // Text search filter
    const searchInput = document.getElementById('filtro-catalogo-search');
    const catQuery = (searchInput && searchInput.value) ? searchInput.value.trim().toLowerCase() : '';
    if (catQuery) {
      const qClean = catQuery.replace(/[^0-9kK]/g, '');
      props = props.filter(p => {
        const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        const proyNom = (proy ? (proy.nombre_proyecto || proy.nombre || '') : '').toLowerCase();
        const loteNom = (p.nombre || p.nombre_lote || '').toLowerCase();
        let cliNom = '';
        let cliRut = '';
        if (p.id_cliente) {
          const c = APP5T_DB.getById('clientes', p.id_cliente);
          if (c) {
            cliNom = `${c.nombres || ''} ${c.apellidos || ''}`.trim().toLowerCase();
            cliRut = (c.rut || '').toLowerCase();
          }
        } else {
          const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
          if (negs.length > 0) {
            const c = APP5T_DB.getById('clientes', negs[0].id_cliente);
            if (c) {
              cliNom = `${c.nombres || ''} ${c.apellidos || ''}`.trim().toLowerCase();
              cliRut = (c.rut || '').toLowerCase();
            }
          }
        }
        return loteNom.includes(catQuery)
          || proyNom.includes(catQuery)
          || cliNom.includes(catQuery)
          || (qClean && cliRut.replace(/[^0-9kK]/g, '').includes(qClean))
          || (p.estado || '').toLowerCase().includes(catQuery);
      });
    }
    
    // Sort by Lote natural sort
    props.sort((a, b) => {
      const nameA = a.nombre || a.nombre_lote || '';
      const nameB = b.nombre || b.nombre_lote || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (props.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No hay lotes en proceso de venta para documentar.</td></tr>';
      return;
    }

    const docTypes = ['Cédula/RUT', 'Comprobantes', 'Reserva', 'Promesa', 'Escritura'];
    
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '-';
      const clienteId = p.id_cliente; // Assuming the property might have id_cliente or we fetch from negociaciones
      
      // Intentar obtener cliente desde negociaciones si la propiedad no lo tiene directo
      let clienteNombre = '-';
      if (clienteId) {
        const c = APP5T_DB.getById('clientes', clienteId);
        if (c) clienteNombre = (c.nombres ? c.nombres + ' ' + (c.apellidos || '') : '-');
      } else {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(p.id)) || [];
        if (negs.length > 0) {
          const neg = negs[0];
          const c = APP5T_DB.getById('clientes', neg.id_cliente);
          if (c) clienteNombre = (c.nombres ? c.nombres + ' ' + (c.apellidos || '') : '-');
        }
      }

      const docs = APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(p.id)) || [];
      const folderLink = p.url || '';

      // Determinar qué documentos obligatorios debe tener según estado
      let requiredCount = 0;
      if (p.estado === 'Reservada') requiredCount = 2; // Reserva + Cedula
      else if (p.estado === 'Promesada' || p.estado === 'Venta_Directa') requiredCount = 4; // + Promesa + Comprobante
      else if (p.estado === 'Vendida' || p.estado === 'Escriturada') requiredCount = 5; // + Escritura
      
      

      return `
        <tr>
          <td data-label="Lote"><strong>${p.nombre || p.nombre_lote}</strong></td>
          <td data-label="Proyecto">${proyectoNombre}</td>
          <td data-label="Cliente">${clienteNombre}</td>
          <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>

          <td data-label="Enlace Drive">
            <div style="display:flex; gap: 5px; justify-content: flex-end;">
              <input type="text" class="form-control form-control-sm" placeholder="https://drive.google.com/..." 
                     value="${folderLink}" id="drive-link-${p.id}" style="font-size: 0.7rem; width: 100px; padding: 0.2rem;">
              <button class="btn btn-sm btn-outline-primary" title="Guardar Enlace"
                      onclick="window.APP5T.saveDriveFolderLink('${p.id}')">
                <i class="fa-solid fa-save"></i>
              </button>
              ${folderLink ? `<a href="${folderLink}" target="_blank" class="btn btn-sm btn-outline-success" title="Abrir Carpeta"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
            </div>
          </td>
          
        </tr>
      `;
    }).join('');
  }

  // --- Helpers for Catálogo Documental ---
  window.APP5T = window.APP5T || {};
  window.APP5T.filterCatalogo = function() {
    _renderCatalogoDocumentos();
  };
  window.APP5T.toggleDocumentCheck = function(id_propiedad, tipo_documento, isChecked) {
    let docs = APP5T_DB.getAll('documentos') || [];
    let docIndex = docs.findIndex(d => String(d.id_propiedad) === String(id_propiedad) && d.tipo_documento === tipo_documento);
    
    if (isChecked) {
      if (docIndex === -1) {
        // Insert
        APP5T_DB.insert('documentos', {
          id_propiedad: String(id_propiedad),
          tipo_documento: tipo_documento,
          estado: 'Verificado',
          fecha_carga: new Date().toISOString()
        });
      }
    } else {
      if (docIndex !== -1) {
        // Remove
        APP5T_DB.remove('documentos', docs[docIndex].id);
      }
    }
    _renderCatalogoDocumentos();
    // Silently trigger cloud sync
    if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
  };

  window.APP5T.saveDriveFolderLink = function(id_propiedad) {
    const input = document.getElementById('drive-link-' + id_propiedad);
    if (!input) return;
    const link = input.value.trim();
    
    // Guardar directamente en propiedades.url (sincroniza con Supabase)
    const result = APP5T_DB.update('propiedades', parseInt(id_propiedad, 10), { url: link });
    
    if (result && result.success) {
      APP5T_Utils.showToast('Enlace de Drive guardado correctamente', 'success');
    } else {
      APP5T_Utils.showToast('Error al guardar el enlace', 'error');
    }
    
    _renderCatalogoDocumentos();
    if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
  };


  // ── GESTIÓN DE EXPEDIENTES GOOGLE DRIVE DESDE INVENTARIO ────────────────
  window.APP5T = window.APP5T || {};

  window.APP5T.openDriveConfigModal = function(id_propiedad) {
    const prop = APP5T_DB.getById('propiedades', parseInt(id_propiedad, 10)) || APP5T_DB.getById('propiedades', String(id_propiedad));
    if (!prop) {
      if (window.APP5T_Utils) APP5T_Utils.showToast('No se encontró la propiedad', 'error');
      return;
    }
    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const currentUrl = prop.url || '';
    const loteNom = prop.nombre || prop.nombre_lote || ('ID ' + prop.id);

    const html = `
      <div style="padding: 6px 0;">
        <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="color: #ffffff; font-size: 1.05rem;">Lote ${loteNom}</strong>
              <span style="color: var(--text-dim); font-size: 0.85rem; margin-left: 8px;">· ${proyNom}</span>
            </div>
            <div>${getStatusBadgeHTML(prop.estado)}</div>
          </div>
          <div style="margin-top: 8px; font-size: 0.78rem; color: var(--text-dim); display: flex; gap: 16px; flex-wrap: wrap;">
            <span><strong>Rol SII:</strong> ${prop.rol || 'En Trámite'}</span>
            <span><strong>Superficie:</strong> ${(typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(prop.superficie) : (prop.superficie || '-')}</span>
            <span><strong>Valor:</strong> ${APP5T_Utils.formatMoneda(prop.valor_final || 0)}</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #ffffff; margin-bottom: 6px;">
            <i class="fa-brands fa-google-drive" style="color: #f59e0b; margin-right: 5px;"></i> Enlace a la Carpeta de Drive (Expediente Digital):
          </label>
          <div style="display: flex; gap: 8px;">
            <input type="url" id="modal-drive-url-input" class="form-control" 
                   placeholder="https://drive.google.com/drive/folders/..." 
                   value="${currentUrl}" style="flex: 1; font-size: 0.85rem;">
            ${currentUrl ? `
              <a href="${currentUrl}" target="_blank" class="btn btn-outline-success" style="display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; padding: 6px 12px; font-size: 0.8rem;" title="Abrir carpeta actual">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Probar
              </a>
            ` : ''}
          </div>
          <small class="text-muted" style="display: block; margin-top: 6px; font-size: 0.74rem;">
            Pega el enlace compartido de Google Drive con acceso para la administración y vendedores.
          </small>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--glass-border);">
          <div>
            ${currentUrl ? `
              <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.APP5T.saveDriveConfig('${prop.id}', '')" style="font-size: 0.75rem;">
                <i class="fa-solid fa-trash"></i> Desvincular Carpeta
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.APP5T.closeModal(true)">Cancelar</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.APP5T.saveDriveConfig('${prop.id}')" style="display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-save"></i> Guardar Enlace
            </button>
          </div>
        </div>
      </div>
    `;

    openModal(`Expediente Digital Drive — Lote ${loteNom}`, html);
  };

  window.APP5T.saveDriveConfig = function(id_propiedad, forcedVal) {
    let url = '';
    if (forcedVal !== undefined) {
      url = forcedVal;
    } else {
      const input = document.getElementById('modal-drive-url-input');
      url = input ? input.value.trim() : '';
    }
    const result = APP5T_DB.update('propiedades', parseInt(id_propiedad, 10), { url: url });
    if (result && result.success) {
      APP5T_Utils.showToast(url ? 'Carpeta de Drive vinculada exitosamente' : 'Carpeta de Drive desvinculada', 'success');
      closeModal(true);
      _renderInventario();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    } else {
      APP5T_Utils.showToast('Error al actualizar el enlace', 'error');
    }
  };

  window.APP5T.openDriveBatchModal = function() {
    const filter = document.getElementById('inv-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    let filterProyNom = 'Todos los Proyectos';
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => String(p.id_proyecto) === String(proy.id));
        filterProyNom = proy.nombre_proyecto || proy.nombre;
      }
    }

    props.sort((a, b) => {
      const nameA = a.nombre || a.nombre_lote || '';
      const nameB = b.nombre || b.nombre_lote || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const rowsHtml = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const pNom = proy ? proy.nombre_proyecto : '-';
      const loteNom = p.nombre || p.nombre_lote || ('Lote ' + p.id);
      const url = p.url || '';

      return `
        <tr id="drive-batch-row-${p.id}">
          <td style="white-space:nowrap;"><strong>${loteNom}</strong></td>
          <td style="white-space:nowrap; font-size:0.75rem; color:var(--text-dim);">${pNom}</td>
          <td>${getStatusBadgeHTML(p.estado)}</td>
          <td>
            <div style="display:flex; gap:6px; align-items:center;">
              <input type="url" id="batch-drive-${p.id}" class="form-control form-control-sm batch-drive-input" data-id="${p.id}"
                     placeholder="https://drive.google.com/..." value="${url}" style="font-size:0.75rem; height:28px;">
              ${url ? `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-success" style="padding:2px 7px; font-size:0.75rem;" title="Abrir Carpeta"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.APP5T.saveSingleBatchDrive('${p.id}')" style="padding:2px 7px; font-size:0.75rem;" title="Guardar este lote">
                <i class="fa-solid fa-save"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="padding: 6px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
          <div>
            <span style="font-size:0.85rem; color:var(--text-dim);">Proyecto: <strong>${filterProyNom}</strong> (${props.length} lotes)</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-outline-info btn-sm" onclick="window.APP5T.toggleDriveBulkPasteArea()" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-paste"></i> Pegar Enlaces Masivos
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.APP5T.saveAllBatchDrive()" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-floppy-disk"></i> Guardar Todos los Enlaces
            </button>
          </div>
        </div>
        <div id="drive-bulk-paste-box" style="display:none; margin: 10px 0 16px 0; padding: 12px; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 8px;">
          <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:8px;">
            Pega aquí los enlaces de Google Drive (uno por línea o tabulado con el número de lote). 
            Ejemplo: <code>1 [TAB] https://drive.google.com/drive/folders/...</code> o simplemente la lista de URLs en orden.
          </p>
          <textarea id="drive-bulk-paste-text" class="form-control" rows="4" placeholder="1	https://drive.google.com/drive/folders/...
2	https://..." style="font-size:0.75rem; width:100%; box-sizing:border-box; margin-bottom:8px;"></textarea>
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.APP5T.toggleDriveBulkPasteArea()">Cancelar</button>
            <button type="button" class="btn btn-sm btn-primary" onclick="window.APP5T.applyDriveBulkPaste()">
              <i class="fa-solid fa-check"></i> Aplicar a la Lista
            </button>
          </div>
        </div>
        <div class="table-responsive" style="max-height: 480px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 6px;">
          <table class="premium-table" style="font-size: 0.8rem;">
            <thead>
              <tr style="position: sticky; top: 0; background: #0c1a29; z-index: 2;">
                <th style="width: 15%;">Lote</th>
                <th style="width: 20%;">Proyecto</th>
                <th style="width: 15%;">Estado</th>
                <th style="width: 50%;">Enlace Carpeta Drive</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.APP5T.closeModal(true)">Cerrar</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.APP5T.saveAllBatchDrive()">
            <i class="fa-solid fa-check"></i> Guardar Todos
          </button>
        </div>
      </div>
    `;

    openModal(`Gestión de Carpetas Drive — ${filterProyNom}`, html);
    const card = document.querySelector('#action-modal .modal-card');
    if (card) card.classList.add('modal-card-wide');
  };

  window.APP5T.saveSingleBatchDrive = function(id_propiedad) {
    const input = document.getElementById('batch-drive-' + id_propiedad);
    if (!input) return;
    const url = input.value.trim();
    const res = APP5T_DB.update('propiedades', parseInt(id_propiedad, 10), { url: url });
    if (res && res.success) {
      APP5T_Utils.showToast('Enlace guardado para el lote', 'success');
      _renderInventario();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    } else {
      APP5T_Utils.showToast('Error al guardar', 'error');
    }
  };

  
  window.APP5T.toggleDriveBulkPasteArea = function() {
    const box = document.getElementById('drive-bulk-paste-box');
    if (box) box.style.display = (box.style.display === 'none') ? 'block' : 'none';
  };

  window.APP5T.applyDriveBulkPaste = function() {
    const textEl = document.getElementById('drive-bulk-paste-text');
    if (!textEl || !textEl.value.trim()) return;
    const lines = textEl.value.split('\n').map(l => l.trim()).filter(Boolean);
    const inputs = document.querySelectorAll('.batch-drive-input');
    const hasPairs = lines.some(l => l.includes('\t') || l.includes(',') || l.includes(';'));
    let matched = 0;

    if (hasPairs) {
      lines.forEach(line => {
        const parts = line.split(/[\t,;]+/).map(p => p.trim());
        if (parts.length >= 2) {
          const rawLote = parts[0].toLowerCase().replace(/[^0-9a-z]/g, '');
          const url = parts.slice(1).find(p => p.startsWith('http')) || parts[1];
          inputs.forEach(inp => {
            const row = inp.closest('tr');
            const loteCell = row ? (row.querySelector('strong') ? row.querySelector('strong').textContent.toLowerCase().replace(/[^0-9a-z]/g, '') : '') : '';
            if (loteCell === rawLote) {
              inp.value = url;
              matched++;
            }
          });
        }
      });
    } else {
      lines.forEach((url, idx) => {
        if (idx < inputs.length && url.startsWith('http')) {
          inputs[idx].value = url;
          matched++;
        }
      });
    }
    APP5T_Utils.showToast(`Se asignaron ${matched} enlaces en la lista. Haz clic en "Guardar Todos" para confirmar.`, 'info');
    window.APP5T.toggleDriveBulkPasteArea();
  };

  window.APP5T.saveAllBatchDrive = function() {
    const inputs = document.querySelectorAll('.batch-drive-input');
    let updated = 0;
    inputs.forEach(inp => {
      const id = inp.dataset.id;
      const url = inp.value.trim();
      const p = APP5T_DB.getById('propiedades', parseInt(id, 10));
      if (p && (p.url || '') !== url) {
        APP5T_DB.update('propiedades', parseInt(id, 10), { url: url });
        updated++;
      }
    });
    APP5T_Utils.showToast(`Se actualizaron ${updated} carpetas de Drive`, 'success');
    closeModal(true);
    _renderInventario();
    if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
  };

function _renderInventario() {
    const tbody = document.getElementById('tbody-inventario');
    if (!tbody) return;

    const headerActions = document.getElementById('inv-header-actions');
    const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : activeRole;
    if (headerActions) {
      if (currentRole === 'administrador') {
        headerActions.innerHTML = `
          <a href="https://drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I?usp=drive_link" target="_blank" class="btn btn-sm btn-outline-success" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.78rem; text-decoration: none;" title="Abrir carpeta 02_PROYECTOS en Google Drive">
            <i class="fa-brands fa-google-drive"></i> Abrir 02_PROYECTOS
          </a>
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.APP5T.openDriveBatchModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.78rem;" title="Gestionar y vincular carpetas Drive de los lotes">
            <i class="fa-solid fa-folder-tree"></i> Vincular Lotes Drive
          </button>
        `;
      } else {
        headerActions.innerHTML = `
          <a href="https://drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I?usp=drive_link" target="_blank" class="btn btn-sm btn-outline-success" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.78rem; text-decoration: none;" title="Abrir carpeta 02_PROYECTOS en Google Drive">
            <i class="fa-brands fa-google-drive"></i> Repositorio Drive
          </a>
        `;
      }
    }

    const filter = document.getElementById('inv-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => String(p.id_proyecto) === String(proy.id));
      }
    }

    // --- Resumen como Tarjetas Flexbox Responsivas ---
    const resumenDiv = document.getElementById('inventario-resumen-tabla');
    if (resumenDiv) {
      const counts = {};
      let valTotal = 0;
      props.forEach(p => {
        const st = p.estado || 'Sin Estado';
        counts[st] = (counts[st] || 0) + 1;
        if (p.valor_final) valTotal += Number(p.valor_final) || 0;
      });
      const colorMap = {
        'Disponible': '#10b981', 'Pendiente': '#f59e0b', 'Reservada': '#3b82f6',
        'Promesada': '#6366f1', 'Venta_Directa': '#8b5cf6', 'Vendida': '#ec4899', 'Bloqueado': '#6b7280',
        'Escriturada': '#14b8a6'
      };

      let summaryHtml = `
        <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 12px; background: rgba(10, 26, 40, 0.5); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(12px);">
          <div style="flex: 1 1 100px; min-width: 90px; padding: 10px 8px; background: rgba(3, 17, 26, 0.5); border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 8px; text-align: center;">
            <span style="font-size: 0.68rem; color: var(--text-dim); display: block; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Total Lotes</span>
            <strong style="font-size: 1.15rem; color: #ffffff; font-weight: 800; display: block; margin-top: 3px;">${props.length}</strong>
          </div>
      `;
      
      Object.keys(colorMap).forEach(st => {
        if (counts[st]) {
          summaryHtml += `
            <div style="flex: 1 1 100px; min-width: 90px; padding: 10px 8px; background: rgba(3, 17, 26, 0.5); border: 1px solid rgba(0, 229, 255, 0.15); border-radius: 8px; text-align: center;">
              <span style="font-size: 0.68rem; color: var(--text-dim); display: block; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">${st.replace('_', ' ')}</span>
              <strong style="font-size: 1.15rem; color: ${colorMap[st]}; font-weight: 800; display: block; margin-top: 3px;">${counts[st]}</strong>
            </div>
          `;
        }
      });
      
      summaryHtml += `
          <div style="flex: 2 1 180px; min-width: 140px; padding: 10px 12px; background: rgba(243, 156, 18, 0.08); border: 1px solid rgba(243, 156, 18, 0.25); border-radius: 8px; text-align: center;">
            <span style="font-size: 0.68rem; color: var(--accent-orange); display: block; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Valor Inventario</span>
            <strong style="font-size: 1.15rem; color: var(--accent-orange); font-weight: 800; display: block; margin-top: 3px;">${APP5T_Utils.formatMoneda(valTotal)}</strong>
          </div>
        </div>
      `;
      resumenDiv.innerHTML = summaryHtml;
    }

    // --- Filtro por Estado (dropdown) ---
    const estadoSel = document.getElementById('inv-filter-estado');
    if (estadoSel) {
      const selVal = estadoSel.value;
      if (selVal && selVal !== 'all') {
        props = props.filter(p => p.estado === selVal);
      }
      if (!estadoSel.dataset.listenerAttached) {
        estadoSel.addEventListener('change', () => _renderInventario());
        estadoSel.dataset.listenerAttached = 'true';
      }
    }

    const mobileListDiv = document.getElementById('inventario-mobile-list');

    if (props.length === 0) { 
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin propiedades</td></tr>'; 
      if (mobileListDiv) {
        mobileListDiv.innerHTML = '<div class="text-center text-muted" style="padding: 20px; font-size: 0.85rem;">Sin propiedades</div>';
      }
      return; 
    }

    // Sort by Lote (natural sort)
    props.sort((a, b) => {
      const nameA = a.nombre || a.nombre_lote || '';
      const nameB = b.nombre || b.nombre_lote || '';
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // PC Table rendering
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '-';

      // Quick action buttons for admins
      let adminActionsHtml = '';
      const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : activeRole;
      if (currentRole === 'administrador' || currentRole === 'gerente') {
        let driveUrl = (p.url && p.url.trim() !== '' && !p.url.includes('/search?q=')) ? p.url : '';
        if (!driveUrl && window.APP5T_DRIVE_CATALOG) {
          driveUrl = window.APP5T_DRIVE_CATALOG.getFolderForLote(p.id_proyecto, p.nombre || p.id);
        }
        if (!driveUrl) {
          driveUrl = 'https://drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I';
        }

        adminActionsHtml = `
          <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
            <a href="${driveUrl}" target="_blank" class="btn btn-sm btn-outline" 
               style="padding: 3px 8px; font-size: 0.7rem; border-color: var(--accent-green); color: var(--accent-green); text-decoration: none;" 
               title="Abrir Carpeta de este Lote en Google Drive">
              <i class="fa-solid fa-folder-open"></i> Docs
            </a>
            ${currentRole === 'administrador' ? `
              <button type="button" class="btn btn-sm btn-outline" onclick="APP5T_Forms._editRecord('propiedades', '${p.id}')" style="padding: 3px 8px; font-size: 0.7rem; border-color: var(--accent-blue); color: var(--accent-blue);" title="Editar Lote">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
            ` : ''}
          </div>
        `;
      } else {
        adminActionsHtml = '<span class="text-muted" style="font-size:0.75rem;">-</span>';
      }

      return `<tr>
        <td data-label="Lote" style="text-align: center; font-weight: 700;">${p.nombre || p.id}</td>
        <td data-label="Proyecto" style="text-align: left;">${proyectoNombre}</td>
        <td data-label="Superficie" style="text-align: right; padding-right: 18px;">${(typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(p.superficie) : (p.superficie || '-')}</td>
        <td data-label="Precio" style="text-align: right; font-weight: 600; padding-right: 18px;">${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td data-label="Estado" style="text-align: center;">${getStatusBadgeHTML(p.estado)}</td>
        <td data-label="Acciones" style="text-align: center; white-space: nowrap;">
          ${adminActionsHtml}
        </td>
      </tr>`;
    }).join('');

      // Mobile Cards rendering
    if (mobileListDiv) {
      mobileListDiv.innerHTML = props.map(p => {
        const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
        const proyectoNombre = proy ? proy.nombre_proyecto : '-';
        const statusBadge = getStatusBadgeHTML(p.estado);
        
        let mobileActions = '';
        const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : activeRole;
        if (currentRole === 'administrador' || currentRole === 'gerente') {
          let driveUrl = (p.url && p.url.trim() !== '' && !p.url.includes('/search?q=')) ? p.url : '';
          if (!driveUrl && window.APP5T_DRIVE_CATALOG) {
            driveUrl = window.APP5T_DRIVE_CATALOG.getFolderForLote(p.id_proyecto, p.nombre || p.id);
          }
          if (!driveUrl) {
            driveUrl = 'https://drive.google.com/drive/folders/1J2qkvpVKQcLD9pmryPXDC525tTnUIN8I';
          }

          mobileActions = `
            <div style="display: flex; gap: 6px; align-items: center;">
              <a href="${driveUrl}" target="_blank" style="background: transparent; border: none; color: var(--accent-green); padding: 4px; font-size: 0.85rem; cursor: pointer; text-decoration: none;" title="Abrir Carpeta de este Lote en Google Drive">
                <i class="fa-solid fa-folder-open"></i>
              </a>
              ${currentRole === 'administrador' ? `
                <button type="button" onclick="APP5T_Forms._editRecord('propiedades', '${p.id}')" style="background: transparent; border: none; color: var(--accent-blue); padding: 4px; font-size: 0.85rem; cursor: pointer;" title="Editar Lote"><i class="fa-solid fa-edit"></i></button>
              ` : ''}
            </div>
          `;
        }

        const supFormatted = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(p.superficie) : (p.superficie || '-');
        const valorFormatted = APP5T_Utils.formatMoneda(p.valor_final || 0);

        return `
          <div class="inventario-card-mobile" style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 38px;">
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; flex-wrap: wrap;">
              <strong style="color: var(--text-white); font-size: 0.88rem; white-space: nowrap;">${p.nombre || p.id}</strong>
              <span style="font-size: 0.72rem; color: var(--text-dim); white-space: nowrap;">(${proyectoNombre})</span>
              <span style="font-size: 0.76rem; color: var(--text-dim); white-space: nowrap;">· ${supFormatted}</span>
              <strong style="color: var(--text-white); font-size: 0.8rem; white-space: nowrap;">· ${valorFormatted}</strong>
            </div>
            <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
              <div style="transform: scale(0.85); transform-origin: right center;">${statusBadge}</div>
              ${mobileActions}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function _renderAuditoria() {
    const tbody = document.getElementById('tbody-auditoria');
    if (!tbody) return;
    const entries = (APP5T_DB.getAuditoria() || []).slice(0, 50);
    if (entries.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>'; return; }
    tbody.innerHTML = entries.map(a => `<tr>
      <td>${(() => { if (!a.fecha) return '-'; const raw = String(a.fecha).replace(' ', 'T'); const d = new Date(raw); return isNaN(d.getTime()) ? a.fecha : (APP5T_Utils.formatFecha(d) + ' ' + d.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})); })()}</td>
      <td>${a.usuario || '-'}</td>
      <td>${a.rol || '-'}</td>
      <td>${a.tabla || '-'}</td>
      <td class="text-truncate" title="${(a.detalle || '').replace(/"/g, '&quot;')}">${(a.detalle || '').substring(0, 80)}</td>
    </tr>`).join('');
  }


  function _renderPendingApprovals() {
    const tbody = document.getElementById('tbody-pending-approvals');
    if (!tbody) return;

    // Find vendedor matching current role persona
    const vendedores = APP5T_DB.getAll('vendedores') || [];
    const vendActivo = _resolveActiveVendedor(vendedores);
    const idVend = vendActivo ? vendActivo.id : null;

    // Find all properties in state 'Pendiente'
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Pendiente');

    // Filter properties whose active negotiation belongs to the active vendedor
    let myPendingProps = [];
    if (idVend) {
      myPendingProps = props.filter(p => {
        const negs = APP5T_DB.query('negociaciones', n =>
          n.id_propiedad === p.id &&
          (n.id_proceso === 'Reserva' || n.id_proceso === 'Venta_Directa') &&
          n.estado_avance === 'En Curso'
        );
        const neg = negs && negs.length ? negs[0] : null;
        return neg && String(neg.id_vendedor) === String(idVend);
      });
    }

    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (myPendingProps.length > 0) {
        badge.textContent = myPendingProps.length;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    if (myPendingProps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No tienes solicitudes pendientes de aprobación</td></tr>';
      return;
    }

    tbody.innerHTML = myPendingProps.map(p => {
      const negs = APP5T_DB.query('negociaciones', n =>
        n.id_propiedad === p.id &&
        (n.id_proceso === 'Reserva' || n.id_proceso === 'Venta_Directa') &&
        n.estado_avance === 'En Curso'
      );
      const neg = negs && negs.length ? negs[0] : null;
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '-') : '-';
      const fecha = neg ? neg.fecha_negociacion : '-';
      const esVD = neg && neg.id_proceso === 'Venta_Directa';
      const tipoBadge = esVD
        ? `<span class="tag tag-venta-directa" style="font-size:0.72rem;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>`
        : `<span class="tag tag-pending" style="font-size:0.72rem;">Reserva</span>`;

      return `<tr onclick="APP5T_Modals.close('modal-notifications'); if(window.APP5T && window.APP5T.openLoteBottomSheet) { window.APP5T.openLoteBottomSheet('${p.id}'); }" style="cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.background='transparent';">
        <td>${p.nombre || `Lote ${p.id}`}</td>
        <td>${proyNom}</td>
        <td>${fecha}</td>
        <td>${tipoBadge}</td>
        <td><span class="tag tag-pending"><i class="fa-solid fa-clock"></i> Pendiente Aprobación</span></td>
      </tr>`;
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     INFORMES PLAN Y ESCRITURAS (ADMIN)
     ══════════════════════════════════════════════════════ */
  function parseDdMmYyyy(str) {
    if (!str) return null;
    if (str.includes('-') && str.split('-')[0].length === 4) {
      const p = str.split('-'); return { day: parseInt(p[2],10), month: parseInt(p[1],10), year: parseInt(p[0],10) };
    }
    const parts = str.includes('/') ? str.split('/') : str.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { day, month, year };
  }

  function _populateMapProjects() {
    const select = document.getElementById('map-project-select');
    if (!select) return;
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    if (select.children.length <= 1) {
      proyectos.forEach(p => {
        const name = p.nombre_proyecto || p.nombre || `Proyecto ${p.id}`;
        const opt = document.createElement('option');
        opt.value = p.nombre || p.nombre_proyecto;
        opt.textContent = name;
        select.appendChild(opt);
      });
    }
  }

  function _populateInformesProyectos() {
    const select = document.getElementById('informes-filter-proyecto');
    const ctacteSelect = document.getElementById('rep-ctacte-proyecto');
    const dlClientes = document.getElementById('dl-ctacte-clientes');
    const dlLotes = document.getElementById('dl-ctacte-lotes');

    const proyectos = APP5T_DB.getAll('proyectos') || [];
    
    if (select && select.children.length <= 1) {
      proyectos.forEach(p => {
        const name = p.nombre_proyecto || p.nombre || `Proyecto ${p.id}`;
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = name;
        select.appendChild(opt);
      });
    }

    if (ctacteSelect && ctacteSelect.children.length <= 1) {
      proyectos.forEach(p => {
        const name = p.nombre_proyecto || p.nombre || `Proyecto ${p.id}`;
        const optCtaCte = document.createElement('option');
        optCtaCte.value = p.id;
        optCtaCte.textContent = name;
        ctacteSelect.appendChild(optCtaCte);
      });
    }

    const ventasSelect = document.getElementById('rep-ventas-proyecto');
    if (ventasSelect && ventasSelect.children.length <= 1) {
      proyectos.forEach(p => {
        const name = p.nombre_proyecto || p.nombre || `Proyecto ${p.id}`;
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = name;
        ventasSelect.appendChild(opt);
      });
    }

    const cuotasSelect = document.getElementById('rep-cuotas-proyecto');
    if (cuotasSelect && cuotasSelect.children.length <= 1) {
      proyectos.forEach(p => {
        const name = p.nombre_proyecto || p.nombre || `Proyecto ${p.id}`;
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = name;
        cuotasSelect.appendChild(opt);
      });
    }

    const ventasVendedorSelect = document.getElementById('rep-ventas-vendedor');
    if (ventasVendedorSelect && ventasVendedorSelect.children.length <= 1) {
      const vendedores = APP5T_DB.getAll('vendedores') || [];
      vendedores.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.nombre || v.nombres || `Vendedor ${v.id}`;
        ventasVendedorSelect.appendChild(opt);
      });
    }

    _updateCtaCteCascadingFilters();
  }

  function _updateCtaCteCascadingFilters() {
    const dlClientes = document.getElementById('dl-ctacte-clientes');
    const dlLotes = document.getElementById('dl-ctacte-lotes');
    const ctacteSelect = document.getElementById('rep-ctacte-proyecto');
    
    if (!dlClientes || !dlLotes || !ctacteSelect) return;

    const clienteInput = (document.getElementById('rep-ctacte-cliente')?.value || '').trim().toLowerCase();
    const loteInput = (document.getElementById('rep-ctacte-lote')?.value || '').trim().toLowerCase();
    const proyectoValue = ctacteSelect.value;
    
    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const cuotasAll = APP5T_DB.getAll('cuenta_corriente') || [];

    // Purge test client '10.709.197-1' / 'Rodrigo F' / 'Rodrigo Rivera' if present in local DB
    if (typeof APP5T_DB !== 'undefined' && typeof APP5T_DB.remove === 'function') {
      (APP5T_DB.getAll('clientes') || []).forEach(c => {
        if (!c) return;
        const fullNom = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().trim();
        const rut = String(c.rut || '').trim();
        if (rut.includes('10.709.197') || fullNom.includes('rodrigo f') || fullNom.includes('rodrigo rivera')) {
          APP5T_DB.remove('clientes', c.id);
        }
      });
    }

    const isExcludedClient = (c) => {
      if (!c) return true;
      const fullNom = `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().trim();
      const rut = String(c.rut || '').trim();
      return rut.includes('10.709.197') || fullNom.includes('rodrigo f') || fullNom.includes('rodrigo rivera');
    };

    const propIdsWithCtas = new Set(cuotasAll.map(c => c && String(c.id_propiedad)).filter(Boolean));
    const clientIdsWithCtas = new Set(cuotasAll.map(c => c && String(c.id_cliente)).filter(Boolean));

    const validStates = ['Promesada', 'Venta_Directa', 'Vendida', 'Escriturada'];
    
    // Filter base valid properties that have active cuenta_corriente records
    const validProps = propiedades.filter(p => 
      p && 
      validStates.includes(p.estado) && 
      (propIdsWithCtas.has(String(p.id)) || negociaciones.some(n => n && String(n.id_propiedad) === String(p.id) && clientIdsWithCtas.has(String(n.id_cliente)))) &&
      negociaciones.some(n => n && String(n.id_propiedad) === String(p.id))
    );
    
    // Find all valid combinations of (Client, Project, Lot) that have cuenta_corriente records
    const combinations = validProps.map(p => {
      const propNegs = negociaciones.filter(n => n && String(n.id_propiedad) === String(p.id));
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
      if (!neg) return null;
      const c = clientes.find(c => String(c.id) === String(neg.id_cliente));
      if (!c || isExcludedClient(c)) return null;

      // Verificar que efectivamente existan registros en cuenta_corriente para este lote o cliente
      const hasCuotas = cuotasAll.some(cu => String(cu.id_propiedad) === String(p.id) || String(cu.id_cliente) === String(c.id));
      if (!hasCuotas) return null;

      const proj = proyectos.find(pr => String(pr.id) === String(p.id_proyecto));
      
      return {
        prop: p,
        cliente: c,
        proyecto: proj,
        clienteStr: `${c.rut} | ${c.nombres} ${c.apellidos}`,
        loteStr: p.nombre_lote || p.nombre || `Lote ${p.id}`
      };
    }).filter(Boolean);

    const matchCliente = combo => !clienteInput || combo.clienteStr.toLowerCase().includes(clienteInput);
    const matchLote = combo => !loteInput || combo.loteStr.toLowerCase().includes(loteInput);
    const matchProyecto = combo => !proyectoValue || proyectoValue === 'all' || (combo.proyecto && String(combo.proyecto.id) === String(proyectoValue));

    // Extract unique allowed options by applying the OTHER filters
    const allowedClientes = new Set();
    const allowedLotes = new Set();
    const allowedProyectos = new Set();
    
    combinations.forEach(combo => {
      // For Clients: filter by Lot and Project
      if (matchLote(combo) && matchProyecto(combo)) {
        if (combo.clienteStr) allowedClientes.add(combo.clienteStr);
      }
      
      // For Lots: filter by Client and Project
      if (matchCliente(combo) && matchProyecto(combo)) {
        if (combo.loteStr) allowedLotes.add(combo.loteStr);
      }
      
      // For Projects: filter by Client and Lot
      if (matchCliente(combo) && matchLote(combo)) {
        if (combo.proyecto) allowedProyectos.add(combo.proyecto.id);
      }
    });
    
    // Re-populate Datalist for Clientes
    dlClientes.innerHTML = '';
    allowedClientes.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      dlClientes.appendChild(opt);
    });
    
    // Re-populate Datalist for Lotes
    dlLotes.innerHTML = '';
    allowedLotes.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      dlLotes.appendChild(opt);
    });
    
    // Adjust Projects select options (hide those not in allowedProyectos, unless it's "all")
    Array.from(ctacteSelect.options).forEach(opt => {
      if (opt.value === 'all') {
        opt.style.display = '';
      } else {
        if (allowedProyectos.has(Number(opt.value)) || allowedProyectos.has(String(opt.value))) {
          opt.style.display = '';
        } else {
          opt.style.display = 'none';
        }
      }
    });
  }

  function renderReport(type) {
    if (type === 'promesas') {
      _renderInformePromesas();
    } else if (type === 'ctacte') {
      _renderInformeCtaCte();
    } else if (type === 'ventas') {
      _renderInformeVentas();
    } else if (type === 'cuotas') {
      _renderInformeCuotas();
    }
  }

  function _renderInformes() {
    // Determine which tab is active (default promesas)
    let activeTab = 'promesas';
    const repBtns = [
      document.getElementById('btn-rep-promesas'),
      document.getElementById('btn-rep-ctacte'),
      document.getElementById('btn-rep-ventas'),
      document.getElementById('btn-rep-cuotas')
    ];
    repBtns.forEach(btn => {
      if (btn && btn.classList.contains('active')) {
        activeTab = btn.getAttribute('data-report');
      }
    });
    renderReport(activeTab);
  }

  // --- 1. Promesas y Escrituras (Old _renderInformes logic) ---
  function _renderInformePromesas() {
    const tbody = document.getElementById('tbody-informes-promesas');
    if (!tbody) return;

    _populateInformesProyectos();

    const mesSelect = document.getElementById('informes-filter-mes');
    const anioSelect = document.getElementById('informes-filter-anio');
    const proySelect = document.getElementById('informes-filter-proyecto');
    const searchInput = document.getElementById('informes-search');

    const mesFilter = mesSelect ? mesSelect.value : 'all';
    const anioFilter = anioSelect ? anioSelect.value : 'all';
    const proyFilter = proySelect ? proySelect.value : 'all';
    const searchFilter = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];

    const targetStates = ['Reservada', 'Promesada', 'Venta_Directa', 'Vendida'];
    const filteredData = [];

    propiedades.forEach(p => {
      if (!targetStates.includes(p.estado)) return;

      // Find associated negotiation(s)
      const propNegs = negociaciones.filter(n => n.id_propiedad === p.id);
      if (propNegs.length === 0) return;
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];

      // Resolve client
      const cli = clientes.find(c => String(c.id) === String(neg.id_cliente));
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '';
      const cliRut = cli ? cli.rut : '';

      // Resolve project
      const proy = p.id_proyecto ? proyectos.find(pr => pr.id === p.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre) : '-';
      const proyId = p.id_proyecto;

      // Resolve operation date
      let fechaOp = '';
      if (p.estado === 'Vendida') {
        fechaOp = p.fecha_venta || neg.fecha_promesa || neg.fecha_negociacion || '';
      } else if (p.estado === 'Venta_Directa') {
        fechaOp = neg.fecha_negociacion || p.fecha_reserva || '';
      } else if (p.estado === 'Reservada') {
        fechaOp = p.fecha_reserva || neg.fecha_negociacion || '';
      } else {
        fechaOp = neg.fecha_promesa || neg.fecha_negociacion || p.fecha_reserva || '';
      }

      // Filter by Month and Year of operation date
      const parsedDate = parseDdMmYyyy(fechaOp);
      if (mesFilter !== 'all') {
        if (!parsedDate || parsedDate.month !== parseInt(mesFilter, 10)) return;
      }
      if (anioFilter !== 'all') {
        if (!parsedDate || parsedDate.year !== parseInt(anioFilter, 10)) return;
      }

      // Filter by Project
      if (proyFilter !== 'all') {
        if (String(proyId) !== String(proyFilter)) return;
      }

      // Filter by search term
      if (searchFilter) {
        const matchLote = p.nombre && p.nombre.toLowerCase().includes(searchFilter);
        const matchCliente = cliNom.toLowerCase().includes(searchFilter);
        const matchRut = cliRut.toLowerCase().includes(searchFilter);
        if (!matchLote && !matchCliente && !matchRut) return;
      }

      // Calculate cta cte details
      const propCuotas = ctas.filter(ct => ct.id_propiedad === p.id);
      const pagadas = propCuotas.filter(ct => ct.estado_cuota === 'Pagada' || ct.estado_cuota === 'Pagado');
      const pendientes = propCuotas.filter(ct => ct.estado_cuota !== 'Pagada' && ct.estado_cuota !== 'Pagado' && !String(ct.estado_cuota).includes('Anulada'));

      const numPagadas = pagadas.length;
      const montoPagadoCuotas = pagadas.reduce((sum, ct) => sum + (ct.valor_pagado || 0), 0);

      const numPendientes = pendientes.length;
      const montoPendienteCuotas = pendientes.reduce((sum, ct) => sum + (ct.valor_cuota || 0) - (ct.valor_pagado || 0), 0);

      const pie = neg.pie || 0;
      const totalRecibido = pie + montoPagadoCuotas;
      const totalPorRecibir = montoPendienteCuotas;

      filteredData.push({
        propiedad: p,
        negociacion: neg,
        cliente: cli,
        clienteNombreCompleto: cliNom,
        clienteRut: cliRut,
        proyectoNombre: proyNom,
        fechaOperacion: fechaOp,
        valorVenta: neg.valor_final || p.valor_final || 0,
        pie: pie,
        numCuotasPagadas: numPagadas,
        montoCuotasPagadas: montoPagadoCuotas,
        numCuotasPendientes: numPendientes,
        montoCuotasPendientes: montoPendienteCuotas,
        totalRecibido: totalRecibido,
        totalPorRecibir: totalPorRecibir
      });
    });

    // Update state cache for CSV export
    lastFilteredInformes = filteredData;

    // Update KPI metrics (moved to Promesas report, or keep generic? Let's just update if they exist)
    const kpiOps = filteredData.length;
    const kpiVentas = filteredData.reduce((sum, item) => sum + (item.valorVenta || 0), 0);
    const kpiRecibido = filteredData.reduce((sum, item) => sum + item.totalRecibido, 0);
    const kpiPendiente = filteredData.reduce((sum, item) => sum + item.totalPorRecibir, 0);

    const kpiOpsEl = document.getElementById('kpi-report-operaciones');
    const kpiVentasEl = document.getElementById('kpi-report-ventas');
    const kpiRecibidoEl = document.getElementById('kpi-report-recibido');
    const kpiPendienteEl = document.getElementById('kpi-report-pendiente');

    if (kpiOpsEl) kpiOpsEl.textContent = kpiOps;
    if (kpiVentasEl) kpiVentasEl.textContent = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(kpiVentas) : '$ ' + kpiVentas.toLocaleString('es-CL');
    if (kpiRecibidoEl) kpiRecibidoEl.textContent = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(kpiRecibido) : '$ ' + kpiRecibido.toLocaleString('es-CL');
    if (kpiPendienteEl) kpiPendienteEl.textContent = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda(kpiPendiente) : '$ ' + kpiPendiente.toLocaleString('es-CL');

    // Control visual: si es móvil y perfil Gerente, ocultar el wrap de la tabla directamente
    const wrapTable = document.getElementById('wrap-table-informes-promesas');
    const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : activeRole;
    if (wrapTable) {
      if (currentRole === 'gerente' && window.innerWidth <= 768) {
        wrapTable.style.setProperty('display', 'none', 'important');
      } else {
        wrapTable.style.removeProperty('display');
      }
    }

    // Render table rows
    if (filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted" style="padding: 24px;">No se encontraron operaciones en el período seleccionado</td></tr>';
      return;
    }

    tbody.innerHTML = filteredData.map(item => {
      const p = item.propiedad;
      const valorVentaStr = APP5T_Utils.formatMoneda(item.valorVenta);
      const pieStr = APP5T_Utils.formatMoneda(item.pie);
      const pagadasStr = `${item.numCuotasPagadas} (${APP5T_Utils.formatMoneda(item.montoCuotasPagadas)})`;
      const pendientesStr = `${item.numCuotasPendientes} (${APP5T_Utils.formatMoneda(item.montoCuotasPendientes)})`;
      const recibidoStr = APP5T_Utils.formatMoneda(item.totalRecibido);
      const pendienteStr = APP5T_Utils.formatMoneda(item.totalPorRecibir);
      
      return `<tr>
        <td>${item.fechaOperacion || '-'}</td>
        <td><strong>${p.nombre}</strong><br><small style="color:var(--text-dim);">${item.proyectoNombre}</small></td>
        <td>${item.clienteNombreCompleto || '-'}<br><small style="color:var(--text-dim);">${item.clienteRut || '-'}</small></td>
        <td>${valorVentaStr}</td>
        <td>${pieStr}</td>
        <td>${pagadasStr}</td>
        <td>${pendientesStr}</td>
        <td style="font-weight: 700; color: var(--accent-green, #2ecc71);">${recibidoStr}</td>
        <td style="font-weight: 700; color: var(--accent-orange, #f39c12);">${pendienteStr}</td>
        <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>
      </tr>`;
    }).join('');
  }

  // --- 2. Cuenta Corriente ---
  function _renderInformeCtaCte() {
    const container = document.getElementById('informe-ctacte-statements');
    if (!container) return;
    
    _populateInformesProyectos();
    
    const clienteFilter = (document.getElementById('rep-ctacte-cliente')?.value || '').trim().toLowerCase();
    const loteFilter = (document.getElementById('rep-ctacte-lote')?.value || '').trim().toLowerCase();
    const proyectoFilter = document.getElementById('rep-ctacte-proyecto')?.value || 'all';
    
    // Obligar a filtrar por cliente o lote
    if (!clienteFilter && !loteFilter) {
      container.innerHTML = `
        <div id="informe-ctacte-placeholder" style="text-align: center; padding: 40px; background-color: var(--glass-bg); border: 1px dashed var(--glass-border); border-radius: 8px;">
          <i class="fa-solid fa-file-invoice" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 16px;"></i>
          <h4 style="color: var(--text-white); margin-bottom: 8px;">Generador de Estados de Cuenta</h4>
          <p style="color: var(--text-dim); font-size: 0.9rem;">Por favor, busque y seleccione un <strong>Cliente</strong> o <strong>Lote</strong> en los filtros superiores para generar su informe detallado.</p>
        </div>`;
      return;
    }

    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];
    const usuarios = APP5T_DB.getAll('usuarios') || [];
    
    const targetStates = ['Promesada', 'Venta_Directa', 'Vendida'];
    const statementsHtml = [];
    
    const parseDdMmYyyy = (dateStr) => {
        if(!dateStr) return null;
        if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
            const p = dateStr.split('-'); return { day: parseInt(p[2],10), month: parseInt(p[1],10), year: parseInt(p[0],10) };
        }
        const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        if(parts.length !== 3) return null;
        return { day: parseInt(parts[0], 10), month: parseInt(parts[1], 10), year: parseInt(parts[2], 10) };
    };
    
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][today.getMonth()]} de ${today.getFullYear()}`;

    propiedades.forEach(p => {
      if (!targetStates.includes(p.estado)) return;
      
      const propNegs = negociaciones.filter(n => n.id_propiedad === p.id);
      if (propNegs.length === 0) return;
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
      
      const cli = clientes.find(c => String(c.id) === String(neg.id_cliente));
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '';
      const cliRut = cli ? cli.rut : '';
      
      const proy = p.id_proyecto ? proyectos.find(pr => pr.id === p.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre) : '-';
      
      const vendedores = APP5T_DB.getAll('vendedores') || [];
      const vend = vendedores.find(v => String(v.id) === String(neg.id_vendedor));
      const vendNom = vend ? (vend.nombres || vend.nombre) : '-';
      
      // Apply filters
      const combinedCli = `${cliRut} | ${cliNom}`.toLowerCase();
      if (clienteFilter && !combinedCli.includes(clienteFilter)) return;
      if (proyectoFilter !== 'all' && String(p.id_proyecto) !== String(proyectoFilter)) return;
      if (loteFilter && !(p.nombre || '').toLowerCase().includes(loteFilter)) return;
      
      const propCuotas = ctas.filter(ct => ct.id_propiedad === p.id);
      
      propCuotas.sort((a, b) => {
        const da = parseDdMmYyyy(a.fecha_vencimiento);
        const db = parseDdMmYyyy(b.fecha_vencimiento);
        const timeA = da ? new Date(da.year, da.month - 1, da.day).getTime() : 0;
        const timeB = db ? new Date(db.year, db.month - 1, db.day).getTime() : 0;
        return timeA - timeB;
      });
      
      let cuotasRows = '';
      let totalPagado = neg.pie || 0;
      let totalPendiente = 0;
      let saldoVencido = 0;
      let saldoAPagar = 0;
      
      // Add 'Pie' row if exists
      if (neg.pie > 0) {
          cuotasRows += `<tr>
            <td>Pie / Reserva</td>
            <td>--</td>
            <td>${APP5T_Utils.formatMoneda(neg.pie)}</td>
            <td>--</td>
            <td>${APP5T_Utils.formatMoneda(neg.pie)}</td>
            <td><span class="badge" style="background-color: var(--accent-green); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Pagado</span></td>
          </tr>`;
      }
      
      propCuotas.forEach((ct, index) => {
        let estadoBadge = '';
        if (ct.estado_cuota === 'Pagada') {
          totalPagado += (ct.valor_pagado || 0);
          estadoBadge = `<span class="badge" style="background-color: var(--accent-green); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Pagado</span>`;
        } else {
          const pendienteCuota = (ct.valor_cuota || 0) - (ct.valor_pagado || 0);
          totalPendiente += pendienteCuota;
          
          let isVencida = false;
          if (ct.fecha_vencimiento) {
             const vDate = parseDdMmYyyy(ct.fecha_vencimiento);
             if (vDate) {
               const dt = new Date(vDate.year, vDate.month - 1, vDate.day);
               if (dt < today) {
                 saldoVencido += pendienteCuota;
                 isVencida = true;
               } else {
                 saldoAPagar += pendienteCuota;
               }
             }
          }
          if(isVencida) {
              estadoBadge = `<span class="badge" style="background-color: var(--accent-red); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Vencida</span>`;
          } else {
              estadoBadge = `<span class="badge" style="background-color: var(--accent-orange); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Pendiente</span>`;
          }
        }
        
        cuotasRows += `<tr>
          <td>${ct.cuota_nro || (index + 1)}</td>
          <td>${ct.fecha_vencimiento || '-'}</td>
          <td>${APP5T_Utils.formatMoneda(ct.valor_cuota || 0)}</td>
          <td>${ct.fecha_pago || '-'}</td>
          <td>${APP5T_Utils.formatMoneda(ct.valor_pagado || 0)}</td>
          <td>${estadoBadge}</td>
        </tr>`;
      });
      
      if(propCuotas.length === 0 && (!neg.pie || neg.pie === 0)) {
          cuotasRows = `<tr><td colspan="6" style="text-align:center;">No hay cuotas registradas.</td></tr>`;
      }
      
      const valorTotal = neg.valor_final || p.valor_final || 0;
      
      const html = `
        <div class="statement-card">
          <div class="statement-top-bar">
            <div class="statement-title-group">
              <span class="statement-title">INFORME DE CUENTA CORRIENTE</span>
              <span class="statement-date-badge"><i class="fa-regular fa-calendar-days"></i> ${todayStr}</span>
            </div>
            <img src="../04_RECURSOS/logo5t.png" alt="5 Tierras" class="statement-logo-img">
          </div>
          
          <div class="statement-header-grid">
            <div class="statement-header-item">
              <span class="statement-meta-label"><i class="fa-solid fa-user"></i> Cliente</span>
              <strong class="statement-meta-val">${cliNom || '-'}</strong>
              <span class="statement-meta-sub">RUT: ${cliRut || '-'}</span>
            </div>
            <div class="statement-header-item">
              <span class="statement-meta-label"><i class="fa-solid fa-location-dot"></i> Propiedad</span>
              <strong class="statement-meta-val">${p.nombre || '-'} (${proyNom})</strong>
              <span class="statement-meta-sub">${p.rol_propiedad ? 'Rol: ' + p.rol_propiedad : 'Rol: -'}</span>
            </div>
            <div class="statement-header-item">
              <span class="statement-meta-label"><i class="fa-solid fa-user-tie"></i> Vendedor Asignado</span>
              <strong class="statement-meta-val">${vendNom || '-'}</strong>
              <span class="statement-meta-sub">Ejecutivo Comercial</span>
            </div>
          </div>
          
          <div class="statement-section-title">Detalle de Movimientos y Cuotas</div>
          <div class="statement-table-wrapper">
            <table class="statement-table">
              <thead>
                <tr>
                  <th>Nº cuota</th>
                  <th>Fecha vcto.</th>
                  <th>Monto Cuota</th>
                  <th>Fecha Pago</th>
                  <th>Monto pagado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${cuotasRows}
              </tbody>
            </table>
          </div>
          
          <div class="statement-section-title">Resumen de la Cuenta</div>
          <div class="statement-summary">
            <div class="statement-summary-row">
              <span>Monto Total de la Compra:</span>
              <strong>${APP5T_Utils.formatMoneda(valorTotal)}</strong>
            </div>
            <div class="statement-summary-row">
              <span>Total Pagado (Pie + Cuotas):</span>
              <strong style="color: #2ecc71;">${APP5T_Utils.formatMoneda(totalPagado)}</strong>
            </div>
            <div class="statement-summary-row">
              <span>Saldo Actual Vencido:</span>
              <strong style="color: #e74c3c;">${APP5T_Utils.formatMoneda(saldoVencido)}</strong>
            </div>
            <div class="statement-summary-row">
              <span>Saldo a Pagar (Futuras cuotas):</span>
              <strong>${APP5T_Utils.formatMoneda(saldoAPagar)}</strong>
            </div>
            <div class="statement-summary-total">
              <span>Deuda Total Pendiente:</span>
              <span>${APP5T_Utils.formatMoneda(totalPendiente)}</span>
            </div>
          </div>
        </div>
      `;
      statementsHtml.push(html);
    });
    
    if (statementsHtml.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; background-color: var(--glass-bg); border: 1px dashed var(--glass-border); border-radius: 8px;">
          <h4 style="color: var(--text-white);">No se encontraron registros</h4>
          <p style="color: var(--text-dim); font-size: 0.9rem;">No hay propiedades promesadas o vendidas que coincidan con la búsqueda.</p>
        </div>`;
    } else {
      container.innerHTML = statementsHtml.join('');
    }
  }

  // --- 3. Ventas por Vendedor ---
  function _renderInformeVentas() {
    const detalleContainer = document.getElementById('informe-ventas-detalle');
    if (!detalleContainer) return;
    
    _populateInformesProyectos();
    
    const vendedorFilter = document.getElementById('rep-ventas-vendedor')?.value || 'all';
    const mesFilter = document.getElementById('rep-ventas-mes')?.value || 'all';
    const anioFilter = document.getElementById('rep-ventas-anio')?.value || 'all';
    const proyectoFilter = document.getElementById('rep-ventas-proyecto')?.value || 'all';
    
    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const vendedores = APP5T_DB.getAll('vendedores') || [];
    
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const targetStates = ['Promesada', 'Venta_Directa', 'Vendida'];
    const summaryByVendedor = {};
    
    propiedades.forEach(p => {
      if (!targetStates.includes(p.estado)) return;
      if (proyectoFilter !== 'all' && String(p.id_proyecto) !== String(proyectoFilter)) return;
      const propNegs = negociaciones.filter(n => n.id_propiedad === p.id);
      if (propNegs.length === 0) return;
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
      
      let fechaOp = '';
      if (p.estado === 'Vendida') {
        fechaOp = p.fecha_venta || neg.fecha_promesa || neg.fecha_negociacion || '';
      } else if (p.estado === 'Venta_Directa') {
        fechaOp = neg.fecha_negociacion || '';
      } else {
        fechaOp = neg.fecha_promesa || neg.fecha_negociacion || '';
      }
      
      const parsedDate = parseDdMmYyyy(fechaOp);
      if (mesFilter !== 'all') {
        if (!parsedDate || parsedDate.month !== parseInt(mesFilter, 10)) return;
      }
      if (anioFilter !== 'all') {
        if (!parsedDate || parsedDate.year !== parseInt(anioFilter, 10)) return;
      }
      
      const idVendedor = neg.id_vendedor;
      if (vendedorFilter !== 'all' && String(idVendedor) !== String(vendedorFilter)) return;
      
      if (!summaryByVendedor[idVendedor]) {
        const u = vendedores.find(v => String(v.id) === String(idVendedor));
        summaryByVendedor[idVendedor] = {
          nombre: u ? `${u.nombre || u.nombres}` : 'Desconocido',
          lotesVendidos: 0,
          volumenUF: 0,
          volumenCLP: 0,
          ventas: []
        };
      }
      
      summaryByVendedor[idVendedor].lotesVendidos++;
      
      const montoVenta = neg.valor_final || p.valor_final || 0;
      summaryByVendedor[idVendedor].volumenCLP += montoVenta;
      
      const cli = clientes.find(c => String(c.id) === String(neg.id_cliente));
      const proy = p.id_proyecto ? proyectos.find(pr => pr.id === p.id_proyecto) : null;
      
      summaryByVendedor[idVendedor].ventas.push({
        lote: p.nombre_lote || p.nombre || `Lote ${p.id}`,
        proyecto: proy ? proy.nombre_proyecto || proy.nombre : '-',
        cliente: cli ? `${cli.nombres} ${cli.apellidos}` : 'Desconocido',
        rut: cli ? cli.rut : '',
        fecha: fechaOp,
        monto: montoVenta,
        estado: p.estado
      });
    });
    
    const rows = Object.values(summaryByVendedor).sort((a,b) => b.volumenCLP - a.volumenCLP);
    
    if (rows.length === 0) {
      detalleContainer.innerHTML = '<div style="text-align: center; padding: 40px; background-color: var(--glass-bg); border: 1px dashed var(--glass-border); border-radius: 8px;"><h4 style="color: var(--text-white);">No se encontraron ventas</h4><p style="color: var(--text-dim); font-size: 0.9rem;">No hay propiedades promesadas o vendidas que coincidan con la búsqueda.</p></div>';
      return;
    }
    
      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, '0')} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][today.getMonth()]} de ${today.getFullYear()}`;
      
      let detalleHtml = '';
      
      rows.forEach(r => {
        r.ventas.sort((a, b) => {
          const pA = parseDdMmYyyy(a.fecha);
          const pB = parseDdMmYyyy(b.fecha);
          if (!pA) return 1;
          if (!pB) return -1;
          const dA = new Date(pA.year, pA.month - 1, pA.day);
          const dB = new Date(pB.year, pB.month - 1, pB.day);
          return dA - dB;
        });

        let ventasHtml = r.ventas.map(v => {
          let fmtDate = v.fecha || '-';
          const pd = parseDdMmYyyy(v.fecha);
          if (pd) {
            const yy = String(pd.year).slice(-2);
            const mm = String(pd.month).padStart(2, '0');
            const dd = String(pd.day).padStart(2, '0');
            fmtDate = `${dd}/${mm}/${yy}`;
          }
          return `
          <tr>
            <td>${v.lote} <span style="font-size:0.8rem; color:var(--text-dim);">(${v.proyecto})</span></td>
            <td>${v.cliente}</td>
            <td>${fmtDate}</td>
            <td>${v.estado.replace('_', ' ')}</td>
            <td>${APP5T_Utils.formatMoneda(v.monto)}</td>
          </tr>
        `}).join('');

        detalleHtml += `
          <div class="statement-card">
            <div class="statement-top-bar">
              <div class="statement-title-group">
                <span class="statement-title">INFORME DE VENTAS POR VENDEDOR</span>
                <span class="statement-date-badge"><i class="fa-regular fa-calendar-days"></i> ${todayStr}</span>
              </div>
              <img src="../04_RECURSOS/logo5t.png" alt="5 Tierras" class="statement-logo-img">
            </div>
            
            <div class="statement-header-grid" style="grid-template-columns: repeat(2, 1fr) !important;">
              <div class="statement-header-item">
                <span class="statement-meta-label"><i class="fa-solid fa-user-tie"></i> Ejecutivo Comercial</span>
                <strong class="statement-meta-val">${r.nombre}</strong>
              </div>
              <div class="statement-header-item">
                <span class="statement-meta-label"><i class="fa-solid fa-chart-pie"></i> Rendimiento</span>
                <strong class="statement-meta-val" style="color: #00e5ff;">${r.lotesVendidos} operaciones cerradas</strong>
              </div>
            </div>
            
            <div class="statement-section-title">Detalle de Operaciones</div>
            <div class="statement-table-wrapper">
              <table class="statement-table">
                <thead>
                  <tr>
                    <th>Propiedad</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Monto (CLP)</th>
                  </tr>
                </thead>
                <tbody>
                  ${ventasHtml}
                </tbody>
              </table>
            </div>
            
            <div class="statement-section-title">Resumen de Ventas</div>
            <div class="statement-summary">
              <div class="statement-summary-total">
                <span>Volumen Total CLP:</span>
                <span>${APP5T_Utils.formatMoneda(r.volumenCLP)}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      detalleContainer.innerHTML = detalleHtml;
  }

  // --- 4. Cuotas Vencidas / Por Vencer ---
  function _renderInformeCuotas() {
    const tbody = document.getElementById('tbody-informes-cuotas');
    if (!tbody) return;
    
    const estadoFilter = document.getElementById('rep-cuotas-estado')?.value || 'all';
    const searchFilter = (document.getElementById('rep-cuotas-search')?.value || '').trim().toLowerCase();
    const proyectoFilter = document.getElementById('rep-cuotas-proyecto')?.value || 'all';
    
    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];
    
    const targetStates = ['Promesada', 'Venta_Directa', 'Vendida'];
    const filteredCuotas = [];
    const now = new Date();
    // Normalize now to start of day
    now.setHours(0,0,0,0);
    
    propiedades.forEach(p => {
      if (!targetStates.includes(p.estado)) return;
      if (proyectoFilter !== 'all' && String(p.id_proyecto) !== String(proyectoFilter)) return;
      const propCuotas = ctas.filter(ct => ct.id_propiedad === p.id && ct.estado_cuota !== 'Pagada');
      if (propCuotas.length === 0) return;
      
      const propNegs = negociaciones.filter(n => n.id_propiedad === p.id);
      if (propNegs.length === 0) return;
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
      
      const cli = clientes.find(c => String(c.id) === String(neg.id_cliente));
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '';
      const cliRut = cli ? cli.rut : '';
      
      const proy = p.id_proyecto ? proyectos.find(pr => pr.id === p.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre) : '-';
      
      if (searchFilter && !cliNom.toLowerCase().includes(searchFilter) && !cliRut.toLowerCase().includes(searchFilter) && !(p.nombre || '').toLowerCase().includes(searchFilter)) return;
      
      propCuotas.forEach(ct => {
        if (!ct.fecha_vencimiento) return;
        const vDate = parseDdMmYyyy(ct.fecha_vencimiento);
        if (!vDate) return;
        
        const dt = new Date(vDate.year, vDate.month - 1, vDate.day);
        const isVencida = dt < now;
        
        if (estadoFilter === 'vencida' && !isVencida) return;
        if (estadoFilter === 'por_vencer' && isVencida) return;
        
        const diffTime = dt - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const monto = (ct.valor_cuota || 0) - (ct.valor_pagado || 0);
        
        filteredCuotas.push({
          vencimiento: ct.fecha_vencimiento,
          dt: dt,
          dias: diffDays,
          cliente: cliNom,
          clienteRut: cliRut,
          lote: p.nombre,
          proyecto: proyNom,
          concepto: ct.concepto || `Cuota ${ct.numero_cuota || ''}`,
          monto: monto,
          estado: isVencida ? 'Vencida' : 'Por Vencer'
        });
      });
    });
    
    // Sort by closest to due or most overdue
    filteredCuotas.sort((a,b) => a.dt - b.dt);
    
    if (filteredCuotas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding: 24px;">No se encontraron cuotas</td></tr>';
      return;
    }
    
    tbody.innerHTML = filteredCuotas.map(item => {
      let badge = item.estado === 'Vencida' ? 
        '<span class="status-badge" style="background: rgba(231,76,60,0.1); color: #e74c3c;">Vencida</span>' : 
        '<span class="status-badge" style="background: rgba(243,156,18,0.1); color: #f39c12;">Por Vencer</span>';
        
      return `<tr>
        <td>${item.vencimiento}</td>
        <td><strong style="color: ${item.dias < 0 ? '#e74c3c' : 'inherit'};">${Math.abs(item.dias)} ${item.dias < 0 ? 'días' : 'días'}</strong></td>
        <td>${item.cliente}<br><small style="color:var(--text-dim);">${item.clienteRut}</small></td>
        <td><strong>${item.lote}</strong></td>
        <td>${item.proyecto}</td>
        <td>${item.concepto}</td>
        <td><strong>${APP5T_Utils.formatMoneda(item.monto)}</strong></td>
        <td>${badge}</td>
      </tr>`;
    }).join('');
  }

  function _descargarExcelMisClientes() {
    let clientes = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('clientes') || [] : [];
    const negociaciones = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('negociaciones') || [] : [];
    
    // Si estamos en rol vendedor, filtrar por el vendedor activo
    const vendedores = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('vendedores') || [] : [];
    const vendActivo = _resolveActiveVendedor(vendedores);
    if (vendActivo) {
      const negsVend = negociaciones.filter(n => String(n.id_vendedor) === String(vendActivo.id));
      const clientIdsFromNegs = new Set(negsVend.map(n => String(n.id_cliente)));
      clientes = clientes.filter(c => String(c.id_vendedor) === String(vendActivo.id) || clientIdsFromNegs.has(String(c.id)));
    }

    if (clientes.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay clientes para exportar', 'warning');
      }
      return;
    }

    if (typeof APP5T_Excel !== 'undefined' && typeof APP5T_Excel.exportarClientes === 'function') {
      APP5T_Excel.exportarClientes(clientes);
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM para Excel Fallback
    const headers = ['Nombres', 'Apellidos', 'RUT', 'Email', 'Teléfono', 'Profesión', 'Dirección', 'Comuna', 'Estado Cliente', 'Fecha Registro', 'Notas'];
    csvContent += headers.join(';') + '\r\n';

    clientes.forEach(c => {
      const row = [
        c.nombres || '',
        c.apellidos || '',
        c.rut || '',
        c.email || '',
        c.telefono || '',
        c.profesion || '',
        c.direccion || '',
        c.comuna || '',
        c.estado_cliente || '',
        c.fecha_registro ? c.fecha_registro.split('T')[0] : '',
        (c.notas || '').replace(/(\r\n|\n|\r)/gm, ' ')
      ];
      csvContent += row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mis_clientes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function _descargarReporteCSV() {
    if (!lastFilteredInformes || lastFilteredInformes.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay datos para exportar en el reporte actual', 'warning');
      }
      return;
    }

    const mesSelect = document.getElementById('informes-filter-mes');
    const anioSelect = document.getElementById('informes-filter-anio');
    const mesNom = mesSelect && mesSelect.value !== 'all' ? mesSelect.options[mesSelect.selectedIndex].text : 'Todos';
    const anioNom = anioSelect && anioSelect.value !== 'all' ? anioSelect.value : 'Todos';

    // Si APP5T_Excel está disponible, exportar Libro Excel grado Directorio/Banco
    if (typeof APP5T_Excel !== 'undefined' && typeof APP5T_Excel.exportarOperaciones === 'function') {
      APP5T_Excel.exportarOperaciones(lastFilteredInformes, mesNom, anioNom);
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM Fallback
    const headers = [
      'Fecha Operación',
      'Proyecto',
      'Lote',
      'Cliente',
      'RUT Cliente',
      'Estado Lote',
      'Tipo Operación',
      'Valor Final Venta',
      'Pie / Anticipo',
      'Cant. Cuotas Pagadas',
      'Monto Cuotas Pagadas',
      'Cant. Cuotas por Pagar',
      'Monto Cuotas por Pagar',
      'Total Recibido (Caja)',
      'Total por Recibir (Cartera)'
    ];
    csvContent += headers.join(';') + '\r\n';

    lastFilteredInformes.forEach(item => {
      const p = item.propiedad || {};
      const n = item.negociacion || {};
      let tipoOp = 'Venta Tradicional';
      if (p.estado === 'Reservada') {
        tipoOp = 'Reserva';
      } else if (p.estado === 'Venta_Directa' || n.tipo_operacion === 'Venta_Directa' || n.id_proceso === 'Venta_Directa') {
        tipoOp = 'Venta Directa (Contado)';
      } else if (p.estado === 'Promesada') {
        tipoOp = 'Promesa de Compraventa';
      } else if (p.estado === 'Vendida' || p.estado === 'Escriturada') {
        const cantCtas = Number(n.cantidad_cuotas) || 0;
        tipoOp = cantCtas > 0 ? 'Venta a Plazo (Escriturada)' : 'Venta Definitiva (Contado)';
      } else if (n.tipo_operacion) {
        tipoOp = n.tipo_operacion;
      }

      const row = [
        item.fechaOperacion || '',
        item.proyectoNombre || '',
        p.nombre || '',
        item.clienteNombreCompleto || '',
        item.clienteRut || '',
        p.estado || '',
        tipoOp,
        item.valorVenta,
        item.pie,
        item.numCuotasPagadas,
        item.montoCuotasPagadas,
        item.numCuotasPendientes,
        item.montoCuotasPendientes,
        item.totalRecibido,
        item.totalPorRecibir
      ];
      
      const escapedRow = row.map(val => {
        let str = String(val ?? '');
        str = str.replace(/;/g, ',').replace(/\r?\n|\r/g, ' ');
        return str;
      });
      csvContent += escapedRow.join(';') + '\r\n';
    });
    
    const filename = `Reporte_Operaciones_${mesNom}_${anioNom}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function _descargarEstadoCuentaPDF() {
    const container = document.getElementById('informe-ctacte-statements');
    if (!container || !container.querySelector('.statement-card')) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay estados de cuenta generados para exportar.', 'warning');
      }
      return;
    }
    
    window.APP5T_PDF_EXPORTING = true;
    const element = container.querySelector('.statement-card');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.APP5T_PDF_EXPORTING = false;
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('Error al abrir ventana de impresión. Por favor verifique si tiene bloqueador de popups.', 'error');
      }
      return;
    }

    const css = `
      body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 25px; margin: 0; background: #fff; color: #1a1a1a; }
      .statement-card { background-color: #ffffff; color: #1a1a1a; padding: 0; border-radius: 0; box-shadow: none; }
      .statement-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .statement-title-group { display: flex; align-items: center; gap: 10px; }
      .statement-title { font-size: 1.15rem; font-weight: 700; color: #1a1a1a; text-transform: uppercase; }
      .statement-date-badge { font-size: 0.8rem; color: #555; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
      .statement-logo-img { height: 35px; object-fit: contain; }
      .statement-header-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
      .statement-header-item { display: flex; flex-direction: column; gap: 2px; }
      .statement-meta-label { font-size: 0.70rem; font-weight: 700; text-transform: uppercase; color: #0284c7; }
      .statement-meta-val { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
      .statement-meta-sub { font-size: 0.74rem; color: #64748b; }
      .statement-section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #2c3e50; border-bottom: 1px solid #eaeaea; padding-bottom: 8px; }
      .statement-table-wrapper { margin-bottom: 30px; }
      .statement-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      .statement-table th { background-color: #f8f9fa; color: #495057; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
      .statement-table td { padding: 10px; border-bottom: 1px solid #dee2e6; color: #333; }
      .statement-summary { background-color: #f8f9fa; padding: 20px; border-radius: 6px; max-width: 400px; margin-left: auto; }
      .statement-summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.95rem; }
      .statement-summary-row strong { color: #2c3e50; }
      .statement-summary-total { display: flex; justify-content: space-between; padding-top: 12px; margin-top: 12px; border-top: 2px solid #dee2e6; font-size: 1.1rem; font-weight: 700; color: #e74c3c; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: #fff; text-align: center; }
      @media print {
        @page { margin: 10mm; }
        body { padding: 0; }
      }
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Estado de Cuenta</title>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Release lock after a short delay to allow the new window to capture DOM snapshot
    setTimeout(function() { window.APP5T_PDF_EXPORTING = false; }, 1500);
  }

  function _descargarVentasPDF() {
    const container = document.getElementById('informe-ventas-detalle');
    if (!container || !container.querySelector('.statement-card')) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay detalles de ventas para exportar.', 'warning');
      }
      return;
    }
    
    window.APP5T_PDF_EXPORTING = true;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.APP5T_PDF_EXPORTING = false;
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('Error al abrir ventana de impresión. Por favor verifique si tiene bloqueador de popups.', 'error');
      }
      return;
    }

    const css = `
      body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 40px; margin: 0; background: #fff; color: #1a1a1a; }
      .statement-card { background-color: #ffffff; color: #1a1a1a; padding: 0; border-radius: 0; box-shadow: none; margin-bottom: 40px; page-break-after: always; }
      .statement-card:last-child { page-break-after: auto; }
      .statement-title { text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: 5px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
      .statement-date { text-align: center; font-size: 0.9rem; color: #666; margin-bottom: 24px; }
      .statement-header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eaeaea; }
      .statement-header-item { font-size: 0.9rem; }
      .statement-header-item strong { color: #444; display: inline-block; width: 140px; }
      .statement-section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #2c3e50; border-bottom: 1px solid #eaeaea; padding-bottom: 8px; }
      .statement-table-wrapper { margin-bottom: 30px; }
      .statement-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      .statement-table th { background-color: #f8f9fa; color: #495057; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
      .statement-table td { padding: 10px; border-bottom: 1px solid #dee2e6; color: #333; }
      .statement-summary { background-color: #f8f9fa; padding: 20px; border-radius: 6px; max-width: 400px; margin-left: auto; }
      .statement-summary-total { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: #e74c3c; }
      @media print {
        @page { margin: 10mm; }
        body { padding: 0; }
        .statement-card { margin-bottom: 0; }
      }
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Ventas por Vendedor</title>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        ${container.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(function() { window.APP5T_PDF_EXPORTING = false; }, 1500);
  }

  function _descargarCuotasPDF() {
    const tableContainer = document.querySelector('#report-cuotas-container .table-responsive');
    if (!tableContainer || tableContainer.querySelectorAll('tbody tr').length === 0 || tableContainer.innerHTML.includes('No se encontraron cuotas')) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay datos para exportar.', 'warning');
      }
      return;
    }

    window.APP5T_PDF_EXPORTING = true;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.APP5T_PDF_EXPORTING = false;
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('Error al abrir ventana de impresión. Por favor verifique si tiene bloqueador de popups.', 'error');
      }
      return;
    }
    
    const today = new Date();
    const todayStr = `${today.getDate().toString().padStart(2, '0')} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][today.getMonth()]} de ${today.getFullYear()}`;

    const css = `
      body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 40px; margin: 0; background: #fff; color: #1a1a1a; }
      .statement-title { text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: 5px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
      .statement-date { text-align: center; font-size: 0.9rem; color: #666; margin-bottom: 30px; }
      table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 20px; }
      th { background-color: #f8f9fa; color: #495057; font-weight: 600; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
      td { padding: 10px; border-bottom: 1px solid #dee2e6; color: #333; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; color: #fff; text-align: center; }
      @media print {
        @page { margin: 10mm; }
        body { padding: 0; }
      }
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Cuotas Vencidas / Por Vencer</title>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <div class="statement-title" style="margin-bottom: 4px; text-align: left;">CUOTAS VENCIDAS Y POR VENCER</div>
            <div class="statement-date" style="text-align: left;">Fecha del Informe: ${todayStr}</div>
          </div>
          <img src="../04_RECURSOS/logo5t.png" alt="5 Tierras" style="height: 60px; object-fit: contain;">
        </div>
        ${tableContainer.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(function() { window.APP5T_PDF_EXPORTING = false; }, 1500);
  }


  function _descargarReportePDF() {
    if (!lastFilteredInformes || lastFilteredInformes.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay datos para exportar en el reporte actual', 'warning');
      }
      return;
    }

    const mesSelect = document.getElementById('informes-filter-mes');
    const anioSelect = document.getElementById('informes-filter-anio');
    const proySelect = document.getElementById('informes-filter-proyecto');
    const mesNom = mesSelect && mesSelect.value !== 'all' ? mesSelect.options[mesSelect.selectedIndex].text : 'Todos';
    const anioNom = anioSelect && anioSelect.value !== 'all' ? anioSelect.value : 'Todos';
    const proyNom = proySelect && proySelect.value !== 'all' ? proySelect.options[proySelect.selectedIndex].text : 'Todos';

    const kpiOps = lastFilteredInformes.length;
    const kpiRecibido = lastFilteredInformes.reduce((sum, item) => sum + item.totalRecibido, 0);
    const kpiPendiente = lastFilteredInformes.reduce((sum, item) => sum + item.totalPorRecibir, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('Error al abrir ventana de impresión. Por favor verifique si tiene bloqueador de popups.', 'error');
      }
      return;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Operaciones - ${mesNom} / ${anioNom}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .title-area h1 {
            margin: 0 0 4px 0;
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
          }
          .title-area p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
          }
          .logo {
            font-weight: 800;
            font-size: 24px;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #3b82f6;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .meta-item {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            border-radius: 6px;
          }
          .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
          }
          .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px;
          }
          .kpi-card.blue {
            border-left: 4px solid #3b82f6;
          }
          .kpi-card.green {
            border-left: 4px solid #10b981;
          }
          .kpi-card.amber {
            border-left: 4px solid #f59e0b;
          }
          .kpi-card .kpi-label {
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kpi-card .kpi-val {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 8px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .amount {
            font-family: monospace;
            font-size: 11px;
            font-weight: 600;
            text-align: right;
          }
          th.amount {
            text-align: right;
          }
          .badge {
            display: inline-block;
            padding: 2px 5px;
            font-size: 9px;
            font-weight: 600;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .badge-promesada { background-color: #dbeafe; color: #1e40af; }
          .badge-venta_directa { background-color: #faf5ff; color: #6b21a8; }
          .badge-vendida { background-color: #d1fae5; color: #065f46; }
          
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            text-align: center;
            color: #94a3b8;
            font-size: 9px;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>Informe de Promesas y Escrituras</h1>
            <p>Reporte consolidado de control comercial y financiero</p>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="../04_RECURSOS/logo5t.png?v=20261031_2115" alt="5 Tierras" style="height:55px;object-fit:contain;">
            <div class="logo">5<span>TIERRAS</span></div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Mes</div>
            <div class="meta-value">${mesNom}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Año</div>
            <div class="meta-value">${anioNom}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Proyecto</div>
            <div class="meta-value">${proyNom}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Fecha Emisión</div>
            <div class="meta-value">${APP5T_Utils.fechaHoy()}</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card blue">
            <div class="kpi-label">Operaciones</div>
            <div class="kpi-val">${kpiOps}</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">Recibido (Caja)</div>
            <div class="kpi-val">${APP5T_Utils.formatMoneda(kpiRecibido)}</div>
          </div>
          <div class="kpi-card amber">
            <div class="kpi-label">Por Recibir (Cartera)</div>
            <div class="kpi-val">${APP5T_Utils.formatMoneda(kpiPendiente)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Lote</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>RUT</th>
              <th class="amount">Valor Venta</th>
              <th class="amount">Pie / Anticipo</th>
              <th class="amount">Cta. Cte. Pagado</th>
              <th class="amount">Total Recibido</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${lastFilteredInformes.map(item => {
              const p = item.propiedad;
              let badgeClass = 'badge-promesada';
              if (p.estado === 'Venta_Directa') badgeClass = 'badge-venta_directa';
              if (p.estado === 'Vendida') badgeClass = 'badge-vendida';
              
              return `
                <tr>
                  <td>${item.fechaOperacion || '-'}</td>
                  <td><strong>${p.nombre || ''}</strong></td>
                  <td>${item.proyectoNombre || ''}</td>
                  <td>${item.clienteNombreCompleto || '-'}</td>
                  <td>${item.clienteRut || '-'}</td>
                  <td class="amount">${APP5T_Utils.formatMoneda(item.valorVenta)}</td>
                  <td class="amount">${APP5T_Utils.formatMoneda(item.pie)}</td>
                  <td class="amount">${APP5T_Utils.formatMoneda(item.montoCuotasPagadas)}</td>
                  <td class="amount" style="color:#10b981;font-weight:700;">${APP5T_Utils.formatMoneda(item.totalRecibido)}</td>
                  <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento generado automáticamente por el sistema de gestión 5 Tierras. &copy; ${new Date().getFullYear()} 5 Tierras Ltda. Todos los derechos reservados.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  /* ── Quick action helpers (called from table buttons) ── */

  function _viewApproval(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const html = '<div id="modal-approval-form"></div>';
    
    // Título dinámico para evitar confusión si ya se aprobó
    const title = (prop.estado === 'Reservada' || prop.estado === 'Promesada') 
        ? 'Gestión de Reserva' 
        : 'Revisión de Aprobación';
        
    openModal(title, html);
    setTimeout(() => {
      const container = document.getElementById('modal-approval-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, activeRole, true); // true = isApprovalQueue
    }, 50);
  }

  function _aprobarReservaDirecta(idOrProp, event) {
    if (event) event.stopPropagation();
    let prop = APP5T_DB.getById('propiedades', idOrProp);
    let neg = null;

    if (prop) {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id));
      neg = negs && negs.length ? (negs.find(n => n.estado_avance === 'En Curso' || n.estado_avance === 'Pendiente' || n.estado_avance === 'Solicitada') || negs[negs.length - 1]) : null;
    } else {
      neg = APP5T_DB.getById('negociaciones', idOrProp);
      if (neg) {
        prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
      }
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad en la base de datos.', 'error');
      return;
    }

    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : 'Sin Proyecto';
    const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Cliente';

    let modLabel = 'la reserva';
    if (neg && (neg.tipo_operacion === 'Saldo_Precio' || neg.id_proceso === 'Saldo_Precio')) {
      modLabel = 'la Venta con Saldo de Precio (c/ Hipoteca)';
    } else if (neg && (neg.tipo_operacion === 'Venta_Directa' || neg.id_proceso === 'Venta_Directa')) {
      modLabel = 'la Venta Directa al Contado';
    }
    const confirmMsg = `¿Desea autorizar ${modLabel} del lote ${prop.nombre} (${proyNom}) para ${cliNom}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const activeUserNom = window.APP5T.getActiveUser();
      let dirs = APP5T_DB.getAll('directorio') || [];
      let dirAuth = dirs.find(d => {
        const dName = String(d.nombre || '').toLowerCase().trim();
        const activeName = String(activeUserNom).toLowerCase().trim();
        return dName === activeName || dName.includes(activeName) || activeName.includes(dName);
      }) || dirs.find(d => {
        const val = String(d.auth_reserva || '').trim().toUpperCase();
        return val === 'S' || val === 'SI' || val === 'SÍ' || val === 'TRUE' || val === '1';
      }) || dirs[0];

      const idDir = dirAuth ? dirAuth.id : 1;

      // Llamar a aprobarReserva que maneja todo: estado propiedad, negociación, cuotas y sync
      if (neg) {
        const apRes = APP5T_DB.aprobarReserva(neg.id, idDir);
        if (apRes && !apRes.success) {
          // Fallback: si la negociación ya estaba aprobada, al menos marcar propiedad
          APP5T_DB.update('propiedades', prop.id, {
            estado: 'Reservada',
            fecha_reserva: APP5T_Utils.fechaHoy()
          });
        }
      } else {
        // Sin negociación, solo marcar propiedad
        APP5T_DB.update('propiedades', prop.id, {
          estado: 'Reservada',
          fecha_reserva: APP5T_Utils.fechaHoy()
        });
      }

      let toastMsg = 'Reserva aprobada exitosamente';
      if (neg && (neg.tipo_operacion === 'Saldo_Precio' || neg.id_proceso === 'Saldo_Precio')) {
        toastMsg = 'Venta con Saldo de Precio aprobada exitosamente 🏛️';
      } else if (neg && (neg.tipo_operacion === 'Venta_Directa' || neg.id_proceso === 'Venta_Directa')) {
        toastMsg = 'Venta Directa aprobada exitosamente ⚡';
      }
      APP5T_Utils.showToast(toastMsg, 'success');
      
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
        APP5T_Sync.syncLocalToRemote().catch(() => {});
      } else if (typeof APP5T_Cloud !== 'undefined') {
        APP5T_Cloud.syncAll().catch(() => {});
      }
      refreshAll();
      _renderAprobaciones();
      _switchMesaTab(2);
    } catch (err) {
      console.error(err);
      alert(`Error al aprobar reserva: ${err.message}`);
    }
  }

  
  function _revertirVentaDirecta(idOrProp, event) {
    if (event) event.stopPropagation();
    let prop = APP5T_DB.getById('propiedades', idOrProp);
    if (!prop) {
      const allProps = APP5T_DB.getAll('propiedades') || [];
      prop = allProps.find(p => String(p.id) === String(idOrProp) || String(p.nombre).toLowerCase() === String(idOrProp).toLowerCase());
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad para revertir.', 'error');
      return;
    }

    const role = (window.APP5T && typeof window.APP5T.getActiveRole === 'function') ? window.APP5T.getActiveRole() : 'gerente';
    if (role !== 'gerente' && role !== 'administrador') {
      APP5T_Utils.showToast('Acción denegada: Solo Gerencia o Administración pueden revertir ventas.', 'error');
      return;
    }

    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '5 Tierras') : '5 Tierras';

    const confirmMsg = `⚠️ REVERSIÓN OPERATIVA DE LOTE — 5 TIERRAS\n\n¿Desea revertir la operación del lote ${prop.nombre} (${proyNom})?\n\nEfectos automáticos:\n1. El lote volverá a estado DISPONIBLE en inventario y mapas.\n2. Se anularán las cuotas generadas en Cuenta Corriente.\n3. Se cancelarán los trámites legales de promesa o escrituración.\n4. Se registrará la auditoría con su usuario y motivo.\n\nIngrese el motivo obligatorio:`;

    const motivo = prompt(confirmMsg, 'Error operativo en capacitación / Digitacion incorrecta');
    if (!motivo || !motivo.trim()) {
      APP5T_Utils.showToast('Reversión cancelada: Se requiere indicar un motivo obligatorio.', 'info');
      return;
    }

    try {
      const res = APP5T_DB.revertirVentaLote(prop.id, motivo.trim());
      if (!res || !res.success) {
        APP5T_Utils.showToast(`Error al revertir lote: ${res ? res.error : 'Desconocido'}`, 'error');
        return;
      }

      APP5T_Utils.showToast(`Lote ${prop.nombre} revertido exitosamente. Ahora está DISPONIBLE 🔄`, 'success');

      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
        APP5T_Sync.syncLocalToRemote().catch(() => {});
      }

      refreshAll();
      if (window.APP5T && typeof window.APP5T.closeModal === 'function') {
        window.APP5T.closeModal(true);
      }
    } catch(err) {
      console.error('Error en _revertirVentaDirecta:', err);
      alert(`Error al revertir operación: ${err.message}`);
    }
  }

  function _rechazarReservaDirecta(idOrProp, event) {
    if (event) event.stopPropagation();
    let prop = APP5T_DB.getById('propiedades', idOrProp);
    let neg = null;

    if (prop) {
      const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id));
      neg = negs && negs.length ? (negs.find(n => n.estado_avance === 'En Curso' || n.estado_avance === 'Aprobado' || n.estado_avance === 'Pendiente') || negs[negs.length - 1]) : null;
    } else {
      neg = APP5T_DB.getById('negociaciones', idOrProp);
      if (neg) prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    }

    if (!prop || !neg) {
      APP5T_Utils.showToast('No se encontró la reserva o propiedad para rechazar.', 'error');
      return;
    }

    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : 'Sin Proyecto';
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';

    const motivo = prompt(`¿Desea cancelar/rechazar la negociación del lote ${prop.nombre} (Proyecto: ${proyNom}) para el cliente ${cliNom}?\n\nPor favor, ingrese el motivo:`, 'Precio o condiciones no aprobadas');
    if (motivo === null) return;

    try {
      const res = APP5T_DB.rechazarReserva(neg.id, motivo || 'Sin motivo especificado');
      if (res && !res.success) {
        APP5T_Utils.showToast(`Error al cancelar negociación: ${res.error || 'Desconocido'}`, 'error');
        return;
      }
      APP5T_Utils.showToast('Negociación cancelada y lote disponible', 'warning');
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
        APP5T_Sync.syncLocalToRemote().catch(() => {});
      }
      refreshAll();
    } catch (err) {
      console.error(err);
      alert(`Error al cancelar negociación: ${err.message}`);
    }
  }

  function _signPromesa(idOrNeg, event) {
    if (event) event.stopPropagation();
    let neg = APP5T_DB.getById('negociaciones', idOrNeg);
    let prop = null;

    if (neg) {
      prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    } else {
      prop = APP5T_DB.getById('propiedades', idOrNeg);
      if (prop) {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
        neg = negs.find(n => n.estado_avance === 'Aprobado') || negs[0];
      }
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad asociada.', 'error');
      return;
    }

    const hoyISO = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthISO = nextMonth.toISOString().split('T')[0];

    const esVentaDirecta = neg && neg.id_proceso === 'Venta_Directa';
    const cuotasVal = (neg && neg.cantidad_cuotas) ? neg.cantidad_cuotas : 12;

    const html = `
      <div id="modal-promesa-form" style="padding: 10px;">
        <form id="frm-promesa-inline" style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Propiedad</label>
            <input type="text" class="form-control" value="${prop.nombre || ('Lote ' + prop.id)}" disabled>
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">${esVentaDirecta ? 'Fecha Venta Directa' : 'Fecha Promesa'}</label>
            <input type="date" id="prom-fecha" class="form-control" value="${hoyISO}">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Notaría</label>
            <input type="text" id="prom-notaria" class="form-control" placeholder="Ej: Notaría San Carlos">
          </div>
          ` + (esVentaDirecta ? `
          <input type="hidden" id="prom-cuotas" value="1">
          <div style="background:#f1f5f9; border-radius:8px; padding:10px 14px; border-left:3px solid #3b82f6; font-size:0.82rem; color:#64748b; font-weight:600;"><i class="fa-solid fa-circle-info" style="color:#3b82f6;"></i>&nbsp; Venta Directa &mdash; Pago de contado (sin cuotas)</div>
          ` : `
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Cantidad de Cuotas *</label>
            <input type="number" id="prom-cuotas" class="form-control" value="${cuotasVal}" min="1">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Vencimiento Primera Cuota *</label>
            <input type="date" id="prom-venc-cuota" class="form-control" value="${nextMonthISO}">
          </div>
          `) + `
          <button type="button" id="btn-confirm-promesa" class="btn btn-primary" style="margin-top:8px; width:100%; font-size:1rem; font-weight:700;">
            <i class="fa-solid fa-file-contract"></i> Confirmar Firma de ${esVentaDirecta ? 'Venta Directa' : 'Promesa'}
          </button>
        </form>
      </div>`;

    openModal('Firmar Promesa de Compraventa', html);

    setTimeout(() => {
      const btn = document.getElementById('btn-confirm-promesa');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const cantCuotas = esVentaDirecta ? 1 : (parseInt(document.getElementById('prom-cuotas').value, 10) || 12);
        const toDdMmYyyy = s => {
          if (!s) return '';
          const p = s.split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
        };

        // Llamar a firmarPromesa que genera cuotas automáticamente y sincroniza
        if (neg) {
          const fechaVencCuota = esVentaDirecta ? '' : (document.getElementById('prom-venc-cuota') ? document.getElementById('prom-venc-cuota').value : '');
          const promData = {
            valor_final: neg.valor_final || prop.valor_final,
            pie: neg.pie || neg.monto_reserva || 0,
            cantidad_cuotas: cantCuotas,
            fecha_vencimiento_cuota: toDdMmYyyy(fechaVencCuota),
            fecha_promesa: toDdMmYyyy(document.getElementById('prom-fecha').value),
            fecha_fin_promesa: toDdMmYyyy(document.getElementById('prom-fecha').value)
          };
          const fRes = APP5T_DB.firmarPromesa(neg.id, promData);
          if (fRes && !fRes.success) {
            APP5T_Utils.showToast('Error al firmar promesa: ' + (fRes.error || 'Desconocido'), 'error');
            return;
          }
          // Marcar campos adicionales que firmarPromesa no maneja
          APP5T_DB.update('negociaciones', neg.id, {
            autorizado_promesa: true,
            promesa_firmada: true,
            notaria: document.getElementById('prom-notaria').value
          });
        } else {
          // Sin negociación, solo actualizar propiedad
          APP5T_DB.update('propiedades', prop.id, {
            estado: 'Promesada',
            fecha_fin_promesa: toDdMmYyyy(document.getElementById('prom-fecha').value)
          });
        }

        APP5T_Utils.showToast('¡Promesa firmada exitosamente!', 'success');
        
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
          APP5T_Sync.syncLocalToRemote().catch(() => {});
        }
        closeModal();
        refreshAll();
      });
    }, 80);
  }

  function _signEscritura(idPropOrNeg, event) {
    if (event) event.stopPropagation();
    let neg = APP5T_DB.getById('negociaciones', idPropOrNeg);
    let prop = null;

    if (neg) {
      prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    } else {
      prop = APP5T_DB.getById('propiedades', idPropOrNeg);
      if (prop) {
        const negs = APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id)) || [];
        neg = negs.find(n => n.estado_avance === 'Aprobado') || negs[negs.length - 1] || negs[0];
      }
    }

    if (!prop) {
      APP5T_Utils.showToast('No se encontró la propiedad asociada.', 'error');
      return;
    }

    const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos || ''}` : 'Sin Cliente';
    const cliRut = cli ? (cli.rut || '-') : '-';
    const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || 'Sin Proyecto') : 'Sin Proyecto';
    const valorFmt = APP5T_Utils.formatMoneda(neg ? (neg.valor_final || prop.valor_final || 0) : (prop.valor_final || 0));
    const hoyISO = new Date().toISOString().split('T')[0];

    const html = `
      <div id="modal-escritura-form" style="padding: 10px;">
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Lote / Proyecto</span><br>
              <strong style="color: var(--text-dark, #1e293b); font-size: 1.05rem;">${prop.nombre || `Lote ${prop.id}`}</strong><br>
              <small style="color: var(--text-dim);">${proyNom}</small>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Cliente Comprador</span><br>
              <strong style="color: var(--text-dark, #1e293b); font-size: 0.95rem;">${cliNom}</strong><br>
              <small style="color: var(--text-dim);">RUT: ${cliRut}</small>
            </div>
          </div>
          <div style="margin-top: 10px; border-top: 1px solid rgba(16,185,129,0.2); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; font-weight: 600; color: #047857;">Precio Venta Definitiva:</span>
            <strong style="font-size: 1.1rem; color: #047857;">${valorFmt}</strong>
          </div>
        </div>

        <form id="frm-escritura-inline" style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Fecha Escritura Pública *</label>
            <input type="date" id="esc-fecha" class="form-control" value="${hoyISO}" required>
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Notaría de Inscripción *</label>
            <input type="text" id="esc-notaria" class="form-control" placeholder="Ej: Notaría San Carlos / Notaría Chillán" required>
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Nº Repertorio / Folio Notarial</label>
            <input type="text" id="esc-cbr" class="form-control" placeholder="Ej: Rep. 4520-2026 / Fs. 120 N° 85">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Enlace Expediente Digital (Drive)</label>
            <input type="url" id="esc-url" class="form-control" placeholder="https://drive.google.com/...">
          </div>

          <button type="button" id="btn-confirm-escritura" class="btn btn-success" style="margin-top:8px; width:100%; font-size:1rem; font-weight:700; padding:10px;">
            <i class="fa-solid fa-gavel"></i> Confirmar y Registrar Escrituración Definitiva
          </button>
        </form>
      </div>`;

    openModal('Firmar Escritura de Venta', html);

    setTimeout(() => {
      const btn = document.getElementById('btn-confirm-escritura');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const fechaVal = document.getElementById('esc-fecha').value;
        const notariaVal = document.getElementById('esc-notaria').value;
        const cbrVal = document.getElementById('esc-cbr').value;
        const urlVal = document.getElementById('esc-url').value;

        const toDdMmYyyy = s => {
          if (!s) return '';
          const p = s.split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
        };

        // 1. Actualizar estado de la propiedad a Vendida
        APP5T_DB.update('propiedades', prop.id, {
          estado: 'Vendida',
          fecha_escrituracion: toDdMmYyyy(fechaVal)
        });

        // 2. Actualizar negociación
        if (neg) {
          APP5T_DB.update('negociaciones', neg.id, {
            estado_avance: 'Vendida',
            escritura_firmada: true,
            estado_escrituracion: 'Firmada',
            fecha_escritura: toDdMmYyyy(fechaVal),
            notaria: notariaVal,
            cbr_folio: cbrVal,
            url_escritura: urlVal
          });
        }

        APP5T_Utils.showToast('¡Escritura de venta registrada exitosamente! El lote ha pasado a estado VENDIDO.', 'success');

        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.syncLocalToRemote === 'function') {
          APP5T_Sync.syncLocalToRemote().catch(() => {});
        }
        closeModal();
        refreshAll();
      });
    }, 80);
  }

  function _signEscrituraDirecta(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const neg = (APP5T_DB.query('negociaciones', n => n && String(n.id_propiedad) === String(prop.id) && n.id_proceso === 'Venta_Directa') || [])[0];
    if (!neg) { APP5T_Utils.showToast('No se encontró negociación de Venta Directa para este lote.', 'error'); return; }
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';
    const valorFmt = APP5T_Utils.formatMoneda(neg.valor_final || 0);
    const hoy = APP5T_Utils.fechaHoy();

    openModal('Registrar Escrituración - Venta Directa', `
      <div style="padding:4px;">
        <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:8px;padding:12px 16px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:0.82rem;color:var(--text-dim);">Lote / Proyecto</p>
          <p style="margin:0;font-weight:700;color:#ffffff;">${prop.nombre}</p>
          <p style="margin:4px 0 0;font-size:0.85rem;color:var(--accent-purple,#8b5cf6);"><i class="fa-solid fa-bolt"></i> Venta Directa aprobada</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div><span style="font-size:0.78rem;color:var(--text-dim);">Cliente</span><br><strong style="color:#ffffff;">${cliNom}</strong></div>
          <div><span style="font-size:0.78rem;color:var(--text-dim);">Valor Total</span><br><strong style="color:#2ecc71;">${valorFmt}</strong></div>
        </div>
        <form id="frm-escritura-directa">
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--text-dim);display:block;margin-bottom:5px;">Fecha Escritura *</label>
            <input type="text" id="ed-fecha" class="form-control" value="${hoy}" placeholder="dd/mm/aaaa">
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--text-dim);display:block;margin-bottom:5px;">Nº CBR / Folio</label>
            <input type="text" id="ed-cbr" class="form-control" placeholder="Ej: 2025-12345">
          </div>
          <div class="form-group" style="margin-bottom:10px;">
            <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--text-dim);display:block;margin-bottom:5px;">URL Escritura</label>
            <input type="url" id="ed-url" class="form-control" placeholder="https://...">
          </div>
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:var(--text-dim);display:block;margin-bottom:5px;">Método de Pago</label>
            <select id="ed-metodo" class="form-control">
              <option>Transferencia</option><option>Vale Vista</option><option>Efectivo</option><option>Depósito</option><option>Cheque</option><option>Contado</option>
            </select>
          </div>
          <button type="submit" class="btn btn-danger" style="width:100%;font-size:1rem;"><i class="fa-solid fa-gavel"></i> Confirmar Escrituración</button>
        </form>
      </div>
    `);
    setTimeout(() => {
      const frm = document.getElementById('frm-escritura-directa');
      if (!frm) return;
      frm.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
          fecha_escritura: document.getElementById('ed-fecha').value,
          cbr:             document.getElementById('ed-cbr').value,
          url_escritura:   document.getElementById('ed-url').value,
          metodo_pago:     document.getElementById('ed-metodo').value
        };
        const res = APP5T_DB.firmarEscrituraDirecta(neg.id, data);
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error: ${res.error}`, 'error');
          return;
        }
        
        APP5T_Utils.showToast('✅ Escrituración registrada. Lote marcado como Vendido.', 'success');
        
        // Use the local closeModal function directly to avoid any context issues
        closeModal(true);
        
        if (typeof refreshAll === 'function') refreshAll();
        else if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
      });
    }, 200); // Increased timeout slightly to guarantee DOM is ready
  }

  function _pagarTotalDirecto(idCtaCte) {
    const cta = APP5T_DB.getById('cuenta_corriente', idCtaCte);
    if (!cta) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Cuota no encontrada', 'error');
      return;
    }
    const valorPactado = Number(cta.valor_cuota) || 0;
    const nroCuota = cta.cuota_nro || '';
    const valorFmt = typeof APP5T_Utils !== 'undefined' ? APP5T_Utils.formatMoneda(valorPactado) : `$${valorPactado}`;

    if (!confirm(`¿Confirmar el Pago Total de la Cuota #${nroCuota} por ${valorFmt}?`)) return;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const hoyStr = `${d}/${m}/${y}`;

    const updateData = {
      valor_pagado: valorPactado,
      estado_cuota: 'Pagada',
      fecha_pago: cta.fecha_pago || hoyStr,
      metodo_pago: cta.metodo_pago || 'Transferencia'
    };

    const res = APP5T_DB.update('cuenta_corriente', cta.id, updateData);
    if (res && !res.success) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Error al registrar pago: ' + res.error, 'error');
      return;
    }

    if (typeof APP5T_Utils !== 'undefined') {
      APP5T_Utils.showToast(`Cuota #${nroCuota} marcada como Pagada (${valorFmt})`, 'success');
    }
    if (typeof refreshAll === 'function') refreshAll();
    else if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
  }

  function _payCuota(idCtaCte) {
    _editCuota(idCtaCte);
  }

  function _editCuota(idCtaCte) {
    const cta = APP5T_DB.getById('cuenta_corriente', idCtaCte);
    if (!cta) {
      if (typeof APP5T_Utils !== 'undefined') APP5T_Utils.showToast('Cuota no encontrada', 'error');
      return;
    }
    const prop = cta.id_propiedad ? APP5T_DB.getById('propiedades', cta.id_propiedad) : null;
    const loteNom = prop ? prop.nombre : (`Lote ${cta.id_propiedad || ''}`);
    const html = '<div id="modal-matriz-cuotas"></div>';
    openModal(`Matriz de Cuotas Dinámicas — ${loteNom}`, html);
    setTimeout(() => {
      const container = document.getElementById('modal-matriz-cuotas');
      if (container && typeof APP5T_Forms !== 'undefined') {
        if (APP5T_Forms.renderMatrizCuotasDinamicas) {
          APP5T_Forms.renderMatrizCuotasDinamicas(container, cta);
        } else if (APP5T_Forms.renderEditarCuotaForm) {
          APP5T_Forms.renderEditarCuotaForm(container, cta);
        }
      }
    }, 50);
  }

  function _showActivarCtaCteModal(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const html = '<div id="modal-activar-ctacte-form"></div>';
    openModal('Activar Cuenta Corriente', html);
    setTimeout(() => {
      const container = document.getElementById('modal-activar-ctacte-form');
      if (container) APP5T_Forms.renderActivarCtaCteForm(container, neg);
    }, 50);
  }

  function unlockAdmin() {
    if (adminUnlocked) return;
    adminUnlocked = true;
    _buildSidebar(activeRole);
    if (typeof APP5T_Utils !== 'undefined') {
      APP5T_Utils.showToast('Consola de Administración General desbloqueada', 'success');
    }
  }

  /* ══════════════════════════════════════════════════════
     ADMINISTRATION SETTINGS PANEL (DYNAMIC CONSOLE)
     ══════════════════════════════════════════════════════ */
  let _localPermsMatrix = [];

  async function _renderSettingsPermissionsMatrix() {
    const tbody = document.getElementById('tbody-permissions-matrix');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin"></i> Cargando matriz de gobernanza...</td></tr>';
    
    let perms = [];
    if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.getPermissionsMatrix === 'function') {
      try {
        perms = await APP5T_Sync.getPermissionsMatrix();
      } catch(e) {
        console.warn('APP5T: Error al obtener permisos desde Supabase:', e);
      }
    }
    
    if (!perms || perms.length === 0) {
      const rawPerms = sessionStorage.getItem('app5t_permisos') || localStorage.getItem('app5t_permisos') || '[]';
      try {
        perms = JSON.parse(rawPerms);
      } catch(e) {
        perms = [];
      }
    }
    
    _localPermsMatrix = perms;
    
    if (_localPermsMatrix.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se cargaron los permisos del sistema</td></tr>';
      return;
    }
    
    // Immediately synchronize UI, layout and sidebar with the fresh permissions from Supabase
    sessionStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
    localStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
    evaluarPermisosYRenderizar(_localPermsMatrix, activeRole);
    if (typeof _buildSidebar === 'function') _buildSidebar(activeRole);
    if (typeof _buildMobileNav === 'function') _buildMobileNav(activeRole);
    
    tbody.innerHTML = _localPermsMatrix.map(p => {
      const permId = p.ID_Permiso !== undefined ? p.ID_Permiso : p.id_permiso;
      const modName = p.Componente_Modulo || p.componente_modulo || '';
      const desc = p.Descripcion || p.descripcion || '';
      const accVend = (p.Acceso_Vendedor ?? p.acceso_vendedor) === true || String(p.Acceso_Vendedor ?? p.acceso_vendedor).toUpperCase() === 'TRUE';
      const accGer = (p.Acceso_Gerencia ?? p.acceso_gerencia) === true || String(p.Acceso_Gerencia ?? p.acceso_gerencia).toUpperCase() === 'TRUE';
      const accAdmin = (p.Acceso_Administracion ?? p.acceso_administracion) === true || String(p.Acceso_Administracion ?? p.acceso_administracion).toUpperCase() === 'TRUE';
      
      return `
        <tr data-perm-id="${permId}" data-componente="${modName}">
          <td style="font-weight: 600; color: var(--text-white);">${modName}</td>
          <td style="color: var(--text-dim); font-size: 0.85rem;">${desc}</td>
          <td style="text-align: center;">
            <input type="checkbox" class="perm-checkbox" data-role="Vendedor" ${accVend ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
          </td>
          <td style="text-align: center;">
            <input type="checkbox" class="perm-checkbox" data-role="Gerencia" ${accGer ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
          </td>
          <td style="text-align: center;">
            <input type="checkbox" class="perm-checkbox" data-role="Administracion" ${accAdmin ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
          </td>
        </tr>
      `;
    }).join('');
    
    // Attach change listeners to live update _localPermsMatrix AND sidebar in real-time
    tbody.querySelectorAll('.perm-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const row = chk.closest('tr');
        const permId = Number(row.getAttribute('data-perm-id'));
        const role = chk.getAttribute('data-role');
        const isChecked = chk.checked;
        
        const perm = _localPermsMatrix.find(p => Number(p.ID_Permiso ?? p.id_permiso) === permId);
        if (perm) {
          perm['Acceso_' + role] = isChecked;
          perm['acceso_' + role.toLowerCase()] = isChecked;
        }

        // Live reflection in storage and sidebar
        sessionStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
        localStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
        evaluarPermisosYRenderizar(_localPermsMatrix, activeRole);
        if (typeof _buildSidebar === 'function') _buildSidebar(activeRole);
        if (typeof _buildMobileNav === 'function') _buildMobileNav(activeRole);
      });
    });
  }

  async function _saveSettingsPermissionsMatrix() {
    const saveBtn = document.getElementById('btn-save-permissions');
    if (!saveBtn) return;
    
    const tbody = document.getElementById('tbody-permissions-matrix');
    if (!tbody) return;

    const userSession = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
    if (!userSession) return;
    const adminUser = JSON.parse(userSession);
    
    const originalContent = saveBtn.innerHTML;
    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
      
      // Read state directly from DOM checkboxes to prevent any dropped events
      const rows = tbody.querySelectorAll('tr[data-perm-id]');
      const updatedPerms = [];
      rows.forEach(tr => {
        const id = Number(tr.getAttribute('data-perm-id'));
        const existing = _localPermsMatrix.find(p => Number(p.ID_Permiso ?? p.id_permiso) === id) || {};
        const chkVend = tr.querySelector('.perm-checkbox[data-role="Vendedor"]');
        const chkGer = tr.querySelector('.perm-checkbox[data-role="Gerencia"]');
        const chkAdmin = tr.querySelector('.perm-checkbox[data-role="Administracion"]');
        
        const isVend = chkVend ? chkVend.checked : false;
        const isGer = chkGer ? chkGer.checked : false;
        const isAdmin = chkAdmin ? chkAdmin.checked : false;
        
        const modName = existing.Componente_Modulo || existing.componente_modulo || '';
        const desc = existing.Descripcion || existing.descripcion || '';
        
        updatedPerms.push({
          ...existing,
          ID_Permiso: id,
          id_permiso: id,
          Componente_Modulo: modName,
          componente_modulo: modName,
          Descripcion: desc,
          descripcion: desc,
          Acceso_Vendedor: isVend,
          acceso_vendedor: isVend,
          Acceso_Gerencia: isGer,
          acceso_gerencia: isGer,
          Acceso_Administracion: isAdmin,
          acceso_administracion: isAdmin
        });
      });
      
      if (updatedPerms.length > 0) {
        _localPermsMatrix = updatedPerms;
      }
      
      // Always persist locally to both storage layers immediately
      sessionStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
      localStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
      
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.updatePermissionsMatrix === 'function') {
        const res = await APP5T_Sync.updatePermissionsMatrix(_localPermsMatrix, adminUser.nombre || adminUser.rut);
        if (res && res.success) {
          APP5T_Utils.showToast('Matriz de gobernanza guardada con éxito en la nube', 'success');
        } else {
          APP5T_Utils.showToast(res && res.error ? res.error : 'Guardado localmente (sin conexión nube)', 'warning');
        }
      } else {
        APP5T_Utils.showToast('Guardado localmente', 'success');
      }
      
      // Re-evaluate permissions immediately for current user / role
      evaluarPermisosYRenderizar(_localPermsMatrix, adminUser.rol || activeRole);
      
      // Rebuild sidebar and mobile navigation
      if (typeof _buildSidebar === 'function') {
        _buildSidebar(activeRole);
      }
      if (typeof _buildMobileNav === 'function') {
        _buildMobileNav(activeRole);
      }
    } catch (err) {
      console.error(err);
      APP5T_Utils.showToast(`Error al guardar: ${err.message}`, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalContent;
    }
  }

  async function _renderSettingsUsersList() {
    const tbody = document.getElementById('tbody-users-list');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>';
    
    try {
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.getUsersList === 'function') {
        const res = await APP5T_Sync.getUsersList('Administracion');
        if (res && res.success) {
          const list = res.usuarios || [];
          if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
            return;
          }
          
          tbody.innerHTML = list.map(u => `
            <tr>
              <td style="font-weight: 600; color: var(--text-white);">${u.RUT_Usuario}</td>
              <td>${u.Nombre}</td>
              <td><span class="tag tag-${mapRole(u.Rol)}">${u.Rol}</span></td>
              <td><span class="tag tag-${u.Estado === 'Activo' ? 'success' : 'danger'}">${u.Estado}</span></td>
              <td style="text-align: right; white-space: nowrap;">
                <button class="btn btn-sm btn-primary btn-edit-user" data-rut="${u.RUT_Usuario}" data-nombre="${u.Nombre}" data-rol="${u.Rol}" data-estado="${u.Estado}"><i class="fa-solid fa-user-pen"></i> Editar</button>
                <button class="btn btn-sm btn-danger btn-delete-user" data-rut="${u.RUT_Usuario}"><i class="fa-solid fa-user-minus"></i> Eliminar</button>
              </td>
            </tr>
          `).join('');
          
          // Bind edit buttons
          tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => {
              const uData = {
                RUT_Usuario: btn.getAttribute('data-rut'),
                Nombre: btn.getAttribute('data-nombre'),
                Rol: btn.getAttribute('data-rol'),
                Estado: btn.getAttribute('data-estado')
              };
              _openUserModal(uData);
            });
          });
          
          // Bind delete buttons
          tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
              const rut = btn.getAttribute('data-rut');
              _deleteUser(rut);
            });
          });
        } else {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${res.error || 'No autorizado'}</td></tr>`;
        }
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Módulo de sincronización no disponible</td></tr>';
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error de red: ${err.message}</td></tr>`;
    }
  }

  function _openUserModal(userData = null) {
    const isEdit = !!userData;
    const title = isEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario';
    
    const html = `
      <form id="form-user-edit" style="display: flex; flex-direction: column; gap: 16px; margin: 0;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">RUT Usuario</label>
          <input type="text" id="user-edit-rut" value="${isEdit ? userData.RUT_Usuario : ''}" ${isEdit ? 'disabled' : ''} placeholder="11.111.111-1" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-white); font-family: 'Inter', sans-serif;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Nombre Completo</label>
          <input type="text" id="user-edit-nombre" value="${isEdit ? userData.Nombre : ''}" placeholder="Juan Pérez" required style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-white); font-family: 'Inter', sans-serif;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Contraseña ${isEdit ? '(dejar en blanco para no modificar)' : ''}</label>
          <input type="password" id="user-edit-pass" placeholder="${isEdit ? '••••••••' : 'Contraseña'}" ${isEdit ? '' : 'required'} style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-white); font-family: 'Inter', sans-serif;">
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Rol del Sistema</label>
            <select id="user-edit-rol" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-white); cursor: pointer; font-family: 'Inter', sans-serif;">
              <option value="Vendedor" ${isEdit && getRoleKey(userData.Rol) === 'Vendedor' ? 'selected' : ''}>Vendedor</option>
              <option value="Gerencia" ${isEdit && getRoleKey(userData.Rol) === 'Gerencia' ? 'selected' : ''}>Gerencia</option>
              <option value="Administracion" ${isEdit && getRoleKey(userData.Rol) === 'Administracion' ? 'selected' : ''}>Administración</option>
            </select>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Estado</label>
            <select id="user-edit-estado" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); color: var(--text-white); cursor: pointer; font-family: 'Inter', sans-serif;">
              <option value="Activo" ${isEdit && userData.Estado === 'Activo' ? 'selected' : ''}>Activo</option>
              <option value="Inactivo" ${isEdit && userData.Estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 15px; display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" onclick="if(window.APP5T && window.APP5T.closeModal) { window.APP5T.closeModal(true); } const m = document.getElementById('action-modal'); if(m) { m.classList.remove('active', 'visible'); }">Cancelar</button>
          <button type="submit" class="btn btn-success">Guardar Usuario</button>
        </div>
      </form>
    `;
    
    openModal(title, html);
    
    // Attach submit listener
    const form = document.getElementById('form-user-edit');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        
        const rutVal = document.getElementById('user-edit-rut').value.trim();
        const nameVal = document.getElementById('user-edit-nombre').value.trim();
        const passVal = document.getElementById('user-edit-pass').value;
        const rolVal = document.getElementById('user-edit-rol').value;
        const estadoVal = document.getElementById('user-edit-estado').value;
        
        const adminSession = JSON.parse(sessionStorage.getItem('app5t_user')) || { nombre: 'Administrador', rut: '', rol: 'Administracion' };
        
        const payload = {
          RUT_Usuario: rutVal,
          Nombre: nameVal,
          Contraseña: passVal,
          Rol: rolVal,
          Estado: estadoVal
        };
        
        try {
          APP5T_Utils.showToast('Guardando cambios de usuario...', 'info');
          const res = await APP5T_Sync.updateUserRecord(payload, 'Administracion', adminSession.nombre);
          if (res && res.success) {
            APP5T_Utils.showToast('Usuario guardado exitosamente', 'success');
            closeModal(true);
            _renderSettingsUsersList();
          } else {
            APP5T_Utils.showToast(res.error || 'Error al guardar usuario', 'error');
          }
        } catch (err) {
          console.error(err);
          APP5T_Utils.showToast(`Error al guardar: ${err.message}`, 'error');
        }
      });
    }
  }

  async function _deleteUser(rut) {
    const adminSession = JSON.parse(sessionStorage.getItem('app5t_user')) || { nombre: 'Administrador', rut: '', rol: 'Administracion' };
    
    if (rut === adminSession.rut) {
      APP5T_Utils.showToast('No puede eliminarse a sí mismo mientras está logueado', 'warning');
      return;
    }
    
    if (!confirm(`¿Está seguro de que desea eliminar permanentemente al usuario con RUT ${rut}?`)) {
      return;
    }
    
    try {
      APP5T_Utils.showToast('Eliminando usuario...', 'info');
      const res = await APP5T_Sync.deleteUserRecord(rut, 'Administracion', adminSession.nombre);
      if (res && res.success) {
        APP5T_Utils.showToast('Usuario eliminado exitosamente', 'success');
        _renderSettingsUsersList();
      } else {
        APP5T_Utils.showToast(res.error || 'Error al eliminar usuario', 'error');
      }
    } catch (err) {
      console.error(err);
      APP5T_Utils.showToast(`Error al eliminar: ${err.message}`, 'error');
    }
  }

  /* ══════════════════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════════════════ */
  function _init() {
    // 1. Initialize DB
    try {
      if (typeof APP5T_DB !== 'undefined') {
        APP5T_DB.init();
        // Auto-link Google Drive lot folders from official catalog
        if (typeof window.APP5T_DRIVE_CATALOG !== 'undefined' && typeof window.APP5T_DRIVE_CATALOG.populateDatabaseUrls === 'function') {
          window.APP5T_DRIVE_CATALOG.populateDatabaseUrls();
        }
      }
    } catch (e) {
      console.error('APP5T: Error initializing DB:', e);
    }

    // 2. Configure & init sync
    try {
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_CONFIG !== 'undefined') {
        APP5T_Sync.configure(APP5T_CONFIG);
        APP5T_Sync.init();
      }
    } catch (e) {
      console.error('APP5T: Error initializing Sync:', e);
    }

    // 3. Force Sync button handler
    const forceSyncBtn = document.getElementById('btn-force-sync');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', () => {
        if (confirm('¿Desea forzar una sincronización completa? Se limpiará la memoria local y se descargarán los datos reales de internet.')) {
          localStorage.removeItem('app5t_db_version');
          localStorage.removeItem('app5t_sync_pending');
          window.location.reload();
        }
      });
    }

    // ── In-Card Login Feedback Helper ──
    function showLoginFeedback(msg, type) {
      type = type || 'error';
      const el = document.getElementById('login-feedback-msg');
      if (!el) return;
      if (!msg) {
        el.className = 'hidden';
        el.innerHTML = '';
        return;
      }
      if (type === 'error') {
        el.className = 'w-full p-3 mb-2 rounded-xl text-xs font-semibold bg-rose-500/20 border border-rose-500/50 text-rose-200 text-center flex items-center justify-center gap-2';
        el.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i> <span>' + msg + '</span>';
      } else if (type === 'success') {
        el.className = 'w-full p-3 mb-2 rounded-xl text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-center flex items-center justify-center gap-2';
        el.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>' + msg + '</span>';
      } else {
        el.className = 'w-full p-3 mb-2 rounded-xl text-xs font-semibold bg-sky-500/20 border border-sky-500/50 text-sky-200 text-center flex items-center justify-center gap-2';
        el.innerHTML = '<i class="fa-solid fa-circle-info text-sky-400"></i> <span>' + msg + '</span>';
      }
    }

    const inpRut = document.getElementById('login-rut');
    const inpPass = document.getElementById('login-password');
    if (inpRut) inpRut.addEventListener('input', () => showLoginFeedback(''));
    if (inpPass) inpPass.addEventListener('input', () => showLoginFeedback(''));

    // ── Check Session on Load (Zero-Trust Auth Enforcement) ──
    let sessionUser = null;
    let sessionPerms = null;
    try {
      sessionUser = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
      sessionPerms = sessionStorage.getItem('app5t_permisos') || localStorage.getItem('app5t_permisos');
    } catch(e) {}
    
    const loginContainer = document.getElementById('login-container');
    const appLayout = document.getElementById('app-layout');

    if (sessionUser && sessionPerms) {
      try {
        const user = JSON.parse(sessionUser);
        const perms = JSON.parse(sessionPerms);
        
        // Hide login card & show layout
        if (loginContainer) {
          loginContainer.style.setProperty('display', 'none', 'important');
          loginContainer.classList.add('hidden');
        }
        if (appLayout) {
          appLayout.style.setProperty('display', 'flex', 'important');
          appLayout.classList.remove('hidden');
        }
        
        // Run evaluating permissions safely
        try {
          evaluarPermisosYRenderizar(perms, user.rol);
        } catch(e) {
          console.warn('APP5T: Error en evaluarPermisosYRenderizar al restaurar:', e);
        }
        
        // Switch to user's mapped role
        try {
          const mapped = mapRole(user.rol);
          activeRole = mapped;
          switchRole(mapped);
        } catch(e) {
          console.warn('APP5T: Error en switchRole al restaurar:', e);
        }

        // Refresh permissions from cloud in the background on session restore
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.getPermissionsMatrix === 'function') {
          APP5T_Sync.getPermissionsMatrix().then(cloudPerms => {
            if (cloudPerms && cloudPerms.length > 0) {
              evaluarPermisosYRenderizar(cloudPerms, user.rol || activeRole);
              _buildSidebar(activeRole);
              _buildMobileNav(activeRole);
            }
          }).catch(() => {});
        }

        // Trigger background pull sync on session restore
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
          APP5T_Sync.pullAll(true).then(() => {
            if (typeof refreshAll === 'function') refreshAll();
            if (typeof APP5T_Map !== 'undefined' && APP5T_Map._initialized) {
              try { APP5T_Map.loadAllProjects(); } catch(e) {}
            }
          }).catch(err => {
            console.error('APP5T: Error during background sync on session restore:', err);
          });
        }
      } catch (err) {
        console.error('Error loading session:', err);
        try {
          sessionStorage.removeItem('app5t_user');
          sessionStorage.removeItem('app5t_permisos');
        } catch(e) {}
        if (loginContainer) {
          loginContainer.style.setProperty('display', 'flex', 'important');
          loginContainer.classList.remove('hidden');
        }
        if (appLayout) {
          appLayout.style.setProperty('display', 'none', 'important');
          appLayout.classList.add('hidden');
        }
      }
    } else {
      if (loginContainer) {
        loginContainer.style.setProperty('display', 'flex', 'important');
        loginContainer.classList.remove('hidden');
      }
      if (appLayout) {
        appLayout.style.setProperty('display', 'none', 'important');
        appLayout.classList.add('hidden');
      }
    }

    // ── Login Form Handler ──
    async function handleLoginSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      const rutInput = document.getElementById('login-rut');
      const passInput = document.getElementById('login-password');
      const submitBtn = document.getElementById('btn-login-submit');
      
      if (!rutInput || !passInput || !submitBtn) return false;
      if (submitBtn.disabled) return false; // Prevent double invocation
      
      let rut = rutInput.value.trim();
      const password = (passInput.value || '').trim();
      const defaultContent = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar';
      
      showLoginFeedback('');

      // Soporte inteligente para alias y escritura rápida (con o sin puntos/guión)
      const rClean = rut.toLowerCase().replace(/[\s\.\-]/g, '');
      if (rClean === '14303773') {
        rut = '14.303.773-8';
        rutInput.value = rut;
      } else if (rClean === 'daniel' || rClean === 'danielgajardo' || rClean === 'dgajardo' || rClean === 'gerente') {
        rut = '14.303.773-8';
        rutInput.value = rut;
      } else if (rClean === 'carmen' || rClean === 'carmengloria' || rClean === 'admin' || rClean === '33333333') {
        rut = '33.333.333-3';
        rutInput.value = rut;
      } else if (rClean === 'manuel' || rClean === 'manuelmatus' || rClean === 'vendedor' || rClean === '11111111') {
        rut = '11.111.111-1';
        rutInput.value = rut;
      }

      const cleanDigits = rut.replace(/[^0-9kK]/g, '');
      if (typeof APP5T_Utils !== 'undefined' && !APP5T_Utils.validarRUT(rut) && cleanDigits.length !== 8 && cleanDigits.length !== 9) {
          showLoginFeedback('RUT no válido. Verifique el formato ingresado (ej: 143037738 o 14.303.773-8).', 'error');
          APP5T_Utils.showToast('RUT no válido', 'warning');
          return false;
      }
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando...';
        
        let res = null;
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.login === 'function') {
          res = await APP5T_Sync.login(rut, password);
        } else {
          // Fallback seguro inmediato (estilo fixlogin.js) si sync.js aún no termina de cargar
          const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
          const pLower = (password || '').toLowerCase().trim();
          let matched = null;
          if (clean === '143037738' || clean === '222222222') {
            if (pLower === 'gerente123' || pLower === '5tierras123' || pLower === '5tierras' || pLower === '143037738' || pLower === '14.303.773-8') {
              matched = { rut: '22.222.222-2', nombre: 'Daniel Gajardo Pereira', rol: 'Gerencia' };
            }
          } else if (clean === '333333333') {
            if (pLower === 'admin123' || pLower === '5tierras123') {
              matched = { rut: '33.333.333-3', nombre: 'Carmen Gloria Almendras', rol: 'Administracion' };
            }
          } else if (clean === '111111111' || clean === '444444444') {
            if (pLower === 'vendedor123' || pLower === '5tierras123') {
              matched = { rut: clean === '111111111' ? '11.111.111-1' : '44.444.444-4', nombre: clean === '111111111' ? 'Manuel Matus' : 'Vicente Castro', rol: 'Vendedor' };
            }
          }
          if (matched) {
            let activePerms = [];
            const savedPerms = localStorage.getItem('app5t_permisos') || sessionStorage.getItem('app5t_permisos');
            if (savedPerms) {
              try { activePerms = JSON.parse(savedPerms); } catch(e) {}
            }
            if (!activePerms || activePerms.length === 0) {
              activePerms = [
                { ID_Permiso: 1, Componente_Modulo: 'Buscador_Mapa', Acceso_Vendedor: true, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 2, Componente_Modulo: 'Formulario_Reserva', Acceso_Vendedor: true, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 3, Componente_Modulo: 'Bandeja_Aprobaciones', Acceso_Vendedor: false, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 4, Componente_Modulo: 'Carga_PDF_Promesa', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true },
                { ID_Permiso: 5, Componente_Modulo: 'Dashboard_Financiero', Acceso_Vendedor: false, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 6, Componente_Modulo: 'Mis_Leads', Acceso_Vendedor: true, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 7, Componente_Modulo: 'Control_Precios', Acceso_Vendedor: false, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 8, Componente_Modulo: 'Mesa_Documental', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true },
                { ID_Permiso: 9, Componente_Modulo: 'Cuenta_Corriente', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true },
                { ID_Permiso: 10, Componente_Modulo: 'Carga_Datos', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true },
                { ID_Permiso: 11, Componente_Modulo: 'Inventario', Acceso_Vendedor: false, Acceso_Gerencia: true, Acceso_Administracion: true },
                { ID_Permiso: 12, Componente_Modulo: 'Auditoria', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true },
                { ID_Permiso: 13, Componente_Modulo: 'Configuracion_Sistema', Acceso_Vendedor: false, Acceso_Gerencia: false, Acceso_Administracion: true }
              ];
            }
            res = { success: true, user: matched, permisos: activePerms };
          }
        }
        
        if (res && res.success) {
          showLoginFeedback('Acceso concedido. Entrando al sistema...', 'success');
          if (typeof APP5T_Utils !== 'undefined') {
            APP5T_Utils.showToast(`Bienvenido, ${res.user.nombre}`, 'success');
          }
          
          passInput.value = '';
          
          try {
            sessionStorage.setItem('app5t_user', JSON.stringify(res.user));
            sessionStorage.setItem('app5t_permisos', JSON.stringify(res.permisos));
            localStorage.setItem('app5t_user', JSON.stringify(res.user));
            localStorage.setItem('app5t_permisos', JSON.stringify(res.permisos));
          } catch (storageErr) {
            console.warn('APP5T: Storage write notice (Safari Private Mode):', storageErr);
          }
          
          // Immediately transition UI so screen never freezes
          const loginEl = document.getElementById('login-container');
          const layoutEl = document.getElementById('app-layout');
          if (loginEl) {
            loginEl.style.setProperty('display', 'none', 'important');
            loginEl.classList.add('hidden');
          }
          if (layoutEl) {
            layoutEl.style.setProperty('display', 'flex', 'important');
            layoutEl.classList.remove('hidden');
          }

          try {
            evaluarPermisosYRenderizar(res.permisos, res.user.rol);
          } catch(e) {
            console.warn('APP5T: Error en evaluarPermisosYRenderizar:', e);
          }
          
          try {
            const mapped = mapRole(res.user.rol);
            switchRole(mapped);
          } catch(e) {
            console.warn('APP5T: Error en switchRole:', e);
          }

          // Trigger background pull sync on login
          if (typeof APP5T_Map !== 'undefined') {
            APP5T_Map._initialized = false;
            APP5T_Map._layerLoaded = false;
          }
          if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
            APP5T_Sync.pullAll(true).then(() => {
              if (typeof refreshAll === 'function') refreshAll();
              if (typeof APP5T_Map !== 'undefined' && APP5T_Map._initialized) {
                const cl = APP5T_Map._currentLayer;
                if (cl && typeof cl.getLayers === 'function' && cl.getLayers().length > 0) {
                  try { APP5T_Map.refreshColors(); } catch(e) {}
                }
              }
            }).catch(err => {
              console.error('APP5T: Error during background sync on login:', err);
            });
          }
        } else {
          const msg = (res && res.mensaje) ? res.mensaje : 'Credenciales inválidas. Verifique RUT y contraseña.';
          showLoginFeedback(msg, 'error');
          if (typeof APP5T_Utils !== 'undefined') {
            APP5T_Utils.showToast(msg, 'error');
          }
        }
      } catch (err) {
        console.error(err);
        showLoginFeedback(`Error al iniciar sesión: ${err.message}`, 'error');
        if (typeof APP5T_Utils !== 'undefined') {
          APP5T_Utils.showToast(`Error al iniciar sesión: ${err.message}`, 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultContent;
      }
      return false;
    }

    window.APP5T_handleLogin = handleLoginSubmit;

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // ── Verify Supabase Connection Button Listener ──
    const btnVerifySupabase = document.getElementById('btn-verify-supabase');
    if (btnVerifySupabase) {
      btnVerifySupabase.addEventListener('click', async e => {
        e.preventDefault();
        if (btnVerifySupabase.disabled) return;
        
        const originalContent = btnVerifySupabase.innerHTML;
        try {
          btnVerifySupabase.disabled = true;
          btnVerifySupabase.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Probando...</span>';
          btnVerifySupabase.style.opacity = '0.7';
          
          if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.testConnection === 'function') {
            const res = await APP5T_Sync.testConnection();
            if (res && res.success) {
              APP5T_Utils.showToast(res.message, 'success');
            } else {
              APP5T_Utils.showToast(res.message || 'Error al conectar con Supabase', 'error');
            }
          } else {
            APP5T_Utils.showToast('Módulo de sincronización no disponible', 'error');
          }
        } catch (err) {
          console.error(err);
          APP5T_Utils.showToast(`Error al probar conexión: ${err.message}`, 'error');
        } finally {
          btnVerifySupabase.disabled = false;
          btnVerifySupabase.innerHTML = originalContent;
          btnVerifySupabase.style.opacity = '1';
        }
      });
    }

    // ◆ Notification Button Listener ◆
    const btnNotifications = document.getElementById('btn-notifications');
    if (btnNotifications) {
      btnNotifications.addEventListener('click', e => {
        e.preventDefault();
        
        // Find if there's only 1 pending property
        const vendedores = APP5T_DB.getAll('vendedores') || [];
        const vendActivo = _resolveActiveVendedor(vendedores);
        const idVend = vendActivo ? vendActivo.id : null;
        const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Pendiente');
        let myPendingProps = [];
        if (idVend) {
          myPendingProps = props.filter(p => {
            const negs = APP5T_DB.query('negociaciones', n => n.id_propiedad === p.id && (n.id_proceso === 'Reserva' || n.id_proceso === 'Venta_Directa') && n.estado_avance === 'En Curso');
            return (negs && negs.length > 0 && String(negs[0].id_vendedor) === String(idVend));
          });
        }
        
        if (myPendingProps.length === 1) {
          if (window.APP5T && window.APP5T.openLoteBottomSheet) {
            window.APP5T.openLoteBottomSheet(myPendingProps[0].id);
          }
        } else {
          APP5T_Modals.open('modal-notifications');
        }
      });
    }

    // ◆ Logout Button Listener ◆
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('¿Está seguro de que desea cerrar su sesión?')) {
          sessionStorage.removeItem('app5t_user');
          sessionStorage.removeItem('app5t_permisos');
          localStorage.removeItem('app5t_user');
          localStorage.removeItem('app5t_permisos');
          window.location.reload();
        }
      });
    }

    // ── Settings Subtabs Toggling Listeners (Admin Only) ──
    const btnSettingsPerms = document.getElementById('btn-settings-perms');
    const btnSettingsUsers = document.getElementById('btn-settings-users');
    const btnSettingsWhatsapp = document.getElementById('btn-settings-whatsapp');
    const panelPermsContent = document.getElementById('settings-perms-content');
    const panelUsersContent = document.getElementById('settings-users-content');
    const panelWhatsappContent = document.getElementById('settings-whatsapp-content');

    // ── Claves persistentes WhatsApp (prefijo app5t_ para protegerlas) ──
    var WA_KEY_TEL     = 'app5t_wa_config_gerencia_tel';
    var WA_KEY_MSG_GER = 'app5t_wa_config_gerencia_msg';
    var WA_KEY_MSG_ESC = 'app5t_wa_config_escritura_msg';
    var WA_DEFAULT_TEL = '56994455663';
    var WA_DEFAULT_MSG_GER = '⏳ *RESERVA: Lote #LOTE# - #PROYECTO#*\nSolicitada por: #VENDEDOR#.\nRevisar en sistema.';
    var WA_DEFAULT_MSG_ESC = '⚖️ *SOLICITUD DE ESCRITURA*\nLote *#LOTE#* - *#PROYECTO#* (#CLIENTE#) pagado al 100%. Ficha legal descargada. Favor revisar y aprobar en sistema para enviar a notaría.';

    // Migrar claves antiguas (sin prefijo) → nuevas (con prefijo app5t_)
    (function _migrateOldWAKeys() {
      [['wa_config_gerencia_tel', WA_KEY_TEL], ['wa_config_gerencia_msg', WA_KEY_MSG_GER], ['wa_config_escritura_msg', WA_KEY_MSG_ESC]].forEach(function(pair) {
        var oldVal = localStorage.getItem(pair[0]);
        if (oldVal && !localStorage.getItem(pair[1])) {
          localStorage.setItem(pair[1], oldVal);
        }
        localStorage.removeItem(pair[0]);
      });
    })();



    function _loadWhatsAppSettingsInputs() {
      var cfg = _getWAConfig();
      var telInput = document.getElementById('wa-config-gerencia-tel');
      var msgGerInput = document.getElementById('wa-config-gerencia-msg');
      var msgEscInput = document.getElementById('wa-config-escritura-msg');
      if (telInput) telInput.value = cfg.tel;
      if (msgGerInput) msgGerInput.value = cfg.msgGer;
      if (msgEscInput) msgEscInput.value = cfg.msgEsc;
    }

    if (btnSettingsPerms && btnSettingsUsers && panelPermsContent && panelUsersContent) {
      const setActiveSubtab = (activeBtn, showPanel) => {
        [btnSettingsPerms, btnSettingsUsers, btnSettingsWhatsapp].forEach(btn => {
          if (!btn) return;
          if (btn === activeBtn) {
            btn.classList.add('active');
            btn.style.borderBottomColor = 'var(--primary)';
            btn.style.color = 'var(--text-white)';
          } else {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = 'var(--text-dim)';
          }
        });
        [panelPermsContent, panelUsersContent, panelWhatsappContent].forEach(panel => {
          if (!panel) return;
          panel.style.display = panel === showPanel ? 'block' : 'none';
        });
      };

      btnSettingsPerms.addEventListener('click', e => {
        e.preventDefault();
        setActiveSubtab(btnSettingsPerms, panelPermsContent);
        _renderSettingsPermissionsMatrix();
      });

      btnSettingsUsers.addEventListener('click', e => {
        e.preventDefault();
        setActiveSubtab(btnSettingsUsers, panelUsersContent);
        _renderSettingsUsersList();
      });

      if (btnSettingsWhatsapp) {
        btnSettingsWhatsapp.addEventListener('click', e => {
          e.preventDefault();
          setActiveSubtab(btnSettingsWhatsapp, panelWhatsappContent);
          _loadWhatsAppSettingsInputs();
        });
      }
    }

    // ── Add User Button Listener ──
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
      btnAddUser.addEventListener('click', e => {
        e.preventDefault();
        _openUserModal();
      });
    }

    // ── Save Permissions Button Listener ──
    const btnSavePermissions = document.getElementById('btn-save-permissions');
    if (btnSavePermissions) {
      btnSavePermissions.addEventListener('click', e => {
        e.preventDefault();
        _saveSettingsPermissionsMatrix();
      });
    }

    // 3. Attach all event listeners BEFORE switching roles (resilient design)

    // Role selector buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const role = btn.getAttribute('data-role');
        switchRole(role);
      });
    });

    // Pull sync button
    const btnSyncPull = document.getElementById('btn-sync-pull');
    if (btnSyncPull) {
      btnSyncPull.addEventListener('click', async e => {
        e.preventDefault();
        if (btnSyncPull.disabled) return;
        
        const originalContent = btnSyncPull.innerHTML;
        try {
          btnSyncPull.disabled = true;
          btnSyncPull.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
          btnSyncPull.style.opacity = '0.6';
          
          if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
            APP5T_Utils.showToast('Descargando datos...', 'info');
            const res = await APP5T_Sync.pullAll();
            if (res && res.success) {
              APP5T_Utils.showToast('Sincronización de bajada completa. Datos actualizados.', 'success');
            } else {
              APP5T_Utils.showToast('Error al descargar datos: respuesta inválida', 'error');
            }
          } else {
            APP5T_Utils.showToast('Sincronizador no disponible', 'error');
          }
        } catch (err) {
          console.error(err);
          APP5T_Utils.showToast(`Error al sincronizar: ${err.message}`, 'error');
        } finally {
          btnSyncPull.disabled = false;
          btnSyncPull.innerHTML = originalContent;
          btnSyncPull.style.opacity = '1';
        }
      });
    }

    // Hamburger
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', _openSidebar);
    }

    // Sidebar overlay
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', _closeSidebar);
    }

    // Map project select
    const mapProjSel = document.getElementById('map-project-select');
    if (mapProjSel) {
      mapProjSel.addEventListener('change', e => {
        clearLoteSelection();
        const projectName = e.target.value;
        if (projectName && projectName !== 'todos' && projectName !== 'all') {
          _lastActiveProject = projectName;
        }
        if (typeof APP5T_Map !== 'undefined') APP5T_Map.zoomToProject(projectName);
        
//         // Update Plano button
//         const btnPlano = document.getElementById('btn-ver-plano-loteo');
//         if (btnPlano) {
//           if (projectName === 'todos' || projectName === 'all' || !projectName) {
//             btnPlano.style.display = 'none';
//           } else {
//             const proyectos = APP5T_DB.getAll('proyectos') || [];
//             const proy = proyectos.find(p => p.nombre === projectName || p.nombre_proyecto === projectName);
//             if (proy && proy.url) {
//               btnPlano.style.display = 'inline-flex';
//               btnPlano.onclick = () => window.open(proy.url, '_blank');
//             } else {
//               btnPlano.style.display = 'none';
//             }
//           }
//         }
      });
    }

    // Map status filter
    const mapFilter = document.getElementById('map-status-filter');
    if (mapFilter) {
      mapFilter.addEventListener('change', e => {
        if (typeof APP5T_Map !== 'undefined') APP5T_Map.applyFilter(e.target.value);
      });
    }

    // Price control project filter
    const preciosProjSel = document.getElementById('precios-filter-project');
    if (preciosProjSel) {
      preciosProjSel.addEventListener('change', () => _renderPrecios());
    }

    // General inventory project filter
    const invProjSel = document.getElementById('inv-filter-project');
    if (invProjSel) {
      invProjSel.addEventListener('change', () => _renderInventario());
    }

    // Reports filters and export listeners
    const filterMes = document.getElementById('informes-filter-mes');
    if (filterMes) {
      filterMes.addEventListener('change', () => _renderInformes());
    }
    const filterAnio = document.getElementById('informes-filter-anio');
    if (filterAnio) {
      filterAnio.addEventListener('change', () => _renderInformes());
    }
    const filterProyecto = document.getElementById('informes-filter-proyecto');
    if (filterProyecto) {
      filterProyecto.addEventListener('change', () => _renderInformes());
    }
    const searchInformes = document.getElementById('informes-search');
    if (searchInformes) {
      searchInformes.addEventListener('input', () => _renderInformes());
    }
    
    // Filtros de Cuenta Corriente (Estados de Cuenta)
    const ctacteCliente = document.getElementById('rep-ctacte-cliente');
    if (ctacteCliente) ctacteCliente.addEventListener('input', () => { _updateCtaCteCascadingFilters(); _renderInformes(); });
    
    const ctacteLote = document.getElementById('rep-ctacte-lote');
    if (ctacteLote) ctacteLote.addEventListener('input', () => { _updateCtaCteCascadingFilters(); _renderInformes(); });
    
    const ctacteProyecto = document.getElementById('rep-ctacte-proyecto');
    if (ctacteProyecto) ctacteProyecto.addEventListener('change', () => { _updateCtaCteCascadingFilters(); _renderInformes(); });
    
    const btnClearCtaCte = document.getElementById('btn-clear-ctacte-filters');
    if (btnClearCtaCte) {
      btnClearCtaCte.addEventListener('click', () => {
        if (ctacteCliente) ctacteCliente.value = '';
        if (ctacteLote) ctacteLote.value = '';
        if (ctacteProyecto) ctacteProyecto.value = 'all';
        if (typeof _updateCtaCteCascadingFilters === 'function') _updateCtaCteCascadingFilters();
        _renderInformes();
      });
    }
    
    // Filtros de Ventas por Vendedor
    const ventasVendedor = document.getElementById('rep-ventas-vendedor');
    if (ventasVendedor) ventasVendedor.addEventListener('change', () => _renderInformes());

    const ventasProyecto = document.getElementById('rep-ventas-proyecto');
    if (ventasProyecto) ventasProyecto.addEventListener('change', () => _renderInformes());
    
    const ventasMes = document.getElementById('rep-ventas-mes');
    if (ventasMes) ventasMes.addEventListener('change', () => _renderInformes());

    const ventasAnio = document.getElementById('rep-ventas-anio');
    if (ventasAnio) ventasAnio.addEventListener('change', () => _renderInformes());

    // Filtros de Cuotas Vencidas
    const cuotasEstado = document.getElementById('rep-cuotas-estado');
    if (cuotasEstado) cuotasEstado.addEventListener('change', () => _renderInformes());

    const cuotasProyecto = document.getElementById('rep-cuotas-proyecto');
    if (cuotasProyecto) cuotasProyecto.addEventListener('change', () => _renderInformes());
    
    const cuotasSearch = document.getElementById('rep-cuotas-search');
    if (cuotasSearch) cuotasSearch.addEventListener('input', () => _renderInformes());

    const btnExportPdf = document.getElementById('btn-export-pdf-promesas');
    if (btnExportPdf) {
      btnExportPdf.addEventListener('click', e => {
        e.preventDefault();
        _descargarReportePDF();
      });
    }
    const btnExportExcelMisClientes = document.getElementById('btn-export-excel-misclientes');
    if (btnExportExcelMisClientes) {
      btnExportExcelMisClientes.addEventListener('click', e => {
        e.preventDefault();
        _descargarExcelMisClientes();
      });
    }

    const btnExportExcel = document.getElementById('btn-export-excel-promesas');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', e => {
        e.preventDefault();
        _descargarReporteCSV();
      });
    }

    // Exportadores Excel adicionales de Informes
    const btnExportExcelCtaCte = document.getElementById('btn-export-excel-ctacte');
    if (btnExportExcelCtaCte) {
      btnExportExcelCtaCte.addEventListener('click', e => {
        e.preventDefault();
        const proySel = document.getElementById('rep-ctacte-proyecto');
        const idProy = proySel ? proySel.value : 'all';
        if (typeof APP5T_Excel !== 'undefined') {
          APP5T_Excel.exportarCuentaCorriente(null, idProy);
        } else {
          _descargarReporteCSV();
        }
      });
    }

    const btnExportExcelVentas = document.getElementById('btn-export-excel-ventas');
    if (btnExportExcelVentas) {
      btnExportExcelVentas.addEventListener('click', e => {
        e.preventDefault();
        _descargarReporteCSV();
      });
    }

    const btnExportExcelCuotas = document.getElementById('btn-export-excel-cuotas');
    if (btnExportExcelCuotas) {
      btnExportExcelCuotas.addEventListener('click', e => {
        e.preventDefault();
        const proySel = document.getElementById('rep-cuotas-proyecto');
        const idProy = proySel ? proySel.value : 'all';
        if (typeof APP5T_Excel !== 'undefined') {
          APP5T_Excel.exportarCuentaCorriente(null, idProy);
        } else {
          _descargarReporteCSV();
        }
      });
    }
    
    const btnExportPdfCtaCte = document.getElementById('btn-export-pdf-ctacte');
    if (btnExportPdfCtaCte) {
      btnExportPdfCtaCte.addEventListener('click', e => {
        e.preventDefault();
        _descargarEstadoCuentaPDF();
      });
    }

    const btnExportPdfVentas = document.getElementById('btn-export-pdf-ventas');
    if (btnExportPdfVentas) {
      btnExportPdfVentas.addEventListener('click', e => {
        e.preventDefault();
        _descargarVentasPDF();
      });
    }

    const btnExportPdfCuotas = document.getElementById('btn-export-pdf-cuotas');
    if (btnExportPdfCuotas) {
      btnExportPdfCuotas.addEventListener('click', e => {
        e.preventDefault();
        _descargarCuotasPDF();
      });
    }

    // Sync status click -> trigger manual syncAll
    const syncStatusEl = document.getElementById('sync-status');
    if (syncStatusEl) {
      syncStatusEl.style.cursor = 'pointer';
      syncStatusEl.addEventListener('click', e => {
        e.preventDefault();
        if (typeof APP5T_Sync !== 'undefined') {
          APP5T_Sync.syncAll();
        }
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth < 768;
      if (wasMobile && !isMobile) _closeSidebar();
      if (wasMobile !== isMobile) {
        _buildSidebar(activeRole);
        _buildMobileNav(activeRole);
        _buildMobileChips();
      }
    });

    // CRUD tabs
    document.querySelectorAll('.crud-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.crud-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const entity = tab.getAttribute('data-entity');
        const crudContent = document.getElementById('crud-content');
        if (crudContent && entity) {
          APP5T_Forms.renderCRUDTable(crudContent, entity);
        }
      });
    });

    // Informes Mensuales tabs
    document.querySelectorAll('#panel-informes .settings-subtab').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        // Remove active class from all tabs
        document.querySelectorAll('#panel-informes .settings-subtab').forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = '';
          t.style.color = '';
        });
        
        // Add active class to clicked tab
        tab.classList.add('active');
        tab.style.borderBottomColor = '';
        tab.style.color = '';
        
        // Hide all report containers
        document.querySelectorAll('.report-container').forEach(c => {
          c.style.display = 'none';
        });
        
        // Show the selected report container
        const reportType = tab.getAttribute('data-report');
        const targetContainer = document.getElementById(`report-${reportType}-container`);
        if (targetContainer) {
          targetContainer.style.display = 'block';
        }
        
        if (reportType === 'ctacte') {
          const ctacteCliente = document.getElementById('rep-ctacte-cliente');
          const ctacteLote = document.getElementById('rep-ctacte-lote');
          const ctacteProyecto = document.getElementById('rep-ctacte-proyecto');
          if (ctacteCliente) ctacteCliente.value = '';
          if (ctacteLote) ctacteLote.value = '';
          if (ctacteProyecto) ctacteProyecto.value = 'all';
          _updateCtaCteCascadingFilters();
        }
        
        // Render the data
        _renderInformes();
      });
    });

    // Modal close button
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    // Modal backdrop click and form dirtiness tracking
    const modal = document.getElementById('action-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
      });
      // Track user inputs to warn about unsaved changes
      modal.addEventListener('input', () => {
        window.APP5T_isFormDirty = true;
      });
      modal.addEventListener('change', () => {
        window.APP5T_isFormDirty = true;
      });
    }

    // Global listeners to track user input/changes inside any action form (mobile & desktop)
    document.body.addEventListener('input', (e) => {
      if (e.target.closest('#lote-action-form') || 
          e.target.closest('#bs-lote-action-form') || 
          e.target.closest('#bottom-sheet') || 
          e.target.closest('#action-modal')) {
        window.APP5T_isFormDirty = true;
      }
    });
    document.body.addEventListener('change', (e) => {
      if (e.target.closest('#lote-action-form') || 
          e.target.closest('#bs-lote-action-form') || 
          e.target.closest('#bottom-sheet') || 
          e.target.closest('#action-modal')) {
        window.APP5T_isFormDirty = true;
      }
    });

    // Mobile bottom sheet and navs
    _initBottomSheet();
    _buildMobileNav(activeRole);
    _buildMobileChips();

    // Bind toggles to reactively rebuild sidebar menu
    const toggles = [
      'toggle-vendedor-kpis', 'toggle-vendedor-mapa', 'toggle-vendedor-leads',
      'toggle-gerente-dashboard', 'toggle-gerente-charts', 'toggle-gerente-precios',
      'toggle-admin-mesa', 'toggle-admin-ctacte', 'toggle-admin-carga'
    ];
    toggles.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => _buildSidebar(activeRole));
      }
    });

    // Keystroke trigger: Ctrl + Alt + A to unlock admin panel
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        unlockAdmin();
      }
    });

    // Logo click trigger: 1 click to unlock admin panel
    const brandEl = document.querySelector('.sidebar-brand');
    if (brandEl) {
      brandEl.addEventListener('click', () => {
        unlockAdmin();
      });
    }

    // 4. Initial switch to default role or session role (safe trigger)
    try {
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        switchRole(mapRole(user.rol));
      } else {
        // Safe default prior to auth
        switchRole('vendedor');
      }
    } catch (e) {
      console.error('APP5T: Error switching to initial role:', e);
    }

    // Close dropdowns on document click
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    });

    console.log('APP5T: Initialized successfully.');
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // ── Generación de Comprobantes de Reserva (PDF & Envío) ──

  function _generarComprobanteReserva(idNeg, event) {
    if (event) event.stopPropagation();
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;

    const cliNombre = cli ? `${cli.nombres} dots ${cli.apellidos}`.replace('\\dots', '').trim() || 'Sin Nombre' : 'Sin Nombre';
    const cliNombreFull = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Nombre';
    const loteNom = prop ? prop.nombre : '-';
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const pieFmt = APP5T_Utils.formatMoneda(neg.pie || 0);

    // Build modal body HTML
    const html = `
      <div style="padding: 10px; font-family: sans-serif;">
        <p style="margin-bottom: 20px; color: var(--text-light); font-size: 0.95rem; line-height: 1.5;">
          Vas a generar el Comprobante de Reserva oficial para el lote <strong>${loteNom}</strong> (${proyNom}) asignado al cliente <strong>${cliNombreFull}</strong> por el monto de <strong>${pieFmt}</strong>.
        </p>

        <!-- Premium option cards -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 25px;">
          <!-- 1. Download PDF -->
          <div class="btn" style="background: var(--accent-blue,#6366f1); color: #fff; padding: 14px; text-align: left; display: flex; align-items: center; gap: 12px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s;" onclick="window.APP5T._downloadPDFReserva('${idNeg}')" onmouseover="this.style.filter='brightness(1.15)';" onmouseout="this.style.filter='none';">
            <i class="fa-solid fa-file-pdf" style="font-size: 1.5rem;"></i>
            <div>
              <strong style="display: block; font-size: 0.95rem;">1. Descargar Comprobante PDF</strong>
              <span style="font-size: 0.75rem; opacity: 0.85;">Genera y descarga el archivo PDF oficial en tu dispositivo</span>
            </div>
          </div>

          <!-- 2. Send via WhatsApp -->
          <div class="btn" style="background: #25d366; color: #fff; padding: 14px; text-align: left; display: flex; align-items: center; gap: 12px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s;" onclick="window.APP5T._sendWhatsAppReserva('${idNeg}')" onmouseover="this.style.filter='brightness(1.15)';" onmouseout="this.style.filter='none';">
            <i class="fa-brands fa-whatsapp" style="font-size: 1.5rem;"></i>
            <div>
              <strong style="display: block; font-size: 0.95rem;">2. Enviar por WhatsApp</strong>
              <span style="font-size: 0.75rem; opacity: 0.85;">Envía el comprobante directamente al cliente por WhatsApp</span>
            </div>
          </div>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-dim); line-height: 1.4; border-top: 1px solid #eee; padding-top: 15px;">
          <strong>Efectos Administrativos (Google Drive):</strong> Una vez descargado el archivo PDF, puedes subirlo ordenadamente a tu Google Drive corporativo y registrar el enlace compartido en la pestaña <strong>"Documentos"</strong> para mantener el expediente digital del lote al día.
        </div>
      </div>
    `;

    openModal('Generar y Enviar Comprobante', html);
  }

  function _downloadPDFReserva(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;

    const cliNombre = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Nombre';
    const loteNom = prop ? prop.nombre : '-';
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const precioVentaFmt = APP5T_Utils.formatMoneda(neg.valor_final || 0);
    const fechaHoy = new Date().toLocaleDateString('es-CL');

    const pdfHtml = APP5T_Forms.generarHTMLComprobanteReserva(prop, neg, cli, proyNom, precioVentaFmt, fechaHoy);

    const container = document.createElement('div');
    container.innerHTML = pdfHtml.trim();
    const tempEl = container.firstElementChild;
    
    tempEl.style.position = 'fixed';
    tempEl.style.left = '0';
    tempEl.style.top = '0';
    tempEl.style.zIndex = '999999';
    tempEl.style.width = '600px';
    tempEl.style.background = '#ffffff';
    document.body.appendChild(tempEl);

    const cleanLoteNom = loteNom.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanCliNombre = cliNombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeFilename = `Comprobante_Reserva_${cleanLoteNom}_${cleanCliNombre}.pdf`;

    const opt = {
      margin:       0.2,
      filename:     safeFilename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      setTimeout(() => {
        html2pdf().set(opt).from(tempEl).save().then(() => {
          if (tempEl.parentNode) document.body.removeChild(tempEl);
          APP5T_Utils.showToast('PDF descargado con éxito.', 'success');
        }).catch(err => {
          if (tempEl.parentNode) document.body.removeChild(tempEl);
          console.error('Error generating PDF:', err);
          alert('Error generando el PDF: ' + err.message);
        });
      }, 150);
    } else {
      if (tempEl.parentNode) document.body.removeChild(tempEl);
      alert('Error: La librería html2pdf no está cargada.');
    }
  }

  
  function _switchCrudTab(entityOrBtn, btnEl) {
    let entity = '';
    let targetBtn = null;
    if (typeof entityOrBtn === 'string') {
      entity = entityOrBtn;
      targetBtn = btnEl || document.querySelector(`.crud-tab[data-entity="${entity}"]`);
    } else if (entityOrBtn && entityOrBtn.getAttribute) {
      targetBtn = entityOrBtn;
      entity = targetBtn.getAttribute('data-entity');
    }
    if (!entity && targetBtn) entity = targetBtn.getAttribute('data-entity');

    document.querySelectorAll('.crud-tab').forEach(t => t.classList.remove('active'));
    if (targetBtn) {
      targetBtn.classList.add('active');
    } else if (entity) {
      const match = document.querySelector(`.crud-tab[data-entity="${entity}"]`);
      if (match) match.classList.add('active');
    }

    const crudContent = document.getElementById('crud-content');
    if (crudContent && entity && typeof APP5T_Forms !== 'undefined' && APP5T_Forms.renderCRUDTable) {
      APP5T_Forms.renderCRUDTable(crudContent, entity);
    }
  }

    function _switchCrudTab(entityOrBtn, btnEl) {
    let entity = '';
    let targetBtn = null;
    if (typeof entityOrBtn === 'string') {
      entity = entityOrBtn;
      targetBtn = btnEl || document.querySelector('.crud-tab[data-entity="' + entity + '"]');
    } else if (entityOrBtn && entityOrBtn.getAttribute) {
      targetBtn = entityOrBtn;
      entity = targetBtn.getAttribute('data-entity');
    }
    if (!entity && targetBtn) entity = targetBtn.getAttribute('data-entity');

    document.querySelectorAll('.crud-tab').forEach(function(t) { t.classList.remove('active'); });
    if (targetBtn) {
      targetBtn.classList.add('active');
    } else if (entity) {
      const match = document.querySelector('.crud-tab[data-entity="' + entity + '"]');
      if (match) match.classList.add('active');
    }

    const crudContent = document.getElementById('crud-content');
    if (crudContent && entity && typeof APP5T_Forms !== 'undefined' && APP5T_Forms.renderCRUDTable) {
      APP5T_Forms.renderCRUDTable(crudContent, entity);
    }
  }
    function _sendWhatsAppGerencia(idNeg, idProp, idCli) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const cli = idCli ? APP5T_DB.getById('clientes', idCli) : (idNeg ? APP5T_DB.getById('clientes', (APP5T_DB.getById('negociaciones', idNeg) || {}).id_cliente) : null);
    const loteNom = prop ? prop.nombre : '???';
    const proyNom = proy ? proy.nombre_proyecto : '???';
    const cliNom = cli ? (cli.nombres + ' ' + (cli.apellidos || '')) : 'Sin Especificar';
    const activeUserNom = window.APP5T && window.APP5T.getActiveUser ? window.APP5T.getActiveUser() : 'Vendedor';
    const neg = idNeg ? APP5T_DB.getById('negociaciones', idNeg) : null;
    const pieVal = neg ? neg.pie : 0;
    const pieFmt = typeof APP5T_Utils !== 'undefined' ? APP5T_Utils.formatMoneda(pieVal || 0) : ('$' + (pieVal || 0));
    
    const waCfg = _getWAConfig();
    const text = waCfg.msgGer
      .replace(/#LOTE#/g, loteNom)
      .replace(/#PROYECTO#/g, proyNom)
      .replace(/#CLIENTE#/g, cliNom)
      .replace(/#VENDEDOR#/g, activeUserNom)
      .replace(/#PIE#/g, pieFmt);
    
    if (window.confirm('¡Solicitud Registrada Exitosamente!\n\n¿Deseas enviar la notificación a Gerencia por WhatsApp ahora?')) {
      _openWhatsApp(waCfg.tel, text);
    }
  }

  function _solicitarAutorizacionEscritura(idNeg) {
    if (!idNeg) {
      APP5T_Utils.showToast('Error: No se ha podido identificar la negociación. Por favor, asegúrate de que el lote tenga una negociación activa.', 'error');
      return;
    }
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) {
      APP5T_Utils.showToast('Error: No se encontró la negociación en la base de datos.', 'error');
      return;
    }
    
    if (window.confirm('Se va a descargar la Ficha Legal para el abogado y se solicitará la firma al Gerente. ¿Deseas continuar?')) {
      // 1. Update status
      neg.notas = (neg.notas || '') + '\n[AUTORIZADO_ESCRITURAR:PENDIENTE]';
      APP5T_DB.update('negociaciones', neg.id, neg);
      window.APP5T.sync.triggerFullSync();
      
      // 2. Generate PDF
      if (typeof APP5T_Forms !== 'undefined' && APP5T_Forms.descargarFichaLegal) {
        APP5T_Forms.descargarFichaLegal(neg.id_propiedad);
      }
      
      // 3. Prepare WA
      const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
      const cli = APP5T_DB.getById('clientes', neg.id_cliente);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      
      const loteNom = prop ? prop.nombre : '-';
      const proyNom = proy ? proy.nombre_proyecto : '-';
      const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '-';
      
      const waCfg2 = (typeof _getWAConfig === 'function' ? _getWAConfig : (window._getWAConfig || function(){return {};}))();
      const text = waCfg2.msgEsc
        .replace(/#LOTE#/g, loteNom)
        .replace(/#PROYECTO#/g, proyNom)
        .replace(/#CLIENTE#/g, cliNom);
      const tel = waCfg2.tel;
      const url = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
      
      if (window.confirm('¡Solicitud de Escritura Guardada!\n\n¿Deseas enviar la notificación a Gerencia por WhatsApp ahora?')) {
        window.open(url, '_blank');
      }
      
      refreshAll();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    }
  }

  function _autorizarFirmaEscritura(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    
    if (window.confirm('¿Confirmas la autorización para firmar esta escritura en notaría?')) {
      neg.estado_escrituracion = 'Autorizada';
      APP5T_DB.update('negociaciones', neg.id, neg);
      APP5T_Utils.showToast('Escritura Autorizada exitosamente', 'success');
      refreshAll();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    }
  }


    function _sendWhatsAppReserva(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;

    const cliNombre = cli ? (cli.nombres + ' ' + (cli.apellidos || '')) : 'Cliente';
    const fono = cli ? cli.telefono : '';
    const loteNom = prop ? prop.nombre : '-';
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const pieVal = neg.pie || 0;
    const pieFmt = typeof APP5T_Utils !== 'undefined' ? APP5T_Utils.formatMoneda(pieVal) : ('$' + pieVal);

    const text = '📄 *COMPROBANTE DE RESERVA - 5 TIERRAS*\n\nEstimado/a *' + cliNombre + '*,\nConfirmamos la reserva del lote *' + loteNom + '* en el proyecto *' + proyNom + '*.\n\n💰 *Pie Recibido*: ' + pieFmt + '\n\n¡Muchas gracias por confiar en 5 Tierras!';
    _openWhatsApp(fono, text);
  }

  function _sendEmailReserva(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;

    const cliNombre = cli ? `${cli.nombres} ${cli.apellidos}` : 'Cliente';
    const email = cli ? (cli.email || '') : '';
    const loteNom = prop ? prop.nombre : '-';
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const pieFmt = APP5T_Utils.formatMoneda(neg.pie || 0);

    const subject = `Comprobante de Reserva - Lote ${loteNom} - Proyecto ${proyNom}`;
    const body = `Estimado(a) ${cliNombre},\n\nLe adjuntamos el comprobante oficial de reserva del lote ${loteNom} del proyecto ${proyNom} por el monto de ${pieFmt}.\n\nSaludos cordiales,\nInmobiliaria 5 Tierras`;
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_self');
  }

  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */
  function toggleDropdown(event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const btn = event.currentTarget;
    const dropdown = btn.closest('.dropdown');
    if (!dropdown) return;
    
    const menu = dropdown.querySelector('.dropdown-menu');
    if (!menu) return;
    
    // Close all other dropdown menus first
    document.querySelectorAll('.dropdown-menu').forEach(m => {
      if (m !== menu) m.classList.remove('show');
    });
    
    // Toggle current menu
    menu.classList.toggle('show');
  }

  /* ══════════════════════════════════════════════════════
     MESA DE GERENCIA — 3 PESTAÑAS UNIFICADAS & FIRMA
     ══════════════════════════════════════════════════════ */
  function switchGerenciaTab(tabId) {
    const tabs = ['tab-reserva', 'tab-promesa', 'tab-escritura'];
    tabs.forEach(t => {
      const btn = document.getElementById('btn-' + t);
      const content = document.getElementById(t);
      if (btn) {
        if (t === tabId) btn.classList.add('active');
        else btn.classList.remove('active');
      }
      if (content) {
        if (t === tabId) content.classList.add('active');
        else content.classList.remove('active');
      }
    });
  }

  async function firmaEscrituraVenta(idLote, btnElement) {
    if (!idLote) return;
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.classList.add('btn-gerencia-disabled');
      btnElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Firmando...';
    }

    const notariaInput = document.getElementById('notaria-input-' + idLote);
    const notariaNombre = notariaInput ? notariaInput.value.trim() : 'Notaría San Fernando';

    try {
      // 1. Intento de llamada al Backend REST API
      let success = false;
      let respData = null;
      try {
        const response = await fetch('/api/v1/gerencia/escritura/firmar-venta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idLote: parseInt(idLote, 10),
            notaria: notariaNombre,
            usuarioRut: '222222222'
          })
        });
        if (response.ok) {
          respData = await response.json();
          success = respData && respData.success;
        }
      } catch (apiErr) {
        console.warn('API backend no disponible en servidor estático, usando actualización atómica Supabase DB:', apiErr);
      }

      // 2. Fallback local / Supabase Direct si API no responde
      if (!success && typeof APP5T_DB !== 'undefined') {
        APP5T_DB.update('propiedades', parseInt(idLote, 10), {
          estado: 'Vendida',
          fecha_venta: new Date().toISOString()
        });

        const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(idLote));
        if (negs && negs.length > 0) {
          APP5T_DB.update('negociaciones', negs[0].id, {
            estado_escrituracion: 'FIRMADO',
            autorizado_escriturar: 'SI',
            notaria: notariaNombre,
            estado_avance: 'VENDIDO',
            fecha_firma_escritura: new Date().toISOString()
          });
        }
        success = true;
      }

      if (success) {
        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
          APP5T_Utils.showToast(`Firma de Escritura Venta confirmada en ${notariaNombre}`, 'success');
        }
        if (typeof APP5T_Cloud !== 'undefined') {
          APP5T_Cloud.syncAll().catch(() => {});
        }
        if (btnElement) {
          btnElement.innerHTML = '<i class="fa-solid fa-check-double"></i> Escritura Firmada';
        }
        setTimeout(() => {
          renderMesaGerencia();
        }, 400);
      } else {
        throw new Error(respData?.error || 'Error al procesar firma de escritura');
      }
    } catch (err) {
      console.error('Error en firmaEscrituraVenta:', err);
      if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast(`Error al firmar escritura: ${err.message}`, 'error');
      }
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.classList.remove('btn-gerencia-disabled');
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Firma Escritura Venta';
      }
    }
  }



  function _validarPagoPromesa(idId) {
    APP5T_Utils.showToast('Pago validado por Gerencia', 'success');
    renderMesaGerencia();
    if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
  }

  function renderMesaGerencia() {
    const tbodyReservas = document.getElementById('tbody-gerencia-reservas');
    const tbodyPromesas = document.getElementById('tbody-gerencia-promesas');
    const tbodyEscrituras = document.getElementById('tbody-gerencia-escrituras');

    if (!tbodyReservas && !tbodyPromesas && !tbodyEscrituras) return;

    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];

    // --- 1. Pestaña Reserva ---
    if (tbodyReservas) {
      const reservasProps = propiedades.filter(p => p.estado === 'Reservada' || p.estado === 'Pendiente');
      if (reservasProps.length === 0) {
        tbodyReservas.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No hay reservas pendientes de aprobación.</td></tr>';
      } else {
        tbodyReservas.innerHTML = reservasProps.map(p => {
          const negs = negociaciones.filter(n => String(n.id_propiedad) === String(p.id));
          const neg = negs.length > 0 ? negs[0] : {};
          const cli = neg.id_cliente ? clientes.find(c => String(c.id) === String(neg.id_cliente)) : null;
          const proy = p.id_proyecto ? proyectos.find(pr => String(pr.id) === String(p.id_proyecto)) : null;

          const fechaRes = neg.fecha_negociacion || p.fecha_reserva || '-';
          const clienteNom = cli ? `${cli.nombres} ${cli.apellidos || ''}` : 'Cliente Sin Nombre';
          const clienteRut = cli ? cli.rut || '-' : '-';
          const montoRes = APP5T_Utils.formatMoneda(neg.pie || p.abono || 200000);

          const isAprobada = p.estado === 'Reservada' || neg.autorizado_promesa;
          const isFichaGen = neg.ficha_abogado_generada || neg.fecha_envio_abogado;
          const isFirmada = neg.estado_avance === 'Promesada' || p.estado === 'Promesada';

          return `
            <tr>
              <td>${fechaRes}</td>
              <td><strong>${p.nombre || 'Lote ' + p.id}</strong> <br><small class="text-muted">${proy ? proy.nombre_proyecto : '-'}</small></td>
              <td>${clienteNom}<br><small class="text-muted">RUT: ${clienteRut}</small></td>
              <td><strong>${montoRes}</strong></td>
              <td>${getStatusBadgeHTML(p.estado)}</td>
              <td style="text-align:center;">
                <div style="display:inline-flex; gap:6px; flex-wrap:nowrap;">
                  <button type="button" class="btn-gerencia-${isAprobada ? 'green' : 'blue'}" ${isAprobada ? 'disabled' : ''} onclick="window.APP5T._aprobarReservaDirecta('${neg.id || p.id}')">
                    <i class="fa-solid fa-${isAprobada ? 'check' : 'thumbs-up'}"></i> 1. ${isAprobada ? 'Aprobada' : 'Aprobar Reserva'}
                  </button>
                  <button type="button" class="btn-gerencia-outline-blue"  onclick="window.APP5T._enviarFichaAbogado('${neg.id || p.id}')">
                    <i class="fa-solid fa-scale-balanced"></i> 2. Ficha Abogado
                  </button>
                  <button type="button" class="btn-gerencia-green"  onclick="window.APP5T._signPromesa('${neg.id || p.id}')">
                    <i class="fa-solid fa-file-signature"></i> 3. Confirmar Firma
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // --- 2. Pestaña Promesa ---
    if (tbodyPromesas) {
      const promesasProps = propiedades.filter(p => p.estado === 'Promesada' || p.estado === 'Venta_Directa');
      if (promesasProps.length === 0) {
        tbodyPromesas.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No hay promesas en proceso de liquidación.</td></tr>';
      } else {
        tbodyPromesas.innerHTML = promesasProps.map(p => {
          const negs = negociaciones.filter(n => String(n.id_propiedad) === String(p.id));
          const neg = negs.length > 0 ? negs[0] : {};
          const cli = neg.id_cliente ? clientes.find(c => String(c.id) === String(neg.id_cliente)) : null;
          const proy = p.id_proyecto ? proyectos.find(pr => String(pr.id) === String(p.id_proyecto)) : null;

          const fechaLiq = neg.fecha_promesa || neg.fecha_negociacion || '-';
          const clienteNom = cli ? `${cli.nombres} ${cli.apellidos || ''}` : 'Cliente Sin Nombre';
          const clienteRut = cli ? cli.rut || '-' : '-';

          const propCuotas = ctas.filter(ct => String(ct.id_propiedad) === String(p.id));
          const pendientes = propCuotas.filter(ct => ct.estado_cuota !== 'Pagado' && ct.estado_cuota !== 'PAGADO');
          const estadoFinanciero = pendientes.length === 0 ? '<span class="badge-soft-success">Al día / Pagado</span>' : `<span class="badge" style="background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:12px; font-weight:600;">${pendientes.length} cuotas pendientes</span>`;

          const validacionAdmin = neg.autorizado_escriturar === 'SI' ? '<span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-check-circle"></i> Validado</span>' : '<span style="color:#f59e0b; font-weight:600;"><i class="fa-solid fa-clock"></i> Pendiente Validación</span>';

          return `
            <tr>
              <td>${fechaLiq}</td>
              <td><strong>${p.nombre || 'Lote ' + p.id}</strong> <br><small class="text-muted">${proy ? proy.nombre_proyecto : '-'}</small></td>
              <td>${clienteNom}<br><small class="text-muted">RUT: ${clienteRut}</small></td>
              <td>${estadoFinanciero}</td>
              <td>${validacionAdmin}</td>
              <td style="text-align:right;">
                <div style="display:inline-flex; gap:6px;">
                  <button type="button" class="btn-gerencia-outline-blue" onclick="window.APP5T.goToCuentaCorriente('${p.id}')">
                    <i class="fa-solid fa-eye"></i> Ver Cuenta Corriente
                  </button>
                  <button type="button" class="btn-gerencia-green" onclick="window.APP5T._validarPagoPromesa('${neg.id || p.id}')">
                    <i class="fa-solid fa-check"></i> Validar Pago
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // --- 3. Pestaña Escritura ---
    if (tbodyEscrituras) {
      const escriturasProps = propiedades.filter(p => {
        if (!p || p.estado === 'Disponible') return false;
        if (p.estado === 'Vendida' || p.estado === 'Escriturada' || p.estado === 'Venta_Directa') return true;
        if (p.estado === 'Promesada') {
          const negs = negociaciones.filter(n => String(n.id_propiedad) === String(p.id));
          const neg = negs.length > 0 ? negs[negs.length - 1] : null;
          return neg && (neg.estado_escrituracion === 'Pendiente' || neg.estado_escrituracion === 'Autorizada' || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR') || _isNeg100Paid(neg));
        }
        return false;
      });
      if (escriturasProps.length === 0) {
        tbodyEscrituras.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No hay escrituras pendientes de firma.</td></tr>';
      } else {
        tbodyEscrituras.innerHTML = escriturasProps.map(p => {
          const negs = negociaciones.filter(n => String(n.id_propiedad) === String(p.id));
          const neg = negs.length > 0 ? negs[0] : {};
          const cli = neg.id_cliente ? clientes.find(c => String(c.id) === String(neg.id_cliente)) : null;
          const proy = p.id_proyecto ? proyectos.find(pr => String(pr.id) === String(p.id_proyecto)) : null;

          const fechaOp = p.fecha_venta || neg.fecha_firma_escritura || neg.fecha_promesa || '-';
          const clienteNom = cli ? `${cli.nombres} ${cli.apellidos || ''}` : 'Cliente Sin Nombre';
          const notariaVal = neg.notaria || 'Notaría 1a Chillán';
          const isVendida = p.estado === 'Vendida' || neg.estado_escrituracion === 'FIRMADO';

          return `
            <tr>
              <td>${fechaOp}</td>
              <td><strong>${p.nombre || 'Lote ' + p.id}</strong> <br><small class="text-muted">${proy ? proy.nombre_proyecto : '-'}</small></td>
              <td>${clienteNom}</td>
              <td><span class="badge-soft-success"><i class="fa-solid fa-shield-check"></i> 100% Pagado</span></td>
              <td>
                <input type="text" id="notaria-input-${p.id}" class="form-control form-control-sm" value="${notariaVal}" ${isVendida ? 'disabled' : ''} style="max-width:180px; font-size:0.8rem;">
              </td>
              <td style="text-align:right;">
                <div style="display:inline-flex; gap:6px;">
                  <button type="button" class="btn-gerencia-blue" onclick="if(window.APP5T_Forms &amp;&amp; window.APP5T_Forms.descargarFichaLegal) window.APP5T_Forms.descargarFichaLegal('${p.id}'); else APP5T_Utils.showToast('Generando Ficha Escritura...', 'info');">
                    <i class="fa-solid fa-file-pdf"></i> 📄 Ficha Escritura
                  </button>
                  <button type="button" class="btn-gerencia-green ${isVendida ? 'btn-gerencia-disabled' : ''}" ${isVendida ? 'disabled' : ''} onclick="window.APP5T.firmaEscrituraVenta('${p.id}', this)">
                    <i class="fa-solid fa-${isVendida ? 'check-double' : 'check'}"></i> ${isVendida ? '✓ Escritura Firmada' : '✓ Firma Escritura Venta'}
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  const api = {
    switchGerenciaTab,
    renderMesaGerencia,
    firmaEscrituraVenta,
    _enviarFichaAbogado,
    _validarPagoPromesa,

    isUserEditing: () => false,
    toggleDropdown,
    switchRole,
    switchTab,
    refreshAll,
    openModal,
    closeModal,
    onLoteSelected,
    clearLoteSelection,
    openLoteBottomSheet,
    openLoteHistorial,
    openLoteHistorialCurrent,
    getStatusBadgeHTML,
    goBackToMap,
    getLastActiveProject: () => _lastActiveProject,
    setLastActiveProject: (proj) => { if (proj && proj !== 'todos' && proj !== 'all') _lastActiveProject = proj; },
    unlockAdmin,
    getActiveRole: () => activeRole,
    getActiveUser: () => {
      const sessionUser = sessionStorage.getItem('app5t_user');
      if (sessionUser) {
        try {
          const u = JSON.parse(sessionUser);
          return u.Nombre || u.nombre || 'Sistema';
        } catch (e) {}
      }
      return ROLE_NAMES[activeRole]?.name || 'Sistema';
    },
    // Internal helpers exposed for inline onclick
    _viewApproval,
    _aprobarReservaDirecta,
    _rechazarReservaDirecta,
    _revertirVentaDirecta,
    _signPromesa,
    _signEscritura,
    _signEscrituraDirecta,
    _payCuota,
    _editCuota,
    abrirMatrizCuotas: (target) => {
      const html = '<div id="modal-matriz-cuotas"></div>';
      openModal('Matriz de Cuotas Dinámicas', html);
      setTimeout(() => {
        const container = document.getElementById('modal-matriz-cuotas');
        if (container && typeof APP5T_Forms !== 'undefined' && APP5T_Forms.renderMatrizCuotasDinamicas) {
          APP5T_Forms.renderMatrizCuotasDinamicas(container, target);
        }
      }, 50);
    },
    _pagarTotalDirecto,
    mostrarModalReprogramacion: (cliId, propId) => (typeof APP5T_Forms !== 'undefined' && APP5T_Forms.mostrarModalReprogramacion ? APP5T_Forms.mostrarModalReprogramacion(cliId, propId) : null),
    _showActivarCtaCteModal,
    goToCuentaCorriente,
    _generarComprobanteReserva,
    _downloadPDFReserva,
    _sendWhatsAppReserva,
    _sendEmailReserva,
    _sendWhatsAppGerencia,
    _solicitarAutorizacionEscritura,
    _autorizarFirmaPromesaDirecta,
    _autorizarPromesaEscrituracion,
    _cancelarPromesaYLiberarLote,
    _aprobarAutorizacionEscrituracion,
    _autorizarFirmaEscritura,
    // Mesa de Gerencia — 3 pestañas
    _switchMesaTab,
    _switchCrudTab,
    switchCrudTab: _switchCrudTab,
    _openWhatsApp,
    openWhatsApp: _openWhatsApp,
    _switchCrudTab,
    switchCrudTab: _switchCrudTab,
    _enviarFichaAbogado,
    _validarPagoPromesa,

    // Catalogo Documental
    filterCatalogo: function() { _renderCatalogoDocumentos(); },

    // Mis Clientes (Leads)
    filterLeads: function(q) {
      window._leadsSearchQuery = q || '';
      _renderLeads();
    },
    filterLeadsByVendedor: function(vId) {
      window._leadsSelectedVendedor = vId;
      _renderLeads();
    },
    clearLeadsSearch: function() {
      window._leadsSearchQuery = '';
      const input = document.getElementById('leads-search-input');
      if (input) input.value = '';
      _renderLeads();
    },

    // Aprobaciones
    filterAprobaciones: function(q) {
      window._aprobacionesSearchQuery = q || '';
      _renderAprobaciones();
    },
    toggleDocumentCheck: function(id_propiedad, tipo_documento, isChecked) {
      let docs = APP5T_DB.getAll('documentos') || [];
      let docIndex = docs.findIndex(d => String(d.id_propiedad) === String(id_propiedad) && d.tipo_documento === tipo_documento);
      if (isChecked) {
        if (docIndex === -1) {
          APP5T_DB.insert('documentos', { id_propiedad: String(id_propiedad), tipo_documento: tipo_documento, estado: 'Verificado', fecha_carga: new Date().toISOString() });
        }
      } else {
        if (docIndex !== -1) { APP5T_DB.remove('documentos', docs[docIndex].id); }
      }
      _renderCatalogoDocumentos();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    },

    saveWhatsAppConfig: function(e) {
      if (e && e.preventDefault) e.preventDefault();
      var tel = (document.getElementById('wa-config-gerencia-tel') || {}).value || '';
      var msgGer = (document.getElementById('wa-config-gerencia-msg') || {}).value || '';
      var msgEsc = (document.getElementById('wa-config-escritura-msg') || {}).value || '';
      tel = tel.trim(); msgGer = msgGer.trim(); msgEsc = msgEsc.trim();

      localStorage.setItem('app5t_wa_config_gerencia_tel', tel);
      localStorage.setItem('app5t_wa_config_gerencia_msg', msgGer);
      localStorage.setItem('app5t_wa_config_escritura_msg', msgEsc);
      console.log('[WA Config] Guardado:', { tel: tel, msgGer: msgGer.substring(0,30), msgEsc: msgEsc.substring(0,30) });

      // Visual feedback on the button itself
      const btn = document.getElementById('btn-save-whatsapp');
      if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Guardado!';
        btn.style.backgroundColor = '#16a34a';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.backgroundColor = '';
        }, 2500);
      }

      // Toast notification feedback
      const msgText = '¡Configuración de WhatsApp guardada exitosamente!';
      if (window.APP5T_Utils && typeof window.APP5T_Utils.showToast === 'function') {
        window.APP5T_Utils.showToast(msgText, 'success');
      } else if (typeof APP5T_Utils !== 'undefined' && typeof APP5T_Utils.showToast === 'function') {
        APP5T_Utils.showToast(msgText, 'success');
      } else {
        alert(msgText);
      }
    },
    saveDriveFolderLink: function(id_propiedad) {
      const input = document.getElementById('drive-link-' + id_propiedad);
      if (!input) return;
      const link = input.value.trim();
      const result = APP5T_DB.update('propiedades', parseInt(id_propiedad, 10), { url: link });
      if (result && result.success) {
        APP5T_Utils.showToast('Enlace de Drive guardado correctamente', 'success');
      } else {
        APP5T_Utils.showToast('Error al guardar el enlace', 'error');
      }
      _renderCatalogoDocumentos();
      if (typeof APP5T_Cloud !== 'undefined') APP5T_Cloud.syncAll().catch(()=>{});
    }
  };

  // Merge the api object with existing APP5T properties just in case
  window.APP5T = Object.assign(window.APP5T || {}, api);

  window.APP5T_filterLeads = function(q) { if (window.APP5T && window.APP5T.filterLeads) window.APP5T.filterLeads(q); };
  window.APP5T_clearLeadsSearch = function() { if (window.APP5T && window.APP5T.clearLeadsSearch) window.APP5T.clearLeadsSearch(); };

})();






window.APP5T_pasarAEscrituracion = function(propId) {
    if (!propId) return;
    const prop = APP5T_DB.getById('propiedades', propId);
    if (!prop) return;
    
    // Secuencia Estricta: Si la propiedad está Reservada, primero pasa a Promesada
    if (prop.estado === 'Reservada' || prop.estado === 'Reservado') {
        prop.estado = 'Promesada';
        APP5T_DB.update('propiedades', prop.id, prop);
        
        const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propId));
        if (negs && negs.length) {
            const n = negs[negs.length - 1];
            n.estado_avance = 'Promesada';
            n.autorizado_promesa = true;
            APP5T_DB.update('negociaciones', n.id, n);
        }
        
        if (typeof APP5T_Sync !== 'undefined' && APP5T_Sync.pushTable) {
            APP5T_Sync.pushTable('propiedades');
            APP5T_Sync.pushTable('negociaciones');
        }
        
        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
            APP5T_Utils.showToast('✍️ Lote avanzado exitosamente a Promesa de Compraventa.', 'success');
        }
        
        setTimeout(function() {
            location.reload();
        }, 600);
        return;
    }

    // Solo si ya es Promesada o Venta_Directa pasa a Vendida
    prop.estado = 'Vendida';
    APP5T_DB.update('propiedades', prop.id, prop);
    
    const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propId));
    if (negs && negs.length) {
        const n = negs[negs.length - 1];
        n.estado = 'Vendida';
        n.notas = (n.notas || '') + ' [AUTORIZADO_ESCRITURAR:TRUE]';
        APP5T_DB.update('negociaciones', n.id, n);
    }
    
    if (typeof APP5T_Sync !== 'undefined' && APP5T_Sync.pushTable) {
        APP5T_Sync.pushTable('propiedades');
        APP5T_Sync.pushTable('negociaciones');
    }
    
    if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast('✍️ ¡Lote pasado a Escrituración Definitiva exitosamente!', 'success');
    }
    
    setTimeout(function() {
        location.reload();
    }, 600);
};

window.APP5T_desbloquearLote = function(idOrNombre) {
    const props = APP5T_DB.getAll('propiedades') || [];
    const p = props.find(x => String(x.id) === String(idOrNombre) || String(x.nombre) === String(idOrNombre) || String(x.nombre) === 'Lote ' + idOrNombre);
    if (!p) { console.warn('Lote no encontrado:', idOrNombre); return; }
    
    // Mark cuotas annulled
    const ctas = APP5T_DB.getAll('cuenta_corriente') || [];
    ctas.forEach(c => {
        if (String(c.id_propiedad) === String(p.id) || String(c.id_propiedad) === String(p.nombre)) {
            if (String(c.estado_cuota || '').includes('Reprogramada') && !String(c.estado_cuota || '').includes('Anulada')) {
                c.estado_cuota = 'Anulada (Reprogramada)';
                APP5T_DB.update('cuenta_corriente', c.id, c);
            }
        }
    });
    
    // Set negotiation as authorized
    const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id));
    if (negs && negs.length) {
        const n = negs[negs.length - 1];
        n.autorizado_escriturar = 'SI';
        n.estado_escrituracion = 'Autorizada';
        n.notas = (n.notas || '') + ' [AUTORIZADO_ESCRITURAR:TRUE]';
        APP5T_DB.update('negociaciones', n.id, n);
    }
    
    if (typeof APP5T_Sync !== 'undefined' && APP5T_Sync.pushTable) {
        APP5T_Sync.pushTable('cuenta_corriente');
        APP5T_Sync.pushTable('negociaciones');
        APP5T_Sync.pushTable('propiedades');
    }
    
    console.log('Lote ' + p.nombre + ' desbloqueado exitosamente!');
    if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast('🔓 ¡Lote ' + p.nombre + ' desbloqueado para Escrituración!', 'success');
    }
    setTimeout(function() { location.reload(); }, 500);
};



