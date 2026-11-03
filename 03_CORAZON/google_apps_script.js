/**
 * =====================================================
 * CODIGO.GS — APP_5T Backend Exclusivo
 * CRM & GIS Unificado — 5 Tierras
 * =====================================================
 * 
 * VINCULADO A LA PLANILLA:
 * https://docs.google.com/spreadsheets/d/1LidejaAu8P8ERSgAiJP0uQT9SaLQXRT2gFBHRq_VClE/edit
 * 
 * INSTRUCCIONES:
 * 1. Abrir la planilla de Google Sheets vinculada arriba.
 * 2. Ir a Extensiones → Apps Script.
 * 3. Pegar TODO este código en Código.gs (reemplazando cualquier contenido previo).
 * 4. Ejecutar la función inicializarHojas() UNA VEZ en el editor de script para crear las tablas.
 * 5. Hacer clic en Implementar → Nueva implementación → Seleccionar tipo: App web.
 *    - Ejecutar como: Yo (tu_correo@gmail.com)
 *    - Acceso: Cualquier persona (Anyone)
 * 6. Copiar la "URL de la aplicación web" generada (ej. https://script.google.com/macros/s/.../exec).
 * 7. Reemplazar esa URL en la constante APPS_SCRIPT_URL dentro de 02_GESTION/index.html.
 * =====================================================
 */

// ══════════════════════════════════════════════════════
// CONFIGURACIÓN DE TABLAS
// ══════════════════════════════════════════════════════

const TABLAS = {
  "00_Usuarios": [
    'RUT_Usuario', 'Nombre', 'Contraseña_Hash', 'Rol', 'Estado'
  ],
  "00_Gobernanza_Permisos": [
    'ID_Permiso', 'Componente_Modulo', 'Descripcion', 'Acceso_Vendedor', 'Acceso_Gerencia', 'Acceso_Administracion'
  ],
  // ─── Tablas de negocio ── nombres alineados con db.js / forms.js (snake_case) ───
  Vendedores: [
    'id_vendedor', 'rut', 'nombre', 'fecha_ingreso',
    'ciudad', 'telefono', 'email', 'cargo', 'estado'
  ],
  Clientes: [
    'id_cliente', 'rut', 'nombres', 'apellidos', 'fecha_nacimiento',
    'direccion', 'comuna', 'telefono', 'email', 'estado_civil',
    'regimen_matrimonial', 'fecha_ingreso', 'canal_captacion', 'id_vendedor',
    'motivo_busqueda', 'notas', 'historial', 'estado_cliente'
  ],
  Proyectos: [
    'id_proyecto', 'nombre_proyecto', 'ubicacion', 'comuna', 'coordenadas_centro',
    'superficie', 'rol', 'deslindes', 'infraestructura', 'caracteristicas',
    'fecha_dom', 'fecha_ingreso', 'estado_proyecto', 'nro_etapas', 'url'
  ],
  Etapas: [
    'id_etapa', 'id_proyecto', 'nombre_etapa', 'nro_lotes', 'superficie',
    'fecha_ingreso', 'fecha_dom', 'estado_etapa', 'fecha_inicio', 'fecha_cierre', 'url'
  ],
  Propiedades: [
    'id_propiedad', 'id_etapa', 'id_proyecto', 'nombre', 'rol', 'superficie',
    'valor_final', 'abono', 'fecha_ingreso', 'deslindes', 'infraestructura',
    'fecha_reserva', 'fecha_fin_promesa', 'fecha_venta', 'url', 'estado', 'coordenadas'
  ],
  Directorio: [
    'id_director', 'rut', 'nombre', 'cargo', 'telefono',
    'email', 'fecha_ingreso', 'estado', 'auth_reserva',
    'firma_reserva', 'auth_promesa', 'firma_promesa',
    'auth_venta', 'firma_venta'
  ],
  Negociaciones: [
    'id_negociacion', 'id_propiedad', 'id_vendedor', 'id_cliente',
    'fecha_negociacion', 'valor_final', 'pie', 'cantidad_cuotas',
    'fecha_vencimiento_cuota', 'tipo_moneda', 'url', 'estado_avance',
    'reajuste', 'id_proceso', 'metodo_pago', 'notas', 'fecha_promesa', 'tipo_operacion'
  ],
  Cuenta_Corriente: [
    'id_ctacte', 'id_cliente', 'id_propiedad', 'cuota_nro', 'valor_cuota',
    'fecha_vencimiento', 'valor_pagado', 'fecha_pago', 'url', 'estado_cuota', 'metodo_pago'
  ],
  Tramites: [
    'id_tramite', 'Nombre_tramite', 'fecha_inicio', 'id_propiedad', 'id_director', 'Estado_tramite', 'id_proceso'
  ],
  Auditoria: [
    'Fecha', 'Usuario', 'Rol', 'Tabla', 'Accion', 'Registro_id', 'Detalle'
  ]
};

// Colores de encabezado por tabla
const COLORES_HEADER = {
  "00_Usuarios":           '#1e293b', // Slate
  "00_Gobernanza_Permisos": '#0f172a', // Dark Slate
  Vendedores:       '#2563eb', // Azul
  Clientes:         '#7c3aed', // Violeta
  Proyectos:        '#059669', // Verde
  Etapas:           '#0891b2', // Cyan
  Propiedades:      '#d97706', // Amber
  Directorio:       '#dc2626', // Rojo
  Negociaciones:    '#ea580c', // Naranja
  Cuenta_Corriente: '#4f46e5', // Indigo
  Tramites:         '#0284c7', // Celeste
  Auditoria:        '#6b7280'  // Gris
};

