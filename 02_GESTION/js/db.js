/**
 * ============================================================
 *  5 Tierras — APP5T_DB
 *  Módulo de base de datos local (localStorage)
 *  Versión: v1.0.0
 *  Fecha: 2026-06-05
 * ============================================================
 *  Simula una base de datos relacional completa con CRUD
 *  genérico, workflows de negociación inmobiliaria (reserva →
 *  promesa → escritura), cuenta corriente con cuotas, y
 *  estadísticas de proyecto.
 *
 *  Depende de: APP5T_Utils (utils.js — debe cargarse primero)
 * ============================================================
 */
var APP5T_DB = (function () {
    'use strict';

    // ───────────────────── CONSTANTES ─────────────────────

    var DB_VERSION = 'v1.1.16';
    var KEY_PREFIX = 'app5t_';
    var TABLES = [
        'vendedores',
        'clientes',
        'proyectos',
        'etapas',
        'propiedades',
        'directorio',
        'negociaciones',
        'cuenta_corriente',
        'tramites',
        'documentos',
        'auditoria'
    ];

    // ───────────────────── SCHEMAS ESTRICTOS (PRD) ─────────────────────
    const SCHEMAS = {
        vendedores: {
            rut: 'string', nombre: 'string', fecha_ingreso: 'string',
            ciudad: 'string', telefono: 'string', email: 'string',
            cargo: 'string', estado: 'string'
        },
        clientes: {
            rut: 'string', nombres: 'string', apellidos: 'string', fecha_nacimiento: 'string',
            direccion: 'string', comuna: 'string', telefono: 'string', email: 'string',
            estado_civil: 'string', regimen_matrimonial: 'string', fecha_ingreso: 'string',
            canal_captacion: 'string', id_vendedor: 'number', motivo_busqueda: 'string',
            profesion: 'string',
            notas: 'string', historial: 'string', estado_cliente: 'string'
        },
        proyectos: {
            nombre_proyecto: 'string', nombre: 'string', ubicacion: 'string', comuna: 'string', coordenadas_centro: 'object',
            superficie: 'number', rol: 'string', deslindes: 'string', infraestructura: 'string',
            caracteristicas: 'string', fecha_dom: 'string', fecha_ingreso: 'string',
            estado_proyecto: 'string', nro_etapas: 'number', url: 'string'
        },
        etapas: {
            id_proyecto: 'number', nombre_etapa: 'string', nombre: 'string', nro_lotes: 'number', superficie: 'number',
            fecha_ingreso: 'string', fecha_dom: 'string', estado_etapa: 'string', fecha_inicio: 'string',
            fecha_cierre: 'string', url: 'string'
        },
        propiedades: {
            id_etapa: 'number', id_proyecto: 'number', nombre: 'string', rol: 'string',
            superficie: 'number', coordenadas: 'object', valor_final: 'number', abono: 'number', fecha_ingreso: 'string',
            deslindes: 'string', infraestructura: 'string', fecha_reserva: 'string',
            fecha_fin_promesa: 'string',
            fecha_venta: 'string',
            url: 'string',
            estado: 'string',
            coordenadas: 'object'
        },
        directorio: {
            rut: 'string', nombre: 'string', cargo: 'string', telefono: 'string',
            email: 'string', fecha_ingreso: 'string', estado: 'string',
            auth_reserva: 'string', firma_reserva: 'string', auth_promesa: 'string',
            firma_promesa: 'string', auth_venta: 'string', firma_venta: 'string'
        },
        negociaciones: {
            id_propiedad: 'number', id_vendedor: 'number', id_cliente: 'number', fecha_negociacion: 'string',
            valor_final: 'number', pie: 'number', cantidad_cuotas: 'number', fecha_vencimiento_cuota: 'string',
            tipo_moneda: 'string', url: 'string', estado_avance: 'string', reajuste: 'number', id_proceso: 'string',
            metodo_pago: 'string', notas: 'string', fecha_promesa: 'string', tipo_operacion: 'string',
            autorizado_promesa: 'boolean', ficha_abogado_generada: 'boolean', fecha_envio_abogado: 'string',
            autorizado_escriturar: 'any', estado_escrituracion: 'any',
            comprobante_url: 'string'
        },
        cuenta_corriente: {
            id_cliente: 'number', id_propiedad: 'number', cuota_nro: 'number', valor_cuota: 'number',
            fecha_vencimiento: 'string', valor_pagado: 'number', fecha_pago: 'string', url: 'string',
            estado_cuota: 'string', metodo_pago: 'string'
        },
        tramites: {
            id_tramite: 'number',
            Nombre_tramite: 'string',
            fecha_inicio: 'string',
            id_propiedad: 'number',
            id_director: 'number',
            Estado_tramite: 'string',
            id_proceso: 'string'
        },
        documentos: {
            id_propiedad: 'string',
            nombre: 'string',
            tipo_documento: 'string',
            url_drive: 'string',
            estado: 'string',
            fecha_carga: 'string',
            id_proyecto: 'number',
            fecha_ingreso: 'string'
        }
    };

    function _validateSchema(tabla, data) {
        if (!SCHEMAS[tabla]) return data; // Skip tables without schema (e.g. auditoria)
        const schema = SCHEMAS[tabla];
        const validData = {};
        for (let key in schema) {
            if (data[key] !== undefined) {
                // strict cast
                if (schema[key] === 'number') {
                    if (data[key] === null || data[key] === '') {
                        validData[key] = null;
                    } else {
                        const num = Number(data[key]);
                        validData[key] = isNaN(num) ? 0 : num;
                    }
                }
                else if (schema[key] === 'string') validData[key] = String(data[key] || '');
                else validData[key] = data[key];
            } else {
                // defaults
                if (schema[key] === 'number') validData[key] = 0;
                else if (schema[key] === 'string') validData[key] = '';
                else validData[key] = null;
            }
        }
        return validData;
    }

    // ───────────────────── HELPERS INTERNOS ─────────────────────

    /** Genera la clave de localStorage para una tabla */
    function _getKey(tabla) {
        return KEY_PREFIX + tabla;
    }

    /** Carga un arreglo desde localStorage */
    function _load(tabla) {
        try {
            let parsed = JSON.parse(localStorage.getItem(_getKey(tabla))) || [];
            if (Array.isArray(parsed)) {
                return parsed.filter(item => item !== null && item !== undefined);
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    /** Persiste un arreglo en localStorage */
    function _save(tabla, data) {
        try {
            localStorage.setItem(_getKey(tabla), JSON.stringify(data));
        } catch (e) {
            console.warn('APP5T_DB: Error saving to localStorage (Safari Private Mode or Quota):', e);
        }
    }

    // ───────────────────── CRUD GENÉRICO ─────────────────────

    /**
     * Retorna todos los registros de una tabla.
     * @param {string} tabla
     * @returns {Array}
     */
    function getAll(tabla) {
        var items = _load(tabla);
        if (tabla === 'tramites') {
            var changed = false;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id_director === -1) {
                    items[i].id_director = null;
                    changed = true;
                }
            }
            if (changed) _save(tabla, items);
        }
        return items;
    }

    /**
     * Busca un registro por su ID numérico.
     * @param {string} tabla
     * @param {number} id
     * @returns {Object|null}
     */
    function getById(tabla, id) {
        var items = _load(tabla);
        id = parseInt(id, 10);
        for (var i = 0; i < items.length; i++) {
            if (items[i].id === id) return items[i];
        }
        return null;
    }

    /**
     * Inserta un nuevo registro. El ID se genera automáticamente.
     * @param {string} tabla
     * @param {Object} data
     * @returns {{success:boolean, id:number, error:string}}
     */
    function _getActiveUser() {
        if (window.APP5T && typeof window.APP5T.getActiveUser === 'function') {
            return window.APP5T.getActiveUser();
        }
        return 'Sistema';
    }

    function _getActiveRole() {
        if (window.APP5T && typeof window.APP5T.getActiveRole === 'function') {
            return window.APP5T.getActiveRole();
        }
        return 'Sistema';
    }

    /**
     * Inserta un nuevo registro. El ID se genera automáticamente.
     * @param {string} tabla
     * @param {Object} data
     * @returns {{success:boolean, id:number, error:string}}
     */
    function insert(tabla, data) {
        try {
            var items = _load(tabla);
            var safeData = _validateSchema(tabla, data);
            safeData.id = APP5T_Utils.generarId(items);
            if (tabla === 'tramites') {
                safeData.id_tramite = safeData.id;
            }
            items.push(safeData);
            _save(tabla, items);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Insertar', safeData.id, JSON.stringify(safeData));

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                APP5T_Sync.pushRecord(tabla, 'insert', safeData, u);
            }

            return { success: true, id: safeData.id };
        } catch (e) {
            return { success: false, id: null, error: e.message };
        }
    }

    /**
     * Actualiza campos de un registro existente (merge).
     * @param {string} tabla
     * @param {number} id
     * @param {Object} data — campos a actualizar
     * @returns {{success:boolean, error:string}}
     */
    function update(tabla, id, data) {
        try {
            var items = _load(tabla);
            id = parseInt(id, 10);
            var idx = -1;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === id) { idx = i; break; }
            }
            if (idx === -1) return { success: false, error: 'Registro no encontrado' };

            // Merge preservando id y validando esquema
            var merged = Object.assign({}, items[idx], data);
            var safeData = _validateSchema(tabla, merged);
            safeData.id = id;
            
            items[idx] = safeData;
            _save(tabla, items);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Actualizar', id, JSON.stringify(data));

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                safeData.id = id;
                APP5T_Sync.pushRecord(tabla, 'update', safeData, u);
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Elimina un registro por ID.
     * @param {string} tabla
     * @param {number} id
     * @returns {{success:boolean, error:string}}
     */
    function remove(tabla, id) {
        try {
            var items = _load(tabla);
            id = parseInt(id, 10);
            var original = items.length;
            var filtered = items.filter(function (item) {
                return item.id !== id;
            });
            if (filtered.length === original) {
                return { success: false, error: 'Registro no encontrado' };
            }
            _save(tabla, filtered);

            // Auditoría
            var u = _getActiveUser();
            var r = _getActiveRole();
            logAudit(u, r, tabla, 'Eliminar', id, 'Registro ID: ' + id);

            // Sincronización
            if (typeof APP5T_Sync !== 'undefined') {
                APP5T_Sync.pushRecord(tabla, 'delete', { id: id }, u);
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Filtra registros con una función personalizada.
     * @param {string} tabla
     * @param {Function} filterFn
     * @returns {Array}
     */
    function query(tabla, filterFn) {
        return _load(tabla).filter(filterFn);
    }

    /**
     * Cuenta registros, opcionalmente filtrados.
     * @param {string} tabla
     * @param {Function} [filterFn]
     * @returns {number}
     */
    function count(tabla, filterFn) {
        if (filterFn) return query(tabla, filterFn).length;
        return _load(tabla).length;
    }

    // ═══════════════════════════════════════════════════════
    //  INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════

    /**
     * Procesa un GeoJSON de lotes y retorna un arreglo de propiedades.
     * @param {Object}  geojson       — FeatureCollection
     * @param {number}  idProyecto
     * @param {number}  idEtapa
     * @param {number}  precioDefault — precio por defecto si no viene en el GeoJSON
     * @param {number}  startId       — ID inicial para asignación secuencial
     * @returns {Array} propiedades generadas
     */
    function _procesarGeoJSON(geojson, idProyecto, idEtapa, precioDefault, startId) {
        if (!geojson || !geojson.features) return [];

        var propiedades = [];
        var propId = startId;

        for (var i = 0; i < geojson.features.length; i++) {
            var feat = geojson.features[i];
            var props = feat.properties || {};

            // — Nombre
            var nombre = props.Lote || props.nombre || ('Lote ' + (i + 1));

            // — Superficie (parsear variantes: Area, Hectareas, Superficie)
            var supRaw = props.Area || props.Hectareas || props.Superficie || 0;
            var superficie = APP5T_Utils.parsearSuperficie(supRaw);

            // — Precio (respetar null → default)
            var precioRaw = props.Precio;
            var valorFinal = precioRaw ? APP5T_Utils.sanitizeNumber(precioRaw) : 0;
            if (!valorFinal) valorFinal = precioDefault;

            // — Estado (RESPETAR valores existentes)
            var estado = APP5T_Utils.normalizarEstado(props.Estado);

            // — Coordenadas: geometría GeoJSON completa
            var coordenadas = feat.geometry || null;

            propiedades.push({
                id:               propId++,
                id_etapa:         idEtapa,
                id_proyecto:      idProyecto,
                nombre:           nombre,
                rol:              '',
                superficie:       superficie,
                coordenadas:      coordenadas,
                valor_final:      valorFinal,
                fecha_ingreso:    APP5T_Utils.fechaHoy(),
                deslindes:        '',
                infraestructura:  '',
                fecha_reserva:    '',
                fecha_fin_promesa:'',
                fecha_venta:      '',
                url:              '',
                estado:           estado
            });
        }

        return propiedades;
    }

    /**
     * Inicializa la base de datos.
     * Si la versión coincide, no hace nada (datos ya cargados).
     * Si no, reconstruye desde los GeoJSON globales.
     */
    
    function reconcileData() {
        var props = getAll('propiedades') || [];
        var negs = getAll('negociaciones') || [];
        var updated = false;

        negs.forEach(function(n) {
            if (!n || !n.id_propiedad) return;
            var p = props.find(function(x) { return String(x.id) === String(n.id_propiedad); });
            
            // Si el lote no está Vendida ni Venta_Directa, NO debe tener la etiqueta AUTORIZADO_ESCRITURAR:TRUE
            if (!p || p.estado === 'Disponible' || p.estado === 'Pendiente' || p.estado === 'Reservada' || p.estado === 'Promesada') {
                if ((n.notas || '').indexOf('[AUTORIZADO_ESCRITURAR:TRUE]') !== -1) {
                    n.notas = (n.notas || '').replace(/\[AUTORIZADO_ESCRITURAR:TRUE\]/g, '').trim();
                    n.estado_escrituracion = null;
                    update('negociaciones', n.id, n);
                    updated = true;
                }
            }
        });

        if (updated && typeof APP5T_Sync !== 'undefined' && APP5T_Sync.pushTable) {
            
        }
    }

    function init() {
        // Asegurar que la nueva tabla 'tramites' existe localmente
        if (!localStorage.getItem(KEY_PREFIX + 'tramites')) {
            _save('tramites', []);
        }

        // La versin almacenada coincide y tenemos propiedades cargadas?
        var storedVersion = localStorage.getItem(KEY_PREFIX + 'db_version');
        var hasProps = false;
        try {
            var storedProps = localStorage.getItem(KEY_PREFIX + 'propiedades');
            if (storedProps) {
                var parsed = JSON.parse(storedProps);
                if (parsed && parsed.length > 0 && parsed.some(function(p) { return p.coordenadas; })) {
                    hasProps = true;
                }
            }
        } catch (e) {
            hasProps = false;
        }

        if (storedVersion === DB_VERSION && hasProps) {
            // SAFE MIGRATION: Ensure existing projects have mock URLs if they are empty
            try {
                var storedProjs = localStorage.getItem(KEY_PREFIX + 'proyectos');
                if (storedProjs) {
                    var projs = JSON.parse(storedProjs);
                    var changed = false;
                    var mockUrls = {
                        1: 'https://drive.google.com/file/d/1_copihue_plano_loteo_mock/view',
                        2: 'https://drive.google.com/file/d/1_las_brisas_plano_loteo_mock/view',
                        3: 'https://drive.google.com/file/d/1_los_encinos_plano_loteo_mock/view',
                        4: 'https://drive.google.com/file/d/1_los_naranjos_plano_loteo_mock/view'
                    };
                    projs.forEach(function (p) {
                        if (!p.url && mockUrls[p.id]) {
                            p.url = mockUrls[p.id];
                            changed = true;
                        }
                    });
                    if (changed) {
                        localStorage.setItem(KEY_PREFIX + 'proyectos', JSON.stringify(projs));
                        console.log('APP5T_DB: Migración exitosa de URLs de planos generales.');
                    }
                }
            } catch (e) {
                console.error('APP5T_DB: Error en migración de proyectos:', e);
            }
            
            // Auto-limpieza automatica de Lote 25 El Copihue
            try {
                limpiarLote('El Copihue', '25');
            } catch (errClean) {}

            return; // ya inicializado con datos
        }

        // ── Limpiar solo las tablas de datos, NUNCA las sesiones ni credenciales del usuario ──
        var protectedKeys = [
            'app5t_user',
            'app5t_permisos',
            'app5t_script_version',
            'app5t_mock_passwords',
            'app5t_mock_users'
        ];
        var keysToRemove = [];
        for (var k = 0; k < localStorage.length; k++) {
            var key = localStorage.key(k);
            if (key && key.indexOf(KEY_PREFIX) === 0 && key.indexOf('app5t_wa_config_') !== 0) {
                if (protectedKeys.indexOf(key) === -1) {
                    keysToRemove.push(key);
                }
            }
        }
        keysToRemove.forEach(function (key) {
            try { localStorage.removeItem(key); } catch(e) {}
        });

        // ── Establecer versión ──
        localStorage.setItem(KEY_PREFIX + 'db_version', DB_VERSION);

        // ── Inicializar tablas vacías ──
        TABLES.forEach(function (t) {
            _save(t, []);
        });

        // ── Proyectos ──
        var hoy = APP5T_Utils.fechaHoy();

        var proyectos = [
            {
                id: 1, nombre_proyecto: 'El Copihue', nombre: 'El Copihue', ubicacion: 'Sector Copihue',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.120, lng: -71.776 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: 'https://drive.google.com/file/d/1_copihue_plano_loteo_mock/view'
            },
            {
                id: 2, nombre_proyecto: 'Las Brisas', nombre: 'Las Brisas', ubicacion: 'Sector Las Brisas',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.385, lng: -71.953 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: 'https://drive.google.com/file/d/1_las_brisas_plano_loteo_mock/view'
            },
            {
                id: 3, nombre_proyecto: 'Los Encinos', nombre: 'Los Encinos', ubicacion: 'Sector Los Encinos',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.468, lng: -71.842 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: 'https://drive.google.com/file/d/1_los_encinos_plano_loteo_mock/view'
            },
            {
                id: 4, nombre_proyecto: 'Los Naranjos', nombre: 'Los Naranjos', ubicacion: 'Sector Los Naranjos',
                comuna: 'Chillán',
                coordenadas_centro: { lat: -36.478, lng: -71.838 },
                superficie: 0, rol: '', deslindes: '', infraestructura: '',
                caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
                estado_proyecto: 'Activo', nro_etapas: 1, url: 'https://drive.google.com/file/d/1_los_naranjos_plano_loteo_mock/view'
            }
        ];
        _save('proyectos', proyectos);

        // ── Etapas (1 por proyecto) ──
        var etapas = [
            { id: 1, id_proyecto: 1, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 2, id_proyecto: 2, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 3, id_proyecto: 3, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
            { id: 4, id_proyecto: 4, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' }
        ];
        _save('etapas', etapas);

        // ── Propiedades desde GeoJSON ──
        // Mapeo: variable global → id_proyecto, id_etapa, precio por defecto
        var geoSources = [
            { varName: 'json_copihue_lotes',  idProy: 1, idEtapa: 1, defaultPrice: 33000000 },
            { varName: 'json_brisas_lotes',   idProy: 2, idEtapa: 2, defaultPrice: 18000000 },
            { varName: 'json_encinos_lotes',  idProy: 3, idEtapa: 3, defaultPrice: 33000000 },
            { varName: 'json_naranjos_lotes', idProy: 4, idEtapa: 4, defaultPrice: 18000000 }
        ];

        var allProps = [];
        var nextId = 1;

        geoSources.forEach(function (src) {
            var geojson = window[src.varName] || null;
            var lotes = _procesarGeoJSON(geojson, src.idProy, src.idEtapa, src.defaultPrice, nextId);
            nextId += lotes.length;
            allProps = allProps.concat(lotes);
        });

        _save('propiedades', allProps);

        // ── Actualizar nro_lotes en cada etapa ──
        etapas.forEach(function (et) {
            var lotesCount = 0;
            for (var j = 0; j < allProps.length; j++) {
                if (allProps[j].id_etapa === et.id) lotesCount++;
            }
            et.nro_lotes = lotesCount;
        });
        _save('etapas', etapas);

        // ── Tablas inicializadas vacías (sin datos semilla para producción/sincronización limpia) ──
        _save('vendedores', []);
        _save('directorio', []);
        _save('clientes', []);

                console.log('[APP5T_DB] Base de datos inicializada — ' + allProps.length + ' propiedades cargadas.');
    }

    // ═══════════════════════════════════════════════════════
    //  WORKFLOWS DE NEGOCIACIÓN
    // ═══════════════════════════════════════════════════════

    // ───────────────────── SOLICITAR RESERVA ─────────────────────

    /**
     * Inicia una solicitud de reserva sobre una propiedad disponible.
     * @param {number} idPropiedad
     * @param {number} idVendedor
     * @param {number} idCliente
     * @param {Object} data — valor_final, pie, cantidad_cuotas, etc.
     * @returns {{success:boolean, id_negociacion:number, error:string}}
     */
    function solicitarReserva(idPropiedad, idVendedor, idCliente, data) {
        data = data || {};

        var prop = getById('propiedades', idPropiedad);
        if (!prop) return { success: false, error: 'Propiedad no encontrada' };
        if (prop.estado !== 'Disponible') return { success: false, error: 'Propiedad no disponible' };
        
        // Validación: el monto del pie no puede superar el valor del lote
        var valFinal = Number(data.valor_final || prop.valor_final) || 0;
        var valPie = Number(data.pie) || 0;
        if (valPie > valFinal) {
            return { success: false, error: 'El monto del pie no puede superar el precio de venta del lote' };
        }

        // Determinar si es Reserva estándar, Saldo de Precio o Venta Directa
        var tipoOp = 'Reserva';
        if (data.tipo_operacion === 'Venta_Directa') tipoOp = 'Venta_Directa';
        else if (data.tipo_operacion === 'Saldo_Precio') tipoOp = 'Saldo_Precio';
        else if (data.tipo_operacion) tipoOp = data.tipo_operacion;

        var neg = {
            id_propiedad:           idPropiedad,
            id_vendedor:            idVendedor,
            id_cliente:             idCliente,
            fecha_negociacion:      APP5T_Utils.fechaHoy(),
            valor_final:            data.valor_final || prop.valor_final,
            pie:                    data.pie || 0,
            cantidad_cuotas:        data.cantidad_cuotas || 0,
            fecha_vencimiento_cuota:data.fecha_vencimiento_cuota || '',
            tipo_moneda:            data.tipo_moneda || 'CLP',
            url:                    data.url || '',
            estado_avance:          'En Curso',
            reajuste:               data.reajuste || '',
            id_proceso:             tipoOp,
            tipo_operacion:         tipoOp,
            metodo_pago:            data.metodo_pago || '',
            notas:                  data.notas || '',
            comprobante_url:        data.comprobante_url || ''
        };

        var res = insert('negociaciones', neg);

        // Marcar la propiedad como Pendiente (aplica tanto para Reserva como Venta Directa)
        update('propiedades', idPropiedad, { estado: 'Pendiente' });

        // Auditoría
        var accionLog = 'Solicitud Reserva';
        if (tipoOp === 'Venta_Directa') accionLog = 'Solicitud Venta Directa';
        else if (tipoOp === 'Saldo_Precio') accionLog = 'Solicitud Saldo de Precio';
        logAudit('Sistema', 'Sistema', 'negociaciones', accionLog, res.id,
                 'Propiedad: ' + prop.nombre);

        // Auto-aprobación si el vendedor es Senior
        var vendedor = getById('vendedores', idVendedor);
        var esSenior = false;
        
        if (vendedor && vendedor.cargo && vendedor.cargo.toLowerCase().includes('senior')) {
            esSenior = true;
        }

        try {
            var rawUser = sessionStorage.getItem('app5t_user') || localStorage.getItem('app5t_user');
            if (rawUser) {
                var u = JSON.parse(rawUser);
                if (u && u.rol && String(u.rol).toLowerCase() === 'vendedor') {
                    esSenior = false; // Never auto-approve if they are just a 'vendedor'
                }
            }
        } catch(e) {}

        if (esSenior) {
            var dir;
            if (idDirector === -1 || !idDirector || idDirector === 0) {
                dir = { id: 1, nombre: _getActiveUser() || 'Gerente General', auth_reserva: 'S' };
            } else {
                dir = getById('directorio', idDirector);
                if (!dir) {
                    dir = { id: idDirector, nombre: _getActiveUser() || 'Gerente General', auth_reserva: 'S' };
                }

                var authVal = String(dir.auth_reserva || '').trim().toUpperCase();
                var isAuth = authVal === 'S' || authVal === 'SI' || authVal === 'SÍ' || authVal === 'TRUE' || authVal === '1';
                if (!isAuth) {
                    update('directorio', dir.id, { auth_reserva: 'S' });
                    dir = getById('directorio', idDirector) || dir;
                }
            }
            aprobarReserva(res.id, -1);
        }

        return { success: true, id_negociacion: res.id };
    }

    // ───────────────────── APROBAR RESERVA ─────────────────────

    /**
     * Un director autorizado aprueba la reserva.
     * @param {number} idNegociacion
     * @param {number} idDirector
     * @returns {{success:boolean, error:string}}
     */
    function aprobarReserva(idNegociacion, idDirector) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        var esVentaDirecta = (neg.id_proceso === 'Venta_Directa' || neg.tipo_operacion === 'Venta_Directa');
        var esSaldoPrecio = (neg.id_proceso === 'Saldo_Precio' || neg.tipo_operacion === 'Saldo_Precio');

        if (!esVentaDirecta && !esSaldoPrecio && (neg.id_proceso !== 'Reserva' || neg.estado_avance !== 'En Curso')) {
            return { success: false, error: 'Negociación no está en proceso de Reserva o Venta' };
        }
        if (neg.estado_avance !== 'En Curso') {
            return { success: false, error: 'Negociación no está en curso' };
        }

        var dir;
        if (idDirector === -1) {
            dir = { id: -1, nombre: 'Auto-Aprobación (Vendedor Senior)', auth_reserva: 'S' };
        } else {
            dir = getById('directorio', idDirector);
            if (!dir) {
                return { success: false, error: 'Director no encontrado' };
            }

            var authVal = String(dir.auth_reserva || '').trim().toUpperCase();
            var isAuth = authVal === 'S' || authVal === 'SI' || authVal === 'SÍ' || authVal === 'TRUE' || authVal === '1';
            if (!isAuth) {
                // Auto-autorizar al director en la base de datos para corregir discrepancias de sincronización
                update('directorio', dir.id, { auth_reserva: 'S' });
                dir = getById('directorio', idDirector);
            }
        }

        if (esVentaDirecta) {
            // ── Flujo Venta Directa: propiedad pasa a estado 'Venta_Directa' (Espera Escritura) ──
            update('propiedades', neg.id_propiedad, {
                estado: 'Venta_Directa',
                fecha_reserva: APP5T_Utils.fechaHoy()
            });
            update('negociaciones', idNegociacion, { estado_avance: 'Aprobado' });
            insert('tramites', {
                Nombre_tramite: 'venta directa aprobada',
                fecha_inicio:   APP5T_Utils.fechaHoy(),
                id_propiedad:   Number(neg.id_propiedad) || 0,
                id_director:    idDirector === -1 ? null : (Number(idDirector) || 0),
                Estado_tramite: 'pendiente escritura',
                id_proceso:     'Venta_Directa'
            });
            logAudit(dir.nombre, 'Director', 'negociaciones', 'Aprobación Venta Directa',
                     idNegociacion, 'Propiedad ID: ' + neg.id_propiedad);
        } else if (esSaldoPrecio) {
            // ── Flujo Saldo de Precio: pasa a Reservada con proceso Saldo_Precio y cuotas de saldo ──
            update('propiedades', neg.id_propiedad, {
                estado: 'Reservada',
                fecha_reserva: APP5T_Utils.fechaHoy()
            });
            update('negociaciones', idNegociacion, { estado_avance: 'Aprobado' });
            insert('tramites', {
                Nombre_tramite: 'saldo de precio aprobado',
                fecha_inicio:   APP5T_Utils.fechaHoy(),
                id_propiedad:   Number(neg.id_propiedad) || 0,
                id_director:    idDirector === -1 ? null : (Number(idDirector) || 0),
                Estado_tramite: 'pendiente escritura con hipoteca',
                id_proceso:     'Saldo_Precio'
            });
            logAudit(dir.nombre, 'Director', 'negociaciones', 'Aprobación Saldo de Precio',
                     idNegociacion, 'Propiedad ID: ' + neg.id_propiedad);

            if (neg.cantidad_cuotas && Number(neg.cantidad_cuotas) > 0) {
                _generarCuotas(idNegociacion);
            }
        } else {
            // ── Flujo Reserva Estándar ──
            update('propiedades', neg.id_propiedad, {
                estado: 'Reservada',
                fecha_reserva: APP5T_Utils.fechaHoy()
            });
            update('negociaciones', idNegociacion, { estado_avance: 'Aprobado' });
            insert('tramites', {
                Nombre_tramite: 'pre reserva',
                fecha_inicio:   APP5T_Utils.fechaHoy(),
                id_propiedad:   Number(neg.id_propiedad) || 0,
                id_director:    idDirector === -1 ? null : (Number(idDirector) || 0),
                Estado_tramite: 'pendiente',
                id_proceso:     'Reserva'
            });
            logAudit(dir.nombre, 'Director', 'negociaciones', 'Aprobación Reserva',
                     idNegociacion, 'Propiedad ID: ' + neg.id_propiedad);
        }


        // Auto-generación inmediata de la Cuenta Corriente para cualquier negociación aprobada
        // Cuenta Corriente se genera formalmente al firmar la Promesa (firmarPromesa)

        // ── PUSH INMEDIATO A SUPABASE ──
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pushTable === 'function') {
            try {
                
                
                APP5T_Sync.pushTable('tramites');
            } catch(e) {}
        }

        return { success: true, tipo: esVentaDirecta ? 'Venta_Directa' : (esSaldoPrecio ? 'Saldo_Precio' : 'Reserva') };
    }

    // ───────────────────── AUTORIZAR PROMESA ─────────────────────

    /**
     * El Gerente autoriza que la administradora firme la promesa tras haber firmado en notaría.
     */
    function autorizarPromesa(idNegociacion) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };
        
        update('negociaciones', idNegociacion, { autorizado_promesa: true });
        return { success: true };
    }

    // ───────────────────── RECHAZAR RESERVA ─────────────────────

    /**
     * Rechaza una solicitud de reserva.
     * @param {number} idNegociacion
     * @param {string} [motivo]
     * @returns {{success:boolean, error:string}}
     */
    function rechazarReserva(idNegociacion, motivo) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        var idProp = neg.id_propiedad;

        // ── Auditoría ANTES de borrar (trazabilidad del evento) ──
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Cancelación Total de Venta',
                 idNegociacion, motivo || 'Sin motivo');

        // ── 1. Eliminar cuotas de Cuenta Corriente ──
        var cuotas = query('cuenta_corriente', function(c) {
            return String(c.id_propiedad) === String(idProp) ||
                   String(c.id_negociacion) === String(idNegociacion);
        }) || [];
        cuotas.forEach(function(c) { remove('cuenta_corriente', c.id); });

        // ── 2. Eliminar Trámites vinculados ──
        var tramitesRel = query('tramites', function(t) {
            return String(t.id_propiedad) === String(idProp) ||
                   String(t.id_negociacion) === String(idNegociacion);
        }) || [];
        tramitesRel.forEach(function(t) { remove('tramites', t.id); });

        // ── 3. Eliminar Documentos vinculados ──
        var docs = query('documentos', function(d) {
            return String(d.id_propiedad) === String(idProp) ||
                   String(d.id_negociacion) === String(idNegociacion);
        }) || [];
        docs.forEach(function(d) { remove('documentos', d.id); });

        // ── 4. Eliminar la Negociación completa ──
        remove('negociaciones', idNegociacion);

        // ── Direct Supabase Cascade Delete ──
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.deleteCascadePropiedad === 'function') {
            APP5T_Sync.deleteCascadePropiedad(idProp, idNegociacion);
        }

        // ── 5. Resetear la Propiedad a Disponible (limpiar TODOS los flags) ──
        update('propiedades', idProp, {
            estado:                   'Disponible',
            fecha_reserva:            '',
            fecha_fin_promesa:        '',
            fecha_venta:              '',
            ficha_abogado_generada:   false,
            ficha_escritura_generada: false,
            autorizado_promesa:       false,
            estado_escrituracion:     null,
            promesa_firmada:          false,
            notas:                    ''
        });

        return { success: true };
    }

    // ───────────────────── FIRMAR PROMESA ─────────────────────

    /**
     * Firma de promesa de compraventa. Genera cuotas automáticamente.
     * @param {number} idNegociacion
     * @param {Object} data — puede incluir valor_final, pie, cantidad_cuotas,
     *                         fecha_vencimiento_cuota, fecha_fin_promesa, url
     * @returns {{success:boolean, error:string}}
     */
    function firmarPromesa(idNegociacion, data) {
        data = data || {};

        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        var prop = getById('propiedades', neg.id_propiedad);

        // ── Actualizar negociación con datos nuevos ──
        var negUpdate = {
            id_proceso: 'Promesa',
            estado_avance: 'En Curso',
            tipo_operacion: 'Promesa'
        };
        if (data.valor_final !== undefined)            negUpdate.valor_final = data.valor_final;
        if (data.pie !== undefined)                    negUpdate.pie = data.pie;
        if (data.cantidad_cuotas !== undefined)         negUpdate.cantidad_cuotas = data.cantidad_cuotas;
        if (data.fecha_vencimiento_cuota !== undefined) negUpdate.fecha_vencimiento_cuota = data.fecha_vencimiento_cuota;
        if (data.fecha_promesa !== undefined)           negUpdate.fecha_promesa = data.fecha_promesa;
        if (data.url !== undefined)                    negUpdate.url = data.url;

        update('negociaciones', idNegociacion, negUpdate);

        // ── Actualizar propiedad ──
        update('propiedades', neg.id_propiedad, {
            estado: 'Promesada',
            fecha_fin_promesa: data.fecha_fin_promesa || ''
        });

        // ── Generar cuenta corriente automáticamente ──
        _autoGenerarCuentaCorriente(idNegociacion);

        // Registrar trámite de firma de promesa
        insert('tramites', {
            Nombre_tramite: 'firma de promesa',
            fecha_inicio:   data.fecha_promesa || APP5T_Utils.fechaHoy(),
            id_propiedad:   Number(neg.id_propiedad) || 0,
            id_director:    null,
            Estado_tramite: 'promesada',
            id_proceso:     'Promesa'
        });

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Firma Promesa',
                 idNegociacion, 'Propiedad: ' + (prop ? prop.nombre : neg.id_propiedad));

        // ── PUSH INMEDIATO A SUPABASE ──
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pushTable === 'function') {
            try {
                APP5T_Sync.pushTable('cuenta_corriente');
                
                
                APP5T_Sync.pushTable('tramites');
            } catch(e) {}
        }

        return { success: true };
    }

    // ───────────────────── AUTO-GENERAR CUENTA CORRIENTE ─────────────────────

    /**
     * Función interna para generar automáticamente la cuenta corriente y cuotas.
     * Se llama desde aprobarReserva y firmarPromesa.
     * Elimina cuotas existentes para evitar duplicados.
     */
    function _autoGenerarCuentaCorriente(idNegociacion) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return;
        var prop = getById('propiedades', neg.id_propiedad);
        var valFinal = Number(neg.valor_final || (prop ? prop.valor_final : 0)) || 0;
        var valPie = Number(neg.pie || neg.monto_reserva || (prop ? prop.abono : 0)) || 0;
        var montoRestante = valFinal - valPie;
        var cantCuotas = Number(neg.cantidad_cuotas) || 1;

        if (montoRestante > 0 && cantCuotas > 0) {
            // Eliminar cuotas existentes para evitar duplicados
            var existing = query('cuenta_corriente', function(c) {
                return String(c.id_cliente) === String(neg.id_cliente) && String(c.id_propiedad) === String(neg.id_propiedad);
            });
            existing.forEach(function(c) {
                remove('cuenta_corriente', c.id);
            });

            var valorCuota = Math.round(montoRestante / cantCuotas);
            var fechaBase = APP5T_Utils.parseFecha(neg.fecha_vencimiento_cuota);
            if (!fechaBase || isNaN(fechaBase.getTime())) {
                fechaBase = new Date();
                fechaBase.setMonth(fechaBase.getMonth() + 1);
            }

            for (var i = 0; i < cantCuotas; i++) {
                var fechaVenc = new Date(fechaBase.getTime());
                fechaVenc.setMonth(fechaVenc.getMonth() + i);

                insert('cuenta_corriente', {
                    id_cliente:        neg.id_cliente,
                    id_propiedad:      neg.id_propiedad,
                    cuota_nro:         i + 1,
                    valor_cuota:       valorCuota,
                    fecha_vencimiento: APP5T_Utils.formatFecha(fechaVenc),
                    valor_pagado:      0,
                    fecha_pago:        '',
                    url:               '',
                    estado_cuota:      'Pendiente Pago'
                });
            }

            // Push inmediato a Supabase
            if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pushTable === 'function') {
                try {
                    APP5T_Sync.pushTable('cuenta_corriente');
                    
                    
                } catch(e) {}
            }
        }
    }

    // ───────────────────── ACTIVAR CUENTA CORRIENTE ─────────────────────

    /**
     * Activa la cuenta corriente generando las cuotas para una negociación.
     * @param {number} idNegociacion
     * @param {Object} data — cantidad_cuotas, fecha_vencimiento_cuota, valor_final, pie
     * @returns {{success:boolean, error:string}}
     */
    function activarCuentaCorriente(idNegociacion, data) {
        data = data || {};
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        var prop = getById('propiedades', neg.id_propiedad);
        if (!prop || !['Promesada', 'Venta_Directa', 'Vendida', 'Escriturada'].includes(prop.estado)) {
            return { success: false, error: 'La Cuenta Corriente solo se puede activar/regenerar para propiedades en Promesa, Venta Directa, Vendida o Escriturada.' };
        }

        // Actualizar la negociación con los datos de cuotas si se proporcionan
        var negUpdate = {};
        if (data.valor_final !== undefined)            negUpdate.valor_final = Number(data.valor_final);
        if (data.pie !== undefined)                    negUpdate.pie = Number(data.pie);
        if (data.cantidad_cuotas !== undefined)         negUpdate.cantidad_cuotas = Number(data.cantidad_cuotas);
        if (data.fecha_vencimiento_cuota !== undefined) negUpdate.fecha_vencimiento_cuota = data.fecha_vencimiento_cuota;
        
        update('negociaciones', idNegociacion, negUpdate);
        var updatedNeg = getById('negociaciones', idNegociacion);

        // Eliminar cuotas existentes si las hubiera para evitar duplicados
        var existing = query('cuenta_corriente', function(c) {
            return String(c.id_cliente) === String(updatedNeg.id_cliente) && String(c.id_propiedad) === String(updatedNeg.id_propiedad);
        });
        existing.forEach(function(c) {
            remove('cuenta_corriente', c.id);
        });

        var montoRestante = (updatedNeg.valor_final || 0) - (updatedNeg.pie || 0);
        var cantCuotas = updatedNeg.cantidad_cuotas || 0;

        if (cantCuotas > 0 && montoRestante > 0) {
            var valorCuota = Math.round(montoRestante / cantCuotas);
            var fechaBase = APP5T_Utils.parseFecha(updatedNeg.fecha_vencimiento_cuota) || new Date();

            for (var i = 0; i < cantCuotas; i++) {
                var fechaVenc = new Date(fechaBase.getTime());
                fechaVenc.setMonth(fechaVenc.getMonth() + i);

                insert('cuenta_corriente', {
                    id_cliente:        updatedNeg.id_cliente,
                    id_propiedad:      updatedNeg.id_propiedad,
                    cuota_nro:         i + 1,
                    valor_cuota:       valorCuota,
                    fecha_vencimiento: APP5T_Utils.formatFecha(fechaVenc),
                    valor_pagado:      0,
                    fecha_pago:        '',
                    url:               '',
                    estado_cuota:      'Pendiente Pago'
                });
            }
        } else {
            return { success: false, error: 'Cantidad de cuotas o monto restante no válido para generar cuenta corriente.' };
        }

        // Auditoría
        var prop = getById('propiedades', updatedNeg.id_propiedad);
        var cli = getById('clientes', updatedNeg.id_cliente);
        var cliNom = cli ? cli.nombres + ' ' + cli.apellidos : 'ID: ' + updatedNeg.id_cliente;
        logAudit('Sistema', 'Sistema', 'cuenta_corriente', 'Activar Cuenta Corriente',
                 idNegociacion, 'Cliente: ' + cliNom + ', Propiedad: ' + (prop ? prop.nombre : updatedNeg.id_propiedad));

        return { success: true };
    }

    // ───────────────────── FIRMAR ESCRITURA ─────────────────────

    /**
     * Cierra la venta: firma de escritura definitiva (desde flujo Promesada).
     * @param {number} idNegociacion
     * @param {Object} [data]
     * @returns {{success:boolean, error:string}}
     */
    function firmarEscritura(idNegociacion, data) {
        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        data = data || {};

        // Propiedad → Vendida
        update('propiedades', neg.id_propiedad, {
            estado: 'Vendida',
            fecha_venta: data.fecha_escritura || data.fecha_venta || APP5T_Utils.fechaHoy()
        });

        // Negociación → Venta / Finalizado
        update('negociaciones', idNegociacion, {
            id_proceso: 'Venta',
            estado_avance: 'Finalizado',
            tipo_operacion: 'Venta'
        });

        // Registrar trámite de firma de escritura
        console.log('APP5T_DB.firmarEscritura: Insertando trámite con Nombre_tramite = "firma de escritura" para propiedad', neg.id_propiedad);
        insert('tramites', {
            Nombre_tramite: 'firma de escritura',
            fecha_inicio:   data.fecha_escritura || data.fecha_venta || APP5T_Utils.fechaHoy(),
            id_propiedad:   Number(neg.id_propiedad) || 0,
            id_director:    null,
            Estado_tramite: 'completado',
            id_proceso:     'Venta'
        });
        console.log('APP5T_DB.firmarEscritura: Trámite "firma de escritura" insertado correctamente.');

        // Auditoría
        logAudit('Sistema', 'Sistema', 'negociaciones', 'Firma Escritura',
                 idNegociacion, 'Venta finalizada');

        return { success: true };
    }

    // ───────────────────── FIRMAR ESCRITURA DIRECTA (VENTA DIRECTA) ─────────────────────

    /**
     * Cierra la venta directa: firma de escritura sin pasar por Reserva ni Promesa.
     * Genera un único registro de pago en cuenta corriente por el valor total de la venta.
     * @param {number} idNegociacion
     * @param {Object} [data] — fecha_escritura, url_escritura, cbr, metodo_pago
     * @returns {{success:boolean, error:string}}
     */
    function firmarEscrituraDirecta(idNegociacion, data) {
        data = data || {};

        var neg = getById('negociaciones', idNegociacion);
        if (!neg) return { success: false, error: 'Negociación no encontrada' };

        if (neg.id_proceso !== 'Venta_Directa') {
            return { success: false, error: 'Esta negociación no es de tipo Venta Directa' };
        }
        if (neg.estado_avance !== 'Aprobado') {
            return { success: false, error: 'La Venta Directa debe estar aprobada antes de escriturar' };
        }

        var hoy = data.fecha_escritura || APP5T_Utils.fechaHoy();
        var valorTotal = neg.valor_final || 0;
        var metodoPago = data.metodo_pago || 'Transferencia';

        // Propiedad → Vendida directamente
        update('propiedades', neg.id_propiedad, {
            estado: 'Vendida',
            fecha_venta: hoy
        });

        // Negociación → Finalizada
        update('negociaciones', idNegociacion, {
            id_proceso:    'Venta',
            estado_avance: 'Finalizado',
            url:           data.url_escritura || ''
        });

        // Cuenta corriente: un único pago por el total de la venta, marcado como Pagada
        insert('cuenta_corriente', {
            id_cliente:        neg.id_cliente,
            id_propiedad:      neg.id_propiedad,
            cuota_nro:         1,
            valor_cuota:       valorTotal,
            fecha_vencimiento: hoy,
            valor_pagado:      valorTotal,
            fecha_pago:        hoy,
            url:               data.url_escritura || '',
            estado_cuota:      'Pagada',
            metodo_pago:       metodoPago
        });

        // Trámite de cierre
        insert('tramites', {
            Nombre_tramite: 'firma de escritura',
            fecha_inicio:   hoy,
            id_propiedad:   Number(neg.id_propiedad) || 0,
            id_director:    null,
            Estado_tramite: 'completado',
            id_proceso:     'Venta_Directa'
        });

        // Auditoría
        var prop = getById('propiedades', neg.id_propiedad);
        logAudit('Sistema', 'Administracion', 'negociaciones', 'Firma Escritura Directa',
                 idNegociacion,
                 'Propiedad: ' + (prop ? prop.nombre : neg.id_propiedad) +
                 ' | Valor: ' + APP5T_Utils.formatMoney(valorTotal) +
                 ' | CBR: ' + (data.cbr || 'No registrado'));

        return { success: true };
    }

    // ───────────────────── REGISTRAR PAGO ─────────────────────

    /**
     * Registra un pago parcial o total sobre una cuota.
     * @param {number} idCtaCte
     * @param {*}      valorPagado    — monto (cualquier formato)
     * @param {string} fechaPago      — dd/mm/aaaa
     * @param {string} [urlComprobante]
     * @param {string} [metodoPago]
     * @returns {{success:boolean, error:string}}
     */
    function registrarPago(idCtaCte, valorPagado, fechaPago, urlComprobante, metodoPago) {
        var cuota = getById('cuenta_corriente', idCtaCte);
        if (!cuota) return { success: false, error: 'Cuota no encontrada' };

        valorPagado = APP5T_Utils.sanitizeNumber(valorPagado);

        var estadoCuota = 'Pendiente Pago';
        if (valorPagado >= cuota.valor_cuota) {
            estadoCuota = 'Pagada';
        } else if (valorPagado > 0) {
            estadoCuota = 'Abonada';
        }

        update('cuenta_corriente', idCtaCte, {
            valor_pagado: valorPagado,
            fecha_pago:   fechaPago,
            url:          urlComprobante || '',
            metodo_pago:  metodoPago || 'Transferencia',
            estado_cuota: estadoCuota
        });

        logAudit('Sistema', 'Sistema', 'cuenta_corriente', 'Registro Pago',
                 idCtaCte, 'Monto: ' + valorPagado + ' via ' + (metodoPago || 'Transferencia'));

        var triggeringEscrituracion = false;
        var todasCuotas = _load('cuenta_corriente').filter(function(c) {
            return String(c.id_cliente) === String(cuota.id_cliente) && String(c.id_propiedad) === String(cuota.id_propiedad);
        });
        
        var todasPagadas = true;
        for (var i = 0; i < todasCuotas.length; i++) {
            if (todasCuotas[i].estado_cuota !== 'Pagada' && !String(todasCuotas[i].estado_cuota).includes('Anulada')) {
                todasPagadas = false;
                break;
            }
        }

        if (todasPagadas && todasCuotas.length > 0) {
            var negs = _load('negociaciones').filter(function(n) {
                return String(n.id_cliente) === String(cuota.id_cliente) && String(n.id_propiedad) === String(cuota.id_propiedad);
            });
            if (negs.length > 0) {
                var n = negs[0];
                var n_notas = n.notas || '';
                if (!n_notas.includes('[AUTORIZADO_ESCRITURAR:PENDIENTE]') && !n_notas.includes('[AUTORIZADO_ESCRITURAR:TRUE]')) {
                    n.notas = (n_notas ? n_notas + ' ' : '') + '[AUTORIZADO_ESCRITURAR:PENDIENTE]';
                    update('negociaciones', n.id, n);
                    triggeringEscrituracion = true;
                }
            }
        }

        return { success: true, triggeringEscrituracion: triggeringEscrituracion, cuota: cuota };
    }

    // ═══════════════════════════════════════════════════════
    //  ESTADÍSTICAS
    // ═══════════════════════════════════════════════════════

    /**
     * Retorna un objeto completo de estadísticas del sistema.
     * @returns {Object}
     */
        function getStats(idProyecto = 'all') {
        var props  = _load('propiedades');
        var cuotas = _load('cuenta_corriente');
        var proyectos = _load('proyectos');

        if (idProyecto && idProyecto !== 'all') {
            props = props.filter(p => String(p.id_proyecto) === String(idProyecto));
            var validPropIds = props.map(p => String(p.id));
            cuotas = cuotas.filter(c => validPropIds.includes(String(c.id_propiedad)));
        }

        var stats = {
            totales:             props.length,
            disponibles:         0,
            pendientes:          0,
            reservadas:          0,
            promesadas:          0,
            ventaDirecta:        0,
            vendidas:            0,
            ingresoRecaudado:    0,
            ingresoComprometido: 0,
            ingresoProyectado:   0,
            ingresoTotal:        0,
            montoReservadas:     0,
            montoPromesadas:     0,
            montoVendidas:       0,
            perProject:          {},
            cuotasPendientes:    0,
            cuotasPagadas:       0,
            cuotasAbonadas:      0,
            montoRecaudadoCuotas:0,
            montoPendienteCuotas:0
        };

        // ── Conteo por estado de propiedades ──
        for (var i = 0; i < props.length; i++) {
            var p = props[i];
            var val = p.valor_final || 0;

            switch (p.estado) {
                case 'Disponible':
                    stats.disponibles++;
                    break;
                case 'Pendiente':
                    stats.pendientes++;
                    stats.ingresoProyectado += val;
                    break;
                case 'Reservada':
                    stats.reservadas++;
                    stats.ingresoProyectado += val;
                    stats.montoReservadas += val;
                    break;
                case 'Promesada':
                    stats.promesadas++;
                    stats.ingresoComprometido += val;
                    stats.montoPromesadas += val;
                    break;
                case 'Venta_Directa':
                    stats.ventaDirecta++;
                    stats.ingresoComprometido += val;
                    break;
                case 'Vendida':
                    stats.vendidas++;
                    stats.ingresoRecaudado += val;
                    stats.montoVendidas += val;
                    break;
            }
        }

        stats.ingresoTotal = stats.ingresoRecaudado
                           + stats.ingresoComprometido
                           + stats.ingresoProyectado;

        // ── Desglose por proyecto ──
        for (var pi = 0; pi < proyectos.length; pi++) {
            var proy = proyectos[pi];
            var projStats = {
                disponibles: 0, pendientes: 0, reservadas: 0,
                promesadas: 0, vendidas: 0, total: 0, monto: 0
            };

            for (var j = 0; j < props.length; j++) {
                if (props[j].id_proyecto === proy.id) {
                    projStats.total++;
                    projStats.monto += (props[j].valor_final || 0);

                    switch (props[j].estado) {
                        case 'Disponible': projStats.disponibles++; break;
                        case 'Pendiente':  projStats.pendientes++;  break;
                        case 'Reservada':  projStats.reservadas++;  break;
                        case 'Promesada':  projStats.promesadas++;  break;
                        case 'Vendida':    projStats.vendidas++;    break;
                    }
                }
            }

            stats.perProject[proy.nombre] = projStats;
        }

        // ── Cuotas ──
        for (var ci = 0; ci < cuotas.length; ci++) {
            var c = cuotas[ci];
            switch (c.estado_cuota) {
                case 'Pendiente Pago':
                    stats.cuotasPendientes++;
                    stats.montoPendienteCuotas += (c.valor_cuota || 0);
                    break;
                case 'Pagada':
                    stats.cuotasPagadas++;
                    stats.montoRecaudadoCuotas += (c.valor_pagado || 0);
                    break;
                case 'Abonada':
                    stats.cuotasAbonadas++;
                    stats.montoRecaudadoCuotas += (c.valor_pagado || 0);
                    stats.montoPendienteCuotas += ((c.valor_cuota || 0) - (c.valor_pagado || 0));
                    break;
            }
        }

        return stats;
    }

    // ═══════════════════════════════════════════════════════
    //  AUDITORÍA
    // ═══════════════════════════════════════════════════════

    /**
     * Registra una entrada de auditoría (se inserta al inicio, cap 1000).
     * @param {string} usuario
     * @param {string} rol
     * @param {string} tabla
     * @param {string} accion
     * @param {number} registroId
     * @param {string} detalle
     */
    function logAudit(usuario, rol, tabla, accion, registroId, detalle) {
        var audits = _load('auditoria');

        audits.unshift({
            id:          APP5T_Utils.generarId(audits),
            fecha:       new Date().toISOString(),
            usuario:     usuario || 'Sistema',
            rol:         rol || 'Sistema',
            tabla:       tabla,
            accion:      accion,
            registro_id: registroId,
            detalle:     detalle || ''
        });

        // Limitar a 1000 registros
        if (audits.length > 1000) {
            audits = audits.slice(0, 1000);
        }

        _save('auditoria', audits);
    }

    /**
     * Retorna el log de auditoría completo.
     * @returns {Array}
     */
    
    /**
     * Resetea un lote a 'Disponible' y elimina todas sus negociaciones, cuotas, documentos y trámites de prueba.
     * @param {string} nombreProyecto - Ej. 'El Copihue'
     * @param {string} nroLote - Ej. '25'
     */
    function limpiarLote(nombreProyecto, nroLote) {
        var proys = getAll('proyectos') || [];
        var proy = proys.find(function(p) { 
            var nm = (p.nombre || p.nombre_proyecto || '').toLowerCase();
            return nm.indexOf(nombreProyecto.toLowerCase()) !== -1;
        });
        if (!proy) return { success: false, error: 'Proyecto no encontrado: ' + nombreProyecto };

        var props = getAll('propiedades') || [];
        var prop = props.find(function(p) { 
            var matchesProy = String(p.id_proyecto) === String(proy.id);
            var nm = String(p.nombre || p.nombre_lote || '').toLowerCase();
            var target = String(nroLote).toLowerCase();
            return matchesProy && (nm === target || nm === 'lote ' + target);
        });

        if (!prop) return { success: false, error: 'Lote no encontrado: ' + nroLote + ' en ' + nombreProyecto };

        var propId = prop.id;
        var summary = {
            lote: prop.nombre || nroLote,
            proyecto: proy.nombre_proyecto || proy.nombre,
            id_propiedad: propId,
            negociaciones: [],
            cuenta_corriente: [],
            documentos: [],
            tramites: []
        };

        // 1. Eliminar negociaciones del lote
        var negs = getAll('negociaciones') || [];
        negs.filter(function(n) { return String(n.id_propiedad) === String(propId); })
            .forEach(function(n) {
                remove('negociaciones', n.id);
                summary.negociaciones.push(n.id);
            });

        // 2. Eliminar cuotas del lote
        var cuotas = getAll('cuenta_corriente') || [];
        cuotas.filter(function(c) { return String(c.id_propiedad) === String(propId); })
            .forEach(function(c) {
                remove('cuenta_corriente', c.id);
                summary.cuenta_corriente.push(c.id);
            });

        // 3. Eliminar documentos del lote
        var docs = getAll('documentos') || [];
        docs.filter(function(d) { return String(d.id_propiedad) === String(propId); })
            .forEach(function(d) {
                remove('documentos', d.id);
                summary.documentos.push(d.id);
            });

        // 4. Eliminar trámites del lote
        var tramites = getAll('tramites') || [];
        tramites.filter(function(t) { return String(t.id_propiedad) === String(propId); })
            .forEach(function(t) {
                remove('tramites', t.id);
                summary.tramites.push(t.id);
            });

        // 5. Restablecer estado a 'Disponible'
        update('propiedades', propId, {
            estado: 'Disponible',
            abono: 0,
            fecha_reserva: '',
            fecha_fin_promesa: '',
            fecha_venta: '',
            id_cliente: null,
            id_vendedor: null
        });

        // Auditoría
        logAudit(_getActiveUser(), _getActiveRole(), 'propiedades', 'Limpiar Lote Prueba', propId, 
            'Lote ' + nroLote + ' reseteado a Disponible. Registros eliminados: Negociaciones(' + 
            summary.negociaciones.length + '), Cuotas(' + summary.cuenta_corriente.length + '), Documentos(' + 
            summary.documentos.length + '), Trámites(' + summary.tramites.length + ')');

        return { success: true, summary: summary };
    }

    function getAuditoria() {
        return _load('auditoria');
    }

    // ═══════════════════════════════════════════════════════
    
    function limpiarLotePorId(idPropOrNombre) {
        var props = getAll('propiedades') || [];
        var prop = props.find(function(p) {
            return String(p.id) === String(idPropOrNombre) || 
                   String(p.nombre || '').toLowerCase() === String(idPropOrNombre).toLowerCase() ||
                   String(p.nombre || '').toLowerCase() === 'lote ' + String(idPropOrNombre).toLowerCase();
        });

        if (!prop) return { success: false, error: 'Propiedad o Lote no encontrado: ' + idPropOrNombre };

        var propId = prop.id;
        var summary = {
            lote: prop.nombre,
            id_propiedad: propId,
            negociaciones: [],
            cuenta_corriente: [],
            documentos: [],
            tramites: []
        };

        // 1. Eliminar negociaciones asociadas
        var negs = getAll('negociaciones') || [];
        negs.filter(function(n) { return String(n.id_propiedad) === String(propId); })
            .forEach(function(n) {
                remove('negociaciones', n.id);
                summary.negociaciones.push(n.id);
            });

        // 2. Eliminar cuotas y movimientos de cuenta corriente asociados
        var cuotas = getAll('cuenta_corriente') || [];
        cuotas.filter(function(c) { return String(c.id_propiedad) === String(propId); })
            .forEach(function(c) {
                remove('cuenta_corriente', c.id);
                summary.cuenta_corriente.push(c.id);
            });

        // 3. Eliminar documentos asociados
        var docs = getAll('documentos') || [];
        docs.filter(function(d) { return String(d.id_propiedad) === String(propId); })
            .forEach(function(d) {
                remove('documentos', d.id);
                summary.documentos.push(d.id);
            });

        // 4. Eliminar trámites asociados
        var tramites = getAll('tramites') || [];
        tramites.filter(function(t) { return String(t.id_propiedad) === String(propId); })
            .forEach(function(t) {
                remove('tramites', t.id);
                summary.tramites.push(t.id);
            });

        // 5. Restablecer la propiedad a Disponible
        update('propiedades', propId, {
            estado: 'Disponible',
            abono: 0,
            fecha_reserva: '',
            fecha_fin_promesa: '',
            fecha_venta: '',
            id_cliente: null,
            id_vendedor: null,
            ficha_abogado_generada: false,
            ficha_escritura_generada: false
        });

        logAudit(_getActiveUser(), _getActiveRole(), 'propiedades', 'Limpiar Lote', propId,
            'Lote ' + prop.nombre + ' reseteado a Disponible manteniendo la integridad de la base de datos.');

        return { success: true, summary: summary };
    }

    //  API PÚBLICA
    // ═══════════════════════════════════════════════════════


    /**
     * Revierte una venta/promesa y devuelve el lote a estado 'Disponible'.
     * Ejecuta una cascada transaccional completa:
     * - Elimina cuotas de cuenta_corriente
     * - Elimina trámites vinculados
     * - Elimina/cancela negociaciones vinculadas
     * - Ejecuta soft-delete en Supabase (APP5T_Sync.deleteCascadePropiedad)
     * - Restablece la propiedad a 'Disponible' limpiando todos los campos comerciales
     * - Registra el evento en audit_log
     * @param {number|string} idPropOrNombre
     * @param {string} [motivo]
     * @returns {{success:boolean, error?:string, lote?:string}}
     */
    function revertirVentaLote(idPropOrNombre, motivo) {
        var props = getAll('propiedades') || [];
        var prop = props.find(function(p) {
            return String(p.id) === String(idPropOrNombre) || 
                   String(p.nombre || '').toLowerCase() === String(idPropOrNombre).toLowerCase() ||
                   String(p.nombre || '').toLowerCase() === 'lote ' + String(idPropOrNombre).toLowerCase();
        });

        if (!prop) return { success: false, error: 'Propiedad o Lote no encontrado: ' + idPropOrNombre };

        var propId = prop.id;
        motivo = motivo || 'Reversión administrativa / anulación de venta por Gerencia';
        var activeUser = _getActiveUser() || 'Gerente';
        var activeRole = _getActiveRole() || 'gerente';

        // 1. Auditoría forense antes de limpiar
        logAudit(activeUser, activeRole, 'propiedades', 'Reversión Total de Venta', propId,
            'Lote ' + prop.nombre + ' revertido a Disponible. Motivo: ' + motivo);

        // 2. Eliminar negociaciones asociadas y notificar Supabase
        var negs = getAll('negociaciones') || [];
        var negsLote = negs.filter(function(n) { return String(n.id_propiedad) === String(propId); });
        negsLote.forEach(function(n) {
            remove('negociaciones', n.id);
            if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.deleteCascadePropiedad === 'function') {
                APP5T_Sync.deleteCascadePropiedad(propId, n.id);
            }
        });
        if (negsLote.length === 0 && typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.deleteCascadePropiedad === 'function') {
            APP5T_Sync.deleteCascadePropiedad(propId, null);
        }

        // 3. Eliminar cuotas y movimientos de cuenta corriente asociados
        var cuotas = getAll('cuenta_corriente') || [];
        cuotas.filter(function(c) { return String(c.id_propiedad) === String(propId); })
            .forEach(function(c) {
                remove('cuenta_corriente', c.id);
            });

        // 4. Eliminar documentos asociados
        var docs = getAll('documentos') || [];
        docs.filter(function(d) { return String(d.id_propiedad) === String(propId); })
            .forEach(function(d) {
                remove('documentos', d.id);
            });

        // 5. Eliminar trámites asociados
        var tramites = getAll('tramites') || [];
        tramites.filter(function(t) { return String(t.id_propiedad) === String(propId); })
            .forEach(function(t) {
                remove('tramites', t.id);
            });

        // 6. Restablecer completamente la propiedad a Disponible
        update('propiedades', propId, {
            estado: 'Disponible',
            abono: 0,
            fecha_reserva: '',
            fecha_fin_promesa: '',
            fecha_venta: '',
            id_cliente: null,
            id_vendedor: null,
            ficha_abogado_generada: false,
            ficha_escritura_generada: false,
            autorizado_promesa: false,
            estado_escrituracion: null,
            promesa_firmada: false,
            notas: '',
            comprador: null
        });

        // 7. Sincronizar en la nube
        if (typeof APP5T_Sync !== 'undefined' && typeof APP5T_Sync.pushTable === 'function') {
            try {
                APP5T_Sync.pushTable('propiedades');
                APP5T_Sync.pushTable('cuenta_corriente');
                APP5T_Sync.pushTable('tramites');
                APP5T_Sync.pushTable('negociaciones');
            } catch(e) {}
        }

        return { success: true, lote: prop.nombre };
    }

    return {
        // Inicialización
        init:               init,

        // CRUD genérico
        getAll:             getAll,
        getById:            getById,
        insert:             insert,
        update:             update,
        remove:             remove,
        query:              query,
        count:              count,

        // Workflows
        solicitarReserva:      solicitarReserva,
        aprobarReserva:        aprobarReserva,
        rechazarReserva:       rechazarReserva,
        revertirVentaLote:     revertirVentaLote,
        autorizarPromesa:      autorizarPromesa,
        firmarPromesa:         firmarPromesa,
        firmarEscritura:       firmarEscritura,
        firmarEscrituraDirecta: firmarEscrituraDirecta,
        registrarPago:         registrarPago,
        activarCuentaCorriente: activarCuentaCorriente,

        // Estadísticas
        getStats:           getStats,

        // Auditoría
        logAudit:           logAudit,
        limpiarLote:         limpiarLote,
        limpiarLotePorId:    limpiarLotePorId,
        getAuditoria:       getAuditoria
    };

})();
