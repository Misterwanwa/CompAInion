// reddit.js

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

function showToast(msg) {
  const old = document.getElementById('gemini-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'gemini-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
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


function isRedditPostPage() {
    return window.location.href.includes('/r/') && window.location.href.includes('/comments/');
}

function createSummarizeButton() {
    const button = document.createElement('button');
    button.id = 'reddit-summarize-btn';
    button.innerHTML = '📄 Zusammenfassen';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.backgroundColor = '#FF4500';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';

    button.addEventListener('click', summarizeRedditPost);

    document.body.appendChild(button);
}

function summarizeRedditPost() {
    const title = document.querySelector('h1').innerText;
    const postBody = document.querySelector('[data-test-id="post-content"]');
    const postText = postBody ? postBody.innerText : '';

    const comments = [];
    const topLevelComments = document.querySelectorAll('div[id^="t1_"]');

    topLevelComments.forEach((commentNode, index) => {
        if (index < 30) {
            const commentBody = commentNode.querySelector('[data-test-id="comment"]');
            if (commentBody) {
                let commentText = commentBody.innerText;

                const nestedCommentsL1 = commentNode.querySelectorAll(':scope > div > div > div > div > div[id^="t1_"]');
                nestedCommentsL1.forEach(nestedNodeL1 => {
                    const nestedBodyL1 = nestedNodeL1.querySelector('[data-test-id="comment"]');
                    if (nestedBodyL1) {
                        commentText += "\n  > " + nestedBodyL1.innerText;

                        const nestedCommentsL2 = nestedNodeL1.querySelectorAll(':scope > div > div > div > div > div[id^="t1_"]');
                        nestedCommentsL2.forEach(nestedNodeL2 => {
                            const nestedBodyL2 = nestedNodeL2.querySelector('[data-test-id="comment"]');
                            if (nestedBodyL2) {
                                commentText += "\n    > " + nestedBodyL2.innerText;
                            }
                        });
                    }
                });
                comments.push(commentText);
            }
        }
    });

    const extractedContent = `Titel: ${title}\n\nPost-Text: ${postText}\n\nKommentare:\n${comments.join('\n\n---\n\n')}`;

    const systemPrompt = `Du bist ein präziser Assistent. Fasse den folgenden Reddit-Beitrag auf Deutsch zusammen. 
Struktur der Zusammenfassung:
- **Thema:** (1 Satz)
- **Kernaussage des Posts:** (2-3 Sätze)
- **Mehrheitsmeinung der Kommentare:** (2-3 Sätze)
- **Interessante Gegenpositionen:** (falls vorhanden, 1-2 Sätze)
- **Fazit:** (1 Satz)
Sei sachlich, knapp und vermeide Wiederholungen.`;

    const fullPrompt = `${systemPrompt}\n\n${extractedContent}`;

    showResponseModal("Zusammenfassung wird generiert...");

    getAiConfig(config => {
        if (config.type === 'local') {
            sendToLocalLlm(config, fullPrompt);
        } else {
            chrome.runtime.sendMessage({
                action: 'summarizeWithCloud',
                prompt: fullPrompt,
                config: config
            });
        }
    });
}

function isSubredditPage() {
    return window.location.href.includes('/r/') && !window.location.href.includes('/comments/');
}

function createSentimentButton() {
    const button = document.createElement('button');
    button.id = 'reddit-sentiment-btn';
    button.innerHTML = '🌡️ Stimmung analysieren';
    button.style.position = 'fixed';
    button.style.bottom = '70px';
    button.style.right = '20px';
    button.style.backgroundColor = '#0079D3';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';

    button.addEventListener('click', showSentimentSlider);

    document.body.appendChild(button);
}

function showSentimentSlider() {
    const overlay = document.createElement('div');
    overlay.id = 'sentiment-slider-overlay';

    const popup = document.createElement('div');
    popup.id = 'sentiment-slider-popup';

    popup.innerHTML = `
        <div class="slider-header">
            <span>Anzahl der Posts analysieren</span>
            <button id="close-slider-btn">×</button>
        </div>
        <div class="slider-body">
            <input type="range" min="5" max="50" value="20" class="slider" id="post-count-slider">
            <span id="slider-value">20</span>
        </div>
        <div class="slider-footer">
            <button id="analyze-btn">Analysieren</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const slider = popup.querySelector('#post-count-slider');
    const sliderValue = popup.querySelector('#slider-value');

    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
    });

    popup.querySelector('#close-slider-btn').addEventListener('click', () => {
        overlay.remove();
    });

    popup.querySelector('#analyze-btn').addEventListener('click', () => {
        const postCount = slider.value;
        overlay.remove();
        analyzeSentiment(postCount);
    });
}

function analyzeSentiment(postCount) {
    const posts = [];
    const postNodes = document.querySelectorAll('[data-testid="post-container"]');

    postNodes.forEach((postNode, index) => {
        if (index < postCount) {
            const title = postNode.querySelector('h3').innerText;
            const flair = postNode.querySelector('[data-testid="post-flair"]')?.innerText || '';
            const upvoteRatio = ''; 
            const previewText = postNode.querySelector('[data-adclicklocation="media"]')?.innerText || '';

            posts.push({
                title,
                flair,
                upvoteRatio,
                previewText
            });
        }
    });

    const subredditName = window.location.href.split('/r/')[1].split('/')[0];
    const extractedContent = posts.map(p => `Titel: ${p.title}\nFlair: ${p.flair}\nText: ${p.previewText}`).join('\n\n---\n\n');

    const systemPrompt = `Du bist ein Analyst für Social-Media-Stimmungen. Analysiere die folgenden Reddit-Posts aus dem Subreddit r/${subredditName} und beschreibe die aktuelle Grundstimmung der Community.

Ausgabeformat (kompakt, max. 120 Wörter):
- **Gesamtstimmung:** [positiv / neutral / angespannt / negativ / gemischt] + ein prägnanter Erklärungssatz
- **Dominante Themen:** (max. 3 Stichpunkte)
- **Auffälligkeiten:** (optional, falls ein Trend oder Konflikt erkennbar ist)

Sei direkt und verzichte auf Floskeln.`;

    const fullPrompt = `${systemPrompt}\n\n${extractedContent}`;

    showToast("Stimmung wird analysiert...");

    getAiConfig(config => {
        if (config.type === 'local') {
            sendToLocalLlm(config, fullPrompt, 'toast');
        } else {
            chrome.runtime.sendMessage({
                action: 'summarizeWithCloud',
                prompt: fullPrompt,
                config: config
            });
        }
    });
}

if (isRedditPostPage()) {
    createSummarizeButton();
}

if (isSubredditPage()) {
    createSentimentButton();
}
