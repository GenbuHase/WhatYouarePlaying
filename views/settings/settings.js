const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const visibilitySelector = document.getElementById("visibility");
const enabledSwitch = document.getElementById("enabled");
const saveBtn = document.getElementById("btns_save");
const closeBtn = document.getElementById("btns_close");



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
	chrome.storage.local.get(["enabled", "type", "instance", "token", "visibility"], items => {
		const { enabled, type, instance, token, visibility } = items;

		if (enabled) enabledSwitch.checked = enabled;
		if (instance) instanceInputter.value = instance;
		if (token) tokenInputter.value = token;

		if (type && type !== Instance.Type.None) {
			for (let visibility of Instance.Visibility[type]) {
				const option = new Option(definedMessages[`setting_visibility_${type}_${visibility}`].message, visibility);
				option.setAttribute("Name", `visibility.${visibility}`);
				option.setAttribute("Locale-Message", `setting_visibility_${type}_${visibility}`);

				visibilitySelector.add(option);
			}
		}
		
		if (visibility && Instance.Visibility[type].includes(visibility)) visibilitySelector.namedItem(`visibility.${visibility}`).selected = true;
		
		M.updateTextFields();
		M.FormSelect.init(visibilitySelector);
	});

	enabledSwitch.addEventListener("change", event => {
		const enabled = event.target.checked;

		chrome.storage.local.set({ enabled });
		chrome.browserAction.setBadgeText({ text: enabled ? "ON" : "OFF" });
	});

	saveBtn.addEventListener("click", () => {
		const instance = new Instance(instanceInputter.value);

		instance.on("init", () => {
			const { type } = instance;

			if (type === "NONE") throwError("error_UnacceptableInstance");
			
			chrome.storage.local.set({
				type,
				instance: instance.url,
				token: tokenInputter.value,
				visibility: visibilitySelector.value
			});
	
			window.close();
		});
	});

	closeBtn.addEventListener("click", () => {
		window.close();
	});
});