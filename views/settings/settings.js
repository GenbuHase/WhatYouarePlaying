const enabledSwitch = document.getElementById("enabled");
const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const visibilitySelector = document.getElementById("visibility");
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

/**
 * Changes a collection of visibilities by provided instance's type
 * @param {String} type
 */
const changeVisibilities = type => {
	if (type && type !== Instance.Type.None && Instance.Type[type]) {
		while (visibilitySelector.options.length > 0) visibilitySelector.options.remove(0);

		for (let name of Instance.Visibility[type]) {
			const option = new Option(definedMessages[`setting_visibility_${type}_${name}`].message, name);
			option.setAttribute("Name", `visibility.${name}`);
			option.setAttribute("Locale-Message", `setting_visibility_${type}_${name}`);

			visibilitySelector.add(option);
		}

		chrome.storage.local.get("visibility", items => {
			const { visibility } = items;
			
			if (visibility && Instance.Visibility[type].includes(visibility)) visibilitySelector.namedItem(`visibility.${visibility}`).selected = true;
			M.FormSelect.init(visibilitySelector);
		});
	}
};



window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));

	chrome.storage.local.get(["enabled", "type", "instance", "token"], items => {
		const { enabled, type, instance, token } = items;

		if (enabled) enabledSwitch.checked = enabled;
		if (instance) instanceInputter.value = instance;
		if (token) tokenInputter.value = token;

		changeVisibilities(type);
		M.updateTextFields();
	});
});

window.addEventListener("DOMContentLoaded", () => {
	enabledSwitch.addEventListener("change", function () {
		const enabled = this.checked;

		chrome.storage.local.set({ enabled });
		chrome.browserAction.setBadgeText({ text: enabled ? "ON" : "OFF" });
	});

	instanceInputter.addEventListener("blur", function () {
		const instance = new Instance(this.value);

		instance.on("init", () => {
			const { type } = instance;

			changeVisibilities(type);
			M.FormSelect.init(visibilitySelector);
		});
	});

	saveBtn.addEventListener("click", () => {
		if (!instanceInputter.value) {
			chrome.storage.local.set({
				type: "None",
				instance: "",
				token: tokenInputter.value,
				visibility: ""
			});

			return;
		}
		
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