// Nombre de la columna PK por tabla (alineado con db.js)
const PK_COLUMNA = {
  "00_Usuarios":           'RUT_Usuario',
  "00_Gobernanza_Permisos": 'ID_Permiso',
  Vendedores:       'id_vendedor',
  Clientes:         'id_cliente',
  Proyectos:        'id_proyecto',
  Etapas:           'id_etapa',
  Propiedades:      'id_propiedad',
  Directorio:       'id_director',
  Negociaciones:    'id_negociacion',
  Cuenta_Corriente: 'id_ctacte',
  Tramites:         'id_tramite'
};


// ══════════════════════════════════════════════════════
// INICIALIZACIÓN (EJECUTAR UNA VEZ)
// ══════════════════════════════════════════════════════

/**
 * Crea las hojas con encabezados formateados y siembra datos iniciales de seguridad.
 * Ejecutar manualmente desde el editor de Apps Script.
 */
function inicializarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.entries(TABLAS).forEach(([nombreTabla, columnas]) => {
    let sheet = ss.getSheetByName(nombreTabla);
    
    if (!sheet) {
      sheet = ss.insertSheet(nombreTabla);
      Logger.log('✅ Hoja creada: ' + nombreTabla);
    }
    
    // Escribir encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
      
      // Formato del encabezado
      const headerRange = sheet.getRange(1, 1, 1, columnas.length);
      headerRange.setFontWeight('bold');
      headerRange.setFontColor('#ffffff');
      headerRange.setBackground(COLORES_HEADER[nombreTabla] || '#374151');
      headerRange.setHorizontalAlignment('center');
      headerRange.setFontSize(10);
      
      // Congelar fila de encabezado
      sheet.setFrozenRows(1);
      
      // Ajustar ancho de columnas
      columnas.forEach((col, idx) => {
        const width = col.length > 15 ? 180 : col.length > 10 ? 140 : 100;
        sheet.setColumnWidth(idx + 1, width);
      });
      
      Logger.log('  → Encabezados escritos para: ' + nombreTabla);
    }
  });
  
  // ── Siembra de Usuarios (00_Usuarios) si está vacía ──
  const userSheet = ss.getSheetByName('00_Usuarios');
  if (userSheet && userSheet.getLastRow() <= 1) {
    Logger.log('🌱 Sembrando datos en 00_Usuarios...');
    const defaultUsers = [
      ['11.111.111-1', 'Ricardo Comercial (Vendedor)', hashPassword('vendedor123'), 'Vendedor', 'Activo'],
      ['22.222.222-2', 'Ximena Guzmán (Gerente)', hashPassword('gerente123'), 'Gerencia', 'Activo'],
      ['33.333.333-3', 'Claudio Documental (Administración)', hashPassword('admin123'), 'Administracion', 'Activo']
    ];
    userSheet.getRange(2, 1, defaultUsers.length, 5).setValues(defaultUsers);
    Logger.log('✅ Usuarios sembrados.');
  }

  // ── Siembra de Permisos (00_Gobernanza_Permisos) si está vacía ──
  const permSheet = ss.getSheetByName('00_Gobernanza_Permisos');
  if (permSheet && permSheet.getLastRow() <= 1) {
    Logger.log('🌱 Sembrando matriz de permisos inicial...');
    const defaultPerms = [
      [1, 'Buscador_Mapa', 'Ver y filtrar el mapa satelital GIS de lotes', 'TRUE', 'TRUE', 'TRUE'],
      [2, 'Formulario_Reserva', 'Formulario de reserva y compra de parcelas', 'TRUE', 'TRUE', 'TRUE'],
      [3, 'Bandeja_Aprobaciones', 'Aprobación y rechazo de reservas de lotes', 'FALSE', 'TRUE', 'TRUE'],
      [4, 'Carga_PDF_Promesa', 'Subir documentos firmados de promesas de compraventa', 'FALSE', 'FALSE', 'TRUE'],
      [5, 'Dashboard_Financiero', 'Panel de métricas comerciales y gráficos financieros', 'FALSE', 'TRUE', 'TRUE'],
      [6, 'Mis_Leads', 'Listado y seguimiento de prospectos asignados', 'TRUE', 'FALSE', 'TRUE'],
      [7, 'Control_Precios', 'Ver y editar precios de lista de las parcelas', 'FALSE', 'TRUE', 'TRUE'],
      [8, 'Mesa_Documental', 'Firma de promesas y escrituración de lotes', 'FALSE', 'FALSE', 'TRUE'],
      [9, 'Cuenta_Corriente', 'Gestión y pago de cuotas de financiamiento', 'FALSE', 'FALSE', 'TRUE'],
      [10, 'Carga_Datos', 'Administración de entidades base (Vendedores, Clientes, Proyectos, Etapas)', 'FALSE', 'FALSE', 'TRUE'],
      [11, 'Inventario', 'Consulta de listado de inventario general', 'FALSE', 'TRUE', 'TRUE'],
      [12, 'Auditoria', 'Registro detallado de acciones ejecutadas en el sistema', 'FALSE', 'FALSE', 'TRUE'],
      [13, 'Configuracion_Sistema', 'Configuración de gobernanza, permisos y usuarios', 'FALSE', 'FALSE', 'TRUE']
    ];
    permSheet.getRange(2, 1, defaultPerms.length, 6).setValues(defaultPerms);
    Logger.log('✅ Matriz de permisos sembrada.');
  }
  
  // ── Siembra de Vendedores si está vacía ──
  const vendSheet = ss.getSheetByName('Vendedores');
  if (vendSheet && vendSheet.getLastRow() <= 1) {
    Logger.log('🌱 Sembrando datos en Vendedores...');
    // Columnas: id_vendedor, rut, nombre, fecha_ingreso, ciudad, telefono, email, cargo, estado
    const defaultVend = [
      [1, '11.111.111-1', 'Ricardo Comercial', new Date().toLocaleDateString('es-CL'), 'Santiago', '+56 9 1111 1111', 'ricardo@5tierras.cl', 'Ejecutivo Senior', 'Activo']
    ];
    vendSheet.getRange(2, 1, defaultVend.length, 9).setValues(defaultVend);
    Logger.log('✅ Vendedores sembrados.');
  }

  // ── Siembra de Directorio si está vacía ──
  const dirSheet = ss.getSheetByName('Directorio');
  if (dirSheet && dirSheet.getLastRow() <= 1) {
    Logger.log('🌱 Sembrando datos en Directorio...');
    // Columnas: id_director, rut, nombre, cargo, telefono, email, fecha_ingreso, estado, auth_reserva, firma_reserva, auth_promesa, firma_promesa, auth_venta, firma_venta
    const defaultDir = [
      [1, '22.222.222-2', 'Ximena Guzmán', 'Directora Ejecutiva', '+56 9 2222 2222', 'ximena@5tierras.cl', new Date().toLocaleDateString('es-CL'), 'Disponible', 'S', 'S', 'S', 'S', 'S', 'S']
    ];
    dirSheet.getRange(2, 1, defaultDir.length, 14).setValues(defaultDir);
    Logger.log('✅ Directorio sembrado.');
  }
  
  // Eliminar la hoja por defecto si existe
  const defaultSheet = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
      Logger.log('🗑️ Hoja por defecto eliminada');
    } catch(e) {
      // Ignorar si no se puede eliminar
    }
  }
  
  Logger.log('');
  Logger.log('══════════════════════════════════════');
  Logger.log('✅ INICIALIZACIÓN COMPLETA');
  Logger.log('   Hojas creadas: ' + ss.getSheets().length);
  Logger.log('   Próximo paso: Implementar como Web App');
  Logger.log('══════════════════════════════════════');
}


