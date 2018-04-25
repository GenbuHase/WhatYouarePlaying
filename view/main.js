const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const pricacySelector = document.getElementById("privacy");
const saveBtn = document.getElementById("btns_save");
const closeBtn = document.getElementById("btns_close");

window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
});

window.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.get(["instance", "token", "privacy"], item => {
		if (item.instance) instanceInputter.value = item.instance;
		if (item.token) tokenInputter.value = item.token;
		if (item.privacy) pricacySelector.namedItem(`privacy.${item.privacy}`).selected = true;

		M.updateTextFields();
		M.FormSelect.init(pricacySelector);
	});

	saveBtn.addEventListener("click", () => {
		chrome.storage.local.set({
			instance: instanceInputter.value,
			token: tokenInputter.value,
			privacy: pricacySelector.value
		});
	});

	closeBtn.addEventListener("click", () => {
		window.close();
	});
});