class Instance {
	static get Type () {
		return {
			None: "None",

			Mastodon: "Mastodon",
			Misskey: "Misskey"
		};
	}

	static get Visibility () {
		return {
			None: [""],

			Mastodon: ["public", "unlisted", "private", "limited", "direct"],
			Misskey: ["public", "home", "followers", "specified", "private"]
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

		//Throws error if provided url isn't absolutely one
		new URL(url);

		this.url = url;
		Instance.detectType(url).then(type => this.type = type);
		chrome.storage.local.get("token", items => Object.assign(this, items));
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
					if ([this.type, this.token].every(prop => prop !== undefined)) {
						clearInterval(detector);
						callback(this);
					}
				});
				
				break;
		}
	}
}