/**
 * Migra los encabezados de las hojas de cálculo al nuevo formato en minúsculas.
 * Inserta la columna "abono" en la hoja Propiedades si es necesario para evitar desalineamiento de datos.
 * Ejecutar manualmente en el editor de Apps Script si las hojas fueron creadas con el formato antiguo.
 */
function migrarFormatoHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Migrar Propiedades si tiene el formato antiguo (sin abono en col 7)
  const propSheet = ss.getSheetByName('Propiedades');
  if (propSheet && propSheet.getLastColumn() > 0) {
    const headers = propSheet.getRange(1, 1, 1, propSheet.getLastColumn()).getValues()[0];
    if (headers[6] !== 'abono' && headers[6] !== 'Abono') {
      Logger.log('⚠️ Detectado formato antiguo en Propiedades. Insertando columna "abono" en columna 7...');
      propSheet.insertColumnAfter(6); // Inserta después de la columna 6, creando una columna 7 vacía
      Logger.log('✅ Columna "abono" insertada en la columna 7.');
    }
  }
  
  // 2. Sobrescribir encabezados con el esquema actual en minúsculas (snake_case)
  Object.entries(TABLAS).forEach(([nombreTabla, columnas]) => {
    let sheet = ss.getSheetByName(nombreTabla);
    if (sheet) {
      sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
      
      // Formato estético
      const headerRange = sheet.getRange(1, 1, 1, columnas.length);
      headerRange.setFontWeight('bold');
      headerRange.setFontColor('#ffffff');
      headerRange.setBackground(COLORES_HEADER[nombreTabla] || '#374151');
      headerRange.setHorizontalAlignment('center');
      headerRange.setFontSize(10);
      
      Logger.log('✅ Encabezados actualizados a minúsculas para: ' + nombreTabla);
    }
  });
  
  Logger.log('🎉 MIGRACIÓN DE ENCABEZADOS A MINÚSCULAS COMPLETADA.');
}



// ══════════════════════════════════════════════════════
// ENDPOINT GET — LECTURA DE DATOS
// ══════════════════════════════════════════════════════

