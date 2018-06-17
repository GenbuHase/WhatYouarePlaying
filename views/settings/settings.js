const instanceInputter = document.getElementById("instance");
const tokenInputter = document.getElementById("token");
const pricacySelector = document.getElementById("privacy");
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

class Instance {
	static get Type () {
		return {
			None: "NONE",

			Mastodon: "MASTODON",
			Misskey: "MISSKEY"
		};
	}

	/**
	 * Detects a type of provided instance's url
	 * 
	 * @param {String} instance
	 * @return {Promise<String>}
	 */
	static detectType (instance) {
		//Misskey's API
		return fetch(`${instance}/api/stats`, {
			method: "POST"
		}).then(res => {
			if (res.ok) return Instance.Type.Misskey;

			//Mastodon's API
			return fetch(`${instance}/api/v1/instance`).then(res => {
				if (res.ok) return Instance.Type.Mastodon;

				throw "";
			});
		}).catch(() => Instance.Type.None);
	}



	/**
	 * Setup for handling information of instances
	 * @param {String} url
	 */
	constructor (url) {
		if (!url) throw new URIError("An argument, 'url' is required.");

		//Throws error if provided url isn't absolutely
		new URL(url);

		this.url = url;
		Instance.detectType(url).then(type => this.type = type);
	}

	/**
	 * Dispatches provided event when it has been true
	 * 
	 * @param {"init"} eventname
	 * @param {Function} callback
	 */
	on (eventname, callback) {
		switch (eventname) {
			default:
				throw new TypeError(`Provided event, "${eventname}" is not defined`);

			case "init":
				const detector = setInterval(() => {
					if ([this.type].every(prop => prop)) {
						clearInterval(detector);
						callback(this);
					}
				});
				
				break;
		}
	}
}



window.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("Select").forEach(select => M.FormSelect.init(select));
});

window.addEventListener("DOMContentLoaded", () => {
	chrome.storage.local.get(["enabled", "type", "instance", "token", "privacy"], items => {
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
		const instance = new Instance(instanceInputter.value);

		instance.on("init", () => {
			const { type } = instance;

			if (type === "NONE") throwError("error_UnacceptableInstance");
			
			chrome.storage.local.set({
				type,
				instance: instance.url,
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