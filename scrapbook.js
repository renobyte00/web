/* ══════════════════════════════════════════
     SUPABASE INIT
  ══════════════════════════════════════════ */
const SUPABASE_URL  = 'https://lwzhcttjovrguizmumai.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3emhjdHRqb3ZyZ3Vpem11bWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjE4MzEsImV4cCI6MjA5MDU5NzgzMX0.cUcmOuALgb0rdXOMZI8OpnjoflTmllERJp1anFTEBIY';
const BUCKET        = 'scrapbook-photos';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ══════════════════════════════════════════
     DATA
  ══════════════════════════════════════════ */
function makePage() {
  return { id: null, slots: Array.from({ length: 6 }, () => ({ id: null, img: null })) };
}

let dateEntries = [];

/* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
let activeId       = null;
let currentPageIdx = 0;
let animating      = false;
let pendingSlot    = null;

const grid       = document.getElementById('datesGrid');
const panel      = document.getElementById('scrapbookPanel');
const panelTitle = document.getElementById('panelTitle');
const scene      = document.getElementById('pageScene');
const dotsWrap   = document.getElementById('pageDots');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const fileInput  = document.getElementById('fileInput');

/* ══════════════════════════════════════════
     LIGHTBOX STATE
  ══════════════════════════════════════════ */
let lbImages  = [];   // flat list of img URLs currently visible in open entry
let lbIndex   = 0;

const lbOverlay = document.getElementById('lightboxOverlay');
const lbImg     = document.getElementById('lightboxImg');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');
const lbCounter = document.getElementById('lightboxCounter');

function buildLightboxImages() {
  const entry = getEntry();
  lbImages = [];
  entry.pages.forEach(pg => {
    pg.slots.forEach(s => { if (s.img) lbImages.push(s.img); });
  });
}

function openLightbox(startUrl) {
  buildLightboxImages();
  if (!lbImages.length) return;
  lbIndex = lbImages.indexOf(startUrl);
  if (lbIndex < 0) lbIndex = 0;
  lbImg.src = lbImages[lbIndex];
  updateLightboxUI();
  lbOverlay.classList.add('open');
}

function closeLightbox() {
  lbOverlay.classList.remove('open');
  lbImg.src = '';
}

function lightboxNav(dir) {
  const target = lbIndex + dir;
  if (target < 0 || target >= lbImages.length) return;

  lbImg.classList.add('fade');
  setTimeout(() => {
    lbIndex = target;
    lbImg.src = lbImages[lbIndex];
    lbImg.classList.remove('fade');
    updateLightboxUI();
  }, 200);
}

function updateLightboxUI() {
  lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
  lbPrev.toggleAttribute('disabled', lbIndex === 0);
  lbNext.toggleAttribute('disabled', lbIndex === lbImages.length - 1);
}

// Close lightbox on backdrop click
lbOverlay.addEventListener('click', function (e) {
  if (e.target === lbOverlay) closeLightbox();
});

// Keyboard navigation
document.addEventListener('keydown', function (e) {
  if (!lbOverlay.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'Escape')     closeLightbox();
});

/* ══════════════════════════════════════════
     LOADING TOAST
  ══════════════════════════════════════════ */
