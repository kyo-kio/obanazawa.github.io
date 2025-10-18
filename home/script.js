// ===== Section Paging + Dot Navigation =====

// マークアップ側のセクションIDとドットの順番を対応させる
const SECTION_IDS = ['hero', 'news', 'lady-tiket', 'child-day', 'winter'];

const header = document.getElementById('header');
const dotNav = document.getElementById('dotNavigation');
const dots = document.querySelectorAll('.dot');
const sections = SECTION_IDS
  .map(id => document.getElementById(id))
  .filter(Boolean);

let isAnimating = false;
let activeIndex = 0;

// ---- 共通: 現在位置判定 & アクティブ更新 ----
function getNearestSectionIndex() {
  const mid = window.innerHeight / 2;
  let nearest = 0;
  let minDist = Infinity;

  sections.forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const dist = Math.abs((rect.top + rect.bottom) / 2 - mid);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  });
  return nearest;
}

function setActiveDot(index) {
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  activeIndex = index;
}

// ---- セクションへスムーズ移動（ドットクリックと同じ動作の本体） ----
const ANIMATION_MS = 800; // スクロール時間の目安

function scrollToSection(index) {
  index = Math.max(0, Math.min(index, sections.length - 1));
  if (isAnimating || index === activeIndex) return;

  isAnimating = true;
  setActiveDot(index);

  sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 慣性スクロール対策で少しだけ待って解除
  setTimeout(() => {
    isAnimating = false;
    // 念のため最寄りのセクションで確定
    setActiveDot(getNearestSectionIndex());
  }, ANIMATION_MS);
}

// ---- ドットクリック ----
function setupDotNavigation() {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => scrollToSection(i));
  });
}

// ---- ホイール（マウス/トラックパッド）で1画面ずつ移動 ----
function setupWheelPaging() {
  let wheelLock = false;
  window.addEventListener(
    'wheel',
    (e) => {
      // 通常スクロールを止め、1セクション移動だけ行う
      e.preventDefault();
      if (wheelLock || isAnimating) return;
      wheelLock = true;

      const dir = e.deltaY > 0 ? 1 : -1;
      // いま見えているセクション基準で移動
      const current = getNearestSectionIndex();
      scrollToSection(current + dir);

      // 連打防止
      setTimeout(() => (wheelLock = false), ANIMATION_MS * 0.6);
    },
    { passive: false }
  );
}

// ---- タッチ（スマホのスワイプ）で1画面ずつ移動 ----
function setupTouchPaging() {
  let startY = 0;
  let moved = false;

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      moved = false;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      // しきい値を超えるまでは通常のスクロールを抑制
      if (Math.abs(e.touches[0].clientY - startY) < 24) return;
      e.preventDefault();
      moved = true;
    },
    { passive: false }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (!moved || isAnimating) return;
      const endY = (e.changedTouches[0] || {}).clientY ?? startY;
      const delta = endY - startY;
      const dir = delta < 0 ? 1 : -1; // 上へスワイプ→次のセクションへ
      const current = getNearestSectionIndex();
      scrollToSection(current + dir);
    },
    { passive: true }
  );
}

