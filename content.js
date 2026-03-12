
let chatOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleChat") {
    toggleChatWindow();
  }
  if (request.action === "showAskPopup") {
    showAskSelectionPopup(request.selectedText);
  }
  if (request.action === "localLlmRequest") {
    sendToLocalLlm(request.config, request.prompt);
  }
});

const ACTION_LIST = [
  { label: '💡 3 Prompts generieren', key: 'ahaMoments' },
  { label: 'AI Erkennung', key: 'aiDetection' },
  { label: 'Alternative hierzu', key: 'alternative' },
  { label: 'Antwort schreiben', key: 'writeReply' },
  { label: 'Ansicht erfassen', key: 'captureView' },
  { label: 'Auf speziellen Seiten: Google Sheets: Prompt für Visual Code', key: 'googleSheetsPrompt' },
  { label: 'Autolabel Googlemail', key: 'autolabelGmail' },
  { label: 'Barrierefreiheit prüfen', key: 'accessibility' },
  { label: 'Checkliste', key: 'checklist' },
  { label: 'CODE Code Review', key: 'codeReview' },
  { label: 'CODE Website kopieren (Code)', key: 'copyCode' },
  { label: 'Daten extrahieren', key: 'extractData' },
  { label: 'Diagramm erstellen', key: 'createDiagram' },
  { label: 'E-Mail Draft', key: 'emailDraft' },
  { label: 'Extrahiere Daten', key: 'extractData2' },
  { label: 'FAQ Erstellen', key: 'createFAQ' },
  { label: 'FINANCE Einfluss auf Märkte', key: 'financeMarket' },
  { label: 'FINANCE Finanznews hierzu', key: 'financeNews' },
  { label: 'Faktencheck', key: 'factCheck' },
  { label: 'Genderkorrekte Sprache prüfen', key: 'genderLanguage' },
  { label: 'Grammatik', key: 'grammar' },
  { label: '✏️ Grammatik prüfen', key: 'grammarCheck' },
  { label: 'Im Internet suchen', key: 'webSearch' },
  { label: 'Kontext-Collector', key: 'contextCollector' },
  { label: 'Kurs Page Sherlock', key: 'pageSherlock' },
  { label: 'Lernhilfe', key: 'learningHelp' },
  { label: '🔥 Motivation', key: 'motivation' },
  { label: 'Plagiatscheck', key: 'plagiarism' },
  { label: 'Preisvergleich', key: 'priceCompare' },
  { label: 'Produkt Vor- und Nachteile', key: 'productProsCons' },
  { label: 'Quiz erstellen', key: 'createQuiz' },
  { label: 'SEO Audit', key: 'seoAudit' },
  { label: 'SEO Content Analyzer', key: 'seoContentAnalyzer' },
  { label: 'SEO Hero Image Ideen', key: 'seoHeroImages' },
  { label: 'SEO Keyword Cluster', key: 'seoKeywordCluster' },
  { label: 'SEO Keywords', key: 'seoKeywords' },
  { label: 'SEO Strategie', key: 'seoStrategy' },
  { label: 'SEO Themenideen', key: 'seoTopicIdeas' },
  { label: 'SEO Wandle Website in Artikel um', key: 'seoWebsiteToArticle' },
  { label: 'SOCIAL Bio erstellen', key: 'socialBio' },
  { label: 'SOCIAL Clickbaitartikel hierzu erstellen', key: 'socialClickbait' },
  { label: 'SOCIAL Facebook Ideen', key: 'socialFacebook' },
  { label: 'SOCIAL Hashtags', key: 'socialHashtags' },
  { label: 'SOCIAL Instragram Ideen', key: 'socialInstagram' },
  { label: 'SOCIAL Post generieren', key: 'socialPost' },
  { label: 'SOCIAL Social Media Ideen generell', key: 'socialGeneral' },
  { label: 'SOCIAL TikTok Ideen', key: 'socialTikTok' },
  { label: 'SOCIAL Twitter Ideen', key: 'socialTwitter' },
  { label: 'SOCIAL Vor- und Nachteile erfassen', key: 'socialProsCons' },
  { label: 'SOCIAL YouTube Beschreibung', key: 'socialYouTubeDesc' },
  { label: 'SOCIAL YouTube Ideen', key: 'socialYouTube' },
  { label: 'Seite fragen', key: 'askPage' },
  { label: 'Seite wiederverwenden', key: 'reusePage' },
  { label: '🛒 Shopping-Assistent', key: 'shoppingAssistant' },
  { label: '📖 Story erstellen', key: 'createStory', hasSubmenu: true },
  { label: 'TL;DR', key: 'tldr' },
  { label: 'Text vervollständigen', key: 'completeText' },
  { label: 'Umschreiben', key: 'rewrite' },
  { label: 'Urlaubsplanung', key: 'vacationPlan' },
  { label: 'YouTube Kommentare zusammenfassen', key: 'ytCommentsSummary', youtubeOnly: true },
  { label: 'YouTube Zusammenfassung', key: 'ytSummary', youtubeOnly: true },
  { label: 'Zitate extrahieren', key: 'extractQuotes' },
  { label: 'Zusammenfassen', key: 'summary' },
  { label: '🔬 Deep Research', key: 'deepResearch' },
  { label: '📊 Präsentation erstellen', key: 'createPresentation' }
];

window.addEventListener('load', initializeGeminiLogo);

function toggleChatWindow() {
  let chatContainer = document.getElementById('gemini-chat-overlay');
  
  if (!chatContainer) {
    chatContainer = createChatWindow();
    document.body.appendChild(chatContainer);
    chatOpen = true;
  } else {
    chatContainer.style.display = chatOpen ? 'none' : 'flex';
    chatOpen = !chatOpen;
  }
}

