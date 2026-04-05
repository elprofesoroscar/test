/**
 * Calendario de disponibilidad.
 * - Acepta export JSON de phpMyAdmin (tablas clases + notashoraslibres) o JSON simple { eventos: [{inicio, fin}] }.
 * - Prueba data/agenda.json y data/Agenda.json (GitHub Pages distingue mayúsculas).
 * - Fecha "Actualizado": cabecera HTTP Last-Modified del archivo si existe; si no, campo actualizado del JSON simple.
 */
(function () {
  'use strict';

  var WHATSAPP = '34644719635';
  var DATA_URLS = ['data/agenda.json', 'data/Agenda.json'];
  var HOURS = [];
  for (var h = 7; h <= 22; h++) HOURS.push(h);

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateKeyLocal(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function startOfMonday(ref) {
    var d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0);
  }

  function isTeachingWindow(date, hour) {
    var dow = date.getDay();
    var isWeekday = dow >= 1 && dow <= 5;
    var isSat = dow === 6;
    var isSun = dow === 0;

    if (isWeekday) {
      if (hour >= 16 && hour < 18) return true;
      if (hour >= 19 && hour < 22) return true;
      return false;
    }
    if (isSat) {
      if (hour >= 9 && hour < 12) return true;
      if (hour >= 19 && hour < 22) return true;
      return false;
    }
    if (isSun) {
      if (hour >= 9 && hour < 12) return true;
      return false;
    }
    return false;
  }

  function slotRangeLocal(date, hour) {
    var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0);
    var end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0, 0, 0);
    return { start: start, end: end };
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && aEnd > bStart;
  }

  function hasBlockingBlock(date, hour, blocks) {
    if (!blocks || !blocks.length) return false;
    var slot = slotRangeLocal(date, hour);
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (overlaps(slot.start, slot.end, b.start, b.end)) return true;
    }
    return false;
  }

  function slotState(date, hour, blocks) {
    if (!isTeachingWindow(date, hour)) return 'fuera';
    if (hasBlockingBlock(date, hour, blocks)) return 'ocupado';
    return 'libre';
  }

  function parseDateTimeLocal(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    var p = String(dateStr).split('-');
    var t = String(timeStr).split(':');
    if (p.length < 3) return null;
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var d = parseInt(p[2], 10);
    var h = parseInt(t[0], 10);
    var min = parseInt(t[1] != null ? t[1] : '0', 10) || 0;
    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h)) return null;
    return new Date(y, m, d, h, min, 0, 0);
  }

  function isPhpMyAdminExport(data) {
    if (!Array.isArray(data) || !data.length || !data[0] || data[0].type !== 'header') return false;
    var c = String(data[0].comment || '').toLowerCase();
    if (c.indexOf('phpmyadmin') !== -1) return true;
    for (var i = 0; i < data.length; i++) {
      var it = data[i];
      if (it && it.type === 'table' && (it.name === 'clases' || it.name === 'notashoraslibres')) return true;
    }
    return false;
  }

  function extractBlocksFromPhpMyAdmin(arr) {
    var blocks = [];
    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if (!item || item.type !== 'table' || !Array.isArray(item.data)) continue;

      if (item.name === 'clases') {
        item.data.forEach(function (row) {
          var s = parseDateTimeLocal(row.Dia_clase, row.Hora_clase);
          if (!s) return;
          var e = new Date(s.getTime() + 60 * 60 * 1000);
          blocks.push({ start: s, end: e });
        });
      }

      if (item.name === 'notashoraslibres') {
        item.data.forEach(function (row) {
          var s = parseDateTimeLocal(row.fecha, row.hora);
          if (!s) return;
          var e = new Date(s.getTime() + 60 * 60 * 1000);
          blocks.push({ start: s, end: e });
        });
      }
    }
    return blocks;
  }

  function extractBlocksFromSimpleJson(data) {
    var blocks = [];
    if (!data.eventos || !Array.isArray(data.eventos)) return blocks;
    data.eventos.forEach(function (ev) {
      if (!ev.inicio || !ev.fin) return;
      var s = new Date(ev.inicio);
      var e = new Date(ev.fin);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) blocks.push({ start: s, end: e });
    });
    return blocks;
  }

  function loadBlocks(data) {
    if (isPhpMyAdminExport(data)) return extractBlocksFromPhpMyAdmin(data);
    return extractBlocksFromSimpleJson(data);
  }

  /** Solo bloques que pueden solapar las dos semanas mostradas (rendimiento). */
  function filterBlocksForWeeks(blocks, mon0) {
    var rangeStart = new Date(mon0.getFullYear(), mon0.getMonth(), mon0.getDate(), 6, 0, 0, 0);
    var lastDay = addDays(mon0, 13);
    var rangeEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 0, 0, 0);
    return blocks.filter(function (b) {
      return b.end > rangeStart && b.start < rangeEnd;
    });
  }

  function formatDayHeader(d) {
    var w = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()];
    return w + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
  }

  function formatSlotLabelLong(d, hour) {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ', ' + pad2(hour) + ':00–' + pad2(hour + 1) + ':00 (hora peninsular)';
  }

  function formatFechaHumana(d) {
    if (!d || isNaN(d.getTime())) return null;
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function formatActualizadoFromString(str) {
    if (!str) return null;
    var p = str.split('-');
    if (p.length !== 3) return str;
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var d = parseInt(p[2], 10);
    var m = parseInt(p[1], 10) - 1;
    var y = parseInt(p[0], 10);
    return d + ' de ' + meses[m] + ' de ' + y;
  }

  /** "YYYY-MM-DD HH:MM:SS" en hora local del navegador */
  function parseSqlDateTime(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    var d = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      parseInt(m[6], 10)
    );
    return isNaN(d.getTime()) ? null : d;
  }

  /** Si no hay Last-Modified HTTP, aproximación con la última fecha del propio export phpMyAdmin. */
  function extractLatestActivityFromExport(arr) {
    if (!Array.isArray(arr)) return null;
    var max = null;
    function bump(s) {
      var d = parseSqlDateTime(s);
      if (d && (!max || d > max)) max = d;
    }
    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if (!item || item.type !== 'table' || !Array.isArray(item.data)) continue;
      if (item.name === 'notashoraslibres') {
        item.data.forEach(function (row) {
          bump(row.created_at);
        });
      }
      if (item.name === 'historial') {
        item.data.forEach(function (row) {
          bump(row.Fecha);
        });
      }
    }
    return max;
  }

  function openWhatsApp(text) {
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank');
  }

  function renderWeek(container, monday, blocks, weekLabel) {
    var todayKey = dateKeyLocal(new Date());
    var wrap = document.createElement('div');
    wrap.className = 'agenda-week-wrap';

    var title = document.createElement('h3');
    title.className = 'agenda-week-title';
    title.textContent = weekLabel;
    wrap.appendChild(title);

    var scroll = document.createElement('div');
    scroll.className = 'agenda-scroll';
    var table = document.createElement('table');
    table.className = 'agenda-table';
    table.setAttribute('role', 'grid');

    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    var corner = document.createElement('th');
    corner.className = 'agenda-corner';
    corner.textContent = '';
    hr.appendChild(corner);
    for (var di = 0; di < 7; di++) {
      var day = addDays(monday, di);
      var th = document.createElement('th');
      th.className = 'agenda-day-head';
      if (dateKeyLocal(day) === todayKey) th.classList.add('agenda-day-head--today');
      th.textContent = formatDayHeader(day);
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (var hi = 0; hi < HOURS.length; hi++) {
      var hour = HOURS[hi];
      var tr = document.createElement('tr');
      var thh = document.createElement('th');
      thh.className = 'agenda-hour';
      thh.textContent = pad2(hour) + ':00';
      tr.appendChild(thh);

      for (var dj = 0; dj < 7; dj++) {
        var day = addDays(monday, dj);
        var state = slotState(day, hour, blocks);
        var td = document.createElement('td');
        td.className = 'agenda-cell';

        var inner = document.createElement('div');
        inner.className = 'agenda-slot agenda-slot--' + state;
        if (dateKeyLocal(day) === todayKey) inner.classList.add('agenda-slot--today-col');

        var timeSmall = document.createElement('span');
        timeSmall.className = 'agenda-slot-time';
        timeSmall.textContent = pad2(hour) + ':00';

        var label = document.createElement('span');
        label.className = 'agenda-slot-label';

        if (state === 'libre') {
          label.textContent = 'Libre';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'agenda-slot-btn';
          btn.setAttribute('aria-label', 'Reservar hueco libre el ' + formatSlotLabelLong(day, hour));
          btn.appendChild(timeSmall);
          btn.appendChild(label);
          btn.addEventListener(
            'click',
            (function (dCopy, hCopy) {
              return function () {
                openModalLibre(dCopy, hCopy);
              };
            })(new Date(day.getTime()), hour)
          );
          inner.appendChild(btn);
        } else if (state === 'ocupado') {
          label.textContent = 'Ocupado';
          inner.appendChild(timeSmall);
          inner.appendChild(label);
        } else {
          label.textContent = 'Fuera de franja';
          var btnF = document.createElement('button');
          btnF.type = 'button';
          btnF.className = 'agenda-slot-btn agenda-slot-btn--fuera';
          btnF.setAttribute('aria-label', 'Consultar disponibilidad excepcional el ' + formatSlotLabelLong(day, hour));
          btnF.appendChild(timeSmall);
          btnF.appendChild(label);
          btnF.addEventListener(
            'click',
            (function (dCopy, hCopy) {
              return function () {
                var msg =
                  'Hola Oscar, te escribo para consultar si hubiera posibilidad de clase fuera de tu franja habitual (caso urgente o excepcional).\n\n' +
                  'Día y hora de interés: ' +
                  formatSlotLabelLong(dCopy, hCopy) +
                  '\n\nQuedo a la espera. ¡Gracias!';
                openWhatsApp(msg);
              };
            })(new Date(day.getTime()), hour)
          );
          inner.appendChild(btnF);
        }

        td.appendChild(inner);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    wrap.appendChild(scroll);
    container.appendChild(wrap);
  }

  function openModalLibre(day, hour) {
    var modal = document.getElementById('modalSlotLibre');
    if (!modal) return;
    document.getElementById('slotLibreContext').value = formatSlotLabelLong(day, hour);
    document.getElementById('slotLibreNombre').value = '';
    document.getElementById('slotLibreAsignatura').value = '';
    document.getElementById('slotLibreNivel').value = '';
    document.getElementById('slotLibreAlumno').value = '';
    modal.style.display = 'block';
    document.getElementById('slotLibreNombre').focus();
  }

  window.closeModalSlotLibre = function () {
    var modal = document.getElementById('modalSlotLibre');
    if (modal) modal.style.display = 'none';
  };

  window.sendWhatsAppSlotLibre = function () {
    var ctx = document.getElementById('slotLibreContext').value;
    var nombre = document.getElementById('slotLibreNombre').value.trim();
    var asig = document.getElementById('slotLibreAsignatura').value.trim();
    var nivel = document.getElementById('slotLibreNivel').value.trim();
    var alumno = document.getElementById('slotLibreAlumno').value.trim();
    if (!nombre || !asig || !nivel || !alumno) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    var msg =
      'Hola Oscar, quiero solicitar un hueco libre en tu calendario.\n\n' +
      'Hueco: ' +
      ctx +
      '\n\nNombre (persona de contacto): ' +
      nombre +
      '\nAsignatura: ' +
      asig +
      '\nNivel: ' +
      nivel +
      '\nNombre del alumno: ' +
      alumno +
      '\n\nGracias.';
    openWhatsApp(msg);
    window.closeModalSlotLibre();
  };

  function fetchFirstAvailable(urls, index, callback) {
    if (index >= urls.length) {
      callback(new Error('none'));
      return;
    }
    var url = urls[index];
    fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('status');
        var lastModifiedHeader = r.headers.get('Last-Modified');
        var lastModDate = null;
        if (lastModifiedHeader) {
          var parsed = new Date(lastModifiedHeader);
          if (!isNaN(parsed.getTime())) lastModDate = parsed;
        }
        return r.json().then(function (data) {
          return { data: data, lastModDate: lastModDate, usedUrl: url };
        });
      })
      .then(function (result) {
        callback(null, result);
      })
      .catch(function () {
        fetchFirstAvailable(urls, index + 1, callback);
      });
  }

  function setActualizadoText(el, lastModDate, jsonData, exportArray) {
    if (!el) return;
    var line = null;
    if (lastModDate) {
      line = 'Actualizado el ' + formatFechaHumana(lastModDate) + ' (última modificación del archivo en el servidor).';
    } else if (jsonData && jsonData.actualizado) {
      line = 'Actualizado el ' + (formatActualizadoFromString(jsonData.actualizado) || jsonData.actualizado) + '.';
    } else if (exportArray && isPhpMyAdminExport(exportArray)) {
      var approx = extractLatestActivityFromExport(exportArray);
      if (approx) {
        line =
          'Última actividad reflejada en esta exportación: ' +
          formatFechaHumana(approx) +
          ' (según fechas en notas o historial; el navegador no recibió la fecha de modificación del archivo).';
      } else {
        line =
          'Datos cargados desde la exportación phpMyAdmin. Para ver la fecha de subida del archivo, publica en GitHub Pages o un hosting que envíe la cabecera «Last-Modified».';
      }
    } else {
      line =
        'Si no aparece fecha arriba, el servidor no envía la hora de modificación del JSON; puedes añadir el campo "actualizado" en el archivo.';
    }
    el.textContent = line;
    el.hidden = false;
  }

  window.initAgenda = function () {
    var root = document.getElementById('agenda-calendars');
    var actualizadoEl = document.getElementById('agenda-actualizado');
    if (!root) return;

    root.innerHTML = '<p class="agenda-loading">Cargando disponibilidad…</p>';

    fetchFirstAvailable(DATA_URLS, 0, function (err, result) {
      if (err || !result) {
        root.innerHTML =
          '<p class="agenda-error">No se pudo cargar el calendario. Sube al repositorio <code>data/Agenda.json</code> (export phpMyAdmin) o <code>data/agenda.json</code>. En GitHub Pages el nombre debe coincidir exactamente, incluidas mayúsculas. Si abres la página como archivo local (<code>file://</code>), usa un servidor local o publica en GitHub.</p>';
        if (actualizadoEl) actualizadoEl.hidden = true;
        return;
      }

      var data = result.data;
      var allBlocks = loadBlocks(data);
      var mon0 = startOfMonday(new Date());
      var mon1 = addDays(mon0, 7);
      var blocks = filterBlocksForWeeks(allBlocks, mon0);

      root.innerHTML = '';
      renderWeek(root, mon0, blocks, 'Semana actual');
      renderWeek(root, mon1, blocks, 'Semana siguiente');

      setActualizadoText(actualizadoEl, result.lastModDate, isPhpMyAdminExport(data) ? null : data, isPhpMyAdminExport(data) ? data : null);
    });
  };
})();
