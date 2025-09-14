// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll(".feature-card");
const indicators = document.querySelectorAll(".indicator");
const track = document.getElementById("carouselTrack");

function showSlide(index) {
  currentSlide = index;
  track.style.transform = `translateX(-${index * 100}%)`;

  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

// Auto-rotate carousel
setInterval(nextSlide, 5000);

// Manual indicator controls
indicators.forEach((indicator, index) => {
  indicator.addEventListener("click", () => {
    showSlide(index);
  });
});

// Modal triggers (extracted modals)
const loginBtn = document.getElementById("loginBtn");
const requestSupportBtn = document.getElementById("requestSupportBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (window.openLoginModal) {
      window.openLoginModal();
    } else {
      console.warn("Login modal script not loaded");
    }
  });
}

if (requestSupportBtn) {
  requestSupportBtn.addEventListener("click", () => {
    if (window.openServiceRequestModal) {
      window.openServiceRequestModal();
    } else {
      console.warn("Service request modal script not loaded");
    }
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Feature card buttons
document.querySelectorAll(".feature-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    (async () => {
      try {
        if (window.ensureNotifications) {
          await window.ensureNotifications();
        } else if (!window.TANotification) {
          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "/frontend/shared/scripts/components/notification.js";
            s.onload = () => resolve();
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        if (window.TANotification) {
          window.TANotification.info("Feature details coming soon! (Demo)", {
            title: "Info",
            duration: 3000,
          });
        }
      } catch {}
    })();
  });
});
