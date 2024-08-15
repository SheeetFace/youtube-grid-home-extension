/**
 * Listens for messages from the extension and retrieves settings from Chrome storage.
 * If the message action is 'getSettings', retrieves 'enabled' and 'width' values from storage.
 * Sends a response with the retrieved 'enabled' and 'width' values, using default values if they are not set.
 * 
 * @param {Object} message - The message received from the extension, containing the action to perform.
 * @param {Function} sendResponse - The function to send a response back to the sender of the message.
 * @returns {boolean} - Returns true to indicate that the response will be sent asynchronously.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getSettings") {
      chrome.storage.sync.get(['enabled', 'width'], function(data) {
        sendResponse({
          enabled: data.enabled !== false,
          width: data.width || 300
        })
      })
      return true; 
    }
})