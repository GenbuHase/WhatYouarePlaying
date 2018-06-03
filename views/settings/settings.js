const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const pricacySelector = document.getElementById("privacy");
const enabledSwitch = document.getElementById("enabled");
const saveBtn = document.getElementById("btns_save");
const closeBtn = document.getElementById("btns_close");

window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
});

window.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.get(["enabled", "instance", "token", "privacy"], items => {
		if (items.enabled) enabledSwitch.checked = items.enabled;
		if (items.instance) instanceInputter.value = items.instance;
		if (items.token) tokenInputter.value = items.token;
		if (items.privacy) pricacySelector.namedItem(`privacy.${items.privacy}`).selected = true;
		
		M.updateTextFields();
		M.FormSelect.init(pricacySelector);
	});

	enabledSwitch.addEventListener("change", event => {
		const enabled = event.target.checked;

		chrome.storage.local.set({ enabled });
		chrome.browserAction.setBadgeText({ text: enabled ? "ON" : "OFF" });
	});

	saveBtn.addEventListener("click", () => {
		chrome.storage.local.set({
			instance: instanceInputter.value,
			token: tokenInputter.value,
			privacy: pricacySelector.value
		});

		window.close();
	});

	closeBtn.addEventListener("click", () => {
		window.close();
	});
});