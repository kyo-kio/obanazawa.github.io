// ---- ヘッダーの背景切り替え（背景のみ変更） ----
function setupHeaderOnScroll() {
  const header = document.getElementById('header');
  const hero = document.getElementById('hero'); // ← hotel.html で付けた id
  const THRESHOLD = 50;
  if (!header) return;

  const update = () => {
    if (!hero) {
      const y = window.scrollY || window.pageYOffset || 0;
      if (y > THRESHOLD) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      return;
    }
    const top = hero.getBoundingClientRect().top;
    if (top <= -THRESHOLD) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// ---- 言語ドロップダウン（必ずURLへ遷移） ----
(function () {
  const dd   = document.getElementById('langDropdown');
  const btn  = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  if (!dd || !btn || !menu) return;

  const label = dd.querySelector('.lang-current');
  const items = Array.from(menu.querySelectorAll('.lang-item'));

  function open() {
    dd.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.style.width = btn.getBoundingClientRect().width + 'px';
  }
  function close() {
    dd.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggle() { dd.classList.contains('open') ? close() : open(); }

  btn.addEventListener('click', () => toggle());

  // クリックした言語の URL に必ず遷移
  items.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault(); // 二重遷移防止
      // ラベル更新（遷移前）
      label.textContent = a.textContent.trim();
      label.dataset.lang = a.dataset.lang;
      close();
      // ★URLへ遷移（必須要件）
      window.location.href = a.href;
    });
  });

  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target)) close();
  });

  // Escで閉じる＆フォーカス戻し
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); btn.focus(); }
  });

  // リサイズ時に幅を追従
  window.addEventListener('resize', () => {
    if (dd.classList.contains('open')) {
      menu.style.width = btn.getBoundingClientRect().width + 'px';
    }
  });
})();

// ---- モバイルメニュー（URL遷移は必ず実行） ----
(function () {
  const menu    = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('hamburgerBtn');
  const closeBtn= document.getElementById('mobileMenuClose');
  if (!menu || !openBtn || !closeBtn) return;

  function open() {
    menu.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    menu.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  closeBtn.addEventListener('click', (e) => { e.preventDefault(); close(); });

  // オーバーレイ領域クリックで閉じる
  menu.addEventListener('click', (e) => {
    if (e.target === menu) close();
  });

  // メニュー内リンク：閉じてから必ずリンク先へ遷移
  const mobileLinks = Array.from(menu.querySelectorAll('a.mobile-item'));
  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // SPA想定も考慮しつつ確実に遷移
      e.preventDefault();
      const href = link.href;
      close();
      window.location.href = href;
    });
  });

  // Escで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
  });

  // 画面幅が戻ったら（PCへ）閉じる
  const mql = window.matchMedia('(min-width: 1025px)');
  mql.addEventListener('change', e => { if (e.matches) close(); });
})();

// ---- 初期化 ----
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderOnScroll();

  // （既存実装があれば勝手に動くよう守備的に呼び出し）
  if (typeof setupDotNavigation   === 'function') setupDotNavigation();
  if (typeof setupWheelPaging     === 'function') setupWheelPaging();
  if (typeof setupTouchPaging     === 'function') setupTouchPaging();
  if (typeof setupKeyPaging       === 'function') setupKeyPaging();
  if (typeof setupObserver        === 'function') setupObserver();

  if (typeof getNearestSectionIndex === 'function' &&
      typeof setActiveDot === 'function') {
    setActiveDot(getNearestSectionIndex());
  }
});

/* ====== 多言語ユーティリティ（必要に応じて辞書を用意してください） ====== */
const DICT = {
  ja: {},
  en: {},
  zh: {}
};

function translate(lang, key){
  return (DICT[lang] && DICT[lang][key]) ?? DICT.ja[key] ?? '';
}

function applyI18n(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = translate(lang, key);
    if (val !== undefined) el.textContent = val;
  });
  document.querySelectorAll('*').forEach(el => {
    for (const {name, value} of Array.from(el.attributes)){
      if (name.startsWith('data-i18n-') && name !== 'data-i18n'){
        const target = name.slice('data-i18n-'.length);
        const val = translate(lang, value);
        if (val !== undefined) el.setAttribute(target, val);
      }
    }
  });
  const label = document.querySelector('.lang-current');
  if (label) label.textContent = { ja: '日本語', en: 'English', zh: '中文' }[lang] || '日本語';
  document.querySelectorAll('.lang-item').forEach(a => {
    a.classList.toggle('is-active', a.dataset.lang === lang);
  });
}

function setLanguage(lang){
  localStorage.setItem('lang', lang);
  applyI18n(lang);
}
window.setLanguage = setLanguage;

function getInitialLang(){
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang && DICT[urlLang]) return urlLang;
  const stored = localStorage.getItem('lang');
  if (stored && DICT[stored]) return stored;
  return 'ja';
}

function bindLangMenu(){
  const menu = document.getElementById('langMenu');
  if (!menu) return;
  menu.querySelectorAll('.lang-item').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setLanguage(a.dataset.lang);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindLangMenu();
  applyI18n(getInitialLang());
});