function createChatWindow() {
  const container = document.createElement('div');
  container.id = 'gemini-chat-overlay';
  
  container.innerHTML = `
    <div class="chat-header">
      <span>Gemini Chat</span>
      <button id="close-chat">×</button>
    </div>
    <div class="chat-body">
      <textarea id="prompt-input" placeholder="Dein Prompt für Gemini..."></textarea>
      <button id="send-btn">An Gemini senden</button>
    </div>
  `;
  
  container.querySelector('#close-chat').addEventListener('click', toggleChatWindow);
  container.querySelector('#send-btn').addEventListener('click', sendToGemini);
  
  container.querySelector('#prompt-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendToGemini();
    }
  });
  
  return container;
}

const MODEL_URLS = {
  claude:     'https://claude.ai/new',
  chatgpt:    'https://chatgpt.com/',
  deepseek:   'https://chat.deepseek.com/',
  gemini:     'https://gemini.google.com/app',
  grok:       'https://grok.com/',
  perplexity: 'https://www.perplexity.ai/',
};

function getAiConfig(callback) {
  chrome.storage.sync.get(['selectedModel', 'localLlmBackend', 'localLlmEndpoint', 'localLlmModel', 'localLlmApiKey'], (result) => {
    const model = result.selectedModel || 'gemini';
    if (model === 'local') {
      callback({
        type: 'local',
        backend: result.localLlmBackend,
        endpoint: result.localLlmEndpoint,
        model: result.localLlmModel,
        apiKey: result.localLlmApiKey
      });
    } else {
      callback({
        type: 'cloud',
        url: MODEL_URLS[model] || MODEL_URLS.gemini
      });
    }
  });
}

function sendToGemini() {
  const prompt = document.getElementById('prompt-input').value;
  if (!prompt.trim()) return;

  document.getElementById('prompt-input').value = '';

  chrome.storage.sync.get(['toneMimic'], (result) => {
    const toneMimic = result.toneMimic || '';
    const fullPrompt = toneMimic.trim()
      ? `${prompt}\n\nWende folgende Anweisungen zur Sprache und zum Ton und Stil der Antwort an: ${toneMimic.trim()}`
      : prompt;
    getAiConfig((config) => {
      if (config.type === 'local') {
        sendToLocalLlm(config, fullPrompt);
      } else {
        chrome.storage.local.set({ pendingPrompt: fullPrompt }, () => {
          window.open(config.url, '_blank');
        });
      }
    });
  });
}

function initializeGeminiLogo() {
  const logo = document.createElement('div');
  logo.id = 'gemini-logo';
  logo.innerHTML = '✨';
  
  chrome.storage.local.get(['logoPosition'], (result) => {
    const pos = result.logoPosition || { x: window.innerWidth - 60, y: window.innerHeight - 100 };
    logo.style.left = pos.x + 'px';
    logo.style.top = pos.y + 'px';
  });
  
  document.body.appendChild(logo);
  
  logo.addEventListener('mousedown', startDrag);
  logo.addEventListener('click', showContextMenu);
}

function startDrag(e) {
  e.stopPropagation();
  isDragging = true;
  
  const logo = document.getElementById('gemini-logo');
  const rect = logo.getBoundingClientRect();
  
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragLogo);
  document.addEventListener('mouseup', stopDrag);
}

function dragLogo(e) {
  if (!isDragging) return;
  
  const logo = document.getElementById('gemini-logo');
  let x = e.clientX - dragOffset.x;
  let y = e.clientY - dragOffset.y;
  
  x = Math.max(0, Math.min(x, window.innerWidth - 50));
  y = Math.max(0, Math.min(y, window.innerHeight - 50));
  
  logo.style.left = x + 'px';
  logo.style.top = y + 'px';
}

function stopDrag() {
  if (!isDragging) return;
  isDragging = false;
  
  document.removeEventListener('mousemove', dragLogo);
  document.removeEventListener('mouseup', stopDrag);
  
  const logo = document.getElementById('gemini-logo');
  chrome.storage.local.set({
    logoPosition: {
      x: parseInt(logo.style.left),
      y: parseInt(logo.style.top)
    }
  });
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem('gemini_favorites') || '[]'); } catch { return []; }
}
function saveFavorites(favs) {
  localStorage.setItem('gemini_favorites', JSON.stringify(favs));
}
function getRecentActions() {
  try { return JSON.parse(localStorage.getItem('gemini_recent') || '[]'); } catch { return []; }
}
function addRecentAction(key) {
  let recent = getRecentActions();
  recent = [key, ...recent.filter(k => k !== key)].slice(0, 5);
  localStorage.setItem('gemini_recent', JSON.stringify(recent));
}
function toggleFavorite(key) {
  let favs = getFavorites();
  if (favs.includes(key)) {
    favs = favs.filter(k => k !== key);
  } else {
    favs.push(key);
  }
  saveFavorites(favs);
}

function fuzzyMatch(str, pattern) {
  if (!pattern) return true;
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();
  let si = 0, pi = 0;
  while (si < s.length && pi < p.length) {
    if (s[si] === p[pi]) pi++;
    si++;
  }
  return pi === p.length;
}

function buildMenuItemHtml(item, favorites) {
  const prefixMatch = item.label.match(/^([A-Z]+(?:\s[A-Z]+)*)\s(.+)$/);
  let labelHtml;
  if (prefixMatch && prefixMatch[1].length >= 3 && prefixMatch[1] === prefixMatch[1].toUpperCase() && /[A-Z]{2}/.test(prefixMatch[1])) {
    labelHtml = `<span class="menu-item-prefix">${prefixMatch[1]}</span>${prefixMatch[2]}`;
  } else {
    labelHtml = item.label;
  }
  const hasSubmenu = (item.key === 'summary' || item.key === 'ytSummary' || item.key === 'createStory');
  const isFav = favorites.includes(item.key);
  return `<div class="menu-item${hasSubmenu ? ' has-submenu' : ''}" data-action="${item.key}">` +
    `<span class="menu-item-star${isFav ? ' is-fav' : ''}" data-fav-key="${item.key}" title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">★</span>` +
    `<span class="menu-item-label">${labelHtml}</span>` +
    `<span class="menu-item-copy" data-copy-key="${item.key}" title="Prompt in Zwischenablage kopieren">📋</span>` +
    (hasSubmenu ? '<span class="submenu-arrow">›</span>' : '') +
    `</div>`;
}

