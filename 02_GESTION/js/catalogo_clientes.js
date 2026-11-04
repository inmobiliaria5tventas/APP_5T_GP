/**
 * =====================================================
 * CATALOGO_CLIENTES.JS — Visor Georreferenciado Público
 * 100% SOLO LECTURA (READ-ONLY) conectado a Supabase
 * No expone datos privados de clientes ni permite escrituras.
 * =====================================================
 */
window.Catalogo5T = (() => {
  'use strict';

  const SUPABASE_URL = 'https://lsbnvsjosasbtarfqkse.supabase.co/rest/v1/';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYm52c2pvc2FzYnRhcmZxa3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDYwMDEsImV4cCI6MjEwMjcyMjAwMX0.hE7F-9S3D4FXSF8vDK7Y5VLp2x-XCGnhel7jeHr8_Gg';

  const PROJECTS = {
    1: { id: 1, slug: 'copihue',  name: 'Hacienda El Copihue', shortName: 'El Copihue',  center: [-36.128, -71.792], zoom: 15, defaultPrice: 33000000 },
    2: { id: 2, slug: 'brisas',   name: 'Fundo Las Brisas',    shortName: 'Las Brisas',  center: [-36.385, -71.953], zoom: 16, defaultPrice: 18000000 },
    3: { id: 3, slug: 'encinos',  name: 'Hacienda Los Encinos',shortName: 'Los Encinos', center: [-36.135, -71.785], zoom: 15, defaultPrice: 33000000 },
    4: { id: 4, slug: 'naranjos', name: 'Fundo Los Naranjos',  shortName: 'Los Naranjos',center: [-36.140, -71.805], zoom: 15, defaultPrice: 18000000 }
  };

  const ESTADO_COLORS = {
    'Disponible': { fill: '#2ecc71', stroke: '#27ae60', opacity: 0.48 },
    'Reservada':  { fill: '#f1c40f', stroke: '#f39c12', opacity: 0.58 },
    'Vendida':    { fill: '#e74c3c', stroke: '#c0392b', opacity: 0.52 }
  };

  let map = null;
  let lotesLayer = null;
  let layerByLoteKey = {};
  let highlightedLayer = null;
  let activeProjectId = 1;
  let selectedLoteName = null;
  let allProperties = [];
  let userMarker = null;
  let isWatchingLocation = false;

  function toPublicStatus(rawStatus) {
    const s = String(rawStatus || 'Disponible').trim().toLowerCase();
    if (s === 'disponible') return 'Disponible';
    if (s === 'pendiente' || s === 'reservada' || s === 'reservado') return 'Reservada';
    return 'Vendida'; // Promesada, Vendida, Escriturada, Venta_Directa -> Vendida para el público general
  }

  function formatMoneda(val) {
    const num = Math.round(Number(val) || 0);
    if (num <= 0) return 'Consultar';
    return '$ ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatSuperficie(val) {
    const num = Math.round(Number(val) || 5000);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' m²';
  }

  function buildFallbackFromMasterGeoJSON() {
    const masterSources = [
      [1, typeof json_copihue_lotes !== 'undefined' ? json_copihue_lotes : null],
      [2, typeof json_brisas_lotes !== 'undefined' ? json_brisas_lotes : null],
      [3, typeof json_encinos_lotes !== 'undefined' ? json_encinos_lotes : null],
      [4, typeof json_naranjos_lotes !== 'undefined' ? json_naranjos_lotes : null]
    ];
    const list = [];
    let seq = 1;
    masterSources.forEach(([idProy, gj]) => {
      if (!gj || !Array.isArray(gj.features)) return;
      gj.features.forEach(f => {
        const p = f.properties || {};
        const nombre = String(p.Lote || p.nombre || seq).trim();
        const rawArea = p.Area || p.Hectareas || p.Superficie || 5000;
        const sup = typeof rawArea === 'number' ? Math.round(rawArea) : (parseInt(String(rawArea).replace(/[^\d]/g, ''), 10) || 5000);
        const rawPrice = p.Precio || PROJECTS[idProy].defaultPrice;
        const price = typeof rawPrice === 'number' ? Math.round(rawPrice) : (parseInt(String(rawPrice).replace(/[^\d]/g, ''), 10) || PROJECTS[idProy].defaultPrice);
        list.push({
          id: seq++,
          id_proyecto: idProy,
          nombre: nombre,
          superficie: sup,
          valor_final: price,
          estado: toPublicStatus(p.Estado || p.estado || 'Disponible'),
          geometry: f.geometry
        });
      });
    });
    return list;
  }

  async function fetchLivePropertiesReadOnly() {
    const dot = document.getElementById('sync-indicator');
    if (dot) dot.className = 'sync-dot syncing';
    try {
      const url = `${SUPABASE_URL}propiedades?select=id,id_proyecto,nombre,superficie,valor_final,estado,coordenadas&order=id.asc`;
      const resp = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const rows = await resp.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const parsed = [];
        rows.forEach(r => {
          let geom = null;
          if (r.coordenadas) {
            try {
              geom = typeof r.coordenadas === 'string' ? JSON.parse(r.coordenadas) : r.coordenadas;
            } catch (e) { geom = null; }
          }
          if (!geom || !geom.coordinates) return;
          parsed.push({
            id: Number(r.id),
            id_proyecto: Number(r.id_proyecto) || 1,
            nombre: String(r.nombre || r.id).trim(),
            superficie: Number(r.superficie) || 5000,
            valor_final: Number(r.valor_final) || PROJECTS[Number(r.id_proyecto) || 1].defaultPrice,
            estado: toPublicStatus(r.estado),
            geometry: geom
          });
        });
        if (parsed.length > 0) {
          allProperties = parsed;
        }
      }
      if (dot) dot.className = 'sync-dot';
    } catch (err) {
      console.warn('Catalogo5T: Usando respaldo local GeoJSON:', err.message);
      if (dot) dot.className = 'sync-dot offline';
      if (allProperties.length === 0) {
        allProperties = buildFallbackFromMasterGeoJSON();
      }
    }
  }

  function parseInitialParams() {
    const params = new URLSearchParams(window.location.search);
    const rawProj = (params.get('proyecto') || params.get('p') || '').toLowerCase().trim();
    const rawLote = (params.get('lote') || params.get('l') || '').trim();

    if (rawProj) {
      if (rawProj === '1' || rawProj.includes('copihue')) activeProjectId = 1;
      else if (rawProj === '2' || rawProj.includes('brisa')) activeProjectId = 2;
      else if (rawProj === '3' || rawProj.includes('encino') || rawProj.includes('encina')) activeProjectId = 3;
      else if (rawProj === '4' || rawProj.includes('naranjo')) activeProjectId = 4;
    }
    return { initialLote: rawLote || null };
  }

  function updateUrlParams(projId, loteName) {
    try {
      const proj = PROJECTS[projId] || PROJECTS[1];
      const url = new URL(window.location.href);
      url.searchParams.set('proyecto', proj.slug);
      if (loteName) {
        url.searchParams.set('lote', loteName);
      } else {
        url.searchParams.delete('lote');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  }

  function initMap() {
    map = L.map('map', { zoomControl: false, attributionControl: false });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      opacity: 0.65
    }).addTo(map);

    const pInfo = PROJECTS[activeProjectId] || PROJECTS[1];
    map.setView(pInfo.center, pInfo.zoom);

    map.on('click', (e) => {
      if (!e.originalEvent._loteClicked) closeBottomSheet();
    });

    map.on('zoomend', () => {
      const container = map.getContainer();
      if (map.getZoom() < 15) container.classList.add('map-low-zoom');
      else container.classList.remove('map-low-zoom');
    });

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
  }

  function renderProjectLotes(fitBounds = true) {
    if (!map) return;
    if (lotesLayer) map.removeLayer(lotesLayer);
    layerByLoteKey = {};
    highlightedLayer = null;

    const proj = PROJECTS[activeProjectId] || PROJECTS[1];
    const titleEl = document.getElementById('header-project-title');
    if (titleEl) titleEl.textContent = proj.shortName;

    document.querySelectorAll('.proj-chip').forEach(btn => {
      btn.classList.toggle('active', Number(btn.getAttribute('data-proj')) === activeProjectId);
    });

    const projLots = allProperties.filter(p => Number(p.id_proyecto) === Number(activeProjectId));

    let disp = 0, res = 0, vend = 0;
    const features = projLots.map(item => {
      if (item.estado === 'Disponible') disp++;
      else if (item.estado === 'Reservada') res++;
      else vend++;

      return {
        type: 'Feature',
        properties: {
          id: item.id,
          id_proyecto: item.id_proyecto,
          nombre: item.nombre,
          superficie: item.superficie,
          valor_final: item.valor_final,
          estado: item.estado
        },
        geometry: item.geometry
      };
    });

    const elDisp = document.getElementById('stat-disp');
    const elRes  = document.getElementById('stat-res');
    const elVend = document.getElementById('stat-vend');
    if (elDisp) elDisp.textContent = disp;
    if (elRes)  elRes.textContent  = res;
    if (elVend) elVend.textContent = vend;

    lotesLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
      style: (f) => {
        const st = f.properties.estado || 'Disponible';
        const c = ESTADO_COLORS[st] || ESTADO_COLORS['Disponible'];
        return {
          fillColor: c.fill,
          fillOpacity: c.opacity,
          color: c.stroke,
          weight: 1.6
        };
      },
      onEachFeature: (f, layer) => {
        const key = String(f.properties.nombre).toLowerCase();
        layerByLoteKey[key] = { feature: f, layer };

        layer.bindTooltip(`Lote ${f.properties.nombre}`, {
          permanent: true,
          direction: 'center',
          className: 'lote-label'
        });

        layer.on('click', (e) => {
          if (e.originalEvent) e.originalEvent._loteClicked = true;
          selectLote(f, layer, true);
        });
      }
    }).addTo(map);

    if (fitBounds && lotesLayer.getLayers().length > 0) {
      map.fitBounds(lotesLayer.getBounds(), { padding: [30, 30] });
    }
  }

  function selectLote(feature, layer, fly = true) {
    if (highlightedLayer) {
      const prevSt = highlightedLayer.feature.properties.estado || 'Disponible';
      const prevColors = ESTADO_COLORS[prevSt] || ESTADO_COLORS['Disponible'];
      highlightedLayer.setStyle({
        weight: 1.6,
        fillOpacity: prevColors.opacity,
        color: prevColors.stroke
      });
    }

    highlightedLayer = layer;
    layer.setStyle({ weight: 3.2, fillOpacity: 0.82, color: '#ffffff' });

    const props = feature.properties;
    selectedLoteName = props.nombre;
    updateUrlParams(activeProjectId, selectedLoteName);

    const center = layer.getBounds().getCenter();
    populateBottomSheet(props, center);

    document.getElementById('bottomsheet').classList.add('active');
    document.getElementById('bottomsheet-overlay').classList.add('active');

    if (fly) {
      map.flyTo(center, Math.max(map.getZoom(), 17), { duration: 0.55 });
    }
  }

  function populateBottomSheet(props, center) {
    const proj = PROJECTS[props.id_proyecto] || PROJECTS[activeProjectId];
    const estado = props.estado || 'Disponible';

    document.getElementById('bs-lote-id').textContent = `Lote ${props.nombre}`;
    document.getElementById('bs-project-name').textContent = proj ? proj.name : 'Inmobiliaria 5 Tierras';
    document.getElementById('bs-lote-area').textContent = formatSuperficie(props.superficie);

    const priceEl = document.getElementById('bs-price-value');
    if (estado === 'Vendida') {
      priceEl.textContent = 'No Disponible';
      priceEl.style.color = '#94a3b8';
    } else {
      priceEl.textContent = formatMoneda(props.valor_final);
      priceEl.style.color = '#4ade80';
    }

    const badge = document.getElementById('bs-current-status');
    badge.className = `status-pill status-pill--${estado.toLowerCase()}`;
    badge.innerHTML = `<span>●</span> ${estado}`;

    if (center) {
      const lat = center.lat.toFixed(6);
      const lng = center.lng.toFixed(6);
      document.getElementById('btn-nav-google').href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      document.getElementById('btn-nav-waze').href = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    }
  }

  function closeBottomSheet() {
    document.getElementById('bottomsheet').classList.remove('active');
    document.getElementById('bottomsheet-overlay').classList.remove('active');
    selectedLoteName = null;
    updateUrlParams(activeProjectId, null);

    if (highlightedLayer) {
      const st = highlightedLayer.feature.properties.estado || 'Disponible';
      const c = ESTADO_COLORS[st] || ESTADO_COLORS['Disponible'];
      highlightedLayer.setStyle({ weight: 1.6, fillOpacity: c.opacity, color: c.stroke });
      highlightedLayer = null;
    }
  }

  function selectProject(projId) {
    if (!PROJECTS[projId]) return;
    activeProjectId = Number(projId);
    closeBottomSheet();
    updateUrlParams(activeProjectId, null);
    renderProjectLotes(true);
  }

  function focusLoteByName(loteName) {
    if (!loteName) return false;
    const clean = String(loteName).replace(/^lote\s*/i, '').trim().toLowerCase();
    const target = layerByLoteKey[clean];
    if (target) {
      selectLote(target.feature, target.layer, true);
      return true;
    }
    return false;
  }

  function searchLote() {
    const input = document.getElementById('lote-search-input');
    if (!input || !input.value.trim()) return;
    const ok = focusLoteByName(input.value.trim());
    if (!ok) {
      showToast('No se encontró ese N° de lote en este proyecto');
    }
  }

  function locateUser() {
    if (!map) return;
    const btn = document.getElementById('fab-locate');
    if (btn) btn.classList.add('locating');
    if (!isWatchingLocation) {
      map.locate({ setView: true, maxZoom: 17, watch: true, enableHighAccuracy: true });
      isWatchingLocation = true;
    } else {
      map.stopLocate();
      if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
      isWatchingLocation = false;
      if (btn) btn.classList.remove('locating');
    }
  }

  function onLocationFound(e) {
    const btn = document.getElementById('fab-locate');
    if (btn) btn.classList.remove('locating');
    if (!userMarker) {
      const icon = L.divIcon({
        className: 'gps-marker',
        html: '<div class="gps-marker__pulse"></div><div class="gps-marker__dot"></div>',
        iconSize: [20, 20]
      });
      userMarker = L.marker(e.latlng, { icon }).addTo(map);
    } else {
      userMarker.setLatLng(e.latlng);
    }
  }

  function onLocationError() {
    const btn = document.getElementById('fab-locate');
    if (btn) btn.classList.remove('locating');
    isWatchingLocation = false;
    showToast('Activa el GPS de tu dispositivo para ubicarte en el terreno');
  }

  function shareCurrentView() {
    const url = window.location.href;
    const proj = PROJECTS[activeProjectId] || PROJECTS[1];
    const title = selectedLoteName
      ? `Lote ${selectedLoteName} — ${proj.name} | 5 Tierras`
      : `Catálogo Georreferenciado — ${proj.name} | 5 Tierras`;

    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
      return;
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => showToast('Enlace copiado al portapapeles'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Enlace copiado al portapapeles');
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2600);
  }

  async function init() {
    allProperties = buildFallbackFromMasterGeoJSON();
    const { initialLote } = parseInitialParams();
    initMap();
    renderProjectLotes(true);

    await fetchLivePropertiesReadOnly();
    renderProjectLotes(!initialLote);

    if (initialLote) {
      setTimeout(() => focusLoteByName(initialLote), 250);
    }

    // Actualización silenciosa de disponibilidad cada 15 segundos (Solo Lectura)
    setInterval(async () => {
      await fetchLivePropertiesReadOnly();
      const prevLote = selectedLoteName;
      renderProjectLotes(false);
      if (prevLote && layerByLoteKey[String(prevLote).toLowerCase()]) {
        const item = layerByLoteKey[String(prevLote).toLowerCase()];
        selectLote(item.feature, item.layer, false);
      }
    }, 15000);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    selectProject,
    searchLote,
    closeBottomSheet,
    locateUser,
    shareCurrentView
  };
})();

