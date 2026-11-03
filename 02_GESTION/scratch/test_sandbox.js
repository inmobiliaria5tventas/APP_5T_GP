
  const window = { innerWidth: 1024, addEventListener: () => {} };
  const document = { 
    readyState: 'loading',
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  };
  const localStorage = { getItem: () => null, setItem: () => {} };
  const sessionStorage = { getItem: () => null, setItem: () => {} };
  
  try {
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
  let activeTab = 'mapa';
  let isMobile = window.innerWidth < 768;
  let adminUnlocked = false;
  let lastFilteredInformes = [];

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

  let activeGestionTab = {
    vendedor: 'leads',
    gerente: 'aprobaciones',
    administrador: 'mesa'
  };

  /* ══════════════════════════════════════════════════════
     MENU CONFIGURATION PER ROLE
     ══════════════════════════════════════════════════════ */
  const MENUS = {
    vendedor: [
      { 
        id: 'proyectos_group', 
        icon: 'fa-map-location-dot', 
        label: 'Proyectos', 
        isGroup: true,
        children: [

          { id: 'mapa-El Copihue', label: 'El Copihue' },
          { id: 'mapa-Las Brisas', label: 'Las Brisas' },
          { id: 'mapa-Los Encinos', label: 'Los Encinos' },
          { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
        ]
      },
      { id: 'leads',            icon: 'fa-users',            label: 'Mis Clientes' }
    ],
    gerente: [
      { 
        id: 'proyectos_group', 
        icon: 'fa-map-location-dot', 
        label: 'Proyectos', 
        isGroup: true,
        children: [

          { id: 'mapa-El Copihue', label: 'El Copihue' },
          { id: 'mapa-Las Brisas', label: 'Las Brisas' },
          { id: 'mapa-Los Encinos', label: 'Los Encinos' },
          { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
        ]
      },
      { id: 'aprobaciones',     icon: 'fa-stamp',            label: 'Aprobaciones' },
      { id: 'dashboard',        icon: 'fa-chart-line',       label: 'Panel Gerencial' },
      { id: 'catalogo',         icon: 'fa-folder-tree',      label: 'Catálogo Documental' },
      { id: 'inventario',       icon: 'fa-list-check',       label: 'Inventario' }
    ],
    administrador: [
      { 
        id: 'proyectos_group', 
        icon: 'fa-map-location-dot', 
        label: 'Proyectos', 
        isGroup: true,
        children: [

          { id: 'mapa-El Copihue', label: 'El Copihue' },
          { id: 'mapa-Las Brisas', label: 'Las Brisas' },
          { id: 'mapa-Los Encinos', label: 'Los Encinos' },
          { id: 'mapa-Los Naranjos', label: 'Los Naranjos' }
        ]
      },
      { id: 'dashboard',  icon: 'fa-chart-line',           label: 'Dashboard' },
      { id: 'mesa',       icon: 'fa-file-contract',        label: 'Mesa Documental' },
      { id: 'catalogo',   icon: 'fa-folder-tree',          label: 'Catálogo Documental' },
      { id: 'ctacte',     icon: 'fa-money-check-dollar',   label: 'Cuenta Corriente' },
      { id: 'informes',   icon: 'fa-file-invoice-dollar',  label: 'Informes Mensuales' },      
      { id: 'carga',      icon: 'fa-database',             label: 'Carga de Datos' },
      { id: 'inventario', icon: 'fa-list-check',           label: 'Inventario' },
      { id: 'auditoria',  icon: 'fa-clock-rotate-left',    label: 'Auditoría' }
    ]
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
    leads: 'Mis_Leads',
    aprobaciones: 'Bandeja_Aprobaciones',
    precios: 'Control_Precios',
    mesa: 'Mesa_Documental',
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

  function hasPermission(moduleName) {
    const userSession = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
    if (!userSession) return false;
    const u = JSON.parse(userSession);
    const permsRaw = sessionStorage.getItem('app5t_permisos') || localStorage.getItem('app5t_permisos') || '[]';
    const perms = JSON.parse(permsRaw);
    
    const perm = perms.find(p => (p.Componente_Modulo || p.componente_modulo) === moduleName);
    if (!perm) return false; // Zero-trust default
    
    const roleColUpper = 'Acceso_' + getRoleKey(u.rol || u.Rol);
    const roleColLower = 'acceso_' + getRoleKey(u.rol || u.Rol).toLowerCase();
    const val = perm[roleColUpper] !== undefined ? perm[roleColUpper] : perm[roleColLower];
    
    return val === true || String(val).toUpperCase() === 'TRUE';
  }

  function evaluarPermisosYRenderizar(permisos, rolUsuario) {
    const roleColUpper = 'Acceso_' + getRoleKey(rolUsuario);
    const roleColLower = 'acceso_' + getRoleKey(rolUsuario).toLowerCase();
    const pMap = {};
    permisos.forEach(p => {
      const val = p[roleColUpper] !== undefined ? p[roleColUpper] : p[roleColLower];
      const mod = p.Componente_Modulo || p.componente_modulo;
      pMap[mod] = val === true || String(val).toUpperCase() === 'TRUE';
    });

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
    
    if (getRoleKey(rolUsuario) === 'Administracion') {
      adminUnlocked = true;
    } else {
      adminUnlocked = false;
    }
  }

  function _isTabVisible(role, tabId) {
    const permName = TAB_PERMISSIONS[tabId];
    if (!permName) return true;
    return hasPermission(permName);
  }

  function _buildSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    let items = MENUS[role] || [];
    
    // Filter items based on toggles
    items = items.filter(m => _isTabVisible(role, m.id));

    // Append master admin menu if unlocked
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

    // Attach click listeners
    nav.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        if (link.classList.contains('group-toggle')) {
           const parent = link.closest('.nav-group');
           const childrenContainer = parent.querySelector('.nav-group-children');
           const arrow = link.querySelector('.group-arrow');
           if (childrenContainer.style.display === 'none') {
             childrenContainer.style.display = 'flex';
             arrow.style.transform = 'rotate(90deg)';
           } else {
             childrenContainer.style.display = 'none';
             arrow.style.transform = 'rotate(0deg)';
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
    if (!bc) return;
    const items = MENUS[activeRole] || [];
    const found = items.find(m => m.id === tabId);
    bc.textContent = found ? found.label : (tabId === 'admin-general' ? 'Admin. General' : tabId);
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

    // Switch to first tab of the new role
    let firstMenu = MENUS[role][0];
    let firstTabId = firstMenu.id;
    if (firstMenu.isGroup && firstMenu.children && firstMenu.children.length > 0) {
      firstTabId = firstMenu.children[0].id;
    }
    switchTab(firstTabId);

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
    const isMap = tabId.startsWith('mapa-');
    const panelId = isMap ? 'panel-mapa' : `panel-${tabId}`;
    const baseTabId = isMap ? 'mapa' : tabId;

    // Zero-Trust validation: check if user has permission to see this tab
    const permName = TAB_PERMISSIONS[baseTabId];
    if (permName && !hasPermission(permName)) {
      console.warn(`Acceso denegado a la pestaña: ${tabId}`);
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('Acceso denegado: No tiene permisos para este módulo', 'error');
      }
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

    // Close bottom sheet if not on map
    if (!isMap) {
      _closeBottomSheet();
    }

    // ── Special tab actions ──
    if (tabId === 'admin-general') {
      _renderSettingsPermissionsMatrix();
    }

    if (tabId === 'ctacte') {
      if (typeof _renderCtaCte === 'function') _renderCtaCte();
    }
    
    if (tabId === 'catalogo') {
      if (typeof _renderCatalogoDocumentos === 'function') _renderCatalogoDocumentos();
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
      const projectName = tabId.replace('mapa-', '');
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
        // Invalidate map size so tiles render properly
        if (typeof APP5T_Map !== 'undefined' && APP5T_Map._mapInstance) {
          APP5T_Map._mapInstance.invalidateSize();
        }
        // Load all projects and zoom to selected
        if (typeof APP5T_Map !== 'undefined') {
          APP5T_Map.loadAllProjects();
          APP5T_Map.zoomToProject(projectName);
          const projSel = document.getElementById('map-project-select');
          if (projSel) {
            projSel.value = projectName;
            projSel.dispatchEvent(new Event('change'));
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

    // Close sidebar on mobile
    if (isMobile) {
      _closeSidebar();
    }

    // Toggle class on body for map-specific styles
    document.body.classList.toggle('map-tab-active', isMap);

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
    if (role === 'vendedor') {
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa GIS</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'leads' ? ' active' : ''}" data-tab="leads">
          <i class="fa-solid fa-users"></i>
          <span>Mis Clientes</span>
        </a>
      `;
    } else if (role === 'gerente') {
      const isGestionActive = activeTab !== 'mapa' && activeTab !== 'dashboard' && activeTab !== 'admin-general';
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Métricas</span>
        </a>
        <a href="#" class="mobile-nav-item${isGestionActive ? ' active' : ''}" data-tab="gestion">
          <i class="fa-solid fa-list-check"></i>
          <span>Gestión</span>
        </a>
      `;
    } else if (role === 'administrador') {
      const isGestionActive = activeTab !== 'mapa' && activeTab !== 'dashboard' && activeTab !== 'admin-general';
      html = `
        <a href="#" class="mobile-nav-item${activeTab === 'mapa' ? ' active' : ''}" data-tab="mapa">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </a>
        <a href="#" class="mobile-nav-item${activeTab === 'dashboard' ? ' active' : ''}" data-tab="dashboard">
          <i class="fa-solid fa-chart-line"></i>
          <span>Métricas</span>
        </a>
        <a href="#" class="mobile-nav-item${isGestionActive ? ' active' : ''}" data-tab="gestion">
          <i class="fa-solid fa-file-contract"></i>
          <span>Gestión</span>
        </a>
      `;
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

  /* ══════════════════════════════════════════════════════
     ON LOTE SELECTED (called from map)
     ══════════════════════════════════════════════════════ */
  function onLoteSelected(propiedadData) {
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
      
      let planoLink = '';
      if (proy && proy.url) {
        planoLink = ` &nbsp;·&nbsp; <a href="${proy.url}" target="_blank" style="color: var(--accent-green); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="Ver Plano de Loteo"><i class="fa-solid fa-map"></i> Ver Plano</a>`;
      }
      
      projEl.innerHTML = `<strong>Proyecto:</strong> ${proyNom}${planoLink} &nbsp;·&nbsp; <strong>Etapa:</strong> ${etapaNom} &nbsp;·&nbsp; <strong>Lote:</strong> ${loteNom}`;
    }
    if (areaEl) areaEl.textContent = propiedadData.superficie || '-';
    if (priceEl) priceEl.textContent = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);
    if (badgeEl) badgeEl.innerHTML = getStatusBadgeHTML(propiedadData.estado);



    // Render the action form
    const formContainer = document.getElementById('lote-action-form');
    if (formContainer) {
      if (activeRole === 'vendedor') {
        if (propiedadData.estado === 'Reservada' || propiedadData.estado === 'Promesada') {
          let neg = null;
          if (typeof APP5T_DB !== 'undefined') {
            const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedadData.id));
            neg = negs && negs.length ? negs[negs.length - 1] : null;
          }
          if (neg) {
            const cli = APP5T_DB.getById('clientes', neg.id_cliente);
            const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '-';
            const cliRut = cli ? (cli.rut || '-') : '-';
            const vend = APP5T_DB.getById('vendedores', neg.id_vendedor);
            const vendNom = vend ? vend.nombre : '-';
            formContainer.innerHTML = `
              <div class="lote-ficha accent-orange" style="padding: 12px; margin-top: 10px;">
                <div class="lote-ficha-header" style="margin-bottom: 10px;">
                  <i class="fa-solid fa-file-signature"></i>
                  <h4>Información del Acuerdo</h4>
                </div>
                <div class="info-grid-vertical">
                  <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${cliNom}</span></div>
                  <div class="info-item"><span class="info-label">RUT</span><span class="info-value">${cliRut}</span></div>
                  <div class="info-item"><span class="info-label">Vendedor</span><span class="info-value">${vendNom}</span></div>
                </div>
              </div>
            `;
          } else {
            formContainer.innerHTML = `
              <div class="lote-ficha accent-orange" style="padding: 12px; margin-top: 10px; text-align: center;">
                <p style="margin: 0; color: var(--text-dim); font-size: 0.85rem;">
                  <i class="fa-solid fa-circle-info" style="color: var(--accent-orange); margin-right: 4px;"></i>
                  Este lote está <strong>${propiedadData.estado}</strong>, pero no se encontró un acuerdo registrado.
                </p>
              </div>
            `;
          }
        } else if (propiedadData.estado !== 'Disponible') {
          formContainer.innerHTML = `
            <div class="lote-ficha" style="border-color: var(--glass-border); background: rgba(255,255,255,0.01); padding: 12px; text-align: center;">
              <p style="margin: 0; color: var(--text-dim); font-size: 0.85rem;">
                <i class="fa-solid fa-info-circle" style="color: var(--accent-blue); margin-right: 4px;"></i>
                Este lote está en etapa de venta: <strong>${propiedadData.estado}</strong>. No hay acciones adicionales.
              </p>
            </div>
          `;
        } else if (typeof APP5T_Forms !== 'undefined') {
          APP5T_Forms.renderLoteForm(formContainer, propiedadData, activeRole);
        }
      } else if (typeof APP5T_Forms !== 'undefined') {
        APP5T_Forms.renderLoteForm(formContainer, propiedadData, activeRole);
      }
    }

    // Mobile/Tablet: render basic info in Leaflet map popup, full form in Bottom Sheet
    if (window.innerWidth < 1024) {
      const currentRole = (window.APP5T && window.APP5T.getActiveRole) ? window.APP5T.getActiveRole() : activeRole;
      const isRestrictedSeller = currentRole === 'vendedor' && propiedadData.estado !== 'Disponible';

      if (!isRestrictedSeller) {
        // Open bottom sheet directly on mobile to avoid double cards and redundant clicks
        openLoteBottomSheet(propiedadData.id);
        return;
      }

      // Close bottom sheet if open
      _closeBottomSheet();

      const etapa = propiedadData.id_etapa ? APP5T_DB.getById('etapas', propiedadData.id_etapa) : null;
      const proy = etapa ? APP5T_DB.getById('proyectos', etapa.id_proyecto) : null;
      const proyNom = proy ? (proy.nombre_proyecto || proy.nombre || '') : '-';
      const etapaNom = etapa ? (etapa.nombre_etapa || etapa.nombre || '') : '-';
      const loteNom = propiedadData.nombre || '';
      const formattedPrice = APP5T_Utils.formatMoneda(propiedadData.valor_final || 0);

      const popupDiv = document.createElement('div');
      popupDiv.className = 'lote-details-popup';
      popupDiv.style.minWidth = '240px';
      popupDiv.style.maxWidth = '280px';
      popupDiv.style.color = 'var(--text-white)';

      let acuerdoHtml = '';
      if (propiedadData.estado === 'Reservada' || propiedadData.estado === 'Promesada') {
        let neg = null;
        if (typeof APP5T_DB !== 'undefined') {
          const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedadData.id));
          neg = negs && negs.length ? negs[negs.length - 1] : null;
        }
        if (neg) {
          const cli = APP5T_DB.getById('clientes', neg.id_cliente);
          const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '-';
          const cliRut = cli ? (cli.rut || '-') : '-';
          const vend = APP5T_DB.getById('vendedores', neg.id_vendedor);
          const vendNom = vend ? vend.nombre : '-';
          acuerdoHtml = `
            <div class="lote-acuerdo-info" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--glass-border); font-size: 0.75rem; color: var(--text-dim);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Cliente:</span>
                <strong style="color: var(--text-white);">${cliNom}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>RUT:</span>
                <strong style="color: var(--text-white);">${cliRut}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Vendedor:</span>
                <strong style="color: var(--text-white);">${vendNom}</strong>
              </div>
            </div>
          `;
        }
      }

      popupDiv.innerHTML = `
        <div class="lote-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px; gap: 8px;">
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin:0 0 2px 0; font-size:1.05rem; font-weight:700; color:var(--text-white); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${loteNom}</h3>
            <span style="font-size:0.7rem; color:var(--text-dim); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${proyNom} · ${etapaNom}</span>
          </div>
          <span class="status-badge" style="flex-shrink:0;">${getStatusBadgeHTML(propiedadData.estado)}</span>
        </div>
        <div class="lote-specs" style="display:flex; gap:10px; margin-bottom:12px; font-size:0.75rem;">
          <div class="spec" style="flex:1;">
            <span class="spec-label" style="color:var(--text-dim); display:block; font-size:0.65rem;">Superficie</span>
            <strong class="spec-value" style="color:var(--text-white);">${propiedadData.superficie || '-'} m²</strong>
          </div>
          <div class="spec" style="flex:1;">
            <span class="spec-label" style="color:var(--text-dim); display:block; font-size:0.65rem;">Precio Lista</span>
            <strong class="spec-value" style="color:var(--text-white);">${formattedPrice}</strong>
          </div>
        </div>
        ${acuerdoHtml}
      `;

      if (typeof APP5T_Map !== 'undefined' && APP5T_Map.openPopup) {
        APP5T_Map.openPopup(propiedadData.id, popupDiv);
      }
    }
  }

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
              <strong class="spec-value" style="color:var(--text-white);">${propiedadData.superficie || '-'} m²</strong>
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
      if (popupFormContainer) {
        if (activeRole === 'vendedor') {
          if (propiedadData.estado === 'Reservada' || propiedadData.estado === 'Promesada') {
            let neg = null;
            if (typeof APP5T_DB !== 'undefined') {
              const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(propiedadData.id));
              neg = negs && negs.length ? negs[negs.length - 1] : null;
            }
            if (neg) {
              const cli = APP5T_DB.getById('clientes', neg.id_cliente);
              const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : '-';
              const cliRut = cli ? (cli.rut || '-') : '-';
              const vend = APP5T_DB.getById('vendedores', neg.id_vendedor);
              const vendNom = vend ? vend.nombre : '-';
              popupFormContainer.innerHTML = `
                <div class="lote-ficha accent-orange" style="padding: 12px; margin-top: 10px;">
                  <div class="lote-ficha-header" style="margin-bottom: 10px;">
                    <i class="fa-solid fa-file-signature"></i>
                    <h4>Información del Acuerdo</h4>
                  </div>
                  <div class="info-grid-vertical">
                    <div class="info-item"><span class="info-label">Cliente</span><span class="info-value">${cliNom}</span></div>
                    <div class="info-item"><span class="info-label">RUT</span><span class="info-value">${cliRut}</span></div>
                    <div class="info-item"><span class="info-label">Vendedor</span><span class="info-value">${vendNom}</span></div>
                  </div>
                </div>
              `;
            } else {
              popupFormContainer.innerHTML = `
                <div class="lote-ficha accent-orange" style="padding: 12px; margin-top: 10px; text-align: center;">
                  <p style="margin: 0; color: var(--text-dim); font-size: 0.85rem;">
                    <i class="fa-solid fa-circle-info" style="color: var(--accent-orange); margin-right: 4px;"></i>
                    Este lote está <strong>${propiedadData.estado}</strong>, pero no se encontró un acuerdo registrado.
                  </p>
                </div>
              `;
            }
          } else if (propiedadData.estado !== 'Disponible') {
            popupFormContainer.innerHTML = `
              <div class="lote-ficha" style="border-color: var(--glass-border); background: rgba(255,255,255,0.01); padding: 12px; text-align: center;">
                <p style="margin: 0; color: var(--text-dim); font-size: 0.85rem;">
                  <i class="fa-solid fa-info-circle" style="color: var(--accent-blue); margin-right: 4px;"></i>
                  Este lote está en etapa de venta: <strong>${propiedadData.estado}</strong>. No hay acciones adicionales.
                </p>
              </div>
            `;
          } else if (typeof APP5T_Forms !== 'undefined') {
            APP5T_Forms.renderLoteForm(popupFormContainer, propiedadData, activeRole);
          }
        } else if (typeof APP5T_Forms !== 'undefined') {
          APP5T_Forms.renderLoteForm(popupFormContainer, propiedadData, activeRole);
        }
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

  /* ══════════════════════════════════════════════════════
     REFRESH ALL - Master data refresh
     ══════════════════════════════════════════════════════ */
  function refreshAll() {
    _populateMapProjects();
    const stats = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getStats() : null;

    // ── 1. KPI cards (if stats available) ──
    if (stats) {
      _setContent('kpi-total', stats.totales);
      _setContent('kpi-disponibles', stats.disponibles);
      _setContent('kpi-reservadas', (stats.reservadas || 0) + (stats.solicitadas || 0));
      _setContent('kpi-promesadas', stats.enPromesa || stats.promesadas || 0);
      _setContent('kpi-vendidas', stats.vendidas);
      _setContent('kpi-ingreso', APP5T_Utils.formatMoneda(stats.ingresoRecaudado || 0));
    }

    // ── 2. Dashboard charts ──
    if (activeTab === 'dashboard' && typeof APP5T_Charts !== 'undefined') {
      APP5T_Charts.renderDashboard(activeRole);
    }

    // ── 3. Recent transactions ──
    _renderTransactions();

    // ── 4. Approvals table ──
    _renderAprobaciones();

    // ── 5. Price control table ──
    _renderPrecios();

    // ── 6. Mesa Documental: Promesas ──
    _renderMesaPromesas();
    _renderMesaPromesasCurso();

    // ── 7. Mesa Documental: Escrituras ──
    _renderMesaEscrituras();

    // ── 8. Cuenta Corriente ──
    _renderCtaCte();

    // ── 8b. Informes ──
    _renderInformes();

    // ── 9. Inventario ──
    _renderInventario();

    // ── 10. Auditoría ──
    _renderAuditoria();

    // ── 11. Leads ──
    _renderLeads();
    _renderPendingApprovals();

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
    tbody.innerHTML = negs.map(n => {
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

  function _renderAprobaciones() {
    const listContainer = document.getElementById('list-aprobaciones');
    if (!listContainer) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => {
      if (p.estado === 'Pendiente') return true;
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [];
      const negCurso = negs.find(n => n.estado_avance === 'En Curso');
      if (p.estado === 'Reservada' && negCurso && !negCurso.autorizado_promesa) {
        return true; // Reserva waiting for manager signature
      }
      const negEscrituracion = negs.find(n => n.estado_escrituracion === 'Pendiente');
      if (negEscrituracion) {
        return true;
      }
      const negPromesaEsc = negs.find(n => (n.notas || '').includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]'));
      if (negPromesaEsc) {
        return true;
      }
      return false;
    });
    
    if (props.length === 0) { 
      listContainer.innerHTML = '<div class="text-center text-muted" style="padding: 20px;">Sin aprobaciones pendientes</div>'; 
      return; 
    }
    
    listContainer.innerHTML = props.map(p => {
      let neg = (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id) && n.estado_escrituracion === 'Pendiente') || [])[0];
      if (!neg) {
        neg = (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id) && (n.notas || '').includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]')) || [])[0];
      }
      if (!neg) {
        neg = (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id) && n.estado_avance === 'En Curso') || [])[0];
      }
      if (!neg) {
        neg = (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [])[0];
      }
      const cli = neg ? APP5T_DB.getById('clientes', neg.id_cliente) : null;
      const vend = neg ? APP5T_DB.getById('vendedores', neg.id_vendedor) : null;
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      
      const loteProy = `${p.nombre || `Lote ${p.id}`}`;
      const nombreProy = proy ? (proy.nombre_proyecto || proy.nombre) : '-';
      const esVD = neg && neg.id_proceso === 'Venta_Directa';
      let tipoBadge = '';
      if (neg && (neg.estado_escrituracion === 'Pendiente' || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]'))) {
        tipoBadge = `<span class="tag" style="font-size:0.72rem; white-space:nowrap; background-color: var(--accent-green); color: white;"><i class="fa-solid fa-gavel"></i> Aprobar a Escritura</span>`;
      } else if (esVD) {
        tipoBadge = `<span class="tag tag-venta-directa" style="font-size:0.72rem; white-space:nowrap;"><i class="fa-solid fa-bolt"></i> Venta Directa</span>`;
      } else if (p.estado === 'Reservada') {
        tipoBadge = `<span class="tag tag-warning" style="font-size:0.72rem; white-space:nowrap; background-color: var(--accent-orange); color: white;"><i class="fa-solid fa-file-signature"></i> Firma Pendiente</span>`;
      } else {
        tipoBadge = `<span class="tag tag-pending" style="font-size:0.72rem; white-space:nowrap;">Reserva Nueva</span>`;
      }
      
      const cliName = cli ? `${cli.nombres} ${cli.apellidos}` : 'Pendiente / Sin Cliente';
      const vendName = vend ? vend.nombre : '-';
      const abono = neg ? APP5T_Utils.formatMoneda(neg.pie || 0) : '-';
      const final = neg ? APP5T_Utils.formatMoneda(neg.valor_final || 0) : '-';

      return `
      <div class="card" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px; overflow: hidden;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:12px; gap: 10px;">
          <div style="flex: 1; min-width: 0;">
            <h4 style="margin:0; font-size:1.1rem; color:var(--text-white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${loteProy}">${loteProy}</h4>
            <span style="font-size:0.8rem; color:var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombreProy}"><i class="fa-solid fa-location-dot"></i> ${nombreProy}</span>
          </div>
          <div style="flex-shrink: 0;">${tipoBadge}</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
          <div style="min-width:0;">
            <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em;">Cliente</div>
            <div style="font-size:0.9rem; color:var(--text-light); font-weight:500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cliName}">${cliName}</div>
          </div>
          <div style="min-width:0;">
            <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em;">Vendedor</div>
            <div style="font-size:0.9rem; color:var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${vendName}">${vendName}</div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em;">Abono / Pie</div>
            <div style="font-size:0.95rem; color:var(--accent-green); font-weight:700;">${abono}</div>
          </div>
          <div>
            <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em;">Precio Final</div>
            <div style="font-size:0.95rem; color:var(--text-white); font-weight:700;">${final}</div>
          </div>
        </div>
        
        
        
        <div style="display:flex; gap:10px; justify-content: flex-end; flex-wrap: wrap;">
          ${(neg && (neg.estado_escrituracion === 'Pendiente' || (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]'))) ? `
          <button class="btn btn-outline" style="flex: 1; min-width: 140px;" onclick="if(typeof APP5T_Forms !== 'undefined') APP5T_Forms.descargarFichaLegal('${p.id}')">
            <i class="fa-solid fa-file-pdf"></i> Ficha Legal
          </button>
          <button class="btn btn-primary" style="flex: 1; min-width: 140px;" onclick="window.APP5T._aprobarAutorizacionEscrituracion('${neg.id}')"><i class="fa-solid fa-check"></i> Aprobar Escrituración</button>
          ` : `
          <button class="btn btn-danger" style="flex:1;" onclick="window.APP5T._rechazarReservaDirecta('${p.id}', event)">
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
          <button class="btn btn-success" style="flex:1;" onclick="window.APP5T._aprobarReservaDirecta('${p.id}', event)">
            <i class="fa-solid fa-check"></i> Aprobar
          </button>
          `}
        </div>
      </div>
      `;
    }).join('');
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
        props = props.filter(p => p.id_proyecto === proy.id);
      }
    }
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin propiedades</td></tr>'; return; }
    tbody.innerHTML = props.map(p => {
      const proy = p.id_proyecto ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      const proyectoNombre = proy ? proy.nombre_proyecto : '-';
      return `<tr>
        <td>${p.nombre || p.id}</td>
        <td data-label="Proyecto">${proyectoNombre}</td>
        <td>${p.superficie || '-'} m²</td>
        <td>${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>
      </tr>`;
    }).join('');
  }

  function _renderMesaPromesas() {
    const tbody = document.getElementById('tbody-mesa-promesas');
    if (!tbody) return;
    const negs = (APP5T_DB.getAll('negociaciones') || []).filter(n =>
      n.id_proceso === 'Reserva' && (n.estado_avance === 'Aprobado' || n.estado_avance === 'En Curso')
    );
    // Cross-reference with propiedades estado='Reservada'
    let items = negs.filter(n => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      return p && p.estado === 'Reservada';
    });
    
    // Sort descending by id to show the most recent first
    items.sort((a, b) => b.id - a.id);

    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin Reservas Pendientes</td></tr>'; return; }
    tbody.innerHTML = items.map((n, idx) => {
      const p = APP5T_DB.getById('propiedades', n.id_propiedad);
      const c = APP5T_DB.getById('clientes', n.id_cliente);
      const proy = p ? APP5T_DB.getById('proyectos', p.id_proyecto) : null;
      let loteProy = p ? `${p.nombre} / ${proy ? proy.nombre_proyecto : '-'}` : `Lote ${n.id_propiedad}`;

      // Highlight the first item
      if (idx === 0) {
        loteProy = `<strong style="color: var(--accent-green); font-size: 1.05em;">${loteProy}</strong>`;
      }

      // Query documents for this lot/property
      const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(n.id_propiedad)) : []) || [];
      const docTypes = ['Cédula/RUT', 'Comprobantes', 'Reserva', 'Promesa', 'Escritura'];
      let requiredCount = 2; // Default for Reservada
      if (p && (p.estado === 'Promesada' || p.estado === 'Venta_Directa')) requiredCount = 4;
      else if (p && (p.estado === 'Vendida' || p.estado === 'Escriturada')) requiredCount = 5;
      
      let checkedCount = 0;
      docTypes.forEach(type => {
        if (docs.some(d => d.tipo_documento === type)) checkedCount++;
      });
      let progressPercent = requiredCount > 0 ? Math.round((checkedCount / requiredCount) * 100) : 0;
      if (progressPercent > 100) progressPercent = 100;
      
      let progressColor = 'var(--accent-red)';
      if (progressPercent >= 100) progressColor = 'var(--accent-green)';
      else if (progressPercent >= 50) progressColor = 'var(--accent-orange)';

      let docsHtml = `<div style="display:inline-block; padding: 4px 10px; border-radius: 20px; background: ${progressColor}22; border: 1px solid ${progressColor}44; color: ${progressColor}; font-weight: 600; font-size: 0.75rem; text-align: center; min-width: 60px;" title="Documentación: ${checkedCount}/${requiredCount}">${progressPercent}%</div>`;

      const tipoBadge = `<span class="tag tag-escritura" style="font-size:0.72rem; background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.25);">Generar Promesa</span>`;

      return `<tr>
        <td>${loteProy}</td>
        <td>${tipoBadge}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '-'}</td>
        <td>${APP5T_Utils.formatMoneda(n.valor_final || 0)}</td>
        <td>${docsHtml}</td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            <button class="btn btn-sm btn-outline" onclick="window.APP5T._signPromesa('${n.id}')" title="Registrar Promesa" style="padding: 5px 10px;">
              <i class="fa-solid fa-file-signature" style="color: var(--accent-blue);"></i> Promesa
            </button>
            <button class="btn btn-sm btn-outline" onclick="APP5T_Forms.mostrarComprobanteReservaSimulado('${n.id}')" title="Generar Recibo" style="padding: 5px 10px;">
              <i class="fa-solid fa-file-invoice-dollar" style="color: #10b981;"></i> Recibo
            </button>
            <button class="btn btn-sm btn-outline danger-action" onclick="window.APP5T._rechazarReservaDirecta('${n.id_propiedad}', event)" title="Cancelar Reserva" style="padding: 5px 10px;">
              <i class="fa-solid fa-ban" style="color: var(--accent-red);"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
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
      const tel = '56974300363'; // Gerente
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

  function _renderMesaPromesasCurso() {
    const tbody = document.getElementById('tbody-mesa-promesas-curso');
    if (!tbody) return;
    const props = (APP5T_DB.getAll('propiedades') || []).filter(p => p.estado === 'Promesada');
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin promesas en curso</td></tr>'; return; }
    
    const todasCtaCte = APP5T_DB.getAll('cuenta_corriente') || [];
    let itemsHtml = '';

    props.forEach(p => {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [];
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
      let checkedCount = 0;
      docTypes.forEach(type => { if (docs.some(d => d.tipo_documento === type)) checkedCount++; });
      let progressPercent = Math.min(100, requiredCount > 0 ? Math.round((checkedCount / requiredCount) * 100) : 0);
      
      let progressColor = 'var(--accent-red)';
      if (progressPercent >= 100) progressColor = 'var(--accent-green)';
      else if (progressPercent >= 50) progressColor = 'var(--accent-orange)';

      let docsHtml = '<div style="display:inline-block; padding: 4px 10px; border-radius: 20px; background: ' + progressColor + '22; border: 1px solid ' + progressColor + '44; color: ' + progressColor + '; font-weight: 600; font-size: 0.75rem; text-align: center; min-width: 60px;" title="Documentación: ' + checkedCount + '/' + requiredCount + '">' + progressPercent + '%</div>';

      const tipoBadge = '<span class="tag" style="font-size:0.72rem; background: rgba(243, 156, 18, 0.15); color: #f39c12; border: 1px solid rgba(243, 156, 18, 0.25);"><i class="fa-solid fa-file-signature"></i> Promesa en Curso</span>';

      let actionItemHtml = '';
      if (!todasPagadas) {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.55; cursor: not-allowed; padding: 5px 10px;" title="${tooltipText}"><i class="fa-solid fa-lock" style="color: var(--text-dim);"></i> Bloqueado</button>`;
      } else if (neg.autorizado_escriturar === 'Pendiente') {
        actionItemHtml = `<button class="btn btn-sm btn-outline disabled" style="opacity: 0.6; cursor: not-allowed; padding: 5px 10px;"><i class="fa-solid fa-clock" style="color: var(--accent-orange);"></i> Pendiente Autorización</button>`;
      } else {
        actionItemHtml = `<button class="btn btn-sm btn-outline" onclick="window.APP5T._autorizarPromesaEscrituracion('${neg.id}')" title="Solicitar Escrituración" style="padding: 5px 10px;"><i class="fa-solid fa-check" style="color: var(--accent-green);"></i> Solicitar</button>`;
      }

      itemsHtml += '<tr>' +
        '<td>' + loteProy + '</td>' +
        '<td>' + tipoBadge + '</td>' +
        '<td>' + (c ? c.nombres + ' ' + c.apellidos : '-') + '</td>' +
        '<td>' + APP5T_Utils.formatMoneda(neg.valor_final || 0) + '</td>' +
        '<td>' + docsHtml + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' +
          '<div style="display: flex; gap: 6px; justify-content: flex-end;">' +
             actionItemHtml +
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
         const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [];
         const neg = negs.sort((a, b) => b.id - a.id)[0];
         return (neg && (neg.notas || '').includes('[AUTORIZADO_ESCRITURAR:TRUE]'));
      }
      return false;
    });
    if (props.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin escrituras pendientes</td></tr>'; return; }

    const todasCtaCte = APP5T_DB.getAll('cuenta_corriente') || [];

    tbody.innerHTML = props.map(p => {
      const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [];
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
      
      let checkedCount = 0;
      docTypes.forEach(type => {
        if (docs.some(d => d.tipo_documento === type)) checkedCount++;
      });
      let progressPercent = requiredCount > 0 ? Math.round((checkedCount / requiredCount) * 100) : 0;
      if (progressPercent > 100) progressPercent = 100;
      
      let progressColor = 'var(--accent-red)';
      if (progressPercent >= 100) progressColor = 'var(--accent-green)';
      else if (progressPercent >= 50) progressColor = 'var(--accent-orange)';

      let docsHtml = `<div style="display:inline-block; padding: 4px 10px; border-radius: 20px; background: ${progressColor}22; border: 1px solid ${progressColor}44; color: ${progressColor}; font-weight: 600; font-size: 0.75rem; text-align: center; min-width: 60px;" title="Documentación: ${checkedCount}/${requiredCount}">${progressPercent}%</div>`;

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
        <td>${loteProy}</td>
        <td>${tipoBadge}</td>
        <td>${c ? `${c.nombres} ${c.apellidos}` : '-'}</td>
        <td>${APP5T_Utils.formatMoneda(neg ? neg.valor_final : p.valor_final)}</td>
        <td>${docsHtml}</td>
        <td style="text-align:right; white-space:nowrap;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${actionItemHtml}
            <button class="btn btn-sm btn-outline danger-action" onclick="window.APP5T._rechazarReservaDirecta('${p.id}', event)" title="Cancelar Venta" style="padding: 5px 10px;">
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

    // Populate the client filter dropdown
    const filterSelect = document.getElementById('ctacte-filter-cliente');
    const selectedClientId = filterSelect ? filterSelect.value : 'all';
    
    const lotGroup = document.getElementById('ctacte-filter-lote-group');
    const lotSelect = document.getElementById('ctacte-filter-lote');
    let selectedLoteId = lotSelect ? lotSelect.value : 'all';

    const allClientes = APP5T_DB.getAll('clientes') || [];
    const negs = APP5T_DB.getAll('negociaciones') || [];
    const clientIdsWithNegs = new Set(negs.map(n => String(n.id_cliente)));
    const activeClientes = allClientes.filter(c => clientIdsWithNegs.has(String(c.id)));

    if (filterSelect) {
      let html = '<option value="all">-- Todos los Clientes --</option>';
      activeClientes.forEach(c => {
        const isSel = String(c.id) === selectedClientId ? 'selected' : '';
        html += `<option value="${c.id}" ${isSel}>${c.nombres} ${c.apellidos} (${c.rut})</option>`;
      });
      filterSelect.innerHTML = html;

      if (!filterSelect.dataset.listenerAttached) {
        filterSelect.addEventListener('change', () => {
          // Reset selected lot to 'all' when client changes
          const lotSelectEl = document.getElementById('ctacte-filter-lote');
          if (lotSelectEl) lotSelectEl.value = 'all';
          _renderCtaCte();
        });
        filterSelect.dataset.listenerAttached = 'true';
      }
    }

    // Populate the lot filter dropdown if a specific client is selected
    if (selectedClientId !== 'all' && lotSelect && lotGroup) {
      lotGroup.style.display = 'flex';
      
      const clientNegs = negs.filter(n => String(n.id_cliente) === selectedClientId);
      const clientProps = clientNegs.map(n => {
        const p = APP5T_DB.getById('propiedades', n.id_propiedad);
        return p ? { id: p.id, nombre: p.nombre, estado: p.estado, negId: n.id } : null;
      }).filter(Boolean);

      let lotHtml = '<option value="all">-- Todos los Lotes --</option>';
      clientProps.forEach(p => {
        const isSel = String(p.id) === selectedLoteId ? 'selected' : '';
        lotHtml += `<option value="${p.id}" ${isSel}>${p.nombre} (${p.estado})</option>`;
      });
      lotSelect.innerHTML = lotHtml;

      // Re-read selected value in case it was reset or updated
      selectedLoteId = lotSelect.value;

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

    // Fetch and display documents for the selected client/lote in CtaCte header
    const docContainer = document.getElementById('ctacte-documents-container');
    if (docContainer) {
      if (selectedClientId === 'all') {
        docContainer.style.display = 'none';
        docContainer.innerHTML = '';
      } else {
        const clientNegs = negs.filter(n => String(n.id_cliente) === selectedClientId);
        const targetNegs = selectedLoteId !== 'all' 
          ? clientNegs.filter(n => String(n.id_propiedad) === selectedLoteId)
          : clientNegs;
        
        const propIds = targetNegs.map(n => String(n.id_propiedad));
        const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => propIds.includes(String(d.id_propiedad))) : []) || [];
        
        let totalDocs = targetNegs.filter(n => n.url).length + docs.length;
        if (totalDocs === 0) {
          docContainer.style.display = 'none';
          docContainer.innerHTML = '';
        } else {
          docContainer.style.display = 'inline-block';
          
          let itemsHtml = '';
          targetNegs.forEach(n => {
            if (n.url) {
              const prop = APP5T_DB.getById('propiedades', n.id_propiedad);
              const label = prop ? `Ficha/Recibo ${prop.nombre}` : 'Recibo Reserva';
              itemsHtml += `<li><a href="${n.url}" target="_blank" class="dropdown-item" style="color: #fff;"><i class="fa-solid fa-receipt"></i> ${label}</a></li>`;
            }
          });
          
          docs.forEach(d => {
            let icon = 'fa-file-pdf';
            let color = 'var(--accent-blue)';
            if (d.tipo_documento === 'Contrato') { icon = 'fa-file-signature'; color = 'var(--accent-purple)'; }
            else if (d.tipo_documento === 'Escritura') { icon = 'fa-gavel'; color = 'var(--accent-red)'; }
            else if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
            else if (d.tipo_documento === 'Carpeta') { icon = 'fa-folder-open'; color = 'var(--accent-orange)'; }
            
            const prop = APP5T_DB.getById('propiedades', d.id_propiedad);
            const propPrefix = prop ? `${prop.nombre}: ` : '';
            itemsHtml += `<li><a href="${d.url_drive}" target="_blank" class="dropdown-item" style="color: ${color};"><i class="fa-solid ${icon}"></i> ${propPrefix}${d.nombre}</a></li>`;
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

    let ctas = APP5T_DB.getAll('cuenta_corriente') || [];
    // Sort by cuota_nro ascending
    ctas.sort((a, b) => (Number(a.cuota_nro) || 0) - (Number(b.cuota_nro) || 0));

    if (selectedClientId !== 'all') {
      ctas = ctas.filter(c => String(c.id_cliente) === selectedClientId);
    }
    if (selectedLoteId !== 'all') {
      ctas = ctas.filter(c => String(c.id_propiedad) === selectedLoteId);
    }

    if (selectedClientId === 'all') {
      // PANEL PROACTIVO: Solo mostrar cuotas pendientes/vencidas, ordenadas por fecha más próxima
      ctas = ctas.filter(c => c.estado_cuota !== 'Pagada');
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

    // If a specific client is selected and they have no cuotas
    if (selectedClientId !== 'all' && ctas.length === 0) {
      const clientNegs = negs.filter(n => String(n.id_cliente) === selectedClientId);
      
      // If we filtered by a specific lot, look for that lot's negotiation. Otherwise fallback to the active one.
      let activeNeg = null;
      if (selectedLoteId !== 'all') {
        activeNeg = clientNegs.find(n => String(n.id_propiedad) === selectedLoteId);
      } else {
        activeNeg = clientNegs.find(n => n.estado_avance === 'En Curso' || n.estado_avance === 'Aprobado') || clientNegs[0];
      }

      if (activeNeg) {
        const prop = APP5T_DB.getById('propiedades', activeNeg.id_propiedad);
        const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
        const loteProy = prop ? `${prop.nombre} / ${proy ? proy.nombre_proyecto : '-'}` : `Lote ${activeNeg.id_propiedad}`;

        if (prop && prop.estado !== 'Promesada') {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center" style="padding: 40px 20px;">
                <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                  <i class="fa-solid fa-lock" style="font-size: 3rem; color: var(--text-dim); opacity: 0.6;"></i>
                  <div style="color: var(--text-white); font-weight: 600; font-size: 1.1rem;">Activación no Disponible</div>
                  <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 500px; line-height: 1.5;">
                    El lote <strong>${loteProy}</strong> se encuentra en estado <strong>${prop.estado}</strong>. 
                    Solo se pueden activar las cuotas de Cuenta Corriente cuando la propiedad se encuentre en estado de <strong>Promesa</strong> (Promesada).
                  </div>
                </div>
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 40px 20px;">
              <div class="no-ctacte-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <i class="fa-solid fa-money-check-dollar" style="font-size: 3rem; color: var(--accent-orange); opacity: 0.8;"></i>
                <div style="color: var(--text-white); font-weight: 600; font-size: 1.1rem;">La Cuenta Corriente no está activa</div>
                <div style="color: var(--text-dim); font-size: 0.9rem; max-width: 500px; line-height: 1.5;">
                  El cliente tiene una negociación en estado de Promesa para el lote <strong>${loteProy}</strong> pero no se han generado sus cuotas de financiamiento.
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
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding: 30px;">El cliente seleccionado no posee negociaciones registradas para activar su Cuenta Corriente.</td></tr>';
        return;
      }
    }

    if (ctas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding: 30px;">Sin registros de Cuenta Corriente</td></tr>';
      return;
    }

    let htmlRows = '';
    if (selectedClientId !== 'all' && selectedLoteId !== 'all') {
       const clientNegs = negs.filter(n => String(n.id_cliente) === selectedClientId);
       const activeNeg = clientNegs.find(n => String(n.id_propiedad) === selectedLoteId);
       if (activeNeg) {
           htmlRows += `<tr><td colspan="8" style="text-align: right; background-color: var(--glass-bg); padding: 10px;"><button class="btn btn-sm btn-outline" onclick="window.APP5T._showActivarCtaCteModal(''${activeNeg.id}'')" style="color: var(--accent-orange); border-color: var(--accent-orange);"><i class="fa-solid fa-rotate"></i> Regenerar Plan de Pagos (Corrige fechas)</button></td></tr>`;
       }
    }
    htmlRows += ctas.map(c => {
      const cli = APP5T_DB.getById('clientes', c.id_cliente);
      const prop = APP5T_DB.getById('propiedades', c.id_propiedad);
      const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
      const loteProy = prop ? `${prop.nombre} / ${proy ? proy.nombre_proyecto : '-'}` : `Lote ${c.id_propiedad}`;
      const metodoHtml = c.metodo_pago && c.estado_cuota !== 'Pendiente Pago' ? `<br><small style="color: var(--text-dim); font-size: 0.75rem;"><i class="fa-solid fa-credit-card"></i> ${c.metodo_pago}</small>` : '';
      let estadoMostrar = c.estado_cuota;
      if (c.estado_cuota !== 'Pagada' && c.fecha_vencimiento) {
        if (typeof parseDdMmYyyy !== 'undefined') {
          const vDate = parseDdMmYyyy(c.fecha_vencimiento);
          if (vDate) {
            const dt = new Date(vDate.year, vDate.month - 1, vDate.day);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (dt < now) estadoMostrar = 'Vencida';
          }
        } else {
           // Fallback if parseDdMmYyyy isn't available
           const p = c.fecha_vencimiento.includes('/') ? c.fecha_vencimiento.split('/') : c.fecha_vencimiento.split('-');
           if (p.length === 3) {
             const dt = new Date(p[2], p[1]-1, p[0]);
             const now = new Date();
             now.setHours(0, 0, 0, 0);
             if (dt < now) estadoMostrar = 'Vencida';
           }
        }
      }
      return `<tr>
        <td>${cli ? `${cli.nombres} ${cli.apellidos}` : '-'}</td>
        <td>${loteProy}</td>
        <td>${c.cuota_nro || '-'}</td>
        <td>${APP5T_Utils.formatMoneda(c.valor_cuota || 0)}</td>
        <td>${c.fecha_vencimiento || '-'}</td>
        <td>${APP5T_Utils.formatMoneda(c.valor_pagado || 0)}${metodoHtml}</td>
        <td>${getStatusBadgeHTML(estadoMostrar)}</td>
        <td style="text-align:right">
          ${c.estado_cuota !== 'Pagada' ? `<button class="btn btn-sm btn-success" onclick="window.APP5T._payCuota('${c.id}')"><i class="fa-solid fa-receipt"></i> Pagar</button>` : '-'}
        </td>
      </tr>`;
      }).join('');
      tbody.innerHTML = htmlRows;
    }


  function _renderLeads() {
    const container = document.getElementById('leads-container');
    if (!container) return;
    const vendedores = APP5T_DB.getAll('vendedores') || [];
    const vendActivo = _resolveActiveVendedor(vendedores);
    const idVend = vendActivo ? vendActivo.id : null;

    let clientes = APP5T_DB.getAll('clientes') || [];
    if (idVend) {
      clientes = clientes.filter(c => String(c.id_vendedor) === String(idVend));
    }
    if (clientes.length === 0) { 
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">Sin clientes asignados</div>'; 
      return; 
    }
    
    container.innerHTML = clientes.map(c => {
      const nombreCompleto = `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Cliente Sin Nombre';
      const telefono = c.telefono ? String(c.telefono).replace(/[\s\+]/g, '') : '';
      let waNum = telefono;
      if (waNum && (waNum.length === 9 || waNum.length === 8)) waNum = '56' + waNum;
      const waLink = waNum ? `https://wa.me/${waNum}` : '#';
      const emailObj = c.email ? String(c.email).trim() : '';
      
      const negociaciones = APP5T_DB.getAll('negociaciones') || [];
      const neg = negociaciones.find(n => String(n.id_cliente) === String(c.id));
      let compraText = '<span style="color:var(--text-muted);font-style:italic;">Solo Prospecto</span>';
      let finanzasText = '';
      let docsListHtml = '';
      
      if (neg) {
         const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
         if (prop) {
             const proy = APP5T_DB.getById('proyectos', prop.id_proyecto);
             compraText = `${prop.nombre} (${proy ? proy.nombre_proyecto : ''})`;
         } else {
             compraText = `Prop. ID ${neg.id_propiedad}`;
         }
         
         const formatM = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatMoneda) ? APP5T_Utils.formatMoneda : (v => '$' + v);
         const moneda = neg.tipo_moneda === 'UF' ? 'UF ' : '';
         finanzasText = `${moneda}${formatM(neg.valor_final || 0)}`;

         // Fetch documents for the lead's property
         const docs = (typeof APP5T_DB !== 'undefined' ? APP5T_DB.query('documentos', d => String(d.id_propiedad) === String(neg.id_propiedad)) : []) || [];
         let totalDocs = (neg.url ? 1 : 0) + docs.length;
         if (totalDocs > 0) {
           let docsLinks = [];
           if (neg.url) {
             docsLinks.push(`<a href="${neg.url}" target="_blank" style="color:var(--text-white,#fff); text-decoration:none; font-size:0.65rem; display:inline-flex; align-items:center; gap:2px; margin-right:2px; border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:2px 4px; background:rgba(255,255,255,0.02);" title="Recibo/Ficha Reserva"><i class="fa-solid fa-receipt"></i> Recibo</a>`);
           }
           docs.forEach(d => {
             let icon = 'fa-file-pdf';
             let color = 'var(--accent-blue)';
             if (d.tipo_documento === 'Contrato') { icon = 'fa-file-signature'; color = 'var(--accent-purple)'; }
             else if (d.tipo_documento === 'Escritura') { icon = 'fa-gavel'; color = 'var(--accent-red)'; }
             else if (d.tipo_documento === 'Plano') { icon = 'fa-map'; color = 'var(--accent-green)'; }
             else if (d.tipo_documento === 'Carpeta') { icon = 'fa-folder-open'; color = 'var(--accent-orange)'; }
             
             docsLinks.push(`<a href="${d.url_drive}" target="_blank" style="color:${color}; text-decoration:none; font-size:0.65rem; display:inline-flex; align-items:center; gap:2px; margin-right:2px; border:1px solid ${color}33; border-radius:4px; padding:2px 4px; background:${color}0a;" title="${d.nombre} (${d.tipo_documento})"><i class="fa-solid ${icon}"></i> ${d.nombre.substring(0, 10)}${d.nombre.length > 10 ? '..' : ''}</a>`);
           });
           
           docsListHtml = `
             <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 4px;">
               <span style="font-size:0.65rem; text-transform:uppercase; color:var(--text-dim); font-weight:700; margin-right:2px;"><i class="fa-solid fa-folder-open" style="color:var(--accent-blue);"></i> Docs:</span>
               ${docsLinks.join('')}
             </div>
           `;
         }
      }

      const ingreso = c.fecha_ingreso ? (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatFecha ? APP5T_Utils.formatFecha(c.fecha_ingreso) : c.fecha_ingreso) : '-';
      
      return `
        <div class="client-card">
          <div class="client-header-row">
            <div class="client-main-info">
              <span class="client-name-text" title="${nombreCompleto}">${nombreCompleto}</span>
              ${getStatusBadgeHTML(c.estado_cliente)}
            </div>
            <div class="client-header-actions">
              <a href="tel:${telefono}" class="circle-btn circle-btn-call ${!telefono ? 'disabled' : ''}" title="Llamar"><i class="fa-solid fa-phone"></i></a>
              <a href="${waLink}" target="_blank" class="circle-btn circle-btn-wa ${!telefono ? 'disabled' : ''}" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
              <a href="mailto:${emailObj}" class="circle-btn circle-btn-email ${!emailObj ? 'disabled' : ''}" title="Correo"><i class="fa-regular fa-envelope"></i></a>
            </div>
          </div>
          <div class="client-body-row">
            <div class="client-sub-info">
              <span><i class="fa-solid fa-key"></i> ${compraText}</span>
              ${finanzasText ? `<span><i class="fa-solid fa-sack-dollar"></i> ${finanzasText}</span>` : ''}
            </div>
            <div class="client-date-reg">Registrado: ${ingreso}</div>
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
        const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(p.id)) || [];
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
      
      let checkedCount = 0;
      let checkboxesHtml = docTypes.map(type => {
        const hasDoc = docs.some(d => d.tipo_documento === type);
        if (hasDoc) checkedCount++;
        return `
          <td class="text-center" data-label="${type}">
            <div class="form-check form-switch d-flex justify-content-center mb-0">
              <input class="form-check-input" type="checkbox" role="switch" style="cursor:pointer;" 
                   ${hasDoc ? 'checked' : ''} 
                   onchange="window.APP5T.toggleDocumentCheck('${p.id}', '${type}', this.checked)">
            </div>
          </td>
        `;
      }).join('');

      let progressPercent = requiredCount > 0 ? Math.round((checkedCount / requiredCount) * 100) : 0;
      if (progressPercent > 100) progressPercent = 100;
      
      let progressColor = 'var(--accent-red)';
      if (progressPercent >= 100) progressColor = 'var(--accent-green)';
      else if (progressPercent >= 50) progressColor = 'var(--accent-orange)';

      return `
        <tr>
          <td data-label="Lote"><strong>${p.nombre || p.nombre_lote}</strong></td>
          <td data-label="Proyecto">${proyectoNombre}</td>
          <td data-label="Cliente">${clienteNombre}</td>
          <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>
          ${checkboxesHtml}
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
          <td style="min-width: 80px; vertical-align: middle;">
             <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
               <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 500;">${progressPercent}%</span>
             </div>
             <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${progressPercent}%; background: ${progressColor}; transition: width 0.3s;"></div>
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

function _renderInventario() {
    const tbody = document.getElementById('tbody-inventario');
    if (!tbody) return;
    const filter = document.getElementById('inv-filter-project');
    let props = APP5T_DB.getAll('propiedades') || [];
    if (filter && filter.value && filter.value !== 'all' && filter.value !== 'todos') {
      const proyectos = APP5T_DB.getAll('proyectos') || [];
      const proy = proyectos.find(p => p.nombre === filter.value || p.nombre_proyecto === filter.value);
      if (proy) {
        props = props.filter(p => p.id_proyecto === proy.id);
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
        <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;">
          <div style="flex: 1 1 100px; min-width: 90px; padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; text-align: center;">
            <span style="font-size: 0.65rem; color: var(--text-dim); display: block; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Lotes</span>
            <strong style="font-size: 1.05rem; color: var(--text-white,#fff); font-weight: 700; display: block; margin-top: 2px;">${props.length}</strong>
          </div>
      `;
      
      Object.keys(colorMap).forEach(st => {
        if (counts[st]) {
          summaryHtml += `
            <div style="flex: 1 1 100px; min-width: 90px; padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; text-align: center;">
              <span style="font-size: 0.65rem; color: var(--text-dim); display: block; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">${st.replace('_', ' ')}</span>
              <strong style="font-size: 1.05rem; color: ${colorMap[st]}; font-weight: 700; display: block; margin-top: 2px;">${counts[st]}</strong>
            </div>
          `;
        }
      });
      
      summaryHtml += `
          <div style="flex: 2 1 180px; min-width: 140px; padding: 8px; background: rgba(243, 156, 18, 0.08); border: 1px solid rgba(243, 156, 18, 0.2); border-radius: 6px; text-align: center;">
            <span style="font-size: 0.65rem; color: var(--accent-orange); display: block; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Valor Inventario</span>
            <strong style="font-size: 1.05rem; color: var(--accent-orange); font-weight: 800; display: block; margin-top: 2px;">${APP5T_Utils.formatMoneda(valTotal)}</strong>
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
        adminActionsHtml = `
          <div style="display:flex; gap:6px; justify-content:flex-end;">
            ${p.url && p.url.trim() !== '' ? 
              `<a href="${p.url}" target="_blank" class="btn btn-sm btn-outline" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--accent-green); color: var(--accent-green); text-decoration: none;" title="Ver Documentos del Lote"><i class="fa-solid fa-folder-open"></i> Docs</a>` : 
              `<button class="btn btn-sm btn-outline" onclick="if(window.APP5T_Utils) APP5T_Utils.showToast('No hay una carpeta de Drive configurada para este lote. Configúrala en el Catálogo Documental.', 'warning');" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--text-dim); color: var(--text-dim);" title="Documentos (No config.)"><i class="fa-solid fa-folder-open"></i> Docs</button>`}
            ${currentRole === 'administrador' ? `
            <button class="btn btn-sm btn-outline" onclick="APP5T_Forms._editRecord('propiedades', '${p.id}')" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--accent-blue); color: var(--accent-blue);" title="Editar Lote">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            ` : ''}
          </div>
        `;
      } else {
        adminActionsHtml = '<span class="text-muted" style="font-size:0.75rem;">-</span>';
      }

      return `<tr>
        <td data-label="Lote">${p.nombre || p.id}</td>
        <td data-label="Proyecto">${proyectoNombre}</td>
        <td data-label="Superficie">${p.superficie || '-'} m²</td>
        <td data-label="Precio">${APP5T_Utils.formatMoneda(p.valor_final || 0)}</td>
        <td data-label="Estado">${getStatusBadgeHTML(p.estado)}</td>
        <td data-label="Acciones" style="text-align:right; white-space:nowrap;">
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
          mobileActions = `
            <div style="display: flex; gap: 6px; align-items: center; margin-left: 0; padding-left: 0; border-left: none;">
              ${p.url && p.url.trim() !== '' ? 
                `<a href="${p.url}" target="_blank" style="background: transparent; border: none; color: var(--accent-green); padding: 4px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; text-decoration: none;" title="Ver Documentos del Lote"><i class="fa-solid fa-folder-open"></i></a>` :
                `<button onclick="if(window.APP5T_Utils) APP5T_Utils.showToast('No hay una carpeta configurada', 'warning');" style="background: transparent; border: none; color: var(--text-dim); padding: 4px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center;" title="Documentos (No config.)"><i class="fa-solid fa-folder-open"></i></button>`}
              ${currentRole === 'administrador' ? `<button onclick="APP5T_Forms._editRecord('propiedades', '${p.id}')" style="background: transparent; border: none; color: var(--accent-blue); padding: 4px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center;" title="Editar Lote"><i class="fa-solid fa-edit"></i></button>` : ''}
            </div>
          `;
        }

        return `
          <div class="inventario-card-mobile" style="background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 8px 10px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--text-white); font-size: 0.88rem;">${p.nombre || p.id}</strong>
                <span style="font-size: 0.7rem; color: var(--text-dim); margin-left: 6px;">(${proyectoNombre})</span>
              </div>
              <div style="transform: scale(0.85); transform-origin: right center;">${statusBadge}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.76rem;">
              <span style="color: var(--text-dim);">${p.superficie || '-'} m² · <strong style="color: var(--text-white);">${APP5T_Utils.formatMoneda(p.valor_final || 0)}</strong></span>
              <div style="display: flex; gap: 4px; align-items: center;">
                ${mobileActions}
              </div>
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
      <td>${a.fecha ? APP5T_Utils.formatFecha(a.fecha) + ' ' + new Date(a.fecha).toLocaleTimeString() : '-'}</td>
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

    if (dlClientes && dlClientes.children.length === 0) {
      const clientes = APP5T_DB.getAll('clientes') || [];
      clientes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = `${c.rut} | ${c.nombres} ${c.apellidos}`;
        dlClientes.appendChild(opt);
      });
    }

    if (dlLotes && dlLotes.children.length === 0) {
      const propiedades = APP5T_DB.getAll('propiedades') || [];
      propiedades.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.nombre_lote || p.nombre || `Lote ${p.id}`;
        dlLotes.appendChild(opt);
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
    
    const validStates = ['Promesada', 'Venta_Directa', 'Vendida'];
    
    // Filter base valid properties
    const validProps = propiedades.filter(p => validStates.includes(p.estado) && negociaciones.some(n => n.id_propiedad === p.id));
    
    // Find all valid combinations of (Client, Project, Lot)
    const combinations = validProps.map(p => {
      const propNegs = negociaciones.filter(n => n.id_propiedad === p.id);
      const neg = propNegs.sort((a, b) => String(b.id).localeCompare(String(a.id)))[0];
      const c = clientes.find(c => String(c.id) === String(neg.id_cliente));
      const proj = proyectos.find(pr => pr.id === p.id_proyecto);
      
      return {
        prop: p,
        cliente: c,
        proyecto: proj,
        clienteStr: c ? `${c.rut} | ${c.nombres} ${c.apellidos}` : '',
        loteStr: p.nombre_lote || p.nombre || `Lote ${p.id}`
      };
    });

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

    const targetStates = ['Promesada', 'Venta_Directa', 'Vendida'];
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
        fechaOp = neg.fecha_negociacion || '';
      } else {
        fechaOp = neg.fecha_promesa || neg.fecha_negociacion || '';
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
      const pagadas = propCuotas.filter(ct => ct.estado_cuota === 'Pagada');
      const pendientes = propCuotas.filter(ct => ct.estado_cuota !== 'Pagada');

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
    const kpiRecibido = filteredData.reduce((sum, item) => sum + item.totalRecibido, 0);
    const kpiPendiente = filteredData.reduce((sum, item) => sum + item.totalPorRecibir, 0);

    const kpiOpsEl = document.getElementById('kpi-report-operaciones');
    const kpiRecibidoEl = document.getElementById('kpi-report-recibido');
    const kpiPendienteEl = document.getElementById('kpi-report-pendiente');

    if (kpiOpsEl) kpiOpsEl.textContent = kpiOps;
    if (kpiRecibidoEl) kpiRecibidoEl.textContent = APP5T_Utils.formatMoneda(kpiRecibido);
    if (kpiPendienteEl) kpiPendienteEl.textContent = APP5T_Utils.formatMoneda(kpiPendiente);

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
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div class="statement-title" style="margin-bottom: 4px;">INFORME DE CUENTAS CORRIENTE</div>
              <div class="statement-date">Fecha del Informe: ${todayStr}</div>
            </div>
            <img src="../04_RECURSOS/logo5t.png" alt="5 Tierras" style="height: 60px; object-fit: contain;">
          </div>
          
          <div class="statement-header-grid">
            <div class="statement-header-item"><strong>Rut / Identificación:</strong> ${cliRut || '-'}</div>
            <div class="statement-header-item"><strong>Nombre del Cliente:</strong> ${cliNom || '-'}</div>
            <div class="statement-header-item"><strong>Rol propiedad:</strong> ${p.rol_propiedad || '-'}</div>
            <div class="statement-header-item"><strong>Nombre propiedad:</strong> ${p.nombre || '-'} (${proyNom})</div>
            <div class="statement-header-item"><strong>Nombre vendedor:</strong> ${vendNom}</div>
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
    
    const propiedades = APP5T_DB.getAll('propiedades') || [];
    const negociaciones = APP5T_DB.getAll('negociaciones') || [];
    const vendedores = APP5T_DB.getAll('vendedores') || [];
    
    const clientes = APP5T_DB.getAll('clientes') || [];
    const proyectos = APP5T_DB.getAll('proyectos') || [];
    const targetStates = ['Promesada', 'Venta_Directa', 'Vendida'];
    const summaryByVendedor = {};
    
    propiedades.forEach(p => {
      if (!targetStates.includes(p.estado)) return;
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
        let ventasHtml = r.ventas.map(v => `
          <tr>
            <td>${v.lote} <span style="font-size:0.8rem; color:var(--text-dim);">(${v.proyecto})</span></td>
            <td>${v.cliente}</td>
            <td>${v.fecha}</td>
            <td>${v.estado.replace('_', ' ')}</td>
            <td>${APP5T_Utils.formatMoneda(v.monto)}</td>
          </tr>
        `).join('');

        detalleHtml += `
          <div class="statement-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div>
                <div class="statement-title" style="margin-bottom: 4px;">INFORME DE VENTAS POR VENDEDOR</div>
                <div class="statement-date">Fecha del Informe: ${todayStr}</div>
              </div>
              <img src="../04_RECURSOS/logo5t.png" alt="5 Tierras" style="height: 60px; object-fit: contain;">
            </div>
            
            <div class="statement-header-grid">
              <div class="statement-header-item"><strong>Nombre Vendedor:</strong> ${r.nombre}</div>
              <div class="statement-header-item"><strong>Total Operaciones:</strong> ${r.lotesVendidos}</div>
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
    
    // Si estamos en rol vendedor, filtrar por el vendedor activo
    const vendedores = typeof APP5T_DB !== 'undefined' ? APP5T_DB.getAll('vendedores') || [] : [];
    const vendActivo = _resolveActiveVendedor(vendedores);
    if (vendActivo) {
      clientes = clientes.filter(c => String(c.id_vendedor) === String(vendActivo.id));
    }

    if (clientes.length === 0) {
      if (typeof APP5T_Utils !== 'undefined') {
        APP5T_Utils.showToast('No hay clientes para exportar', 'warning');
      }
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM para Excel
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

    let csvContent = '\uFEFF'; // UTF-8 BOM
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
      const p = item.propiedad;
      const n = item.negociacion;
      const row = [
        item.fechaOperacion || '',
        item.proyectoNombre || '',
        p.nombre || '',
        item.clienteNombreCompleto || '',
        item.clienteRut || '',
        p.estado || '',
        n.tipo_operacion || 'Tradicional',
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

    const mesSelect = document.getElementById('informes-filter-mes');
    const anioSelect = document.getElementById('informes-filter-anio');
    const mesNom = mesSelect && mesSelect.value !== 'all' ? mesSelect.options[mesSelect.selectedIndex].text : 'Todos';
    const anioNom = anioSelect && anioSelect.value !== 'all' ? anioSelect.value : 'Todos';
    
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
      body { font-family: 'Inter', 'Helvetica', sans-serif; padding: 40px; margin: 0; background: #fff; color: #1a1a1a; }
      .statement-card { background-color: #ffffff; color: #1a1a1a; padding: 0; border-radius: 0; box-shadow: none; }
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
          <div class="logo">5<span>TIERRAS</span></div>
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
    openModal('Revisión de Aprobación', html);
    setTimeout(() => {
      const container = document.getElementById('modal-approval-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, activeRole, true); // true = isApprovalQueue
    }, 50);
  }

  function _aprobarReservaDirecta(idProp, event) {
    if (event) event.stopPropagation();
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    
    const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(prop.id) && n.estado_avance === 'En Curso');
    const neg = negs && negs.length ? negs[0] : null;
    if (!neg) {
      APP5T_Utils.showToast('No se encontró negociación activa para este lote.', 'error');
      return;
    }

    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : 'Sin Proyecto';
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';

    const confirmMsg = `¿Desea aprobar inmediatamente la reserva del lote ${prop.nombre} (Proyecto: ${proyNom}) para el cliente ${cliNom}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const activeUserNom = window.APP5T.getActiveUser();
      let dirs = APP5T_DB.getAll('directorio') || [];

      // Si el directorio está vacío, crear un registro dinámico para el usuario activo
      if (dirs.length === 0) {
        const newDir = {
          rut: '12.345.678-9',
          nombre: activeUserNom,
          cargo: 'Director',
          telefono: '',
          email: '',
          fecha_ingreso: APP5T_Utils.fechaHoy(),
          estado: 'Disponible',
          auth_reserva: 'S',
          firma_reserva: 'S',
          auth_promesa: 'S',
          firma_promesa: 'S',
          auth_venta: 'S',
          firma_venta: 'S'
        };
        const insertRes = APP5T_DB.insert('directorio', newDir);
        if (insertRes && insertRes.success) {
          dirs = APP5T_DB.getAll('directorio') || [];
        }
      }

      // 1. Intentar buscar director que coincida con el usuario activo logueado (ej: Daniel Gajardo)
      let dirAuth = dirs.find(d => {
        const dName = String(d.nombre || '').toLowerCase().trim();
        const activeName = String(activeUserNom).toLowerCase().trim();
        return dName === activeName || dName.includes(activeName) || activeName.includes(dName);
      });

      // 2. Si no se encuentra, buscar cualquier director autorizado (S, SI, SÍ, TRUE, 1)
      if (!dirAuth) {
        dirAuth = dirs.find(d => {
          const val = String(d.auth_reserva || '').trim().toUpperCase();
          return val === 'S' || val === 'SI' || val === 'SÍ' || val === 'TRUE' || val === '1';
        });
      }

      // 3. Fallback al primer director
      if (!dirAuth) {
        dirAuth = dirs[0];
      }

      const idDir = dirAuth ? dirAuth.id : 0;
      
      const res = APP5T_DB.aprobarReserva(neg.id, idDir);
      if (res && !res.success) {
        APP5T_Utils.showToast(`Error al aprobar: ${res.error || 'Desconocido'}`, 'error');
        return;
      }
      const msgOk = (res && res.tipo === 'Venta_Directa')
        ? 'Venta Directa aprobada - pendiente escriturar ⚡'
        : 'Reserva aprobada exitosamente';
      APP5T_Utils.showToast(msgOk, 'success');
      refreshAll();
      setTimeout(() => {
        _viewApproval(idProp);
      }, 500);
    } catch (err) {
      console.error(err);
      alert(`Error al aprobar reserva: ${err.message}`);
    }
  }

  function _rechazarReservaDirecta(idProp, event) {
    if (event) event.stopPropagation();
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;

    const negs = APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(prop.id) && (n.estado_avance === 'En Curso' || n.estado_avance === 'Aprobado'));
    const neg = negs && negs.length ? negs[0] : null;
    if (!neg) {
      APP5T_Utils.showToast('No se encontró negociación activa para este lote.', 'error');
      return;
    }

    const proy = prop.id_proyecto ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const proyNom = proy ? proy.nombre_proyecto : 'Sin Proyecto';
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';

    const motivo = prompt(`¿Desea cancelar/rechazar la negociación del lote ${prop.nombre} (Proyecto: ${proyNom}) para el cliente ${cliNom}?\n\nPor favor, ingrese el motivo:`, 'Precio o condiciones no aprobadas');
    if (motivo === null) return; // Cancelled

    try {
      const res = APP5T_DB.rechazarReserva(neg.id, motivo || 'Sin motivo especificado');
      if (res && !res.success) {
        APP5T_Utils.showToast(`Error al cancelar negociación: ${res.error || 'Desconocido'}`, 'error');
        return;
      }
      APP5T_Utils.showToast('Negociación cancelada y lote disponible', 'warning');
      refreshAll();
    } catch (err) {
      console.error(err);
      alert(`Error al cancelar negociación: ${err.message}`);
    }
  }

  function _signPromesa(idNeg) {
    const neg = APP5T_DB.getById('negociaciones', idNeg);
    if (!neg) return;
    const prop = APP5T_DB.getById('propiedades', neg.id_propiedad);
    if (!prop) return;

    const hoyISO = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthISO = nextMonth.toISOString().split('T')[0];

    const html = `
      <div id="modal-promesa-form" style="padding: 10px;">
        <form id="frm-promesa-inline" style="display:flex; flex-direction:column; gap:12px;">
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Propiedad</label>
            <input type="text" class="form-control" value="${prop.nombre || prop.id}" disabled>
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Fecha Promesa</label>
            <input type="date" id="prom-fecha" class="form-control" value="${hoyISO}">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Notaría</label>
            <input type="text" id="prom-notaria" class="form-control" placeholder="Ej: Notaría San Carlos">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Cantidad de Cuotas *</label>
            <input type="number" id="prom-cuotas" class="form-control" value="${neg.cantidad_cuotas || ''}" min="1">
          </div>
          <div class="form-group">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase;">Vencimiento Primera Cuota *</label>
            <input type="date" id="prom-venc-cuota" class="form-control" value="${nextMonthISO}">
          </div>
          ${neg && !neg.autorizado_promesa ? `
          <p class="info-text-box warning" style="margin-top: 10px; background: rgba(243,156,18,0.1); border-left: 3px solid #f39c12; padding: 10px; font-size: 0.85rem;">
            <i class="fa-solid fa-lock" style="color:#f39c12;"></i>
            <span style="color:var(--text-white);">Firma bloqueada: Requiere que Gerencia autorice el proceso.</span>
          </p>
          <button type="button" class="btn btn-primary" style="margin-top:8px; width:100%; font-size:1rem; opacity:0.5; cursor:not-allowed;" disabled>
            <i class="fa-solid fa-lock"></i> Firma Bloqueada
          </button>
          ` : `
          <button type="button" id="btn-confirm-promesa" class="btn btn-primary" style="margin-top:8px; width:100%; font-size:1rem;">
            <i class="fa-solid fa-file-contract"></i> Confirmar Firma de Promesa
          </button>
          `}
        </form>
      </div>`;

    openModal('Firmar Promesa de Compraventa', html);

    setTimeout(() => {
      const btn = document.getElementById('btn-confirm-promesa');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const cantCuotas = parseInt(document.getElementById('prom-cuotas').value, 10) || 0;
        if (cantCuotas <= 0) {
          APP5T_Utils.showToast('La cantidad de cuotas debe ser mayor a 0', 'warning');
          return;
        }
        const toDdMmYyyy = s => {
          if (!s) return '';
          const p = s.split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
        };
        const res = APP5T_DB.firmarPromesa(neg.id, {
          fecha_promesa:           toDdMmYyyy(document.getElementById('prom-fecha').value),
          notaria:                 document.getElementById('prom-notaria').value,
          cantidad_cuotas:         cantCuotas,
          fecha_vencimiento_cuota: toDdMmYyyy(document.getElementById('prom-venc-cuota').value),
          fecha_fin_promesa:       toDdMmYyyy(document.getElementById('prom-fecha').value)
        });
        if (res && !res.success) {
          APP5T_Utils.showToast(`Error al firmar promesa: ${res.error || 'Desconocido'}`, 'error');
          return;
        }
        APP5T_Utils.showToast('¡Promesa firmada exitosamente!', 'success');
        if (window.APP5T && window.APP5T.refreshAll) window.APP5T.refreshAll();
        closeModal();
      });
    }, 80);
  }

  function _signEscritura(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const html = '<div id="modal-escritura-form"></div>';
    openModal('Firmar Escritura', html);
    setTimeout(() => {
      const container = document.getElementById('modal-escritura-form');
      if (container) APP5T_Forms.renderLoteForm(container, prop, 'administrador');
    }, 50);
  }

  function _signEscrituraDirecta(idProp) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    if (!prop) return;
    const neg = (APP5T_DB.query('negociaciones', n => String(n.id_propiedad) === String(prop.id) && n.id_proceso === 'Venta_Directa') || [])[0];
    if (!neg) { APP5T_Utils.showToast('No se encontró negociación de Venta Directa para este lote.', 'error'); return; }
    const cli = APP5T_DB.getById('clientes', neg.id_cliente);
    const cliNom = cli ? `${cli.nombres} ${cli.apellidos}` : 'Sin Cliente';
    const valorFmt = APP5T_Utils.formatMoneda(neg.valor_final || 0);
    const hoy = APP5T_Utils.fechaHoy();

    openModal('Registrar Escrituración - Venta Directa', `
      <div style="padding:4px;">
        <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:8px;padding:12px 16px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:0.82rem;color:var(--text-dim);">Lote / Proyecto</p>
          <p style="margin:0;font-weight:700;color:#fff;">${prop.nombre}</p>
          <p style="margin:4px 0 0;font-size:0.85rem;color:var(--accent-purple,#8b5cf6);"><i class="fa-solid fa-bolt"></i> Venta Directa aprobada</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
          <div><span style="font-size:0.78rem;color:var(--text-dim);">Cliente</span><br><strong style="color:#fff;">${cliNom}</strong></div>
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
              <option>Transferencia</option><option>Depósito</option><option>Cheque</option><option>Contado</option>
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
        window.APP5T.closeModal(true);
        refreshAll();
      });
    }, 80);
  }

  function _payCuota(idCtaCte) {
    const cta = APP5T_DB.getById('cuenta_corriente', idCtaCte);
    if (!cta) return;
    const html = '<div id="modal-pago-form"></div>';
    openModal('Registrar Pago de Cuota', html);
    setTimeout(() => {
      const container = document.getElementById('modal-pago-form');
      if (container) APP5T_Forms.renderPagoForm(container, cta);
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

  function _renderSettingsPermissionsMatrix() {
    const tbody = document.getElementById('tbody-permissions-matrix');
    if (!tbody) return;
    
    const rawPerms = sessionStorage.getItem('app5t_permisos') || '[]';
    _localPermsMatrix = JSON.parse(rawPerms);
    
    if (_localPermsMatrix.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se cargaron los permisos del sistema</td></tr>';
      return;
    }
    
    tbody.innerHTML = _localPermsMatrix.map(p => `
      <tr data-perm-id="${p.ID_Permiso}">
        <td style="font-weight: 600; color: var(--text-white);">${p.Componente_Modulo}</td>
        <td style="color: var(--text-dim); font-size: 0.85rem;">${p.Descripcion}</td>
        <td style="text-align: center;">
          <input type="checkbox" class="perm-checkbox" data-role="Vendedor" ${p.Acceso_Vendedor === true || String(p.Acceso_Vendedor).toUpperCase() === 'TRUE' ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
        </td>
        <td style="text-align: center;">
          <input type="checkbox" class="perm-checkbox" data-role="Gerencia" ${p.Acceso_Gerencia === true || String(p.Acceso_Gerencia).toUpperCase() === 'TRUE' ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
        </td>
        <td style="text-align: center;">
          <input type="checkbox" class="perm-checkbox" data-role="Administracion" ${p.Acceso_Administracion === true || String(p.Acceso_Administracion).toUpperCase() === 'TRUE' ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
        </td>
      </tr>
    `).join('');
    
    // Attach change listeners
    tbody.querySelectorAll('.perm-checkbox').forEach(chk => {
      chk.addEventListener('change', e => {
        const row = chk.closest('tr');
        const permId = Number(row.getAttribute('data-perm-id'));
        const role = chk.getAttribute('data-role');
        const isChecked = chk.checked;
        
        const perm = _localPermsMatrix.find(p => p.ID_Permiso === permId);
        if (perm) {
          perm['Acceso_' + role] = isChecked;
        }
      });
    });
  }

  async function _saveSettingsPermissionsMatrix() {
    const saveBtn = document.getElementById('btn-save-permissions');
    if (!saveBtn) return;
    
    const userSession = sessionStorage.getItem('app5t_user');
    if (!userSession) return;
    const adminUser = JSON.parse(userSession);
    
    const originalContent = saveBtn.innerHTML;
    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
      
      if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.updatePermissionsMatrix === 'function') {
        const res = await APP5T_Sync.updatePermissionsMatrix(_localPermsMatrix, adminUser.nombre);
        if (res && res.success) {
          APP5T_Utils.showToast('Matriz de gobernanza guardada con éxito', 'success');
          
          // Update sessionStorage
          sessionStorage.setItem('app5t_permisos', JSON.stringify(_localPermsMatrix));
          
          // Re-evaluate permissions immediately
          evaluarPermisosYRenderizar(_localPermsMatrix, adminUser.rol);
          
          // Rebuild sidebar navigation
          _buildSidebar(activeRole);
        } else {
          APP5T_Utils.showToast(res.error || 'Error al guardar cambios', 'error');
        }
      } else {
        APP5T_Utils.showToast('Sincronizador no disponible', 'error');
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
          <button type="button" class="btn btn-outline" onclick="window.APP5T.closeModal(true)">Cancelar</button>
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

    // ── Check Session on Load (Zero-Trust Auth Enforcement) ──
    const sessionUser = sessionStorage.getItem('app5t_user');
    const sessionPerms = sessionStorage.getItem('app5t_permisos');
    
    if (sessionUser && sessionPerms) {
      try {
        const user = JSON.parse(sessionUser);
        const perms = JSON.parse(sessionPerms);
        
        // Hide login card & show layout
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-layout').style.display = 'flex';
        
        // Run evaluating permissions
        evaluarPermisosYRenderizar(perms, user.rol);
        
        // Switch to user's mapped role
        const mapped = mapRole(user.rol);
        activeRole = mapped;

        // Trigger automatic background pull sync on session restore
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
          APP5T_Sync.pullAll(true).then(() => {
            if (typeof refreshAll === 'function') refreshAll();
            if (typeof APP5T_Map !== 'undefined' && typeof APP5T_Map.refreshColors === 'function') {
              APP5T_Map.refreshColors();
            }
          }).catch(err => {
            console.error('APP5T: Error during background sync on session restore:', err);
          });
        }
      } catch (err) {
        console.error('Error loading session:', err);
        sessionStorage.removeItem('app5t_user');
        sessionStorage.removeItem('app5t_permisos');
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-layout').style.display = 'none';
      }
    } else {
      document.getElementById('login-container').style.display = 'flex';
      document.getElementById('app-layout').style.display = 'none';
    }

    // ── Login Form Listener ──
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const rutInput = document.getElementById('login-rut');
        const passInput = document.getElementById('login-password');
        const submitBtn = document.getElementById('btn-login-submit');
        
        if (!rutInput || !passInput || !submitBtn) return;
        
        const rut = rutInput.value.trim();
        const password = passInput.value;
        
        if (typeof APP5T_Utils !== 'undefined' && !APP5T_Utils.validarRUT(rut)) {
          APP5T_Utils.showToast('El RUT ingresado no es válido', 'error');
          return;
        }
        
        const originalContent = submitBtn.innerHTML;
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando...';
          
          if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.login === 'function') {
            const res = await APP5T_Sync.login(rut, password);
            if (res && res.success) {
              APP5T_Utils.showToast(`Bienvenido, ${res.user.nombre}`, 'success');
              
              passInput.value = '';
              
              // Clear corrupted local tables to trigger a clean fresh pull
              const tablesToClear = ['vendedores', 'clientes', 'proyectos', 'etapas', 'propiedades', 'directorio', 'negociaciones', 'cuenta_corriente', 'tramites', 'documentos', 'mock_users'];
              tablesToClear.forEach(t => {
                localStorage.removeItem('app5t_' + t);
              });
              
              sessionStorage.setItem('app5t_user', JSON.stringify(res.user));
              sessionStorage.setItem('app5t_permisos', JSON.stringify(res.permisos));
              // Also persist in localStorage so mobile devices keep session after reload/sleep
              localStorage.setItem('app5t_user', JSON.stringify(res.user));
              localStorage.setItem('app5t_permisos', JSON.stringify(res.permisos));
              
              evaluarPermisosYRenderizar(res.permisos, res.user.rol);
              
              document.getElementById('login-container').style.display = 'none';
              document.getElementById('app-layout').style.display = 'flex';
              
              const mapped = mapRole(res.user.rol);
              switchRole(mapped);

              // Trigger automatic background pull sync on login
              if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pullAll === 'function') {
                APP5T_Sync.pullAll(true).then(() => {
                  if (typeof refreshAll === 'function') refreshAll();
                  if (typeof APP5T_Map !== 'undefined' && typeof APP5T_Map.refreshColors === 'function') {
                    APP5T_Map.refreshColors();
                  }
                }).catch(err => {
                  console.error('APP5T: Error during background sync on login:', err);
                });
              }
            } else {
              APP5T_Utils.showToast(res.mensaje || 'Credenciales inválidas', 'error');
            }
          } else {
            APP5T_Utils.showToast('Módulo de autenticación no disponible', 'error');
          }
        } catch (err) {
          console.error(err);
          APP5T_Utils.showToast(`Error al iniciar sesión: ${err.message}`, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
        }
      });
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
    const panelPermsContent = document.getElementById('settings-perms-content');
    const panelUsersContent = document.getElementById('settings-users-content');

    if (btnSettingsPerms && btnSettingsUsers && panelPermsContent && panelUsersContent) {
      btnSettingsPerms.addEventListener('click', e => {
        e.preventDefault();
        btnSettingsPerms.classList.add('active');
        btnSettingsPerms.style.borderBottomColor = 'var(--primary)';
        btnSettingsPerms.style.color = 'var(--text-white)';
        
        btnSettingsUsers.classList.remove('active');
        btnSettingsUsers.style.borderBottomColor = 'transparent';
        btnSettingsUsers.style.color = 'var(--text-dim)';
        
        panelPermsContent.style.display = 'block';
        panelUsersContent.style.display = 'none';
        
        _renderSettingsPermissionsMatrix();
      });

      btnSettingsUsers.addEventListener('click', e => {
        e.preventDefault();
        btnSettingsUsers.classList.add('active');
        btnSettingsUsers.style.borderBottomColor = 'var(--primary)';
        btnSettingsUsers.style.color = 'var(--text-white)';
        
        btnSettingsPerms.classList.remove('active');
        btnSettingsPerms.style.borderBottomColor = 'transparent';
        btnSettingsPerms.style.color = 'var(--text-dim)';
        
        panelUsersContent.style.display = 'block';
        panelPermsContent.style.display = 'none';
        
        _renderSettingsUsersList();
      });
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
        const projectName = e.target.value;
        if (typeof APP5T_Map !== 'undefined') APP5T_Map.zoomToProject(projectName);
        
        // Update Plano button
        const btnPlano = document.getElementById('btn-ver-plano-loteo');
        if (btnPlano) {
          if (projectName === 'todos' || projectName === 'all' || !projectName) {
            btnPlano.style.display = 'none';
          } else {
            const proyectos = APP5T_DB.getAll('proyectos') || [];
            const proy = proyectos.find(p => p.nombre === projectName || p.nombre_proyecto === projectName);
            if (proy && proy.url) {
              btnPlano.style.display = 'inline-flex';
              btnPlano.onclick = () => window.open(proy.url, '_blank');
            } else {
              btnPlano.style.display = 'none';
            }
          }
        }
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
    
    const ventasMes = document.getElementById('rep-ventas-mes');
    if (ventasMes) ventasMes.addEventListener('change', () => _renderInformes());
    
    const ventasAnio = document.getElementById('rep-ventas-anio');
    if (ventasAnio) ventasAnio.addEventListener('change', () => _renderInformes());

    // Filtros de Cuotas Vencidas
    const cuotasEstado = document.getElementById('rep-cuotas-estado');
    if (cuotasEstado) cuotasEstado.addEventListener('change', () => _renderInformes());
    
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
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--text-dim)';
        });
        
        // Add active class to clicked tab
        tab.classList.add('active');
        tab.style.borderBottomColor = 'var(--primary)';
        tab.style.color = 'var(--text-white)';
        
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

  function _sendWhatsAppGerencia(idNeg, idProp, idCli) {
    const prop = APP5T_DB.getById('propiedades', idProp);
    const proy = prop ? APP5T_DB.getById('proyectos', prop.id_proyecto) : null;
    const loteNom = prop ? prop.nombre : '???';
    const proyNom = proy ? proy.nombre_proyecto : '???';
    const activeUserNom = window.APP5T && window.APP5T.getActiveUser ? window.APP5T.getActiveUser() : 'Vendedor';
    
    const text = `⏳ *RESERVA: Lote ${loteNom} - ${proyNom}*\nSolicitada por: ${activeUserNom}.\nRevisar en sistema.`;
    const tel = '56974300363';
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
    
    if (window.confirm('¡Solicitud Enviada Exitosamente!\n\n¿Deseas enviar la notificación a Gerencia por WhatsApp ahora?')) {
      window.open(url, '_blank');
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
      
      const text = `⚖️ *Solicitud de Autorización de Escritura*\n\nHola. Te informo que el *Lote ${loteNom}* del proyecto *${proyNom}* ha finalizado el pago de su cuenta corriente al 100%.\n\nLa Ficha Legal para la confección de la escritura de venta a nombre de *${cliNom}* ya fue generada y descargada.\n\nPor favor, revisa y aprueba la solicitud en tu panel de aprobaciones para habilitar la firma de la escritura en notaría.`;
      const tel = '56974300363'; // El gerente
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

    const cliNombre = cli ? `${cli.nombres} ${cli.apellidos}` : 'Cliente';
    const fono = cli ? String(cli.telefono || '').replace(/[\s+-]/g, '') : '';
    const loteNom = prop ? prop.nombre : '-';
    const proyNom = proy ? proy.nombre_proyecto : '-';
    const pieFmt = APP5T_Utils.formatMoneda(neg.pie || 0);

    const text = `Hola ${cliNombre}, te adjunto el comprobante oficial de reserva del lote ${loteNom} del proyecto ${proyNom} por el monto de ${pieFmt}. Saludos, Inmobiliaria 5 Tierras.`;
    const url = `https://wa.me/${fono}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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

  function isUserEditing() {
    if (window.APP5T_isFormDirty) return true;
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
      if (active.closest('#lote-action-form') || 
          active.closest('#bs-lote-action-form') || 
          active.closest('#bottom-sheet') || 
          active.closest('#action-modal')) {
        return true;
      }
    }
    return false;
  }

  const api = {
    isUserEditing,
    toggleDropdown,
    switchRole,
    switchTab,
    refreshAll,
    openModal,
    closeModal,
    onLoteSelected,
    openLoteBottomSheet,
    getStatusBadgeHTML,
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
    _signPromesa,
    _signEscritura,
    _signEscrituraDirecta,
    _payCuota,
    _showActivarCtaCteModal,
    goToCuentaCorriente,
    _generarComprobanteReserva,
    _downloadPDFReserva,
    _sendWhatsAppReserva,
    _sendEmailReserva,
    _sendWhatsAppGerencia,
    _solicitarAutorizacionEscritura,
    _autorizarPromesaEscrituracion,
    _aprobarAutorizacionEscrituracion,
    _autorizarFirmaEscritura,
    
    // Catalogo Documental
    filterCatalogo: function() { _renderCatalogoDocumentos(); },
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

})();



    console.log("APP.JS LOADED OK");
  } catch(e) {
    console.error("APP.JS ERROR:", e.stack);
  }