// ---- キー操作（任意：矢印/PgUp/PgDn/Home/End） ----
function setupKeyPaging() {
  window.addEventListener('keydown', (e) => {
    if (isAnimating) return;
    const current = getNearestSectionIndex();
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      scrollToSection(current + 1);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      scrollToSection(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToSection(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToSection(sections.length - 1);
    }
  });
}

// ---- スクロール中のドット同期（手動でバーっと動かした時の保険） ----
function setupObserver() {
  if (!('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver(
    (entries) => {
      // 画面中央に近づいたセクションをアクティブに
      const entry = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];

      if (entry) {
        const id = entry.target.id;
        const idx = SECTION_IDS.indexOf(id);
        if (idx !== -1) setActiveDot(idx);
      }
    },
    {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // 画面中央近傍で発火
      threshold: 0,
    }
  );

  sections.forEach((el) => obs.observe(el));
}

// ---- ヘッダーの色切り替え（元の仕様） ----
function setupHeaderOnScroll() {
  // HEROの位置で判定：トップでは透明、50px以上スクロール後に.scrolled
  const hero = document.getElementById('hero');
  const THRESHOLD = 50;
  if (!header) return;

  const update = () => {
    if (!hero) {
      // フォールバック: scrollYで判定
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

// ---- 初期化 ----
document.addEventListener('DOMContentLoaded', () => {
  setupDotNavigation();
  setupWheelPaging();
  setupTouchPaging();
  setupKeyPaging();
  setupObserver();
  setupHeaderOnScroll();

  // 初期アクティブを確定
  setActiveDot(getNearestSectionIndex());
});


(function(){
  const dd  = document.getElementById('langDropdown');
  const btn = document.getElementById('langBtn');
  const menu= document.getElementById('langMenu');
  if (!dd || !btn || !menu) return;

  const label = dd.querySelector('.lang-current');
  const items = Array.from(menu.querySelectorAll('.lang-item'));

  function open(){
    dd.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    // メニュー幅=ボタン幅（念のためJSで合わせる）
    menu.style.width = btn.getBoundingClientRect().width + 'px';
  }
  function close(){
    dd.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }
  function toggle(){ dd.classList.contains('open') ? close() : open(); }

  btn.addEventListener('click', (e)=>{ e.preventDefault(); toggle(); });

  // メニュークリック：選択表示だけ更新（遷移は任意）
  items.forEach(a=>{
    a.addEventListener('click', (e)=>{
      // 本来は遷移。デモでは preventDefault して見た目だけ更新
      e.preventDefault();
      items.forEach(x=>x.classList.remove('is-active'));
      a.classList.add('is-active');

      // ラベル更新
      label.textContent = a.textContent.trim();
      label.dataset.lang = a.dataset.lang;

      close();
      // 実運用ではここで location.href = a.href; 等に置き換え
    });
  });

  // 外側クリックで閉じる
  document.addEventListener('click', (e)=>{
    if (!dd.contains(e.target)) close();
  });

  // Escで閉じる＆フォーカス戻し
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') { close(); btn.focus(); }
  });

  // リサイズ時に幅を追従
  window.addEventListener('resize', ()=>{
    if (dd.classList.contains('open')){
      menu.style.width = btn.getBoundingClientRect().width + 'px';
    }
  });
})();


(function(){
  const menu = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('hamburgerBtn');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (!menu || !openBtn || !closeBtn) return;

  function open(){
    menu.classList.add('is-open');
    openBtn.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden'; // 背景スクロール固定
  }
  function close(){
    menu.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', (e)=>{ e.preventDefault(); open(); });
  closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); close(); });

  // メニュー外クリックで閉じる
  menu.addEventListener('click', (e)=>{
    if (e.target === menu) close();
  });

  // Escで閉じる
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && menu.classList.contains('is-open')) close();
  });

  // 画面幅が戻ったら（PCへ）閉じておく
  const mql = window.matchMedia('(min-width: 1025px)');
  mql.addEventListener('change', e => { if (e.matches) close(); });
})();




