
let chatOpen = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

let currentTheme = 'aero';

// Load active theme
chrome.storage.sync.get(['theme'], (result) => {
  if (result.theme) {
    currentTheme = result.theme;
    applyThemeToElements();
  }
});

// Watch for theme changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.theme) {
    currentTheme = changes.theme.newValue || 'aero';
    applyThemeToElements();
  }
});

function applyThemeToElements() {
  const chat = document.getElementById('gemini-chat-overlay');
  if (chat) chat.className = 'theme-' + currentTheme;
  const logo = document.getElementById('gemini-logo');
  if (logo) logo.className = 'theme-' + currentTheme;
  const menu = document.getElementById('gemini-context-menu');
  if (menu) menu.className = 'theme-' + currentTheme;
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (!e.altKey) return;
  const key = e.key.toUpperCase();
  if (key === 'V') {
    e.preventDefault();
    startScreenshotSelection();
  } else if (key === 'S') {
    e.preventDefault();
    captureFullTabScreenshot();
  } else if (key === 'N') {
    e.preventDefault();
    resetChatWindow();
  } else if (key === 'R') {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'reloadExtension' });
  }
});

function resetChatWindow() {
  const chatContainer = document.getElementById('gemini-chat-overlay');
  if (!chatContainer || chatContainer.style.display === 'none') {
    toggleChatWindow();
  }
  const promptInput = document.getElementById('prompt-input');
  if (promptInput) {
    promptInput.value = '';
    promptInput.focus();
  }
  showToast('Neuer Chat gestartet');
}

async function captureFullTabScreenshot() {
  showToast('Screenshot wird erstellt...');
  try {
    chrome.runtime.sendMessage({ action: 'captureScreenshot' }, async (response) => {
      if (response && response.success) {
        await sendScreenshotToAI(response.dataUrl);
      } else {
        showToast('Fehler: ' + (response?.error || 'Konnte Screenshot nicht aufnehmen'));
      }
    });
  } catch (err) {
    showToast('Fehler: ' + err.message);
  }
}

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
  container.className = 'theme-' + currentTheme;
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
  // Warte auf body falls noch nicht verfügbar
  if (!document.body) {
    setTimeout(initializeGeminiLogo, 50);
    return;
  }
  
  // Prüfe ob Logo bereits existiert
  if (document.getElementById('gemini-logo')) return;
  
  const logo = document.createElement('div');
  logo.id = 'gemini-logo';
  logo.className = 'theme-' + currentTheme;
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

// Sofortige Initialisierung (auch wenn Seite noch lädt)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGeminiLogo);
} else {
  initializeGeminiLogo();
}

// Hauptaktionen (alphabetisch sortiert)
const ACTION_LIST = [
  { label: '3 Prompts generieren', key: 'ahaMoments', implemented: true },
  { label: 'AI Erkennung', key: 'aiDetection', implemented: true },
  { label: 'Alternative hierzu', key: 'alternative', implemented: false },
  { label: 'Antwort schreiben', key: 'writeReply', implemented: false },
  { label: 'Ansicht erfassen', key: 'captureView', implemented: true },
  { label: 'Barrierefreiheit prüfen', key: 'accessibility', implemented: true },
  { label: 'Benötige ich das wirklich?', key: 'doINeedThis', implemented: true },
  { label: 'Checkliste', key: 'checklist', implemented: true },
  { label: 'Deep Research', key: 'deepResearch', implemented: true },
  { label: 'Diagramm erstellen', key: 'createDiagram', implemented: true },
  { label: 'E-Mail Entwurf', key: 'emailDraft', implemented: true },
  { label: 'FAQ Erstellen', key: 'createFAQ', implemented: true },
  { label: 'Faktencheck', key: 'factCheck', implemented: true },
  { label: 'Genderkorrekte Sprache pruefen', key: 'genderLanguage', implemented: true },
  { label: 'Grammatik pruefen', key: 'grammarCheck', implemented: true },
  { label: 'Lernhilfe', key: 'learningHelp', implemented: true },
  { label: 'Motivation', key: 'motivation', implemented: true },
  { label: 'Plagiatscheck', key: 'plagiarism', implemented: true },
  { label: 'Präsentation erstellen', key: 'createPresentation', implemented: true },
  { label: '🚧 Preisvergleich', key: 'priceCompare', implemented: false },
  { label: 'Vor- und Nachteile', key: 'productProsCons', implemented: true },
  { label: 'Quiz erstellen', key: 'createQuiz', implemented: true },
  { label: 'Rezept', key: 'recipe', hasSubmenu: true, implemented: true },
  { label: 'Sokrates-Fragekette', key: 'socraticChain', implemented: true },
  { label: 'Story erstellen', key: 'createStory', hasSubmenu: true, implemented: true },
  { label: 'Text vervollständigen', key: 'completeText', implemented: true },
  { label: 'Übersetzen', key: 'translate', implemented: true },
  { label: 'Umschreiben', key: 'rewrite', implemented: true },
  { label: 'Urlaubsplanung', key: 'vacationPlan', implemented: true },
  { label: 'Website analysieren', key: 'pageSherlock', implemented: true },
  { label: 'Wie ist die Rechtslage?', key: 'legalCheck', implemented: true },
  { label: 'Witz erzählen', key: 'tellJoke', implemented: true },
  { label: 'Zitate extrahieren', key: 'extractQuotes', implemented: true },
  { label: 'Zusammenfassen', key: 'summary', hasSubmenu: true, implemented: true },
  // Gruppen am Ende (ausklappbar)
  { label: '▼ CODE Tools', key: 'CODE_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ SEO Tools', key: 'SEO_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ SOCIAL Media Tools', key: 'SOCIAL_MENU', isMenu: true, isCollapsible: true },
  { label: '▼ FINANCE Tools', key: 'FINANCE_MENU', isMenu: true, isCollapsible: true }
];

