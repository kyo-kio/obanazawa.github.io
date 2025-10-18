// 一覧へ戻る：history.back() が使えない場合は data-fallback-href に退避
document.getElementById('backToList')?.addEventListener('click', (e) => {
  if (history.length > 1) {
    history.back();
  } else {
    const href = e.currentTarget.getAttribute('data-fallback-href') || 'news.html';
    window.location.href = href;
  }
});

// リンクコピー
document.getElementById('copyLink')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    const original = btn.innerHTML;
    btn.innerHTML = 'コピーしました';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
    }, 1600);
  } catch (err) {
    alert('コピーに失敗しました。手動でURLを選択してください。');
    console.error(err);
  }
});
