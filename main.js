/* ═══════════════════════════════════════════════════════════════════
   main.js  –  Customer Snapshot  |  Sri Lanka
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── REGION DATA ───────────────────────────────────────────────────*/
const REGIONS = {
  north:    { name: 'North',     color: '#7B73B5', gt: 11, lmb:  9, chf: 18, dis: 120 },
  rajarata: { name: 'Rajarata',  color: '#E8853A', gt: 12, lmb: 10, chf: 20, dis: 150 },
  wayamba:  { name: 'Wayamba',   color: '#C4D84E', gt: 16, lmb: 13, chf: 26, dis: 180 },
  central:  { name: 'Central',   color: '#2B6BAD', gt: 11, lmb:  9, chf: 18, dis: 120 },
  eastern:  { name: 'Eastern',   color: '#5BBDB8', gt: 13, lmb: 10, chf: 20, dis: 150 },
  colomboN: { name: 'Colombo North', color: '#aaaaaa', gt: 12, lmb: 10, chf: 19, dis: 200 },
  colomboS: { name: 'Colombo South', color: '#E06868', gt: 13, lmb: 10, chf: 20, dis: 160 },
  south:    { name: 'South',     color: '#2E8B8B', gt: 12, lmb: 10, chf: 19, dis: 140 },
};

/* ─── TOOLTIP ANCHORS (SVG viewBox coords) ──────────────────────────
   These match the visual centre of each PNG region layer.
   Note: viewBox is now "-80 0 760 841.89" — X coords unchanged because
   the extra margin is to the LEFT (–80) and RIGHT (+165), the island
   shapes themselves haven't moved.
   ─────────────────────────────────────────────────────────────────── */
const TIP_ANCHORS = {
  north:    { svgX: 246.5, svgY: 150.1 },
  rajarata: { svgX: 296.4, svgY: 317.4 },
  wayamba:  { svgX: 194.7, svgY: 444.5 },
  central:  { svgX: 269.2, svgY: 473.1 },
  eastern:  { svgX: 371.4, svgY: 494.4 },
  colomboN: { svgX: 164.1, svgY: 514.9 },
  colomboS: { svgX: 206.2, svgY: 544.3 },
  south:    { svgX: 330.6, svgY: 610.5 },
};

/* ─── DOM REFS ──────────────────────────────────────────────────────*/
const tooltip  = document.getElementById('tooltip');
const ttName   = document.getElementById('tt-name');
const ttGT     = document.getElementById('tt-gt');
const ttLMB    = document.getElementById('tt-lmb');
const ttDIS    = document.getElementById('tt-dis');
const ttCHF    = document.getElementById('tt-chf');
const ttClose  = document.getElementById('tt-close');
const svgEl    = document.getElementById('map-svg');
const wrapper  = document.getElementById('map-wrapper');
const legendEl = document.getElementById('legend');

let activeMapId = null;

/* ════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════ */
buildLegend();
bindMapEvents();
bindFlipCards();
initDevPanel();


/* ─── BUILD LEGEND ──────────────────────────────────────────────────*/
function buildLegend() {
  if (!legendEl) return;
  Object.values(REGIONS).forEach(d => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML =
      `<span class="legend-dot" style="background:${d.color}"></span><span>${d.name}</span>`;
    legendEl.appendChild(item);
  });
}


/* ════════════════════════════════════════════════════════════════════
   MAP  —  click + keyboard interaction
   ════════════════════════════════════════════════════════════════════ */
function bindMapEvents() {

  svgEl.addEventListener('click', e => {
    const g = e.target.closest('.region');
    if (!g) { clearMapActive(); return; }
    const id = g.dataset.id;
    id === activeMapId ? clearMapActive() : activateRegion(id);
  });

  ttClose.addEventListener('click', e => {
    e.stopPropagation();
    clearMapActive();
  });

  /* Click outside map wrapper closes tooltip */
  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) clearMapActive();
  });

  svgEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clearMapActive(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const g = e.target.closest('.region');
      if (!g) return;
      const id = g.dataset.id;
      id === activeMapId ? clearMapActive() : activateRegion(id);
    }
  });

  window.addEventListener('resize', () => {
    if (activeMapId) positionTooltip(activeMapId);
  });
}

function activateRegion(id) {
  clearMapActive(false);
  activeMapId = id;
  const g = svgEl.querySelector(`[data-id="${id}"]`);
  if (g) g.classList.add('active');
  populateTooltip(id);
  positionTooltip(id);
  tooltip.classList.add('visible');
}

function clearMapActive(hide = true) {
  if (activeMapId) {
    const prev = svgEl.querySelector(`[data-id="${activeMapId}"]`);
    if (prev) prev.classList.remove('active');
    activeMapId = null;
  }
  if (hide) tooltip.classList.remove('visible');
}