function doGet(e) {
  try {
    const action = (e.parameter.action || 'read').toLowerCase();
    const tabla = e.parameter.tabla || '';
    const id = e.parameter.id || '';
    
    switch (action) {
      case 'read':
        if (!tabla && e.parameter.proyecto) {
          return leerLotesProyecto(e.parameter.proyecto);
        }
        if (!tabla) return respError('Parámetro "tabla" requerido', 400);
        return leerTabla(tabla);
        
      case 'readbyid':
        if (!tabla || !id) return respError('Parámetros "tabla" e "id" requeridos', 400);
        return leerRegistro(tabla, id);
        
      case 'readall':
        return leerTodasLasTablas();
        
      case 'get_permissions':
        return respOk({ success: true, permisos: obtenerMatrizPermisosInternal() });
        
      case 'ping':
        return respOk({ status: 'online', app: 'APP_5T', version: '1.2.0', timestamp: new Date().toISOString() });
        
      default:
        return respError('Acción GET no reconocida: ' + action, 400);
    }
  } catch (err) {
    return respError('Error interno GET: ' + err.message, 500);
  }
}


// ══════════════════════════════════════════════════════
// ENDPOINT POST — ESCRITURA DE DATOS
// ══════════════════════════════════════════════════════

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || 'insert').toLowerCase();
    const tabla = body.tabla || '';
    
    if (!tabla && action !== 'syncall' && action !== 'login' && action !== 'update_permissions' && action !== 'get_users' && action !== 'update_user' && action !== 'delete_user') {
      return respError('Campo "tabla" requerido en el body', 400);
    }
    
    switch (action) {
      case 'login':
        return respOk(validarCredenciales(body.rut, body.password));
        
      case 'get_permissions':
        return respOk({ success: true, permisos: obtenerMatrizPermisosInternal() });
        
      case 'update_permissions':
        return respOk(actualizarMatrizPermisos(body.permisos, body.usuario));
        
      case 'get_users':
        if (body.rol !== 'Administracion') {
          return respError('No autorizado', 403);
        }
        return respOk({ success: true, usuarios: obtenerUsuariosInternal() });
        
      case 'update_user':
        if (body.rol !== 'Administracion') {
          return respError('No autorizado', 403);
        }
        return respOk(guardarUsuario(body.data, body.usuario));
        
      case 'delete_user':
        if (body.rol !== 'Administracion') {
          return respError('No autorizado', 403);
        }
        return respOk(eliminarUsuario(body.id, body.usuario));

      case 'insert':
        return insertarRegistro(tabla, body.data || {}, body.usuario || 'Sistema');
        
      case 'update':
        if (!body.id && body.id !== 0) return respError('Campo "id" requerido para update', 400);
        return actualizarRegistro(tabla, body.id, body.data || {}, body.usuario || 'Sistema');
        
      case 'delete':
        if (!body.id && body.id !== 0) return respError('Campo "id" requerido para delete', 400);
        return eliminarRegistro(tabla, body.id, body.usuario || 'Sistema');
        
      case 'sync':
        if (!body.registros || !Array.isArray(body.registros)) {
          return respError('Campo "registros" (array) requerido para sync', 400);
        }
        return sincronizarTabla(tabla, body.registros, body.usuario || 'Sistema');
        
      case 'syncall':
        if (!body.datos || typeof body.datos !== 'object') {
          return respError('Campo "datos" (objeto) requerido para syncAll', 400);
        }
        return sincronizarTodo(body.datos, body.usuario || 'Sistema');
        
      default:
        return respError('Acción POST no reconocida: ' + action, 400);
    }
  } catch (err) {
    return respError('Error interno POST: ' + err.message, 500);
  }
}


// ══════════════════════════════════════════════════════
// OPERACIONES CRUD
// ══════════════════════════════════════════════════════

/**
 * LEER — Todos los registros de una tabla
 */
function leerTabla(nombreTabla) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return respOk({ tabla: nombreTabla, registros: [], total: 0 });
  
  const headers = data[0];
  const registros = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = data[i][idx];
    });
    registros.push(row);
  }
  
  return respOk({ tabla: nombreTabla, registros: registros, total: registros.length });
}

/**
 * LEER — Un registro por ID
 */
function leerRegistro(nombreTabla, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida: ' + nombreTabla, 400);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pkIdx = headers.indexOf(pkCol);
  
  if (pkIdx === -1) return respError('Columna PK "' + pkCol + '" no encontrada', 500);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][pkIdx]) === String(id)) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = data[i][idx]; });
      return respOk({ tabla: nombreTabla, registro: row });
    }
  }
  
  return respError('Registro con ' + pkCol + '=' + id + ' no encontrado', 404);
}

/**
 * LEER — Todas las tablas (excepto Auditoría)
 */
function leerTodasLasTablas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultado = {};
  
  Object.keys(TABLAS).forEach(nombreTabla => {
    if (nombreTabla === 'Auditoria' || nombreTabla === '00_Usuarios' || nombreTabla === '00_Gobernanza_Permisos') return; // Excluir tablas de seguridad e historial del readAll público
    
    const sheet = obtenerHoja(ss, nombreTabla);
    if (!sheet) {
      resultado[nombreTabla] = [];
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      resultado[nombreTabla] = [];
      return;
    }
    
    const headers = data[0];
    const registros = [];
    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = data[i][idx]; });
      registros.push(row);
    }
    resultado[nombreTabla] = registros;
  });
  
  return respOk(resultado);
}

/**
 * INSERTAR — Nuevo registro en una tabla
 */
