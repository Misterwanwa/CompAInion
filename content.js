
let chatOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleChat") toggleChatWindow();
  if (request.action === "showAskPopup") showAskSelectionPopup(request.selectedText);
  if (request.action === "localLlmRequest") sendToLocalLlm(request.config, request.prompt);
});

const MODEL_URLS = {
  claude: 'https://claude.ai/new',
  chatgpt: 'https://chatgpt.com/',
  deepseek: 'https://chat.deepseek.com/',
  gemini: 'https://gemini.google.com/app',
  grok: 'https://grok.com/',
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
      <textarea id="prompt-input" placeholder="Dein Prompt fuer Gemini..."></textarea>
      <button id="send-btn">An Gemini senden</button>
    </div>
  `;
  container.querySelector('#close-chat').addEventListener('click', toggleChatWindow);
  container.querySelector('#send-btn').addEventListener('click', sendToGemini);
  container.querySelector('#prompt-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) sendToGemini();
  });
  return container;
}

function initializeGeminiLogo() {
  const logo = document.createElement('div');
  logo.id = 'gemini-logo';
  logo.innerHTML = '✨';
  // Standard-Position (oben links)
  logo.style.left = '20px';
  logo.style.top = '20px';
  
  // Versuche gespeicherte Position zu laden
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['logoPosition'], (result) => {
        if (result.logoPosition) {
          logo.style.left = result.logoPosition.x + 'px';
          logo.style.top = result.logoPosition.y + 'px';
        }
      });
    }
  } catch (e) {
    console.log('Storage nicht verfuegbar, verwende Standard-Position');
  }
  
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
  if (!logo) return;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        logoPosition: { x: parseInt(logo.style.left) || 0, y: parseInt(logo.style.top) || 0 }
      });
    }
  } catch (e) {
    console.log('Storage nicht verfuegbar');
  }
}

window.addEventListener('load', initializeGeminiLogo);

// Hauptaktionen (alphabetisch sortiert)
const ACTION_LIST = [
  { label: '3 Prompts generieren', key: 'ahaMoments', implemented: true },
  { label: 'AI Erkennung', key: 'aiDetection', implemented: true },
  { label: 'Alternative hierzu', key: 'alternative', implemented: false },
  { label: 'Antwort schreiben', key: 'writeReply', implemented: false },
  { label: 'Ansicht erfassen', key: 'captureView', implemented: true },
  { label: '🚧 Barrierefreiheit pruefen', key: 'accessibility', implemented: false },
  { label: '🚧 Benoetige ich das wirklich?', key: 'doINeedThis', implemented: true },
  { label: '🚧 Checkliste', key: 'checklist', implemented: false },
  { label: '🚧 Deep Research', key: 'deepResearch', implemented: true },
  { label: '🚧 Diagramm erstellen', key: 'createDiagram', implemented: false },
  { label: '🚧 E-Mail Entwurf', key: 'emailDraft', implemented: false },
  { label: '🚧 FAQ Erstellen', key: 'createFAQ', implemented: false },
  { label: '🚧 Faktencheck', key: 'factCheck', implemented: true },
  { label: '🚧 Genderkorrekte Sprache pruefen', key: 'genderLanguage', implemented: false },
  { label: '🚧 Grammatik pruefen', key: 'grammarCheck', implemented: true },
  { label: '🚧 Im Internet suchen', key: 'webSearch', implemented: false },
  { label: '🚧 Lernhilfe', key: 'learningHelp', implemented: false },
  { label: '🚧 Motivation', key: 'motivation', implemented: true },
  { label: '🚧 Plagiatscheck', key: 'plagiarism', implemented: true },
  { label: '🚧 Präsentation erstellen', key: 'createPresentation', implemented: true },
  { label: '🚧 Preisvergleich', key: 'priceCompare', implemented: false },
  { label: '🚧 Produkt Vor- und Nachteile', key: 'productProsCons', implemented: false },
  { label: '🚧 Quiz erstellen', key: 'createQuiz', implemented: false },
  { label: '🚧 Rezept', key: 'recipe', hasSubmenu: true, implemented: true },
  { label: '🚧 Seite wiederverwenden', key: 'reusePage', implemented: false },
  { label: '🚧 Shopping-Assistent', key: 'shoppingAssistant', implemented: true },
  { label: 'Sokrates-Fragekette', key: 'socraticChain', implemented: true },
  { label: '🚧 Story erstellen', key: 'createStory', hasSubmenu: true, implemented: true },
  { label: '🚧 TL;DR', key: 'tldr', implemented: true },
  { label: '🚧 Text vervollständigen', key: 'completeText', implemented: false },
  { label: '🚧 Uebersetzen', key: 'translate', implemented: true },
  { label: '🚧 Umschreiben', key: 'rewrite', implemented: true },
  { label: '🚧 Urlaubsplanung', key: 'vacationPlan', implemented: false },
  { label: '🚧 Website analysieren', key: 'pageSherlock', implemented: false },
  { label: '🚧 Wie ist die Rechtslage?', key: 'legalCheck', implemented: true },
  { label: '🚧 Witz erzählen', key: 'tellJoke', implemented: true },
  { label: '🚧 Zitate extrahieren', key: 'extractQuotes', implemented: false },
  { label: '🚧 Zusammenfassen', key: 'summary', implemented: true },
  // Gruppen am Ende (ausklappbar)
  { label: '▼ CODE Tools', key: 'CODE_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ SEO Tools', key: 'SEO_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ SOCIAL Media Tools', key: 'SOCIAL_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ FINANCE Tools', key: 'FINANCE_MENU', isMenu: true, isCollapsible: true }
];

// Untermenüs
const SUBMENUS = {
  CODE_MENU: [
    { label: '🚧 CODE Code Review', key: 'codeReview', implemented: false },
    { label: '🚧 CODE Website kopieren', key: 'copyCode', implemented: false }
  ],
  SEO_MENU: [
    { label: '🚧 SEO Audit', key: 'seoAudit', implemented: false },
    { label: '🚧 SEO Content Analyzer', key: 'seoContentAnalyzer', implemented: false },
    { label: '🚧 SEO Hero Image Ideen', key: 'seoHeroImages', implemented: false },
    { label: '🚧 SEO Keyword Cluster', key: 'seoKeywordCluster', implemented: false },
    { label: '🚧 SEO Keywords', key: 'seoKeywords', implemented: false },
    { label: '🚧 SEO Strategie', key: 'seoStrategy', implemented: false },
    { label: '🚧 SEO Themenideen', key: 'seoTopicIdeas', implemented: false },
    { label: '🚧 SEO Website zu Artikel', key: 'seoWebsiteToArticle', implemented: false }
  ],
  SOCIAL_MENU: [
    { label: '🚧 SOCIAL Bio erstellen', key: 'socialBio', implemented: false },
    { label: '🚧 SOCIAL Clickbait-Artikel', key: 'socialClickbait', implemented: false },
    { label: '🚧 SOCIAL Facebook Ideen', key: 'socialFacebook', implemented: false },
    { label: '🚧 SOCIAL Hashtags', key: 'socialHashtags', implemented: false },
    { label: '🚧 SOCIAL Instagram Ideen', key: 'socialInstagram', implemented: false },
    { label: '🚧 SOCIAL Post generieren', key: 'socialPost', implemented: false },
    { label: '🚧 SOCIAL Social Media Ideen', key: 'socialGeneral', implemented: false },
    { label: '🚧 SOCIAL TikTok Ideen', key: 'socialTikTok', implemented: false },
    { label: '🚧 SOCIAL Twitter Ideen', key: 'socialTwitter', implemented: false },
    { label: '🚧 SOCIAL Vor-/Nachteile Post', key: 'socialProsCons', implemented: false },
    { label: '🚧 SOCIAL YouTube Beschreibung', key: 'socialYouTubeDesc', implemented: false },
    { label: '🚧 SOCIAL YouTube Ideen', key: 'socialYouTube', implemented: false }
  ],
  FINANCE_MENU: [
    { label: '🚧 FINANCE Aktien Analyse', key: 'financeStockAnalysis', implemented: false },
    { label: 'FINANCE Einfluss auf Märkte', key: 'financeMarket', implemented: true },
    { label: 'FINANCE Finanznews hierzu', key: 'financeNews', implemented: true },
    { label: '🚧 FINANCE Investitionsrechner', key: 'financeInvestment', implemented: false },
    { label: '🚧 FINANCE Portfolio Bewertung', key: 'financePortfolio', implemented: false }
  ],
  RECIPE_MENU: [
    { label: '🚧 Einfach Backen Format', key: 'recipeSimpleBake', implemented: true },
    { label: '🚧 Zutaten auflisten', key: 'recipeIngredients', implemented: true },
    { label: '🚧 Zutat ersetzen...', key: 'recipeReplace', implemented: true },
    { label: '🚧 Alternatives Rezept', key: 'recipeAlternative', implemented: true },
    { label: '🚧 Für Küchengerät umwandeln...', key: 'recipeDevice', implemented: true },
    { label: '🚧 Wie hübsch anrichten', key: 'recipePlating', implemented: true },
    { label: '🚧 Kalorien & Nährwerte', key: 'recipeNutrition', implemented: true }
  ]
};

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
  if (favs.includes(key)) favs = favs.filter(k => k !== key);
  else favs.push(key);
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

function showToast(msg) {
  const old = document.getElementById('gemini-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'gemini-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function buildMenuItemHtml(item, favorites, isSubmenuItem = false) {
  const hasSubmenu = item.hasSubmenu || item.isMenu;
  const isFav = favorites.includes(item.key);
  // Baustellenzeichen 🚧 immer beibehalten
  let label = item.label;
  // Entferne Pfeil ➤ für Menü-Items in der Anzeige
  if (item.isMenu && label.startsWith('➤ ')) {
    label = label.substring(3);
  }
  
  return `<div class="menu-item${hasSubmenu ? ' has-submenu' : ''}${item.isMenu ? ' is-menu-group' : ''}" data-action="${item.key}"${item.isMenu ? ' data-menu-group="' + item.key + '"' : ''}>` +
    (isSubmenuItem ? '' : `<span class="menu-item-star${isFav ? ' is-fav' : ''}" data-fav-key="${item.key}" title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufuegen'}">★</span>`) +
    `<span class="menu-item-label">${label}</span>` +
    (isSubmenuItem ? '' : `<span class="menu-item-copy" data-copy-key="${item.key}" title="Prompt kopieren">📋</span>`) +
    (hasSubmenu ? '<span class="submenu-arrow">›</span>' : '') +
    `</div>`;
}

