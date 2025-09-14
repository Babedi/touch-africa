// Templates page: load stats and list using TouchAfricaApiClient (cultivarTemplates)
(function () {
  const totalEl = document.getElementById("templates-total");
  const activeEl = document.getElementById("templates-active");
  const draftEl = document.getElementById("templates-draft");
  const templatesGrid = document.getElementById("templates-grid");
  const searchInput = document.querySelector(".page-templates .search-input");
  const clearBtn = document.querySelector(".page-templates .btn-clear");
  const pageSizeSelect = document.getElementById("templates-page-size");
  const sortSelect = document.getElementById("templates-sort");
  const pageInfo = document.getElementById("templates-page-info");
  const btnFirst = document.getElementById("templates-first");
  const btnPrev = document.getElementById("templates-prev");
  const btnNext = document.getElementById("templates-next");
  const btnLast = document.getElementById("templates-last");

  const state = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: null,
    order: "asc",
  };

  const SORT_STORAGE_KEY = "templates.sortSpec";

  // Sample template data with reliable image URLs
  const sampleTemplates = [
    {
      id: 1,
      name: "Beefsteak Tomato",
      category: "Vegetables",
      subcategory: "Tomatoes",
      description:
        "Large, meaty tomatoes perfect for slicing. Rich flavor and excellent for sandwiches and salads.",
      cycleTime: "75-85 days",
      image:
        "https://images.unsplash.com/photo-1546470427-e5ac89c8589a?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 2,
      name: "Butternut Squash",
      category: "Vegetables",
      subcategory: "Squash",
      description:
        "Sweet, nutty flavored winter squash with orange flesh. Excellent storage qualities.",
      cycleTime: "100-120 days",
      image:
        "https://images.unsplash.com/photo-1570586166260-8b0c51fa5be6?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 3,
      name: "Sweet Corn Golden Bantam",
      category: "Vegetables",
      subcategory: "Corn",
      description:
        "Traditional yellow sweet corn with excellent flavor. Early maturing variety.",
      cycleTime: "65-75 days",
      image:
        "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 4,
      name: "English Cucumber",
      category: "Vegetables",
      subcategory: "Cucumbers",
      description:
        "Long, smooth skinned cucumbers with crisp texture and mild flavor.",
      cycleTime: "55-65 days",
      image:
        "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 5,
      name: "Red Bell Pepper",
      category: "Vegetables",
      subcategory: "Peppers",
      description:
        "Sweet, thick-walled red peppers perfect for fresh eating or cooking.",
      cycleTime: "70-80 days",
      image:
        "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 6,
      name: "Baby Spinach",
      category: "Leafy Greens",
      subcategory: "Spinach",
      description:
        "Tender baby spinach leaves perfect for salads and quick cooking.",
      cycleTime: "30-40 days",
      image:
        "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 7,
      name: "Purple Top Turnip",
      category: "Root Vegetables",
      subcategory: "Turnips",
      description:
        "Classic turnip variety with white flesh and purple shoulders. Excellent for storage.",
      cycleTime: "50-60 days",
      image:
        "https://images.unsplash.com/photo-1609501676725-7186f4bc2c90?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 8,
      name: "Green Bean Bush",
      category: "Legumes",
      subcategory: "Beans",
      description:
        "Compact bush-type green beans with tender pods. No staking required.",
      cycleTime: "50-60 days",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 9,
      name: "Sunflower Mammoth",
      category: "Flowers",
      subcategory: "Sunflowers",
      description:
        "Giant sunflowers reaching up to 12 feet tall with large yellow blooms.",
      cycleTime: "90-120 days",
      image:
        "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 10,
      name: "Watermelon Sugar Baby",
      category: "Fruits",
      subcategory: "Melons",
      description:
        "Small, round watermelons with dark green skin and sweet red flesh.",
      cycleTime: "80-90 days",
      image:
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 11,
      name: "Carrot Nantes",
      category: "Root Vegetables",
      subcategory: "Carrots",
      description:
        "Classic orange carrots with cylindrical shape and sweet flavor.",
      cycleTime: "70-80 days",
      image:
        "https://images.unsplash.com/photo-1582515073490-39981397c445?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 12,
      name: "Lettuce Buttercrunch",
      category: "Leafy Greens",
      subcategory: "Lettuce",
      description:
        "Crispy lettuce with buttery texture and excellent heat tolerance.",
      cycleTime: "45-55 days",
      image:
        "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 13,
      name: "Radish Cherry Belle",
      category: "Root Vegetables",
      subcategory: "Radishes",
      description:
        "Small, round red radishes with crisp white flesh and mild flavor.",
      cycleTime: "25-30 days",
      image:
        "https://images.unsplash.com/photo-1584543737151-6e4b999deec8?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 14,
      name: "Pumpkin Atlantic Giant",
      category: "Vegetables",
      subcategory: "Pumpkins",
      description:
        "Giant pumpkins that can reach over 100 pounds. Perfect for competitions.",
      cycleTime: "120-140 days",
      image:
        "https://images.unsplash.com/photo-1539818181019-0ae8405fda14?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 15,
      name: "Herb Basil Sweet",
      category: "Herbs",
      subcategory: "Basil",
      description:
        "Classic sweet basil with large, aromatic leaves perfect for cooking.",
      cycleTime: "60-75 days",
      image:
        "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 16,
      name: "Cabbage Copenhagen",
      category: "Vegetables",
      subcategory: "Cabbage",
      description:
        "Round, compact cabbage heads with excellent keeping quality.",
      cycleTime: "70-80 days",
      image:
        "https://images.unsplash.com/photo-1594282432163-5c36f2393e54?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 17,
      name: "Broccoli Green Magic",
      category: "Vegetables",
      subcategory: "Broccoli",
      description: "Heat-tolerant broccoli with tight, dark green heads.",
      cycleTime: "60-70 days",
      image:
        "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 18,
      name: "Zucchini Black Beauty",
      category: "Vegetables",
      subcategory: "Squash",
      description: "Prolific zucchini with dark green skin and tender flesh.",
      cycleTime: "50-60 days",
      image:
        "https://images.unsplash.com/photo-1566558608692-39ce016b8457?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 19,
      name: "Onion Yellow Sweet Spanish",
      category: "Vegetables",
      subcategory: "Onions",
      description:
        "Large, mild-flavored yellow onions with excellent storage life.",
      cycleTime: "110-120 days",
      image:
        "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
    {
      id: 20,
      name: "Swiss Chard Rainbow",
      category: "Leafy Greens",
      subcategory: "Chard",
      description:
        "Colorful chard with stems in red, yellow, and orange. Nutritious and beautiful.",
      cycleTime: "50-60 days",
      image:
        "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=400&h=200&fit=crop&crop=center",
      status: "Active",
    },
  ];

  function saveSortSpec() {
    try {
      localStorage.setItem(
        SORT_STORAGE_KEY,
        JSON.stringify({
          primary: state.sortBy,
          order: state.order,
        })
      );
    } catch (_) {}
  }
  function restoreSortSpec() {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (!raw) return;
      const spec = JSON.parse(raw);
      if (spec && spec.primary) {
        state.sortBy = spec.primary;
        state.order = spec.order || "asc";
      }
    } catch (_) {}
  }

  function setValue(el, value) {
    if (!el) return;
    if (typeof value === "number") el.textContent = value.toLocaleString();
    else if (typeof value === "string" && value) el.textContent = value;
    else el.textContent = "—";
  }

  async function getApi() {
    // Use TouchAfricaApiClient for consistency with other pages/modals
    if (window.apiClientInstance) return window.apiClientInstance;

    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;

    window.apiClientInstance = new TouchAfricaApiClient({ baseUrl, token });
    return window.apiClientInstance;
  }

  async function loadStats() {
    try {
      // Use sample data for stats
      const total = sampleTemplates.length;
      const active = sampleTemplates.filter(
        (t) => t.status === "Active"
      ).length;
      const draft = sampleTemplates.filter((t) => t.status === "Draft").length;

      setValue(totalEl, total);
      setValue(activeEl, active);
      setValue(draftEl, draft);
    } catch (err) {
      console.error("[Templates] stats error", err);
      setValue(totalEl, "Error");
      setValue(activeEl, "—");
      setValue(draftEl, "—");
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString();
    } catch (_) {
      return String(iso);
    }
  }

  function renderCards(items) {
    if (!templatesGrid) return;
    if (!Array.isArray(items) || items.length === 0) {
      templatesGrid.innerHTML =
        '<div class="col-12 text-center"><p>No templates found</p></div>';
      return;
    }

    templatesGrid.innerHTML = items
      .map((template) => {
        const name = template.name || "Unnamed Template";
        const category = template.category || "Uncategorized";
        const subcategory = template.subcategory || "";
        const description = template.description || "No description available";
        const cycleTime = template.cycleTime || "Unknown";
        const image =
          template.image || "/frontend/shared/assets/images/place-holder.png";
        const status = template.status || "Active";

        return `
          <div class="template-card" data-template-id="${template.id}">
            <img src="${image}" alt="${name}" class="template-card-image">
            <div class="template-card-content">
              <h4 class="template-card-title">${name}</h4>
              <div class="template-card-meta">
                <span class="template-card-category">${category}</span>
                ${
                  subcategory
                    ? `<span class="template-card-subcategory">${subcategory}</span>`
                    : ""
                }
              </div>
              <p class="template-card-description">${description}</p>
              <div class="template-card-cycle">
                <i class="fas fa-clock"></i>
                <span>Cycle time: ${cycleTime}</span>
              </div>
              <div class="template-card-actions">
                <div class="template-card-actions-left">
                  <button class="btn btn-activate btn-sm" data-template-id="${
                    template.id
                  }" data-action="activate">
                    <i class="fas fa-play"></i> Activate
                  </button>
                </div>
                <div class="template-card-actions-right">
                  <button class="btn btn-view btn-sm" data-template-id="${
                    template.id
                  }" data-action="view">
                    <i class="fas fa-eye"></i> View
                  </button>
                  <button class="btn btn-edit btn-sm" data-template-id="${
                    template.id
                  }" data-action="edit">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Add event listeners for template action buttons
    addTemplateActionListeners();
  }

  function addTemplateActionListeners() {
    if (!templatesGrid) return;

    // Remove existing listeners to prevent duplicates
    templatesGrid.removeEventListener("click", handleTemplateAction);
    templatesGrid.removeEventListener("error", handleImageError, true);

    // Add event delegation for all template action buttons
    templatesGrid.addEventListener("click", handleTemplateAction);

    // Add event delegation for image error handling (using capture phase)
    templatesGrid.addEventListener("error", handleImageError, true);
  }

  function handleTemplateAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const templateId = parseInt(button.dataset.templateId);
    const action = button.dataset.action;

    switch (action) {
      case "activate":
        activateTemplate(templateId);
        break;
      case "view":
        viewTemplate(templateId);
        break;
      case "edit":
        editTemplate(templateId);
        break;
    }
  }

  function handleImageError(event) {
    // Check if the error is from a template card image
    if (
      event.target.tagName === "IMG" &&
      event.target.classList.contains("template-card-image")
    ) {
      // Prevent infinite error loops
      event.target.onerror = null;

      // Set placeholder image
      event.target.src = "/frontend/shared/assets/images/place-holder.png";

      // Optional: Add visual indicator that fallback was used
      event.target.style.opacity = "0.8";
      event.target.title = "Image failed to load - showing placeholder";
    }
  }

  function updatePager(meta) {
    const { page, pages, total, limit } = meta || state;
    if (pageInfo)
      pageInfo.textContent = `Page ${page} of ${pages} • ${total} total`;
    if (btnFirst) btnFirst.disabled = page <= 1;
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= pages;
    if (btnLast) btnLast.disabled = page >= pages;
    if (pageSizeSelect) {
      const val = String(limit || state.limit);
      if (pageSizeSelect.value !== val) pageSizeSelect.value = val;
    }
  }

  function getSortableHeaders() {
    // Cards don't use table headers for sorting, return empty array
    return [];
  }
  function normalizeSortField(th) {
    if (!th) return null;
    const raw = (th.getAttribute("data-sort") || "").trim();
    if (!raw) return null;
    const candidates = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return candidates[0] || null;
  }
  function updateSortHeaderIndicators() {
    // Cards don't use table headers for sorting, so no indicators to update
    return;
  }
  function wireSorting() {
    // Cards don't use table header sorting, so no wiring needed
    return;
  }
  async function loadTemplates({
    page = state.page,
    limit = state.limit,
    q = state.q,
    sortBy = state.sortBy,
    order = state.order,
  } = {}) {
    if (!templatesGrid) return;
    templatesGrid.innerHTML =
      '<div class="col-12 text-center"><p>Loading…</p></div>';

    try {
      // Filter sample data based on search query
      let items = sampleTemplates;
      if (q && q.trim()) {
        const searchTerm = q.toLowerCase().trim();
        items = sampleTemplates.filter(
          (template) =>
            template.name.toLowerCase().includes(searchTerm) ||
            template.category.toLowerCase().includes(searchTerm) ||
            template.subcategory.toLowerCase().includes(searchTerm) ||
            template.description.toLowerCase().includes(searchTerm)
        );
      }

      // Sort the items if sortBy is specified
      if (sortBy) {
        items = [...items].sort((a, b) => {
          let aVal = a[sortBy] || "";
          let bVal = b[sortBy] || "";

          // Handle sorting by name
          if (sortBy === "name" || sortBy === "templateName") {
            aVal = a.name || "";
            bVal = b.name || "";
          }

          if (typeof aVal === "string") {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }

          if (order === "desc") {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
          } else {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          }
        });
      }

      // Calculate pagination
      const total = items.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = items.slice(startIndex, endIndex);

      // Update state
      state.page = page;
      state.limit = limit;
      state.pages = pages;
      state.total = total;

      // Render the cards
      renderCards(paginatedItems);
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    } catch (err) {
      console.error("[Templates] load error", err);
      templatesGrid.innerHTML =
        '<div class="col-12 text-center"><p>Error loading templates</p></div>';
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    }
  }

  function init() {
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    state.limit = initLimit;
    restoreSortSpec();
    loadStats();
    wireSorting();
    loadTemplates({
      page: 1,
      limit: initLimit,
      sortBy: state.sortBy,
      order: state.order,
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = searchInput.value.trim();
        state.q = q;
        loadTemplates({ page: 1, limit: state.limit, q });
      }, 300);
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.q = "";
      loadTemplates({ page: 1, limit: state.limit });
    });
  }

  if (pageSizeSelect)
    pageSizeSelect.addEventListener("change", () => {
      const newLimit = Number(pageSizeSelect.value) || 20;
      state.limit = newLimit;
      loadTemplates({ page: 1, limit: newLimit, q: state.q });
    });

  if (sortSelect)
    sortSelect.addEventListener("change", () => {
      const sortBy = sortSelect.value;
      state.sortBy = sortBy;
      state.order = "asc";
      saveSortSpec();
      loadTemplates({
        page: 1,
        limit: state.limit,
        q: state.q,
        sortBy: state.sortBy,
        order: state.order,
      });
    });

  if (btnFirst)
    btnFirst.addEventListener("click", () => {
      if (state.page > 1)
        loadTemplates({ page: 1, limit: state.limit, q: state.q });
    });
  if (btnPrev)
    btnPrev.addEventListener("click", () => {
      if (state.page > 1)
        loadTemplates({ page: state.page - 1, limit: state.limit, q: state.q });
    });
  if (btnNext)
    btnNext.addEventListener("click", () => {
      if (state.page < state.pages)
        loadTemplates({ page: state.page + 1, limit: state.limit, q: state.q });
    });
  if (btnLast)
    btnLast.addEventListener("click", () => {
      if (state.page < state.pages)
        loadTemplates({ page: state.pages, limit: state.limit, q: state.q });
    });

  // Template action functions
  function activateTemplate(templateId) {
    const template = sampleTemplates.find((t) => t.id === templateId);
    if (template) {
      alert(`Activating template: ${template.name}`);
      // Here you would typically make an API call to activate the template
      console.log("Activate template:", template);
    }
  }

  function viewTemplate(templateId) {
    const template = sampleTemplates.find((t) => t.id === templateId);
    if (template) {
      alert(
        `Viewing template: ${template.name}\n\nCategory: ${template.category}\nSubcategory: ${template.subcategory}\nDescription: ${template.description}\nCycle Time: ${template.cycleTime}`
      );
      // Here you would typically open a view modal or navigate to a details page
      console.log("View template:", template);
    }
  }

  function editTemplate(templateId) {
    const template = sampleTemplates.find((t) => t.id === templateId);
    if (template) {
      alert(`Editing template: ${template.name}`);
      // Here you would typically open an edit modal or navigate to an edit page
      console.log("Edit template:", template);
    }
  }
})();
