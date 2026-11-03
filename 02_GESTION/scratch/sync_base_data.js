import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://script.google.com/macros/s/AKfycbzUpfUtaSaN3TZr_bbsa8W1mee9-kY7S6VZPDoP9xmZ3DS2PyczU5KZlHPGCuB00wIbvw/exec';

// Helper functions from utils.js
function sanitizeNumber(val) {
    if (typeof val === 'number') return Math.round(val);
    if (!val) return 0;
    const clean = String(val).replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
}

function normalizarEstado(estado) {
    if (!estado) return 'Disponible';
    const lower = String(estado).trim().toLowerCase();
    if (lower === 'vendida') return 'Vendida';
    if (lower === 'reservada') return 'Reservada';
    return 'Disponible';
}

function parsearSuperficie(str) {
    if (typeof str === 'number') return Math.round(str);
    if (!str) return 0;
    const clean = String(str).replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
}

function fechaHoy() {
    const d = new Date();
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// _procesarGeoJSON
function procesarGeoJSON(geojson, idProyecto, idEtapa, precioDefault, startId) {
    if (!geojson || !geojson.features) return [];

    const propiedades = [];
    let propId = startId;
    const hoy = fechaHoy();

    for (let i = 0; i < geojson.features.length; i++) {
        const feat = geojson.features[i];
        const props = feat.properties || {};

        const nombre = props.Lote || props.nombre || ('Lote ' + (i + 1));
        const supRaw = props.Area || props.Hectareas || props.Superficie || 0;
        const superficie = parsearSuperficie(supRaw);

        const precioRaw = props.Precio;
        let valorFinal = precioRaw ? sanitizeNumber(precioRaw) : 0;
        if (!valorFinal) valorFinal = precioDefault;

        const estado = normalizarEstado(props.Estado);
        const coordenadas = feat.geometry || null;

        propiedades.push({
            id:               propId++,
            id_etapa:         idEtapa,
            id_proyecto:      idProyecto,
            nombre:           nombre,
            rol:              '',
            superficie:       superficie,
            coordenadas:      coordenadas,
            valor_final:      valorFinal,
            fecha_ingreso:    hoy,
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

// Load and parse GeoJSON layer file
function loadGeoJSONLayer(varName, filePath) {
    console.log(`Loading layer file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
        throw new Error(`Invalid GeoJSON file content: ${filePath}`);
    }
    const jsonStr = content.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
}

async function main() {
    const hoy = fechaHoy();

    // 1. Projects
    const proyectos = [
        {
            id: 1, nombre_proyecto: 'El Copihue', nombre: 'El Copihue', ubicacion: 'Sector Copihue',
            comuna: 'Chillán', coordenadas_centro: { lat: -36.120, lng: -71.776 },
            superficie: 0, rol: '', deslindes: '', infraestructura: '',
            caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
            estado_proyecto: 'Activo', nro_etapas: 1, url: ''
        },
        {
            id: 2, nombre_proyecto: 'Las Brisas', nombre: 'Las Brisas', ubicacion: 'Sector Las Brisas',
            comuna: 'Chillán', coordenadas_centro: { lat: -36.385, lng: -71.953 },
            superficie: 0, rol: '', deslindes: '', infraestructura: '',
            caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
            estado_proyecto: 'Activo', nro_etapas: 1, url: ''
        },
        {
            id: 3, nombre_proyecto: 'Los Encinos', nombre: 'Los Encinos', ubicacion: 'Sector Los Encinos',
            comuna: 'Chillán', coordenadas_centro: { lat: -36.468, lng: -71.842 },
            superficie: 0, rol: '', deslindes: '', infraestructura: '',
            caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
            estado_proyecto: 'Activo', nro_etapas: 1, url: ''
        },
        {
            id: 4, nombre_proyecto: 'Los Naranjos', nombre: 'Los Naranjos', ubicacion: 'Sector Los Naranjos',
            comuna: 'Chillán', coordenadas_centro: { lat: -36.478, lng: -71.838 },
            superficie: 0, rol: '', deslindes: '', infraestructura: '',
            caracteristicas: '', fecha_dom: '', fecha_ingreso: hoy,
            estado_proyecto: 'Activo', nro_etapas: 1, url: ''
        }
    ];

    // 2. Stages
    const etapas = [
        { id: 1, id_proyecto: 1, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
        { id: 2, id_proyecto: 2, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
        { id: 3, id_proyecto: 3, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' },
        { id: 4, id_proyecto: 4, nombre_etapa: 'Etapa 1', nombre: 'Etapa 1', nro_lotes: 0, superficie: 0, fecha_ingreso: hoy, fecha_dom: '', estado_etapa: 'Activa', fecha_inicio: '', fecha_cierre: '', url: '' }
    ];

    // 3. Properties (Lotes) from GeoJSON files
    const layerDir = path.join(__dirname, '..', '..', '03_CORAZON', 'layers');
    const geoSources = [
        { file: 'copihue_master.js',  varName: 'json_copihue_lotes',  idProy: 1, idEtapa: 1, defaultPrice: 33000000 },
        { file: 'brisas_master.js',   varName: 'json_brisas_lotes',   idProy: 2, idEtapa: 2, defaultPrice: 18000000 },
        { file: 'encinos_master.js',  varName: 'json_encinos_lotes',  idProy: 3, idEtapa: 3, defaultPrice: 33000000 },
        { file: 'naranjos_master.js', varName: 'json_naranjos_lotes', idProy: 4, idEtapa: 4, defaultPrice: 18000000 }
    ];

    let allProps = [];
    let nextId = 1;

    for (const src of geoSources) {
        const filePath = path.join(layerDir, src.file);
        const geojson = loadGeoJSONLayer(src.varName, filePath);
        const properties = procesarGeoJSON(geojson, src.idProy, src.idEtapa, src.defaultPrice, nextId);
        nextId += properties.length;
        allProps = allProps.concat(properties);
    }

    // Update Stage lot counts
    etapas.forEach(et => {
        et.nro_lotes = allProps.filter(p => p.id_etapa === et.id).length;
    });

    console.log(`Generated Clean Dataset:`);
    console.log(`- Projects: ${proyectos.length}`);
    console.log(`- Stages: ${etapas.length}`);
    console.log(`- Properties: ${allProps.length}`);

    // Map fields according to sync.js schema to match Google Sheets Columns
    const mappingProyectos = rec => ({
        id_proyecto:        rec.id,
        nombre_proyecto:    rec.nombre_proyecto,
        ubicacion:          rec.ubicacion,
        comuna:             rec.comuna,
        coordenadas_centro: JSON.stringify(rec.coordenadas_centro),
        superficie:         rec.superficie,
        rol:                rec.rol,
        deslindes:          rec.deslindes,
        infraestructura:    rec.infraestructura,
        caracteristicas:    rec.caracteristicas,
        fecha_dom:          rec.fecha_dom,
        fecha_ingreso:      rec.fecha_ingreso,
        estado_proyecto:    rec.estado_proyecto,
        nro_etapas:         rec.nro_etapas,
        url:                rec.url
    });

    const mappingEtapas = rec => ({
        id_etapa:      rec.id,
        id_proyecto:   rec.id_proyecto,
        nombre_etapa:  rec.nombre_etapa,
        nro_lotes:     rec.nro_lotes,
        superficie:    rec.superficie,
        fecha_ingreso: rec.fecha_ingreso,
        fecha_dom:     rec.fecha_dom,
        estado_etapa:  rec.estado_etapa,
        fecha_inicio:  rec.fecha_inicio,
        fecha_cierre:  rec.fecha_cierre,
        url:           rec.url
    });

    const mappingPropiedades = rec => ({
        id_propiedad:      rec.id,
        id_etapa:          rec.id_etapa,
        nombre:            rec.nombre,
        rol:               rec.rol,
        superficie:        rec.superficie,
        valor_final:       rec.valor_final,
        abono:             rec.abono || 0,
        fecha_ingreso:     rec.fecha_ingreso,
        deslindes:         rec.deslindes,
        infraestructura:   rec.infraestructura,
        fecha_reserva:     rec.fecha_reserva,
        fecha_fin_promesa: rec.fecha_fin_promesa,
        fecha_venta:       rec.fecha_venta,
        url:               rec.url,
        estado:            rec.estado,
        coordenadas:       JSON.stringify(rec.coordenadas)
    });

    const payload = {
        action: 'syncall',
        datos: {
            Proyectos: proyectos.map(mappingProyectos),
            Etapas: etapas.map(mappingEtapas),
            Propiedades: allProps.map(mappingPropiedades)
        },
        usuario: 'Consola Antigravity (Opción B)'
    };

    console.log('Pushing clean base data to Google Sheets...');
    const resp = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    });

    const result = await resp.json();
    console.log('Result:', JSON.stringify(result, null, 2));
}

main();