function insertarRegistro(nombreTabla, data, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  if (!columnas) return respError('Esquema de tabla no definido: ' + nombreTabla, 400);
  
  // Generar ID autoincremental
  const pkCol = PK_COLUMNA[nombreTabla];
  let nuevoId = data[pkCol];
  
  if (pkCol && (!nuevoId || nuevoId === 0)) {
    nuevoId = obtenerSiguienteId(sheet, columnas.indexOf(pkCol));
    data[pkCol] = nuevoId;
  }
  
  // Construir fila según el orden de columnas
  const newRow = columnas.map(col => {
    const val = data[col];
    if (val === undefined || val === null) return '';
    return val;
  });
  
  sheet.appendRow(newRow);
  
  // Auditoría
  registrarAuditoria(usuario, '', nombreTabla, 'INSERT', nuevoId, 
    'Nuevo registro creado: ' + JSON.stringify(data).substring(0, 200));
  
  return respOk({ success: true, id: nuevoId, tabla: nombreTabla });
}

/**
 * ACTUALIZAR — Modificar campos de un registro existente
 */
function actualizarRegistro(nombreTabla, id, data, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida: ' + nombreTabla, 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  if (pkIdx === -1) return respError('Columna PK no encontrada', 500);
  
  // Buscar fila del registro
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][pkIdx]) === String(id)) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return respError('Registro con ' + pkCol + '=' + id + ' no encontrado', 404);
  }
  
  const sheetRow = rowIndex + 1; // Fila real en la hoja (1-indexed)
  const cambios = [];
  
  // Actualizar solo los campos enviados
  Object.entries(data).forEach(([campo, valor]) => {
    const colIdx = headers.indexOf(campo);
    if (colIdx === -1) return; // Ignorar campos que no existen
    if (campo === pkCol) return; // No modificar la PK
    
    const valorAnterior = allData[rowIndex][colIdx];
    if (String(valorAnterior) !== String(valor)) {
      sheet.getRange(sheetRow, colIdx + 1).setValue(valor === null ? '' : valor);
      cambios.push(campo + ': ' + valorAnterior + ' → ' + valor);
    }
  });
  
  if (cambios.length > 0) {
    registrarAuditoria(usuario, '', nombreTabla, 'UPDATE', id, cambios.join(' | '));
  }
  
  return respOk({ success: true, id: id, tabla: nombreTabla, cambios: cambios.length });
}

/**
 * ELIMINAR — Borrar un registro por ID
 */
function eliminarRegistro(nombreTabla, id, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol) return respError('Tabla sin PK definida', 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][pkIdx]) === String(id)) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return respError('Registro no encontrado', 404);
  }
  
  // Guardar datos antes de eliminar para auditoría
  const registro = {};
  headers.forEach((h, idx) => { registro[h] = allData[rowIndex][idx]; });
  
  sheet.deleteRow(rowIndex + 1);
  
  registrarAuditoria(usuario, '', nombreTabla, 'DELETE', id,
    'Registro eliminado: ' + JSON.stringify(registro).substring(0, 200));
  
  return respOk({ success: true, id: id, tabla: nombreTabla });
}


// ══════════════════════════════════════════════════════
// SINCRONIZACIÓN MASIVA
// ══════════════════════════════════════════════════════

/**
 * SYNC — Sincronizar una tabla completa (upsert masivo)
 * Recibe un array de registros. Para cada uno:
 * - Si el ID existe → UPDATE
 * - Si el ID no existe → INSERT
 */
function sincronizarTabla(nombreTabla, registros, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = obtenerHoja(ss, nombreTabla);
  if (!sheet) return respError('Tabla "' + nombreTabla + '" no encontrada', 404);
  
  const columnas = TABLAS[nombreTabla];
  const pkCol = PK_COLUMNA[nombreTabla];
  if (!pkCol || !columnas) return respError('Configuración de tabla inválida', 400);
  
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const pkIdx = headers.indexOf(pkCol);
  
  // Crear mapa de IDs existentes → fila
  const existingMap = {};
  for (let i = 1; i < allData.length; i++) {
    existingMap[String(allData[i][pkIdx])] = i + 1; // fila real (1-indexed)
  }
  
  let insertados = 0;
  let actualizados = 0;
  
  registros.forEach(reg => {
    const id = String(reg[pkCol] || '');
    
    if (id && existingMap[id]) {
      // UPDATE existente
      const sheetRow = existingMap[id];
      columnas.forEach((col, colIdx) => {
        if (col === pkCol) return;
        if (reg[col] !== undefined) {
          sheet.getRange(sheetRow, colIdx + 1).setValue(reg[col] === null ? '' : reg[col]);
        }
      });
      actualizados++;
    } else {
      // INSERT nuevo
      const newRow = columnas.map(col => {
        const val = reg[col];
        return (val === undefined || val === null) ? '' : val;
      });
      sheet.appendRow(newRow);
      insertados++;
    }
  });
  
  registrarAuditoria(usuario, '', nombreTabla, 'SYNC',
    insertados + '+' + actualizados,
    'Sync masiva: ' + insertados + ' insertados, ' + actualizados + ' actualizados');
  
  return respOk({
    success: true,
    tabla: nombreTabla,
    insertados: insertados,
    actualizados: actualizados,
    total: registros.length
  });
}

