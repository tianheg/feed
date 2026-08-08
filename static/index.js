/**
 * ====== THEME ======
 */

const THEME_KEY = "theme";
const THEME_QUERY = "(prefers-color-scheme: dark)";

// Show the back-to-top button once the page is scrolled past this many px.
const BACK_TO_TOP_THRESHOLD = 600;

// Saved-articles in-memory cache (declared at top: init runs before the
// saved-articles section is defined, and `let` has a temporal dead zone).
let savedArticlesCache = null;

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    /* private mode — ignore */
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const button = document.querySelector("[data-action='toggle-theme']");
  if (button) {
    button.textContent = theme === "dark" ? "Light" : "Dark";
    button.setAttribute("title", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
}

function resolveInitialTheme() {
  const stored = getStoredTheme();
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.(THEME_QUERY)?.matches ? "dark" : "light";
}

/**
 * Set up the theme toggle. The inline <head> script already applied
 * the initial data-theme attribute (before CSS loads, avoids FOUC);
 * here we sync the button label and keep the system preference in sync
 * when the user hasn't made an explicit choice.
 */
function initTheme() {
  const stored = getStoredTheme();
  applyTheme(resolveInitialTheme());
  if (!stored && window.matchMedia) {
    window.matchMedia(THEME_QUERY).addEventListener("change", (event) => {
      if (!getStoredTheme()) applyTheme(event.matches ? "dark" : "light");
    });
  }
}

function handleToggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setStoredTheme(next);
  applyTheme(next);
}

closeAccordionByIds(getClosedAccordionIdsFromStorage());
handleAllClickEvents();
renderBuildTimestamp();
renderWeekday();
initGroupFilter();
applyGroupFromUrl();
initArticleSearch();
initTheme();
initializeSavedArticles();
initBackToTop();

/**
 * ====== UTILS ======
 **/

function getClosedAccordionIdsFromPage() {
  /**
   * @type {HTMLDetailsElement[]}
   */
  const accordions = [...document.querySelectorAll("[data-accordion-key]")];
  const ids = accordions
    .filter((element) => !element.open)
    .map((element) => element.getAttribute("data-accordion-key"));
  return [...new Set(ids)];
}

function closeAccordionByIds(ids) {
  ids.forEach((id) => {
    const element = document.querySelector(`[data-accordion-key="${id}"]`);
    if (element) element.open = false;
  });
}

function storeClosedAccordionIds(ids) {
  localStorage.setItem("closedAccordionIds", JSON.stringify(ids));
}

