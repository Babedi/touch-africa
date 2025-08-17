/**
 * Enhanced Contrast Applicator
 * Easily apply better color contrast to NeighbourGuard™ interface
 */

console.log("🎨 Enhanced Contrast Applicator");
console.log("===============================");

// Function to apply enhanced contrast
function applyEnhancedContrast() {
  console.log("🔧 Applying enhanced contrast styles...");

  // Check if already applied
  if (document.getElementById("enhanced-contrast-styles")) {
    console.log("⚠️ Enhanced contrast already applied");
    return;
  }

  // Create and apply enhanced contrast stylesheet
  const contrastLink = document.createElement("link");
  contrastLink.id = "enhanced-contrast-styles";
  contrastLink.rel = "stylesheet";
  contrastLink.href = "/shared/enhanced-contrast.css";

  contrastLink.onload = () => {
    console.log("✅ Enhanced contrast applied successfully");

    // Notify user
    if (window.notifications) {
      window.notifications.success(
        "Enhanced Contrast",
        "Better color contrast has been applied for improved visibility.",
        { duration: 3000 }
      );
    }

    // Log improvements
    console.log("🎯 Improvements applied:");
    console.log("  • Better password toggle visibility");
    console.log("  • Enhanced button contrast");
    console.log("  • Improved form field borders");
    console.log("  • Better notification colors");
    console.log("  • Stronger focus indicators");
    console.log("  • High contrast mode support");
  };

  contrastLink.onerror = () => {
    console.error("❌ Failed to load enhanced contrast styles");
  };

  document.head.appendChild(contrastLink);
}

// Function to remove enhanced contrast
function removeEnhancedContrast() {
  console.log("🔧 Removing enhanced contrast styles...");

  const existingLink = document.getElementById("enhanced-contrast-styles");
  if (existingLink) {
    existingLink.remove();
    console.log("✅ Enhanced contrast removed");

    if (window.notifications) {
      window.notifications.info(
        "Standard Contrast",
        "Original color scheme restored.",
        { duration: 2000 }
      );
    }
  } else {
    console.log("⚠️ Enhanced contrast was not applied");
  }
}

// Function to toggle enhanced contrast
function toggleEnhancedContrast() {
  const isApplied = document.getElementById("enhanced-contrast-styles");
  if (isApplied) {
    removeEnhancedContrast();
  } else {
    applyEnhancedContrast();
  }
}

// Function to test password toggle visibility
function testPasswordToggleVisibility() {
  console.log("🧪 Testing password toggle visibility...");

  const toggles = document.querySelectorAll(".password-toggle");
  console.log(`Found ${toggles.length} password toggle(s)`);

  toggles.forEach((toggle, index) => {
    const styles = window.getComputedStyle(toggle);
    const color = styles.color;
    const background = styles.backgroundColor;
    const border = styles.border;

    console.log(`Toggle ${index + 1}:`);
    console.log(`  Color: ${color}`);
    console.log(`  Background: ${background}`);
    console.log(`  Border: ${border}`);
    console.log(`  Visibility: ${styles.visibility}`);
    console.log(`  Display: ${styles.display}`);

    // Test if toggle is likely visible
    const hasColor = color !== "rgba(0, 0, 0, 0)" && color !== "transparent";
    const hasBorder = border !== "none" && !border.includes("0px");
    const hasBackground =
      background !== "rgba(0, 0, 0, 0)" && background !== "transparent";

    const isVisible = hasColor || hasBorder || hasBackground;
    console.log(`  Likely visible: ${isVisible ? "✅" : "❌"}`);
  });
}

// Function to create a quick contrast toggle button
function addContrastToggleButton() {
  console.log("🎛️ Adding contrast toggle button...");

  // Remove existing button if present
  const existing = document.getElementById("contrast-toggle-button");
  if (existing) existing.remove();

  const button = document.createElement("button");
  button.id = "contrast-toggle-button";
  button.innerHTML = "🎨 Toggle Contrast";
  button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s;
    `;

  button.onmouseover = () => {
    button.style.background = "#2563eb";
  };

  button.onmouseout = () => {
    button.style.background = "#3b82f6";
  };

  button.onclick = toggleEnhancedContrast;

  document.body.appendChild(button);
  console.log("✅ Contrast toggle button added to page");
}

// Export functions to global scope for easy console access
window.enhancedContrast = {
  apply: applyEnhancedContrast,
  remove: removeEnhancedContrast,
  toggle: toggleEnhancedContrast,
  testToggles: testPasswordToggleVisibility,
  addButton: addContrastToggleButton,
};

// Auto-detect and suggest improvements
function autoDetectContrastIssues() {
  console.log("🔍 Auto-detecting contrast issues...");

  const issues = [];

  // Check password toggles
  const toggles = document.querySelectorAll(".password-toggle");
  if (toggles.length > 0) {
    toggles.forEach((toggle, index) => {
      const styles = window.getComputedStyle(toggle);
      const color = styles.color;

      // Check if color is very light (potential visibility issue)
      if (
        color.includes("rgb(156, 163, 175)") ||
        color.includes("rgba(156, 163, 175")
      ) {
        issues.push(`Password toggle ${index + 1} has low contrast color`);
      }
    });
  }

  // Check if enhanced contrast is beneficial
  if (issues.length > 0) {
    console.log("⚠️ Contrast issues detected:");
    issues.forEach((issue) => console.log(`  • ${issue}`));
    console.log("");
    console.log("💡 Recommended actions:");
    console.log("  1. Run: enhancedContrast.apply()");
    console.log("  2. Or run: enhancedContrast.addButton()");
    console.log("  3. Test with: enhancedContrast.testToggles()");
  } else {
    console.log("✅ No obvious contrast issues detected");
  }

  return issues;
}

// Run auto-detection
setTimeout(autoDetectContrastIssues, 1000);

console.log("");
console.log("🎛️ Available commands:");
console.log("  enhancedContrast.apply()     - Apply enhanced contrast");
console.log("  enhancedContrast.remove()    - Remove enhanced contrast");
console.log("  enhancedContrast.toggle()    - Toggle enhanced contrast");
console.log(
  "  enhancedContrast.testToggles() - Test password toggle visibility"
);
console.log("  enhancedContrast.addButton() - Add toggle button to page");