function populateTooltip(id) {
  const d = REGIONS[id];
  ttName.textContent            = d.name;
  ttGT.textContent              = d.gt  + '%';
  ttLMB.textContent             = d.lmb + '%';
  ttDIS.textContent             = d.dis + ' +';
  ttCHF.textContent             = d.chf + ' Mio CHF';
  tooltip.style.borderLeftColor = d.color;
}

function positionTooltip(id) {
  const anchor   = TIP_ANCHORS[id];
  const svgRect  = svgEl.getBoundingClientRect();
  const wrapRect = wrapper.getBoundingClientRect();

  /* viewBox is "-80 0 760 841.89" → total width 760, height 841.89 */
  const VW = 760, VH = 841.89;
  const scaleX = svgRect.width  / VW;
  const scaleY = svgRect.height / VH;

  /*
    The left margin in the viewBox is 80 units.
    anchor.svgX is in the original 0–595 space.
    In the new viewBox, each unit has shifted right by 80 units worth of pixels,
    so we add 80 * scaleX to place the anchor correctly.
  */
  const anchorPxX = (svgRect.left - wrapRect.left) + (anchor.svgX + 80) * scaleX;
  const anchorPxY = (svgRect.top  - wrapRect.top)  +  anchor.svgY       * scaleY;

  const TW = 170, TH = 115, M = 5;
  let left = anchorPxX - TW / 2;
  let top  = anchorPxY - TH - 12;

  if (top < M) top = anchorPxY + 12;
  left = Math.max(M, Math.min(left, wrapRect.width  - TW - M));
  top  = Math.max(M, Math.min(top,  wrapRect.height - TH - M));

  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';
}


/* ════════════════════════════════════════════════════════════════════
   MODERN TRADE  —  3D FLIP CARDS
   Click → flip to back (shows data).  Click again → flip back to front.
   Opening a different card auto-closes the current one.
   ════════════════════════════════════════════════════════════════════ */

function bindFlipCards() {
  const cards = document.querySelectorAll('.retailer-card', '.retailer-card-Glomark');

  cards.forEach(card => {

    const toggle = () => {
      const wasFlipped = card.classList.contains('flipped');
      /* close all cards first */
      cards.forEach(c => c.classList.remove('flipped'));
      /* re-open this card if it was closed */
      if (!wasFlipped) card.classList.add('flipped');
    };

    card.addEventListener('click', toggle);

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  /* Clicking anywhere outside the grid resets all cards */
  document.addEventListener('click', e => {
    if (!e.target.closest('.retailers-grid', '.retailer-card', '.retailer-card-Glomark')) {
      cards.forEach(c => c.classList.remove('flipped'));
    }
  });
}


/* ════════════════════════════════════════════════════════════════════
   DEV PANEL  —  Region Position Adjuster
   ⚙ button (bottom-right) → live X/Y inputs → copy JSON to clipboard
   ════════════════════════════════════════════════════════════════════ */
const REGION_TRANSFORMS = {};

function initDevPanel() {
  /* Parse current translate values from each <image> element */
  document.querySelectorAll('.region').forEach(group => {
    const id  = group.dataset.id;
    const img = group.querySelector('image');
    if (!img) return;
    const t  = img.getAttribute('transform') || '';
    const m  = t.match(/translate\(\s*([\d.+-]+)\s+([\d.+-]+)\s*\)/);
    const sm = t.match(/scale\(\s*([\d.+-]+)\s*\)/);
    REGION_TRANSFORMS[id] = {
      tx:    m  ? parseFloat(m[1]) : 0,
      ty:    m  ? parseFloat(m[2]) : 0,
      scale: sm ? parseFloat(sm[1]) : 0.07,
      img
    };
  });

  const panel = document.getElementById('dev-panel');

  /* Build one row per region */
  Object.entries(REGION_TRANSFORMS).forEach(([id, tr]) => {
    const name = REGIONS[id] ? REGIONS[id].name : id;
    const row  = document.createElement('div');
    row.className = 'dev-region-row';
    row.innerHTML = `
      <div class="dev-region-name">${name}</div>
      <div class="dev-inputs">
        <label>X <input type="number" step="0.5" data-id="${id}" data-axis="tx" value="${tr.tx}"></label>
        <label>Y <input type="number" step="0.5" data-id="${id}" data-axis="ty" value="${tr.ty}"></label>
      </div>`;
    panel.appendChild(row);
  });

  /* Copy button */
  const copyBtn = document.createElement('button');
  copyBtn.className = 'dev-copy-btn';
  copyBtn.textContent = 'Copy all values';
  panel.appendChild(copyBtn);

  /* Live-update SVG on input change */
  panel.addEventListener('input', e => {
    const input = e.target;
    if (input.tagName !== 'INPUT') return;
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      REGION_TRANSFORMS[input.dataset.id][input.dataset.axis] = val;
      applyTransform(input.dataset.id);
    }
  });

  /* Copy JSON to clipboard */
  copyBtn.addEventListener('click', () => {
    const out = {};
    Object.entries(REGION_TRANSFORMS).forEach(([id, tr]) => {
      out[id] = { tx: tr.tx, ty: tr.ty };
    });
    navigator.clipboard.writeText(JSON.stringify(out, null, 2)).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy all values';
        copyBtn.classList.remove('copied');
      }, 1800);
    });
  });

  /* Toggle panel open/close */
  document.getElementById('dev-toggle').addEventListener('click', () => {
    panel.classList.toggle('open');
  });
}

