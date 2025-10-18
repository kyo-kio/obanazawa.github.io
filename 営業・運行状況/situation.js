
// ==============================
// Header Menu JavaScript（変更版）
// 条件：テキスト/アイコンは常に黒（CSSで制御）
//       背景のみスクロールで .scrolled を付与/除去
//       「営業・運行状況」ボタンは常時緑（CSSで制御）
//       URL は必ず遷移（preventDefaultは使わない）
// ==============================

// ---- ヘッダーの背景切り替え（背景のみ変更） ----
function setupHeaderOnScroll() {
  const header = document.getElementById('header');
  const hero = document.getElementById('hero');
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

  // ボタンは<button>のため preventDefault不要
  btn.addEventListener('click', () => toggle());

  // クリックした言語の URL に必ず遷移
  items.forEach(a => {
    a.addEventListener('click', () => {
      // ラベル更新（遷移前）
      label.textContent = a.textContent.trim();
      label.dataset.lang = a.dataset.lang;
      // メニュー閉じてから遷移
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
    document.body.style.overflow = 'hidden'; // 背景スクロール固定
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
    link.addEventListener('click', () => {
      // 閉じる（画面遷移が発生するが、SPAの場合も考慮）
      close();
      // ★URLへ遷移（必須要件）
      window.location.href = link.href;
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
  // 他の機能がある場合はそのまま残す
  if (typeof setupDotNavigation   === 'function') setupDotNavigation();
  if (typeof setupWheelPaging     === 'function') setupWheelPaging();
  if (typeof setupTouchPaging     === 'function') setupTouchPaging();
  if (typeof setupKeyPaging       === 'function') setupKeyPaging();
  if (typeof setupObserver        === 'function') setupObserver();

  setupHeaderOnScroll();

  // 初期アクティブ確定（既存関数があれば）
  if (typeof getNearestSectionIndex === 'function' &&
      typeof setActiveDot === 'function') {
    setActiveDot(getNearestSectionIndex());
  }
});

// スキー場営業・運行状況管理システム
class SkiResortManager {
    constructor() {
        this.businessHours = {
            start: 8,  // 営業開始時刻
            end: 21    // 営業終了時刻
        };
        this.init();
        this.startAutoUpdate();
    }

    // 初期化
    init() {
        this.updateLastUpdateTime();
        this.updateBusinessStatus();
        this.bindEvents();
    }

    // 最終更新時刻を更新
    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('last-update-time').textContent = timeString;
    }

    // 営業状況を更新
    updateBusinessStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        const businessStatusElement = document.getElementById('business-status');
        const businessTimeElement = document.getElementById('business-time');

        if (currentHour >= this.businessHours.start && currentHour < this.businessHours.end) {
            // 営業中
            businessStatusElement.textContent = '営業中';
            businessStatusElement.className = 'status-badge business-open';
            businessTimeElement.textContent = `${this.businessHours.start}:00 - ${this.businessHours.end}:00`;
        } else {
            // 営業時間外
            businessStatusElement.textContent = '営業時間外';
            businessStatusElement.className = 'status-badge business-closed';
            businessTimeElement.textContent = `${this.businessHours.start}:00 - ${this.businessHours.end}:00`;
        }
    }

    // 運行状況を更新
    updateOperationStatus(status, title, details) {
        const indicator = document.getElementById('operation-indicator');
        const titleElement = document.getElementById('operation-title');
        const detailsElement = document.getElementById('operation-details');
        const operationCard = document.querySelector('.operation-status .status-card');

        if (status === 'normal') {
            // 正常運行
            indicator.className = 'status-indicator normal';
            titleElement.textContent = title || '異常なし';
            detailsElement.textContent = details || '現在、正常に運行しております。';
            operationCard.classList.remove('abnormal');
        } else {
            // 異常あり
            indicator.className = 'status-indicator abnormal';
            titleElement.textContent = title || '運行に異常があります';
            detailsElement.textContent = details || '詳細をご確認ください。';
            operationCard.classList.add('abnormal');
        }
    }

    // 営業時間を設定
    setBusinessHours(start, end) {
        this.businessHours.start = start;
        this.businessHours.end = end;
        this.updateBusinessStatus();
    }

    // イベントハンドラーの設定
    bindEvents() {
        // 営業状況カードのクリックイベント
        document.querySelector('.business-status .status-card').addEventListener('click', () => {
            this.showBusinessDetails();
        });

        // 運行状況カードのクリックイベント
        document.querySelector('.operation-status .status-card').addEventListener('click', () => {
            this.showOperationDetails();
        });
    }

    // 営業詳細を表示
    showBusinessDetails() {
        const now = new Date();
        const currentHour = now.getHours();
        const isOpen = currentHour >= this.businessHours.start && currentHour < this.businessHours.end;
        
        const status = isOpen ? '営業中' : '営業時間外';
        const message = `スキー場営業状況\n\n現在の状況: ${status}\n営業時間: ${this.businessHours.start}:00 - ${this.businessHours.end}:00`;
        
        alert(message);
    }

    // 運行詳細を表示
    showOperationDetails() {
        const title = document.getElementById('operation-title').textContent;
        const details = document.getElementById('operation-details').textContent;
        
        alert(`リフト・ゴンドラ運行状況\n\n状況: ${title}\n詳細: ${details}`);
    }

    // 自動更新開始
    startAutoUpdate() {
        // 1分ごとに最終更新時刻を更新
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 60000);

        // 1分ごとに営業状況をチェック
        setInterval(() => {
            this.updateBusinessStatus();
        }, 60000);
    }

    // 緊急アラートを表示
    showEmergencyAlert(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'emergency-alert';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <h3>⚠️ 重要なお知らせ</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
            </div>
        `;
        
        // CSSスタイルを動的に追加
        alertDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const alertContent = alertDiv.querySelector('.alert-content');
        alertContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            text-align: center;
            border: 3px solid #f44336;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        `;
        
        const alertTitle = alertContent.querySelector('h3');
        alertTitle.style.cssText = `
            color: #f44336;
            margin-bottom: 15px;
            font-size: 1.3rem;
        `;
        
        const alertMessage = alertContent.querySelector('p');
        alertMessage.style.cssText = `
            color: #37474f;
            margin-bottom: 20px;
            font-size: 1rem;
            line-height: 1.5;
        `;
        
        const button = alertContent.querySelector('button');
        button.style.cssText = `
            background: linear-gradient(135deg, #f44336 0%, #ef5350 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 500;
            font-size: 1rem;
        `;
        
        document.body.appendChild(alertDiv);
        
        // 自動で20秒後に閉じる
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 20000);
    }

    // 現在の営業状況を取得
    getBusinessStatus() {
        const now = new Date();
        const currentHour = now.getHours();
        return currentHour >= this.businessHours.start && currentHour < this.businessHours.end;
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    const skiResort = new SkiResortManager();
    
    console.log('スキー場営業・運行状況システムが開始されました');
    
    // グローバル関数として公開（外部から呼び出し可能）
    window.skiResort = {
        // 運行状況を更新: status ('normal' or 'abnormal'), title, details
        updateOperation: (status, title, details) => {
            skiResort.updateOperationStatus(status, title, details);
        },
        
        // 営業時間を設定: start (開始時刻), end (終了時刻)
        setBusinessHours: (start, end) => {
            skiResort.setBusinessHours(start, end);
        },
        
        // 緊急アラートを表示
        showAlert: (message) => {
            skiResort.showEmergencyAlert(message);
        },
        
        // 現在の営業状況を確認
        isOpen: () => {
            return skiResort.getBusinessStatus();
        }
    };
});

// 便利な関数群
const utils = {
    // 現在時刻を取得
    getCurrentTime: () => {
        return new Date().toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // 日付フォーマット
    formatDate: (date) => {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    // 営業時間チェック
    isBusinessHours: (startHour, endHour) => {
        const currentHour = new Date().getHours();
        return currentHour >= startHour && currentHour < endHour;
    }
};

// 使用例（コンソールで実行可能）
/*
// 運行状況を正常に設定
skiResort.updateOperation('normal', '異常なし', 'すべてのリフトが正常に運行中です。');

// 運行状況を異常に設定
skiResort.updateOperation('abnormal', '第3リフト停止', '強風のため第3リフトの運行を停止しております。');

// 営業時間を変更（9:00-16:00に変更）
skiResort.setBusinessHours(9, 16);

// 緊急アラートを表示
skiResort.showAlert('悪天候のため、午後からの営業を中止いたします。');

// 現在営業中かチェック
console.log('営業中:', skiResort.isOpen());
*/