function getClosedAccordionIdsFromStorage() {
  const stateString = localStorage.getItem("closedAccordionIds");
  try {
    const parsed = JSON.parse(stateString);
    if (!parsed?.length) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Add a few event handlers as possible to ensure healthy performance scaling
 */
function handleAllClickEvents() {
  document.addEventListener("click", (event) => {
    // Check for save article button first (before other accordion handlers)
    const saveButton = event.target.closest("[data-action='save-article']");
    if (saveButton) {
      event.preventDefault();
      event.stopPropagation();
      handleSaveArticle(event);
      return;
    }

    // Check for remove saved article button
    const removeButton = event.target.closest("[data-action='remove-saved-article']");
    if (removeButton) {
      event.preventDefault();
      event.stopPropagation();
      handleRemoveSavedArticle(event);
      return;
    }

    // Activate daily title as expanders
    const action = event.target.closest("[data-action]");
    if (action) {
      switch (action.getAttribute("data-action")) {
        case "toggle-accordions":
          handleToggleAccordions(event);
          break;
        case "toggle-native-accordion":
          handleToggleNativeAccordion(event);
          break;
        case "toggle-saved-articles":
          handleToggleSavedArticles(event);
          break;
        case "filter-group":
          handleGroupFilter(event);
          break;
        case "export-saved-articles":
          handleExportSavedArticles(event);
          break;
        case "toggle-theme":
          handleToggleTheme(event);
          break;
        case "back-to-top":
          handleBackToTop(event);
          break;
      }
    }
  });
}

/**
 * ====== BACK TO TOP ======
 */

/**
 * Show the floating back-to-top button once the user scrolls past
 * a threshold. Scroll listener is passive + rAF-throttled.
 */
function initBackToTop() {
  const button = document.querySelector("[data-action='back-to-top']");
  if (!button) return;
  let ticking = false;

  const update = () => {
    button.classList.toggle("is-visible", window.scrollY > BACK_TO_TOP_THRESHOLD);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
}

/**
 * @param {Event} event
 */
function handleBackToTop(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * @param {KeyboardEvent=} event
 */
function handleToggleAccordions(event) {
  // when ctrl is held, toggle every accordion in the document
  const scope = event?.ctrlKey ? document : event.target.closest(".js-toggle-accordions-scope");
  const detailsElements = [...scope.querySelectorAll("details")];
  const isAnyOpen = detailsElements.some((element) => element.open);
  detailsElements.forEach((element) => (element.open = !isAnyOpen));

  storeClosedAccordionIds(getClosedAccordionIdsFromPage());
}

/**
 * @param {KeyboardEvent=} event
 */
function handleToggleNativeAccordion() {
  // wait until event settled
  setTimeout(() => storeClosedAccordionIds(getClosedAccordionIdsFromPage()), 0);
}

/**
 * Download all saved articles as a JSON file.
 */
async function handleExportSavedArticles(event) {
  event.preventDefault();
  event.stopPropagation();
  try {
    const savedArticles = await getSavedArticlesFromStorage();
    if (!savedArticles.length) {
      alert("没有已保存的文章");
      return;
    }
    const blob = new Blob([JSON.stringify(savedArticles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-articles-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting saved articles:", error);
    alert("导出失败：" + error.message);
  }
}

/**
 * Collect group labels from rendered sources and build filter buttons.
 */
function initGroupFilter() {
  const nav = document.getElementById("group-filter");
  if (!nav) return;
  const groups = new Set();
  document.querySelectorAll("[data-group]").forEach((el) => {
    const g = el.getAttribute("data-group");
    if (g) groups.add(g);
  });
  if (groups.size <= 1) return; // no meaningful grouping

  const all = document.createElement("button");
  all.className = "group-filter__btn group-filter__btn--active";
  all.dataset.action = "filter-group";
  all.dataset.group = "";
  all.textContent = "All";
  nav.appendChild(all);

  [...groups].sort().forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "group-filter__btn";
    btn.dataset.action = "filter-group";
    btn.dataset.group = g;
    btn.textContent = g;
    nav.appendChild(btn);
  });
}

/**
 * @param {Event} event
 */
function handleGroupFilter(event) {
  const btn = event.target.closest("[data-group]");
  if (!btn) return;
  const group = btn.getAttribute("data-group");
  // 跳转到对应的分组页面（URL 带 ?group= 参数），而不是原地过滤
  if (!group) {
    // All: 只清 query，保留当前路径
    if (window.location.search) window.location.search = "";
    return;
  }
  const url = `?group=${encodeURIComponent(group)}`;
  if (window.location.search === url) return;
  window.location.href = url;
}

/**
 * 从 URL 的 ?group= 参数恢复分组视图（支持分享链接/前进后退）。
 * 无参数时保持 All 全量视图。
 */
function applyGroupFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const group = params.get("group") ?? "";
  if (!group) return;

  // 激活对应按钮
  document.querySelectorAll(".group-filter__btn").forEach((b) => {
    b.classList.toggle("group-filter__btn--active", b.getAttribute("data-group") === group);
  });

  // 过滤 source 区块，只显示目标分组
  document.querySelectorAll("[data-group]").forEach((el) => {
    const elGroup = el.getAttribute("data-group");
    const li = el.closest("li.card__section");
    if (!li) return;
    li.style.display = group === elGroup ? "" : "none";
  });

  // 隐藏空日期区块
  document.querySelectorAll("section.daily-content").forEach((day) => {
    const hasVisible = [...day.querySelectorAll("li.card__section")].some(
      (li) => li.style.display !== "none"
    );
    day.style.display = hasVisible ? "" : "none";
  });

  // 页面顶部
  window.scrollTo(0, 0);
}

/**
 * Wire up the title search input. Filters articles by substring match,
 * then hides source sections / days that end up empty.
 */
function initArticleSearch() {
  const input = document.getElementById("article-search");
  if (!input) return;
  input.addEventListener("input", () => applyArticleSearch());
}

function applyArticleSearch() {
  const input = document.getElementById("article-search");
  const query = input ? input.value.trim().toLowerCase() : "";
  const activeGroup = document.querySelector(".group-filter__btn--active")?.getAttribute("data-group") ?? "";

  document.querySelectorAll(".article-item").forEach((article) => {
    const titleEl = article.querySelector(".article-title-text");
    const title = titleEl ? titleEl.textContent.toLowerCase() : "";
    article.style.display = !query || title.includes(query) ? "" : "none";
  });

  // Show/hide source sections: visible only when its group matches the active
  // group filter (if any) AND it has at least one article matching the search.
  document.querySelectorAll("li.card__section").forEach((li) => {
    const groupEl = li.querySelector("[data-group]");
    const elGroup = groupEl ? groupEl.getAttribute("data-group") : "";
    const groupMatches = !activeGroup || elGroup === activeGroup;
    const hasVisible = [...li.querySelectorAll(".article-item")].some((a) => a.style.display !== "none");
    li.style.display = groupMatches && hasVisible ? "" : "none";
  });

  // Hide empty daily sections
  document.querySelectorAll("section.daily-content").forEach((day) => {
    const hasVisible = [...day.querySelectorAll("li.card__section")].some((li) => li.style.display !== "none");
    day.style.display = hasVisible ? "" : "none";
  });
}

/**
 * Convert machine readable timestamp to locale time
 */
function renderBuildTimestamp() {
  const timestamp = document.getElementById("build-timestamp");
  timestamp.innerText = new Date(timestamp.getAttribute("datetime")).toLocaleString();
}

/**
 * Convert the server timestamp to human readable weekday and dates.
 * Note: the server is responsible for shifting the date based on config file.
 * The client should parse the date as if it is in UTC timezone.
 */
function renderWeekday() {
  document.querySelectorAll(".js-offset-weekday").forEach((element) => {
    const weekday = new Date(element.getAttribute("data-offset-date")).toLocaleString(window.navigator.language, {
      weekday: "long",
      timeZone: "UTC",
    });
    element.innerText = weekday;
  });
  document.querySelectorAll(".js-offset-date").forEach((element) => {
    const date = new Date(element.getAttribute("data-offset-date")).toLocaleString(window.navigator.language, {
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
    element.innerText = date;
  });
}

/**
 * ====== SAVED ARTICLES (Cloudflare KV) ======
 **/

// API endpoint base URL
function getApiUrl() {
  // Use relative URL for same domain
  return "/api/saved-articles";
}

// Auth token: read from ?token=xxx URL param on first visit, persist in localStorage
function getAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    localStorage.setItem("saved_articles_token", token);
    // Clean token from URL so it doesn't linger in history
    params.delete("token");
    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.replaceState({}, "", newUrl);
  }
  return localStorage.getItem("saved_articles_token") || "";
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

// Get all saved articles from KV
// Cached in memory: the list only changes through this page's own save/remove
// actions, so re-fetching on every render is wasted requests (saving one
// article used to fire 4 GETs). Mutations invalidate the cache.
async function getSavedArticlesFromStorage() {
  if (savedArticlesCache) return savedArticlesCache;
  const response = await fetch(getApiUrl());

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  savedArticlesCache = Array.isArray(data.articles) ? data.articles : [];
  return savedArticlesCache;
}

function invalidateSavedArticlesCache() {
  savedArticlesCache = null;
}

// Save article to KV directly
async function saveArticle(articleData) {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      article: articleData,
    }),
  });
  
  if (response.status === 401) {
    alert("未授权：请在 URL 后加 ?token=你的token 再保存");
    return;
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  invalidateSavedArticlesCache();
  updateSavedArticlesUI();
  updateSaveButtonState(articleData.id, true);
}

// Remove article from KV
async function removeSavedArticle(articleId) {
  const response = await fetch(
    `${getApiUrl()}?articleId=${encodeURIComponent(articleId)}`,
    {
      method: "DELETE",
      headers: {
        ...authHeaders(),
      },
    }
  );
  
  if (response.status === 401) {
    alert("未授权：请在 URL 后加 ?token=你的token 再操作");
    return;
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  invalidateSavedArticlesCache();
  updateSavedArticlesUI();
  updateSaveButtonState(articleId, false);
}

function updateSaveButtonState(articleId, isSaved) {
  const button = document.querySelector(`[data-article-id="${articleId}"].save-button`);
  if (button) {
    const textSpan = button.querySelector(".save-button-text");
    if (textSpan) {
      textSpan.textContent = isSaved ? "Saved" : "Save";
    }
    button.classList.toggle("saved", isSaved);
    button.setAttribute("title", isSaved ? "Remove from saved articles" : "Save for later");
  }
}

async function initializeSavedArticles() {
  try {
    const savedArticles = await getSavedArticlesFromStorage();
    updateSavedCount(savedArticles.length);
    
    // Update button states for all saved articles
    for (const article of savedArticles) {
      updateSaveButtonState(article.id, true);
    }
    
    await renderSavedArticles();
  } catch (error) {
    console.error("Error initializing saved articles:", error);
    updateSavedCount(0);
    const listElement = document.getElementById("saved-articles-list");
    const emptyElement = document.getElementById("saved-articles-empty");
    if (listElement && emptyElement) {
      listElement.innerHTML = "";
      emptyElement.style.display = "block";
    }
  }
}

function updateSavedCount(count) {
  const countElement = document.getElementById("saved-count");
  if (countElement) {
    countElement.textContent = count;
  }
}

async function renderSavedArticles() {
  const savedArticles = await getSavedArticlesFromStorage();
  const listElement = document.getElementById("saved-articles-list");
  const emptyElement = document.getElementById("saved-articles-empty");

  if (!listElement || !emptyElement) return;

  if (savedArticles.length === 0) {
    listElement.innerHTML = "";
    emptyElement.style.display = "block";
    return;
  }

  emptyElement.style.display = "none";
  listElement.innerHTML = savedArticles
    .map((article) => {
      const savedDate = new Date(article.savedAt).toLocaleDateString();
      return `
        <article class="saved-article-item">
          <div class="saved-article-header">
            <h3 class="saved-article-title">
              <a href="${escapeHtml(article.link)}" target="_blank" class="saved-article-link">
                ${escapeHtml(article.title)}
              </a>
            </h3>
            <button
              class="remove-saved-button"
              data-action="remove-saved-article"
              data-article-id="${escapeHtml(article.id)}"
              title="Remove from saved articles"
            >
              Remove
            </button>
          </div>
          <div class="saved-article-meta">
            <span class="saved-article-source">${escapeHtml(article.source || "Unknown")}</span>
            <span class="saved-article-date">Saved on ${savedDate}</span>
          </div>
          ${article.description ? `<p class="saved-article-description">${escapeHtml(article.description)}</p>` : ""}
        </article>
      `;
    })
    .join("");
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function handleSaveArticle(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.target.closest("[data-action='save-article']");
  if (!button) return;

  const articleId = button.getAttribute("data-article-id");
  if (!articleId) return;

  // Disable button while processing
  button.disabled = true;

  try {
    const savedArticles = await getSavedArticlesFromStorage();
    const saved = savedArticles.some((a) => a.id === articleId);
    
    if (saved) {
      await removeSavedArticle(articleId);
    } else {
      const articleData = {
        id: articleId,
        title: button.getAttribute("data-article-title") || "",
        link: button.getAttribute("data-article-link") || "",
        description: button.getAttribute("data-article-description") || "",
        imageUrl: button.getAttribute("data-article-image") || "",
        source: button.getAttribute("data-article-source") || "",
        date: button.getAttribute("data-article-date") || "",
      };
      await saveArticle(articleData);
    }
  } catch (error) {
    console.error("Error in handleSaveArticle:", error);
  } finally {
    button.disabled = false;
  }
}

async function handleToggleSavedArticles(event) {
  const section = document.getElementById("saved-articles-section");
  if (!section) return;

  const isVisible = section.style.display !== "none";
  section.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    await renderSavedArticles();
  }
}

function handleRemoveSavedArticle(event) {
  const button = event.target.closest("[data-action='remove-saved-article']");
  if (!button) return;

  const articleId = button.getAttribute("data-article-id");
  if (articleId) {
    removeSavedArticle(articleId);
  }
}

async function updateSavedArticlesUI() {
  const savedArticles = await getSavedArticlesFromStorage();
  updateSavedCount(savedArticles.length);
  await renderSavedArticles();
}