function showToast(msg) {
  const old = document.getElementById('gemini-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'gemini-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function attachMenuItemListeners(container, menu, bgMode) {
  container.querySelectorAll('.menu-item').forEach(itemEl => {
    const star = itemEl.querySelector('.menu-item-star');
    if (star) {
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = star.dataset.favKey;
        toggleFavorite(key);
        menu.remove();
        document.removeEventListener('click', closeMenu);
        showContextMenu({ stopPropagation: () => {} });
      });
    }

    const copyBtn = itemEl.querySelector('.menu-item-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = copyBtn.dataset.copyKey;
        handleGeminiAction(key, 'normal', 'nested', true);
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }

    itemEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-item-star')) return;
      if (e.target.classList.contains('menu-item-copy')) return;
      const action = itemEl.dataset.action;
      if (action === 'summary') {
        e.stopPropagation();
        showSummarySubmenu(itemEl, bgMode);
      } else if (action === 'ytSummary') {
        e.stopPropagation();
        showYtSummarySubmenu(itemEl, bgMode);
      } else if (action === 'createStory') {
        e.stopPropagation();
        showStorySubmenu(itemEl, bgMode);
      } else if (action === 'deepResearch' || action === 'motivation') {
          handleGeminiAction(action);
          menu.remove();
          document.removeEventListener('click', closeMenu);
      } else {
        addRecentAction(action);
        handleGeminiAction(action);
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  });
}

function showContextMenu(e) {
  e.stopPropagation();
  if (isDragging) return;

  const oldMenu = document.getElementById('gemini-context-menu');
  if (oldMenu) oldMenu.remove();

  const bgMode = detectBackgroundMode();
  const menu = document.createElement('div');
  menu.id = 'gemini-context-menu';
  menu.setAttribute('data-bg-mode', bgMode);

  const logo = document.getElementById('gemini-logo');
  const rect = logo.getBoundingClientRect();

  const titlebar = document.createElement('div');
  titlebar.id = 'gemini-menu-titlebar';
  titlebar.innerHTML =
    `<div id="gemini-menu-logo">✨</div>` +
    `<span id="gemini-menu-title">AI Befehlsmenü</span>`;
  menu.appendChild(titlebar);

  const searchWrap = document.createElement('div');
  searchWrap.id = 'gemini-menu-search-wrap';
  searchWrap.innerHTML = `<input id="gemini-menu-search" type="text" placeholder="🔍 Suchen..." autocomplete="off" />`;
  menu.appendChild(searchWrap);

  const body = document.createElement('div');
  body.id = 'gemini-menu-body';
  menu.appendChild(body);

  const favorites = getFavorites();
  const recent = getRecentActions();
  const isYouTube = /youtube\.com|youtu\.be/.test(window.location.hostname);
  const visibleItems = ACTION_LIST.filter(item => !item.youtubeOnly || isYouTube);

  const GROUPS = [
    { prefix: 'CODE', label: '💻 Code' },
    { prefix: 'FINANCE', label: '💰 Finance' },
    { prefix: 'SEO', label: '🔍 SEO' },
    { prefix: 'SOCIAL', label: '📱 Social' },
  ];

  function renderBody(searchTerm) {
    body.innerHTML = '';

    const filtered = searchTerm
      ? visibleItems.filter(item => fuzzyMatch(item.label, searchTerm))
      : null;

    const itemsToShow = filtered || visibleItems;

    if (searchTerm) {
      if (itemsToShow.length === 0) {
        body.innerHTML = '<div class="menu-no-results">Keine Ergebnisse</div>';
        return;
      }
      const list = document.createElement('div');
      list.className = 'menu-section-list';
      list.innerHTML = itemsToShow.map(item => buildMenuItemHtml(item, favorites)).join('');
      body.appendChild(list);
      attachMenuItemListeners(list, menu, bgMode);
      return;
    }

    const favSection = document.createElement('div');
    favSection.className = 'menu-section';
    const favKeys = favorites;
    const favItems = favKeys.map(k => ACTION_LIST.find(a => a.key === k)).filter(Boolean);

    const favHeader = document.createElement('div');
    favHeader.className = 'menu-section-header';
    favHeader.innerHTML = `<span>⭐ Favoriten</span>`;
    favSection.appendChild(favHeader);

    const favList = document.createElement('div');
    favList.className = 'menu-section-list';
    if (favItems.length === 0) {
      favList.innerHTML = '<div class="menu-empty-hint">Klicke ★ bei einer Aktion um sie zu favorisieren</div>';
    } else {
      favList.innerHTML = favItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      attachMenuItemListeners(favList, menu, bgMode);
    }
    favSection.appendChild(favList);

    const recentItems = recent.map(k => ACTION_LIST.find(a => a.key === k)).filter(Boolean);
    if (recentItems.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'menu-section menu-section-collapsible';

      const recentHeader = document.createElement('div');
      recentHeader.className = 'menu-section-header menu-section-toggle';
      recentHeader.setAttribute('data-collapsed', 'true');
      recentHeader.innerHTML = `<span>🕐 Zuletzt verwendet</span><span class="menu-toggle-arrow">›</span>`;
      recentSection.appendChild(recentHeader);

      const recentList = document.createElement('div');
      recentList.className = 'menu-section-list menu-section-list--collapsed';
      recentList.innerHTML = recentItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      recentSection.appendChild(recentList);
      attachMenuItemListeners(recentList, menu, bgMode);

      recentHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const collapsed = recentHeader.getAttribute('data-collapsed') === 'true';
        recentHeader.setAttribute('data-collapsed', !collapsed);
        recentList.classList.toggle('menu-section-list--collapsed', !collapsed);
        recentHeader.querySelector('.menu-toggle-arrow').style.transform = collapsed ? 'rotate(90deg)' : '';
      });

      favSection.appendChild(recentSection);
    }

    body.appendChild(favSection);

    const divider = document.createElement('div');
    divider.className = 'menu-divider';
    body.appendChild(divider);

    const groupedPrefixes = new Set(GROUPS.map(g => g.prefix));

    const ungroupedItems = itemsToShow.filter(item => {
      const prefixMatch = item.label.match(/^([A-Z]{2,}(?:\s[A-Z]+)*)\s/);
      return !prefixMatch || !groupedPrefixes.has(prefixMatch[1]);
    });

    if (ungroupedItems.length > 0) {
      const list = document.createElement('div');
      list.className = 'menu-section-list';
      list.innerHTML = ungroupedItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      body.appendChild(list);
      attachMenuItemListeners(list, menu, bgMode);
    }

    for (const group of GROUPS) {
      const groupItems = itemsToShow.filter(item => item.label.startsWith(group.prefix + ' '));
      if (groupItems.length === 0) continue;

      const groupSection = document.createElement('div');
      groupSection.className = 'menu-section menu-section-collapsible';

      const groupHeader = document.createElement('div');
      groupHeader.className = 'menu-section-header menu-section-toggle';
      groupHeader.setAttribute('data-collapsed', 'true');
      groupHeader.innerHTML = `<span>${group.label}</span><span class="menu-toggle-arrow">›</span>`;
      groupSection.appendChild(groupHeader);

      const groupList = document.createElement('div');
      groupList.className = 'menu-section-list menu-section-list--collapsed';
      groupList.innerHTML = groupItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      groupSection.appendChild(groupList);
      attachMenuItemListeners(groupList, menu, bgMode);

      groupHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const collapsed = groupHeader.getAttribute('data-collapsed') === 'true';
        groupHeader.setAttribute('data-collapsed', !collapsed);
        groupList.classList.toggle('menu-section-list--collapsed', !collapsed);
        groupHeader.querySelector('.menu-toggle-arrow').style.transform = collapsed ? 'rotate(90deg)' : '';
      });

      body.appendChild(groupSection);
    }
  }

  renderBody('');

  menu.querySelector('#gemini-menu-search').addEventListener('input', (e) => {
    renderBody(e.target.value.trim());
  });
  menu.querySelector('#gemini-menu-search').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  menu.style.left = '0px';
  menu.style.top = '0px';
  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  let left = rect.left - menuRect.width - 10;
  if (left < 5) left = rect.right + 10;
  let top = rect.top - menuRect.height - 10;
  if (top < 5) top = rect.bottom + 10;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

