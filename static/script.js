const toggle = document.querySelector(".toggle");
const sun =
	'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--fluent" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 10 2Zm0 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm0-1a3 3 0 1 1 0-6a3 3 0 0 1 0 6Zm7.5-2.5a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1h1ZM10 16a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5Zm-6.5-5.5a.5.5 0 0 0 0-1H2.463a.5.5 0 0 0 0 1H3.5Zm.646-6.354a.5.5 0 0 1 .708 0l1 1a.5.5 0 1 1-.708.708l-1-1a.5.5 0 0 1 0-.708Zm.708 11.708a.5.5 0 0 1-.708-.708l1-1a.5.5 0 0 1 .708.708l-1 1Zm11-11.708a.5.5 0 0 0-.708 0l-1 1a.5.5 0 0 0 .708.708l1-1a.5.5 0 0 0 0-.708Zm-.708 11.708a.5.5 0 0 0 .708-.708l-1-1a.5.5 0 0 0-.708.708l1 1Z"></path></svg>';
const moon =
	'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--ph" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 256"><path fill="currentColor" d="M222.4 150.9a6.1 6.1 0 0 0-5.7-4.3h-.1l-1.7.3A86 86 0 0 1 109.1 41.1a6.8 6.8 0 0 0 .2-1.4a5.8 5.8 0 0 0-3.7-5.9a6.1 6.1 0 0 0-4-.2a98 98 0 1 0 120.8 120.7a6.5 6.5 0 0 0 0-3.4ZM128 214A86 86 0 0 1 95.2 48.5a98.1 98.1 0 0 0 112.3 112.3A86.1 86.1 0 0 1 128 214Z"></path></svg>';

toggle.addEventListener("click", () => {
	const root = document.querySelector(":root");
	root.classList.toggle("dark");
	if (root.classList.contains("dark")) {
		toggle.innerHTML = sun;
		// experimental feature: toggle.setHTML(sun)
	} else {
		toggle.innerHTML = moon;
		// experimental feature: toggle.setHTML(moon)
	}
});

document.addEventListener("click", (event) => {
	const actionButton = event.target.closest("[data-action]");

	if (actionButton) {
		actionButton.closest("article").classList.toggle("expanded");
	}
});

const timestamp = document.getElementById("build-timestamp");
timestamp.innerText = new Date(
	timestamp.getAttribute("datetime"),
).toLocaleString();

// Click btn, toggle details
const collapse =
	'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--bi" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zm7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0zm-.5 11.707l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0v-3.793z"></path></svg>';
const expand =
	'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--bi" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8zM7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10z"></path></svg>';
const details = document.querySelectorAll(".site-expander");
const toggle_details = document.querySelector(".toggle-details");

toggle_details.addEventListener("click", () => {
	for (const detail of details) {
		if (detail.hasAttribute("open")) {
			detail.removeAttribute("open");
			toggle_details.innerHTML = expand;
			// experimental feature: toggle_details.setHTML(expand)
		} else {
			detail.setAttribute("open", "");
			toggle_details.innerHTML = collapse;
			// experimental feature: toggle_details.setHTML(collapse)
		}
	}
});

// linkiyfjs
for (const $ of document.querySelectorAll("article .summary-description")) {
	linkifyElement($, { attributes: { target: "_blank", rel: "noreferrer" } });
}
