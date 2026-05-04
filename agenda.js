(function () {
  'use strict';

  var WHATSAPP = '34644719635';
  var DATA_URLS = [
    'https://script.google.com/macros/s/AKfycbwG8DO33S-zBNdRAAfuws1BF9kuLhyzV7HpzWpj4-eAtk4RJ-lcrsVdKKDSoo3tltrkeg/exec',
    'data/Agenda.json',
    'data/agenda.json'
  ];
  var HOURS = [];
  for (var h = 7; h <= 22; h++) HOURS.push(h);

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

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
    if (dow >= 1 && dow <= 5) {
      return (hour >= 16 && hour < 18) || (hour >= 19 && hour < 22);
    }
    if (dow === 6) {
      return (hour >= 9 && hour < 12) || (hour >= 19 && hour < 22);
    }
    if (dow === 0) {
      return hour >= 9 && hour < 12;
    }
    return false;
  }

  function slotRangeLocal(date, hour) {
    return {
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0),
      end:   new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1, 0, 0, 0)
    };
  }

  function overlaps(aS, aE, bS, bE) { return aS < bE && aE > bS; }

  function hasBlockingBlock(date, hour, blocks) {
    if (!blocks || !blocks.length) return false;
    var slot = slotRangeLocal(date, hour);
    for (var i = 0; i < blocks.length; i++) {
      if (overlaps(slot.start, slot.end, blocks[i].start, blocks[i].end)) return true;
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
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
    var hh = parseInt(t[0], 10), min = parseInt(t[1] != null ? t[1] : '0', 10) || 0;
    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(hh)) return null;
    return new Date(y, m, d, hh, min, 0, 0);
  }

  function parseSqlDateTime(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    return isNaN(d.getTime()) ? null : d;
  }

  function isPhpMyAdminExport(data) {
    if (!Array.isArray(data) || !data.length || !data[0] || data[0].type !== 'header') return false;
    if (String(data[0].comment || '').toLowerCase().indexOf('phpmyadmin') !== -1) return true;
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
          if (s) blocks.push({ start: s, end: new Date(s.getTime() + 3600000) });
        });
      }
      if (item.name === 'notashoraslibres') {
        item.data.forEach(function (row) {
          var s = parseDateTimeLocal(row.fecha, row.hora);
          if (s) blocks.push({ start: s, end: new Date(s.getTime() + 3600000) });
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
      var s = parseSqlDateTime(String(ev.inicio).replace('T', ' '));
      var e = parseSqlDateTime(String(ev.fin).replace('T', ' '));
      if (s && e) blocks.push({ start: s, end: e });
    });
    return blocks;
  }

  function loadBlocks(data) {
    return isPhpMyAdminExport(data)
      ? extractBlocksFromPhpMyAdmin(data)
      : extractBlocksFromSimpleJson(data);
  }

  function filterBlocksForWeeks(blocks, mon0) {
    var rs = new Date(mon0.getFullYear(), mon0.getMonth(), mon0.getDate(), 6, 0, 0, 0);
    var last = addDays(mon0, 13);
    var re = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 0, 0, 0);
    return blocks.filter(function (b) { return b.end > rs && b.start < re; });
  }

  function formatDayHeader(d) {
    return ['dom','lun','mar','mié','jue','vie','sáb'][d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
  }

  function formatSlotLabelLong(d, hour) {
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()] + ', ' + pad2(hour) + ':00–' + pad2(hour + 1) + ':00 (hora peninsular)';
  }

  function formatFechaHumana(d) {
    if (!d || isNaN(d.getTime())) return null;
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function formatActualizadoFromString(str) {
    if (!str) return null;
    var p = str.split('-'); if (p.length !== 3) return str;
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return parseInt(p[2], 10) + ' de ' + meses[parseInt(p[1], 10) - 1] + ' de ' + parseInt(p[0], 10);
  }

  function extractLatestActivityFromExport(arr) {
    if (!Array.isArray(arr)) return null;
    var max = null;
    function bump(s) { var d = parseSqlDateTime(s); if (d && (!max || d > max)) max = d; }
    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if (!item || item.type !== 'table' || !Array.isArray(item.data)) continue;
      if (item.name === 'notashoraslibres') item.data.forEach(function (r) { bump(r.created_at); });
      if (item.name === 'historial')        item.data.forEach(function (r) { bump(r.Fecha); });
    }
    return max;
  }

  function openWhatsApp(text) {
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text), '_blank');
  }

  function renderWeek(container, monday, blocks, weekLabel) {
    var todayKey = dateKeyLocal(new Date());
    var wrap = document.createElement('div'); wrap.className = 'agenda-week-wrap';
    var title = document.createElement('h3'); title.className = 'agenda-week-title'; title.textContent = weekLabel;
    wrap.appendChild(title);

    var scroll = document.createElement('div'); scroll.className = 'agenda-scroll';
    var table = document.createElement('table'); table.className = 'agenda-table'; table.setAttribute('role', 'grid');

    var thead = document.createElement('thead'), hr = document.createElement('tr');
    var corner = document.createElement('th'); corner.className = 'agenda-corner'; hr.appendChild(corner);

    for (var di = 0; di < 7; di++) {
      var day = addDays(monday, di), th = document.createElement('th');
      th.className = 'agenda-day-head';
      if (dateKeyLocal(day) === todayKey) th.classList.add('agenda-day-head--today');
      th.textContent = formatDayHeader(day);
      hr.appendChild(th);
    }
    thead.appendChild(hr); table.appendChild(thead);

    var tbody = document.createElement('tbody');
    for (var hi = 0; hi < HOURS.length; hi++) {
      var hour = HOURS[hi];
      var tr = document.createElement('tr');
      var thh = document.createElement('th');
      thh.className = 'agenda-hour'; thh.textContent = pad2(hour) + ':00'; tr.appendChild(thh);

      var allFuera = true;
      for (var dj = 0; dj < 7; dj++) {
        var d2 = addDays(monday, dj);
        var state = slotState(d2, hour, blocks);
        if (state !== 'fuera') allFuera = false;

        var td = document.createElement('td'); td.className = 'agenda-cell';
        var inner = document.createElement('div'); inner.className = 'agenda-slot agenda-slot--' + state;
        if (dateKeyLocal(d2) === todayKey) inner.classList.add('agenda-slot--today-col');

        var timeSmall = document.createElement('span'); timeSmall.className = 'agenda-slot-time'; timeSmall.textContent = pad2(hour) + ':00';
        var label = document.createElement('span'); label.className = 'agenda-slot-label';

        if (state === 'libre') {
          label.textContent = 'Libre';
          var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'agenda-slot-btn';
          btn.setAttribute('aria-label', 'Reservar hueco libre el ' + formatSlotLabelLong(d2, hour));
          btn.appendChild(timeSmall); btn.appendChild(label);
          btn.addEventListener('click', (function (dC, hC) {
            return function () { openModalLibre(dC, hC); };
          })(new Date(d2.getTime()), hour));
          inner.appendChild(btn);
        } else if (state === 'ocupado') {
          label.textContent = 'Ocupado';
          inner.appendChild(timeSmall); inner.appendChild(label);
        } else {
          label.textContent = '';
          var btnF = document.createElement('button'); btnF.type = 'button'; btnF.className = 'agenda-slot-btn agenda-slot-btn--fuera';
          btnF.setAttribute('aria-label', 'Consultar disponibilidad el ' + formatSlotLabelLong(d2, hour));
          btnF.appendChild(timeSmall); btnF.appendChild(label);
          btnF.addEventListener('click', (function (dC, hC) {
            return function () {
              var msg = 'Hola Oscar, te escribo para consultar si hubiera posibilidad de clase fuera de tu franja habitual.\n\nDía y hora de interés: ' + formatSlotLabelLong(dC, hC) + '\n\nQuedo a la espera. ¡Gracias!';
              openWhatsApp(msg);
            };
          })(new Date(d2.getTime()), hour));
          inner.appendChild(btnF);
        }

        td.appendChild(inner); tr.appendChild(td);
      }
      if (allFuera) tr.classList.add('agenda-row--all-fuera');
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); scroll.appendChild(table); wrap.appendChild(scroll); container.appendChild(wrap);
  }

  function openModalLibre(day, hour) {
    var modal = document.getElementById('modalSlotLibre'); if (!modal) return;
    var ctx = formatSlotLabelLong(day, hour);
    document.getElementById('slotLibreContext').value = ctx;
    var lbl = document.getElementById('slotLibreContextLabel'); if (lbl) lbl.textContent = ctx;
    document.getElementById('slotLibreNombre').value = '';
    document.getElementById('slotLibreAsignatura').value = '';
    document.getElementById('slotLibreNivel').value = '';
    document.getElementById('slotLibreAlumno').value = '';
    modal.style.display = 'block'; modal.setAttribute('aria-hidden', 'false');
    document.getElementById('slotLibreNombre').focus();
  }

  window.closeModalSlotLibre = function () {
    var m = document.getElementById('modalSlotLibre');
    if (m) { m.style.display = 'none'; m.setAttribute('aria-hidden', 'true'); }
  };

  window.sendWhatsAppSlotLibre = function () {
    var ctx    = document.getElementById('slotLibreContext').value;
    var nombre = document.getElementById('slotLibreNombre').value.trim();
    var asig   = document.getElementById('slotLibreAsignatura').value.trim();
    var nivel  = document.getElementById('slotLibreNivel').value.trim();
    var alumno = document.getElementById('slotLibreAlumno').value.trim();
    if (!nombre || !asig || !nivel || !alumno) { alert('Por favor, completa todos los campos.'); return; }
    var msg = 'Hola Oscar, quiero solicitar un hueco libre en tu calendario.\n\nHueco: ' + ctx +
              '\n\nNombre (persona de contacto): ' + nombre +
              '\nAsignatura: ' + asig +
              '\nNivel: ' + nivel +
              '\nNombre del alumno: ' + alumno + '\n\nGracias.';
    openWhatsApp(msg);
    window.closeModalSlotLibre();
  };

  function fetchFirstAvailable(urls, idx, cb) {
    if (idx >= urls.length) { cb(new Error('none')); return; }
    fetch(urls[idx], { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('status');
        var lm = r.headers.get('Last-Modified');
        var lastModDate = null;
        if (lm) { var p = new Date(lm); if (!isNaN(p.getTime())) lastModDate = p; }
        return r.json().then(function (data) { return { data: data, lastModDate: lastModDate, usedUrl: urls[idx] }; });
      })
      .then(function (res) { cb(null, res); })
      .catch(function () { fetchFirstAvailable(urls, idx + 1, cb); });
  }

  function setActualizadoText(el, lastModDate, jsonData, exportArray) {
    if (!el) return;
    var line = null;
    if (lastModDate) {
      line = 'Actualizado el ' + formatFechaHumana(lastModDate) + '.';
    } else if (jsonData && jsonData.actualizado) {
      line = 'Actualizado el ' + (formatActualizadoFromString(jsonData.actualizado) || jsonData.actualizado) + '.';
    } else if (exportArray && isPhpMyAdminExport(exportArray)) {
      var approx = extractLatestActivityFromExport(exportArray);
      line = approx ? 'Última actividad reflejada: ' + formatFechaHumana(approx) + '.' : '';
    }
    if (line) { el.textContent = line; el.hidden = false; } else { el.hidden = true; }
  }

  window.initAgenda = function () {
    var root = document.getElementById('agenda-calendars');
    var actualizadoEl = document.getElementById('agenda-actualizado');
    if (!root) return;
    root.innerHTML = '<p class="agenda-loading">Cargando disponibilidad…</p>';

    fetchFirstAvailable(DATA_URLS, 0, function (err, result) {
      if (err || !result) {
        root.innerHTML = '<p class="agenda-error">No se pudo cargar el calendario. Si abres en local, usa un servidor estático (XAMPP, Live Server, etc.).</p>';
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

      setActualizadoText(
        actualizadoEl,
        result.lastModDate,
        isPhpMyAdminExport(data) ? null : data,
        isPhpMyAdminExport(data) ? data : null
      );
    });
  };

})();
