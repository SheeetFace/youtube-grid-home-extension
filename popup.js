/**
 * Adds event listeners for DOMContentLoaded, checkbox change, and slider input.
 * Retrieves and sets data from chrome storage for extension settings.
 * Sends messages to active tabs for toggling extension and updating width.
 */

document.addEventListener('DOMContentLoaded', function() {
    const enableCheckbox = document.getElementById('enableExtension');
    const widthSlider = document.getElementById('widthSlider');
    const widthValue = document.getElementById('widthValue');
  
    chrome.storage.sync.get(['enabled', 'width'], function(data) {
      enableCheckbox.checked = data.enabled !== false;
      widthSlider.value = data.width || 300;
      widthValue.textContent = widthSlider.value;
    })
  
    enableCheckbox.addEventListener('change', function() {
      chrome.storage.sync.set({enabled: this.checked});
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleExtension", enabled: enableCheckbox.checked});
      });
    })
  
    widthSlider.addEventListener('input', function() {
      widthValue.textContent = this.value;
      chrome.storage.sync.set({width: parseInt(this.value)});
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "updateWidth", width: parseInt(widthSlider.value)});
      })
    })
})