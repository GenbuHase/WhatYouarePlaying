/* global M */
/* global definedMessages, localeManager */
/* global Instance */

const enabledSwitch = document.getElementById("enabled");
const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const visibilitySelector = document.getElementById("visibility");
const saveBtn = document.getElementById("btns_save");
const closeBtn = document.getElementById("btns_close");



/**
 * Evokes a provided error with a notification
 * @param {String} errorId
 */
const evokeError = errorId => {
	M.toast({ html: definedMessages[errorId].message.replace(/\r?\n/g, "<Br />"), classes: "red darken-2" });
	return new Error(definedMessages[errorId].message);
};

/**
 * Changes a collection of visibilities by provided instance's type
 * @param {String} type
 */
const changeVisibilities = type => {
	while (visibilitySelector.options.length > 0) visibilitySelector.options.remove(0);
	changeFieldsEnability([visibilitySelector], false);

	if (type && type !== Instance.Type.None && Instance.Type[type]) {
		for (let name of Instance.Visibility[type]) {
			const option = new Option(definedMessages[`setting_visibility_${type}_${name}`].message, name);
			option.setAttribute("Name", `visibility.${name}`);
			option.setAttribute("Locale-Message", `setting_visibility_${type}_${name}`);

			visibilitySelector.add(option);
		}

		chrome.storage.local.get(["enabled", "visibility"], items => {
			const { enabled, visibility } = items;
			
			if (visibility && Instance.Visibility[type].includes(visibility)) visibilitySelector.namedItem(`visibility.${visibility}`).selected = true;
			changeFieldsEnability([visibilitySelector], enabled);
		});
	}
};

/**
 * Enables/Disables selected fields
 * 
 * @param {Array<HTMLElement>} fields
 * @param {Boolean} enability
 */
const changeFieldsEnability = (fields, enability) => {
	for (const field of fields) {
		switch (field) {
			default:
				break;

			case instanceInputter:
			case tokenInputter:
				field[enability ? "removeAttribute" : "setAttribute"]("disabled", "");
				break;

			case visibilitySelector:
				field[enability ? "removeAttribute" : "setAttribute"]("disabled", ""),
				M.FormSelect.init(field);
				break;
		}
	}
};



window.addEventListener("DOMContentLoaded", () => {
	localeManager.on("init").then(() => {
		document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));

		chrome.storage.local.get(["enabled", "type", "instance", "token"], items => {
			const { enabled, type, instance, token } = items;

			if (enabled) enabledSwitch.checked = enabled;
			if (instance) instanceInputter.value = instance;
			if (token) tokenInputter.value = token;

			changeFieldsEnability([instanceInputter, tokenInputter], enabled);
			changeVisibilities(type);
			M.updateTextFields();
		});
	});
});

window.addEventListener("DOMContentLoaded", () => {
	enabledSwitch.addEventListener("change", function () {
		const enabled = this.checked;

		chrome.storage.local.set({ enabled });
		chrome.browserAction.setBadgeText({ text: enabled ? "ON" : "OFF" });
		changeFieldsEnability([instanceInputter, tokenInputter, visibilitySelector], enabled);
	});

	instanceInputter.addEventListener("blur", function () {
		changeFieldsEnability([tokenInputter, visibilitySelector], false);

		const instance = new Instance(this.value);
		instance.on("init").then(() => {
			const { type } = instance;

			if (type !== Instance.Type.None) changeFieldsEnability([tokenInputter], true);
			changeVisibilities(instance.type);
		});
	});

	saveBtn.addEventListener("click", () => {
		if (!instanceInputter.value) {
			chrome.storage.local.set({
				type: Instance.Type.None,
				instance: "",
				token: "",
				visibility: ""
			});

			return window.close();
		}
		
		const instance = new Instance(instanceInputter.value);
		instance.on("init").then(() => {
			const { type } = instance;

			if (type === "None") throw evokeError("error_UnacceptableInstance");
			
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