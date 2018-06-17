const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const pricacySelector = document.getElementById("privacy");
const enabledSwitch = document.getElementById("enabled");
const saveBtn = document.getElementById("btns_save");
const closeBtn = document.getElementById("btns_close");



/**
 * Detects a type of provided instance's url
 * 
 * @param {String} instance
 * @return {Promise<"MASTODON" | "MISSKEY" | "NONE">}
 */
const detectInstanceType = (instance) => {
	//Misskey's API
	return fetch(`${instance}/api/stats`, {
		method: "POST"
	}).then(res => {
		if (res.ok) return "MISSKEY";

		//Mastodon's API
		return fetch(`${instance}/api/v1/instance`).then(res => {
			if (res.ok) return "MASTODON";
			
			throw "";
		});
	}).catch(() => "NONE");
};

/**
 * Throws an error with a notification
 * @param {String} errorKey
 */
const throwError = errorKey => {
	M.toast({ html: definedMessages[errorKey].message.replace(/\r?\n/g, "<Br />"), classes: "red darken-2" });
	throw definedMessages[errorKey].message;
};



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
		const instance = instanceInputter.value;

		detectInstanceType(instance).then(type => {
			if (type === "NONE") throwError("error_UnacceptableInstance");

			chrome.storage.local.set({ type });
		}).then(() => {
			chrome.storage.local.set({
				instance,
				token: tokenInputter.value,
				privacy: pricacySelector.value
			});
	
			window.close();
		});
	});

	closeBtn.addEventListener("click", () => {
		window.close();
	});
});