// ===== News Carousel: endless track (no begin/end jump), dots show logical bounds =====
(function(){
  const viewport = document.getElementById('newsViewport') || document.querySelector('.news__inner');
  const track    = document.getElementById('newsTrack')    || document.querySelector('.news .cards');
  const dotsWrap = document.getElementById('newsDots') || null;
  if (!viewport || !track) return;

  // 実カード（.news-card または .card を採用）
  const originals = Array.from(track.querySelectorAll('.news-card, .card'));
  const COUNT = originals.length;
  if (COUNT < 1) return;

  // --- 無限ループ用：リスト全体を複数回並べた「長いトラック」に作り替え ---
  const REPEAT = 5; // 中央に実セット、その前後に同セットを2回ずつ
  const frag = document.createDocumentFragment();
  for (let r = 0; r < REPEAT; r++) {
    originals.forEach(node => frag.appendChild(node.cloneNode(true)));
  }
  track.innerHTML = '';
  track.appendChild(frag);

  const cards = Array.from(track.children);
  const total = cards.length;

  // ドット（論理的な先頭〜末尾 = 実カード分だけ）
  const dots = [];
  if (dotsWrap){
    dotsWrap.innerHTML = '';
    for (let i = 0; i < COUNT; i++){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'news-dot';
      b.setAttribute('aria-label', `スライド ${i+1}`);
      b.addEventListener('click', () => goToReal(i, true));
      dotsWrap.appendChild(b);
      dots.push(b);
    }
  }
  function setActiveDot(){
    if (!dots.length) return;
    const real = ((index % COUNT) + COUNT) % COUNT;
    dots.forEach((d,i)=>d.classList.toggle('active', i === real));
  }

  // 左寄せ移動（※“始まりのカードを中央にする”処理は入れていません）
  function translateTo(i, animate){
    const target = cards[i];
    if (!target) return;
    const padL = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    const tx = -(target.offsetLeft - padL);
    track.style.transition = animate ? 'transform 600ms ease' : 'none';
    track.style.transform  = `translateX(${tx}px)`;
    setActiveDot();
    if (!animate){ void track.offsetHeight; track.style.transition = ''; }
  }

  // いま見ている集合の近くで、指定の“実カード”に最短で移動する
  function nearestIndexForReal(real){
    const baseSet = Math.round(index / COUNT);
    const cands = [
      (baseSet-1)*COUNT + real,
      baseSet*COUNT + real,
      (baseSet+1)*COUNT + real
    ];
    let best = cands[0];
    for (const c of cands) if (Math.abs(c - index) < Math.abs(best - index)) best = c;
    return Math.max(0, Math.min(total-1, best));
  }

  function goToReal(real, user=false){
    index = nearestIndexForReal(real);
    translateTo(index, true);
    if (user) restart();
  }

  function next(){ index += 1; translateTo(index, true); }
  function prev(){ index -= 1; translateTo(index, true); }

  // 端に近づいたら、同じ見た目の位置へ“静かに”再配置（ジャンプを見せない）
  track.addEventListener('transitionend', () => {
    const margin = COUNT;                    // 端から1セット分はバッファ
    const minIdx = margin;
    const maxIdx = total - margin - 1;
    if (index < minIdx){
      index += COUNT;                        // セット1つ分だけ中央側へ寄せ直し
      translateTo(index, false);             // アニメ無し（視覚的には動かない）
    } else if (index > maxIdx){
      index -= COUNT;
      translateTo(index, false);
    }
  });

  // 自動送り（必要なければ data-interval=0 などで停止可）
  const root = viewport.closest('.news-carousel') || viewport;
  const INTERVAL_MS = Number(root?.dataset?.interval) || 6000;
  let timer = null;
  function start(){ stop(); if (INTERVAL_MS > 0) timer = setInterval(next, INTERVAL_MS); }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } }
  function restart(){ stop(); start(); }

  // ホバー/タッチで一時停止→離れたら再開
  viewport.addEventListener('pointerenter', stop);
  viewport.addEventListener('pointerleave', start);
  viewport.addEventListener('touchstart', stop, { passive:true });
  viewport.addEventListener('touchend',   start, { passive:true });
  viewport.addEventListener('touchcancel',start, { passive:true });

  // 初期位置：中央セットの先頭（始まり/終わりの概念を見せない）
  let index = COUNT * Math.floor(REPEAT / 2);

  // 画像ロード後に初期表示
  const imgs = track.querySelectorAll('img');
  let pending = imgs.length;
  const boot = () => { translateTo(index, false); start(); };
  if (pending === 0) requestAnimationFrame(boot);
  else imgs.forEach(img => {
    const done = () => { if (--pending === 0) boot(); };
    if (img.complete) done();
    else { img.addEventListener('load', done, {once:true}); img.addEventListener('error', done, {once:true}); }
  });

  // リサイズでも位置維持
  window.addEventListener('resize', () => translateTo(index, false));

  // 任意で外部操作
  window.newsCarousel = { next, prev, goTo: goToReal, stop, start };
  // === Added: arrows (page by 3 on desktop, 1 on mobile) ===
  const prevArrow = (viewport && viewport.querySelector('.news-arrow.prev')) || null;
  const nextArrow = (viewport && viewport.querySelector('.news-arrow.next')) || null;
  const mqDesktop = window.matchMedia('(min-width: 1024px)');
  const stepBy = () => (mqDesktop.matches ? 3 : 1);
  function jumpGroup(n){ index += n; translateTo(index, true); restart(); }
  if (prevArrow) prevArrow.addEventListener('click', () => jumpGroup(-stepBy()));
  if (nextArrow) nextArrow.addEventListener('click', () => jumpGroup(+stepBy()));

})();

/*言語対応*/
function translate(lang, key){
return (DICT[lang] && DICT[lang][key]) ?? DICT.ja[key] ?? '';
}


function applyI18n(lang){
document.documentElement.lang = lang;
// テキストノード
document.querySelectorAll('[data-i18n]').forEach(el => {
const key = el.getAttribute('data-i18n');
const val = translate(lang, key);
if (val !== undefined) el.textContent = val;
});
// 属性（aria-label, title, alt, placeholder など）
document.querySelectorAll('*').forEach(el => {
for (const {name, value} of Array.from(el.attributes)){
if (name.startsWith('data-i18n-') && name !== 'data-i18n'){
const target = name.slice('data-i18n-'.length);
const val = translate(lang, value);
if (val !== undefined) el.setAttribute(target, val);
}
}
});
// 言語ラベル
const label = document.querySelector('.lang-current');
if (label) label.textContent = { ja: '日本語', en: 'English', zh: '中文' }[lang] || '日本語';
// メニューの選択状態
document.querySelectorAll('.lang-item').forEach(a => {
a.classList.toggle('is-active', a.dataset.lang === lang);
});
}


function setLanguage(lang){
localStorage.setItem('lang', lang);
applyI18n(lang);
}
window.setLanguage = setLanguage; // デバッグ用に公開


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
// 既存のクリック処理と併用：遷移は抑止し言語反映
e.preventDefault();
setLanguage(a.dataset.lang);
});
});
}


document.addEventListener('DOMContentLoaded', () => {
bindLangMenu();
applyI18n(getInitialLang());
});





