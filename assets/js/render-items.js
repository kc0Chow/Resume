
/**
 * render-items.js
 * Render cards into an existing .block-grid container using JSON data.
 * Usage:
 *   <div class="block-grid" id="game-grid"></div>
 *   <script type="application/json" id="game-data">[ ...items ]</script>
 *   <script src="assets/js/render-items.js"></script>
 *   <script>renderSection('game-grid', '#game-data');</script>
 */
(function () {
  function createCard(item) {
    const card = document.createElement(item.href ? 'a' : 'div');
    card.className = 'block-card';
    if (item.href) {
      card.href = item.href;
      if (item.external) card.target = '_blank';
      if (item.rel) card.rel = item.rel;
    }

    // media
    let media;
    if (item.type === 'video') {
      media = document.createElement('video');
      media.className = 'block-video';
      media.preload = 'metadata';
      media.controls = true;
      media.setAttribute('playsinline', '');
      media.setAttribute('webkit-playsinline', '');
      if (item.poster) media.poster = item.poster;
      const src = document.createElement('source');
      src.src = item.src;
      src.type = item.mime || 'video/mp4';
      media.appendChild(src);
    } else {
      media = document.createElement('img');
      media.className = 'block-thumb';
      media.src = item.thumb || item.full || item.src || '';
      if (item.full) media.dataset.full = item.full;
      media.alt = item.alt || item.title || '';
      media.loading = 'lazy';
    }
    card.appendChild(media);

    // body
    const body = document.createElement('div');
    body.className = 'block-body';

    const title = document.createElement('h3');
    title.className = 'block-title';
    title.textContent = item.title || 'Untitled';
    body.appendChild(title);

    if (item.meta) {
      const meta = document.createElement('p');
      meta.className = 'block-meta';
      meta.textContent = item.meta;
      body.appendChild(meta);
    }
    card.appendChild(body);
    return card;
  }

  function renderSection(gridId, dataSelectorOrArray) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    let items = [];
    if (Array.isArray(dataSelectorOrArray)) {
      items = dataSelectorOrArray;
    } else {
      const el = document.querySelector(dataSelectorOrArray);
      if (!el) return;
      try {
        items = JSON.parse(el.textContent.trim() || '[]');
      } catch (e) {
        console.error('Invalid JSON for', dataSelectorOrArray, e);
        return;
      }
    }

    const frag = document.createDocumentFragment();
    items.forEach(it => frag.appendChild(createCard(it)));
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  // expose
  window.renderSection = renderSection;
})();

async function renderGroupedSection({ rootId, url, addHrBetweenGroups = true, fallbackMessage = '列表載入失敗' }) {
  const root = document.getElementById(rootId);
  if (!root) return;

  try {
    const res = await fetch(url);
    const data = await res.json(); // 期待 { groups: [...] } 或 { items: [...] }

    // 兩種資料形狀都支援：
    // 1) { groups: [ {title, items: [...]}, ... ] }
    // 2) { items: [...] }（無分類，整包一組）
    const groups = Array.isArray(data.groups)
      ? data.groups
      : [{ title: '', items: data.items || [] }];

    groups.forEach((g, idx) => {
      // 分類標題（有 title 才畫）
      if (g.title) {
        const h3 = document.createElement('h3');
        h3.className = 'major';
        h3.textContent = g.title;
        root.appendChild(h3);
      }

      // 本分類卡片容器
      const grid = document.createElement('div');
      grid.className = 'block-grid';
      grid.id = `${rootId}-grid-${idx}`;
      root.appendChild(grid);

      // 用共用卡片渲染器塞進去
      renderSection(grid.id, Array.isArray(g.items) ? g.items : []);

      // 分隔線（最後一組不加）
      if (addHrBetweenGroups && idx < groups.length - 1) {
        root.appendChild(document.createElement('hr'));
      }
    });
  } catch (err) {
    console.error(`載入 ${url} 失敗：`, err);
    root.innerHTML = `<p>${fallbackMessage}，請稍後再試。</p>`;
  }
}