/**
 * SYNC ALL — Sincronizar todas las tablas de una vez
 * Body: { datos: { Vendedores: [...], Clientes: [...], ... } }
 */
function sincronizarTodo(datos, usuario) {
  const resultados = {};
  
  Object.entries(datos).forEach(([tabla, registros]) => {
    if (!TABLAS[tabla] || tabla === 'Auditoria') return;
    if (!Array.isArray(registros)) return;
    
    try {
      const res = sincronizarTabla(tabla, registros, usuario);
      const parsed = JSON.parse(res.getContent());
      resultados[tabla] = parsed;
    } catch (err) {
      resultados[tabla] = { error: err.message };
    }
  });
  
  return respOk({ success: true, resultados: resultados });
}


// ══════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ══════════════════════════════════════════════════════

/**
 * Obtener el siguiente ID autoincremental para una tabla
 */
function obtenerSiguienteId(sheet, pkColIndex) {
  if (pkColIndex < 0) return 1;
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1; // Solo encabezado
  
  const valores = sheet.getRange(2, pkColIndex + 1, lastRow - 1, 1).getValues();
  let maxId = 0;
  
  valores.forEach(row => {
    const val = parseInt(row[0], 10);
    if (!isNaN(val) && val > maxId) maxId = val;
  });
  
  return maxId + 1;
}

/**
 * Obtiene una hoja por su nombre. Si no existe pero está definida en TABLAS, la crea automáticamente.
 */
function obtenerHoja(ss, nombreTabla) {
  let sheet = ss.getSheetByName(nombreTabla);
  if (sheet) return sheet;
  
  const columnas = TABLAS[nombreTabla];
  if (!columnas) return null;
  
  sheet = ss.insertSheet(nombreTabla);
  sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
  
  // Formato del encabezado
  const headerRange = sheet.getRange(1, 1, 1, columnas.length);
  headerRange.setFontWeight('bold');
  headerRange.setFontColor('#ffffff');
  headerRange.setBackground(COLORES_HEADER[nombreTabla] || '#374151');
  headerRange.setHorizontalAlignment('center');
  headerRange.setFontSize(10);
  
  // Congelar fila de encabezado
  sheet.setFrozenRows(1);
  
  // Ajustar ancho de columnas
  columnas.forEach((col, idx) => {
    const width = col.length > 15 ? 180 : col.length > 10 ? 140 : 100;
    sheet.setColumnWidth(idx + 1, width);
  });
  
  Logger.log('✅ Hoja auto-creada sobre la marcha: ' + nombreTabla);
  return sheet;
}

/**
 * Registrar acción en la hoja de Auditoría
 */
function registrarAuditoria(usuario, rol, tabla, accion, registroId, detalle) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Auditoria');
    if (!auditSheet) return;
    
    const fecha = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );
    
    auditSheet.appendRow([
      fecha,
      usuario || 'Sistema',
      rol || '',
      tabla || '',
      accion || '',
      String(registroId || ''),
      String(detalle || '').substring(0, 500) // Limitar largo
    ]);
    
    // Mantener auditoría en tamaño razonable (máx 5000 filas)
    const totalRows = auditSheet.getLastRow();
    if (totalRows > 5001) {
      auditSheet.deleteRows(2, totalRows - 5001);
    }
  } catch (e) {
    // No fallar por error de auditoría
    Logger.log('Error de auditoría: ' + e.message);
  }
}

/**
 * Respuesta JSON exitosa
 */
function respOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Respuesta JSON de error
 */
