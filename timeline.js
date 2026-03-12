// timeline.js

const CHAT_HOSTS = {
    'claude.ai': {
        message: '[data-testid^="message-"]',
        user: '[data-testid="message-type-user"]',
        ai: '[data-testid="message-type-assistant"]',
        text: '.text-lg',
    },
    'chat.openai.com': {
        message: '[data-testid^="conversation-turn-"]',
        user: '[data-testid="conversation-turn-"] .justify-end',
        ai: '[data-testid="conversation-turn-"] .justify-start',
        text: '.text-base',
    },
    'chatgpt.com': {
        message: '[data-testid^="conversation-turn-"]',
        user: '[data-testid="conversation-turn-"] .justify-end',
        ai: '[data-testid="conversation-turn-"] .justify-start',
        text: '.text-base',
    },
    'gemini.google.com': {
        message: '.message',
        user: '.user-message',
        ai: '.model-response',
        text: '.message-text',
    },
    'chat.mistral.ai': {
        message: '.chat-message',
        user: '.user-message',
        ai: '.bot-message',
        text: '.text',
    },
    'copilot.microsoft.com': {
        message: 'cib-message',
        user: '[source="user"]',
        ai: '[source="bot"]',
        text: '.ac-textBlock',
    },
    'poe.com': {
        message: '[class*="Message_message"]',
        user: '[class*="humanMessage"]',
        ai: '[class*="botMessage"]',
        text: '[class*="Message_text"]',
    }
};

function isChatPage() {
    return Object.keys(CHAT_HOSTS).includes(window.location.hostname);
}

function createTimelineTab() {
    const tab = document.createElement('div');
    tab.id = 'timeline-tab';
    tab.innerHTML = '🕐';
    tab.style.position = 'fixed';
    tab.style.top = '50%';
    tab.style.right = '0';
    tab.style.transform = 'translateY(-50%)';
    tab.style.backgroundColor = '#333';
    tab.style.color = 'white';
    tab.style.padding = '10px';
    tab.style.cursor = 'pointer';
    tab.style.borderTopLeftRadius = '5px';
    tab.style.borderBottomLeftRadius = '5px';
    tab.style.zIndex = '9998';

    tab.addEventListener('click', toggleTimeline);
    document.body.appendChild(tab);
}

function toggleTimeline() {
    let sidebar = document.getElementById('timeline-sidebar');
    if (sidebar) {
        const isOpen = sidebar.style.right === '0px';
        sidebar.style.right = isOpen ? '-220px' : '0px';
    } else {
        createTimelineSidebar();
    }
}

function createTimelineSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'timeline-sidebar';
    sidebar.style.position = 'fixed';
    sidebar.style.top = '0';
    sidebar.style.right = '-220px';
    sidebar.style.width = '220px';
    sidebar.style.height = '100%';
    sidebar.style.backgroundColor = '#f0f0f0';
    sidebar.style.borderLeft = '1px solid #ccc';
    sidebar.style.zIndex = '9997';
    sidebar.style.transition = 'right 0.3s ease';
    sidebar.style.overflowY = 'auto';
    sidebar.style.fontFamily = 'sans-serif';
    
    sidebar.innerHTML = `
        <div style="padding: 10px; font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; background-color: #e0e0e0;">
            Konversations-Zeitstrahl
        </div>
        <div id="timeline-content"></div>
    `;

    document.body.appendChild(sidebar);
    setTimeout(() => { sidebar.style.right = '0px'; }, 10);

    populateTimeline();

    const observer = new MutationObserver(debounce(populateTimeline, 500));
    observer.observe(document.body, { childList: true, subtree: true });
}

function populateTimeline() {
    const content = document.getElementById('timeline-content');
    if (!content) return;

    const host = window.location.hostname;
    const selectors = CHAT_HOSTS[host];
    if (!selectors) return;

    const messages = document.querySelectorAll(selectors.message);
    if (messages.length === 0) return;

    content.innerHTML = '';
    const messageMap = new WeakMap();

    messages.forEach((msgEl, index) => {
        const isUser = msgEl.matches(selectors.user);
        const textEl = msgEl.querySelector(selectors.text);
        const text = textEl ? textEl.innerText.substring(0, 40).trim() : '...';

        if (!text) return;

        const icon = isUser ? '🧑' : '🤖';
        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.style.padding = '10px';
        entry.style.borderBottom = '1px solid #ddd';
        entry.style.cursor = 'pointer';
        entry.style.display = 'flex';
        entry.style.alignItems = 'center';
        entry.innerHTML = `<span style="margin-right: 8px;">${icon}</span><span style="font-size: 13px;">${text}...</span>`;
        
        entry.addEventListener('click', () => {
            msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        content.appendChild(entry);
        messageMap.set(msgEl, entry);
    });
    
    // Intersection observer for highlighting
    const highlightObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const timelineEntry = messageMap.get(entry.target);
            if (timelineEntry) {
                if (entry.isIntersecting) {
                    timelineEntry.style.backgroundColor = '#d0e0ff';
                } else {
                    timelineEntry.style.backgroundColor = '';
                }
            }
        });
    }, { threshold: 0.5 });
    
    messages.forEach(msgEl => highlightObserver.observe(msgEl));
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

if (isChatPage()) {
    createTimelineTab();
}