// Untermenüs
const SUBMENUS = {
  CODE_MENU: [
    { label: 'CODE Code Review', key: 'codeReview', implemented: true },
    { label: 'CODE Website kopieren', key: 'copyCode', implemented: true }
  ],
  SEO_MENU: [
    { label: 'SEO Audit', key: 'seoAudit', implemented: true },
    { label: 'SEO Content Analyzer', key: 'seoContentAnalyzer', implemented: true },
    { label: 'SEO Hero Image Ideen', key: 'seoHeroImages', implemented: true },
    { label: 'SEO Keyword Cluster', key: 'seoKeywordCluster', implemented: true },
    { label: 'SEO Keywords', key: 'seoKeywords', implemented: true },
    { label: 'SEO Strategie', key: 'seoStrategy', implemented: true },
    { label: 'SEO Themenideen', key: 'seoTopicIdeas', implemented: true },
    { label: 'SEO Website zu Artikel', key: 'seoWebsiteToArticle', implemented: true }
  ],
  SOCIAL_MENU: [
    { label: 'SOCIAL Bio erstellen', key: 'socialBio', implemented: true },
    { label: 'SOCIAL Clickbait-Artikel', key: 'socialClickbait', implemented: true },
    { label: 'SOCIAL Facebook Post', key: 'socialFacebook', implemented: true },
    { label: 'SOCIAL Hashtags', key: 'socialHashtags', implemented: true },
    { label: 'SOCIAL Instagram Ideen', key: 'socialInstagram', implemented: true },
    { label: 'SOCIAL Post generieren', key: 'socialPost', implemented: true },
    { label: 'SOCIAL Social Media Ideen', key: 'socialGeneral', implemented: true },
    { label: 'SOCIAL TikTok Ideen', key: 'socialTikTok', implemented: true },
    { label: 'SOCIAL Twitter Ideen', key: 'socialTwitter', implemented: true },
    { label: 'SOCIAL Vor-/Nachteile Post', key: 'socialProsCons', implemented: true },
    { label: 'SOCIAL YouTube Beschreibung', key: 'socialYouTubeDesc', implemented: true },
    { label: 'SOCIAL YouTube Ideen', key: 'socialYouTube', implemented: true }
  ],
  FINANCE_MENU: [
    { label: 'FINANCE Aktien Analyse', key: 'financeStockAnalysis', implemented: true },
    { label: 'FINANCE Einfluss auf Märkte', key: 'financeMarket', implemented: true },
    { label: 'FINANCE Finanznews hierzu', key: 'financeNews', implemented: true },
    { label: 'FINANCE Investitionsrechner', key: 'financeInvestment', implemented: true },
    { label: 'FINANCE Portfolio Bewertung', key: 'financePortfolio', implemented: true },
    { label: 'FINANCE Wie kann ich damit Geld machen?', key: 'financeMakeMoney', implemented: true }
  ],
  RECIPE_MENU: [
    { label: 'Einfach Backen Format', key: 'recipeSimpleBake', implemented: true },
    { label: 'Für Küchengerät umwandeln...', key: 'recipeDevice', implemented: true },
    { label: 'Kalorien & Nährwerte', key: 'recipeNutrition', implemented: true },
    { label: 'One-Pot', key: 'recipeOnePot', implemented: true },
    { label: 'Rezept prüfen', key: 'recipeCheck', implemented: true },
    { label: 'Wie hübsch anrichten', key: 'recipePlating', implemented: true },
    { label: 'Zutaten auflisten', key: 'recipeIngredients', implemented: true },
    { label: 'Zutat ersetzen...', key: 'recipeReplace', implemented: true }
  ],
  SUMMARY_MENU: [
    { label: 'TL;DR', key: 'summaryWithCrawl', implemented: true },
    { label: 'Kapitel Zusammenfassung', key: 'summaryChapter', implemented: true },
    { label: 'Normale Zusammenfassung', key: 'summaryNormal', implemented: true },
    { label: 'Super kurze Zusammenfassung', key: 'summarySuperShort', implemented: true }
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
  menu.className = 'theme-' + currentTheme;
  
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
      } else if (action === 'recipe') {
        e.stopPropagation();
        showRecipeSubmenu(itemEl);
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
    <div class="submenu-item" data-action="summaryWithCrawl"><span class="submenu-label">TL;DR</span><span class="submenu-copy" data-copy-action="summaryWithCrawl" title="Prompt kopieren">📋</span></div>
    <div class="submenu-item" data-action="summaryChapter"><span class="submenu-label">Kapitel Zusammenfassung</span><span class="submenu-copy" data-copy-action="summaryChapter" title="Prompt kopieren">📋</span></div>
    <div class="submenu-item" data-action="summaryNormal"><span class="submenu-label">Normale Zusammenfassung</span><span class="submenu-copy" data-copy-action="summaryNormal" title="Prompt kopieren">📋</span></div>
    <div class="submenu-item" data-action="summarySuperShort"><span class="submenu-label">Super kurze Zusammenfassung</span><span class="submenu-copy" data-copy-action="summarySuperShort" title="Prompt kopieren">📋</span></div>
  `;
  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  document.body.appendChild(submenu);
  
  // Hauptaktion (Text klicken)
  submenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('submenu-copy')) return;
      const action = e.currentTarget.dataset.action;
      handleGeminiAction(action);
      document.getElementById('gemini-context-menu')?.remove();
      submenu.remove();
      document.removeEventListener('click', closeMenu);
    });
  });
  
  // Kopieren-Button
  submenu.querySelectorAll('.submenu-copy').forEach(copyBtn => {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = e.target.dataset.copyAction;
      handleGeminiAction(action, 'normal', 'nested', true);
      showToast('Prompt kopiert!');
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

function showRecipeSubmenu(menuItem) {
  const oldSubmenu = document.getElementById('gemini-submenu');
  if (oldSubmenu) oldSubmenu.remove();
  const submenu = document.createElement('div');
  submenu.id = 'gemini-submenu';

  function renderMainMenu() {
    submenu.innerHTML = `
      <div class="submenu-item" data-action="recipeSimpleBake">Einfach Backen Format</div>
      <div class="submenu-item" data-action="recipeDevice">Für Küchengerät umwandeln... <span style="float: right; opacity: 0.5;">▶</span></div>
      <div class="submenu-item" data-action="recipeNutrition">Kalorien & Nährwerte</div>
      <div class="submenu-item" data-action="recipeOnePot">One-Pot</div>
      <div class="submenu-item" data-action="recipeCheck">Rezept prüfen</div>
      <div class="submenu-item" data-action="recipePlating">Wie hübsch anrichten</div>
      <div class="submenu-item" data-action="recipeIngredients">Zutaten auflisten</div>
      <div class="submenu-item" data-action="recipeReplace">Zutat ersetzen...</div>
    `;
    submenu.style.maxHeight = '';
    submenu.style.overflowY = '';
    
    submenu.querySelectorAll('.submenu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('submenu-copy')) return;
        const action = e.currentTarget.dataset.action;
        
        if (action === 'recipeDevice') {
          e.stopPropagation();
          renderDeviceMenu();
          return;
        }
        
        handleGeminiAction(action);
        document.getElementById('gemini-context-menu')?.remove();
        submenu.remove();
        document.removeEventListener('click', closeMenu);
      });
    });
  }

  function renderDeviceMenu() {
    const devices = [
      'Apfelsschneider', 'Austernmesser', 'Backofen', 'Baconbräter', 'Brotbackautomat', 
      'Caipirinhastößel', 'Crepe-Gerät', 'Dampfgarer', 'Dörrautomat', 'Eismaschine', 
      'Entsafter', 'Filterkaffeemaschine', 'Fondue', 'Grill', 
      'Heißluftfritteuse', 'Joghurtbereiter', 'Kenwood Cooking Chef Gourmet', 
      'Kirschkernentferner', 'Kugelformer', 'Le Creuset', 'Löffelwaage', 
      'Marinierspritze', 'Mikrowelle', 'Milchaufschäumer', 'Mokkakanne', 
      'One-Pot', 'Optigrill', 'Pancakemaker', 'Pastamaschine', 
      'Popcornmaschine', 'Raclette', 'Sous-Vide', 'Sushireis', 
      'Teigschneider', 'Thermomix', 'Toaster', 'Waffeleisen', 'Wiegemesser', 
      'Zuckerwattemaschine'
    ];
    
    submenu.innerHTML = `
      <div class="submenu-item" id="recipe-device-back" style="font-weight: bold; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 5px;">⬅ Zurück</div>
      <div style="padding: 5px; border-bottom: 1px solid rgba(0,0,0,0.1); display: flex; gap: 5px; margin-bottom: 5px;">
        <input type="text" id="custom-device-input" placeholder="Eigenes Gerät..." style="flex: 1; padding: 4px; font-size: 12px; border: 1px solid #ccc; border-radius: 3px; background: #fff; color: #000; width: 100%; box-sizing: border-box;" autocomplete="off" />
        <button id="custom-device-btn" style="padding: 4px 8px; font-size: 12px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: #f0f0f0; color: #333;">OK</button>
      </div>
      ${devices.map(d => `<div class="submenu-item device-item" data-device="${d}">${d}</div>`).join('')}
    `;
    submenu.style.maxHeight = '400px';
    submenu.style.overflowY = 'auto';
    
    submenu.querySelector('#recipe-device-back').addEventListener('click', (e) => {
      e.stopPropagation();
      renderMainMenu();
    });

    const triggerCustomDevice = () => {
      const customDevice = submenu.querySelector('#custom-device-input').value.trim();
      if (customDevice) {
        handleGeminiAction('recipeDevice', customDevice);
        document.getElementById('gemini-context-menu')?.remove();
        submenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    submenu.querySelector('#custom-device-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      triggerCustomDevice();
    });

    submenu.querySelector('#custom-device-input').addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerCustomDevice();
      }
    });
    
    submenu.querySelectorAll('.device-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const device = e.currentTarget.dataset.device;
        handleGeminiAction('recipeDevice', device);
        document.getElementById('gemini-context-menu')?.remove();
        submenu.remove();
        document.removeEventListener('click', closeMenu);
      });
    });
  }

  renderMainMenu();

  const itemRect = menuItem.getBoundingClientRect();
  submenu.style.left = (itemRect.right + 5) + 'px';
  submenu.style.top = itemRect.top + 'px';
  document.body.appendChild(submenu);
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
  // Fallback: Wenn DOM noch nicht bereit ist, nur URL zurückgeben
  if (!document.body) {
    return {
      url: window.location.href,
      title: document.title || window.location.href,
      text: `[Seite wird noch geladen - nur URL verfügbar]\n${window.location.href}`
    };
  }
  
  const selectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content', '.article-body', '#content', '#main'];
  let textEl = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 200) {
      textEl = el;
      break;
    }
  }
  const rawText = (textEl || document.body).innerText || '';
  const cleanText = rawText.replace(/\n{3,}/g, '\n\n').trim();
  const selectedText = window.getSelection()?.toString()?.trim();
  return {
    url: window.location.href,
    title: document.title,
    text: selectedText ? `[Markierter Text]:\n${selectedText.substring(0, 10000)}` : cleanText.substring(0, 10000)
  };
}

function sanitizeHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove scripts, styles, iframes, etc.
  const scripts = temp.querySelectorAll('script, iframe, object, embed, link, style');
  scripts.forEach(s => s.remove());
  
  // Clean event handlers and javascript: URLs
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(el => {
    for (let i = el.attributes.length - 1; i >= 0; i--) {
      const attr = el.attributes[i];
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (['src', 'href', 'action'].includes(attr.name) && attr.value.trim().toLowerCase().startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  
  return temp.innerHTML;
}

function loadMarked() {
  return Promise.resolve();
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
    if (window.marked) responseBody.innerHTML = sanitizeHtml(window.marked.parse(responseText));
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
    if (window.marked) responseBody.innerHTML = sanitizeHtml(window.marked.parse(responseText));
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

// Local LLM request is handled by the shared function in local_llm_helpers.js

function showDeepResearchPopup() {
  alert('Deep Research Popup (Platzhalter)');
}

function showMotivationPopup() {
  const task = prompt('Was moechtest du tun?');
  if (!task) return;
  const promptText = `Erstelle einen Motivations-Booster im Stil eines TED-Talks zum Thema: "${task}". Verwende rhetorische Fragen, kurze Sätze, Wiederholungen. Thema aus der Website nehmen und in einen "Du schaffst das"-Kontext packen. Emojis erlaubt, aber sparsam.

Struktur:
1. **Hook** (rhetorische Frage, die Neugier weckt)
2. **Das Problem** (kurz, prägnant)
3. **Die Wende** (Mindset-Shift)
4. **Der Call** (konkrete Aufforderung)
5. **Abschluss** (powervolle letzte Zeile)

Länge: max. 150 Wörter. Ton: inspirierend, energiegeladen.`;
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

function showLegalCheckPopup(context) {
  const styles = ['Gutachtenstil', 'Urteilsstil', 'Feststellungsstil'];
  const styleInput = prompt(`In welchem Stil soll die Rechtslage beurteilt werden?\n\n1. Gutachtenstil (Standard)\n2. Urteilsstil\n3. Feststellungsstil\n\nGib die Nummer oder den Namen ein:`, 'Gutachtenstil');
  if (!styleInput) return;
  
  let selectedStyle = 'Gutachtenstil';
  if (styleInput === '1' || styleInput.toLowerCase().includes('gutachten')) {
    selectedStyle = 'Gutachtenstil';
  } else if (styleInput === '2' || styleInput.toLowerCase().includes('urteil')) {
    selectedStyle = 'Urteilsstil';
  } else if (styleInput === '3' || styleInput.toLowerCase().includes('feststellung')) {
    selectedStyle = 'Feststellungsstil';
  }
  
  const promptText = `Analysiere die Rechtslage zu diesem Thema nach deutschem Recht im Stil einer juristischen Abschlussprüfung.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

WICHTIG: Verzichte auf Emojis. Verwende keine Erklärungen für juristische Fachbegriffe.

STRUKTUR:

1. RECHTSGEBIETE (Liste)

Rechtsgebiet 1: [Name des Rechtsgebiets, z.B. Vertragsrecht]
- Relevante Gesetze: [§ X Abs. Y Satz Z BGB, etc.]
- Anwendbarkeit: [Warum ist dieses Rechtsgebiet relevant?]

---

Rechtsgebiet 2: [Name des Rechtsgebiets]
- Relevante Gesetze: [§ X Abs. Y Satz Z, etc.]
- Anwendbarkeit: [Warum ist dieses Rechtsgebiet relevant?]

---

[weitere Rechtsgebiete mit gleicher Struktur...]

2. RECHTSQUELLEN (Liste)

Gesetze:
- [Gesetzesname mit konkreter Fundstelle: § X Abs. Y Satz Z]
- [weitere Gesetze...]

Verordnungen:
- [Verordnungsname mit Fundstelle]
- [...]

Gewohnheitsrecht:
- [Relevantes Gewohnheitsrecht mit Quelle]

Rechtsordnungen / Allgemeine Maßstäbe:
- [z.B. Treu und Glauben § 242 BGB]
- [...]

Satzungen:
- [Relevante Satzungen]

Verwaltungsvorschriften:
- [Relevante Vorschriften]

Präzedenzfälle / Entscheidungen oberster Gerichtshöfe:
- [BGH, BVerfG, BVerwG, BFH, BSG - mit Az. und Fundstelle]

3. RECHTLICHE BEWERTUNG
Präzise juristische Analyse der vorliegenden Sachverhalte.

4. MOEGLICHE RISIKEN / OFFENE PUNKTE

4.1 Unklare Rechtslagen
- [...]

4.2 Rechtskollisionen
- [Welche Rechtskollisionen könnten auftreten?]
- [...]

4.3 Streitige Fragen
- [...]

5. BEURTEILUNG RECHTSLAGE (${selectedStyle})
[Hier erfolgt die Beurteilung im gewählten Stil: ${selectedStyle}]`;

  getAiConfig((config) => {
    if (config.type === 'local') sendToLocalLlm(config, promptText, 'silent').then(response => showResponseModal(response));
    else {
      chrome.storage.local.set({ pendingPrompt: promptText }, () => window.open(config.url, '_blank'));
    }
  });
}

function handleGeminiAction(action, summaryType = 'normal', ytSummaryType = 'nested', clipboardOnly = false) {
  if (action === 'deepResearch') { showDeepResearchPopup(); return; }
  if (action === 'motivation') { showMotivationPopup(); return; }
  if (action === 'legalCheck') { showLegalCheckPopup(getPageContext()); return; }

  const context = getPageContext();
  let promptText = '';

  switch (action) {
    case 'createPresentation':
      promptText = `Erstelle eine Executive-Summary-Präsentation für C-Level. Max. 6 Folien, je max. 5 Wörter pro Bullet. Fokus auf: Business Impact, ROI, Zeitersparnis, Risiken. Jede Folie hat eine klare "So what?"-Message.

Basierend auf: ${context.url}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Format pro Folie:
**Folie X: [Titel]**
- [Bullet 1, max 5 Wörter]
- [Bullet 2, max 5 Wörter]
- [Bullet 3, max 5 Wörter]
Speaker Notes: [Was soll gesagt werden?]
So What?: [Kernbotschaft dieser Folie]`;
      break;
    case 'ahaMoments':
      promptText = `Generiere 3 weiterführende Prompts zum Thema dieser Website.

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
      promptText = `Anwenden der sokratischen Methode (Maiutik) auf diese Website.

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
      promptText = `Führe eine professionelle Grammatik- und Rechtschreibprüfung durch.

Zu prüfender Text:
"""
${context.text.substring(0, 5000)}
"""

STRUKTUR DER AUSGABE:

1. LISTE DER FEHLER

Fehler 1:
- Zitat mit Fehler: [Originaltext mit Fehler]
- Art des Fehlers: [Grammatik/Rechtschreibung/Zeichensetzung/Stil]
- Korrektur: [Korrigierte Version]

---

Fehler 2:
- Zitat mit Fehler: [Originaltext mit Fehler]
- Art des Fehlers: [Grammatik/Rechtschreibung/Zeichensetzung/Stil]
- Korrektur: [Korrigierte Version]

---

Fehler 3:
- Zitat mit Fehler: [Originaltext mit Fehler]
- Art des Fehlers: [Grammatik/Rechtschreibung/Zeichensetzung/Stil]
- Korrektur: [Korrigierte Version]

---

[weitere Fehler mit gleicher Struktur...]

2. STATISTIK
- Fehler pro 100 Wörter: [Zahl]
- Gesamteindruck: [professionell/mittel/schwach]

========================================

3. KORRIGIERTER GESAMTTEXT
[Hier folgt der vollständige Text mit allen Korrekturen, ohne Fettdruck oder besondere Formatierungen]`;
      break;
    case 'summaryWithCrawl': {
      const crawlUrl = prompt('Bitte gib die URL ein, die gecrawlt und zusammengefasst werden soll:');
      if (!crawlUrl) return;
      promptText = `Eine URL crawlen, alle Fakten als Emoji-Aufzählungspunkte extrahieren und den gegebenen Text zusammenfassen. [enter URL to crawl and summarize]

URL: ${crawlUrl}

Seiteninhalt zur Referenz:
"""
${context.text.substring(0, 3000)}
"""`;
      break;
    }
    case 'summaryChapter':
      promptText = `{ "token_bundle": { "bundle_name": "Study Pack: CoT + Guardian", "shortcut": "🌿", "version": "1.0.0", "portability_check": "✅", "tokens": [ { "token_type": "Method Token", "token_name": "chain.of.thought.method", "token_id": "cot-101", "description": "Stepwise study workflow that extracts arguments, evidence, and takeaways before summarizing.", "instructions": [ "1) Read the chapter. List 3–5 core arguments as bullets.", "2) For each argument, add 1–2 concrete pieces of evidence or examples from the text.", "3) Distill a concise study summary (150–250 words). No filler. No metaphors. Keep author's intent.", "4) Output a glossary of key terms (definitions in 1 line each).", "5) Create 5 flashcards: (Q) and (A) pairs covering the highest-yield points.", "Formatting: Use clear headings: Arguments, Evidence, Summary, Glossary, Flashcards." ], "constraints": { "no_filler": true, "quote_marking": "If quoting, use short quotes with page/section when available.", "audience": "grad student", "style": "precise, neutral, test-ready" }, "status": "active" }, { "token_type": "Guardian Token v2", "token_name": "guardian.token.v2", "token_id": "gtv2-101", "description": "Prevents drift into fluff, enforces structure and checks for contradictions.", "guardian_hooks": [ "schema_validation", "contradiction_scan", "tone_clarity_check", "portability_check" ], "schema": { "sections_required": ["Arguments", "Evidence", "Summary", "Glossary", "Flashcards"], "summary_word_limit": {"min": 150, "max": 250}, "flashcards_count": 5 }, "status": "active" } ] } }

URL: ${context.url}

Text:
"""
${context.text.substring(0, 6000)}
"""`;
      break;
    case 'summaryNormal':
      promptText = `Lies diese Seite und gib Folgendes an:
– 3 wichtigste Erkenntnisse in Stichpunkten
– Wichtige Statistiken oder Daten
– Wichtigstes Zitat oder wichtigste Erkenntnis
– Warum dies wichtig ist (in einem Satz)
Halte dich insgesamt auf unter 100 Wörter.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 5000)}
"""`;
      break;
    case 'summarySuperShort':
      promptText = `Erstelle eine extrem kurze Zusammenfassung:

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 4000)}
"""

STRENGE ANFORDERUNGEN:
- WICHTIG: Weniger als 3 Sätze (also 1-2 Sätze)
- WICHTIG: Weniger als 20 Wörter insgesamt (zähle nach!)
- Absolute Kürze ist oberste Priorität
- Keine Füllwörter wie "Der", "Die", "Das", "Ein", "Eine" wenn möglich
- Nur die reine Kernbotschaft