function detectBackgroundBrightness() {
  try {
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const rgbMatch = bgColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      // Relative luminance formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance;
    }
  } catch (e) {}
  return 1; // Default to light
}

function showContextMenu(e) {
  e.stopPropagation();
  if (isDragging) return;
  const oldMenu = document.getElementById('gemini-context-menu');
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'gemini-context-menu';
  
  // Detect background and add appropriate class
  const brightness = detectBackgroundBrightness();
  if (brightness < 0.3) {
    menu.setAttribute('data-theme', 'dark-bg');
  }
  
  const logo = document.getElementById('gemini-logo');
  const rect = logo.getBoundingClientRect();

  const titlebar = document.createElement('div');
  titlebar.id = 'gemini-menu-titlebar';
  titlebar.innerHTML = '<div id="gemini-menu-logo">✨</div><span id="gemini-menu-title">AI Befehlsmenue</span>';
  menu.appendChild(titlebar);

  const searchWrap = document.createElement('div');
  searchWrap.id = 'gemini-menu-search-wrap';
  searchWrap.innerHTML = '<input id="gemini-menu-search" type="text" placeholder="Suchen..." autocomplete="off" />';
  menu.appendChild(searchWrap);

  const body = document.createElement('div');
  body.id = 'gemini-menu-body';
  menu.appendChild(body);

  const favorites = getFavorites();
  const recent = getRecentActions();
  const visibleItems = ACTION_LIST;

  function renderBody(searchTerm) {
    body.innerHTML = '';
    const filtered = searchTerm ? visibleItems.filter(item => fuzzyMatch(item.label, searchTerm)) : null;
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
      attachMenuItemListeners(list, menu);
      return;
    }

    // Favoriten
    const favSection = document.createElement('div');
    favSection.className = 'menu-section';
    const favItems = favorites.map(k => ACTION_LIST.find(a => a.key === k)).filter(Boolean);
    const favHeader = document.createElement('div');
    favHeader.className = 'menu-section-header';
    favHeader.innerHTML = '<span>⭐ Favoriten</span>';
    favSection.appendChild(favHeader);
    const favList = document.createElement('div');
    favList.className = 'menu-section-list';
    if (favItems.length === 0) {
      favList.innerHTML = '<div class="menu-empty-hint">Klicke ★ bei einer Aktion</div>';
    } else {
      favList.innerHTML = favItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      attachMenuItemListeners(favList, menu);
    }
    favSection.appendChild(favList);

    // Zuletzt verwendet
    const recentItems = recent.map(k => ACTION_LIST.find(a => a.key === k)).filter(Boolean);
    if (recentItems.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'menu-section';
      const recentHeader = document.createElement('div');
      recentHeader.className = 'menu-section-header';
      recentHeader.innerHTML = '<span>🕐 Zuletzt verwendet</span>';
      recentSection.appendChild(recentHeader);
      const recentList = document.createElement('div');
      recentList.className = 'menu-section-list';
      recentList.innerHTML = recentItems.map(item => buildMenuItemHtml(item, favorites)).join('');
      recentSection.appendChild(recentList);
      attachMenuItemListeners(recentList, menu);
      favSection.appendChild(recentSection);
    }
    body.appendChild(favSection);

    const divider = document.createElement('div');
    divider.className = 'menu-divider';
    body.appendChild(divider);

    // Normale Items (alphabetisch, ohne Gruppen)
    const normalItems = visibleItems.filter(item => !item.isMenu);
    const list = document.createElement('div');
    list.className = 'menu-section-list';
    list.innerHTML = normalItems.map(item => buildMenuItemHtml(item, favorites)).join('');
    body.appendChild(list);
    attachMenuItemListeners(list, menu);

    // Gruppen am Ende (ausklappbar)
    const groupItems = visibleItems.filter(item => item.isMenu);
    if (groupItems.length > 0) {
      const groupDivider = document.createElement('div');
      groupDivider.className = 'menu-divider';
      body.appendChild(groupDivider);

      groupItems.forEach(group => {
        const groupSection = document.createElement('div');
        groupSection.className = 'menu-group-section';
        
        const groupHeader = document.createElement('div');
        groupHeader.className = 'menu-item menu-group-header';
        groupHeader.dataset.groupKey = group.key;
        groupHeader.innerHTML = `<span class="menu-item-label">${group.label}</span><span class="submenu-arrow">▼</span>`;
        groupSection.appendChild(groupHeader);

        const groupContent = document.createElement('div');
        groupContent.className = 'menu-group-content';
        groupContent.style.display = 'none';
        
        const subItems = SUBMENUS[group.key];
        if (subItems) {
          groupContent.innerHTML = subItems.map(item => buildMenuItemHtml(item, favorites)).join('');
          attachMenuItemListeners(groupContent, menu);
        }
        groupSection.appendChild(groupContent);
        body.appendChild(groupSection);

        // Toggle Funktion
        groupHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = groupContent.style.display === 'block';
          groupContent.style.display = isOpen ? 'none' : 'block';
          groupHeader.querySelector('.submenu-arrow').textContent = isOpen ? '▼' : '▲';
        });
      });
    }
  }

  renderBody('');
  menu.querySelector('#gemini-menu-search').addEventListener('input', (e) => {
    renderBody(e.target.value.trim());
  });

  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();
  let left = rect.left - menuRect.width - 10;
  if (left < 5) left = rect.right + 10;
  let top = rect.top - menuRect.height - 10;
  if (top < 5) top = rect.bottom + 10;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function attachMenuItemListeners(container, menu, isSubmenu = false) {
  container.querySelectorAll('.menu-item').forEach(itemEl => {
    // Überspringe Gruppen-Header (haben eigene Event-Listener)
    if (itemEl.classList.contains('menu-group-header')) return;
    
    const star = itemEl.querySelector('.menu-item-star');
    if (star) {
      star.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(star.dataset.favKey);
        menu.remove();
        document.removeEventListener('click', closeMenu);
        showContextMenu({ stopPropagation: () => {} });
      });
    }
    const copyBtn = itemEl.querySelector('.menu-item-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleGeminiAction(copyBtn.dataset.copyKey, '', '', true);
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }
    itemEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-item-star') || e.target.classList.contains('menu-item-copy')) return;
      const action = itemEl.dataset.action;
      
      // Untermenü öffnen
      if (itemEl.dataset.menuGroup) {
        e.stopPropagation();
        showSubmenu(itemEl, itemEl.dataset.menuGroup, menu);
        return;
      }
      
      if (action === 'summary') {
        e.stopPropagation();
        showSummarySubmenu(itemEl);
      } else if (action === 'createStory') {
        e.stopPropagation();
        showStorySubmenu(itemEl);
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

function showSubmenu(menuItem, groupKey, parentMenu) {
  // Schließe bestehende Untermenüs
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();
  
  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  
  const groupItems = SUBMENUS[groupKey];
  if (!groupItems) return;
  
  submenu.innerHTML = groupItems.map(item => buildMenuItemHtml(item, [], true)).join('');
  
  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  
  document.body.appendChild(submenu);
  
  // Event Listener für Untermenü-Items
  submenu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      addRecentAction(action);
      handleGeminiAction(action);
      parentMenu.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
}

function showSummarySubmenu(menuItem) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();
  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  submenu.innerHTML = `
    <div class="submenu-item" data-type="normal">📋 Normale Zusammenfassung</div>
    <div class="submenu-item" data-type="chapter">📖 Kapitel Zusammenfassung</div>
    <div class="submenu-item" data-type="short">⚡ Super kurz</div>
  `;
  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  document.body.appendChild(submenu);
  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      handleGeminiAction('summary', e.currentTarget.dataset.type);
      document.getElementById('gemini-context-menu')?.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
}

function showStorySubmenu(menuItem) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();
  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';
  submenu.innerHTML = `
    <div class="submenu-item" data-type="pen_and_paper">Pen & Paper</div>
    <div class="submenu-item" data-type="dramatic">Dramatisch</div>
    <div class="submenu-item" data-type="clickbait">Clickbait</div>
  `;
  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  document.body.appendChild(submenu);
  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      handleGeminiAction('createStory', e.currentTarget.dataset.type);
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

function getPageContext() {
  const selectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content', '.article-body', '#content', '#main'];
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
    text: selectedText ? `[Markierter Text]:\n${selectedText.substring(0, 10000)}` : cleanText.substring(0, 10000)
  };
}