function respError(mensaje, codigo) {
  return ContentService
    .createTextOutput(JSON.stringify({
      error: true,
      mensaje: mensaje,
      codigo: codigo || 500
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ══════════════════════════════════════════════════════
// FUNCIONES DE MANTENIMIENTO (opcionales)
// ══════════════════════════════════════════════════════

/**
 * Reinicializar una tabla específica (CUIDADO: borra todos los datos)
 */
function reinicializarTabla(nombreTabla) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreTabla);
  if (!sheet) {
    Logger.log('Tabla no encontrada: ' + nombreTabla);
    return;
  }
  
  const columnas = TABLAS[nombreTabla];
  if (!columnas) {
    Logger.log('Esquema no definido para: ' + nombreTabla);
    return;
  }
  
  // Borrar todo excepto encabezado
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  Logger.log('🗑️ Tabla reinicializada: ' + nombreTabla + ' (encabezados preservados)');
}

/**
 * Ver estadísticas de todas las tablas
 */
function verEstadisticas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('══════════════════════════════════════');
  Logger.log('📊 ESTADÍSTICAS APP_5T');
  Logger.log('══════════════════════════════════════');
  
  Object.keys(TABLAS).forEach(tabla => {
    const sheet = ss.getSheetByName(tabla);
    if (sheet) {
      const rows = Math.max(0, sheet.getLastRow() - 1);
      Logger.log('  ' + tabla + ': ' + rows + ' registros');
    } else {
      Logger.log('  ' + tabla + ': ⚠️ HOJA NO ENCONTRADA');
    }
  });
  
  Logger.log('══════════════════════════════════════');
}

// ══════════════════════════════════════════════════════
// SEGURIDAD Y GOBERNANZA - LOGICA DE NEGOCIO
// ══════════════════════════════════════════════════════

/**
 * Limpia un RUT eliminando puntos, guiones y espacios.
 */
function limpiarRUT(rut) {
  if (!rut) return '';
  return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Encripta una contraseña usando SHA-256.
 */
function hashPassword(password) {
  if (!password) return '';
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < digest.length; i++) {
    var byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    var byteString = byteVal.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    hex += byteString;
  }
  return hex;
}

/**
 * Valida las credenciales ingresadas contra la hoja 00_Usuarios.
 */
function validarCredenciales(rut, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('00_Usuarios');
  if (!sheet) return { success: false, mensaje: 'Base de datos de usuarios no configurada' };
  
  const cleanInputRut = limpiarRUT(rut);
  const hash = hashPassword(password);
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rutIdx = headers.indexOf('RUT_Usuario');
  const nombreIdx = headers.indexOf('Nombre');
  const hashIdx = headers.indexOf('Contraseña_Hash');
  const rolIdx = headers.indexOf('Rol');
  const estadoIdx = headers.indexOf('Estado');
  
  if (rutIdx === -1 || hashIdx === -1 || rolIdx === -1 || estadoIdx === -1) {
    return { success: false, mensaje: 'Columnas de seguridad incompletas en la hoja 00_Usuarios' };
  }
  
  for (let i = 1; i < data.length; i++) {
    const dbRut = limpiarRUT(data[i][rutIdx]);
    if (dbRut === cleanInputRut) {
      if (String(data[i][estadoIdx]).toLowerCase() !== 'activo') {
        return { success: false, mensaje: 'El usuario se encuentra Inactivo en el sistema.' };
      }
      if (data[i][hashIdx] === hash) {
        // Obtener la matriz de permisos para el rol de usuario
        const permisos = obtenerMatrizPermisosInternal();
        return {
          success: true,
          user: {
            rut: data[i][rutIdx],
            nombre: data[i][nombreIdx] || 'Usuario',
            rol: data[i][rolIdx]
          },
          permisos: permisos
        };
      } else {
        return { success: false, mensaje: 'Contraseña incorrecta' };
      }
    }
  }
  
  return { success: false, mensaje: 'RUT de usuario no registrado' };
}

/**
 * Obtiene la matriz de gobernanza y permisos completa.
 */
function obtenerMatrizPermisosInternal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('00_Gobernanza_Permisos');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const list = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      let val = data[i][idx];
      // Convertir "TRUE"/"FALSE" strings a booleanos
      if (h.startsWith('Acceso_')) {
        val = (String(val).toUpperCase() === 'TRUE' || val === true);
      }
      row[h] = val;
    });
    list.push(row);
  }
  return list;
}

/**
 * Reemplaza y actualiza la matriz de permisos en la hoja.
 */
function actualizarMatrizPermisos(matriz, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('00_Gobernanza_Permisos');
    if (!sheet) return { success: false, error: 'Hoja 00_Gobernanza_Permisos no encontrada' };
    
    const headers = ['ID_Permiso', 'Componente_Modulo', 'Descripcion', 'Acceso_Vendedor', 'Acceso_Gerencia', 'Acceso_Administracion'];
    
    // Limpiar contenido previo manteniendo el header
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    if (matriz && matriz.length > 0) {
      const rows = matriz.map(m => [
        Number(m.ID_Permiso) || m.ID_Permiso,
        m.Componente_Modulo,
        m.Descripcion,
        m.Acceso_Vendedor === true || String(m.Acceso_Vendedor).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
        m.Acceso_Gerencia === true || String(m.Acceso_Gerencia).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE',
        m.Acceso_Administracion === true || String(m.Acceso_Administracion).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE'
      ]);
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    registrarAuditoria(usuario || 'Administrador', 'Administracion', '00_Gobernanza_Permisos', 'UPDATE', 'MATRIZ_PERMISOS', 'Configuración de matriz de permisos actualizada');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene los usuarios de la base de datos (con las contraseñas ocultas).
 */
function obtenerUsuariosInternal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('00_Usuarios');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const list = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      if (h === 'Contraseña_Hash') {
        row[h] = '●●●●●●';
      } else {
        row[h] = data[i][idx];
      }
    });
    list.push(row);
  }
  return list;
}

/**
 * Crea o actualiza un usuario en la hoja 00_Usuarios.
 */
