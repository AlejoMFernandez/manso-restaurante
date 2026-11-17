// Manso Restaurante · demo

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const raiz = document.documentElement;
const params = new URLSearchParams(location.search);
const finoMouse = matchMedia('(hover:hover) and (pointer:fine)').matches;
const sinMov = matchMedia('(prefers-reduced-motion:reduce)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pesos = n => n == null ? 'Consultar' : '$' + Number(n).toLocaleString('es-AR');

/* ---------- hora de Nordelta (?hora=HH:MM y ?dia=0-6 para mostrarla en otro momento) ---------- */
function ahoraBA() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  let h = +p.hour % 24, m = +p.minute;
  const q = params.get('hora'); if (q && /^\d{1,2}:\d{2}$/.test(q)) [h, m] = q.split(':').map(Number);
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let dia = dias[p.weekday]; const qd = params.get('dia'); if (qd !== null && /^[0-6]$/.test(qd)) dia = +qd;
  return { y: +p.year, mo: +p.month, d: +p.day, h, m, min: h * 60 + m, dia };
}
const T = ahoraBA();
const hhmm = min => { min = ((Math.round(min) % 1440) + 1440) % 1440; return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`; };

/* horarios reales: lun cerrado · mar a vie 12:00 a 16:00 y 20:00 a 24:00 · sáb, dom y feriados 12:00 a 24:00 */
const TURNOS = { 0: [[720, 1440]], 1: [], 2: [[720, 960], [1200, 1440]], 3: [[720, 960], [1200, 1440]], 4: [[720, 960], [1200, 1440]], 5: [[720, 960], [1200, 1440]], 6: [[720, 1440]] };
function estado() {
  const hoy = TURNOS[T.dia];
  const abierto = hoy.find(([a, c]) => T.min >= a && T.min < c);
  if (abierto) return { abierto: true, txt: `Abierto ahora · hasta las ${abierto[1] === 1440 ? '24:00' : hhmm(abierto[1])} hs` };
  const prox = hoy.find(([a]) => a > T.min);
  if (prox) return { abierto: false, txt: `Hoy prendemos los fuegos a las ${hhmm(prox[0])} hs` };
  if (T.dia === 1) return { abierto: false, txt: 'Los lunes nuestros fuegos descansan' };
  const man = TURNOS[(T.dia + 1) % 7];
  return { abierto: false, txt: man.length ? `Mañana abrimos a las ${hhmm(man[0][0])} hs` : 'Mañana lunes nuestros fuegos descansan' };
}
$$('[data-estado]').forEach(el => { const e = estado(); el.querySelector('span').textContent = e.txt; el.classList.toggle('cerrado', !e.abierto); });

/* ---------- sol sobre el lago (NOAA simplificado; Manso: -34.4303, -58.6399; UTC-3) ---------- */
function sol(y, mo, d) {
  const n = Math.floor((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 0)) / 864e5);
  const g = 2 * Math.PI / 365 * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const de = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const la = -34.4303 * Math.PI / 180, lo = -58.6399;
  const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(la) * Math.cos(de)) - Math.tan(la) * Math.tan(de)) * 180 / Math.PI;
  return { sale: 720 - 4 * (lo + ha) - eq - 180, pone: 720 - 4 * (lo - ha) - eq - 180 };
}
const SOL = sol(T.y, T.mo, T.d);
$$('[data-pone]').forEach(el => { el.textContent = hhmm(SOL.pone); });
$$('[data-pone-txt]').forEach(el => { el.textContent = T.min > SOL.pone ? 'Hoy el sol se puso sobre el lago a esa hora.' : 'Hoy el sol se pone sobre el lago a esa hora.'; });

/* ---------- fotos: estado de carga ---------- */
$$('.ft img').forEach(img => { const ok = () => img.closest('.ft').classList.add('ok'); img.complete && img.naturalWidth ? ok() : img.addEventListener('load', ok, { once: true }); });

/* ---------- intro: el trazo dibuja el horizonte, el logo se entinta, la línea se abre ---------- */
const intro = $('.intro');
function abrir() {
  if (raiz.classList.contains('listo')) return;
  intro?.classList.add('abre');
  raiz.classList.add('listo'); raiz.classList.remove('sin-scroll');
  setTimeout(() => { raiz.classList.remove('con-intro'); }, 950);
}
if (raiz.classList.contains('con-intro')) {
  const celu = innerWidth < 768;
  const minimo = new Promise(r => setTimeout(r, celu ? 1250 : 1700));
  const heroImg = $('[data-hero-img]');
  const foto = heroImg ? new Promise(r => (heroImg.complete ? r() : (heroImg.onload = heroImg.onerror = r))) : Promise.resolve();
  Promise.race([Promise.all([minimo, document.fonts.ready, foto]), new Promise(r => setTimeout(r, 2600))]).then(abrir);
} else raiz.classList.add('listo');

/* ---------- hero: el horizonte se mueve con el mouse (y con la hora) ---------- */
const hA = $('.hA');
if (hA) {
  const base = T.min > SOL.sale && T.min < SOL.pone - 30 ? 53 : 48;   // de día gana el lago, de noche el fuego
  hA.style.setProperty('--h', base + '%'); raiz.style.setProperty('--h0', base + '%');
  if (finoMouse && !sinMov) {
    let obj = base, act = base, raf = 0;
    const paso = () => { act += (obj - act) * .08; hA.style.setProperty('--h', act.toFixed(2) + '%'); raf = Math.abs(obj - act) > .05 ? requestAnimationFrame(paso) : 0; };
    hA.addEventListener('pointermove', e => { const r = hA.getBoundingClientRect(); obj = base + ((e.clientY - r.top) / r.height - .5) * 10; if (!raf) raf = requestAnimationFrame(paso); }, { passive: true });
    hA.addEventListener('pointerleave', () => { obj = base; if (!raf) raf = requestAnimationFrame(paso); });
  }
}

/* ---------- barra y menú ---------- */
const barra = $('.barra');
const hero = $('.hero');
if (barra && hero) new IntersectionObserver(([e]) => barra.classList.toggle('con-logo', !e.isIntersecting), { rootMargin: '-60% 0px 0px 0px' }).observe(hero);
const menu = $('.menu');
const btnMenu = $('.btn-menu');
const cerrarMenu = (foco = true) => { if (!menu.classList.contains('abierto')) return; menu.classList.remove('abierto'); menu.setAttribute('aria-hidden', 'true'); btnMenu.setAttribute('aria-expanded', 'false'); if (foco) btnMenu.focus(); };
btnMenu?.addEventListener('click', () => { menu.classList.add('abierto'); menu.setAttribute('aria-hidden', 'false'); btnMenu.setAttribute('aria-expanded', 'true'); setTimeout(() => $('.menu-x').focus(), 50); });
$('.menu-x')?.addEventListener('click', () => cerrarMenu());
$$('.menu nav a').forEach(a => a.addEventListener('click', () => cerrarMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });

/* ---------- entradas al hacer scroll ---------- */
// los .rv arrancan recortados a una línea (área cero): se observa su contenedor, nunca el elemento recortado
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const t = e.target; (t.matches('.rv,.rv-up') ? [t] : $$('.rv', t)).forEach(x => x.classList.add('visto')); if (t.matches('.rv-up')) t.classList.add('visto'); io.unobserve(t); } }), { threshold: .18 });
$$('.rv-up').forEach(el => io.observe(el));
const ioT = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('.rv', e.target).forEach(x => x.classList.add('visto')); ioT.unobserve(e.target); } }), { rootMargin: '0px 0px -30% 0px' });
new Set($$('.rv').map(el => el.parentElement)).forEach(p => ioT.observe(p));

/* ---------- la píldora del panel no tapa el hero, el WOW ni el gin ---------- */
{
  const vistos = new Set();
  const obs = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target)); raiz.classList.toggle('sin-pill', vistos.size > 0); }, { threshold: .25 });
  ['.hero', '.escena', '.gin-caja', '.carta', '.dia', '.llegar-ctas', '.pie'].forEach(s => { const el = $(s); if (el) obs.observe(el); });
}

/* =====================================================================
   KIT: carta, reservas, panel
   ===================================================================== */
// el kit se carga después de la intro y el hero: así la primera pantalla no espera sus módulos
const [{ initKit }, { popup }] = await Promise.all([import('../kit/kit.js?v=3'), import('../kit/core/ui.js?v=3')]);
const kit = await initKit({
  config: 'cliente.json',
  badge: innerWidth >= 768,   // en el celu el panel se ofrece en el menú y en el pie (la píldora tapaba links)
  imagenes: { lqip: 'img/lqip.json' },
  carta: {
    itemClass: 'it',
    template: (p, ctx) => `<div class="it-fila"><h3 class="it-n">${esc(p.nombre)}</h3><span class="it-p">${esc(ctx.money(p.precio) ?? 'Consultar')}</span></div>${p.descripcion ? `<p class="it-d">${esc(p.descripcion)}</p>` : ''}`,
  },
});
let PRODS = [];
try { PRODS = await kit.store.getProductos(); } catch (e) { console.warn('[manso] carta', e); }
const prod = (id) => PRODS.find(p => p.id === id && p.disponible !== false);

/* reservar con una nota ya escrita (lo anotado en el WOW o el gin tonic) */
function reservar(nota = '') {
  const api = kit.reservas?.abrir();
  if (!api || !nota) return;
  const ta = api.el.querySelector('textarea[name="comentario"]');
  if (ta) { ta.value = nota.slice(0, 280); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); }
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-reservar]')) { e.preventDefault(); cerrarMenu(false); reservar(); }
  if (e.target.closest('[data-atardecer]')) { e.preventDefault(); reservarAtardecer(); }
});
/* "Reservá para el atardecer": la franja de la tarde (sábados, domingos y feriados), en el próximo día que se pueda */
function reservarAtardecer() {
  const turnos = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
  const aMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const hora = turnos.filter(h => aMin(h) <= SOL.pone - 40).pop() || '19:30';
  const base = new Date(Date.UTC(T.y, T.mo - 1, T.d));
  let off = 0;
  for (; off < 8; off++) { const dow = (T.dia + off) % 7; if ((dow === 6 || dow === 0) && !(off === 0 && T.min > aMin(hora) - 60)) break; }
  const f = new Date(base.getTime() + off * 864e5).toISOString().slice(0, 10);
  const api = kit.reservas?.abrir({ fecha: f, hora, personas: 2 });
  const ta = api?.el.querySelector('textarea[name="comentario"]');
  if (ta) { ta.value = 'Venimos a ver el atardecer.'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
}

/* ---------- WOW: los cuatro fuegos ---------- */
const FUEGOS = {
  kamado: { n: 'Kamado', d: 'Horno de origen japonés hecho en barro y cerámica. Retiene calor y aromas mientras cocina, ahúma o asa: una carne llena de contrastes.', ids: ['ojo-bife', 't-bone', 'pinchos-bife', 'chorizo-kamado'] },
  josper: { n: 'Josper', d: 'Horno de origen español que se usa con brasa de distintas maderas. Logra un sellado perfecto: carne más jugosa y con mejor textura.', ids: ['bbq-ribs', 'pamplona-pollo', 'mollejas-josper', 'pizza-tomate'] },
  ganchos: { n: 'Ganchos', d: 'Asado lento, colgado frente a la leña y la salmuera. La carne queda súper jugosa y con un sabor levemente ahumado.', ids: ['costilla-centro', 'picana-compartir', 'picana'] },
  parrilla: { n: 'Parrilla', d: 'La nuestra, la argentina. También jugamos con diferentes maderas para lograr variedad de sabores y texturas.', ids: ['vacio', 'entrana', 'tira-banderita', 'pollo-deshuesado'] },
};
const SUB = { 'pizza-tomate': 'Pizzas, solo los domingos a la noche' };
const escena = $('.escena');
const anotados = new Map();
if (escena) {
  const ficha = $('.ficha', escena);
  const btns = $$('.fuego-btn', escena);
  const chispas = $('.chispas', escena);
  let actual = null;
  const pie = () => {
    const n = anotados.size;
    $('.ficha-pie span', ficha).textContent = n ? `${n} ${n === 1 ? 'anotado' : 'anotados'} para tu mesa` : 'Anotá lo que querés probar';
  };
  function chispear(btn) {
    if (sinMov) return;
    const r = btn.getBoundingClientRect(), re = escena.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const c = document.createElement('i'); c.className = 'chispa';
      c.style.left = (r.left - re.left + r.width * (.25 + Math.random() * .5)) + 'px';
      c.style.setProperty('--x', (Math.random() * 80 - 40) + 'px');
      c.style.setProperty('--t', (1.6 + Math.random() * 1.4) + 's');
      c.style.animationDelay = (Math.random() * .5) + 's';
      chispas.appendChild(c); setTimeout(() => c.remove(), 3600);
    }
  }
  function pintar(k) {
    const f = FUEGOS[k];
    $('h3', ficha).textContent = f.n;
    $('.ficha-desc', ficha).textContent = f.d;
    $('ul', ficha).innerHTML = f.ids.map(prod).filter(Boolean).slice(0, 4).map(p => {
      const on = anotados.has(p.id);
      const sub = SUB[p.id] || (p.descripcion || '').replace(/\.?\s*Con acompañamiento( a elección)?\.?/i, '').replace(/\.$/, '') || 'Con acompañamiento a elección';
      return `<li><span><b>${esc(SUB[p.id] ? 'Pizzas al josper' : p.nombre)}</b><small>${esc(sub)}</small></span><span class="pr">${SUB[p.id] ? 'desde ' : ''}${esc(pesos(p.precio))}</span><button class="mas${on ? ' on' : ''}" type="button" data-id="${esc(p.id)}" aria-pressed="${on}" aria-label="Anotar ${esc(p.nombre)} para tu reserva">${on ? '✓' : '+'}</button></li>`;
    }).join('');
    pie();
  }
  function prender(k, btn, chispas = true) {
    if (actual === k) return;
    const habia = actual;
    actual = k;
    escena.classList.add('prendida');
    btns.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    $$('.escena-fotos .ft', escena).forEach(ft => ft.classList.toggle('on', ft.dataset.f === k));
    const re = escena.getBoundingClientRect(), rb = btn.getBoundingClientRect();
    const cx = rb.left - re.left + rb.width / 2;
    const fx = Math.min(Math.max(cx, 224), re.width - 224);
    ficha.classList.remove('on');
    setTimeout(() => { pintar(k); ficha.style.setProperty('--fx', fx + 'px'); ficha.classList.add('on'); }, habia ? 180 : 0);
    if (chispas) chispear(btn);
  }
  // arranca prendido (nunca una caja negra): los ganchos; las chispas saltan cuando la escena entra en pantalla
  prender('ganchos', btns.find(b => b.dataset.f === 'ganchos'), false);
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { chispear(btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[2]); o.disconnect(); } }, { threshold: .45 }).observe(escena);
  btns.forEach(b => {
    b.addEventListener('click', () => prender(b.dataset.f, b));
    if (finoMouse) b.addEventListener('pointerenter', () => prender(b.dataset.f, b));
  });
  ficha.addEventListener('click', e => {
    const m = e.target.closest('.mas'); if (!m) return;
    const p = prod(m.dataset.id); if (!p) return;
    if (anotados.has(p.id)) anotados.delete(p.id); else anotados.set(p.id, SUB[p.id] ? 'Pizza (domingo a la noche)' : p.nombre);
    const on = anotados.has(p.id);
    m.classList.toggle('on', on); m.textContent = on ? '✓' : '+'; m.setAttribute('aria-pressed', String(on));
    m.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
    pie();
  });
  $('[data-reservar-anotados]', ficha).addEventListener('click', () => {
    reservar(anotados.size ? 'Queremos probar: ' + [...anotados.values()].join(', ') + '.' : '');
  });
  $('.ficha-x', ficha).addEventListener('click', () => { ficha.classList.remove('on'); escena.classList.remove('prendida'); btns.forEach(b => b.setAttribute('aria-pressed', 'false')); $$('.escena-fotos .ft', escena).forEach(ft => ft.classList.remove('on')); actual = null; });
  addEventListener('keydown', e => { if (e.key === 'Escape' && ficha.classList.contains('on') && !document.querySelector('.kit-pop')) $('.ficha-x', ficha).click(); });
}

/* ---------- Un día en Manso: arrastre con mouse, flechas y el sol que avanza ---------- */
const pista = $('.dia-pista');
if (pista) {
  const punto = $('.dia-sol');
  const flechas = $$('.flecha');
  const actualizar = () => {
    const max = pista.scrollWidth - pista.clientWidth;
    const p = max > 0 ? pista.scrollLeft / max : 0;
    punto?.style.setProperty('--p', p.toFixed(3));
    flechas[0] && (flechas[0].disabled = pista.scrollLeft < 8);
    flechas[1] && (flechas[1].disabled = pista.scrollLeft > max - 8);
  };
  pista.addEventListener('scroll', () => requestAnimationFrame(actualizar), { passive: true });
  addEventListener('resize', actualizar, { passive: true });
  actualizar();
  const paso = () => ($('.momento', pista)?.getBoundingClientRect().width || 340) + 28;
  flechas.forEach(b => b.addEventListener('click', () => pista.scrollBy({ left: paso() * Number(b.dataset.dir), behavior: sinMov ? 'auto' : 'smooth' })));
  // arrastre con el mouse desde cualquier punto (fotos, textos o botones), fluido y sin seleccionar
  let x0 = 0, s0 = 0, movio = false, activo = false, v = 0, tPrev = 0, xPrev = 0, inercia = 0;
  pista.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    activo = true; movio = false; x0 = xPrev = e.clientX; s0 = pista.scrollLeft; v = 0; tPrev = performance.now();
    cancelAnimationFrame(inercia);
  });
  addEventListener('pointermove', e => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 5) { movio = true; pista.classList.add('arrastrando'); pista.setPointerCapture?.(e.pointerId); }
    if (!movio) return;
    e.preventDefault();
    const t = performance.now(); v = (e.clientX - xPrev) / Math.max(1, t - tPrev); xPrev = e.clientX; tPrev = t;
    pista.scrollLeft = s0 - dx;
  });
  const soltar = () => {
    if (!activo) return; activo = false;
    if (!movio) return;
    let vel = -v * 16;
    const deslizar = () => { pista.scrollLeft += vel; vel *= .92; if (Math.abs(vel) > .5) inercia = requestAnimationFrame(deslizar); else pista.classList.remove('arrastrando'); };
    inercia = requestAnimationFrame(deslizar);
    setTimeout(() => pista.classList.remove('arrastrando'), 600);
  };
  addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
  pista.addEventListener('click', e => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  pista.addEventListener('dragstart', e => e.preventDefault());
}

/* carta del Parador (vidriera en popup, leída de la carta del panel) */
document.addEventListener('click', e => {
  if (!e.target.closest('[data-parador]')) return;
  const items = PRODS.filter(p => p.categoria === 'parador' && p.disponible !== false);
  const ul = `<ul class="parador-lista">${items.map(p => `<li><div class="it-fila"><b>${esc(p.nombre)}</b><span>${esc(pesos(p.precio))}</span></div>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}</li>`).join('')}</ul>`;
  popup({ titulo: 'El Parador · de día, frente al agua', contenido: ul, clase: 'kit-pop--resv' });
});

/* ---------- Carta vidriera: una sección por vez, foto al costado, anterior / siguiente ---------- */
const cartaCaja = $('.carta-caja');
function armarCarta() {
  if (!cartaCaja) return;
  const tabs = $$('.kit-tab', cartaCaja);
  const panels = $$('.kit-carta__panel', cartaCaja);
  if (!tabs.length) return;
  // alto fijo: el de la sección más larga, así cambiar de sección no mueve la página
  let alto = 0;
  panels.forEach(p => { const h = p.hidden; p.hidden = false; p.style.minHeight = '0'; alto = Math.max(alto, p.scrollHeight); p.style.minHeight = ''; p.hidden = h; });
  cartaCaja.style.setProperty('--carta-h', alto + 'px');
  const sync = () => {
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    const cat = panels[i]?.id.split('-p-').pop();
    $$('.carta-foto > *', cartaCaja).forEach(f => f.classList.toggle('on', f.dataset.cat === cat));
    $('[data-carta-paso="-1"]', cartaCaja).disabled = i <= 0;
    $('[data-carta-paso="1"]', cartaCaja).disabled = i >= tabs.length - 1;
    $('.carta-n', cartaCaja).textContent = `${i + 1} de ${tabs.length}`;
  };
  tabs.forEach(t => t.addEventListener('click', () => requestAnimationFrame(sync)));
  sync();
}
document.addEventListener('kit:carta', () => requestAnimationFrame(armarCarta));
armarCarta();
$$('[data-carta-paso]').forEach(b => b.addEventListener('click', () => {
  const tabs = $$('.kit-tab', cartaCaja);
  const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true') + Number(b.dataset.cartaPaso);
  if (tabs[i]) { tabs[i].click(); tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}));

/* ---------- Armá tu gin tonic ---------- */
const gin = $('.gin-caja');
if (gin) {
  const LIQ = { argentino: 'rgba(242,154,74,.42)', clasico: 'rgba(130,186,214,.42)', moderno: 'rgba(220,120,165,.42)' };
  const TOPS = [
    { id: 'rodajas', n: 'Rodajas de fruta', s: 'Limón, naranja, pomelo, lima o pepino', i: '◐' },
    { id: 'hierbas', n: 'Hierbas frescas', s: 'Tomillo, romero o menta', i: '❦' },
    { id: 'deshidratados', n: 'Deshidratados', s: 'Pomelo, naranja, lima o limón', i: '◎' },
    { id: 'frutos', n: 'Frutos', s: 'Frutos rojos, frutilla, maracuyá o durazno', i: '∴' },
  ];
  const ICO_TON = '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M25 6h10v8c0 3 6 6 6 12v26a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V26c0-6 6-9 6-12z"/><path d="M19 32h22M19 44h22"/><circle class="rel" cx="27" cy="38" r="1.6"/><circle class="rel" cx="33" cy="36" r="1.2"/><circle class="rel" cx="30" cy="40" r="1"/></svg>';
  const ICO_TOP = {
    rodajas: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="20"/><circle cx="30" cy="30" r="15"/><path d="M30 15v30M15 30h30M19.4 19.4l21.2 21.2M40.6 19.4 19.4 40.6"/></svg>',
    hierbas: '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M16 52C24 36 34 22 46 10"/><path d="M22 41l-9-3M26 34l10-2M30 27l-9-5M35 21l10 0M40 15l-7-7"/></svg>',
    deshidratados: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="20"/><path d="M30 10v40M10 30h40" opacity=".55"/><circle cx="30" cy="30" r="12" opacity=".55"/></svg>',
    frutos: '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="22" cy="34" r="8"/><circle cx="38" cy="30" r="9"/><circle cx="30" cy="44" r="7"/><path d="M38 21c0-5 3-8 7-9M22 26c-1-4 1-7 4-8"/></svg>',
  };
  const st = { fam: 'argentino', gin: null, tonica: null, top: null, paso: 0 };
  const svg = $('svg', gin);
  const liq = $('.liq', svg);
  const burb = $('.burbujas', svg);
  const topg = $('.topping', svg);
  const gins = () => PRODS.filter(p => p.categoria === 'gin' && p.disponible !== false);
  const tonicas = () => PRODS.filter(p => p.categoria === 'tonica' && p.disponible !== false);
  // dibujos del topping (con el trazo de la marca)
  topg.innerHTML = `
    <g data-t="rodajas"><circle class="t-st" cx="122" cy="118" r="22"/><path class="t-st" d="M122 96 V140 M100 118 H144 M106 102 L138 134 M138 102 L106 134"/><circle class="t-st" cx="182" cy="150" r="16"/><path class="t-st" d="M182 134 V166 M166 150 H198"/></g>
    <g data-t="hierbas"><path class="t-st" d="M110 220 C 130 170 150 130 186 96"/><path class="t-st" d="M126 182 l-16 -8 M136 162 l18 -2 M146 144 l-16 -10 M158 128 l18 0 M170 112 l-14 -12"/></g>
    <g data-t="deshidratados"><circle class="t-st" cx="150" cy="104" r="26"/><circle class="t-st" cx="150" cy="104" r="17" opacity=".6"/><path class="t-st" d="M150 78 V130 M124 104 H176" opacity=".6"/></g>
    <g data-t="frutos"><circle class="t-fi" cx="120" cy="210" r="9"/><circle class="t-fi" cx="138" cy="222" r="8"/><circle class="t-fi" cx="168" cy="200" r="10"/><circle class="t-fi" cx="186" cy="218" r="8"/><circle class="t-fi" cx="150" cy="190" r="7"/></g>`;
  burb.innerHTML = Array.from({ length: 14 }, (_, i) => `<circle cx="${92 + (i * 37) % 120}" cy="${250 - (i % 3) * 6}" r="${2 + (i % 3)}" style="--t:${2.4 + (i % 5) * .5}s;--d:${(i * .37) % 3}s"/>`).join('');
  burb.style.opacity = 0; burb.style.transition = 'opacity .6s';
  const NIVEL = { vacio: 200, gin: 140, lleno: 22 };

  function pintarLista() {
    const lista = gins().filter(p => (p.familia || '') === st.fam);
    $('.gin-lista', gin).innerHTML = lista.map(p => `<button type="button" role="radio" class="gin-op" data-gin="${esc(p.id)}" aria-checked="${st.gin === p.id}" title="${esc(p.descripcion || '')}"><span>${esc(p.nombre)}</span><small>${esc(pesos(p.precio))}</small></button>`).join('');
  }
  function pintarTonicas() {
    $('[data-tonicas]', gin).innerHTML = tonicas().map(p => `<button type="button" role="radio" class="ficha-op" data-ton="${esc(p.id)}" aria-checked="${st.tonica === p.id}">${ICO_TON}<b>${esc(p.nombre.replace(/\s\d+\s?ml$/i, ''))}</b><small>${esc((p.nombre.match(/\d+\s?ml/i) || [''])[0])} · ${esc(pesos(p.precio))}</small></button>`).join('');
  }
  function pintarTops() {
    $('[data-toppings]', gin).innerHTML = TOPS.map(t => `<button type="button" role="radio" class="ficha-op" data-top="${t.id}" aria-checked="${st.top === t.id}">${ICO_TOP[t.id]}<b>${t.n}</b><small>${t.s}</small></button>`).join('');
  }
  function irA(n) {
    st.paso = n;
    $$('.gin-paso', gin).forEach(p => { p.hidden = Number(p.dataset.p) !== n; });
    $$('.gin-pasos button', gin).forEach(b => { const i = Number(b.dataset.paso); b.toggleAttribute('aria-current', i === n); if (i === n) b.setAttribute('aria-current', 'step'); });
  }
  function resumen() {
    const g = prod(st.gin), t = prod(st.tonica), top = TOPS.find(x => x.id === st.top);
    $$('.gin-pasos button', gin).forEach(b => { const i = Number(b.dataset.paso); b.classList.toggle('hecho', [st.gin, st.tonica, st.top][i] != null); });
    liq.style.setProperty('--nivel', (t ? NIVEL.lleno : g ? NIVEL.gin : NIVEL.vacio) + 'px');
    liq.style.setProperty('--liq', g ? LIQ[g.familia] || LIQ.clasico : 'rgba(237,230,218,.14)');
    burb.style.opacity = t ? 1 : 0;
    $$('g[data-t]', topg).forEach(x => x.classList.toggle('on', x.dataset.t === st.top));
    const partes = [g?.nombre, t?.nombre, top?.n.toLowerCase()].filter(Boolean);
    $('[data-gin-resumen]', gin).textContent = partes.length ? partes.join(' · ') : 'Elegí tu gin';
    const total = (g?.precio || 0) + (t?.precio || 0);
    $('[data-gin-precio]', gin).textContent = g ? pesos(total) : '—';
    $('[data-gin-nota]', gin).textContent = g && t ? `${g.nombre} ${pesos(g.precio)} + tónica ${pesos(t.precio)}, a precio de carta.` : 'Gin + tónica, a precio de carta.';
    $('[data-gin-reservar]', gin).disabled = !(g && t && top);
  }
  gin.addEventListener('click', e => {
    const f = e.target.closest('[data-fam]'); if (f) { st.fam = f.dataset.fam; $$('[data-fam]', gin).forEach(b => b.setAttribute('aria-checked', String(b === f))); pintarLista(); return; }
    const g = e.target.closest('[data-gin]'); if (g) { st.gin = g.dataset.gin; pintarLista(); resumen(); setTimeout(() => { if (st.paso === 0) irA(1); }, 650); return; }
    const t = e.target.closest('[data-ton]'); if (t) { st.tonica = t.dataset.ton; pintarTonicas(); resumen(); setTimeout(() => { if (st.paso === 1) irA(2); }, 650); return; }
    const tp = e.target.closest('[data-top]'); if (tp) { st.top = tp.dataset.top; pintarTops(); resumen(); return; }
    const p = e.target.closest('[data-paso]'); if (p) { irA(Number(p.dataset.paso)); return; }
    if (e.target.closest('[data-gin-reservar]')) {
      const g2 = prod(st.gin), t2 = prod(st.tonica), top = TOPS.find(x => x.id === st.top);
      reservar(`Gin tonic: ${g2?.nombre} con ${t2?.nombre} y ${top?.n.toLowerCase()}.`);
    }
  });
  // alto fijo del cuerpo: el de la familia con más gins
  const filas = Math.max(...['argentino', 'clasico', 'moderno'].map(f => Math.ceil(gins().filter(p => p.familia === f).length / 2)), 3);
  const unaCol = matchMedia('(max-width:767px)').matches;
  const maxN = Math.max(...['argentino', 'clasico', 'moderno'].map(f => gins().filter(p => p.familia === f).length), 3);
  gin.style.setProperty('--gin-h', unaCol ? `calc(${maxN} * 52px + 64px)` : `calc(${filas} * 58px + 60px)`);
  pintarLista(); pintarTonicas(); pintarTops(); resumen();
}

/* ---------- Eventos: consulta en popup, sale por WhatsApp ---------- */
document.addEventListener('click', e => {
  if (!e.target.closest('[data-evento]')) return;
  const hoy = new Date(); const min = new Date(hoy.getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const form = document.createElement('form');
  form.className = 'form-ev'; form.noValidate = true;
  form.innerHTML = `
    <label class="full">¿Qué quieren festejar?<input name="que" placeholder="Cumpleaños, fin de año de la empresa…" autocomplete="off" required></label>
    <label>Fecha<input name="fecha" type="date" min="${min}" required></label>
    <label>Cuántos van a ser<input name="personas" type="number" inputmode="numeric" min="10" max="400" placeholder="30" required></label>
    <label>Tu nombre<input name="nombre" autocomplete="name" required></label>
    <label>Tu teléfono<input name="tel" type="tel" inputmode="tel" autocomplete="tel" required></label>
    <p class="msg" role="alert"></p>
    <button type="submit" class="kit-btn kit-btn--block kit-btn--big">Enviar la consulta por WhatsApp</button>`;
  const api = popup({ titulo: 'Armá tu evento', contenido: form, clase: 'kit-pop--resv' });
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (!d.que || !d.fecha || !d.personas || !d.nombre || !d.tel) { form.querySelector('.msg').textContent = 'Completá los cinco datos así te armamos la propuesta.'; return; }
    const [y, m, dd] = d.fecha.split('-');
    const txt = `Hola Manso! Quiero consultar por un evento.\n• Qué festejamos: ${d.que}\n• Fecha: ${dd}/${m}/${y}\n• Personas: ${d.personas}\n• Nombre: ${d.nombre}\n• Teléfono: ${d.tel}`;
    window.open(`https://wa.me/${kit.config.whatsapp}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    api.close();
  });
});
