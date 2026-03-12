// Local LLM Helper Functions
// Shared utilities for communicating with local LLM backends

/**
 * Sends a prompt to a local LLM backend and handles the response
 * @param {Object} config - Configuration object containing backend, endpoint, model, and apiKey
 * @param {string} prompt - The prompt to send
 * @param {string} type - The type of response handling ('modal', 'toast', or 'silent')
 * @returns {Promise<string|null>} - The response text or null if type is not 'silent'
 */
async function sendToLocalLlm(config, prompt, type = 'modal') {
  if (!config || !config.endpoint) {
    console.error('Local LLM: No endpoint configured');
    if (type !== 'silent') {
      showToast('Local LLM: Kein Endpunkt konfiguriert', 'error');
    }
    return null;
  }

  const { backend, endpoint, model, apiKey } = config;

  try {
    let response;
    
    if (backend === 'ollama') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: model || 'llama3',
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      });
    } else if (backend === 'lmstudio') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: model || 'local-model',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          stream: false
        })
      });
    } else if (backend === 'openai-compatible') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          stream: false
        })
      });
    } else {
      throw new Error(`Unknown backend: ${backend}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response text based on backend format
    let responseText = '';
    if (data.message && data.message.content) {
      // Ollama format
      responseText = data.message.content;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      // OpenAI-compatible format
      responseText = data.choices[0].message.content;
    } else if (data.content) {
      // Some other formats
      responseText = data.content;
    } else {
      responseText = JSON.stringify(data);
    }

    if (type === 'silent') {
      return responseText;
    } else if (type === 'toast') {
      showToast(responseText, 'success');
    } else {
      // modal
      showModal(responseText);
    }
    
    return responseText;
  } catch (error) {
    console.error('Local LLM Error:', error);
    if (type !== 'silent') {
      showToast(`Local LLM Fehler: ${error.message}`, 'error');
    }
    return null;
  }
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success', 'error', 'info')
 */
function showToast(message, type = 'info') {
  // Check if we're in a content script context
  if (typeof window === 'undefined' || !document.body) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `gemini-toast gemini-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#3b82f6'};
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Shows a modal with the response
 * @param {string} content - The content to display
 */
function showModal(content) {
  // Check if we're in a content script context
  if (typeof window === 'undefined' || !document.body) {
    console.log('[MODAL]', content);
    return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById('gemini-local-llm-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'gemini-local-llm-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Local LLM Antwort';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    line-height: 1;
  `;
  closeBtn.onclick = () => modal.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.style.cssText = `
    line-height: 1.6;
    color: #374151;
    white-space: pre-wrap;
  `;
  body.textContent = content;

  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modal.appendChild(modalContent);

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };

  document.body.appendChild(modal);
}

// Export for use in other scripts if module system is available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendToLocalLlm, showToast, showModal };
}
