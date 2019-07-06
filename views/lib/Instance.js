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

			Mastodon: ["public", "unlisted", "private", "unleakable", "direct"],
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
		try {
			if (url) new URL(url);
		} catch (error) {
			throw new URIError("An argument, 'url' must be absolutely formed.");
		}

		this.url = url;
		chrome.storage.local.get("token", items => this.token = items.token || "");
		
		if (!url) {
			this.type = "None";
		} else {
			Instance.detectType(url).then(type => this.type = type);
		}
	}

	get hasInitialized () { return [this.type, this.token].every(prop => prop !== undefined) }

	/**
	 * Dispatches provided event when it has been true
	 * 
	 * @param {"init"} eventname
	 * @param {Function} [callback]
	 * 
	 * @return {Promise<Instance>}
	 */
	on (eventname, callback) {
		let detector = null;

		switch (eventname) {
			default:
				throw new TypeError(`Provided event, "${eventname}" is not defined`);

			case "init":
				return new Promise(resolve => {
					detector = setInterval(() => {
						if (this.hasInitialized) {
							clearInterval(detector);

							resolve(this);
							if (callback) callback(this);
						}
					});
				});
		}
	}
}