function showLoading(msg = 'Saving… 🌸') {
  let el = document.getElementById('loadingToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingToast';
    el.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
      background:#c4687a; color:#fff; font-family:'Caveat',cursive;
      font-size:17px; padding:10px 26px; border-radius:40px;
      box-shadow:0 4px 18px rgba(196,104,122,0.35); z-index:9999;
      transition:opacity 0.3s; pointer-events:none;`;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
}

function hideLoading() {
  const el = document.getElementById('loadingToast');
  if (el) el.style.opacity = '0';
}

/* ══════════════════════════════════════════
     LOAD ALL DATA FROM SUPABASE
  ══════════════════════════════════════════ */
async function loadAllData() {
  showLoading('Loading memories… 💖');

  const { data: entries, error: eErr } = await db
    .from('date_entries').select('*').order('created_at', { ascending: true });
  if (eErr) { console.error(eErr); hideLoading(); return; }

  const { data: pages, error: pErr } = await db
    .from('pages').select('*').order('page_index', { ascending: true });
  if (pErr) { console.error(pErr); hideLoading(); return; }

  const { data: slots, error: sErr } = await db
    .from('photo_slots').select('*').order('slot_index', { ascending: true });
  if (sErr) { console.error(sErr); hideLoading(); return; }

  dateEntries = entries.map(entry => {
    const entryPages = pages
      .filter(p => p.date_entry_id === entry.id)
      .map(pg => {
        const pgSlots = Array.from({ length: 6 }, (_, si) => {
          const slot = slots.find(s => s.page_id === pg.id && s.slot_index === si);
          return { id: slot ? slot.id : null, img: slot ? slot.img_url : null };
        });
        return { id: pg.id, slots: pgSlots };
      });
    if (entryPages.length === 0) entryPages.push(makePage());
    return { id: entry.id, date: entry.date, label: entry.label, emoji: entry.emoji, pages: entryPages };
  });

  hideLoading();
  renderGrid();
}

/* ══════════════════════════════════════════
     RENDER GRID
  ══════════════════════════════════════════ */
function renderGrid() {
  grid.innerHTML = '';

  dateEntries.forEach(entry => {
    const photoCount = entry.pages.reduce((sum, pg) =>
      sum + pg.slots.filter(s => s.img).length, 0);

    const card = document.createElement('div');
    card.className = 'date-card' + (entry.id === activeId ? ' active' : '');

    card.innerHTML = `
      <button class="delete-card-btn" onclick="deleteDate(event, '${entry.id}')">✕</button>
      <div class="card-emoji">${entry.emoji}</div>
      <div class="card-date">${entry.date}</div>
      <div class="card-label">${entry.label}</div>
      <div class="photo-count">${photoCount} photo${photoCount !== 1 ? 's' : ''}</div>
    `;
    card.addEventListener('click', () => openScrapbook(entry.id));
    grid.appendChild(card);
  });

  const addCard = document.createElement('div');
  addCard.className = 'date-card add-card';
  addCard.innerHTML = `<div class="add-icon">+</div><div class="add-label">Add date</div>`;
  addCard.addEventListener('click', openModal);
  grid.appendChild(addCard);
}

/* ══════════════════════════════════════════
     OPEN / CLOSE SCRAPBOOK
  ══════════════════════════════════════════ */
function openScrapbook(id) {
  if (activeId === id && panel.classList.contains('open')) {
    closeScrapbook(); return;
  }
  activeId = id;
  currentPageIdx = 0;
  animating = false;

  const entry = getEntry();
  panelTitle.textContent = `${entry.emoji}  ${entry.date} — ${entry.label}`;

  renderGrid();
  scene.innerHTML = '';
  showPage(0, entry, true);

  panel.classList.add('open');
  panel.classList.remove('visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  requestAnimationFrame(() => requestAnimationFrame(() =>
    panel.classList.add('visible')
  ));
}

function closeScrapbook() {
  panel.classList.remove('visible');
  setTimeout(() => {
    panel.classList.remove('open');
    activeId = null;
    renderGrid();
  }, 450);
}

function getEntry() {
  return dateEntries.find(e => e.id === activeId);
}

/* ══════════════════════════════════════════
     RENDER A PAGE NODE
  ══════════════════════════════════════════ */
function renderPageNode(entry, idx) {
  const pg  = entry.pages[idx];
  const div = document.createElement('div');
  div.className = 'page hidden';

  div.innerHTML = `
    <div class="corner-decor corner-tl"></div>
    <div class="corner-decor corner-tr"></div>
    <div class="corner-decor corner-bl"></div>
    <div class="corner-decor corner-br"></div>
    <div class="page-header">
      <span class="page-label">${entry.emoji} ${entry.date} memories</span>
      <span class="page-num">Page ${idx + 1} of ${entry.pages.length}</span>
    </div>
    <div class="photo-grid">
      ${pg.slots.map((s, si) => `
        <div class="photo-slot${s.img ? ' has-image' : ''}"
             onclick="triggerUpload(${idx},${si})">
          ${s.img ? `<img src="${s.img}" alt="" loading="lazy">` : ''}
          <div class="plus-icon">
            <svg class="plus-svg" viewBox="0 0 32 32" fill="none">
              <rect x="14" y="3" width="4" height="26" rx="2" fill="rgba(196,104,122,0.5)"/>
              <rect x="3"  y="14" width="26" height="4" rx="2" fill="rgba(196,104,122,0.5)"/>
            </svg>
            <span class="plus-text">Add photo</span>
          </div>
          ${s.img ? `
            <div class="slot-overlay">
              <span class="slot-overlay-btn"
                    onclick="event.stopPropagation();openLightbox('${s.img}')">👁 View</span>
              <span class="slot-overlay-btn"
                    onclick="event.stopPropagation();triggerUpload(${idx},${si})">↺ Replace</span>
              <span class="slot-overlay-btn"
                    onclick="event.stopPropagation();removePhoto(${idx},${si})">✕ Remove</span>
            </div>` : ''}
          <div class="sticker-tape"></div>
        </div>`).join('')}
    </div>
  `;
  return div;
}

/* ══════════════════════════════════════════
     SHOW / NAVIGATE PAGES
  ══════════════════════════════════════════ */
function showPage(idx, entry, instant) {
  entry = entry || getEntry();
  scene.innerHTML = '';
  const pg = renderPageNode(entry, idx);
  scene.appendChild(pg);
  if (instant) {
    pg.className = 'page visible';
  } else {
    requestAnimationFrame(() => { pg.className = 'page visible'; });
  }
  currentPageIdx = idx;
  updateNav(entry);
}

function navigateTo(target) {
  if (animating) return;
  const entry = getEntry();
  if (target < 0 || target >= entry.pages.length) return;
  animating = true;

  const dir     = target > currentPageIdx ? 1 : -1;
  const oldPage = scene.querySelector('.page');
  const newPage = renderPageNode(entry, target);

  newPage.className = dir > 0 ? 'page enter-right' : 'page enter-left';
  scene.appendChild(newPage);

  requestAnimationFrame(() => {
    oldPage.className = dir > 0 ? 'page exit-left' : 'page exit-right';
    newPage.className = 'page visible';
  });

  setTimeout(() => {
    oldPage.remove();
    currentPageIdx = target;
    animating = false;
    updateNav(entry);
  }, 680);
}

function changePage(dir) { navigateTo(currentPageIdx + dir); }

function updateNav(entry) {
  entry = entry || getEntry();
  prevBtn.disabled = currentPageIdx === 0;
  nextBtn.disabled = currentPageIdx === entry.pages.length - 1;

  dotsWrap.innerHTML = '';
  entry.pages.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === currentPageIdx ? ' active' : '');
    d.onclick = () => { if (i !== currentPageIdx) navigateTo(i); };
    dotsWrap.appendChild(d);
  });
}

/* ══════════════════════════════════════════
     ENSURE PAGE EXISTS IN DB
  ══════════════════════════════════════════ */
async function ensurePageInDB(entry, pi) {
  const pg = entry.pages[pi];
  if (pg.id) return pg.id;

  const { data, error } = await db
    .from('pages')
    .insert({ date_entry_id: entry.id, page_index: pi })
    .select('id')
    .single();
  if (error) { console.error(error); return null; }
  pg.id = data.id;

  const slotRows = Array.from({ length: 6 }, (_, si) => ({
    page_id: pg.id, slot_index: si, img_url: null
  }));
  const { data: slotData, error: slotErr } = await db
    .from('photo_slots').insert(slotRows).select('id, slot_index');
  if (!slotErr) slotData.forEach(s => { pg.slots[s.slot_index].id = s.id; });

  return pg.id;
}

/* ══════════════════════════════════════════
     PHOTO UPLOAD
  ══════════════════════════════════════════ */
function triggerUpload(pi, si) {
  pendingSlot = { pi, si };
  fileInput.click();
}

async function removePhoto(pi, si) {
  const entry = getEntry();
  const slot  = entry.pages[pi].slots[si];
  showLoading('Removing photo… 🥀');

  if (slot.img) {
    const path = slot.img.split(`${BUCKET}/`)[1];
    if (path) await db.storage.from(BUCKET).remove([path]);
  }
  if (slot.id) {
    await db.from('photo_slots').update({ img_url: null }).eq('id', slot.id);
  }

  slot.img = null;
  hideLoading();
  showPage(currentPageIdx, entry, true);
  renderGrid();
}

fileInput.addEventListener('change', async function () {
  if (!this.files[0] || !pendingSlot) return;

  const file   = this.files[0];
  const { pi, si } = pendingSlot;
  pendingSlot  = null;
  this.value   = '';

  const entry  = getEntry();
  showLoading('Uploading photo… 📸');

  const pageId = await ensurePageInDB(entry, pi);
  if (!pageId) { hideLoading(); return; }

  const slot = entry.pages[pi].slots[si];

  if (slot.img) {
    const oldPath = slot.img.split(`${BUCKET}/`)[1];
    if (oldPath) await db.storage.from(BUCKET).remove([oldPath]);
  }

  const ext      = file.name.split('.').pop();
  const filePath = `${entry.id}/page${pi}_slot${si}_${Date.now()}.${ext}`;

  const { error: upErr } = await db.storage
    .from(BUCKET).upload(filePath, file, { upsert: true, contentType: file.type });
  if (upErr) { console.error(upErr); hideLoading(); return; }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  if (slot.id) {
    await db.from('photo_slots').update({ img_url: publicUrl }).eq('id', slot.id);
  } else {
    const { data: newSlot, error: nsErr } = await db
      .from('photo_slots')
      .insert({ page_id: pageId, slot_index: si, img_url: publicUrl })
      .select('id').single();
    if (!nsErr) slot.id = newSlot.id;
  }

  slot.img = publicUrl;
  hideLoading();
  showPage(currentPageIdx, entry, true);
  renderGrid();
});

/* ══════════════════════════════════════════
     ADD PAGE
  ══════════════════════════════════════════ */
async function addPage() {
  const entry  = getEntry();
  const newIdx = entry.pages.length;
  entry.pages.push(makePage());
  showLoading('Adding page… 📄');
  await ensurePageInDB(entry, newIdx);
  hideLoading();
  navigateTo(newIdx);
}

/* ══════════════════════════════════════════
     ADD DATE MODAL
  ══════════════════════════════════════════ */
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('inputDate').value  = '';
  document.getElementById('inputLabel').value = '';
  document.getElementById('inputEmoji').value = '';
}

async function confirmAddDate() {
  const date  = document.getElementById('inputDate').value.trim();
  const label = document.getElementById('inputLabel').value.trim();
  const emoji = document.getElementById('inputEmoji').value.trim() || '💖';
  if (!date) return;

  const id = 'date_' + Date.now();
  showLoading('Saving date… 🌸');

  const { error } = await db.from('date_entries').insert({
    id, date, emoji, label: label || 'Our date ✨'
  });
  if (error) { console.error(error); hideLoading(); return; }

  const newEntry = { id, date, emoji, label: label || 'Our date ✨', pages: [makePage()] };
  dateEntries.push(newEntry);
  await ensurePageInDB(newEntry, 0);

  hideLoading();
  closeModal();
  renderGrid();
}

document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

/* ══════════════════════════════════════════
     DELETE DATE
  ══════════════════════════════════════════ */
async function deleteDate(e, id) {
  e.stopPropagation();
  if (!confirm('Are you sure you want to delete this memory? 🥺')) return;

  showLoading('Deleting… 🥀');

  const entry = dateEntries.find(en => en.id === id);
  if (entry) {
    const paths = [];
    entry.pages.forEach(pg => {
      pg.slots.forEach(slot => {
        if (slot.img) {
          const path = slot.img.split(`${BUCKET}/`)[1];
          if (path) paths.push(path);
        }
      });
    });
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
  }

  await db.from('date_entries').delete().eq('id', id);

  const index = dateEntries.findIndex(en => en.id === id);
  if (index !== -1) dateEntries.splice(index, 1);
  if (activeId === id) closeScrapbook();

  hideLoading();
  renderGrid();
}

/* ── Init ── */
loadAllData();
