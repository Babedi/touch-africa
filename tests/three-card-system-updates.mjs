/**
 * Modified Feature Cards Implementation - Always 3 Cards
 * Updates the feature cycling system to always display exactly 3 cards
 * with enhanced animations and proper responsive layout
 */

// Key changes needed for 3-card system:

const FEATURE_CARD_UPDATES = {
  // 1. Update cycling logic in index.js
  startFeatureCycle: `
  /**
   * Start feature cycling system - Modified for 3 cards
   */
  startFeatureCycle() {
    if (this.allFeatures.length <= 3) {
      console.log("🔄 Not enough features for cycling, showing all features");
      return;
    }

    console.log("🔄 Starting 3-card cycling system");
    this.featureCycleTimer = setInterval(() => {
      this.cycleNextFeature();
    }, this.featureCycleInterval);

    // Add visibility change handler to pause/resume cycling
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseFeatureCycle();
      } else {
        this.resumeFeatureCycle();
      }
    });
  }`,

  cycleNextFeature: `
  /**
   * Cycle to next individual feature (one out, one in) - 3 cards
   */
  cycleNextFeature() {
    if (this.allFeatures.length <= 3) return;

    // Get the next feature to cycle in
    const nextFeature =
      this.allFeatures[this.nextFeatureIndex % this.allFeatures.length];

    // Replace the oldest displayed feature with the new one
    this.currentDisplayedFeatures.shift(); // Remove first (oldest) feature
    this.currentDisplayedFeatures.push(nextFeature); // Add new feature to end

    // Update the next feature index
    this.nextFeatureIndex =
      (this.nextFeatureIndex + 1) % this.allFeatures.length;

    console.log(
      \`🔄 Cycling in feature: "\${nextFeature.title}" (\${this.nextFeatureIndex}/\${this.allFeatures.length})\`
    );

    // Update the display with smooth transition
    this.updateFeatureCardsWithTransition(this.currentDisplayedFeatures);

    // Update cycling indicator
    this.updateCyclingIndicator();
  }`,

  loadFeaturesAndUpdateCards: `
  /**
   * Load features and update feature cards section - 3 cards
   */
  async loadFeaturesAndUpdateCards() {
    try {
      console.log("🎯 Loading features for 3-card system...");

      const response = await fetch("/general/serviceInfo/features");

      if (!response.ok) {
        console.warn("Failed to load features for cards, keeping defaults");
        return;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        console.log(\`✅ Loaded \${data.data.length} features for 3-card system\`);
        this.allFeatures = data.data;

        // Initialize displayed features (first 3)
        this.currentDisplayedFeatures = data.data.slice(0, 3);
        this.nextFeatureIndex = 3; // Start cycling from 4th feature

        this.updateFeatureCards(this.currentDisplayedFeatures);
      }
    } catch (error) {
      console.error("❌ Error loading features for cards:", error);
    }
  }`,

  updateCyclingIndicator: `
  /**
   * Update cycling indicator - 3 cards
   */
  updateCyclingIndicator() {
    const featuresSection = document.querySelector(".features");
    if (!featuresSection) return;

    // Remove existing indicator
    const existingIndicator = featuresSection.querySelector(
      ".features-cycle-indicator"
    );
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add new indicator if we have more than 3 features
    if (this.allFeatures.length > 3) {
      const indicator = document.createElement("div");
      indicator.className = "features-cycle-indicator";

      // Calculate how many features are not currently displayed
      const hiddenFeatures = this.allFeatures.length - 3;
      const currentPosition = this.nextFeatureIndex - 3;

      indicator.innerHTML = \`
        <div class="cycle-dots">
          \${Array.from(
            { length: Math.min(this.allFeatures.length, 8) },
            (_, i) => {
              const isCurrentlyDisplayed = this.currentDisplayedFeatures.some(
                (feature) => this.allFeatures.indexOf(feature) === i
              );
              return \`<span class="cycle-dot \${
                isCurrentlyDisplayed ? "active" : ""
              }" 
                   data-index="\${i}" title="Feature \${i + 1}: \${
                this.allFeatures[i]?.title || ""
              }"></span>\`;
            }
          ).join("")}
          \${
            this.allFeatures.length > 8
              ? '<span class="cycle-dots-more">...</span>'
              : ""
          }
        </div>
        <div class="cycle-info">
          <span class="cycle-text">Showing 3 of \${
            this.allFeatures.length
          } features</span>
        </div>
      \`;

      featuresSection.appendChild(indicator);
    }
  }`,

  resumeFeatureCycle: `
  /**
   * Resume feature cycling - 3 cards
   */
  resumeFeatureCycle() {
    if (!this.featureCycleTimer && this.allFeatures.length > 3) {
      this.featureCycleTimer = setInterval(() => {
        this.cycleNextFeature();
      }, this.featureCycleInterval);
      console.log("▶️ Feature cycling resumed (3-card system)");
    }
  }`,
};

// Animation timings and CSS updates needed
const CSS_UPDATES = {
  floatingAnimations: `
/* Enhanced floating animations for 3-card layout */
.feature-card {
  animation: floatSubtle 4s ease-in-out infinite;
}

.feature-card:nth-child(1) { animation-delay: 0s; }
.feature-card:nth-child(2) { animation-delay: 1s; }
.feature-card:nth-child(3) { animation-delay: 2s; }

/* Entry/Exit animations for cycling */
.feature-card.cycling-out {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
  transition: all 0.3s ease-out;
}

.feature-card.cycling-in {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
  animation: cycleIn 0.5s ease-out forwards;
}

@keyframes cycleIn {
  from {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Floating animation during normal display */
@keyframes floatSubtle {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(0.5deg); }
  50% { transform: translateY(-2px) rotate(0deg); }
  75% { transform: translateY(-6px) rotate(-0.5deg); }
}`,

  gridLayout: `
/* 3-column grid layout (unchanged for desktop) */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2xl);
}

/* Mobile layout - single column */
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}`,
};

console.log("📋 3-Card Feature System Updates Defined");
console.log("🎯 Key Changes:");
console.log("   - Always display exactly 3 cards");
console.log("   - Individual cycling (one out, one in)");
console.log("   - Floating animations between cycles");
console.log("   - Entry/exit animations during cycling");
console.log("   - Updated cycling indicator");

export { FEATURE_CARD_UPDATES, CSS_UPDATES };