Beispiel für korrekte Ausgabe:
"KI erobert Arbeitsmarkt. 40% Jobs gefährdet bis 2030." (9 Wörter, 2 Sätze)`;
      break;
    case 'summary':
      promptText = `Fasse zusammen (${summaryType}):\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'factCheck':
      promptText = `Erstelle einen detaillierten Faktencheck. Prüfe auf interne Konsistenz (Widersprüche im Text).

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Struktur:

1. KONSISTENZPRÜFUNG
[Widersprüche im Text?]

---

2. QUELLENPRÜFUNG KRITISCHER FAKTEN

Fakt 1:
- Originalbehauptung: [Text aus der Website]
- Verifizierungsstatus: [bestätigt / nicht verifizierbar / falsch]
- Prüfung anhand verifizierter Quellen:
  - Quelle 1: [Zitat + Link]
  - Quelle 2: [Zitat + Link] (falls vorhanden)
  - [...]
- Bewertung: [Stimmt das Fakt? Gibt es keine verifizierbare Studienlage? Oder ist es falsch/ausgedacht?]

---

Fakt 2:
- Originalbehauptung: [Text aus der Website]
- Verifizierungsstatus: [bestätigt / nicht verifizierbar / falsch]
- Prüfung anhand verifizierter Quellen:
  - Quelle 1: [Zitat + Link]
  - Quelle 2: [Zitat + Link] (falls vorhanden)
  - [...]
- Bewertung: [Stimmt das Fakt? Gibt es keine verifizierbare Studienlage? Oder ist es falsch/ausgedacht?]

---

Fakt 3:
[... gleiche Struktur ...]

---

[weitere Fakten mit gleicher Struktur...]

3. KRITISCHE BEWERTUNG
[Welche Behauptungen sollten mit Vorsicht genossen werden? Zusammenfassung aller problematischen Fakten]`;
      break;
    case 'plagiarism':
      promptText = `Analysiere den folgenden Text bzw. die folgende Website auf Plagiate und mögliche Rechtsverletzungen. Vergleiche den Inhalt mit verfügbaren Quellen und prüfe auf Übereinstimmungen.

WICHTIG: Korrekt gekennzeichnete Zitate sind KEIN Plagiat. Nur nicht oder falsch zitierte Übernahmen gelten als Plagiat.

URL: ${context.url}

Zu analysierender Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANALYSE-ANFORDERUNGEN:

1. Prüfe auf textliche Übereinstimmungen mit bekannten Quellen
2. Prüfe auf paraphrasierte Inhalte ohne Quellenangabe
3. Prüfe auf übernommene Ideen ohne Quellenangabe
4. Prüfe auf korrekte Zitierweise (falls Zitate vorhanden)
5. Falls der Inhalt geeignet ist, prüfe auf:
   - Urheberrechtsverletzungen (Texte, Fotos, Filme, Musik, Software)
   - Patentverletzungen (Erfindungen, technische Lösungen)
   - Designrechtsverletzungen (Gestaltungen, Designs)

ERGEBNISSTRUKTUR:

TEIL 1: PLAGIATSQUOTE
Plagiat erkannt zu: [XX]%
(Methode: Wie wurde berechnet? z.B. "Prozentualer Anteil des Textes mit erkennbaren Übereinstimmungen")

---

TEIL 2: IDENTIFIZIERTE PLAGIATE

Plagiat 1:
- Textstelle im analysierten Werk: [Originalzitat aus dem Text]
- Verdacht: [Wörtliche Übernahme / Paraphrase / Ideenklau / Fehlende Quellenangabe]
- Mutmaßliche Originalquelle: [Titel, Autor, URL falls bekannt]
- Zitierweise: [Korrekt / Falsch / Fehlend]
- Bewertung: [Begründung warum dies ein Plagiat ist]

---

Plagiat 2:
[... gleiche Struktur ...]

---

[weitere Plagiate mit gleicher Struktur...]

TEIL 3: RECHTLICHE EINSCHÄTZUNG

Mögliche Rechtsverletzungen:
- Urheberrecht: [Ja/Nein - Begründung]
- Patentrecht: [Ja/Nein - Begründung, falls geprüft]
- Designrecht: [Ja/Nein - Begründung, falls geprüft]
- Wettbewerbsrecht: [Ja/Nein - Begründung]
- Strafrecht (Betrug etc.): [Ja/Nein - Begründung]

Grobe Einschätzung: [Kurze Zusammenfassung der rechtlichen Risiken]

---

TEIL 4: FAZIT
[Maximal 4 Sätze. Zusammenfassung der wichtigsten Erkenntnisse und Empfehlung für nächste Schritte.]`;
      break;
    case 'rewrite':
      promptText = `Schreibe den folgenden Text um. Behalte dabei den Stil, den Aufbau und den Inhalt vollständig bei. Verändere ausschließlich die Wortwahl und Satzstruktur, sodass der Text anders klingt, aber dieselbe Bedeutung und denselben Informationsgehalt hat.

URL: ${context.url}

Originaltext:
"""
${context.text.substring(0, 5000)}
"""

ANFORDERUNGEN:
- Behalte die ursprüngliche Struktur und Gliederung bei
- Behalte den Ton und Stil des Originals bei (formell, locker, fachlich, etc.)
- Nutze andere Wörter und andere Satzstellungen
- Kürze nicht ab und füge keine neuen Informationen hinzu
- Behalte alle Fakten, Zahlen, Daten und Zitate exakt bei
- Wenn Zitate im Original vorhanden sind, bleiben sie wörtlich erhalten
- Der umgeschriebene Text soll sich flüssig und natürlich lesen
- Falls erforderlich, verwende Formatierungen zur besseren Lesbarkeit: Fettdruck für wichtige Begriffe, Überschriften für Abschnitte, Listen für Aufzählungen, etc.

WICHTIG: Gib als Antwort AUSSCHLIESSLICH den umgeschriebenen Text aus. Keine Einleitung, keine Erklärung, keine Vergleiche mit dem Original, keine Markierungen was sich geändert hat, keine individuellen Prompts, keine Fragen, keine Kommentare. NUR der umgeschriebene Text.`;
      break;
    case 'translate': {
      const textToTranslate = context.text.substring(0, 8000);
      // Automatische Erkennung: Kurze Texte -> DeepL, Lange Texte -> KI
      const DEEPL_FREE_LIMIT = 1500; // Zeichen
      
      if (textToTranslate.length < DEEPL_FREE_LIMIT) {
        // Kurzer Text: Direkt zu DeepL kopieren und öffnen
        const deeplUrl = `https://www.deepl.com/translator#auto/de/${encodeURIComponent(textToTranslate)}`;
        navigator.clipboard.writeText(textToTranslate).then(() => {
          window.open(deeplUrl, '_blank');
          showToast('Text kopiert - DeepL wird geöffnet');
        }).catch(() => {
          // Fallback falls Clipboard nicht funktioniert
          window.open(deeplUrl, '_blank');
        });
        return;
      }
      
      // Langer Text: KI-Übersetzung
      promptText = `Übersetze den folgenden Text maximal originalgetreu ins Deutsche (falls der Text bereits Deutsch ist, übersetze ins Englische).

URL: ${context.url}

Originaltext:
"""
${textToTranslate}
"""

ANFORDERUNGEN FÜR MAXIMAL ORIGINALGETREUE ÜBERSETZUNG:
- Behalte den Satzbau so weit wie möglich bei (Wortstellung, Satzlänge, Satzstruktur)
- Behalte den Stil exakt bei (formell, locker, fachlich, poetisch, sarkastisch, etc.)
- Behalte den Inhalt vollständig bei - keine Kürzung, keine Ergänzung
- Übersetze wörtlich, nicht sinngemäß (sofern grammatikalisch möglich)
- Behalte alle Fachbegriffe korrekt bei (übersetze nur wenn es im Zielsprachraum üblich ist)
- Behalte alle Namen, Orte, Marken exakt bei
- Behalte Zahlen, Daten, Maßeinheiten exakt bei
- Behalte die Formatierung bei (Absätze, Aufzählungen, etc.)
- Kulturelle Referenzen: Übersetze wörtlich, füge keine Erklärungen hinzu

WICHTIG: Gib als Antwort AUSSCHLIESSLICH die Übersetzung aus. Keine Einleitung, keine Erklärung, kein Hinweis auf die Übersetzung, kein Originaltext. NUR die reine Übersetzung.`;
      break;
    }
    case 'completeText':
      promptText = `Vervollständige den folgenden Text oder die folgende Website zu einem vollständigen, kohärenten Satz bzw. Absatz.

URL: ${context.url}

Unvollständiger Text:
"""
${context.text.substring(0, 4000)}
"""

ANFORDERUNGEN:
- Analysiere den vorhandenen Text und vervollständige ihn zu einem sinnvollen, abgeschlossenen Satz oder Absatz
- Behalte den Stil, den Ton und die Thematik des bestehenden Textes bei
- Der vervollständigte Text soll sich natürlich und flüssig anlesen
- Füge keine neuen Themen oder Informationen hinzu, die nicht im Kontext liegen
- Wenn der Text bereits vollständig ist, gib ihn unverändert aus

WICHTIG: Gib als Antwort AUSSCHLIESSLICH den vervollständigten Text aus. Keine Einleitung, keine Erklärung, keine Markierungen. NUR der reine Text.`;
      break;
    case 'codeReview':
      promptText = `Führe ein Code Review für den folgenden Code durch.

Quelle: ${context.url}

Code:
"""
${context.text.substring(0, 5000)}
"""

STRUKTUR:

1. Übersicht
- Sprache/Framework
- Zweck des Codes
- Zeilenanzahl

2. Kritische Fehler (Sicherheit, Bugs)
- Zeile X: [Problem beschreiben]
- Korrektur: [Korrigierter Code]

---

3. Warnungen (Performance, Best Practices)
- Zeile Y: [Problem beschreiben]
- Korrektur: [Korrigierter Code]

---

4. Verbesserungsvorschläge (Lesbarkeit, Wartbarkeit)

5. Positive Aspekte (Was ist gut gemacht?)

6. Gesamtbewertung (1-10) mit Begründung`;
      break;
    case 'copyCode':
      let cleanHtml = '';
      if (document.body) {
        const bodyClone = document.body.cloneNode(true);
        // Remove extension elements and non-structural tags to keep content compact and clean
        bodyClone.querySelectorAll('#gemini-context-menu, #gemini-submenu, #gemini-response-overlay, #gemini-toast, #gemini-response-toast, #gemini-overlay-container, script, style, svg').forEach(el => el.remove());
        cleanHtml = bodyClone.innerHTML;
      }
      const htmlSnippet = cleanHtml ? cleanHtml.substring(0, 15000) : '[Keine HTML-Struktur verfügbar]';
      promptText = `Du bist ein erfahrener Frontend-Entwickler. Deine Aufgabe ist es, die technische HTML- und CSS-Struktur der folgenden Website zu kopieren.

URL: ${context.url}

WICHTIG: Ersetze alle konkreten Texte, Überschriften, Links und visuellen Inhalte (Bilder, Symbole etc.) durch generische Platzhalter (z. B. 'Lorem Ipsum' für Fließtexte, 'Überschrift' oder 'Kategorie' für Überschriften, und 'bild.png' für Bilder). Die technische Struktur (HTML-Tags, CSS-Klassen, Container-Hierarchien, Grid-/Flexbox-Layouts) soll aber exakt erhalten bleiben und sauber nachgebaut werden.

Hier ist die HTML-Struktur der Website (bereinigt um Skripte/Styles/SVGs):
"""
${htmlSnippet}
"""

Generiere den bereinigten, strukturellen HTML- und CSS-Code. Formatiere die Ausgabe sauber in Markdown-Codeblöcken (mit \`\`\`html und \`\`\`css).`;
      break;
    case 'deepResearch':
      promptText = `Führe eine äußerst ausführliche, tiefgehende Recherche und Analyse zu diesem Thema durch. Recherchiere alle möglichen Hintergründe, Zusammenhänge und Kontexte.

Ausgangspunkt: ${context.url}

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Analysiere das Thema extrem ausführlich und detailliert
- Recherchiere ALLE möglichen Hintergründe: historisch, politisch, wirtschaftlich, sozial, technologisch, kulturell
- Gehe auf Ursachen, Entwicklungen, Trends und Zukunftsperspektiven ein
- Berücksichtige verschiedene Perspektiven und Sichtweisen
- Nenne konkrete Fakten, Daten, Statistiken und Belege
- Identifiziere Akteure, Institutionen, Schlüsselfiguren
- Gehe auf kontroverse Punkte und Debatten ein
- Nenne Quellen und Referenzen wo möglich

STRUKTUR:

1. Themenidentifikation (Was ist der Kern?)

2. Ausführliche Hintergrundanalyse
   - Historische Entwicklung
   - Politische Rahmenbedingungen
   - Wirtschaftliche Faktoren
   - Gesellschaftliche/soziale Aspekte
   - Technologische Grundlagen
   - Kultureller Kontext

3. Faktenlage (Was ist gesichert?)
   - Konkrete Daten und Statistiken
   - Belege und Beweise

4. Kontroverse Punkte (Wo gibt es Meinungsverschiedenheiten?)

5. Akteure und Interessengruppen

6. Zukunftsperspektiven und Trends

7. Offene Fragen (Was bleibt ungeklärt?)

8. Quellen und weiterführende Recherche`;
      break;
    case 'askPage': {
      const userQuestion = prompt('Welche Frage hast du zu dieser Website?');
      if (!userQuestion) return;
      promptText = `Ich habe eine Frage zu dieser Seite. Gebe als Antwort ausschliesslich die Antwort auf die Frage aus. Keine zusätzlichen Prompts. Keine weiteren Nachrichten.

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
      promptText = `Du bist ein investigativer Journalist und Forensiker ("Sherlock"). Analysiere diese Website auf Herz und Nieren:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Führe eine gründliche Detektiv-Analyse in folgenden Abschnitten durch:
1. **Seriosität & Trust-Faktoren**: Wirkt die Seite seriös? Gibt es rechtliche Hinweise (Impressumspflicht, Datenschutzerklärung)? Wer steckt dahinter (Unternehmen, Privatperson, Organisation)?
2. **Red Flags & Alarmzeichen**: Findest du Widersprüche, übertriebene Versprechungen, künstliche Verknappung ("Nur noch heute!"), manipulatives Wording (Dark Patterns) oder verdächtige Behauptungen?
3. **Geschäftsmodell & Monetarisierung**: Wie verdient diese Seite Geld? (z.B. Affiliate-Links, Werbung, Abos, Direktverkauf, Datensammlung, Spenden).
4. **Zielgruppe & Manipulationstechniken**: Wer soll hier angesprochen werden? Welche psychologischen Trigger (Social Proof, Authority, Scarcity) werden genutzt, um den Besucher zu beeinflussen?
5. **Detektivisches Fazit & Urteil**: Eine klare Einschätzung auf einer Skala von 1-10 (1 = hochgradig dubios/Scam, 10 = absolut vertrauenswürdig).`;
      break;
    case 'writeReply':
      promptText = `Erstelle 3 Antwortmöglichkeiten auf diese Nachricht/E-Mail/Kommentar.

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
      promptText = `Schreibe 3 E-Mail-Entwürfe zu diesem Thema: (1) formell/geschäftlich, (2) freundlich/kollegial, (3) kurz/bündig. Betreffzeile soll Catchy aber professionell sein. Jede E-Mail max. 150 Wörter. Abschluss mit passender Grußformel.

Thema aus: ${context.url}

Inhalt zur Grundlage:
"""
${context.text.substring(0, 3000)}
"""

Format:
**1. Formell/Geschäftlich**
Betreff: [Catchy aber professionell]
[Text]

**2. Freundlich/Kollegial**
Betreff: [Catchy aber professionell]
[Text]

**3. Kurz/Bündig**
Betreff: [Catchy aber professionell]
[Text]`;
      break;
    case 'checklist':
      promptText = `Erstelle eine universelle Checkliste basierend auf dem Inhalt dieser Website.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Analysiere den Inhalt und erstelle eine praktische Checkliste. Da der Kontext variiert (Tutorial, Produkt, Dienstleistung, Artikel, Rezept, etc.), identifiziere eigenständig das Thema und was sinnvollerweise geprüft werden sollte.

Mögliche Checklisten-Typen (wähle passenden oder eigenen):
- **Vorbereitung/Sammeln** – Was braucht man vorher?
- **Schritt-für-Schritt** – Ablauf in korrekter Reihenfolge
- **Qualitätsprüfung** – Woran erkennt man Gutes vs. Schlechtes?
- **Vergleich** – Was sollte man vergleichen/beachten?
- **Abschluss** – Was nicht vergessen vor/nach dem Kauf/Nutzung?
- **Fehler vermeiden** – Typische Stolperfallen

Format:

## 📋 [Thema der Checkliste]

### □ [Kategorie 1]
- [ ] [Konkreter Punkt]
- [ ] [Konkreter Punkt]
- [ ] [Konkreter Punkt]

### □ [Kategorie 2]
- [ ] [Konkreter Punkt]
...

### 💡 Pro-Tipp
[Kurzer hilfreicher Hinweis zum Thema]`;
      break;
    case 'alternative':
      promptText = `Analysiere dieses Produkt/Dienstleistung und finde Alternativen.

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
      promptText = `Preisvergleich fuer: ${context.url}\n\n${context.text.substring(0, 4000)}\n\nIst der Preis fair? Alternativen?`;
      break;
    case 'productProsCons':
      promptText = `Analysiere den folgenden Text, die Website, das Produkt, die Nachricht oder den Artikel und erstelle eine Liste der Vor- und Nachteile.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Durchsuche den Inhalt nach allem, für das Vorteile und Nachteile ermittelt werden können
- Das kann sein: Produkte, Dienstleistungen, Websites, Apps, Konzepte, Ideen, Entscheidungen, Nachrichten, Artikel, etc.
- Die Anzahl der Vor- und Nachteile muss NICHT ausgeglichen sein
- Wenn keine Vorteile oder keine Nachteile erkennbar sind, schreibe das explizit hin
- Sei ehrlich und objektiv, übertreibe weder positiv noch negativ

WICHTIG: Gib als Antwort AUSSCHLIESSLICH die Liste der Vor- und Nachteile aus. Kein Fazit, keine Einleitung, keine Erklärung, keine Bewertung, keine Empfehlung. NUR die reine Liste.

Format:

Vorteile:
- [Vorteil 1]
- [Vorteil 2]
- [Vorteil 3]
- [... oder "Keine erkennbaren Vorteile"]

Nachteile:
- [Nachteil 1]
- [Nachteil 2]
- [Nachteil 3]
- [... oder "Keine erkennbaren Nachteile"]`;
      break;
    case 'createFAQ':
      promptText = `Erstelle eine FAQ (Frequently Asked Questions) basierend auf diesem Inhalt.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Erstelle so viele FAQ-Einträge wie sinnvoll und notwendig sind (mindestens 5)
- Jeder Eintrag besteht aus einer Frage und einer prägnanten Antwort
- Die Fragen sollen die wichtigsten und häufigsten Fragen zum Thema abdecken
- Die Antworten sollen kurz, klar und verständlich formuliert sein
- Die Fragen sollen aus verschiedenen Perspektiven kommen (Anfänger, Fortgeschrittene, Praktiker)

WICHTIG: Gib als Antwort AUSSCHLIESSLICH die FAQ aus. Keine Einleitung, kein Text davor, kein Text danach, keine Erklärung, keine Zusammenfassung, keine 3 Zusatzprompts. NUR die reine FAQ.

Format:
Q: [Frage]
A: [Antwort]

Q: [Frage]
A: [Antwort]

[usw.]`;
      break;
    case 'createQuiz':
      promptText = `Erstelle ein interaktives Quiz basierend auf diesem Inhalt. Das Quiz soll so gestaltet sein, dass es den Lernenden aktiv einbindet und nicht nur ein statischer Test ist.

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Die Anzahl der Fragen richtet sich nach dem Umfang und der Komplexität des Inhalts (mindestens 5, idealerweise so viele wie nötig für gute Abdeckung)
- Verwende ALLE denkbaren Fragetypen, nicht nur Multiple-Choice:
  * Multiple-Choice (einzelne/mehrere richtige Antworten)
  * Wahr/Falsch mit Begründung
  * Zuordnungsaufgaben (Begriffe zu Definitionen)
  * Lückentexte
  * Offene Fragen mit Musterlösung
  * Rangfolge-Aufgaben
  * Fallstudien/Szenarien
  * Bildbeschreibungen (falls Bilder im Text)
  * Schätzfragen
  * Ja/Nein-Fragen mit Erklärung
  * Kreuzworträtsel-ähnliche Aufgaben
  * Dialogvervollständigung
  * Fehlerfinden im Text
- Schwierigkeitsgrad soll variieren und aufsteigend sein
- Zu jeder Frage: richtige Antwort + kurze Erklärung warum
- Wenn möglich: Gamification-Elemente einbauen (Punkte, Level, Herausforderungen)
- Das Quiz soll interaktiv wirken, als würde ein Tutor fragen

WICHTIG: Erstelle ein abwechslungsreiches, interaktives Lernerlebnis. Vermeide monotone Aufzählungen.`;
      break;
    case 'extractQuotes':
      promptText = `Extrahiere alle Zitate aus dem folgenden Text bzw. der folgenden Website.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Liste ALLE Zitate auf, die im Text vorkommen
- Ein Zitat ist jede wörtliche Rede, jede direkte Aussage in Anführungszeichen oder jede markante Formulierung, die als Zitat erkennbar ist
- Zu jedem Zitat: Nenne die Quelle, falls im Text angegeben
- Falls keine Quelle angegeben ist, schreibe "Quelle: nicht angegeben"
- Behalte die Originalformulierung exakt bei

WICHTIG: Gib als Antwort AUSSCHLIESSLICH die Liste der Zitate aus. Keine Einleitung, keine Erklärung, keine Bewertung, keine zusätzlichen Kommentare. NUR die Zitate mit ihren Quellen.

Format:
Zitat 1: "[Originalzitat]"
Quelle: [Quelle oder "nicht angegeben"]

Zitat 2: "[Originalzitat]"
Quelle: [Quelle oder "nicht angegeben"]

[usw.]`
      break;
    case 'extractData2':
      promptText = `Extrahiere strukturierte Daten aus: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'captureView':
      // Starte Screenshot-Auswahl statt nur Text-Analyse
      startScreenshotSelection();
      return;  // Frühzeitiger Return, da wir async arbeiten
    case 'doINeedThis':
      promptText = `Hilf mir zu entscheiden, ob ich dieses Produkt/Dienstleistung wirklich brauche.

URL: ${context.url}

Angebot:
"""
${context.text.substring(0, 4000)}
"""

Entscheidungshilfe:

## 🤔 Brauchst du das wirklich?

**Stelle dir diese Fragen:**
1. [Spezifische Frage zum Produkt - z.B. "Hast du bereits ein ähnliches Produkt, das denselben Zweck erfüllt?"]
2. [Frage zu bestehenden Alternativen - z.B. "Könntest du das Problem auch kostenlos oder günstiger lösen?"]
3. [Frage zum tatsächlichen Nutzen - z.B. "Wie oft wirst du dieses Produkt wirklich nutzen?"]
4. [Frage zur Häufigkeit der Nutzung - z.B. "Ist der Nutzen langfristig oder nur kurzfristig?"]
5. [Frage zur finanziellen Priorität - z.B. "Steht das im Verhältnis zum Preis und deinem Budget?"]

## ✅ Ja, wenn...
- [Situationen, wo es Sinn macht]
- [Konkrete Use-Cases]

## ❌ Nein, wenn...
- [Situationen, wo es unnötig ist]
- [Warnsignale]

## 💡 Alternativen zum Kauf
- [Möglichkeiten, den Bedarf anders zu decken]
- [Gratis-Optionen]
- [DIY-Lösungen]
- [Leih- oder Mietoptionen]

**Ehrliche Empfehlung:** [Klare Aussage, für wen das sinnvoll ist und für wen nicht]`;
      break;
    case 'accessibility':
      promptText = `Prüfe die Barrierefreiheit (Accessibility) dieser Website.

URL: ${context.url}

Seiteninhalt:
"""
${context.text.substring(0, 5000)}
"""

Analysiere folgende technische Barrierefreiheits-Aspekte (WCAG 2.1 AA):

## 1. Text & Lesbarkeit
- **Zeilenhöhe anpassbar** – Lässt sich der Zeilenabstand verändern?
- **Textabstände anpassbar** – Können Buchstaben- und Wortabstände vergrößert werden?
- **Schriftgröße** – Ist Text auf 200% zoombar ohne Funktionsverlust?

## 2. Semantische Struktur
- **Sprachattribut** – Hat das HTML-Element ein gültiges lang-Attribut (z.B. lang="de")?
- **Viewport-Meta** – Ermöglicht das Meta-Viewport-Tag eine Skalierung auf mindestens 200%?
- **Listen-Struktur** – Sind Listen mit <ul>/<ol>/<dl> markiert, nicht nur mit CSS?
- **Listen-Items** – Sind <li>-Elemente direkte Kinder von <ul>/<ol>?
- **Beschreibungslisten** – Haben <dt>/<dd> ein <dl> als Elternelement?

## 3. Links & Navigation
- **Leere Anker-Links** – Gibt es <a>-Tags ohne href-Attribut oder Inhalt?
- **Link-Attribute** – Haben Links gültige href-Attribute (keine # oder javascript:void)?
- **Neue Tabs gekennzeichnet** – Öffnen sich Links in neuen Tabs mit Icon/Text für Screenreader?
- **Button-Beschriftungen** – Haben Buttons sichtbare Texte oder aria-label?

## 4. ARIA & Landmarks
- **Landmarks** – Hat die Seite gültige Landmark-Regionen (main, nav, aside, footer)?
- **aria-hidden** – Sind aria-hidden="true" Attribute korrekt gesetzt (nicht auf fokussierbaren Elementen)?

## 5. Formulare (falls vorhanden)
- **Label-Verknüpfung** – Haben Eingabefelder zugeordnete <label> oder aria-labelledby?
- **Pflichtfelder** – Sind required-Felder gekennzeichnet?
- **Fehlermeldungen** – Werden Formularfehler beschrieben und verknüpft?

## Ausgabeformat

### ✅ Bestanden
[Liste der korrekt umgesetzten Punkte]

### ⚠️ Verbesserungsbedarf
| Prüfpunkt | Problem | Lösung |
|-----------|---------|--------|
| [Kategorie] | [Beschreibung] | [Konkreter Fix] |

### 📋 Priorisierte Empfehlungen
1. **Kritisch:** [Muss behoben werden]
2. **Wichtig:** [Sollte behoben werden]
3. **Optional:** [Empfohlene Verbesserungen]`;
      break;
    case 'genderLanguage':
      promptText = `Analysiere den Text auf genderinklusive Sprache. Markiere nicht-inklusive Formulierungen und schlage jeweils 2 bessere Alternativen vor: Alternative 1 mit Binnen-I, Alternative 2 mit Gender-Doppelpunkt (z.B. Spieler:innen). Gendersternchen soll nicht vorgeschlagen werden. Fasse am Ende zusammen, wie gendergerecht der Text insgesamt ist (Prozentzahl).

URL: ${context.url}

Text:
"""
${context.text.substring(0, 5000)}
"""`;
      break;

    case 'vacationPlan':
      promptText = `Erstelle einen detaillierten Urlaubsplan basierend auf diesem Inhalt.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 5000)}
"""

STRUKTUR:

1. Zusammenfassung des Reiseziels
   - Was macht dieses Ziel besonders?
   - Für wen ist es geeignet?

2. Beste Reisezeit
   - Wetter, Temperaturen, Niederschlag
   - Touristensaison vs. Nebensaison
   - Besondere Events/Festivals

3. Tagesplan
   - Tag 1: [Morgens / Mittags / Nachmittags / Abends]
   - Tag 2: [Morgens / Mittags / Nachmittags / Abends]
   - [weitere Tage...]

4. Unterkunftsempfehlungen
   - Viertel/Region
   - Preiskategorien

5. Transport
   - Anreise
   - Vor Ort

6. Packliste
   - Essentials
   - Je nach Saison

7. Geschätztes Budget
   - Unterkunft
   - Essen
   - Aktivitäten
   - Transport

8. Praktische Hinweise
   - Öffnungszeiten
   - Tickets/Vorabbuchung
   - Tipps und Tricks`;
      break;
    case 'contextCollector':
      promptText = `Sammle Kontext von: ${context.url}\n\n${context.text.substring(0, 5000)}`;
      break;
    case 'learningHelp':
      promptText = `Erstelle umfassende Lernmaterialien aus diesem Inhalt.

Inhalt:
"""
${context.text.substring(0, 6000)}
"""

ANFORDERUNGEN:
- Erstelle so viele Lernhilfen wie sinnvoll und notwendig sind (keine feste Anzahl)
- Die Menge richtet sich nach Umfang und Komplexität des Inhalts

MÖGLICHE LERNFORMATE (wähle passende aus):
- Kurzzusammenfassung
- Kernbegriffe mit Definitionen
- Mnemonics und Merksätze
- Karteikarten (Frage/Antwort)
- Wichtige Zusammenhänge (als Tabelle oder Liste)
- Prüfungsrelevante Fragen
- Visualisierungsvorschläge (Diagramme, Mindmaps)
- Lernpfad/Vorgehensweise
- Häufige Fehler und wie man sie vermeidet
- Vergleiche und Gegenüberstellungen

WICHTIG: Passe Umfang und Tiefe an den Inhalt an. Kurze Inhalte = kompaktere Lernhilfen, lange Inhalte = ausführlichere Lernhilfen.`;
      break;
    case 'createDiagram':
      promptText = `Extrahiere alle quantitativen Daten aus dieser Seite und erstelle einen Visualisierungsplan: Welche Daten eignen sich für Balkendiagramm, Tortendiagramm, Liniengrafik oder Tabelle? Erstelle dann ein Mermaid-Diagramm für die wichtigste Datenaussage.

URL: ${context.url}

Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Anforderungen:
1. Identifiziere alle Zahlen, Prozente, Statistiken im Text
2. Entscheide: Welcher Diagrammtyp passt am besten?
3. Erstelle Mermaid-Code für die wichtigste Aussage
4. Gib NUR den Mermaid-Code aus, keine Erklärungen`;
      break;
    case 'tellJoke':
      promptText = `Analysiere diese Website oder den markierten Text und erstelle EINEN einzigen Witz zum Thema.

WICHTIG: Gib als Antwort NUR den Witz aus. Keine Einleitung, keine Erklärung, keine Bewertung, keine Kategorien, kein Format. NUR der reine Witz.

URL: ${context.url}

Kontext:
"""
${context.text.substring(0, 3000)}
"""

ANFORDERUNGEN AN DEN WITZ:
- Der Witz soll zum Thema des Textes/der Website passen
- Länge: 1-3 Sätze (kurz und prägnant)
- Der Witz darf aus JEDER Kategorie stellen, zum Beispiel:
  * Wortwitz / Wortspiel
  * Schmutziger Witz / Sex-Witz
  * Schwarzer Humor
  * Witz über Personen oder Gruppen
  * Absurder Humor ("Deine Mudda", "Klein-Erna", "Chuck Norris")
  * Antiwitz (erwartet Pointe, kommt keine)
  * Verwechslungswitz
  * Sarkasmus / Ironie
  * Frech / Ü18
  * Beliebige andere Kategorie

REGEL: Die Antwort darf AUSSCHLIESSLICH aus dem Witz bestehen. Kein "Hier ist dein Witz:", keine Anführungszeichen drumherum, keine Erkläration. NUR der Witz.`;
      break;
    case 'createStory':
      promptText = `Erstelle Story (${summaryType}) zu: ${context.url}\n\n${context.text.substring(0, 3000)}`;
      break;
    case 'aiDetection':
      promptText = `Analysiere den folgenden Website-Text auf typische Merkmale einer KI-Generierung (ChatGPT, Claude, Gemini, etc.).

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
      promptText = `Du bist ein SEO-Experte. Führe ein umfassendes On-Page- und technisches SEO-Audit für diese Seite durch:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Analysiere folgende Bereiche und gib konkrete Optimierungsvorschläge:
1. **Meta-Tags & Title**: Ist der Titel optimal (Länge, Keyword-Platzierung)? Ist eine Meta-Description vorhanden und ansprechend formuliert?
2. **Überschriften-Struktur**: Ist die H1-H6 Hierarchie logisch aufgebaut? Gibt es mehrere H1?
3. **Content-Tiefe & Keyword-Fokus**: Ist der Inhalt ausreichend detailliert für Suchmaschinen? Welches Haupt-Keyword wird anvisiert und ist die Keyword-Dichte natürlich?
4. **Interne & Externe Verlinkung**: Sind sinnvolle Links und sprechende Ankertexte vorhanden?
5. **Bilder-SEO**: Haben die Bilder (falls im Text beschrieben) sinnvolle Alt-Tags und Dateinamen?
6. **Core Web Vitals & Mobile Friendliness (theoretische Einschätzung)**: Gibt es Anzeichen für Performance-Probleme oder schlechte mobile Lesbarkeit?
7. **SEO Quick Wins**: Nenne die 3 am schnellsten umsetzbaren Maßnahmen mit dem größten Hebel.`;
      break;
    case 'seoKeywords':
      promptText = `Führe eine Keyword-Recherche und -Analyse für die folgende Seite durch:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Liefer folgende Keyword-Listen:
1. **Hauptkeyword (Focus Keyword)**: Das wichtigste Keyword, auf das diese Seite optimiert sein sollte.
2. **Sekundäre Keywords (5-8 Stück)**: Relevante Neben-Keywords, die im Text vorkommen sollten.
3. **Long-Tail Keywords (5-10 Stück)**: Spezifische, mehrteilige Suchphrasen mit geringerem Wettbewerb.
4. **W-Fragen (W-Questions)**: 5 konkrete Fragen, nach denen Nutzer suchen und die diese Seite beantworten sollte.
5. **Suchvolumen & SEO-Difficulty (Schätzung)**: Eine relative Einschätzung (Hoch/Mittel/Niedrig) für jedes Keyword.`;
      break;
    case 'seoContentAnalyzer':
      promptText = `Analysiere den Inhalt dieser Seite als SEO Content Specialist. 

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Prüfe den Text auf folgende Kriterien:
1. **Lesbarkeitsindex (Flesch-Reading-Ease)**: Wie verständlich ist der Text für die Zielgruppe?
2. **Suchintention (Search Intent)**: Welcher Intent wird bedient (Informational, Transactional, Navigational, Commercial)? Passt der Content dazu?
3. **Semantische Dichte (WDF*IDF)**: Welche verwandten Begriffe und LSI-Keywords fehlen, um das Thema holistisch abzudecken?
4. **Strukturelle Lesbarkeit**: Sind Absätze kurz genug? Werden Bullet Points, Tabellen und fettgedruckte Schlüsselwörter sinnvoll eingesetzt?
5. **Call-To-Action (CTA)**: Gibt es eine klare Handlungsaufforderung? Ist sie psychologisch gut platziert?
6. **Konkrete Text-Optimierung**: Schlage 3 konkrete Textänderungen vor, um das Google-Ranking zu verbessern.`;
      break;
    case 'seoStrategy':
      promptText = `Entwirf eine langfristige, strategische SEO-Roadmap (6-12 Monate) für diese Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Struktur der SEO-Strategie:
1. **Wettbewerber-Identifikation**: Welche Arten von Websites sind die direkten organischen Konkurrenten für dieses Thema?
2. **Content-Lücken (Content Gap Analysis)**: Welche Aspekte des Themas fehlen auf der aktuellen Seite noch komplett?
3. **Technische SEO-Prioritäten**: Welche technischen Fundamente müssen gelegt werden (z. B. Schema.org Markup, Ladezeit)?
4. **Backlink- & Outreach-Strategie**: Welche Partner-Websites oder Branchenportale eignen sich für Linkaufbau? Welche Content-Assets könnten als "Linkmagneten" dienen?
5. **Monatlicher Meilenstein-Plan**: Konkrete To-Dos für Monat 1-3 (Quick Wins), Monat 4-6 (Content-Ausbau) und Monat 7-12 (Autoritätsaufbau).`;
      break;
    case 'seoTopicIdeas':
      promptText = `Generiere 15 hochrelevante, SEO-optimierte Content- und Themenideen, die perfekt zum Portfolio dieser Website passen:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Strukturiere die Ideen in folgende Kategorien (je 3-5 Ideen):
1. **Evergreen Content**: Zeitlose Ratgeber und Anleitungen.
2. **Trendthemen / News-Jack**: Aktuelle Themen mit schnellem Traffic-Potenzial.
3. **Vergleichs- & Testberichte**: Entscheidungshelfer für kaufbereite Nutzer.
4. **Interaktiver Content / Tools**: Ideen für Rechner, Checklisten oder Infografiken.

Für jedes Idee angeben:
- Arbeitstitel (Catchy & SEO-freundlich)
- Ziel-Keyword (Fokus)
- Suchintention
- Kurze Inhaltsgliederung (3 Sätze)`;
      break;
    case 'seoWebsiteToArticle':
      promptText = `Schreibe den vorliegenden Werbe- oder Website-Text in einen SEO-optimierten, redaktionellen Fachartikel um:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Vorgaben für den Artikel:
- **Tonalität**: Fachlich fundiert, objektiv, informativ (nicht werblich!).
- **Struktur**:
  - Aufmerksamkeitsstarke Überschrift (H1) mit dem Hauptkeyword.
  - Einleitung (Teaser), die das Problem beschreibt und die Leselust weckt.
  - Hauptteil gegliedert in logische Zwischenüberschriften (H2, H3).
  - Fazit mit zusammenfassendem Schlusssatz.
- **SEO-Optimierung**: Integriere das Hauptthema organisch in den Text. Nutze Listen und Hervorhebungen für eine gute Scanbarkeit.
- **Umfang**: Mindestens 600 Wörter, detailreich und flüssig zu lesen.`;
      break;
    case 'seoKeywordCluster':
      promptText = `Erstelle ein strategisches Keyword-Clustering basierend auf dem Thema dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle eine Struktur aus Pillar- und Cluster-Seiten:
1. **Pillar Page (Hauptthema)**: Welches allumfassende Haupt-Keyword sollte die zentrale Säule sein?
2. **Keyword Cluster (3-5 Cluster)**:
   Unterteile das Thema in logische Sub-Cluster. Für jedes Cluster:
   - **Sub-Thema (Cluster Page)**
   - **Fokus-Keyword**
   - **Supporting Keywords (Long-Tail & W-Fragen)**
   - **Suchintention**
3. **Interne Verlinkungs-Strategie**: Wie sollten die Cluster-Seiten mit der Pillar-Seite verlinkt werden (Ankertexte, Linkfluss).`;
      break;
    case 'seoHeroImages':
      promptText = `Entwickle 5 kreative Konzepte für das Hauptbild (Hero Image) dieser Webseite, um die CTR und das User-Engagement zu steigern.

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle für jedes der 5 Konzepte:
1. **Konzept-Name**: Ein prägnanter Titel.
2. **Visuelle Idee & Psychologische Wirkung**: Was ist zu sehen und welche Emotion soll es beim Besucher auslösen?
3. **Passender Stil**: (z. B. Minimalistischer 3D-Renders, authentische Business-Fotografie, Flat Illustration).
4. **Prompt für KI-Generatoren**: Ein detaillierter, englischer Prompt (für Midjourney, DALL-E 3 oder Stable Diffusion), um dieses Bild zu generieren.
5. **Technische Details**: Empfohlene Farbpalette (passend zum Thema) und Kontrasthinweise für Text-Overlays.`;
      break;
    case 'socialPost':
      promptText = `Generiere gebrauchsfertige Social-Media-Posts zu dieser Website für verschiedene Plattformen:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Erstelle jeweils einen Post optimiert für:
1. **LinkedIn**: Professioneller Ton, Fokus auf Learnings, strukturiert mit Bullet Points, Einladung zur Diskussion, 3 relevante Hashtags.
2. **Twitter/X**: Maximal 280 Zeichen, starker Hook, kurze Kernaussage, Link-Platzhalter, 2 Hashtags.
3. **Instagram (Caption)**: Emotionaler oder inspirierender Einstieg, Emojis, klarer CTA zur Bio, Hashtag-Block.
4. **Facebook**: Längerer, erzählender Text (Storytelling), der Community-Interaktion fördert.`;
      break;
    case 'socialGeneral':
      promptText = `Entwirf eine ganzheitliche Social-Media-Content-Strategie für diese Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Strategie soll folgende Punkte abdecken:
1. **3 Content-Säulen (Content Pillars)**: Welche Hauptthemen sollten dauerhaft bespielt werden?
2. **Zielgruppen-Persona**: Für welchen fiktiven Nutzertyp ist dieser Content auf Social Media am relevantesten?
3. **Content-Mix-Verhältnis**: Verteilung von Information, Unterhaltung, Promotion und Interaktion.
4. **Kanal-Empfehlung**: Auf welchen Plattformen (LinkedIn, TikTok, Insta etc.) lohnt sich der Fokus am meisten und warum?
5. **Redaktionsplan (Vorschlag)**: Ein beispielhafter Wochenplan (Montag bis Sonntag) mit Posting-Ideen.`;
      break;
    case 'socialBio':
      promptText = `Erstelle professionelle und optimierte Biografien (Bios) für verschiedene Social-Media-Kanäle basierend auf dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Erstelle jeweils 2 Varianten (seriös/professionell & kreativ/locker) für folgende Plattformen:
1. **LinkedIn Profil-Slogan & Info-Text**: Fokus auf Value Proposition, Expertise und B2B-Klarheit.
2. **Twitter/X (Max. 160 Zeichen)**: Prägnanter Pitch mit einem relevanten Hashtag.
3. **Instagram (Max. 150 Zeichen)**: Strukturiert mit Zeilenumbrüchen, passenden Emojis und einem Call-To-Action (CTA) zum Link.
4. **TikTok (Max. 80 Zeichen)**: Extrem komprimierter, aufmerksamkeitsstarker Hook.`;
      break;
    case 'socialHashtags':
      promptText = `Entwirf eine maßgeschneiderte Hashtag-Strategie für Social-Media-Posts zu diesem Thema:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Strukturiere die Hashtags in folgende Kategorien:
1. **Breite Nischen-Hashtags (Sehr populär)**: Große Reichweite, hoher Wettbewerb.
2. **Spezifische Themen-Hashtags (Mittlere Größe)**: Hohe Relevanz für die Zielgruppe.
3. **Long-Tail & Trend-Hashtags (Klein)**: Geringer Wettbewerb, hohe Conversion.
4. **Brand-Hashtags (Vorschläge)**: Eigene Hashtags für die Marke/Website.

Erstelle fertige Kopier-Sets für:
- Instagram (ca. 10-15 Hashtags)
- LinkedIn (3-5 Hashtags)
- Twitter/X (1-2 Hashtags)
- TikTok (4-6 Hashtags)`;
      break;
    case 'socialInstagram':
      promptText = `Erstelle 5 kreative Konzepte für Instagram-Posts basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Konzepte sollen verschiedene Formate abdecken:
1. **Karussell-Post (Infografik)**: Gliederung von Folie 1 bis 10 mit Textvorschlägen für die Slides.
2. **Reel-Konzept (Kurzvideo)**: Visuelle Szene, Text auf dem Screen, Audio-Vorschlag und Sprecher-Skript.
3. **Story-Sequenz (3 Stories)**: Interaktive Sticker-Ideen (Umfragen, Quiz, Regler) zur Aktivierung der Follower.
4. **Statischer Post**: Bildbeschreibung und vollständige Bildunterschrift (Caption) mit starkem Hook und CTA.`;
      break;
    case 'socialTwitter':
      promptText = `Erstelle Content für Twitter/X basierend auf dieser Seite:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Liefere:
1. **3 Einzel-Tweets**: Verschiedene Einstiegspunkte (Zahlen/Fakten, Zitat, kontroverse Frage). Jeweils unter 280 Zeichen inklusive Link-Platzhalter.
2. **1 Twitter-Thread (5-8 Tweets)**:
   - Tweet 1: Extrem starker Hook, der zum Klicken auf den Thread anregt.
   - Tweets 2-6: Stückweise Aufbereitung der Kernpunkte der Website (je ein Learning/Fakt pro Tweet).
   - Letzter Tweet: Zusammenfassung, Call-To-Action (Link zur Seite) und Frage an die Leser.`;
      break;
    case 'socialFacebook':
      promptText = `Schreibe einen ansprechenden Facebook-Post basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Anforderungen an den Post:
- **Einleitung (Hook)**: Ein packender erster Satz (z.B. eine Frage oder ein überraschender Fakt), der den Nutzer beim Scrollen stoppt.
- **Hauptteil (Body)**: 3-4 leicht verdauliche, strukturierte Absätze mit den Kernvorteilen oder Kernaussagen. Nutze Emojis, um den Text visuell aufzulockern.
- **Call-to-Action (CTA)**: Eine klare Aufforderung am Ende (z.B. "Besuche die Website für alle Details:", "Teile deine Meinung in den Kommentaren!").
- **Link-Platzhalter**: Füge den Link ${context.url} am Ende ein.
- **Hashtags**: 3-5 relevante Hashtags am Ende des Posts.
- **Tonalität**: Nahbar, freundlich, informativ und community-orientiert.`;
      break;
    case 'socialTikTok':
      promptText = `Entwickle 3 virale TikTok-Videokonzepte basierend auf diesem Inhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Jedes Konzept muss folgende Struktur haben:
1. **Der Hook (Erste 3 Sekunden)**: Visueller und verbaler Hook, der das Weiterscrollen verhindert.
2. **Das Videoskript**: Genaue Beschreibung der Szenen und gesprochener Text (Voiceover).
3. **Trend- & Audio-Empfehlung**: Welcher Musikstil oder Sound-Effekt passt dazu?
4. **Text-Overlay-Ideen**: Kurze Texteinblendungen für das Video.
5. **Caption & Hashtags**: Optimierter Begleittext für den TikTok-Algorithmus.`;
      break;
    case 'socialYouTube':
      promptText = `Entwickle 3 detaillierte YouTube-Video-Konzepte basierend auf diesem Webseiteninhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Jedes Konzept muss enthalten:
1. **Video-Titel**: 3 Varianten (SEO-optimiert, Neugier-erweckend, Kurz & Prägnant).
2. **Thumbnail-Konzept**: Beschreibung des Bildes, Text auf dem Thumbnail, Farbschema.
3. **Hook (Erste 30 Sekunden)**: Wie wird der Zuschauer sofort gefesselt, um die Watchtime zu maximieren?
4. **Grob-Gliederung**: Gliederung der Video-Sektionen (Intro, Hauptteil 1-3, Outro).
5. **Idee für YouTube Shorts**: Ein Ableger-Konzept für ein 60-sekündiges Hochkantvideo.`;
      break;
    case 'socialYouTubeDesc':
      promptText = `Schreibe eine SEO-optimierte YouTube-Videobeschreibung für ein Video über das Thema dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Die Videobeschreibung soll folgende Abschnitte enthalten:
1. **Die ersten 2 Zeilen (wichtig für die Suche)**: Einladender Text mit den Haupt-Keywords, der die Kernaussage des Videos zusammenfasst.
2. **Ausführliche Zusammenfassung**: Detaillierter Text über den Videoinhalt (ca. 100-150 Wörter).
3. **Kapitelmarker (Timestamps - geschätzt)**: Video in Abschnitte strukturieren (z. B. 00:00 Intro, 02:30 Hauptteil...).
4. **Call-To-Actions & Links**: Verweis auf diese Website und Social Channels.
5. **Hashtags & Such-Tags**: 3 relevante Hashtags und eine Liste von 10 passenden Video-Tags (Keywords).`;
      break;
    case 'socialClickbait':
      promptText = `Generiere 10 ethische, aber klickstarke Headline-Ideen (Clickbait) basierend auf diesem Webseiteninhalt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Nutze bewährte psychologische Trigger für die Headlines:
1. **Die Neugier-Lücke (Curiosity Gap)**: Verrate fast alles, aber behalte das wichtigste Detail vor.
2. **Die Zahlen-Formel**: Nutze ungerade Zahlen ("Warum 7 von 10...")
3. **Der überraschende Fakt**: Stelle eine gängige Meinung in Frage.
4. **Die Angst, etwas zu verpassen (FOMO)**: Betone die Dringlichkeit oder Exklusivität.
5. **Der persönliche Benefit**: Direktes Versprechen an den Leser.

Gib für jede Headline an, für welches Social Network (Facebook, LinkedIn, Twitter, Pinterest) sie sich am besten eignet.`;
      break;
    case 'socialProsCons':
      promptText = `Erstelle Vor- und Nachteile-Posts zum Thema dieser Website für LinkedIn, Instagram und das YouTube Community Tab:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 4000)}