function loadMarked() {
  return new Promise((resolve, reject) => {
    if (window.marked) { resolve(); return; }
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
      <div class="toast-header"><span>Antwort</span><button id="close-toast-btn">×</button></div>
      <div class="toast-body"></div>
    `;
    const responseBody = toast.querySelector('.toast-body');
    if (window.marked) responseBody.innerHTML = window.marked.parse(responseText);
    else responseBody.textContent = responseText;
    document.body.appendChild(toast);
    toast.querySelector('#close-toast-btn').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 15000);
  } else {
    const overlay = document.createElement('div');
    overlay.id = 'gemini-response-overlay';
    const modal = document.createElement('div');
    modal.id = 'gemini-response-modal';
    modal.innerHTML = `
      <div class="response-header"><span>AI-Antwort</span><button id="copy-response-btn">📋</button><button id="close-response-btn">×</button></div>
      <div class="response-body"></div>
    `;
    const responseBody = modal.querySelector('.response-body');
    if (window.marked) responseBody.innerHTML = window.marked.parse(responseText);
    else responseBody.textContent = responseText;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    modal.querySelector('#close-response-btn').addEventListener('click', () => overlay.remove());
    modal.querySelector('#copy-response-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(responseText).then(() => showToast('Kopiert!'));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }
}

async function sendToLocalLlm(config, prompt, type = 'modal') {
  showToast('Sende an lokales LLM...');
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || JSON.stringify(data);
    if (type !== 'silent') showResponseModal(message, type);
    return message;
  } catch (error) {
    const errorMsg = `Fehler: ${error.message}`;
    if (type !== 'silent') showResponseModal(errorMsg, type);
    return errorMsg;
  }
}

function showDeepResearchPopup() {
  alert('Deep Research Popup (Platzhalter)');
}

function showMotivationPopup() {
  const task = prompt('Was moechtest du tun?');
  if (!task) return;
  const promptText = `Ich fuehle mich unmotiviert: ${task}\n\nGib mir Motivation!`;
  getAiConfig((config) => {
    if (config.type === 'local') sendToLocalLlm(config, promptText);
    else {
      chrome.storage.local.set({ pendingPrompt: promptText }, () => window.open(config.url, '_blank'));
    }
  });
}

function showAskSelectionPopup(selectedText) {
  const question = prompt('Was moechtest du wissen?');
  if (!question) return;
  const promptText = `**Text:**\n${selectedText}\n\n**Frage:** ${question}`;
  getAiConfig((config) => {
    if (config.type === 'local') sendToLocalLlm(config, promptText);
    else {
      chrome.storage.local.set({ pendingPrompt: promptText }, () => window.open(config.url, '_blank'));
    }
  });
}

function handleGeminiAction(action, summaryType = 'normal', ytSummaryType = 'nested', clipboardOnly = false) {
  if (action === 'deepResearch') { showDeepResearchPopup(); return; }
  if (action === 'motivation') { showMotivationPopup(); return; }

  const context = getPageContext();
  let prompt = '';

  switch (action) {
    case 'createPresentation':
      prompt = `Erstelle eine Praesentation aus: ${context.url}\n\n${context.text.substring(0, 3000)}\n\n6-10 Folien mit Titel, Bullet Points, Speaker Notes.`;
      break;
    case 'ahaMoments':
      prompt = `Generiere 3 weiterführende Prompts zum Thema dieser Website.

Website: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Anforderungen:
- Genau 3 Prompts
- Jeder Prompt sofort copy-paste-fähig
- Unkonventionelle Perspektiven, Aha-Effekt, über das Offensichtliche hinaus
- Antwort NUR die 3 Prompts, keine Erklärungen, keine Einleitung, kein Fazit

Format:
1. [Erster Prompt]
2. [Zweiter Prompt]
3. [Dritter Prompt]`;
      break;
    case 'socraticChain':
      prompt = `Anwenden der sokratischen Methode (Maiutik) auf diese Website.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Sokratische Prinzipien:
- Ironie (Eingeständnis des eigenen Nichtwissens)
- Maiutik (Geburtshelferkunst - Wahrheit durch Fragen gebären)
- Systematisches Hinterfragen aller Annahmen
- Aufdecken von Widersprüchen (Aporie)
- Unterscheidung zwischen Meinung (Doxa) und Wissen (Episteme)

Erstelle EINE sokratische Fragekette:
1. Beginne mit einer scheinbar naiven Frage (Ironie)
2. Führe durch konsequentes Nachfragen zu Widersprüchen
3. Zwinge zur Definition grundlegender Begriffe
4. Ende in Aporie oder klarerer Einsicht

Format:
Sokratische Kette: [Thema]

Frage 1 (Ironie): [Einstiegsfrage - was bedeutet X wirklich?]
→ Gegenfrage: [Wenn das so ist, was folgt daraus?]

Frage 2 (Maiutik): [Konkretisierung - was meinen wir genau?]
→ Gegenfrage: [Aber stimmt das mit Y überein?]

Frage 3 (Aporie): [Widerspruch aufdecken - wie passt das zusammen?]
→ Gegenfrage: [Wenn beides nicht geht, was dann?]

Frage 4 (Definition): [Was müssen wir definieren, um weiterzukommen?]
→ Analyse: [Unterscheidung Doxa/Episteme]

Ergebnis: [Offengelegter Widerspruch oder vertieftes Verständnis]`;
      break;
    case 'grammarCheck':
      prompt = `Pruefe Grammatik und Rechtschreibung:\n\n${context.text}`;
      break;
    case 'summary':
      prompt = `Fasse zusammen (${summaryType}):\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'tldr':
      prompt = `TL;DR in 3 Saetzen:\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'factCheck':
      prompt = `Faktencheck fuer: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nMarkiere unklare oder falsche Behauptungen.`;
      break;
    case 'plagiarism':
      prompt = `Pruefe auf Plagiate: ${context.url}\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'rewrite':
      prompt = `Schreibe um (gleiche Infos, neue Formulierung):\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'translate': {
      const textToTranslate = context.text.substring(0, 8000);
      // Pruefe ob Text fuer DeepL geeignet ist (unter kostenlosem Limit)
      if (textToTranslate.length < 1500) {
        // Oeffne DeepL mit Text als Parameter (falls moeglich) oder nutze KI
        const deeplUrl = `https://www.deepl.com/translator#auto/de/${encodeURIComponent(textToTranslate)}`;
        window.open(deeplUrl, '_blank');
        return;
      }
      // Fallback: Nutze KI fuer laengere Texte
      prompt = `Uebersetze den folgenden Text ins Deutsche (falls der Text bereits Deutsch ist, uebersetze ins Englische).

URL: ${context.url}

Originaltext:
"""
${textToTranslate}
"""

Wichtig:
- Uebersetze sinngemaess, nicht woertlich
- Behalte den Ton und Stil bei (formell, locker, fachlich, etc.)
- Passe kulturelle Referenzen an, falls noetig
- Fachbegriffe sollten korrekt uebersetzt werden

Gib nur die Uebersetzung aus, ohne den Originaltext wiederzugeben.`;
      break;
    }
    case 'completeText':
      prompt = `Vervollstaendige den Text sinnvoll:\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'codeReview':
      prompt = `Code Review fuer: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nAnalysiere Qualitaet, Sicherheit, Performance.`;
      break;
    case 'copyCode':
      prompt = `Extrahiere Code von: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'deepResearch':
      prompt = `Tiefenanalyse fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nHintergruende, offene Fragen, Quellen.`;
      break;
    case 'askPage': {
      const userQuestion = prompt('Welche Frage hast du zu dieser Website?');
      if (!userQuestion) return;
      prompt = `Ich habe eine Frage zu dieser Seite. Gebe als Antwort ausschliesslich die Antwort auf die Frage aus. Keine zusätzlichen Prompts. Keine weiteren Nachrichten.

URL: ${context.url}

Seiteninhalt: """ ${context.text.substring(0, 8000)} """

Bereite dich vor:
Nutze den obigen Kontext, um eine praezise, fundierte Antwort zu geben
Falls meine Frage unklar ist:
- Stelle Rueckfragen zur Praezisierung, bis du dir zu 80% sicher, dass du die Frage beantworten kannst
- Falls die Frage es zulaesst, biete verschiedene Interpretationsmoeglichkeiten an
- Verweise auf relevante Stellen im Text

Meine Frage: ${userQuestion}`;
      break;
    }
    case 'pageSherlock':
      prompt = `Detektiv-Analyse: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nVertrauenswuerdigkeit, Red Flags, Geschaeftsmodell.`;
      break;
    case 'writeReply':
      prompt = `Erstelle 3 Antwortmöglichkeiten auf diese Nachricht/E-Mail/Kommentar.

URL/Kontext: ${context.url}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Format:

**Antwort 1 (Diplomatisch/Höflich):**
[Friendly, professionell, ausgleichend]

**Antwort 2 (Direkt/Sachlich):**
[Kurz, prägnant, auf den Punkt]

**Antwort 3 (Kreativ/Unlockonventionell):**
[Überraschender Ansatz, humorvoll oder ungewöhnlich]

Keine Einleitung. Keine Rückfragen. Kein Fazit. Nur die 3 Antworten.`;
      break;
    case 'emailDraft':
      prompt = `E-Mail Entwurf zu: ${context.url}\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'checklist':
      prompt = `Erstelle Checkliste aus: ${context.url}\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'alternative':
      prompt = `Analysiere dieses Produkt/Dienstleistung und finde Alternativen.

URL: ${context.url}

Produktbeschreibung:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine Vergleichsübersicht mit:

1. **Original** (was wird hier angeboten?)
   - Hauptmerkmale
   - Preisspanne (falls ersichtlich)
   - Zielgruppe

2. **Direkte Alternativen** (3-5 Optionen)
   - Name + Kurzbeschreibung
   - Hauptunterschiede
   - Für wen geeignet?

3. **Open-Source/Gratis-Alternativen** (falls zutreffend)
   - Optionen ohne Kosten
   - Einschränkungen im Vergleich

4. **Premium-Alternativen** (falls zutreffend)
   - Höherwertige Optionen
   - Worin unterscheiden sie sich?

5. **Entscheidungshilfe**
   - Wann welche Alternative wählen?
   - Vor- und Nachteile-Übersicht`;
      break;
    case 'priceCompare':
      prompt = `Preisvergleich fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nIst der Preis fair? Alternativen?`;
      break;
    case 'productProsCons':
      prompt = `Vor- und Nachteile Analyse: ${context.url}\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'createFAQ':
      prompt = `Erstelle FAQ (8-12 Fragen) aus: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'createQuiz':
      prompt = `Erstelle Quiz (10 Fragen) aus: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'extractQuotes':
      prompt = `Extrahiere Zitate aus: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nMarkante Aussagen, Statistiken, kontroverse Meinungen.`;
      break;
    case 'webSearch':
      prompt = `Suchstrategie fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nOptimierte Suchanfragen mit Operatoren.`;
      break;
    case 'extractData2':
      prompt = `Extrahiere strukturierte Daten aus: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'captureView':
      // Starte Screenshot-Auswahl statt nur Text-Analyse
      startScreenshotSelection();
      return;  // Frühzeitiger Return, da wir async arbeiten
    case 'doINeedThis':
      prompt = `Hilf mir zu entscheiden, ob ich dieses Produkt/Dienstleistung wirklich brauche.

URL: ${context.url}

Angebot:
"""
${context.text.substring(0, 4000)}
"""

Entscheidungshilfe:

## 🤔 Brauchst du das wirklich?

**Stelle dir diese Fragen:**
1. [Spezifische Frage zum Produkt - z.B. "Hast du bereits ein aehnliches Produkt, das denselben Zweck erfuellt?"]
2. [Frage zu bestehenden Alternativen - z.B. "Koenntest du das Problem auch kostenlos oder guenstiger loesen?"]
3. [Frage zum tatsaechlichen Nutzen - z.B. "Wie oft wirst du dieses Produkt wirklich nutzen?"]
4. [Frage zur Haeufigkeit der Nutzung - z.B. "Ist der Nutzen langfristig oder nur kurzfristig?"]
5. [Frage zur finanziellen Prioritaet - z.B. "Steht das im Verhaeltnis zum Preis und deinem Budget?"]

## ✅ Ja, wenn...
- [Situationen, wo es Sinn macht]
- [Konkrete Use-Cases]

## ❌ Nein, wenn...
- [Situationen, wo es unnoetig ist]
- [Warnsignale]

## 💡 Alternativen zum Kauf
- [Moeglichkeiten, den Bedarf anders zu decken]
- [Gratis-Optionen]
- [DIY-Loesungen]
- [Leih- oder Mietoptionen]

**Ehrliche Empfehlung:** [Klare Aussage, fuer wen das sinnvoll ist und fuer wen nicht]`;
      break;
    case 'accessibility':
      prompt = `Accessibility Check: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nWCAG-Compliance, Verbesserungsvorschlaege.`;
      break;
    case 'genderLanguage':
      prompt = `Gender-Sprache pruefen: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nNicht-gendergerechte Formulierungen finden.`;
      break;
    case 'legalCheck':
      prompt = `Gib einen ersten rechtlichen Ueberblick zum Thema dieser Website (keine Rechtsberatung!).

URL: ${context.url}

Thema/Kontext:
"""
${context.text.substring(0, 4000)}
"""

**Wichtiger Hinweis:** Dies ist keine Rechtsberatung, sondern eine erste Einordnung!

## Themenidentifikation
- Welches Rechtsgebiet betrifft das? (Vertrag, Datenschutz, Verbraucher, etc.)
- Relevante Gesetze (vermutlich)

## Allgemeine rechtliche Grundlagen
- [Grobe Erklaerung der relevanten Rechtslage]
- [Typische Pflichten/Rechte]
- [Juristische Fachbegriffe mit Erklaerung: z.B. "Obliegenheit", "Tertiaer-Nutzung", "Verhaeltnismaessigkeitsgrundsatz"]

## Mögliche Risiken/Offene Punkte
- [Was koennte problematisch sein?]
- [Was sollte geprueft werden?]

## Dokumentationsempfehlungen
- Was sollte schriftlich festgehalten werden?
- Welche Nachweise sind wichtig?

## ⚠️ Disclaimer
> Diese Informationen dienen nur der ersten Orientierung. Fuer verbindliche Rechtsauskuenfte konsultieren Sie bitte einen Rechtsanwalt fuer [Fachgebiet].

## Naechste Schritte
1. [Konkrete Handlungsempfehlung]
2. [Welche Unterlagen sammeln?]
3. [Wen kontaktieren?]`;
      break;
    case 'vacationPlan':
      prompt = `Urlaubsplanung fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nBeste Reisezeit, Unterkunft, Budget, Must-Sees.`;
      break;
    case 'contextCollector':
      prompt = `Sammle Kontext von: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'learningHelp':
      prompt = `Lernmaterial zu: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nErklaerungen, Mnemonics, Quizfragen.`;
      break;
    case 'createDiagram':
      prompt = `Diagramm-Vorschlaege fuer: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nMermaid-Code fuer passende Diagramme.`;
      break;
    case 'reusePage':
      prompt = `Content-Reuse fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nSocial Media, Blog, Newsletter Ideen.`;
      break;
    case 'shoppingAssistant':
      prompt = `Shopping-Analyse: ${context.url}\n\n${context.text.substring(0, 2000)}\n\nPreischeck, Alternativen, Gutscheine.`;
      break;
    case 'tellJoke':
      prompt = `Analysiere diese Website und erstelle passende Witze zum Thema.

Website: ${context.url}

Kontext:
"""
${context.text.substring(0, 3000)}
"""

Erstelle 5 Witze in verschiedenen Kategorien:

**1. Normal (Allgemein tauglich)**
Ein Witz, der fuer alle Altersgruppen geeignet ist.

**2. Sarkastisch/Ironisch**
Ein sarkastischer Kommentar oder Witz ueber das Thema.

**3. Schwarzer Humor**
Ein etwas dunklerer Witz (aber nicht beleidigend).

**4. Wortspiel**
Ein kreatives Wortspiel basierend auf Begriffen der Website.

**5. Frech/Ue18**
Ein etwas frecherer, erwachsener Witz (aber nicht beleidigend).

Format pro Witz:
**[Kategorie]**
Setup: [Aufbau]
Pointe: [Aufloesung]

Optional: Bewertung der Witzqualitaet (1-10) und kurze Erklaerung, falls der Witz ein spezifisches Referenz braucht.`;
      break;
    case 'createStory':
      prompt = `Erstelle Story (${summaryType}) zu: ${context.url}\n\n${context.text.substring(0, 3000)}`;
      break;
    case 'aiDetection':
      prompt = `Analysiere den folgenden Website-Text auf typische Merkmale einer KI-Generierung (ChatGPT, Claude, Gemini, etc.).

URL: ${context.url}

Text:
"""
${context.text.substring(0, 4000)}
"""

Untersuche das Dokument auf folgende KI-typische Merkmale und bewerte jedes Kriterium:

1. **Monotone Wortwahl und Satzrhythmus**
   - Wiederholung aehnlicher Satzsaetze ("Der", "Es", "Dies")
   - Gleichfoermige Satzlaengen (zu viele Hauptsätze, wenig Variation)
   - Fehlende rhythmische Abwechslung

2. **Typische KI-Phrasen und Fuellwoerter**
   - Formulierungen wie: "Es ist wichtig zu betonen, dass...", "Alles klar", "Zusammenfassend lässt sich sagen..."
   - "In der heutigen Zeit...", "Einleitend muss gesagt werden..."
   - Uebermaessiger Gebrauch von "sehr", "besonders", "signifikant", "relevant"
   - Starke Uebergaenge: "Darüber hinaus", "Des Weiteren", "Nichtsdestotrotz", "Insofern"

3. **Zu perfekte Struktur**
   - Uebermaessig ausgewogene Absatzlaengen
   - Mathematisch wirkende Abfolge (Einführung, 3 Argumente, Fazit)
   - Fehlende kleine Unvollkommenheiten, die menschliche Texte haben

4. **Inhaltliche Wiederholungen (Redundanz)**
   - Gleiche Ideen werden mit anderen Worten wiederholt
   - Selbe Aussage in Einleitung und Fazit ohne neue Erkenntnis
   - Ausschmueckende Fuellsaetze ohne Informationsgehalt

5. **Uebermaessige Uebergaenge und Strukturierungen**
   - Zu viele Zwischenueberschriften
   - Zu haeufige Verwendung von Aufzaehlungen und nummerierten Listen
   - Starke, kuenstliche Uebergaenge zwischen Absaetzen

6. **Oberflaechliche Allgemeinplaetze**
   - Floskeln ohne konkreten Bezug zum Thema
   - Allgemeingueltige Aussagen, die auf alles zutreffen koennten
   - Vermeidung spezifischer Details oder persoenlicher Erfahrungen

7. **Emotionale Distanz und Sterilitaet**
   - Fehlende persoenliche Anekdoten oder subjektive Perspektiven
   - Keine regionalen oder kulturellen Nuancen
   - Zu sachlich, zu wenig menschliche Unregelmaessigkeit

8. **Formale Konsistenz**
   - Durchgehend gleicher Tonfall ohne Schwankungen
   - Keine spontanen Gedankenspruenge oder Assoziationen
   - Fehlende rhetorische Fragen oder direkte Ansprache des Lesers

**Antworte im folgenden Format:**

## KI-Erkennung Analyse

### Gesamteinschaetzung
**Wahrscheinlichkeit KI-generiert: [XX-XX]%** (Bereich angeben, z.B. 60-75%)

### Detaillierte Analyse

| Merkmal | Bewertung (0-10) | Bemerkung |
|---------|------------------|-----------|
| Monotone Wortwahl | X/10 | Kurze Begruendung |
| Typische KI-Phrasen | X/10 | Konkrete Beispiele nennen |
| Zu perfekte Struktur | X/10 | Kurze Begruendung |
| Inhaltliche Wiederholungen | X/10 | Kurze Begruendung |
| Uebergaenge/Strukturierung | X/10 | Kurze Begruendung |
| Oberflaechliche Allgemeinplaetze | X/10 | Kurze Begruendung |
| Emotionale Distanz | X/10 | Kurze Begruendung |
| Formale Konsistenz | X/10 | Kurze Begruendung |

### Auffaellige Textbeispiele
- KI-typische Phrase aus dem Text: [Nicht existent / Konkrete Phrase mit Kontext]
- Wiederholung/Redundanz im Text: [Marginal iteration / Konkrete Wiederholung mit Erklärung]
- Zu generischer Satz: [Satz aus dem Text] (Begründung warum generisch)

### Fazit
[2-3 Saetze mit der Gesamteinschaetzung und den staerksten Indikatoren]`;
      break;
    case 'seoAudit':
      prompt = `SEO Audit: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nOn-Page, Content, Technisches SEO, Quick Wins.`;
      break;
    case 'seoKeywords':
      prompt = `Keyword Analyse: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nPrimaer, Sekundaer, Long-Tail Keywords.`;
      break;
    case 'seoContentAnalyzer':
      prompt = `Content SEO Analyse: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nRelevanz, Struktur, Keyword-Optimierung.`;
      break;
    case 'seoStrategy':
      prompt = `SEO Strategie: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nKeyword-Strategie, Content-Plan, Linkbuilding.`;
      break;
    case 'seoTopicIdeas':
      prompt = `Content Ideen fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nPillar Content, Cluster, Evergreen, Trending.`;
      break;
    case 'seoWebsiteToArticle':
      prompt = `Wandle in Artikel um: ${context.url}\n\n${context.text.substring(0, 5000)}\n\nSEO-optimierte Struktur mit Keywords.`;
      break;
    case 'seoKeywordCluster':
      prompt = `Keyword Cluster fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nThematische Cluster mit Pillar und Cluster Content.`;
      break;
    case 'seoHeroImages':
      prompt = `Hero Image Ideen: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nKonzepte, KI-Prompts, technische Spezifikationen.`;
      break;
    case 'socialPost':
      prompt = `Social Media Posts fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nLinkedIn, Twitter, Instagram, Facebook.`;
      break;
    case 'socialGeneral':
      prompt = `Social Media Strategie: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nContent-Pillars, Posting-Frequenz, Content-Mix.`;
      break;
    case 'socialBio':
      prompt = `Social Media Bios fuer: ${context.url}\n\n${context.text.substring(0, 3000)}\n\nInstagram, LinkedIn, Twitter, TikTok.`;
      break;
    case 'socialHashtags':
      prompt = `Hashtag Strategie fuer: ${context.url}\n\n${context.text.substring(0, 3000)}`;
      break;
    case 'socialInstagram':
      prompt = `Instagram Content Ideen: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nFeed, Stories, Reels, Captions.`;
      break;
    case 'socialTwitter':
      prompt = `Twitter/X Content: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nTweets, Threads, Templates.`;
      break;
    case 'socialFacebook':
      prompt = `Facebook Content: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nPosts, Videos, Gruppen-Strategie.`;
      break;
    case 'socialTikTok':
      prompt = `TikTok Content: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nVideo-Ideen, Trends, Hooks.`;
      break;
    case 'socialYouTube':
      prompt = `YouTube Content: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nVideo-Ideen, Thumbnails, SEO.`;
      break;
    case 'socialYouTubeDesc':
      prompt = `YouTube Beschreibung: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nMit Timestamps, Links, Tags.`;
      break;
    case 'socialClickbait':
      prompt = `Clickbait Headlines: ${context.url}\n\n${context.text.substring(0, 4000)}\n\n5 Headlines mit Curiosity Gap.`;
      break;
    case 'socialProsCons':
      prompt = `Pro/Contra Social Post: ${context.url}\n\n${context.text.substring(0, 4000)}`;
      break;
    case 'financeMarket':
      prompt = `Analysiere den potenziellen Einfluss dieses Themas auf die Finanzmärkte.

Thema/Website: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Marktanalyse:
1. **Betroffene Sektoren** – Welche Branchen sind direkt/indirekt betroffen?
2. **Aktientrends** – Wahrscheinliche Gewinner und Verlierer
3. **Anlageklassen** – Aktien, Bonds, Rohstoffe, Krypto
4. **Zeithorizont** – Kurzfristig vs. langfristige Auswirkungen
5. **Risiken** – Was könnte schiefgehen?

Hinweis: Dies ist keine Anlageberatung, sondern eine Einschätzung basierend auf öffentlich verfügbaren Informationen.`;
      break;
    case 'financeNews':
      prompt = `Finde aktuelle Finanznachrichten zu diesem Thema.

Thema/Website: ${context.url}

Kontext:
"""
${context.text.substring(0, 2000)}
"""

Recherchiere (simuliert) und berichte über:
1. **Aktuelle Entwicklungen** – Was ist in den letzten 24-48h passiert?
2. **Marktreaktionen** – Wie haben Märkte/Aktien reagiert?
3. **Analystenmeinungen** – Was sagen Experten dazu?
4. **Zusammenhänge** – Welche anderen Faktoren spielen eine Rolle?

Falls keine spezifischen aktuellen News erkennbar: Schlage vor, wo man aktuelle Informationen findet (Ticker, News-Portale).`;
      break;
    case 'recipeSimpleBake':
      prompt = `Wandle das Rezept von dieser Website in das "Einfach Backen" Format um.

URL: ${context.url}

Originaltext:
"""
${context.text.substring(0, 5000)}
"""

Format:
**Zutatenliste**
- 5g Zutat X
- 10 EL Zutat Y
- 200g Zutat Z
...

**Schritt 1**
5g Zutat X mit 10 EL Zutat Y vermischen...

**Schritt 2**
200g Zutat Z unterheben...

usw.

Behalte den Originaltext bei, aber strukturiere ihn in dieses Format.`;
      break;
    case 'recipeIngredients':
      prompt = `Extrahiere alle Zutaten aus diesem Rezept als Einkaufsliste.

URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine alphabetisch sortierte Zutatenliste mit Mengenangaben.`;
      break;
    case 'recipeReplace': {
      const missingIngredient = prompt('Welche Zutat fehlt dir?');
      if (!missingIngredient) return;
      prompt = `Ich habe folgende Zutat nicht: "${missingIngredient}".

Rezept von: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

Womit kann ich "${missingIngredient}" ersetzen? Gib 2-3 Alternativen an mit Mengenumrechnung.`;
      break;
    }
    case 'recipeAlternative':
      prompt = `Erstelle ein alternatives Rezept zu diesem.

URL: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

Varianten (bitte alle erstellen):
1. **Schnellere Variante** (unter 30 Min.)
2. **Gesündere Variante** (weniger Kalorien, mehr Nährstoffe)
3. **Günstigere Variante** (mit einfachen Zutaten)
4. **Vegetarische/Vegane Variante** (falls nicht schon so)`;
      break;
    case 'recipeDevice': {
      const devices = ['Heissluftfritteuse', 'Backofen', 'Waffeleisen', 'Dampfgarer', 'Slow Cooker', 'Instant Pot', 'Mikrowelle', 'Grill', 'Doehrrautomat', 'Sous-Vide', 'Brotbackautomat', 'Eismaschine', 'Thermomix'];
      const device = prompt(`Fuer welches Küchengerät umwandeln?\n${devices.join(', ')}`);
      if (!device) return;
      prompt = `Wandle dieses Rezept fuer ein(e/n) ${device} um.

URL: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

Wichtig:
- Behalte den Geschmack so originalgetreu wie möglich bei
- Passe Temperatur und Zeit an das Gerät an
- Berücksichtige die Besonderheiten des ${device}
- Gib Tipps zur optimalen Zubereitung mit diesem Gerät`;
      break;
    }
    case 'recipePlating':
      prompt = `Beschreibe, wie dieses Gericht auf Michelin-Sterne Niveau angerichtet werden könnte.

Rezept von: ${context.url}

Gericht:
"""
${context.text.substring(0, 4000)}
"""

Erstelle:
1. **Beschreibung des Plating** (Schritt für Schritt)
2. **Farbenkonzept**
3. **Dekorationselemente**
4. **Ki-Prompt für Bildgenerierung**:
   "Professional food photography, Michelin star plating of [Gericht], elegant ceramic plate, artistic sauce drizzle, microgreens garnish, dramatic lighting, shallow depth of field, 8k, photorealistic"`;
      break;
    case 'recipeNutrition':
      prompt = `Analysiere die Nährwerte dieses Rezepts pro Portion.

URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine kompakte Tabelle mit:
| Nährwert | Menge pro Portion | % Tagesbedarf* |
|----------|-------------------|----------------|
| Kalorien | ... kcal | ...% |
| Protein | ...g | ...% |
| Kohlenhydrate | ...g | ...% |
| - davon Zucker | ...g | ...% |
| Fett | ...g | ...% |
| - davon gesättigt | ...g | ...% |
| Ballaststoffe | ...g | ...% |
| Natrium | ...mg | ...% |

*basierend auf 2000 kcal/Tag

Zusätzlich:
- Bewertung: [Gesund / Moderat / Weniger gesund]
- Tipps zur Optimierung der Nährwerte`;
      break;
    default:
      const labelObj = ACTION_LIST.find(a => a.key === action);
      const labelText = labelObj ? labelObj.label : action;
      prompt = `Aktion '${labelText}' auf: ${context.url}`;
  }

  if (prompt) {
    if (clipboardOnly) {
      navigator.clipboard.writeText(prompt).then(() => showToast('Prompt kopiert!'));
      return;
    }
    chrome.storage.sync.get(['toneMimic'], (result) => {
      const toneMimic = result.toneMimic || '';
      const fullPrompt = toneMimic.trim() ? `${prompt}\n\nTon: ${toneMimic.trim()}` : prompt;
      getAiConfig((config) => {
        if (config.type === 'local') {
          sendToLocalLlm(config, fullPrompt, 'silent').then(response => {
            showResponseModal(response);
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

// ============================================
// SCREENSHOT SELECTION TOOL (Snipping Tool)
// ============================================

function startScreenshotSelection() {
  // Erstelle Overlay für Bereichsauswahl
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 2147483646;
    user-select: none;
  `;
  
  // Anleitung anzeigen
  const hint = document.createElement('div');
  hint.id = 'screenshot-hint';
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 2147483647;
    pointer-events: none;
    white-space: nowrap;
  `;
  hint.textContent = 'Ziehe ein Rechteck um den Bereich auszuwählen (ESC zum Abbrechen)';
  
  // Auswahlrechteck
  const selection = document.createElement('div');
  selection.id = 'screenshot-selection';
  selection.style.cssText = `
    position: fixed;
    border: 2px solid #fff;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
    display: none;
    z-index: 2147483646;
    pointer-events: none;
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(hint);
  document.body.appendChild(selection);
  
  let startX, startY, isSelecting = false;
  
  function cleanup() {
    overlay.remove();
    hint.remove();
    selection.remove();
    document.removeEventListener('keydown', keyHandler);
  }
  
  function keyHandler(e) {
    if (e.key === 'Escape') {
      cleanup();
      showToast('Screenshot abgebrochen');
    }
  }
  document.addEventListener('keydown', keyHandler);
  
  overlay.addEventListener('mousedown', (e) => {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0px';
    selection.style.height = '0px';
    selection.style.display = 'block';
  });
  
  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
  });
  
  overlay.addEventListener('mouseup', async (e) => {
    if (!isSelecting) return;
    isSelecting = false;
    
    const endX = e.clientX;
    const endY = e.clientY;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // Mindestgröße prüfen
    if (width < 50 || height < 50) {
      cleanup();
      showToast('Bereich zu klein (min. 50x50 Pixel)');
      return;
    }
    
    cleanup();
    showToast('Screenshot wird erstellt...');
    
    // Warte kurz damit Overlay verschwindet
    await new Promise(r => setTimeout(r, 100));
    
    // Screenshot erstellen
    try {
      const dataUrl = await captureScreenshotArea(left, top, width, height);
      await sendScreenshotToAI(dataUrl);
    } catch (err) {
      console.error('Screenshot Fehler:', err);
      showToast('Fehler: ' + err.message);
    }
  });
}