function showSummarySubmenu(menuItem, bgMode) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();
  
  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  submenu.setAttribute('data-bg-mode', bgMode);
  
  submenu.innerHTML = `
    <div class="submenu-item" data-summary-type="normal">📋 Normale Zusammenfassung</div>
    <div class="submenu-item" data-summary-type="chapter">📖 Kapitel Zusammenfassung</div>
    <div class="submenu-item" data-summary-type="short">⚡ Super kurze Zusammenfassung</div>
  `;
  
  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  
  document.body.appendChild(submenu);
  
  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const summaryType = e.currentTarget.dataset.summaryType;
      addRecentAction('summary');
      handleGeminiAction('summary', summaryType);
      document.getElementById('gemini-context-menu')?.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
}

function showYtSummarySubmenu(menuItem, bgMode) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();

  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  submenu.setAttribute('data-bg-mode', bgMode);

  submenu.innerHTML = `
    <div class="submenu-item" data-yt-summary-type="nested">🗂️ Nested</div>
    <div class="submenu-item" data-yt-summary-type="keyconcept">🔑 Schlüsselkonzept</div>
    <div class="submenu-item" data-yt-summary-type="headlines">📰 Überschriften</div>
    <div class="submenu-item" data-yt-summary-type="factcheck">🔍 Fakten prüfen</div>
  `;

  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';

  document.body.appendChild(submenu);

  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const ytSummaryType = e.currentTarget.dataset.ytSummaryType;
      addRecentAction('ytSummary');
      handleGeminiAction('ytSummary', 'normal', ytSummaryType);
      document.getElementById('gemini-context-menu')?.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
}

function showStorySubmenu(menuItem, bgMode) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();

  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  submenu.setAttribute('data-bg-mode', bgMode);

  submenu.innerHTML = `
    <div class="submenu-item" data-story-type="pen_and_paper">Pen & Paper</div>
    <div class="submenu-item" data-story-type="dramatic">Dramatisch</div>
    <div class="submenu-item" data-story-type="clickbait">Clickbait</div>
  `;

  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';

  document.body.appendChild(submenu);

  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const storyType = e.currentTarget.dataset.storyType;
      addRecentAction('createStory');
      handleGeminiAction('createStory', storyType);
      document.getElementById('gemini-context-menu')?.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
}

function closeMenu() {
  const menu = document.getElementById('gemini-context-menu');
  const submenu = document.getElementById('gemini-submenu');
  if (menu) {
    menu.remove();
    document.removeEventListener('click', closeMenu);
  }
  if (submenu) submenu.remove();
}

function detectBackgroundMode() {
  try {
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const rgbMatch = bgColor.match(/\d+/g);
    
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      return luminance > 0.5 ? 'light' : 'dark';
    }
  } catch (e) {
    console.log('Fehler beim Erkennen von Hintergrundfarbe:', e);
  }
  
  const docColor = window.getComputedStyle(document.documentElement).backgroundColor;
  if (docColor && docColor !== 'rgba(0, 0, 0, 0)') {
    const rgbMatch = docColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? 'light' : 'dark';
    }
  }
  
  return 'light';
}

