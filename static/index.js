closeAccordionByIds(getClosedAccordionIdsFromStorage());
handleAllClickEvents();
renderBuildTimestamp();
renderWeekday();
initializeSavedArticles();

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
      }
    }
  });
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

// Get all saved articles from KV
async function getSavedArticlesFromStorage() {
  const response = await fetch(getApiUrl());
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return Array.isArray(data.articles) ? data.articles : [];
}

// Check if article is saved
async function isArticleSaved(articleId) {
  const savedArticles = await getSavedArticlesFromStorage();
  return savedArticles.some((article) => article.id === articleId);
}

// Save article to KV directly
async function saveArticle(articleData) {
  const response = await fetch(getApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      article: articleData,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  updateSavedArticlesUI();
  updateSaveButtonState(articleData.id, true);
}

// Remove article from KV
async function removeSavedArticle(articleId) {
  const response = await fetch(
    `${getApiUrl()}?articleId=${encodeURIComponent(articleId)}`,
    {
      method: "DELETE",
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
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
    const saved = await isArticleSaved(articleId);
    
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