async function captureScreenshotArea(left, top, width, height) {
  // Verwende chrome.tabs.captureVisibleTab über background script
  return new Promise((resolve, reject) => {
    // Temporäres Canvas erstellen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Versuche html2canvas-ähnliche Methode: HTML clonen und rendern
    // Für bessere Ergebnisse nutzen wir die native Screenshot-API
    
    chrome.runtime.sendMessage({ 
      action: 'captureScreenshot',
      area: { left, top, width, height }
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Fallback: Text-basierte Beschreibung ohne Bild
        reject(new Error('Screenshot-API nicht verfügbar'));
        return;
      }
      if (response && response.success) {
        resolve(response.dataUrl);
      } else {
        reject(new Error(response?.error || 'Unbekannter Fehler'));
      }
    });
    
    // Timeout falls keine Antwort kommt
    setTimeout(() => reject(new Error('Timeout beim Screenshot')), 5000);
  });
}

async function sendScreenshotToAI(dataUrl) {
  const promptText = `Analysiere diesen Screenshot und gib mir detaillierte Informationen zum Inhalt.

Bitte:
1. Beschreibe, was du siehst (Hauptelemente, Layout, Texte)
2. Erkläre den Kontext (Was ist das? Website, App, Dokument?)
3. Gib zusätzliche relevante Informationen (Falls erkennbar: Quelle, Zweck, wichtige Details)
4. Beantworte mögliche Fragen, die der User zu diesem Inhalt haben könnte

Sei ausführlich und hilfreich.`;

  showToast('Wird an KI gesendet...');
  
  getAiConfig((config) => {
    if (config.type === 'local') {
      // Für Local LLM: Konvertiere zu Text-Beschreibung
      sendToLocalLlm(config, promptText + '\n\n[Hinweis: Bildanalyse nicht verfügbar für Local LLM ohne Vision-Modell. Bitte beschreibe das Bild selbst oder verwende einen Cloud-Dienst.]').then(response => {
        showResponseModal(response);
      });
    } else {
      // Für Cloud: Speichere Prompt und Bild
      chrome.storage.local.set({ 
        pendingPrompt: promptText,
        pendingImage: dataUrl 
      }, () => {
        window.open(config.url, '_blank');
      });
    }
  });
}