function getPageContext() {
  const selectors = ['article', 'main', '[role="main"]', '.content', '.post-content',
    '.entry-content', '.article-body', '.page-content', '#content', '#main'];
  let textEl = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 200) {
      textEl = el;
      break;
    }
  }
  const rawText = (textEl || document.body).innerText;
  const cleanText = rawText.replace(/\n{3,}/g, '\n\n').trim();

  const selectedText = window.getSelection()?.toString()?.trim();

  return {
    url: window.location.href,
    title: document.title,
    text: selectedText
      ? `[Vom Nutzer markierter Text]:\n${selectedText.substring(0, 10000)}`
      : cleanText.substring(0, 10000)
  };
}

function loadMarked() {
    return new Promise((resolve, reject) => {
        if (window.marked) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function showResponseModal(responseText, type = 'modal') {
  await loadMarked();
  if (type === 'toast') {
    const oldToast = document.getElementById('gemini-response-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'gemini-response-toast';
    toast.innerHTML = `
      <div class="toast-header">
        <span>Stimmungs-Analyse</span>
        <button id="close-toast-btn">×</button>
      </div>
      <div class="toast-body"></div>
    `;

    const responseBody = toast.querySelector('.toast-body');
    if (window.marked) {
      responseBody.innerHTML = window.marked.parse(responseText);
    } else {
      responseBody.textContent = responseText;
    }
    
    document.body.appendChild(toast);

    toast.querySelector('#close-toast-btn').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.remove();
    }, 15000);

  } else {
    const overlay = document.createElement('div');
    overlay.id = 'gemini-response-overlay';

    const modal = document.createElement('div');
    modal.id = 'gemini-response-modal';
    
    modal.innerHTML = `
      <div class="response-header">
        <span>AI-Antwort</span>
        <button id="copy-response-btn" title="In Zwischenablage kopieren">📋</button>
        <button id="close-response-btn">×</button>
      </div>
      <div class="response-body"></div>
    `;

    const responseBody = modal.querySelector('.response-body');
    if (window.marked) {
      responseBody.innerHTML = window.marked.parse(responseText);
    } else {
      responseBody.textContent = responseText;
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#close-response-btn').addEventListener('click', () => {
      overlay.remove();
    });
    
    modal.querySelector('#copy-response-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(responseText).then(() => {
        showToast('✅ Antwort kopiert!');
      }).catch(() => {
        showToast('❌ Kopieren fehlgeschlagen');
      });
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
}

async function sendToLocalLlm(config, prompt, type = 'modal') {
  showToast('Sende an lokales LLM...');
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `**Fehler bei der Anfrage an das lokale LLM:**\n\n**Status:** ${response.status} ${response.statusText}\n\n**Details:**\n\`\`\`\n${errorText}\n\`\`\``;
      showResponseModal(errorMessage, type);
      return errorMessage;
    }

    const responseData = await response.json();
    const message = responseData.choices?.[0]?.message?.content || responseData.message?.content || JSON.stringify(responseData, null, 2);
    
    if(type !== 'silent') {
        showResponseModal(message, type);
    }
    return message;

  } catch (error) {
    const errorMessage = `**Fehler bei der Verbindung zum lokalen LLM:**\n\n**Fehlermeldung:**\n\`\`\`\n${error.message}\n\`\`\`\n\n**Mögliche Ursachen:**\n- Der lokale LLM-Server läuft nicht.\n- Der API-Endpunkt ist falsch.\n- CORS ist auf dem Server nicht korrekt konfiguriert.`;
    if(type !== 'silent') {
        showResponseModal(errorMessage, type);
    }
    return errorMessage;
  }
}

