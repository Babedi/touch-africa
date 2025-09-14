/**
 * Simple inline script to style asterisks in required field labels
 * Add this to modal JavaScript files or include in modal initialization
 */

// Function to style asterisks in labels
function styleRequiredAsterisks() {
  // Find all labels in the current modal/context
  const labels = document.querySelectorAll("label, .form-label");

  labels.forEach((label) => {
    // Check if label text contains asterisk
    if (label.innerHTML && label.innerHTML.includes("*")) {
      // Replace asterisk with styled span
      label.innerHTML = label.innerHTML.replace(
        /\*/g,
        '<span class="asterisk-highlight">*</span>'
      );
    }
  });
}

// Auto-run when script is loaded
styleRequiredAsterisks();

// Export for manual use
if (typeof window !== "undefined") {
  window.styleRequiredAsterisks = styleRequiredAsterisks;
}
