/**
 * APP5T_Map3D - Motor de Navegación 3D (MapLibre GL)
 * Control de colisión estricto: Popups 100% despejados sin etiquetas superpuestas
 */
(function() {
  'use strict';

  const APP5T_Map3D = {
    _map: null,
    _is3DActive: false,
    _isOrbiting: false,
    _orbitAnimId: null,
    _orbitSpeed: 0.22,
    _currentProject: 'El Copihue',
    _htmlMarkers: [],
    _selectedLoteNom: null,
    _currentPopup: null,

    _projectConfigs: {
      'El Copihue':   { lng: -71.7760, lat: -36.1210, zoom: 15.8, pitch: 62, bearing: -15 },
      'Las Brisas':   { lng: -71.9530, lat: -36.3850, zoom: 15.8, pitch: 60, bearing: 30 },
      'Los Encinos':  { lng: -71.8420, lat: -36.4680, zoom: 15.8, pitch: 64, bearing: -40 },
      'Los Naranjos': { lng: -71.8380, lat: -36.4780, zoom: 15.8, pitch: 60, bearing: 15 }
    },

    _getLayerRawData: function(key) {
      if (key === 'copihue') {
        return (typeof json_copihue_lotes !== 'undefined') ? json_copihue_lotes : ((typeof copihueMasterData !== 'undefined') ? copihueMasterData : null);
      }
      if (key === 'brisas') {
        return (typeof json_brisas_lotes !== 'undefined') ? json_brisas_lotes : ((typeof brisasMasterData !== 'undefined') ? brisasMasterData : null);
      }
      if (key === 'encinos') {
        return (typeof json_encinos_lotes !== 'undefined') ? json_encinos_lotes : ((typeof encinosMasterData !== 'undefined') ? encinosMasterData : null);
      }
      if (key === 'naranjos') {
        return (typeof json_naranjos_lotes !== 'undefined') ? json_naranjos_lotes : ((typeof naranjosMasterData !== 'undefined') ? naranjosMasterData : null);
      }
      return null;
    },

    _normalizeGeoJSON: function(rawGeo) {
      if (!rawGeo || !rawGeo.features) return null;
      const props = (typeof APP5T_DB !== 'undefined') ? (APP5T_DB.getAll('propiedades') || []) : [];
      const updated = JSON.parse(JSON.stringify(rawGeo));

      updated.features.forEach(f => {
        if (!f.properties) f.properties = {};
        const lNum = f.properties.Lote || f.properties.lote || f.properties.nombre || f.properties.Name || f.properties.fid || '';
        const cleanNum = String(lNum).replace(/[^0-9A-Za-z]/g, '');
        
        f.properties.lote = cleanNum;
        f.properties.nombre = 'Lote ' + cleanNum;

        const match = props.find(p => {
          const pNum = String(p.numero || p.nombre || '').replace(/[^0-9A-Za-z]/g, '');
          return pNum === cleanNum;
        });

        let estado = (match && match.estado) ? match.estado : (f.properties.Estado || f.properties.estado || 'Disponible');
        if (estado === 'Pendiente') estado = 'Pre-reserva';
        
        f.properties.estado = estado;
        f.properties.Estado = estado;
        f.properties.precio = match ? (match.valor_final || match.precio_lista || 0) : (f.properties.Precio || 0);
        f.properties.superficie = match ? (match.superficie || 5000) : (f.properties.Area || f.properties.Hectareas || 5000);
      });

      return updated;
    },

    _getPolygonCenter: function(feature) {
      let coords = [];
      if (!feature || !feature.geometry) return null;
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
        coords = feature.geometry.coordinates[0];
      } else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates && feature.geometry.coordinates[0] && feature.geometry.coordinates[0][0]) {
        coords = feature.geometry.coordinates[0][0];
      }
      if (!coords || coords.length === 0) return null;

      let sumLng = 0, sumLat = 0;
      for (let i = 0; i < coords.length; i++) {
        sumLng += coords[i][0];
        sumLat += coords[i][1];
      }
      return [sumLng / coords.length, sumLat / coords.length];
    },

    init: function() {
      const container = document.getElementById('map-3d-container');
      if (!container) return;

      if (typeof maplibregl === 'undefined') {
        console.error('APP5T_Map3D: maplibregl no está disponible.');
        return;
      }

      if (this._map) {
        this._map.resize();
        this.syncLotColors();
        return;
      }

      const activeProj = this._getActiveProjectName();
      const cfg = this._projectConfigs[activeProj] || this._projectConfigs['El Copihue'];

      try {
        this._map = new maplibregl.Map({
          container: 'map-3d-container',
          style: {
            version: 8,
            sources: {
              'google-hybrid': {
                type: 'raster',
                tiles: [
                  'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                  'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                ],
                tileSize: 256,
                attribution: '© Google Satellite'
              }
            },
            layers: [
              {
                id: 'satellite-tiles',
                type: 'raster',
                source: 'google-hybrid',
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: [cfg.lng, cfg.lat],
          zoom: cfg.zoom,
          pitch: cfg.pitch,
          bearing: cfg.bearing,
          maxPitch: 82,
          antialias: true
        });

        this._map.addControl(new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }), 'top-right');

        this._map.on('load', () => {
          this._loadGeoJsonLayers();
          this._renderHtmlMarkers();
          this._setupInteractions();
          this._map.resize();
          this._updateMarkerVisibility();
        });

        this._map.on('zoom', () => this._updateMarkerVisibility());
        this._map.on('pitch', () => this._updateMarkerVisibility());
        this._map.on('move', () => this._updateMarkerVisibility());

        this._map.on('mousedown', () => this.stopCinematicOrbit());
        this._map.on('touchstart', () => this.stopCinematicOrbit());
        this._map.on('wheel', () => this.stopCinematicOrbit());

      } catch (err) {
        console.error('APP5T_Map3D: Error inicializando MapLibre 3D:', err);
      }
    },

    _getActiveProjectName: function() {
      const select = document.getElementById('map-project-select');
      if (select && select.value && select.value !== 'todos' && select.value !== 'all') {
        return select.value;
      }
      if (typeof APP5T_Map !== 'undefined' && APP5T_Map._currentProjectName) {
        return APP5T_Map._currentProjectName;
      }
      return 'El Copihue';
    },

    _loadGeoJsonLayers: function() {
      if (!this._map) return;

      const layerKeys = ['copihue', 'brisas', 'encinos', 'naranjos'];

      layerKeys.forEach(key => {
        const raw = this._getLayerRawData(key);
        if (!raw) return;

        const geojson = this._normalizeGeoJSON(raw);
        if (!geojson) return;

        if (!this._map.getSource(`src-${key}`)) {
          this._map.addSource(`src-${key}`, {
            type: 'geojson',
            data: geojson
          });
        }

        // 1. Relleno Extruido 3D Translúcido
        if (!this._map.getLayer(`layer-${key}-3d-fill`)) {
          this._map.addLayer({
            id: `layer-${key}-3d-fill`,
            type: 'fill-extrusion',
            source: `src-${key}`,
            paint: {
              'fill-extrusion-color': [
                'case',
                ['any', ['==', ['get', 'estado'], 'Vendida'], ['==', ['get', 'estado'], 'Escriturada']], '#22c55e',
                ['==', ['get', 'estado'], 'Promesada'], '#3b82f6',
                ['==', ['get', 'estado'], 'Reservada'], '#f97316',
                ['any', ['==', ['get', 'estado'], 'Pre-reserva'], ['==', ['get', 'estado'], 'Pendiente']], '#facc15',
                ['==', ['get', 'estado'], 'Venta_Directa'], '#a855f7',
                ['==', ['get', 'estado'], 'Bloqueado'], '#64748b',
                '#ffffff'
              ],
              'fill-extrusion-height': [
                'case',
                ['==', ['get', 'nombre'], this._selectedLoteNom || 'NONE'], 3.2,
                1.6
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.45
            }
          });
        }

        // 2. Líneas de borde estándar
        if (!this._map.getLayer(`layer-${key}-3d-line`)) {
          this._map.addLayer({
            id: `layer-${key}-3d-line`,
            type: 'line',
            source: `src-${key}`,
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.4,
              'line-opacity': 0.85
            }
          });
        }

        // 3. Capa de Resaltado Ad-Hoc
        if (!this._map.getLayer(`layer-${key}-3d-highlight`)) {
          this._map.addLayer({
            id: `layer-${key}-3d-highlight`,
            type: 'line',
            source: `src-${key}`,
            filter: ['==', ['get', 'nombre'], this._selectedLoteNom || 'NONE'],
            paint: {
              'line-color': [
                'case',
                ['any', ['==', ['get', 'estado'], 'Vendida'], ['==', ['get', 'estado'], 'Escriturada']], '#4ade80',
                ['==', ['get', 'estado'], 'Promesada'], '#60a5fa',
                ['==', ['get', 'estado'], 'Reservada'], '#fb923c',
                ['any', ['==', ['get', 'estado'], 'Pre-reserva'], ['==', ['get', 'estado'], 'Pendiente']], '#fde047',
                '#38bdf8'
              ],
              'line-width': 4.0,
              'line-opacity': 1.0,
              'line-blur': 1.0
            }
          });
        }
      });
    },

    _renderHtmlMarkers: function() {
      if (!this._map) return;

      this._htmlMarkers.forEach(m => m.remove());
      this._htmlMarkers = [];

      const layerKeys = ['copihue', 'brisas', 'encinos', 'naranjos'];

      layerKeys.forEach(key => {
        const raw = this._getLayerRawData(key);
        if (!raw) return;

        const geojson = this._normalizeGeoJSON(raw);
        if (!geojson || !geojson.features) return;

        geojson.features.forEach(f => {
          const center = this._getPolygonCenter(f);
          if (!center) return;

          const p = f.properties || {};
          const loteNum = p.lote || '';
          const estado = p.estado || 'Disponible';
          
          let estadoClass = 'disponible';
          let estadoShort = 'Disponible';

          if (estado === 'Vendida' || estado === 'Escriturada') {
            estadoClass = 'vendida';
            estadoShort = 'Vendida';
          } else if (estado === 'Promesada') {
            estadoClass = 'promesada';
            estadoShort = 'Promesada';
          } else if (estado === 'Reservada') {
            estadoClass = 'reservada';
            estadoShort = 'Reservada';
          } else if (estado === 'Pre-reserva' || estado === 'Pendiente') {
            estadoClass = 'prereserva';
            estadoShort = 'Pre-reserva';
          }

          const el = document.createElement('div');
          el.className = 'lot-3d-marker';
          el.dataset.lote = p.nombre || ('Lote ' + loteNum);
          el.dataset.estado = estado;
          
          el.innerHTML = `
            <div class="lot-3d-pill lot-st-${estadoClass}">
              <span class="lot-3d-st">${estadoShort}</span>
            </div>
          `;

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._onLoteClicked(p, center, e);
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(center)
            .addTo(this._map);

          this._htmlMarkers.push(marker);
        });
      });

      this._updateMarkerVisibility();
    },

    _updateMarkerVisibility: function() {
      if (!this._map) return;
      const zoom = this._map.getZoom();

      // Bounding box del popup activo si existe
      let popupRect = null;
      if (this._currentPopup && this._currentPopup.isOpen()) {
        const popupEl = this._currentPopup.getElement();
        if (popupEl) {
          popupRect = popupEl.getBoundingClientRect();
        }
      }

      this._htmlMarkers.forEach(m => {
        const el = m.getElement();
        if (!el) return;
        const stSpan = el.querySelector('.lot-3d-st');
        const isDisponible = el.dataset.estado === 'Disponible';

        // 1. Si es el lote seleccionado o colisiona con el popup activo, OCULTAR TOTALMENTE
        if (this._selectedLoteNom && el.dataset.lote === this._selectedLoteNom) {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          return;
        }

        if (popupRect && popupRect.width > 0) {
          const markerRect = el.getBoundingClientRect();
          // Margen de seguridad amplio de 30px alrededor de la tarjeta
          const collides = !(
            markerRect.right < (popupRect.left - 30) ||
            markerRect.left > (popupRect.right + 30) ||
            markerRect.bottom < (popupRect.top - 30) ||
            markerRect.top > (popupRect.bottom + 30)
          );

          if (collides) {
            el.style.display = 'none';
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
            return;
          }
        }

        // 2. Control de visibilidad según Zoom
        el.style.visibility = 'visible';
        if (zoom < 15.0) {
          el.style.display = 'none';
        } else if (zoom >= 15.0 && zoom < 15.9) {
          if (isDisponible) {
            el.style.display = 'none';
          } else {
            el.style.display = 'block';
            el.style.opacity = '0.85';
            el.style.pointerEvents = 'auto';
            if (stSpan) stSpan.style.fontSize = '0.54rem';
          }
        } else if (zoom >= 15.9 && zoom < 16.8) {
          el.style.display = 'block';
          el.style.opacity = '0.95';
          el.style.pointerEvents = 'auto';
          if (stSpan) stSpan.style.fontSize = '0.62rem';
        } else {
          el.style.display = 'block';
          el.style.opacity = '1.0';
          el.style.pointerEvents = 'auto';
          if (stSpan) stSpan.style.fontSize = '0.74rem';
        }
      });
    },

                _onLoteClicked: function(p, lngLat, e) {
      const loteNom = p.nombre || ('Lote ' + p.lote) || 'Lote';
      const estado = p.estado || 'Disponible';
      const precio = p.precio ? (typeof APP5T_Utils !== 'undefined' ? APP5T_Utils.formatMoneda(p.precio) : ('$' + p.precio)) : 'Consultar';
      const sup = (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.formatSuperficie) ? APP5T_Utils.formatSuperficie(p.superficie || 5000) : (p.superficie ? (p.superficie + ' m²') : '5.000,0 m²');

      this.highlightLote3D(loteNom, estado);

      if (this._currentPopup) {
        this._currentPopup.remove();
        this._currentPopup = null;
      }

      this._map.flyTo({
        center: lngLat,
        zoom: Math.max(this._map.getZoom(), 17.2),
        pitch: 68,
        duration: 800
      });

      // Ventana emergente informativa con estilo de la app y datos básicos
      this._currentPopup = new maplibregl.Popup({
        offset: [0, -22],
        closeButton: true,
        closeOnClick: false,
        className: 'popup-3d-front'
      })
      .setLngLat(lngLat)
      .setHTML(
        '<div style="font-family:\'Outfit\',\'Inter\',sans-serif; min-width:160px; padding:4px 6px; text-align:left;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; gap:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">' +
            '<strong style="color:#00e5ff; font-size:1.05rem; font-weight:700;">' + loteNom + '</strong>' +
            '<span style="font-size:0.68rem; padding:2px 7px; border-radius:10px; background:rgba(255,255,255,0.12); font-weight:700; color:#fff;">' + estado + '</span>' +
          '</div>' +
          '<div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:2px;"><i class="fa-solid fa-ruler-combined" style="color:#22c55e;"></i> Superficie: <strong style="color:#fff;">' + sup + '</strong></div>' +
          '<div style="font-size:0.78rem; color:#fff; font-weight:700;"><i class="fa-solid fa-tag" style="color:#f59e0b;"></i> Precio: <span style="color:#34d399;">' + precio + '</span></div>' +
        '</div>'
      )
      .addTo(this._map);

      this._currentPopup.on('close', () => {
        this._currentPopup = null;
        this.clearHighlight();
        this._updateMarkerVisibility();
      });

      // Actualizar automáticamente la ficha lateral sin pasos intermedios
      if (typeof window.APP5T_onLote3DSelect === 'function') {
        window.APP5T_onLote3DSelect(loteNom);
      }
    },

    highlightLote3D: function(loteNom, estado) {
      this._selectedLoteNom = loteNom;
      if (!this._map) return;

      const layerKeys = ['copihue', 'brisas', 'encinos', 'naranjos'];
      layerKeys.forEach(key => {
        if (this._map.getLayer('layer-' + key + '-3d-highlight')) {
          this._map.setFilter('layer-' + key + '-3d-highlight', ['==', ['get', 'nombre'], loteNom || 'NONE']);
        }
        if (this._map.getLayer('layer-' + key + '-3d-fill')) {
          // Efecto visual de elevación 3D sobre la parcela seleccionada
          this._map.setPaintProperty('layer-' + key + '-3d-fill', 'fill-extrusion-height', [
            'case',
            ['==', ['get', 'nombre'], loteNom || 'NONE'], 5.5,
            1.2
          ]);
          this._map.setPaintProperty('layer-' + key + '-3d-fill', 'fill-extrusion-base', [
            'case',
            ['==', ['get', 'nombre'], loteNom || 'NONE'], 0.8,
            0.0
          ]);
        }
      });
    },

    clearHighlight: function() {
      this.highlightLote3D(null, null);
    },

    syncLotColors: function() {
      if (!this._map) return;
      const layerKeys = ['copihue', 'brisas', 'encinos', 'naranjos'];

      layerKeys.forEach(key => {
        const raw = this._getLayerRawData(key);
        if (!raw) return;

        const updatedGeo = this._normalizeGeoJSON(raw);
        const src = this._map.getSource(`src-${key}`);
        if (src && updatedGeo) {
          src.setData(updatedGeo);
        }
      });

      this._renderHtmlMarkers();
    },

    _setupInteractions: function() {
      if (!this._map) return;
      const layerKeys = ['copihue', 'brisas', 'encinos', 'naranjos'];

      layerKeys.forEach(key => {
        const layerId = `layer-${key}-3d-fill`;

        this._map.on('mouseenter', layerId, () => {
          this._map.getCanvas().style.cursor = 'pointer';
        });
        this._map.on('mouseleave', layerId, () => {
          this._map.getCanvas().style.cursor = '';
        });

        this._map.on('click', layerId, (e) => {
          if (!e.features || !e.features.length) return;
          const feat = e.features[0];
          const p = feat.properties || {};

          // En vista general 3D (zoom < 15), volar al loteo total sin seleccionar lote
          if (this._map && this._map.getZoom() < 15) {
            const keyToProjectName = {
              'copihue': 'El Copihue',
              'brisas': 'Las Brisas',
              'encinos': 'Los Encinos',
              'naranjos': 'Los Naranjos'
            };
            const projName = keyToProjectName[key] || this._getActiveProjectName();
            this.flyToProject(projName);
            const select = document.getElementById('map-project-select');
            if (select && projName) {
              select.value = projName;
            }
            if (window.APP5T && typeof window.APP5T.clearLoteSelection === 'function') {
              window.APP5T.clearLoteSelection();
            }
            return;
          }

          this._onLoteClicked(p, e.lngLat, e);
        });
      });
    },

    toggle3D: function() {
      // Limpiar selección de lote al alternar vistas 2D / 3D
      if (window.APP5T && typeof window.APP5T.clearLoteSelection === 'function') {
        window.APP5T.clearLoteSelection();
      }
      this.clearHighlight();
      if (this._currentPopup) {
        this._currentPopup.remove();
        this._currentPopup = null;
      }
      const map2D = document.getElementById('map-element');
      const map3D = document.getElementById('map-3d-container');
      const btnToggle = document.getElementById('btn-toggle-3d');
      const barControls = document.getElementById('map-3d-action-bar');

      this._is3DActive = !this._is3DActive;

      if (this._is3DActive) {
        if (map2D) map2D.style.display = 'none';
        if (map3D) {
          map3D.style.display = 'block';
          if (!this._map) {
            this.init();
          } else {
            this._map.resize();
            this.syncLotColors();
          }
        }
        if (btnToggle) {
          btnToggle.classList.add('active-3d');
          btnToggle.innerHTML = '<i class="fa-solid fa-map"></i> <span id="lbl-toggle-3d">Vista 2D</span>';
          btnToggle.style.background = 'linear-gradient(135deg, #00e5ff, #0077b6)';
          btnToggle.style.color = '#031b2e';
        }
        if (barControls) barControls.style.display = 'flex';

        const projName = this._getActiveProjectName();
        setTimeout(() => {
          if (this._map) {
            this._map.resize();
            this.flyToProject(projName);
          }
        }, 120);

        if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
          APP5T_Utils.showToast('🧊 Modo 3D Activado', 'info');
        }
      } else {
        this.stopCinematicOrbit();
        this.clearHighlight();
        if (this._currentPopup) {
          this._currentPopup.remove();
          this._currentPopup = null;
        }
        if (map3D) map3D.style.display = 'none';
        if (map2D) {
          map2D.style.display = 'block';
          if (typeof APP5T_Map !== 'undefined' && APP5T_Map._mapInstance) {
            APP5T_Map._mapInstance.invalidateSize();
          }
        }
        if (btnToggle) {
          btnToggle.classList.remove('active-3d');
          btnToggle.innerHTML = '<i class="fa-solid fa-cube"></i> <span id="lbl-toggle-3d">Vista 3D</span>';
          btnToggle.style.background = 'rgba(0, 229, 255, 0.08)';
          btnToggle.style.color = '#00e5ff';
        }
        if (barControls) barControls.style.display = 'none';
      }
    },

    flyToProject: function(projectName) {
      this._currentProject = projectName || 'El Copihue';
      this.clearHighlight();
      if (this._currentPopup) {
        this._currentPopup.remove();
        this._currentPopup = null;
      }
      if (!this._map) return;
      const target = this._projectConfigs[projectName] || this._projectConfigs['El Copihue'];

      this._map.flyTo({
        center: [target.lng, target.lat],
        zoom: target.zoom,
        pitch: target.pitch,
        bearing: target.bearing,
        duration: 1500,
        essential: true
      });
    },

    toggleCinematicOrbit: function() {
      if (this._isOrbiting) {
        this.stopCinematicOrbit();
      } else {
        this.startCinematicOrbit();
      }
    },

    startCinematicOrbit: function() {
      if (!this._map) return;
      this._isOrbiting = true;
      const btn = document.getElementById('btn-3d-orbit');
      if (btn) {
        btn.classList.add('btn-orbiting');
        btn.innerHTML = '<i class="fa-solid fa-stop"></i> Detener';
      }

      const rotateStep = () => {
        if (!this._isOrbiting || !this._map) return;
        const b = this._map.getBearing();
        this._map.setBearing(b + this._orbitSpeed);
        this._orbitAnimId = requestAnimationFrame(rotateStep);
      };

      this._orbitAnimId = requestAnimationFrame(rotateStep);
      if (typeof APP5T_Utils !== 'undefined' && APP5T_Utils.showToast) {
        APP5T_Utils.showToast('🎥 Grabación 360° en curso', 'success');
      }
    },

    stopCinematicOrbit: function() {
      this._isOrbiting = false;
      if (this._orbitAnimId) {
        cancelAnimationFrame(this._orbitAnimId);
        this._orbitAnimId = null;
      }
      const btn = document.getElementById('btn-3d-orbit');
      if (btn) {
        btn.classList.remove('btn-orbiting');
        btn.innerHTML = '<i class="fa-solid fa-video"></i> Giro 360°';
      }
    },

    setPitchAngle: function(angle) {
      if (!this._map) return;
      this._map.easeTo({ pitch: Math.min(80, Math.max(0, angle)), duration: 600 });
    }
  };

  window.APP5T_Map3D = APP5T_Map3D;

  // Bridge callback for 3D selection to standard app flow
    window.APP5T_onLote3DSelect = function(loteNom) {
    try {
      const props = (typeof APP5T_DB !== 'undefined') ? APP5T_DB.getAll('propiedades') : [];
      const targetNum = String(loteNom || '').replace(/[^0-9]/g, '');
      const match = props.find(p => {
        const pNum = String(p.numero || p.nombre || '').replace(/[^0-9]/g, '');
        return pNum && targetNum && pNum === targetNum;
      }) || props.find(p => p.nombre === loteNom || p.numero === loteNom);

      if (match) {
        if (window.APP5T && typeof window.APP5T.onLoteSelected === 'function') {
          window.APP5T.onLoteSelected(match);
        } else if (typeof onLoteSelected === 'function') {
          onLoteSelected(match);
        } else if (typeof APP5T_Map !== 'undefined' && typeof APP5T_Map.selectLoteByName === 'function') {
          APP5T_Map.selectLoteByName(match.nombre || match.numero);
        }
      }
    } catch(err) {
      console.warn('APP5T_Map3D select bridge error:', err);
    }
  };
})();