function showAhaMomentsResult(resultText) {
    const overlay = document.createElement('div');
    overlay.id = 'aha-moments-overlay';

    const container = document.createElement('div');
    container.className = 'aha-moments-container';

    const prompts = resultText.split('\n').filter(line => line.match(/^\d\./));
    
    prompts.forEach(promptText => {
        const match = promptText.match(/^\d\. \[(.+)\]: (.+)/);
        if (match) {
            const title = match[1];
            const text = match[2];

            const card = document.createElement('div');
            card.className = 'aha-moment-card';
            card.innerHTML = `
                <div class="aha-card-title">${title}</div>
                <div class="aha-card-text">${text}</div>
                <button class="aha-card-copy-btn">Kopieren</button>
            `;
            
            card.querySelector('.aha-card-copy-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => {
                    showToast('✅ Prompt kopiert!');
                }).catch(() => {
                    showToast('❌ Kopieren fehlgeschlagen');
                });
            });

            container.appendChild(card);
        }
    });
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function showGrammarCheckResult(resultText) {
    const overlay = document.createElement('div');
    overlay.id = 'grammar-check-overlay';

    const modal = document.createElement('div');
    modal.className = 'grammar-check-modal';

    const parts = resultText.split('---');
    const errorList = parts[0] || 'Keine Fehler gefunden.';
    const correctedText = parts[1] || '';

    modal.innerHTML = `
        <div class="grammar-check-header">
            <span>Grammatik-Prüfung</span>
            <button id="close-grammar-check-btn">×</button>
        </div>
        <div class="grammar-check-body">
            <div class="grammar-column">
                <h3>Fehlerliste</h3>
                <div class="error-list"></div>
            </div>
            <div class="grammar-column">
                <h3>Korrigierter Text</h3>
                <div class="corrected-text"></div>
                <button id="copy-corrected-text-btn">Text kopieren</button>
            </div>
        </div>
    `;

    const errorListDiv = modal.querySelector('.error-list');
    if (window.marked) {
        errorListDiv.innerHTML = window.marked.parse(errorList);
    } else {
        errorListDiv.innerText = errorList;
    }
    
    const correctedTextDiv = modal.querySelector('.corrected-text');
    if (window.marked) {
        correctedTextDiv.innerHTML = window.marked.parse(correctedText);
    } else {
        correctedTextDiv.innerText = correctedText;
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#close-grammar-check-btn').addEventListener('click', () => {
        overlay.remove();
    });

    modal.querySelector('#copy-corrected-text-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(correctedText).then(() => {
            showToast('✅ Text kopiert!');
        }).catch(() => {
            showToast('❌ Kopieren fehlgeschlagen');
        });
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function showShoppingAssistantResult(resultText) {
    const overlay = document.createElement('div');
    overlay.id = 'shopping-assistant-overlay';

    const modal = document.createElement('div');
    modal.className = 'shopping-assistant-modal';

    modal.innerHTML = `
        <div class="shopping-assistant-header">
            <span>Shopping-Assistent</span>
            <button id="close-shopping-assistant-btn">×</button>
        </div>
        <div class="shopping-assistant-body"></div>
    `;

    const body = modal.querySelector('.shopping-assistant-body');
    const sections = resultText.split(/\n\d\.\s\*\*/);

    sections.forEach((sectionText, index) => {
        if (!sectionText.trim()) return;

        const section = document.createElement('div');
        section.className = 'shopping-section';

        const match = sectionText.match(/(.+?):\*\*([\s\S]*)/);
        if (match) {
            const title = match[1].replace(/^\*\*/, '');
            const content = match[2];

            section.innerHTML = `
                <div class="shopping-section-header">
                    <h3>${title}</h3>
                    <button class="copy-section-btn">Kopieren</button>
                </div>
                <div class="shopping-section-content"></div>
            `;

            const contentDiv = section.querySelector('.shopping-section-content');
            if(window.marked) {
                contentDiv.innerHTML = window.marked.parse(content);
            } else {
                contentDiv.innerText = content;
            }

            section.querySelector('.copy-section-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    showToast('✅ Sektion kopiert!');
                }).catch(() => {
                    showToast('❌ Kopieren fehlgeschlagen');
                });
            });
            body.appendChild(section);
        }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#close-shopping-assistant-btn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function showDeepResearchPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'deep-research-overlay';

    const popup = document.createElement('div');
    popup.className = 'deep-research-popup';

    popup.innerHTML = `
        <div class="deep-research-header">
            <span>Deep Research Thema</span>
            <button id="close-deep-research-btn">×</button>
        </div>
        <div class="deep-research-body">
            <textarea id="deep-research-input" placeholder="Thema eingeben..."></textarea>
            <button id="start-deep-research-btn">Recherche starten</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    popup.querySelector('#close-deep-research-btn').addEventListener('click', () => {
        overlay.remove();
    });

    popup.querySelector('#start-deep-research-btn').addEventListener('click', () => {
        const topic = document.getElementById('deep-research-input').value;
        if (!topic.trim()) return;
        overlay.remove();

        const prompt = `Bevor du antwortest, stelle mir so viele Rückfragen, bis du zu mindestens 95 % sicher bist, dass du die folgende Aufgabe erfolgreich und vollständig erfüllen kannst.

Aufgabe: ${topic}

Recherchiere dieses Thema tiefgründig und umfassend nach folgenden Regeln:

1. **Quellen:** Verwende ausschließlich verifizierbare, glaubwürdige Quellen: offizielle Dokumentationen, Regierungs- oder Herstellerdatenbanken, peer-reviewte Publikationen oder anerkannte Fachmedien. Keine Blogs, Foren oder nicht verifizierbaren Seiten.

2. **Keine Spekulation:** Spekuliere nicht und erfinde keine Inhalte. Wenn eine Antwort nicht verifiziert werden kann, formuliere das explizit: „Diese Information konnte nicht verifiziert werden."

3. **Struktur der Ausgabe:**
   - Executive Summary (3–5 Sätze)
   - Hauptbefunde (gegliedert nach Themenbereichen)
   - Kritische Gegenargumente oder offene Fragen in der Forschung
   - Quellenverzeichnis mit Angabe von Autor, Titel, Jahr und URL (falls verfügbar)

4. **Transparenz:** Kennzeichne klar, was gesichertes Wissen ist, was aktuelle Forschungslage ist und was noch unklar oder umstritten ist.