function guardarUsuario(usuarioData, administrador) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('00_Usuarios');
    if (!sheet) return { success: false, error: 'Hoja 00_Usuarios no encontrada' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rutIdx = headers.indexOf('RUT_Usuario');
    const nombreIdx = headers.indexOf('Nombre');
    const hashIdx = headers.indexOf('Contraseña_Hash');
    const rolIdx = headers.indexOf('Rol');
    const estadoIdx = headers.indexOf('Estado');
    
    const cleanInputRut = limpiarRUT(usuarioData.RUT_Usuario);
    if (!cleanInputRut) return { success: false, error: 'El RUT es obligatorio' };
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (limpiarRUT(data[i][rutIdx]) === cleanInputRut) {
        rowIndex = i;
        break;
      }
    }
    
    let passwordHash = '';
    if (usuarioData.Contraseña && usuarioData.Contraseña !== '●●●●●●' && usuarioData.Contraseña.trim() !== '') {
      passwordHash = hashPassword(usuarioData.Contraseña.trim());
    }
    
    if (rowIndex !== -1) {
      const rowNum = rowIndex + 1;
      sheet.getRange(rowNum, nombreIdx + 1).setValue(usuarioData.Nombre);
      sheet.getRange(rowNum, rolIdx + 1).setValue(usuarioData.Rol);
      sheet.getRange(rowNum, estadoIdx + 1).setValue(usuarioData.Estado);
      if (passwordHash) {
        sheet.getRange(rowNum, hashIdx + 1).setValue(passwordHash);
      }
      registrarAuditoria(administrador, 'Administracion', '00_Usuarios', 'UPDATE', cleanInputRut, 'Usuario actualizado: ' + usuarioData.Nombre + ' (Rol: ' + usuarioData.Rol + ')');
    } else {
      // Crear nuevo
      if (!passwordHash) {
        passwordHash = hashPassword('5tierras123'); // Contraseña por defecto
      }
      const newRow = headers.map(h => {
        if (h === 'RUT_Usuario') return usuarioData.RUT_Usuario;
        if (h === 'Nombre') return usuarioData.Nombre;
        if (h === 'Contraseña_Hash') return passwordHash;
        if (h === 'Rol') return usuarioData.Rol;
        if (h === 'Estado') return usuarioData.Estado || 'Activo';
        return '';
      });
      sheet.appendRow(newRow);
      registrarAuditoria(administrador, 'Administracion', '00_Usuarios', 'INSERT', cleanInputRut, 'Nuevo usuario creado: ' + usuarioData.Nombre + ' (Rol: ' + usuarioData.Rol + ')');
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Elimina un usuario por su RUT.
 */
function eliminarUsuario(rut, administrador) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('00_Usuarios');
    if (!sheet) return { success: false, error: 'Hoja 00_Usuarios no encontrada' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rutIdx = headers.indexOf('RUT_Usuario');
    
    const cleanInputRut = limpiarRUT(rut);
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (limpiarRUT(data[i][rutIdx]) === cleanInputRut) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) return { success: false, error: 'Usuario no encontrado' };
    
    sheet.deleteRow(rowIndex + 1);
    registrarAuditoria(administrador, 'Administracion', '00_Usuarios', 'DELETE', cleanInputRut, 'Usuario eliminado: ' + rut);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * BACKWARDS COMPATIBILITY FOR CLIENT PORTAL
 * Lee los lotes de un proyecto específico de la tabla Propiedades.
 */
function leerLotesProyecto(nombreProyecto) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Obtener ID del proyecto buscando por nombre
  const sheetProyectos = obtenerHoja(ss, 'Proyectos');
  if (!sheetProyectos) return respError('Tabla "Proyectos" no encontrada', 404);
  const dataProyectos = sheetProyectos.getDataRange().getValues();
  if (dataProyectos.length <= 1) return respOk({ lotes: [], total: 0 });
  
  const headersProyectos = dataProyectos[0];
  const idProyIdx = headersProyectos.indexOf('id_proyecto');
  const nameProyIdx = headersProyectos.indexOf('nombre_proyecto');
  
  if (idProyIdx === -1 || nameProyIdx === -1) {
    return respError('Estructura de tabla Proyectos inválida', 500);
  }
  
  let projectId = null;
  for (let i = 1; i < dataProyectos.length; i++) {
    if (String(dataProyectos[i][nameProyIdx]).trim().toLowerCase() === nombreProyecto.trim().toLowerCase()) {
      projectId = Number(dataProyectos[i][idProyIdx]);
      break;
    }
  }
  
  if (projectId === null) {
    return respError('Proyecto "' + nombreProyecto + '" no encontrado', 404);
  }
  
  // 2. Obtener propiedades vinculadas a id_proyecto
  const sheetPropiedades = obtenerHoja(ss, 'Propiedades');
  if (!sheetPropiedades) return respError('Tabla "Propiedades" no encontrada', 404);
  const dataPropiedades = sheetPropiedades.getDataRange().getValues();
  if (dataPropiedades.length <= 1) return respOk({ lotes: [], total: 0 });
  
  const headersPropiedades = dataPropiedades[0];
  const propProyIdx = headersPropiedades.indexOf('id_proyecto');
  const propNombreIdx = headersPropiedades.indexOf('nombre');
  const propEstadoIdx = headersPropiedades.indexOf('estado');
  const propPrecioIdx = headersPropiedades.indexOf('valor_final');
  const propInfraIdx = headersPropiedades.indexOf('infraestructura');
  
  if (propProyIdx === -1 || propNombreIdx === -1 || propEstadoIdx === -1 || propPrecioIdx === -1) {
    return respError('Estructura de tabla Propiedades inválida', 500);
  }
  
  const lotes = [];
  for (let i = 1; i < dataPropiedades.length; i++) {
    if (Number(dataPropiedades[i][propProyIdx]) === projectId) {
      lotes.push({
        Lote: dataPropiedades[i][propNombreIdx],
        Estado: dataPropiedades[i][propEstadoIdx],
        Precio: Number(dataPropiedades[i][propPrecioIdx]) || 0,
        Comentario: propInfraIdx !== -1 ? dataPropiedades[i][propInfraIdx] || '' : ''
      });
    }
  }
  
  return respOk({ lotes: lotes, total: lotes.length });
}
