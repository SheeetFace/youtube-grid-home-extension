/**
 * @fileoverview This script manages the layout of video elements on YouTube's home page grid.
 * It provides functionality to dynamically adjust video element widths based on user settings,
 * and responds to changes in the DOM related to the presence of video elements. It also handles
 * communication with the Chrome extension background script to retrieve and update extension settings.
 *
 * Key Features:
 * - **Dynamic Layout Update**: Adjusts the width of video elements in the grid based on user-configured settings.
 * - **Debouncing**: Uses a debounced function to limit the rate of updates to improve performance and avoid excessive reflows.
 * - **Visibility Observation**: Employs `IntersectionObserver` to detect when video elements enter the viewport, ensuring timely updates.
 * - **DOM Mutation Observation**: Utilizes `MutationObserver` to detect when new video elements are added to the DOM, applying updates as needed.
 * - **Extension Communication**: Listens for and responds to messages from the Chrome extension background script to handle extension toggling and settings updates.
 *
 * Functions:
 * - `debounce(func, delay)`: Returns a debounced version of the input function, which will be invoked after a specified delay.
 * - `updateGrid()`: Applies the current width settings to video elements and adjusts the maximum width of the grid container.
 * - `observeNewVideos()`: Sets up intersection observation for all currently visible video elements to ensure they are updated when they become visible.
 * - `mutationObserverCallback(mutations)`: Handles mutations in the DOM, such as newly added video elements, and applies necessary updates.
 *
 * Event Handlers:
 * - `chrome.runtime.sendMessage`: Retrieves the current settings from Chrome storage and initializes the extension based on these settings.
 * - `chrome.runtime.onMessage.addListener`: Listens for messages to toggle the extension's enabled state or update the video width.
 *
 * Constants:
 * - `isEnabled`: A boolean indicating whether the extension is currently enabled. If `true`, updates will be applied; if `false`, updates will be disabled.
 * - `videoWidth`: A number representing the width (in pixels) to which video elements should be adjusted.
 */


let isEnabled = true;
let videoWidth = 300;

const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  }
}

const updateGrid = () => {
  if (!isEnabled) return;
  
  const elements = document.querySelectorAll('ytd-rich-item-renderer[rendered-from-rich-grid]');

  elements.forEach(element => {
    if (element.offsetWidth !== videoWidth) {
      element.style.width = `${videoWidth}px`;
      element.style.boxSizing = "border-box";
    }
  })

  const gridContainer = document.querySelector('ytd-rich-grid-renderer');

  if (gridContainer && gridContainer.style.maxWidth !== "100%") gridContainer.style.maxWidth = "100%";
}

const debouncedUpdateGrid = debounce(updateGrid, 200);

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) debouncedUpdateGrid();
  })
}, {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
})

const observeNewVideos = () => {
  const videos = document.querySelectorAll('ytd-rich-item-renderer[rendered-from-rich-grid]');
  videos.forEach(video => {
    videoObserver.observe(video);
  })
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('ytd-rich-item-renderer[rendered-from-rich-grid]')) {
          debouncedUpdateGrid();
          videoObserver.observe(node);
        }
      })
    }
  })
})

chrome.runtime.sendMessage({action: "getSettings"}, function(response) {
  isEnabled = response.enabled;
  videoWidth = response.width;
  
  if (isEnabled) {
    updateGrid();
    observeNewVideos();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})

chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === "toggleExtension") {
    isEnabled = request.enabled;
    if (isEnabled) {
      updateGrid();
      observeNewVideos();
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      observer.disconnect();
      videoObserver.disconnect();

      document.querySelectorAll('ytd-rich-item-renderer[rendered-from-rich-grid]').forEach(element => {
        element.style.width = '';
        element.style.boxSizing = '';
      })

      const gridContainer = document.querySelector('ytd-rich-grid-renderer');
      if (gridContainer) gridContainer.style.maxWidth = '';
      
    }
  } else if (request.action === "updateWidth") {
    videoWidth = request.width;
    updateGrid();
  }
})