Beginne mit deinen Rückfragen.`;

        getAiConfig((config) => {
            if (config.type === 'local') {
                sendToLocalLlm(config, prompt);
            } else {
                chrome.storage.local.set({ pendingPrompt: prompt }, () => {
                    window.open(config.url, '_blank');
                });
            }
        });
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function showMotivationPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'motivation-overlay';

    const popup = document.createElement('div');
    popup.className = 'motivation-popup';

    popup.innerHTML = `
        <div class="motivation-header">
            <span>Motivation für welche Aufgabe?</span>
            <button id="close-motivation-btn">×</button>
        </div>
        <div class="motivation-body">
            <textarea id="motivation-input" placeholder="Aufgabe beschreiben..."></textarea>
            <button id="start-motivation-btn">Motivation holen</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    popup.querySelector('#close-motivation-btn').addEventListener('click', () => {
        overlay.remove();
    });

    popup.querySelector('#start-motivation-btn').addEventListener('click', () => {
        const task = document.getElementById('motivation-input').value;
        if (!task.trim()) return;
        overlay.remove();

        const prompt = `Ich fühle mich gerade unmotiviert, folgende Aufgabe anzugehen: ${task}

Bitte hilf mir in zwei Schritten:

Schritt 1 – Verstehen:
Analysiere empathisch und ehrlich, warum ich mich bei dieser spezifischen Aufgabe wahrscheinlich so fühle. Berücksichtige mögliche psychologische Ursachen wie Prokrastination, Angst vor Versagen, Überwältigung, Langeweile oder fehlendes Sinngefühl. Sei direkt – kein falsches Aufmuntern.

Schritt 2 – Erster Schritt:
Schlage mir genau einen einzigen, kleinen, konkreten Schritt vor, mit dem ich jetzt sofort beginnen kann – so klein, dass er sich lächerlich einfach anfühlt. Erkläre kurz, warum genau dieser erste Schritt hilft, den inneren Widerstand zu überwinden.

Halte die Antwort kompakt (max. 150 Wörter gesamt).`;

        getAiConfig((config) => {
            if (config.type === 'local') {
                sendToLocalLlm(config, prompt, 'toast');
            } else {
                chrome.runtime.sendMessage({
                    action: 'summarizeWithCloud',
                    prompt: prompt,
                    config: config
                });
            }
        });
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function handleGeminiAction(action, summaryType = 'normal', ytSummaryType = 'nested', clipboardOnly = false) {
    if (action === 'deepResearch') {
        showDeepResearchPopup();
        return;
    }
    if (action === 'motivation') {
        showMotivationPopup();
        return;
    }

  const context = getPageContext();
  let prompt = '';
  
  switch(action) {
    case 'createPresentation':
        prompt = `Ich möchte auf Basis der folgenden Website eine strukturierte Präsentation erstellen.

Website: ${context.url}
Seiteninhalt: ${context.text.substring(0, 3000)}

Erstelle eine vollständige Präsentationsgliederung mit den folgenden Anforderungen:
- 6–10 Folien
- Jede Folie hat: Titel, 3–5 Bullet Points, optionaler Speaker-Note-Hinweis
- Folie 1: Titelfolie mit Kernaussage
- Folie 2: Problemstellung / Kontext
- Folien 3–8: Hauptinhalt strukturiert nach Themenschwerpunkten der Website
- Vorletzte Folie: Fazit & Key Takeaways
- Letzte Folie: Call-to-Action oder weiterführende Ressourcen

Ausgabe als strukturierte Markdown-Liste, bereit zum Übertragen in PowerPoint, Google Slides oder Notion.
Sprache der Präsentation: Deutsch.`;
        break;
    case 'ahaMoments':
        prompt = `Ich besuche gerade die folgende Website: ${context.url}

Seiteninhalt (Auszug): ${context.text.substring(0, 2000)}

Generiere mir genau 3 prägnante Prompts, die ich direkt in einer KI (Claude, ChatGPT etc.) verwenden kann, um überraschende, wertvolle oder nicht offensichtliche Erkenntnisse über diese Website, ihr Thema oder ihren Inhalt zu gewinnen. 

Anforderungen an die Prompts:
- Jeder Prompt soll einen echten "Aha-Moment" erzeugen – keine oberflächlichen Fragen
- Prompts sollen direkt copy-pasteable sein
- Unterschiedliche Perspektiven (z.B. kritisch, strategisch, kreativ)

Format:
1. [Prompt-Titel]: [Vollständiger Prompt-Text]
2. [Prompt-Titel]: [Vollständiger Prompt-Text]
3. [Prompt-Titel]: [Vollständiger Prompt-Text]`;
        break;
    case 'grammarCheck':
        prompt = `Bitte prüfe den folgenden Text sorgfältig auf Grammatik-, Rechtschreib- und Zeichensetzungsfehler sowie stilistische Schwächen.

Vorgehen:
1. Liste alle gefundenen Fehler mit Textstelle auf
2. Erkläre kurz, warum es ein Fehler ist
3. Liefere am Ende den vollständig korrigierten Text als saubere Version

Wichtig: Verändere den Inhalt und Stil des Textes nicht – korrigiere nur sprachliche Fehler.
Sprache des Textes: automatisch erkennen.

Text:
"""
${context.text}
"""`;
        break;
    case 'shoppingAssistant':
        prompt = `Du bist mein persönlicher Shopping-Assistent mit dem Ziel, mir bei jedem Kauf maximal Geld, Zeit und Aufwand zu sparen. Ich befinde mich gerade auf folgender Produktseite:

URL: ${context.url}
Seiteninhalt: ${context.text.substring(0, 2000)}

Führe für mich folgende Schritte durch:

1. **Produktidentifikation:** Nenne das genaue Produkt, Modell und relevante Spezifikationen.

2. **Preischeck:** Wo ist dieses Produkt aktuell günstiger erhältlich? Nenne bekannte Preisvergleichsportale (idealo, geizhals, Google Shopping) und schätze, ob der aktuelle Preis gut, durchschnittlich oder überteuert ist.

3. **Gutscheincodes:** Welche Gutschein- oder Rabattcodes könnten für diesen Shop aktuell funktionieren? Nenne gängige Quellen (coupert, honey, retailmenot) und typische Code-Muster des Shops.

4. **Cashback-Möglichkeiten:** Bei welchen Cashback-Portalen (Shoop, Igraal, Rakuten) ist dieser Shop gelistet? Wie hoch ist typischerweise die Cashback-Quote?

5. **Kaufempfehlung:** Soll ich jetzt kaufen oder warten? Begründe kurz (Saisonalität, Black Friday, Produktzyklus etc.).

6. **Alternativen:** Nenne 2–3 vergleichbare Produkte, die ein besseres Preis-Leistungs-Verhältnis bieten könnten.

Sei konkret, direkt und spare keine Details.`;
        break;
    case 'createStory':
        const style = summaryType; // Reusing summaryType parameter for style
        prompt = `Du bist ein erfahrener Geschichtenerzähler im Stil: ${style}.

Bevor du mit dem Schreiben beginnst, stelle mir genau 40 Fragen – und zwar genau die Fragen, die ein neugieriger Leser nach dem Lesen der fertigen Geschichte haben würde. Diese Fragen sollen aufdecken:
- Offene Handlungsstränge und potenzielle Plot Holes
- Motivationen der Charaktere, die unklar sein könnten
- Logische Lücken in der Weltenkonstruktion
- Zeitliche oder räumliche Widersprüche
- Emotionale Glaubwürdigkeit der Figuren

Nachdem ich alle 40 Fragen beantwortet habe, schreibe die Geschichte nach folgenden Pflichtregeln:
- **Keine Plot Holes:** Jede offene Frage aus den 40 Antworten muss in der Geschichte adressiert sein
- **Kontinuität:** Namen, Eigenschaften, Orte und Zeitlinien müssen konsistent bleiben – kein Element darf sich zwischen Szenen widersprechen
- **Kein loser Faden:** Jede eingeführte Figur oder jedes eingeführte Element muss eine Funktion für die Geschichte haben
- **Leserführung:** Der Leser soll zu keinem Zeitpunkt verwirrt sein, was gerade passiert und warum

Stil-spezifische Zusatzanweisungen:
- **Pen & Paper:** Schreibe im Stil eines Tabletop-RPG-Abenteuers mit interaktiven Entscheidungspunkten, Hinweisen für Würfelmechaniken und einer detailreichen Welt für den Spielleiter
- **Dramatisch:** Schreibe mit maximaler emotionaler Tiefe, inneren Monologen, langsam aufgebautem Konflikt und einem unerwarteten, aber logisch nachvollziehbaren Wendepunkt
- **Clickbait:** Schreibe mit Cliffhangern am Ende jedes Absatzes, reißerischen Zwischenüberschriften, emotionalen Hochs und Tiefs und einem Finale, das zum Weiterteilen animiert

Beginne jetzt mit den 40 Fragen. Nummeriere sie durch.`;
        break;
    default:
        const labelObj = ACTION_LIST.find(a => a.key === action);
        const labelText = labelObj ? labelObj.label : action;
        prompt = `PLACEHOLDER: Aktion '${labelText}' ausführen auf Seite ${context.url}`;
        break;
  }
  
  if (prompt) {
      if (clipboardOnly) {
          navigator.clipboard.writeText(prompt).then(() => {
              showToast('✅ Prompt kopiert!');
          }).catch(() => {
              showToast('❌ Kopieren fehlgeschlagen');
          });
          return;
      }

      chrome.storage.sync.get(['toneMimic'], (result) => {
          const toneMimic = result.toneMimic || '';
          const fullPrompt = toneMimic.trim()
              ? `${prompt}\n\nWende folgende Anweisungen zur Sprache und zum Ton und Stil der Antwort an: ${toneMimic.trim()}`
              : prompt;
          getAiConfig((config) => {
              if (config.type === 'local') {
                  sendToLocalLlm(config, fullPrompt, 'silent').then(response => {
                      if (action === 'ahaMoments') {
                          showAhaMomentsResult(response);
                      } else if (action === 'grammarCheck') {
                          showGrammarCheckResult(response);
                      } else if (action === 'shoppingAssistant') {
                          showShoppingAssistantResult(response);
                      } else {
                          showResponseModal(response);
                      }
                  });
              } else {
                  chrome.storage.local.set({ pendingPrompt: fullPrompt }, () => {
                      window.open(config.url, '_blank');
                  });
              }
          });
      });
  }
}

function showAskSelectionPopup(selectedText) {
  const old = document.getElementById('gemini-ask-popup');
  if (old) old.remove();

  const bgMode = detectBackgroundMode();

  const overlay = document.createElement('div');
  overlay.id = 'gemini-ask-popup-overlay';

  const popup = document.createElement('div');
  popup.id = 'gemini-ask-popup';
  popup.setAttribute('data-bg-mode', bgMode);
  popup.innerHTML = `
    <div id="gemini-ask-popup-header">
      <span>❓ Frage zum markierten Text</span>
      <button id="gemini-ask-popup-close">×</button>
    </div>
    <div id="gemini-ask-popup-preview">${selectedText.substring(0, 200)}${selectedText.length > 200 ? ' …' : ''}</div>
    <textarea id="gemini-ask-popup-input" placeholder="Deine Frage eingeben …" rows="3"></textarea>
    <div id="gemini-ask-popup-actions">
      <button id="gemini-ask-popup-cancel">Abbrechen</button>
      <button id="gemini-ask-popup-send">Frage senden ✨</button>
    </div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  const input = popup.querySelector('#gemini-ask-popup-input');
  input.focus();

  function closePopup() {
    overlay.remove();
  }

  popup.querySelector('#gemini-ask-popup-close').addEventListener('click', closePopup);
  popup.querySelector('#gemini-ask-popup-cancel').addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) sendAskQuestion();
    if (e.key === 'Escape') closePopup();
  });

  popup.querySelector('#gemini-ask-popup-send').addEventListener('click', sendAskQuestion);

  function sendAskQuestion() {
    const question = input.value.trim();
    if (!question) { input.focus(); return; }

    const prompt = `Du bist ein hilfreicher Assistent.\n\n**Markierter Text:**\n\n> ${selectedText}\n\n**Frage des Nutzers:**\n${question}\n\n**Anweisung:**\n- Beziehe dich direkt auf den markierten Text\n- Antworte präzise und auf Deutsch\n- Nutze Markdown-Formatierung für eine klare Struktur`;

    closePopup();

    chrome.storage.sync.get(['selectedModel', 'toneMimic'], (result) => {
      const model = result.selectedModel || 'gemini';
      const toneMimic = result.toneMimic || '';
      const fullPrompt = toneMimic.trim()
        ? `${prompt}\n\nWende folgende Anweisungen zur Sprache und zum Ton an: ${toneMimic.trim()}`
        : prompt;

      getAiConfig((config) => {
        if (config.type === 'local') {
          sendToLocalLlm(config, fullPrompt);
        } else {
          chrome.storage.local.set({ pendingPrompt: fullPrompt }, () => {
            window.open(config.url, '_blank');
          });
        }
      });
    });
  }
}
