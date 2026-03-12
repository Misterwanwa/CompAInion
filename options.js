/* ================================================
   options.js – Aero Glass Options Page
   Chrome Extension Options Page Logic
   ================================================ */

'use strict';

/* ──────────────────────────────────────────────────
   CONFIG
   Fill this object with your real texts & defaults.
   All UI text, labels, and initial values live here.
   ────────────────────────────────────────────────── */
const CONFIG = {

  titlebar: {
    icon: '✨',
    tabs: [
      { id: 'ai',       label: 'AI',       icon: '🤖' },
      { id: 'models',   label: 'MODELS',   icon: '🧠' },
      { id: 'settings', label: 'SETTINGS', icon: '⚙️' },
    ],
    activeTab: 'ai',
  },

  theme: {
    sectionLabel: 'App theme',
    buttons: [
      { value: 'aero',  label: 'Aero',  icon: '' },
      { value: 'xp',    label: 'XP',    icon: '' },
      { value: 'apple', label: 'Apple', icon: '' },
    ],
    default: 'aero',
  },

  uiLanguage: {
    sectionLabel: 'UI Sprache',
    elementId: 'ui-language',
    options: [
      { value: 'en', label: '🇬🇧 English'   },
      { value: 'de', label: '🇩🇪 Deutsch'   },
      { value: 'fr', label: '🇫🇷 Français'  },
      { value: 'es', label: '🇪🇸 Español'   },
      { value: 'it', label: '🇮🇹 Italiano'  },
      { value: 'pt', label: '🇵🇹 Português' },
      { value: 'ja', label: '🇯🇵 日本語'     },
      { value: 'zh', label: '🇨🇳 中文'       },
    ],
    default: 'de',
  },

  aiLanguage: {
    sectionLabel: 'KI Antwortsprache',
    elementId: 'ai-language',
    options: [
      { value: 'en', label: '🇬🇧 English'   },
      { value: 'de', label: '🇩🇪 Deutsch'   },
      { value: 'fr', label: '🇫🇷 Français'  },
      { value: 'es', label: '🇪🇸 Español'   },
      { value: 'it', label: '🇮🇹 Italiano'  },
      { value: 'pt', label: '🇵🇹 Português' },
      { value: 'ja', label: '🇯🇵 日本語'     },
      { value: 'zh', label: '🇨🇳 中文'       },
    ],
    default: 'de',
  },

  aiParameters: {
    sectionHeader: 'KI PARAMETER',
    userFacts: {
      label:       'Benutzerangaben und Meta-Anweisungen',
      placeholder: 'Auto',
      id:          'user-facts',
      storageKey:  'userFacts',
    },
    toneMimic: {
      label:        'Sprache und Ton der KI-Antworten',
      placeholder:  '',
      defaultValue: 'I write in a short and concise way. My speech is clear, professional, and to the point.',
      id:           'tone-mimic',
      storageKey:   'toneMimic',
    },
    globalParams: {
      sizeLabel: 'Globale Parameter: 1 KB',
      linkLabel: 'ANZEIGEN & BEARBEITEN ↗',
    },
  },

  shortcuts: {
    sectionHeader: 'TASTENKÜRZEL',
    items: [
      { combo: 'Alt+V', description: 'Bereich erfassen',  action: 'captureArea'  },
      { combo: 'Alt+S', description: 'Screenshot machen', action: 'screenshot'   },
      { combo: 'Alt+N', description: 'Neuen Chat starten', action: 'newChat'     },
      { combo: 'Alt+R', description: 'Addon neu laden',   action: 'reloadAddon'  },
    ],
  },

  models: {
    sectionHeader: 'KI MODELL',
    items: [
      { value: 'claude',     label: 'Claude',     url: 'https://claude.ai/new', type: 'cloud' },
      { value: 'chatgpt',    label: 'ChatGPT',    url: 'https://chatgpt.com/', type: 'cloud' },
      { value: 'deepseek',   label: 'DeepSeek',   url: 'https://chat.deepseek.com/', type: 'cloud' },
      { value: 'gemini',     label: 'Gemini',     url: 'https://gemini.google.com/app', type: 'cloud' },
      { value: 'grok',       label: 'Grok',       url: 'https://grok.com/', type: 'cloud' },
      { value: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai/', type: 'cloud' },
      { value: 'local',      label: 'Lokales LLM', url: '', type: 'local' }
    ],
    default: 'gemini',
    storageKey: 'selectedModel',
  },

  localLlm: {
    backends: [
      { value: 'ollama',   label: 'Lokales LLM (Ollama)',   defaultEndpoint: 'http://localhost:11434/api/chat' },
      { value: 'lmstudio', label: 'Lokales LLM (LM Studio)', defaultEndpoint: 'http://localhost:1234/v1/chat/completions' },
      { value: 'custom',   label: 'Benutzerdefiniert',     defaultEndpoint: '' },
    ],
    storageKeys: {
      backend: 'localLlmBackend',
      endpoint: 'localLlmEndpoint',
      model: 'localLlmModel',
      apiKey: 'localLlmApiKey',
    }
  },

  aiChat: {
    sectionHeader: 'KI CHAT',
    toggles: [
      { id: 'send-on-enter',          label: 'Prompts mit Enter senden',          default: true  },
      { id: 'always-show-connection', label: 'KI-Verbindung immer oben anzeigen', default: false },
    ],
  },
};


/* ──────────────────────────────────────────────────
   PLACEHOLDER HANDLER FUNCTIONS
   Replace these with your real implementations.
   ────────────────────────────────────────────────── */

/**
 * Called when the user selects a theme.
 * @param {string} value - 'auto' | 'day' | 'night'
 */
function handleThemeChange(value) {
  console.log('[Theme]', value);
  // TODO: save to chrome.storage.sync, apply theme class
  // chrome.storage.sync.set({ theme: value });
}

/**
 * Called when a language dropdown changes.
 * @param {'ui'|'ai'} type - which language selector was changed
 * @param {string}    code - language code e.g. 'en', 'de'
 */
function handleLanguageChange(type, code) {
  console.log('[Language]', type, code);
  // TODO: chrome.storage.sync.set({ [type + 'Language']: code });
}

/**
 * Called (debounced) when a textarea value changes.
 * @param {string} id    - textarea element id
 * @param {string} value - current text content
 */
function handleTextareaInput(id, value) {
  console.log('[Textarea]', id, value);
  // TODO: debounced chrome.storage.sync.set({ [storageKey]: value });
}

/**
 * Called when an AI Chat toggle changes.
 * @param {string}  id        - toggle option id
 * @param {boolean} isEnabled - new state
 */
function handleToggleChange(id, isEnabled) {
  console.log('[Toggle]', id, isEnabled);
  // TODO: chrome.storage.sync.set({ [id]: isEnabled });
}

/**
 * Called when the user clicks "VIEW & EDIT" for global parameters.
 */
function openGlobalParametersEditor() {
  console.log('[GlobalParams] open editor');
  // TODO: e.g. chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
}

/**
 * Called when a titlebar tab is clicked.
 * @param {string} tabId - e.g. 'ai' | 'models' | 'settings'
 */
function handleTabChange(tabId) {
  document.querySelectorAll('.tab-page').forEach(p => { p.style.display = 'none'; });
  const page = document.getElementById('tab-' + tabId);
  if (page) page.style.display = '';
}


/* ──────────────────────────────────────────────────
   RENDER FUNCTIONS
   ────────────────────────────────────────────────── */

function renderTitlebar() {
  // Icon
  const icon = document.getElementById('titlebar-icon');
  if (icon) icon.textContent = CONFIG.titlebar.icon;

  // Tabs
  const tabContainer = document.getElementById('titlebar-tabs');
  if (!tabContainer) return;
  tabContainer.innerHTML = '';

  CONFIG.titlebar.tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (tab.id === CONFIG.titlebar.activeTab ? ' active' : '');
    btn.dataset.tab = tab.id;
    btn.innerHTML = `<span>${tab.icon}</span><span>${tab.label}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      handleTabChange(tab.id);
    });
    tabContainer.appendChild(btn);
  });
}

function renderThemeButtons(savedTheme) {
  const label = document.getElementById('theme-section-label');
  if (label) label.textContent = CONFIG.theme.sectionLabel;

  const container = document.getElementById('theme-buttons');
  if (!container) return;
  container.innerHTML = '';

  const active = savedTheme || CONFIG.theme.default;

  CONFIG.theme.buttons.forEach(btn => {
    const el = document.createElement('button');
    el.className = 'jelly-radio' + (btn.value === active ? ' active' : '');
    el.dataset.theme = btn.value;
    el.innerHTML = `<span class="jelly-radio-icon">${btn.icon}</span><span class="jelly-radio-text">${btn.label}</span>`;
    el.addEventListener('click', () => {
      container.querySelectorAll('.jelly-radio').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      handleThemeChange(btn.value);
    });
    container.appendChild(el);
  });
}

function renderSelect(cfg, savedValue) {
  const label = document.getElementById(
    cfg.elementId === 'ui-language' ? 'ui-lang-section-label' : 'ai-lang-section-label'
  );
  if (label) label.textContent = cfg.sectionLabel;

  const select = document.getElementById(cfg.elementId);
  if (!select) return;
  select.innerHTML = '';

  const active = savedValue || cfg.default;
  cfg.options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === active) option.selected = true;
    select.appendChild(option);
  });

  const type = cfg.elementId === 'ui-language' ? 'ui' : 'ai';
  select.addEventListener('change', () => handleLanguageChange(type, select.value));
}

function renderAIParameters(savedUserFacts, savedToneMimic) {
  const cfg = CONFIG.aiParameters;

  // Section header
  const header = document.getElementById('ai-params-header');
  if (header) header.textContent = cfg.sectionHeader;

  // User facts textarea
  const userFactsLabel = document.getElementById('user-facts-label');
  if (userFactsLabel) userFactsLabel.textContent = cfg.userFacts.label;
  const userFacts = document.getElementById('user-facts');
  if (userFacts) {
    userFacts.placeholder = cfg.userFacts.placeholder;
    userFacts.value = savedUserFacts || '';
    userFacts.addEventListener('input', debounce(() =>
      handleTextareaInput(cfg.userFacts.id, userFacts.value), 500));
  }

  // Tone mimic textarea
  const toneMimicLabel = document.getElementById('tone-mimic-label');
  if (toneMimicLabel) toneMimicLabel.textContent = cfg.toneMimic.label;
  const toneMimic = document.getElementById('tone-mimic');
  if (toneMimic) {
    toneMimic.placeholder = cfg.toneMimic.placeholder;
    toneMimic.value = savedToneMimic !== undefined ? savedToneMimic : cfg.toneMimic.defaultValue;
    toneMimic.addEventListener('input', debounce(() =>
      handleTextareaInput(cfg.toneMimic.id, toneMimic.value), 500));
  }

  // Global params footer
  const sizeEl = document.getElementById('global-params-size');
  if (sizeEl) sizeEl.textContent = cfg.globalParams.sizeLabel;
  const linkEl = document.getElementById('open-global-params');
  if (linkEl) {
    linkEl.textContent = cfg.globalParams.linkLabel;
    linkEl.addEventListener('click', e => { e.preventDefault(); openGlobalParametersEditor(); });
  }
}

/**
 * Renders shortcut key combo HTML from a string like "Ctrl+Shift+C"
 * Each key part becomes a .jelly-key span, separated by .key-plus spans.
 */
function renderKeyCombo(combo) {
  return combo.split('+').map(k =>
    `<span class="jelly-key">${k.trim()}</span>`
  ).join('<span class="key-plus">+</span>');
}

function renderShortcuts() {
  const header = document.getElementById('shortcuts-header');
  if (header) header.textContent = CONFIG.shortcuts.sectionHeader;

  const list = document.getElementById('shortcuts-list');
  if (!list) return;
  list.innerHTML = '';

  CONFIG.shortcuts.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'shortcut-row';
    row.innerHTML = `
      <div class="shortcut-key-combo">${renderKeyCombo(item.combo)}</div>
      <span class="shortcut-desc">${item.description}</span>
    `;
    list.appendChild(row);
  });
}

function renderToggles(savedStates) {
  const header = document.getElementById('ai-chat-header');
  if (header) header.textContent = CONFIG.aiChat.sectionHeader;

  const list = document.getElementById('toggles-list');
  if (!list) return;
  list.innerHTML = '';

  CONFIG.aiChat.toggles.forEach(toggle => {
    const isOn = savedStates && toggle.id in savedStates
      ? savedStates[toggle.id]
      : toggle.default;

    const row = document.createElement('div');
    row.className = 'toggle-row';

    // Unique input ID
    const inputId = 'toggle-' + toggle.id;

    row.innerHTML = `
      <span class="toggle-label">${toggle.label}</span>
      <label class="toggle-switch" for="${inputId}">
        <input type="checkbox" id="${inputId}" ${isOn ? 'checked' : ''}>
        <span class="toggle-track"></span>
        <span class="toggle-knob"></span>
      </label>
    `;

    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () =>
      handleToggleChange(toggle.id, checkbox.checked));

    list.appendChild(row);
  });
}


function renderModels(savedModel) {
  const cfg = CONFIG.models;
  const header = document.getElementById('models-header');
  if (header) header.textContent = cfg.sectionHeader;

  const list = document.getElementById('models-list');
  if (!list) return;
  list.innerHTML = '';

  const active = savedModel || cfg.default;

  cfg.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'model-row' + (item.value === active ? ' active' : '');
    row.dataset.model = item.value;
    row.innerHTML = `<span class="model-dot"></span><span class="model-label">${item.label}</span>`;
    row.addEventListener('click', () => {
      list.querySelectorAll('.model-row').forEach(r => r.classList.remove('active'));
      row.classList.add('active');
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ [cfg.storageKey]: item.value });
      }
      // Show/hide local llm settings
      const localLlmSection = document.querySelector('.section-header + .section');
      const localLlmHeader = document.querySelector('.section-header');
      if (item.value === 'local') {
        localLlmSection.style.display = 'block';
        localLlmHeader.style.display = 'block';
      } else {
        localLlmSection.style.display = 'none';
        localLlmHeader.style.display = 'none';
      }
    });
    list.appendChild(row);
  });
}

function renderLocalLlmSettings(savedState) {
    const cfg = CONFIG.localLlm;
    const backendSelect = document.getElementById('local-llm-backend');
    const endpointInput = document.getElementById('local-llm-endpoint');
    const modelInput = document.getElementById('local-llm-model');
    const apiKeyInput = document.getElementById('local-llm-apikey');

    if (!backendSelect) return;

    // Populate backend dropdown
    cfg.backends.forEach(backend => {
        const option = document.createElement('option');
        option.value = backend.value;
        option.textContent = backend.label;
        if (backend.value === savedState[cfg.storageKeys.backend]) {
            option.selected = true;
        }
        backendSelect.appendChild(option);
    });

    // Set initial values
    endpointInput.value = savedState[cfg.storageKeys.endpoint] || cfg.backends.find(b => b.value === backendSelect.value)?.defaultEndpoint || '';
    modelInput.value = savedState[cfg.storageKeys.model] || '';
    apiKeyInput.value = savedState[cfg.storageKeys.apiKey] || '';

    // Event listeners
    backendSelect.addEventListener('change', () => {
        const selectedBackend = cfg.backends.find(b => b.value === backendSelect.value);
        endpointInput.value = selectedBackend?.defaultEndpoint || '';
        chrome.storage.sync.set({
            [cfg.storageKeys.backend]: backendSelect.value,
            [cfg.storageKeys.endpoint]: endpointInput.value
        });
    });

    endpointInput.addEventListener('input', debounce(() => {
        chrome.storage.sync.set({ [cfg.storageKeys.endpoint]: endpointInput.value });
    }, 500));

    modelInput.addEventListener('input', debounce(() => {
        chrome.storage.sync.set({ [cfg.storageKeys.model]: modelInput.value });
    }, 500));

    apiKeyInput.addEventListener('input', debounce(() => {
        chrome.storage.sync.set({ [cfg.storageKeys.apiKey]: apiKeyInput.value });
    }, 500));

    // Test button
    const testButton = document.getElementById('test-local-llm');
    const testResult = document.getElementById('test-result');
    testButton.addEventListener('click', async () => {
        const endpoint = endpointInput.value;
        const apiKey = apiKeyInput.value;
        const model = modelInput.value;

        if (!endpoint) {
            testResult.innerHTML = '❌ Fehler: API-Endpunkt ist nicht festgelegt.';
            testResult.style.color = 'red';
            return;
        }

        testResult.innerHTML = 'Teste Verbindung...';
        testResult.style.color = 'white';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Ping' }]
                })
            });

            if (response.ok) {
                testResult.innerHTML = '✅ Verbindung erfolgreich';
                testResult.style.color = 'lightgreen';
            } else {
                const errorText = await response.text();
                testResult.innerHTML = `❌ Fehler: ${response.status} ${response.statusText}. ${errorText}`;
                testResult.style.color = 'red';
            }
        } catch (error) {
            testResult.innerHTML = `❌ Fehler: ${error.message}`;
            testResult.style.color = 'red';
        }
    });
}


/* ──────────────────────────────────────────────────
   UTILITY
   ────────────────────────────────────────────────── */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


/* ──────────────────────────────────────────────────
   LOAD SAVED STATE & INIT
   ────────────────────────────────────────────────── */

function applyState(state) {
  renderTitlebar();
  renderThemeButtons(state.theme);
  renderSelect(CONFIG.uiLanguage, state.uiLanguage);
  renderSelect(CONFIG.aiLanguage, state.aiLanguage);
  renderAIParameters(state.userFacts, state.toneMimic);
  renderShortcuts();
  renderToggles(state);
  renderModels(state[CONFIG.models.storageKey]);
  renderLocalLlmSettings(state);
  // Show active tab page
  handleTabChange(CONFIG.titlebar.activeTab);
}

function loadSavedState() {
  // Collect all storage keys we care about
  const toggleKeys = CONFIG.aiChat.toggles.map(t => t.id);
  const localLlmKeys = Object.values(CONFIG.localLlm.storageKeys);
  const allKeys = ['theme', 'uiLanguage', 'aiLanguage', 'userFacts', 'toneMimic', CONFIG.models.storageKey, ...toggleKeys, ...localLlmKeys];

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(allKeys, state => {
      applyState(state || {});
    });
  } else {
    // Fallback for development outside Chrome context
    applyState({});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();

  // Roter Button: aktuellen Tab schließen
  const closeBtn = document.getElementById('wc-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.getCurrent(tab => { if (tab) chrome.tabs.remove(tab.id); });
      } else {
        window.close();
      }
    });
  }

  // Tastenkürzel global registrieren
  document.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const key = e.key.toUpperCase();
    let action = null;
    if (key === 'V') action = 'captureArea';
    else if (key === 'S') action = 'screenshot';
    else if (key === 'N') action = 'newChat';
    else if (key === 'R') action = 'reloadAddon';
    if (!action) return;
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action });
      });
    }
  });
});
