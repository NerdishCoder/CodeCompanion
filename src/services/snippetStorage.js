// src/services/snippetStorage.js

const STORAGE_KEY = "snippets";

/**
 * Saves snippets array into chrome.storage.local
 * @param {Array} snippets 
 */
export const saveSnippets = async (snippets) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: snippets }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving snippets:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("Snippets saved successfully.");
        resolve();
      }
    });
  });
};

/**
 * Loads snippets array from chrome.storage.local
 * @returns {Promise<Array>}
 */
export const loadSnippets = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading snippets:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[STORAGE_KEY] || []);
      }
    });
  });
};