function applyTransform(id) {
  const tr = REGION_TRANSFORMS[id];
  tr.img.setAttribute('transform', `translate(${tr.tx} ${tr.ty}) scale(${tr.scale})`);
}

/* ════════════════════════════════════════════════════════════════════
   LOCATION MARKER  —  draggable Factory & DC pin
   ════════════════════════════════════════════════════════════════════ */
(function initLocationMarker() {
  const svg    = document.getElementById('map-svg');
  const marker = document.getElementById('location-marker');
  const hint   = marker && marker.querySelector('#pin-label text:last-child');
  if (!svg || !marker) return;

  /* Current position in SVG coordinate space */
  let pinX = 175, pinY = 490;
  let dragging = false;
  let startSvgX, startSvgY, startPinX, startPinY;

  /* ── Convert screen point → SVG coordinate ─────────────────────── */
  function screenToSVG(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ── Apply position ─────────────────────────────────────────────── */
  function setPos(x, y) {
    pinX = x; pinY = y;
    marker.setAttribute('transform', `translate(${x.toFixed(1)}, ${y.toFixed(1)})`);
    updateDevCoords();
  }

  /* ── Mouse events ───────────────────────────────────────────────── */
  marker.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    marker.classList.add('dragging');
    const svgPt = screenToSVG(e.clientX, e.clientY);
    startSvgX = svgPt.x; startSvgY = svgPt.y;
    startPinX = pinX;     startPinY = pinY;
    // Fade out the "drag to adjust" hint on first drag
    if (hint) hint.setAttribute('opacity', '0');
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const svgPt = screenToSVG(e.clientX, e.clientY);
    setPos(startPinX + (svgPt.x - startSvgX),
           startPinY + (svgPt.y - startSvgY));
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    marker.classList.remove('dragging');
  });

  /* ── Touch events (mobile) ──────────────────────────────────────── */
  marker.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const svgPt = screenToSVG(t.clientX, t.clientY);
    dragging = true;
    startSvgX = svgPt.x; startSvgY = svgPt.y;
    startPinX = pinX;     startPinY = pinY;
    if (hint) hint.setAttribute('opacity', '0');
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = e.touches[0];
    const svgPt = screenToSVG(t.clientX, t.clientY);
    setPos(startPinX + (svgPt.x - startSvgX),
           startPinY + (svgPt.y - startSvgY));
  }, { passive: true });

  document.addEventListener('touchend', () => { dragging = false; });

  /* ── Dev panel coord display ────────────────────────────────────── */
  const panel = document.getElementById('dev-panel');

  const pinRow = document.createElement('div');
  pinRow.className = 'dev-region-row';
  pinRow.style.borderTop = '1px solid rgba(139,92,246,0.2)';
  pinRow.style.paddingTop = '8px';
  pinRow.style.marginTop  = '4px';
  pinRow.innerHTML = `
    <div class="dev-region-name" style="color:#FFD600">📍 Factory &amp; DC Pin</div>
    <div class="dev-inputs">
      <label>X <input id="pin-x-input" type="number" step="0.5" value="${pinX}"></label>
      <label>Y <input id="pin-y-input" type="number" step="0.5" value="${pinY}"></label>
    </div>
    <div style="font-size:0.58rem;color:rgba(200,195,255,0.5);margin-top:3px">
      Drag pin on map  or  type values above
    </div>`;
  panel.appendChild(pinRow);

  /* Type-in boxes also move the pin */
  document.getElementById('pin-x-input').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) setPos(v, pinY);
  });
  document.getElementById('pin-y-input').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) setPos(pinX, v);
  });

  function updateDevCoords() {
    const xi = document.getElementById('pin-x-input');
    const yi = document.getElementById('pin-y-input');
    if (xi) xi.value = pinX.toFixed(1);
    if (yi) yi.value = pinY.toFixed(1);
  }
})();
