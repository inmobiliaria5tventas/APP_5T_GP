/**
 * ============================================================
 *  5 Tierras — APP5T_Utils
 *  Módulo de utilidades generales
 *  Fecha: 2026-06-05
 * ============================================================
 *  Funciones de validación (RUT, teléfono, email),
 *  formateo (moneda, fecha, superficie), generación de IDs
 *  y notificaciones toast.
 * ============================================================
 */
var APP5T_Utils = (function () {
    'use strict';

    // ───────────────────── RUT ─────────────────────

    /**
     * Limpia un RUT dejando sólo dígitos y K/k.
     * '12.345.678-5' → '123456785'
     */
    function limpiarRUT(rut) {
        if (!rut) return '';
        return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
    }

    /**
     * Valida un RUT chileno con dígito verificador.
     * Acepta con o sin puntos/guión.
     */
    function validarRUT(rut) {
        var clean = limpiarRUT(rut);
        if (clean.length < 2) return false;

        var cuerpo = clean.slice(0, -1);
        var dvIngresado = clean.slice(-1);

        if (!/^\d+$/.test(cuerpo)) return false;

        var suma = 0;
        var multiplo = 2;
        for (var i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo[i], 10) * multiplo;
            multiplo = multiplo === 7 ? 2 : multiplo + 1;
        }

        var resto = suma % 11;
        var dvEsperado;
        if (resto === 0) dvEsperado = '0';
        else if (resto === 1) dvEsperado = 'K';
        else dvEsperado = String(11 - resto);

        return dvIngresado === dvEsperado;
    }

    /**
     * Formatea un RUT: 123456785 → 12.345.678-5
     */
    function formatRUT(rut) {
        var clean = limpiarRUT(rut);
        if (clean.length < 2) return clean;

        var dv = clean.slice(-1);
        var cuerpo = clean.slice(0, -1);

        // Agregar puntos cada 3 dígitos desde la derecha
        var formatted = '';
        var count = 0;
        for (var i = cuerpo.length - 1; i >= 0; i--) {
            formatted = cuerpo[i] + formatted;
            count++;
            if (count % 3 === 0 && i > 0) {
                formatted = '.' + formatted;
            }
        }

        return formatted + '-' + dv;
    }

    // ───────────────────── TELÉFONO ─────────────────────

    /**
     * Valida teléfono móvil chileno: +56 9 XXXX XXXX
     */
    function validarTelefono(tel) {
        if (!tel) return false;
        var clean = String(tel).replace(/[\s\-\(\)]/g, '');
        // Aceptar +569XXXXXXXX (12 caracteres) o 569XXXXXXXX (11) o 9XXXXXXXX (9)
        return /^(\+?56)?9\d{8}$/.test(clean);
    }

    /**
     * Formatea teléfono: 912345678 → +56 9 1234 5678
     */
    function formatTelefono(tel) {
        if (!tel) return '';
        var clean = String(tel).replace(/[^\d]/g, '');

        // Quitar prefijo 56 si existe
        if (clean.length === 11 && clean.substring(0, 2) === '56') {
            clean = clean.substring(2);
        }

        // Debe quedar 9 dígitos empezando con 9
        if (clean.length !== 9 || clean[0] !== '9') return String(tel);

        return '+56 ' + clean[0] + ' ' + clean.substring(1, 5) + ' ' + clean.substring(5, 9);
    }

    // ───────────────────── EMAIL ─────────────────────

    /**
     * Valida formato de correo electrónico.
     */
    function validarEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    }

    // ───────────────────── MONEDA ─────────────────────

    /**
     * Entero → moneda chilena: 33000000 → '$ 33.000.000'
     */
    function formatMoneda(valor) {
        var num = parseInt(valor, 10);
        if (isNaN(num)) return '$ 0';
        var negative = num < 0;
        num = Math.abs(num);
        if (num > 0 && num < 1000) {
            num = num * 1000000;
        }
        var str = String(num);
        var formatted = '';
        var count = 0;
        for (var i = str.length - 1; i >= 0; i--) {
            formatted = str[i] + formatted;
            count++;
            if (count % 3 === 0 && i > 0) {
                formatted = '.' + formatted;
            }
        }
        return (negative ? '-' : '') + '$ ' + formatted;
    }

    /**
     * Moneda chilena → entero: '$ 33.000.000' → 33000000
     */
    function parseMoneda(str) {
        if (typeof str === 'number') return Math.round(str);
        if (!str) return 0;
        var clean = String(str).replace(/[^\d\-]/g, '');
        return parseInt(clean, 10) || 0;
    }

    // ───────────────────── FECHA ─────────────────────

    /**
     * Date/ISO → 'dd/mm/aaaa'
     */
    function formatFecha(dateOrISO) {
        if (!dateOrISO) return '';
        var d = (dateOrISO instanceof Date) ? dateOrISO : new Date(dateOrISO);
        if (isNaN(d.getTime())) return '';
        var dd = ('0' + d.getDate()).slice(-2);
        var mm = ('0' + (d.getMonth() + 1)).slice(-2);
        var yyyy = d.getFullYear();
        return dd + '/' + mm + '/' + yyyy;
    }

    /**
     * 'dd/mm/aaaa' → Date object
     */
    function parseFecha(str) {
        if (!str || typeof str !== 'string') return null;
        if (str.includes('-')) {
            var p = str.split('-');
            if (p.length === 3 && p[0].length === 4) {
                var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
                return isNaN(d.getTime()) ? null : d;
            }
        }
        var partes = str.split('/');
        if (partes.length !== 3) {
            partes = str.split('-');
        }
        if (partes.length !== 3) return null;
        var dd = parseInt(partes[0], 10);
        var mm = parseInt(partes[1], 10) - 1;
        var yyyy = parseInt(partes[2], 10);
        var d2 = new Date(yyyy, mm, dd);
        return isNaN(d2.getTime()) ? null : d2;
    }

    /**
     * Retorna la fecha de hoy como 'dd/mm/aaaa'.
     */
    function fechaHoy() {
        return formatFecha(new Date());
    }

    // ───────────────────── IDs ─────────────────────

    /**
     * Genera un ID aleatorio entero grande para evitar colisiones en base de datos distribuida/compartida.
     */
    function generarId(array) {
        var attempts = 0;
        var newId;
        var exists;
        
        do {
            // Rango de 32-bit entero firmado positivo: 10,000,000 a 2,000,000,000
            newId = Math.floor(Math.random() * (2000000000 - 10000000 + 1)) + 10000000;
            exists = false;
            if (array && array.length) {
                for (var i = 0; i < array.length; i++) {
                    var itemId = parseInt(array[i].id, 10);
                    if (itemId === newId) {
                        exists = true;
                        break;
                    }
                }
            }
            attempts++;
        } while (exists && attempts < 100);
        
        return newId;
    }

    // ───────────────────── TOAST ─────────────────────

    /**
     * Muestra notificación toast.
     * @param {string} msg  — Texto del mensaje
     * @param {string} type — 'success'|'error'|'warning'|'info'
     */
    function showToast(msg, type) {
        type = type || 'info';

        // Asegurar contenedor
        var container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText =
                'position:fixed;top:20px;right:20px;z-index:99999;' +
                'display:flex;flex-direction:column;gap:10px;pointer-events:none;';
            document.body.appendChild(container);
        }

        // Mapa de colores e íconos
        var config = {
            success: { bg: '#10b981', icon: 'fa-check-circle' },
            error:   { bg: '#ef4444', icon: 'fa-times-circle' },
            warning: { bg: '#f59e0b', icon: 'fa-exclamation-triangle' },
            info:    { bg: '#3b82f6', icon: 'fa-info-circle' }
        };
        var c = config[type] || config.info;

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.style.cssText =
            'pointer-events:auto;display:flex;align-items:center;gap:10px;' +
            'padding:14px 22px;border-radius:10px;color:#fff;font-size:14px;' +
            'font-family:Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);' +
            'backdrop-filter:blur(6px);background:' + c.bg + ';' +
            'animation:toastIn .35s ease;min-width:280px;max-width:420px;';

        toast.innerHTML = '<i class="fas ' + c.icon + '" style="font-size:18px"></i>' +
                          '<span>' + msg + '</span>';

        container.appendChild(toast);

        // Inyectar keyframes si no existen
        if (!document.getElementById('app5t-toast-keyframes')) {
            var style = document.createElement('style');
            style.id = 'app5t-toast-keyframes';
            style.textContent =
                '@keyframes toastIn{from{opacity:0;transform:translateX(60px)}' +
                'to{opacity:1;transform:translateX(0)}}' +
                '@keyframes toastOut{from{opacity:1;transform:translateX(0)}' +
                'to{opacity:0;transform:translateX(60px)}}';
            document.head.appendChild(style);
        }

        // Remover después de 4 s
        setTimeout(function () {
            toast.style.animation = 'toastOut .35s ease forwards';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 350);
        }, 4000);
    }

    // ───────────────────── NÚMEROS / NORMALIZACIÓN ─────────────────────

    /**
     * Extrae entero de cualquier formato: '$ 33.000.000' → 33000000
     */
    function sanitizeNumber(val) {
        if (typeof val === 'number') return Math.round(val);
        if (!val) return 0;
        var clean = String(val).replace(/[^\d]/g, '');
        return parseInt(clean, 10) || 0;
    }

    /**
     * Normaliza estado de propiedad (case-insensitive).
     * 'Vendida'→'Vendida', 'Reservada'→'Reservada', cualquier otro→'Disponible'
     */
    function normalizarEstado(estado) {
        if (!estado) return 'Disponible';
        var lower = String(estado).trim().toLowerCase();
        if (lower === 'vendida') return 'Vendida';
        if (lower === 'reservada') return 'Reservada';
        return 'Disponible';
    }

    /**
     * Formatea superficie a unidad de mil con punto y 1 decimal con coma: 5000.2 ó 52002 → '5.000,2 m²' / '5.200,2 m²'
     */
    function formatSuperficie(val) {
        if (val === null || val === undefined || val === '') return '-';
        var num;
        if (typeof val === 'number') {
            num = val;
        } else {
            var str = String(val).trim().replace(/m[2²]/gi, '').trim();
            if ((str.match(/\./g) || []).length === 2) {
                var firstDot = str.indexOf('.');
                var lastDot = str.lastIndexOf('.');
                str = str.substring(0, firstDot) + str.substring(firstDot + 1, lastDot) + '.' + str.substring(lastDot + 1);
            } else if (str.includes(',') && str.includes('.')) {
                str = str.replace(/\./g, '').replace(',', '.');
            } else if (str.includes(',')) {
                str = str.replace(',', '.');
            } else if (str.includes('.')) {
                var parts = str.split('.');
                if (parts.length === 2 && parts[1].length === 3) {
                    str = parts[0] + parts[1];
                }
            }
            num = parseFloat(str);
        }
        if (isNaN(num)) return String(val);

        // Si viene en hectáreas o abreviado menor a 100 (ej: 5 ó 5.0 → 5000)
        if (num > 0 && num < 100) {
            num = num * 1000;
        }
        // Si el valor viene en decenas de mil (5 dígitos ej: 52002 o 50002 en vez de 5200.2 ó 5000.2)
        // Las parcelas son unidades de mil (alrededor de 5.000 m2), por lo que se ajusta a unidad de mil con 1 decimal
        else if (num >= 10000 && num < 100000) {
            num = num / 10;
        }

        var fixed = num.toFixed(1).split('.');
        var entero = fixed[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return entero + ',' + fixed[1] + ' m²';
    }

    /**
     * Parsea superficie a número en unidad de mil: '5.000,2 m2' ó '5.022.5' → 5000.2 ó 5022.5
     */
    function parsearSuperficie(str) {
        if (typeof str === 'number') {
            var n = str;
            if (n > 0 && n < 100) n = n * 1000;
            else if (n >= 10000 && n < 100000) n = n / 10;
            return Math.round(n * 10) / 10;
        }
        if (!str) return 0;
        var s = String(str).trim().replace(/m[2²]/gi, '').trim();
        if ((s.match(/\./g) || []).length === 2) {
            var firstDot = s.indexOf('.');
            var secondDot = s.lastIndexOf('.');
            s = s.substring(0, firstDot) + s.substring(firstDot + 1, secondDot) + '.' + s.substring(secondDot + 1);
        } else if (s.includes(',') && s.includes('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (s.includes(',')) {
            s = s.replace(',', '.');
        } else if (s.includes('.')) {
            var parts = s.split('.');
            if (parts.length === 2 && parts[1].length === 3) {
                s = parts[0] + parts[1];
            }
        }
        var num = parseFloat(s);
        if (isNaN(num)) return 0;
        if (num > 0 && num < 100) num = num * 1000;
        else if (num >= 10000 && num < 100000) num = num / 10;
        return Math.round(num * 10) / 10;
    }

    // ───────────────────── API PÚBLICA ─────────────────────

    return {
        validarRUT:        validarRUT,
        formatRUT:         formatRUT,
        limpiarRUT:        limpiarRUT,
        validarTelefono:   validarTelefono,
        formatTelefono:    formatTelefono,
        validarEmail:      validarEmail,
        formatMoneda:      formatMoneda,
        parseMoneda:       parseMoneda,
        formatFecha:       formatFecha,
        parseFecha:        parseFecha,
        fechaHoy:          fechaHoy,
        generarId:         generarId,
        showToast:         showToast,
        sanitizeNumber:    sanitizeNumber,
        normalizarEstado:  normalizarEstado,
        parsearSuperficie: parsearSuperficie,
        formatSuperficie:  formatSuperficie
    };
})();

