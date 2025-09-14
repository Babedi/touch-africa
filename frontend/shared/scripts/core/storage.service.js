// Storage Service for TouchAfrica
class StorageService {
  constructor() {
    this.prefix = "touchafrica_";
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    this.isSessionStorageAvailable = this.checkSessionStorageAvailability();
  }

  // Check if localStorage is available
  checkLocalStorageAvailability() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Check if sessionStorage is available
  checkSessionStorageAvailability() {
    try {
      const test = "__sessionStorage_test__";
      sessionStorage.setItem(test, "test");
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get prefixed key
  getPrefixedKey(key) {
    return `${this.prefix}${key}`;
  }

  // LocalStorage methods
  setLocal(key, value) {
    if (!this.isLocalStorageAvailable) {
      console.warn("localStorage is not available");
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error("Error setting localStorage item:", error);
      return false;
    }
  }

  getLocal(key, defaultValue = null) {
    if (!this.isLocalStorageAvailable) {
      console.warn("localStorage is not available");
      return defaultValue;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);

      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.error("Error getting localStorage item:", error);
      return defaultValue;
    }
  }

  removeLocal(key) {
    if (!this.isLocalStorageAvailable) {
      console.warn("localStorage is not available");
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error("Error removing localStorage item:", error);
      return false;
    }
  }

  clearLocal() {
    if (!this.isLocalStorageAvailable) {
      console.warn("localStorage is not available");
      return false;
    }

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  }

  // SessionStorage methods
  setSession(key, value) {
    if (!this.isSessionStorageAvailable) {
      console.warn("sessionStorage is not available");
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error("Error setting sessionStorage item:", error);
      return false;
    }
  }

  getSession(key, defaultValue = null) {
    if (!this.isSessionStorageAvailable) {
      console.warn("sessionStorage is not available");
      return defaultValue;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = sessionStorage.getItem(prefixedKey);

      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.error("Error getting sessionStorage item:", error);
      return defaultValue;
    }
  }

  removeSession(key) {
    if (!this.isSessionStorageAvailable) {
      console.warn("sessionStorage is not available");
      return false;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error("Error removing sessionStorage item:", error);
      return false;
    }
  }

  clearSession() {
    if (!this.isSessionStorageAvailable) {
      console.warn("sessionStorage is not available");
      return false;
    }

    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
      return false;
    }
  }

  // Cookie methods (fallback for when localStorage/sessionStorage is not available)
  setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const prefixedName = this.getPrefixedKey(name);
    const serializedValue = JSON.stringify(value);
    document.cookie = `${prefixedName}=${serializedValue};expires=${expires.toUTCString()};path=/`;
  }

  getCookie(name, defaultValue = null) {
    const prefixedName = this.getPrefixedKey(name);
    const nameEQ = prefixedName + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          const value = c.substring(nameEQ.length, c.length);
          return JSON.parse(value);
        } catch (error) {
          console.error("Error parsing cookie value:", error);
          return defaultValue;
        }
      }
    }
    return defaultValue;
  }

  removeCookie(name) {
    const prefixedName = this.getPrefixedKey(name);
    document.cookie = `${prefixedName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }

  // Utility methods
  getStorageInfo() {
    return {
      localStorage: {
        available: this.isLocalStorageAvailable,
        usage: this.getLocalStorageUsage(),
      },
      sessionStorage: {
        available: this.isSessionStorageAvailable,
        usage: this.getSessionStorageUsage(),
      },
    };
  }

  getLocalStorageUsage() {
    if (!this.isLocalStorageAvailable) return 0;

    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  getSessionStorageUsage() {
    if (!this.isSessionStorageAvailable) return 0;

    let total = 0;
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
        total += sessionStorage[key].length + key.length;
      }
    }
    return total;
  }

  // Backup and restore
  exportData() {
    const data = {};

    if (this.isLocalStorageAvailable) {
      data.localStorage = {};
      for (let key in localStorage) {
        if (key.startsWith(this.prefix)) {
          const originalKey = key.substring(this.prefix.length);
          data.localStorage[originalKey] = localStorage[key];
        }
      }
    }

    if (this.isSessionStorageAvailable) {
      data.sessionStorage = {};
      for (let key in sessionStorage) {
        if (key.startsWith(this.prefix)) {
          const originalKey = key.substring(this.prefix.length);
          data.sessionStorage[originalKey] = sessionStorage[key];
        }
      }
    }

    return data;
  }

  importData(data) {
    if (data.localStorage && this.isLocalStorageAvailable) {
      for (let key in data.localStorage) {
        localStorage.setItem(this.getPrefixedKey(key), data.localStorage[key]);
      }
    }

    if (data.sessionStorage && this.isSessionStorageAvailable) {
      for (let key in data.sessionStorage) {
        sessionStorage.setItem(
          this.getPrefixedKey(key),
          data.sessionStorage[key]
        );
      }
    }
  }
}

// Create global instance
window.storageService = new StorageService();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageService;
}
