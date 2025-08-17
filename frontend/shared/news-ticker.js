/**
 * News Ticker Component
 * Fetches and displays news from the NeighbourGuard™ service
 * AfricaTalking inspired design with smooth animations
 */

class NewsTicker {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.apiEndpoint = options.apiEndpoint || "/general/serviceInfo/news";
    this.refreshInterval = options.refreshInterval || 300000; // 5 minutes
    this.scrollSpeed = options.scrollSpeed || 60; // seconds for full scroll

    this.newsItems = [];
    this.isPlaying = true;
    this.refreshTimer = null;

    this.init();
  }

  async init() {
    this.createTickerHTML();
    this.bindEvents();
    await this.loadNews();
    this.startAutoRefresh();
  }

  createTickerHTML() {
    const tickerHTML = `
            <div class="news-ticker" id="newsTicker">
                <div class="news-ticker-content">
                    <div class="news-ticker-label">
                        <span class="icon">📰</span>
                        <span>NEWS</span>
                    </div>
                    <div class="news-ticker-scroll">
                        <div class="news-ticker-items" id="newsTickerItems">
                            <!-- News items will be populated here -->
                        </div>
                    </div>
                    <div class="news-ticker-controls">
                        <button class="news-ticker-control" id="newsPlayPause" title="Play/Pause">
                            ⏸️
                        </button>
                        <button class="news-ticker-control" id="newsRefresh" title="Refresh News">
                            🔄
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Insert at the very top of the container
    this.container.insertAdjacentHTML("afterbegin", tickerHTML);

    this.tickerElement = document.getElementById("newsTicker");
    this.itemsContainer = document.getElementById("newsTickerItems");
    this.playPauseBtn = document.getElementById("newsPlayPause");
    this.refreshBtn = document.getElementById("newsRefresh");
  }

  bindEvents() {
    // Play/Pause control
    this.playPauseBtn.addEventListener("click", () => {
      this.togglePlayPause();
    });

    // Refresh control
    this.refreshBtn.addEventListener("click", () => {
      this.loadNews();
    });

    // Pause on hover
    this.itemsContainer.addEventListener("mouseenter", () => {
      this.pauseAnimation();
    });

    this.itemsContainer.addEventListener("mouseleave", () => {
      if (this.isPlaying) {
        this.resumeAnimation();
      }
    });

    // Handle visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else if (this.isPlaying) {
        this.resumeAnimation();
      }
    });
  }

  async loadNews() {
    try {
      this.showLoading();

      console.log("📰 Loading news from:", this.apiEndpoint);

      const response = await fetch(this.apiEndpoint);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to load news");
      }

      this.newsItems = result.data || [];
      console.log(`📊 Loaded ${this.newsItems.length} news items`);

      if (this.newsItems.length === 0) {
        this.showNoNews();
      } else {
        this.renderNews();
      }
    } catch (error) {
      console.error("❌ Error loading news:", error);
      this.showError(error.message);
    }
  }

  renderNews() {
    this.tickerElement.classList.remove("loading", "error", "no-news");

    if (this.newsItems.length === 0) {
      this.showNoNews();
      return;
    }

    const newsHTML = this.newsItems
      .map((item) => this.createNewsItemHTML(item))
      .join("");
    this.itemsContainer.innerHTML = newsHTML;

    // Reset animation
    this.itemsContainer.style.animation = "none";
    this.itemsContainer.offsetHeight; // Trigger reflow
    this.itemsContainer.style.animation = `scroll-news ${this.scrollSpeed}s linear infinite`;

    // Update last refresh time
    const lastUpdate = new Date().toLocaleTimeString();
    console.log(`📰 News ticker updated at ${lastUpdate}`);
  }

  createNewsItemHTML(item) {
    const publishedDate = new Date(item.publishedAt);
    const timeAgo = this.getTimeAgo(publishedDate);

    const priorityClass =
      item.priority === "high" ? "news-item-priority-high" : "";
    const categoryBadge = item.category
      ? `<span class="news-item-category">${item.category}</span>`
      : "";
    const url = item.url || "#";
    const isClickable = item.url ? "" : 'style="cursor: default;"';

    return `
            <a href="${url}" class="news-item ${priorityClass}" ${isClickable} target="_blank" rel="noopener">
                ${categoryBadge}
                <span class="news-item-title">${this.escapeHtml(
                  item.title
                )}</span>
                <span class="news-item-time">${timeAgo}</span>
            </a>
        `;
  }

  showLoading() {
    this.tickerElement.classList.add("loading");
    this.tickerElement.classList.remove("error", "no-news");

    this.itemsContainer.innerHTML = `
            <div class="news-ticker-loading">
                <div class="spinner"></div>
                <span>Loading latest news...</span>
            </div>
        `;
  }

  showError(message) {
    this.tickerElement.classList.add("error");
    this.tickerElement.classList.remove("loading", "no-news");

    this.itemsContainer.innerHTML = `
            <div class="news-ticker-error">
                <span>⚠️ Failed to load news: ${this.escapeHtml(message)}</span>
            </div>
        `;
  }

  showNoNews() {
    this.tickerElement.classList.add("no-news");
    this.tickerElement.classList.remove("loading", "error");
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.resumeAnimation();
      this.playPauseBtn.innerHTML = "⏸️";
      this.playPauseBtn.title = "Pause";
    } else {
      this.pauseAnimation();
      this.playPauseBtn.innerHTML = "▶️";
      this.playPauseBtn.title = "Play";
    }

    this.playPauseBtn.classList.toggle("active", !this.isPlaying);
  }

  pauseAnimation() {
    this.itemsContainer.style.animationPlayState = "paused";
  }

  resumeAnimation() {
    this.itemsContainer.style.animationPlayState = "running";
  }

  startAutoRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Set up auto refresh
    this.refreshTimer = setInterval(() => {
      this.loadNews();
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  refresh() {
    this.loadNews();
  }

  destroy() {
    this.stopAutoRefresh();
    if (this.tickerElement) {
      this.tickerElement.remove();
    }
  }

  updateSpeed(seconds) {
    this.scrollSpeed = seconds;
    if (this.itemsContainer) {
      this.itemsContainer.style.animationDuration = `${seconds}s`;
    }
  }

  updateRefreshInterval(milliseconds) {
    this.refreshInterval = milliseconds;
    this.startAutoRefresh();
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize news ticker if container exists
  const container = document.body;
  if (container) {
    window.newsTicker = new NewsTicker({
      container: container,
      apiEndpoint: "/general/serviceInfo/news",
      refreshInterval: 300000, // 5 minutes
      scrollSpeed: 50, // 50 seconds for full scroll
    });

    console.log("📰 News ticker initialized");
  }
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = NewsTicker;
}
