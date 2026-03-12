document.getElementById('toggleChat').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    try {
      await chrome.tabs.sendMessage(tabs[0].id, {action: "toggleChat"});
    } catch (error) {
      // Content Script noch nicht geladen - injiziere es
      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tabs[0].id },
        files: ['styles.css']
      });
      // Versuche erneut
      setTimeout(() => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleChat"});
      }, 100);
    }
  });
});

// Einstellungen öffnen
document.getElementById('btn-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Close-Button schließt das Popup
document.getElementById('btn-close-popup').addEventListener('click', () => {
  window.close();
});