"""

Generiere folgende Varianten:

1. **LinkedIn-Variante**:
   - Professionell-sachlicher Ton.
   - Kurze Einleitung zum Thema.
   - Gegenüberstellung mit Emojis (👍 Vorteile / 👎 Nachteile), maximal 3 prägnante Punkte je Seite.
   - Einbindung der Community durch eine offene Abschlussfrage.
   - 3 relevante Hashtags.

2. **Instagram-Variante (Karussell- & Caption-Konzept)**:
   - **Bildbeschreibung für Karussell-Folien**:
     * Folie 1 (Titel): Aufmerksamkeitsstarke Überschrift ("Die nackte Wahrheit über...")
     * Folie 2-3 (Vorteile): Visuelle Beschreibung + je 1-2 Key-Vorteile.
     * Folie 4-5 (Nachteile): Visuelle Beschreibung + je 1-2 Key-Nachteile.
     * Folie 6 (Fazit/CTA): "Schreib deine Meinung in die Kommentare!"
   - **Caption (Bildunterschrift)**: Kurzer Hook, Zusammenfassung der Pro/Contra-Punkte, Emojis, CTA zur Bio, Hashtag-Block.

3. **YouTube Community Tab-Variante**:
   - Kurzer, direkt ansprechender Post für Abonnenten.
   - Fokussierte Pro/Contra-Gegenüberstellung (sehr kompakt).
   - Umfrage-Vorschlag (Poll), die unter dem Post erstellt werden kann (z.B. "Wie steht ihr zu diesem Thema? Option A: ..., Option B: ..., Option C: ...").`;
      break;
    case 'financeMarket':
      promptText = `Analysiere den potenziellen Einfluss dieses Themas auf die Finanzmärkte.

Thema/Website: ${context.url}

Inhalt:
"""
${context.text.substring(0, 3000)}
"""

Marktanalyse:
1. **Betroffene Sektoren** – Welche Branchen sind direkt/indirekt betroffen?
2. **Aktientrends** – Wahrscheinliche Gewinner und Verlierer. Nenne hier konkrete Werte mit ISIN und Bezeichnung
3. **Anlageklassen** – Greife auf die untenstehende Liste an Anlageklassen zurück und ordne das Thema den relevanten Klassen zu
4. **Zeithorizont** – Kurzfristig vs. langfristige Auswirkungen. Nenne den voraussichtlichen Horizont konkret in Zeit (z.B. "3-6 Monate", "1-2 Jahre")
5. **Risiken** – Was könnte schiefgehen?

Liste der Anlageklassen:
Aktien, Anleihen, Geldmarktanlagen, Fonds, börsengehandelte Fonds (ETF, ETC, ETN), Zertifikate, Optionen, Futures, Swaps, strukturierte Produkte, Versicherungsanlageprodukte, Immobilienanlagen, Rohstoffe, Devisen, alternative Anlagen, Beteiligungen, Kredite, Kryptowährungen und Token, Sachwerte und Sammlerstücke.

Detaillierte Unterteilung:
Aktienarten: Stammaktie, Vorzugsaktie, Namensaktie, Inhaberaktie, vinkulierte Namensaktie, Genussaktie, Belegschaftsaktie, Depotaktie, Penny Stock, Blue Chip, Growth-Aktie, Value-Aktie, Dividendenaktie, Zykliker, defensiver Wert, Small Cap, Mid Cap, Large Cap, REIT-Aktie.

Anleihen: Unternehmensanleihe, Staatsanleihe, Bundesanleihe, Länderanleihe, Kommunalanleihe, Pfandbrief, Covered Bond, Nachranganleihe, Hybridanleihe, Wandelanleihe, Pflichtwandelanleihe, Optionsanleihe, Nullkuponanleihe, Hochzinsanleihe, Inflationsindexierte Anleihe, Floating-Rate-Note, Schuldscheindarlehen, Green Bond, Social Bond, Sustainable Bond, High-Yield-Bond, Investment-Grade-Bond.

Fonds: Offener Aktienfonds, offener Rentenfonds, offener Mischfonds, Geldmarktfonds, Dachfonds, Branchenfonds, Themenfonds, Länderfonds, Regionenfonds, Faktor-Fonds, Absolute-Return-Fonds, Long-Only-Fonds, Long-Short-Fonds, Wertsicherungsfonds, nachhaltiger Fonds, Ethikfonds, Impact-Fonds, geschlossener Fonds, geschlossener Immobilienfonds, Infrastrukturfonds, Private-Equity-Fonds, Private-Debt-Fonds, Erneuerbare-Energien-Fonds.

ETF/ETC/ETN: Indexfonds, physisch replizierender ETF, synthetischer ETF, Aktien-ETF, Renten-ETF, Rohstoff-ETF, Immobilien-ETF, Sektor-ETF, Faktor-ETF, Smart-Beta-ETF, ESG-ETF, Themen-ETF, Hebel-ETF, inverse ETF, ETC, Gold-ETC, Silber-ETC, ETN.

Zertifikate: Indexzertifikat, Bonuszertifikat, Discountzertifikat, Expresszertifikat, Garantie-Zertifikat, Airbag-Zertifikat, Outperformance-Zertifikat, Sprint-Zertifikat, Kapitalschutz-Zertifikat, Reverse-Zertifikat, Quanto-Zertifikat, Twin-Win-Zertifikat, Barrier-Zertifikat, Knock-out-Zertifikat, Turbo-Zertifikat.

Derivate: Option, Call-Option, Put-Option, amerikanische Option, europäische Option, Future, Index-Future, Zinsfuture, Rohstoff-Future, Währungs-Future, Swap, Zinsswap, Währungsswap, Equity-Swap, Total-Return-Swap, Credit-Default-Swap.

Rohstoffe: Physisches Gold, Goldbarren, Goldmünze, Silber, Platin, Palladium, Industriemetall, Öl, Agrarrohstoff, Rohstoff-Future, Gold-ETF, Minenaktie.

Immobilien: Wohnimmobilie, Gewerbeimmobilie, Büroimmobilie, Hotelimmobilie, Pflegeimmobilie, REIT, Immobilienfonds, Immobilien-ETF, Immobilien-Crowdinvesting.

Kryptowährungen: Bitcoin, Ethereum, Stablecoin, Altcoin, Layer-1-Token, Layer-2-Token, Governance-Token, Utility-Token, Security-Token, tokenisierte Aktie, tokenisierte Anleihe, Krypto-Derivat, Perpetual-Future.

Alternative Anlagen: Private Equity, Venture Capital, Hedgefonds, Sachwert, Kunst, Oldtimer, Luxusuhren, NFT, Musikrechtebeteiligung, P2P-Kredit, Crowdinvesting.

Hinweis: Dies ist keine Anlageberatung, sondern eine Einschätzung basierend auf öffentlich verfügbaren Informationen.`;
      break;
    case 'financeNews':
      promptText = `Finde aktuelle Finanznachrichten zu diesem Thema.

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
    case 'financeStockAnalysis':
      promptText = `Du bist ein renommierter Finanzanalyst und Chartered Financial Analyst (CFA). Führe eine tiefgehende, professionelle Aktien- und Unternehmensanalyse durch, basierend auf dem Inhalt dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Strukturiere deine Analyse in folgende detaillierte Abschnitte:

1. **Unternehmensprofil & Geschäftsmodell**:
   - Was ist das Kerngeschäft? Welche Produkte/Dienstleistungen generieren den meisten Umsatz?
   - In welchen geographischen Märkten ist das Unternehmen active?
   - Identifikation von Ticker, WKN/ISIN (falls aus dem Kontext ersichtlich).

2. **Fundamentalanalyse & Kennzahlen (soweit im Text vorhanden oder schätzbar)**:
   - Umsatz- und Gewinnentwicklung, Margen (Brutto-, EBITDA-, Netto-Marge).
   - Verschuldungsgrad, Cashflow-Generierung (Free Cashflow) und Dividendenpolitik.
   - Wichtige Wachstumstreiber.

3. **Wettbewerbsanalyse & Marktposition (Moat/Burggraben)**:
   - Wer sind die Hauptkonkurrenten?
   - Besitzt das Unternehmen einen nachhaltigen Wettbewerbsvorteil (z.B. starke Marke, hohe Wechselkosten, Netzwerkeffekte, Kostenvorteile)?
   - Porter's Five Forces (Branchenstrukturanalyse im Schnelldurchlauf).

4. **Chancen (Bull-Case) & Risiken (Bear-Case)**:
   - **Chancen**: Neue Märkte, technologische Trends, Synergien, Übernahmen.
   - **Risiken**: Regulatorische Hürden, makroökonomische Risiken (Zinsen, Inflation), Reputationsrisiken, technologische Disruption.

5. **Zukunftsausblick & Bewertung**:
   - Wo steht das Unternehmen in 3–5 Jahren?
   - Relative Bewertung (z.B. KGV, KBV, EV/EBITDA im Branchenvergleich - falls Schätzungen möglich).

6. **Analysten-Fazit & Investment-Thesis**:
   - Klares Urteil: **Kauf (Buy) / Halten (Hold) / Verkauf (Sell)**.
   - Ausführliche Begründung deines Urteils mit Kernargumenten.
   - Risikohinweis (Disclaimer).`;
      break;
    case 'financeInvestment':
      promptText = `Erstelle ein umfassendes und flexibles Berechnungsmodell für ein Investitionsvorhaben basierend auf den Daten dieser Website:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Liefere das Modell in drei verschiedenen interaktiven Formaten (wähle die passendsten aus):

1. **Tabellenkalkulation (Excel/Google Sheets)**:
   - Strukturierung von Eingabeparametern (Anschaffungskosten, jährliche Einnahmen/Ausgaben, Nutzungsdauer, Diskontsatz).
   - Formel-Vorschläge (z. B. \`=IKV()\`, \`=KAPITALWERT()\`, \`=AMORTISATION\`).

2. **Python-Skript (für Datenanalysten)**:
   - Ein sauberes, ausführbares Python-Skript (unter Verwendung von Standardbibliotheken oder \`numpy\`/\`pandas\`), das die Cashflows berechnet, den Kapitalwert (NPV), die interne Rendite (IRR) und die Amortisationszeit ermittelt und die Ergebnisse in der Konsole formatiert ausgibt.

3. **Interaktives HTML/JavaScript-Widget**:
   - Ein vollständiger, kopierbarer HTML/CSS/JS-Codeblock, der als lokales Mini-Tool oder Widget im Browser geöffnet werden kann. Dieses Widget soll Schieberegler (Slider) oder Eingabefelder für die wichtigsten Investitionsparameter enthalten und die Rentabilitätskennzahlen live im Browser berechnen.

4. **Szenarioanalyse (Best/Real/Worst Case)**:
   - Eine mathematische Übersicht der Auswirkungen von Zinsänderungen oder Abweichungen im Cashflow auf die Rentabilität.`;
      break;
    case 'financePortfolio':
      promptText = `Analysiere, wie sich das Thema oder die Anlageklasse dieser Website in ein bestehendes Anlageportfolio integrieren lässt:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Führe eine Portfolio-Bewertung durch:
1. **Asset-Allokation**: Zu welcher Anlageklasse gehört dieses Thema? (Nutze die offizielle Klassifizierung: Aktien, Immobilien, Rohstoffe, Krypto etc.)
2. **Korrelation**: Wie korreliert diese Anlageklasse typischerweise mit dem breiten Aktienmarkt (Gering, Mittel, Hoch)? Bietet sie Diversifikationsvorteile?
3. **Risiko-Rendite-Profil**: Wie hoch ist das geschätzte Risiko (Volatilität) im Vergleich zur erwarteten Rendite?
4. **Gewichtungsempfehlung**: Welcher Prozentsatz eines Gesamtportfolios (z. B. konservativ, ausgewogen, offensiv) sollte maximal in diese Anlageklasse investiert werden?
5. **Eignung**: Für welchen Anlegertyp (langfristig, kurzfristig, risikoavers, risikofreudig) ist dieses Investment geeignet?`;
      break;
    case 'financeMakeMoney':
      promptText = `Du bist ein erfahrener, kreativer Finanzstratege, Monetarisierungs-Experte und Startup-Mentor. Analysiere den Inhalt dieser Website bzw. dieses Thema tiefgehend und entwickle konkrete, realistische und hochgradig innovative Ansätze, wie man daraus finanziellen Nutzen ziehen (Geld verdienen oder Kosten/Steuern sparen) kann:

URL: ${context.url}
Inhalt:
"""
${context.text.substring(0, 5000)}
"""

Strukturiere deine Analyse übersichtlich in folgende Abschnitte:

1. 💡 **Sofortige Spar- & Steuerspartipps (Geld behalten)**:
   - **Konkrete Einsparpotenziale**: Wo und wie lässt sich bei diesem Thema sofort bares Geld sparen oder Kosten optimieren?
   - **Steuerliche Hebel & Absetzbarkeit**: Welche Möglichkeiten zur steuerlichen Geltendmachung (Betriebsausgaben, Werbungskosten, Sonderausgaben, Abschreibungen, Förderungen/Subventionen) gibt es?

2. 🚀 **Geschäftsideen & Micro-Startups (Eigenes Business)**:
   - Entwickle **2-3 konkrete Business- und Gründungsideen**, die auf den Erkenntnissen, Problemen oder Trends dieser Website aufbauen.
   - **Voraussetzungen**: Was wird jeweils benötigt? (Startkapital-Schätzung, Kern-Skills, Tools/Technologien/Lizenzen).
   - **Risiko & Time-to-Money**: Risikobewertung (Gering/Mittel/Hoch) mit Begründung sowie realistischer Zeithorizont bis zu den ersten Einnahmen.

3. 💼 **Freelancer-, Service- & Beratungs-Opportunitäten**:
   - Welche konkreten Dienstleistungen, Consulting-Angebote oder Agentur-Services lassen sich daraus ableiten?
   - **Zielgruppe & Nachfrage**: Wer sind die zahlungsbereiten Kunden (B2B vs. B2C)?
   - **Preismodell**: Realistische Stundensätze oder Pauschal-Preispakete.

4. 🌐 **Digitale Produkte & Skalierbarer Content**:
   - Welche skalierbaren Produkte (z. B. Templates, E-Books/Guides, Checklisten, Mini-Kurse, spezialisierter Newsletter, Affiliate-Websites/Vergleichsportale) bieten sich an?
   - Wie lässt sich das Geschäftsmodell automatisieren?

5. ⚡ **Arbitrage & Marktlücken (Schnelle Hebel)**:
   - Gibt es Arbitrage-Potenziale (z. B. Informationsvorsprung nutzen, Preisdifferenzen zwischen Plattformen/Märkten, Vermittlungsprovisionen)?

6. 🎯 **Die "Low-Hanging-Fruit"-Empfehlung (Action Plan)**:
   - Was ist die einfachste, risikoärmste und schnellste Maßnahme, um innerhalb von 48–72 Stunden den ersten Euro zu verdienen oder einzusparen?`;
      break;
    case 'recipeSimpleBake':
      promptText = `Wandle das Rezept in das "Einfach Backen" Format um.

WICHTIG: Der Originaltext wird 1:1 zu 100% genau beibehalten. Es erfolgt KEINE Textänderung, KEINE Übersetzung, KEINE Umformulierung. Der Text wird exakt so beibehalten wie im Original.

URL: ${context.url}

Originaltext:
"""
${context.text.substring(0, 5000)}
"""

FORMAT "EINFACH BACKEN":

Die jeweils im jeweiligen Schritt gebrauchten Zutaten werden IN DER IM SCHRITT BENÖTIGTEN MENGE ÜBER DEM SCHRITT aufgelistet.

Beispiel:
Wird ein Kuchen mit 4 Eiern, 100g Mehl und 50g Zucker gebacken und zunächst Mehl und Zucker vermischt, so lautet es:

**Schritt 1**
100g Mehl, 50g Zucker

Mehl und Zucker vermischen

**Schritt 2**
2 Eier

Der Mehl-Zucker-Mischung zugeben

**Schritt 3**
[weitere Zutaten]

[weitere Anweisung]

REGELN:
- Der Originaltext wird 1:1 beibehalten
- Nur die Zutaten-Mengen werden über jeden Schritt geschrieben
- Die Abtrennung der Schritte und der Zutaten erfolgt mit passenden Formatierungen (Fettdruck, Leerzeilen)
- Keine zusätzlichen Erklärungen, keine Tipps, keine Variationen`;
      break;
    case 'recipeIngredients':
      promptText = `Extrahiere alle Zutaten aus diesem Rezept als Einkaufsliste.

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
      promptText = `Ich habe folgende Zutat nicht: "${missingIngredient}".

Rezept von: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

Womit kann ich "${missingIngredient}" ersetzen? Gib 2-3 Alternativen an mit Mengenumrechnung.`;
      break;
    }
    case 'recipeOnePot':
      promptText = `Wandle dieses Rezept in ein One-Pot-Gericht um. Das bedeutet: Alles wird in einem einzigen Topf zubereitet.

URL: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

ANFORDERUNGEN:
- Alle Zutaten werden in einem Topf gekocht/gebraten
- Passe die Reihenfolge an (härtere Zutaten zuerst)
- Passe Flüssigkeitsmenge an (nicht zu viel, nicht zu wenig)
- Garzeiten anpassen
- Tipps zur Topfwahl geben`;
      break;
    case 'recipeDevice': {
      const selectedDevice = summaryType;
      if (!selectedDevice || selectedDevice === 'normal') {
        showToast('Kein Gerät ausgewählt');
        return;
      }
      
      promptText = `Wandle dieses Rezept für ein(e/n) ${selectedDevice} um.

URL: ${context.url}

Originalrezept:
"""
${context.text.substring(0, 4000)}
"""

Wichtig:
- Zunächst soll immer probiert werden, das gesamte Gericht an das Küchengerät (${selectedDevice}) anzupassen.
- Falls das Rezept oder Teile davon unpassend für das Gerät sind (z.B. Suppe in einer Zuckerwattemaschine), dann wandle nicht das gesamte Gericht um! Ergänze oder tausche in diesem Fall nur Komponenten aus, die sinnvoll mit dem Gerät zubereitet werden können.
- Im Zweifel gib bitte beide Alternativen (komplette Anpassung und nur Komponenten-Anpassung) aus.
- Behalte den Geschmack so originalgetreu wie möglich bei.
- Passe Temperatur und Zeit an das Gerät an.
- Berücksichtige die Besonderheiten des ${selectedDevice}.
- Gib Tipps zur optimalen Zubereitung mit diesem Gerät.`;
      break;
    }
    case 'recipePlating':
      promptText = `Erstelle einen KI-Bildgenerierungs-Prompt, der zeigt, wie dieses Gericht auf Michelin-Sterne Niveau angerichtet werden könnte.

Rezept von: ${context.url}

Gericht:
"""
${context.text.substring(0, 4000)}
"""

WICHTIG: Gib als Antwort AUSSCHLIESSLICH den Bildgenerierungs-Prompt aus. Keine Beschreibung, kein Text, keine Erklärung, kein Fazit. NUR der Prompt für die Bildgenerierung.

Der Prompt soll in Englisch sein und folgende Elemente enthalten:
- Professional food photography
- Michelin star plating
- Das konkrete Gericht
- Elegante Präsentation
- Künstlerische Details
- Dramatische Beleuchtung
- Photorealistisch, 8k`;
      break;
    case 'recipeNutrition':
      promptText = `Analysiere die Nährwerte dieses Rezepts pro Portion.

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
    case 'recipeCheck':
      promptText = `Prüfe das folgende Rezept auf Fehler, Unstimmigkeiten und Optimierungspotenzial.

URL: ${context.url}

Rezept:
"""
${context.text.substring(0, 5000)}
"""

WICHTIG: Die folgenden Prüfungen sollen im Chat optisch klar strukturiert und abgehoben dargestellt werden (z.B. durch Trennlinien, Fettdruck oder Rahmen).

========================================

PRÜFUNG 1: ZEITANGABE
Ist die angegebene Gesamtzeit realistisch?
- Prüfe jeden Zubereitungsschritt und dessen Zeitbedarf
- Berücksichtige alle impliziten Vorbereitungszeiten aus der Zutatenliste (z.B. "4 large cloves garlic, minced", "500g Zwiebeln gewürfelt", "geriebener Käse", "gehackte Kräuter" – das Schälen, Hacken, Schneiden oder Reiben erfordert reale Arbeitszeit, die zwingend in die Vorbereitungszeit eingerechnet werden muss!)
- Berücksichtige Garzeiten, Aufheizzeiten
- NICHT berücksichtigen: Ruhezeiten / Wartezeiten

Format:
- Vorbereitungszeit: [XX Min] (inkl. aller impliziten Schneide-/Hack-/Schälarbeiten aus der Zutatenliste)
- Garzeit: [XX Min]
- Mischen/Zusammenfügen: [XX Min]
- Tatsächlich benötigte Zeit: [XX Min]

========================================

PRÜFUNG 2: SKALIERBARKEIT
Kann das Rezept sinnvoll vervielfacht werden?
(Hinweis zur Notation: Verwende ✓ für Ja/Erfüllt/Kein Problem [insbesondere: "Garzeit identisch" = ✓, wenn die Garzeit gleich bleibt und das Rezept somit skalierbar ist], und ✗ für Nein/Problem/Garzeit ändert sich).

2x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

3x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

4x Menge:
- [✓/✗] Topf/Pfanne groß genug
- [✓/✗] Backform geeignet
- [✓/✗] Garzeit identisch (✓ = bleibt identisch / skalierbar, ✗ = Garzeit weicht ab)
- [✓/✗] Sonstige Probleme: [...]

========================================

PRÜFUNG 3: LOGISCHE FEHLER
- Zutaten in der Liste, die im Rezept nicht verwendet werden: [auflisten oder "keine"]
- Zutaten im Rezept, die nicht in der Liste stehen: [auflisten oder "keine"]
- Fehlende Vorbereitungsschritte / implizite Schritte: Prüfe, ob in der Zutatenliste bereits vorverarbeitete Zutaten stehen (z.B. "4 large cloves garlic, minced", "gehackte Petersilie", "Zwiebeln gewürfelt"), deren Vorbereitungsschritt (Schälen, Hacken, Schneiden) in der Rezeptanleitung komplett fehlt und somit die reale Kochzeit unbemerkt erweitert: [auflisten oder "keine"]
- Widersprüchliche Anweisungen: [auflisten oder "keine"]
- Unmögliche/unlogische Schritte: [auflisten oder "keine"]

========================================

PRÜFUNG 4: FEHLER & EMPFEHLUNGEN
WICHTIG: Liste HIER NUR tatsächliche Fehler, unausgewogene Mengen oder konkrete Empfehlungen/Verbesserungen auf! Dinge, Zutaten oder Parameter, die in Ordnung (OK) sind, dürfen HIER NICHT aufgeführt werden.
Falls alles perfekt ist und keinerlei Fehler oder Empfehlungen vorliegen: Schreibe "Keine Fehler oder Korrekturbedarfe gefunden."

Format für gefundene Fehler & Empfehlungen:
- [Betroffene Zutat / Garzeit / Temperatur / Technik]: [Problem / Zu viel / Zu wenig / Bessere Alternative] – [Begründung und konkreter Korrekturvorschlag]

========================================

PRÜFUNG 5: NÄHRWERTE (gesamte Menge)
Kalorien: ... kcal
Protein: ...g
Kohlenhydrate: ...g
Fett: ...g
Ballaststoffe: ...g

========================================

PRÜFUNG 6: SAISONALITÄT
NUR ausgeben, wenn aktuell NICHT saisonale Zutaten verwendet werden.
Falls alle Zutaten saisonal sind: Diesen Abschnitt komplett entfallen lassen.

Falls nicht saisonal:
- Nicht saisonale Zutaten: [auflisten]
- Alternative saisonale Zutaten: [Vorschläge]

========================================

PRÜFUNG 7: GESCHIRRSPÜL-AUFWAND
NICHT mitzählen (gehen in Spülmaschine): Kleine Schüsseln, Reiben, Teigschaber, Messlöffel, Kochlöffel, Schneebesen, Tassen, Zangen

- Benötigte Töpfe/Pfannen: [Anzahl]
- Benötigte Formen/Bleche: [Anzahl]
- Benötigte Schüsseln: [Anzahl]
- Sonstiges Geschirr (nicht spülmaschinenfähig): [auflisten]
- Bewertung: [Gering / Mittel / Hoch]

========================================

FAZIT
[Maximal 3 Sätze mit den wichtigsten Erkenntnissen]`;
      break;
    default:
      const labelObj = ACTION_LIST.find(a => a.key === action);
      const labelText = labelObj ? labelObj.label : action;
      promptText = `Aktion '${labelText}' auf: ${context.url}`;
  }

  if (promptText) {
    if (clipboardOnly) {
      navigator.clipboard.writeText(promptText).then(() => showToast('Prompt kopiert!'));
      return;
    }
    chrome.storage.sync.get(['toneMimic'], (result) => {
      const toneMimic = result.toneMimic || '';
      const fullPrompt = toneMimic.trim() ? `${promptText}\n\nTon: ${toneMimic.trim()}` : promptText;
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
    chrome.runtime.sendMessage({ 
      action: 'captureScreenshot'
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error('Screenshot-API nicht verfügbar'));
        return;
      }
      if (response && response.success) {
        cropScreenshot(response.dataUrl, { left, top, width, height })
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(response?.error || 'Unbekannter Fehler'));
      }
    });
    
    // Timeout falls keine Antwort kommt
    setTimeout(() => reject(new Error('Timeout beim Screenshot')), 5000);
  });
}

async function cropScreenshot(dataUrl, area) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = area.width;
      canvas.height = area.height;
      
      // Skalierungsfaktor berechnen (für High-DPI Displays)
      const scaleX = img.width / window.innerWidth;
      const scaleY = img.height / window.innerHeight;
      
      ctx.drawImage(
        img,
        area.left * scaleX,
        area.top * scaleY,
        area.width * scaleX,
        area.height * scaleY,
        0,
        0,
        area.width,
        area.height
      );
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
    img.src = dataUrl;
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

/* ============================================
   CLIPPY ASSISTENT FEATURE
   ============================================ */

let clippyShownInSession = false;

function initClippyDwellTimer() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) return;

  chrome.storage.sync.get(['enableClippy', 'clippyDwellTime', 'clippyChance', 'geminiApiKey', 'geminiAuthToken', 'geminiApiModel', 'clippyMode'], (result) => {
    const isEnabled = result.enableClippy !== false;
    if (!isEnabled || clippyShownInSession) return;

    const dwellSeconds = result.clippyDwellTime || 60;
    const chance = result.clippyChance !== undefined ? result.clippyChance : 0.2;
    const clippyMode = result.clippyMode || 'animation';

    setTimeout(() => {
      if (clippyShownInSession) return;
      if (Math.random() <= chance) {
        triggerClippyAssistant(result.geminiApiKey, result.geminiApiModel || 'gemini-3.5-flash', result.geminiAuthToken, clippyMode);
      }
    }, dwellSeconds * 1000);
  });
}

// Pre-defined fallback mappings if API key is not set or network fails
const CLIPPY_FALLBACK_RULES = [
  { keywords: ['mail.google.com', 'outlook', 'webmail', 'inbox', 'postfach', 'e-mail', 'email', 'gmail'], action: 'writeReply', speech: 'Eine E-Mail im Blick! Soll ich dir direkt einen passenden Antwort-Entwurf schreiben?' },
  { keywords: ['amazon', 'ebay', 'otto', 'zalando', 'shop', 'kaufen', 'warenkorb', 'preis', 'produkt', 'angebot', 'etsy'], action: 'doINeedThis', speech: 'Impulskauf-Gefahr! Soll ich prüfen, ob du dieses Produkt wirklich brauchst oder wo die Haken sind?' },
  { keywords: ['youtube.com', 'vimeo', 'twitch', 'video', 'stream', 'yt'], action: 'socialYouTube', speech: 'Ein Video auf dem Schirm! Soll ich dir kreative Video-Konzepte oder eine passende Beschreibung generieren?' },
  { keywords: ['booking.com', 'airbnb', 'tripadvisor', 'expedia', 'holidaycheck', 'trivago', 'reisen', 'flug', 'hotel', 'urlaub'], action: 'vacationPlan', speech: 'Reiselust? Soll ich eine detaillierte Urlaubsplanung mit Sehenswürdigkeiten und Packliste für dich erstellen?' },
  { keywords: ['stepstone', 'indeed', 'xing', 'jobs', 'karriere', 'bewerbung', 'jobsuche'], action: 'socialBio', speech: 'Bewerbung oder Profil-Optimierung? Soll ich dir eine überzeugende Bio oder Formulierungshilfen erstellen?' },
  { keywords: ['witze', 'fun', 'joke', 'lustig', 'humor', 'lachschon', 'gag', 'meme'], action: 'tellJoke', speech: 'Lust auf ein Schmunzeln? Soll ich dir einen retro, thematisch passenden Witz erzählen?' },
  { keywords: ['deepl.com', 'translate.google', 'dict.cc', 'leo.org', 'wörterbuch', 'dictionary'], action: 'translate', speech: 'Sprachbarriere? Lass mich diese Seite oder fremdsprachige Abschnitte für dich übersetzen!' },
  { keywords: ['faq', 'definition', 'lexikon', 'glossar', 'wiki', 'erklärung'], action: 'createFAQ', speech: 'Erklärungsbedarf? Soll ich dir ein praktisches FAQ mit Antworten auf die wichtigsten Fragen erstellen?' },
  { keywords: ['docs.google', 'duden.de', 'schreiben', 'editor', 'docx', 'overleaf', 'latex'], action: 'grammarCheck', speech: 'Textarbeit im Gange! Soll ich die Rechtschreibung, Grammatik und den Stil deiner Sätze prüfen?' },
  { keywords: ['rezept', 'kochen', 'backen', 'zutaten', 'chefkoch', 'lecker', 'eatsmarter', 'kitchenstories'], action: 'recipeCheck', speech: 'Sieht lecker aus! Soll ich die Garzeiten, Mengen und logische Fehler im Rezept prüfen?' },
  { keywords: ['arxiv', 'researchgate', 'paper', 'studie', 'dissertation', 'wissenschaft', 'journal', 'doi.org', 'scholar'], action: 'plagiarism', speech: 'Ein wissenschaftlicher Text! Soll ich den Inhalt auf Plagiatsmuster und Quellen untersuchen?' },
  { keywords: ['wikipedia', 'lernen', 'studium', 'vorlesung', 'skript', 'klausur', 'kurs', 'quiz'], action: 'createQuiz', speech: 'Prüfungsstoff entdeckt! Soll ich dir ein 10-Fragen-Quiz zum Lernen erstellen?' },
  { keywords: ['news', 'zeitung', 'spiegel', 'focus', 'zeit.de', 'tagesschau', 'bild.de', 'nzz', 'politik', 'artikel'], action: 'factCheck', speech: 'Steile Thesen im Artikel! Soll ich die Aussagen auf Fakten und Logik prüfen?' },
  { keywords: ['gesetz', 'paragraph', 'urteil', 'klage', 'anwalt', 'agb', 'datenschutz', 'recht', 'juristisch'], action: 'legalCheck', speech: 'Rechtlich brenzlig? Lass mich die Rechtslage und Gesetzestexte dazu beleuchten!' },
  { keywords: ['statistik', 'zahlen', 'tabelle', 'diagramm', 'prozent', 'daten', 'report', 'auswertung'], action: 'createDiagram', speech: 'Jede Menge Daten und Fakten! Soll ich daraus ein übersichtliches Mermaid.js-Diagramm bauen?' },
  { keywords: ['finanz', 'aktie', 'börse', 'kurs', 'depot', 'etf', 'finanzen.net', 'tradingview', 'wallstreetbets'], action: 'financeStockAnalysis', speech: 'Börsen- und Finanzdaten entdeckt! Willst du eine Kennzahlen- und Risikoanalyse dazu?' },
  { keywords: ['wordpress', 'blog', 'medium.com', 'substack', 'article', 'post'], action: 'aiDetection', speech: 'Dieser Artikel wirkt verdächtig glatt! Soll ich prüfen, ob er von einer KI geschrieben wurde?' },
  { keywords: ['linkedin', 'twitter', 'x.com', 'reddit', 'instagram', 'facebook'], action: 'socialPost', speech: 'Social Media gesichtet! Soll ich dir passende Kommentar-Hooks oder Post-Ideen dazu generieren?' },
  { keywords: ['seo', 'meta', 'backlink', 'traffic', 'serp', 'google search'], action: 'seoAudit', speech: 'Blogpost im Blick! Soll ich einen SEO-Audit für Keywords, H-Tags und Lesbarkeit machen?' },
  { keywords: ['github', 'stackoverflow', 'gitlab', 'code', 'function', 'class', 'const', 'script', 'developer'], action: 'codeReview', speech: 'Code auf dem Schirm! Soll ich ein Code Review auf Bugs und Refactoring durchführen?' },
  { keywords: ['recherche', 'analyse', 'hintergrund', 'komplex', 'dossier'], action: 'deepResearch', speech: 'Komplexes Thema! Wollen wir einen Deep-Research-Durchlauf mit Hintergrundanalyse starten?' }
];

async function triggerClippyAssistant(apiKey, apiModel, authToken, clippyMode) {
  clippyShownInSession = true;

  let chosenAction = 'summaryNormal';
  let speechText = 'Hey! Ich sehe, du schaust dir diese Seite an. Soll ich sie kurz für dich zusammenfassen?';

  if (apiKey || authToken) {
    try {
      const pageTitle = document.title || '';
      const pageUrl = window.location.href;
      const textContent = (document.body ? document.body.innerText : '').replace(/\s+/g, ' ').trim().substring(0, 500);

      const candidateActions = [
        { key: 'aiDetection', desc: 'AI-Erkennung (Prüfen, ob der Text auf Blogs/Social Media von einer KI stammt)' },
        { key: 'doINeedThis', desc: 'Kaufberatung / Impulskauf-Check (Brauche ich dieses Produkt auf Amazon/eBay wirklich?)' },
        { key: 'priceCompare', desc: 'Preisvergleich & Alternativen für Produkte' },
        { key: 'productProsCons', desc: 'Vor- und Nachteile eines Produkts oder Themas' },
        { key: 'writeReply', desc: 'Antwort schreiben (E-Mail Antwort auf Gmail/Outlook oder Kommentar)' },
        { key: 'plagiarism', desc: 'Plagiats- & Quellen-Check bei wissenschaftlichen Texten & Studien' },
        { key: 'createQuiz', desc: '10-Fragen-Lern-Quiz aus Lernportalen oder Fachtexten erstellen' },
        { key: 'factCheck', desc: 'Faktencheck der Aussagen bei News, Zeitungsartikeln & Politik' },
        { key: 'legalCheck', desc: 'Wie ist die Rechtslage? Rechtliche Einordnung & Gesetzestexte' },
        { key: 'createDiagram', desc: 'Mermaid.js Diagramm & Prozessablauf aus Zahlen, Daten & Fakten generieren' },
        { key: 'deepResearch', desc: 'Deep Research: Ausführliche Hintergrund-Recherche & Analyse' },
        { key: 'recipeCheck', desc: 'Rezept-TÜV: Garzeiten, Mengenskalierung & logische Fehler in Rezepten prüfen' },
        { key: 'recipeDevice', desc: 'Rezept für Küchengeräte (Airfryer, Thermomix, etc.) anpassen' },
        { key: 'translate', desc: 'Smart Translation (Übersetzen von englischen/fremdsprachigen Texten)' },
        { key: 'seoAudit', desc: 'SEO-Audit: Keywords, H-Überschriften & Lesbarkeit von Blogs optimieren' },
        { key: 'socialPost', desc: 'Social Media Post / Hook aus dem Seiteninhalt generieren' },
        { key: 'socialComment', desc: 'Schlagfertigen Kommentar für Social Media schreiben' },
        { key: 'financeStockAnalysis', desc: 'Aktien- & Finanzanalyse (Börsen-News, Kennzahlen, Reddit-Aktien)' },
        { key: 'financeMakeMoney', desc: 'Monetarisierungs-Check (Wie kann ich mit dieser Seite/Thema Geld verdienen oder sparen?)' },
        { key: 'codeReview', desc: 'Code Review & Quelltextanalyse für Entwicklerseiten' },
        { key: 'vacationPlan', desc: 'Urlaubs- & Reiseplanung für Reise-Websites' },
        { key: 'pageSherlock', desc: 'Detaillierte Sherlock-Analyse der Website' },
        { key: 'tellJoke', desc: 'Passenden Retro-Witz zur Seite erzählen' },
        { key: 'summaryNormal', desc: 'Kurze Zusammenfassung der Webseite' },
        { key: 'summarySuperShort', desc: 'Super kurze TL;DR Zusammenfassung' }
      ];

      const prompt = `Du bist Clippy, der sympathische retro Büroklammer-Assistent aus der Browser-Erweiterung CompAInion.
Du siehst, dass der Nutzer seit einer Minute auf folgender Website verweilt:
- Titel: "${pageTitle}"
- URL: "${pageUrl}"
- Vorschau: "${textContent}"

WICHTIGSTE REGEL FÜR DIE AKTIONS-AUSWAHL:
VERMEIDE langweilige Standard-Zusammenfassungen ('summaryNormal' oder 'summarySuperShort'), WENN eine spezifischere Kontext-Aktion zur Website passt!
- E-Mail/Gmail -> writeReply
- Shopping/Amazon/eBay -> doINeedThis, priceCompare oder productProsCons
- Blog/Artikel -> aiDetection oder seoAudit
- Social Media -> socialPost, socialComment oder aiDetection
- News/Politik -> factCheck oder legalCheck
- Uni/Studium/Paper -> plagiarism oder createQuiz
- Daten/Zahlen/Statistik -> createDiagram
- Rezepte/Kochen -> recipeCheck oder recipeDevice
- Fremdsprachig/Englisch -> translate
- Finanzen/Aktien/Börse -> financeStockAnalysis
- GitHub/Code -> codeReview
Wähle 'summaryNormal' NUR DANN, wenn absolut keine der Spezial-Aktionen sinnvoll zur Seite passt.

Erstelle dazu EINEN einzigen, kurzen (max. 1-2 Sätze), sympathischen, leicht frechen/witzigen Vorschlagssatz im typischen Clippy-Retro-Ton auf Deutsch in der Du-Form für Clippy's Sprechblase.

Verfügbare Aktionen:
${candidateActions.map(a => `- ${a.key}: ${a.desc}`).join('\n')}

WICHTIG: Antworte AUSSCHLIESSLICH im folgenden JSON-Format ohne Markdown-Codeblock:
{
  "action": "<action_key>",
  "speech": "<Dein Clippy-Spruch auf Deutsch>"
}`;

      const endpointUrl = apiKey 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent`;

      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        headers['x-api-key'] = authToken;
      }

      const resp = await fetch(endpointUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 150
          }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(rawText.replace(/```json\s*/, '').replace(/```\s*$/, ''));
        if (parsed.action && parsed.speech) {
          chosenAction = parsed.action;
          speechText = parsed.speech;
        }
      }
    } catch (e) {
      console.log('Clippy API suggestion failed, using fallback:', e);
      const pageStr = (document.title + ' ' + window.location.href).toLowerCase();
      for (const rule of CLIPPY_FALLBACK_RULES) {
        if (rule.keywords.some(kw => pageStr.includes(kw))) {
          chosenAction = rule.action;
          speechText = rule.speech;
          break;
        }
      }
    }
  } else {
    const pageStr = (document.title + ' ' + window.location.href).toLowerCase();
    for (const rule of CLIPPY_FALLBACK_RULES) {
      if (rule.keywords.some(kw => pageStr.includes(kw))) {
        chosenAction = rule.action;
        speechText = rule.speech;
        break;
      }
    }
  }

  showClippyWidget(chosenAction, speechText, clippyMode);
}

function showClippyWidget(actionKey, speechText, clippyMode) {
  const old = document.getElementById('clippy-container');
  if (old) old.remove();

  const container = document.createElement('div');
  container.id = 'clippy-container';
  container.className = 'theme-' + currentTheme;

  const placeholderUrl = chrome.runtime.getURL('clippy_placeholder.svg');
  const customImgUrl = chrome.runtime.getURL('clippy.png');

  let avatarHTML = '';
  if (clippyMode === 'animation') {
    avatarHTML = `
      <svg id="clippy-svg" class="pose-float" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="65" height="78">
        <defs>
          <filter id="clippy-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="clippy-silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="25%" stop-color="#E0E6ED"/>
            <stop offset="50%" stop-color="#9BA8B7"/>
            <stop offset="75%" stop-color="#D1D9E0"/>
            <stop offset="100%" stop-color="#7B8B9A"/>
          </linearGradient>
          <linearGradient id="clippy-eye-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="100%" stop-color="#CCCCCC"/>
          </linearGradient>
        </defs>
        <g filter="url(#clippy-drop-shadow)" class="clippy-body-group">
          <path class="clippy-wire" d="M 35,95 L 35,35 A 18,18 0 0,1 71,35 L 71,85 A 24,24 0 0,1 23,85 L 23,25 A 14,14 0 0,1 51,25 L 51,75" fill="none" stroke="url(#clippy-silver-grad)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="clippy-wire-outline" d="M 35,95 L 35,35 A 18,18 0 0,1 71,35 L 71,85 A 24,24 0 0,1 23,85 L 23,25 A 14,14 0 0,1 51,25 L 51,75" fill="none" stroke="#4A5568" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          
          <g class="clippy-eye-pos left-eye-pos" transform="translate(32, 42)">
            <g class="clippy-eye-anim left-eye-anim">
              <ellipse class="clippy-eye-white" cx="0" cy="0" rx="9" ry="11" fill="url(#clippy-eye-shine)" stroke="#2B3648" stroke-width="1.5"/>
              <g class="clippy-pupil-group left-pupil-group">
                <ellipse class="clippy-eye-pupil" cx="1" cy="2" rx="4.5" ry="5.5" fill="#1A202C"/>
                <circle class="clippy-eye-glint" cx="-1.5" cy="-2.5" r="2" fill="#FFFFFF"/>
              </g>
            </g>
          </g>

          <g class="clippy-eye-pos right-eye-pos" transform="translate(52, 42)">
            <g class="clippy-eye-anim right-eye-anim">
              <ellipse class="clippy-eye-white" cx="0" cy="0" rx="9" ry="11" fill="url(#clippy-eye-shine)" stroke="#2B3648" stroke-width="1.5"/>
              <g class="clippy-pupil-group right-pupil-group">
                <ellipse class="clippy-eye-pupil" cx="0" cy="2" rx="4.5" ry="5.5" fill="#1A202C"/>
                <circle class="clippy-eye-glint" cx="-2.5" cy="-2.5" r="2" fill="#FFFFFF"/>
              </g>
            </g>
          </g>

          <g class="clippy-eyebrow-group left-eyebrow-group">
            <path class="clippy-eyebrow eyebrow-left" d="M 23,28 Q 32,24 39,30" fill="none" stroke="#2B3648" stroke-width="2.5" stroke-linecap="round"/>
          </g>
          <g class="clippy-eyebrow-group right-eyebrow-group">
            <path class="clippy-eyebrow eyebrow-right" d="M 46,30 Q 53,24 62,28" fill="none" stroke="#2B3648" stroke-width="2.5" stroke-linecap="round"/>
          </g>

          <g class="clippy-mouth-group">
            <path class="clippy-smile" d="M 36,60 Q 42,67 48,60" fill="none" stroke="#2B3648" stroke-width="2" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    `;
  } else {
    avatarHTML = `<img id="clippy-avatar-img" src="${placeholderUrl}" alt="Clippy Assistent">`;
  }

  container.innerHTML = `
    <div id="clippy-speech-bubble">
      <button id="clippy-close-btn" title="Schließen">&times;</button>
      <div id="clippy-speech-text">${escapeHtml(speechText)}</div>
      <button id="clippy-action-btn">🚀 Funktion ausführen</button>
    </div>
    <div id="clippy-avatar-wrapper" title="Klick für Ausführung!">
      ${avatarHTML}
    </div>
  `;

  // Try loading clippy.png if user uploaded one
  const testImg = new Image();
  testImg.onload = () => {
    const avatarWrapper = container.querySelector('#clippy-avatar-wrapper');
    if (avatarWrapper) {
      avatarWrapper.innerHTML = `<img id="clippy-avatar-img" src="${customImgUrl}" alt="Clippy Assistent">`;
    }
  };
  testImg.src = customImgUrl;

  document.body.appendChild(container);

  // Animation Pose Manager & Dynamic Variations
  const svgEl = container.querySelector('#clippy-svg');
  if (svgEl) {
    const ALL_POSES = ['pose-float', 'pose-think', 'pose-bounce', 'pose-wink', 'pose-wave', 'pose-surprised'];
    let initialPose = 'pose-float';

    if (['factCheck', 'legalCheck', 'plagiarism', 'codeReview', 'deepResearch', 'financeStockAnalysis', 'financeMakeMoney', 'seoAudit', 'recipeCheck', 'pageSherlock'].includes(actionKey)) {
      initialPose = 'pose-think';
    } else if (['aiDetection', 'createQuiz', 'createDiagram'].includes(actionKey)) {
      initialPose = 'pose-surprised';
    } else if (['socialPost', 'socialComment', 'tellJoke', 'vacationPlan'].includes(actionKey)) {
      initialPose = 'pose-bounce';
    } else if (['writeReply', 'doINeedThis', 'priceCompare', 'productProsCons'].includes(actionKey)) {
      initialPose = 'pose-wink';
    } else {
      initialPose = 'pose-wave';
    }

    svgEl.className = initialPose;
    let currentPose = initialPose;

    // Periodically switch poses every 4.5 seconds for dynamic animation variation
    const poseInterval = setInterval(() => {
      if (!document.body.contains(container)) {
        clearInterval(poseInterval);
        return;
      }
      const choices = ALL_POSES.filter(p => p !== currentPose);
      const nextPose = choices[Math.floor(Math.random() * choices.length)];
      svgEl.classList.remove(currentPose);
      svgEl.classList.add(nextPose);
      currentPose = nextPose;
    }, 4500);

    const avatarWrapper = container.querySelector('#clippy-avatar-wrapper');
    if (avatarWrapper) {
      avatarWrapper.addEventListener('mouseenter', () => {
        svgEl.classList.remove(currentPose);
        svgEl.classList.add('pose-bounce');
      });
      avatarWrapper.addEventListener('mouseleave', () => {
        svgEl.classList.remove('pose-bounce');
        svgEl.classList.add(currentPose);
      });
    }
  }

  // Close handler
  container.querySelector('#clippy-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.add('clippy-hide');
    setTimeout(() => container.remove(), 400);
  });

  // Action handlers
  const triggerFn = () => {
    container.classList.add('clippy-hide');
    setTimeout(() => container.remove(), 400);
    handleGeminiAction(actionKey);
  };

  container.querySelector('#clippy-action-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    triggerFn();
  });

  container.querySelector('#clippy-avatar-wrapper').addEventListener('click', (e) => {
    e.stopPropagation();
    triggerFn();
  });
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClippyDwellTimer);
} else {
  initClippyDwellTimer();
}
