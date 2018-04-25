class DOM {
	/**
	 * Connects to the URL
	 * 
	 * @param {Object} [option={}] A collection of connecting options
	 * @param {String} [option.type="GET"] A connecting method
	 * @param {String} [option.url=location.href] Where the connector will connect
	 * @param {Boolean} [option.doesSync=false] How the connector will connect asynchronously
	 * @param {String} option.resType A response type
	 * @param {Object} option.headers the connector's headers
	 * @param {Object} option.params A collection of query strings
	 * @param {Object} option.data A data for sending
	 * @param {function (ProgressEvent)} [option.onLoad=function (event) {}] A callback, called when the connector will have connected
	 * 
	 * @returns {Promise} The connector
	 */
	static xhr (option = { type: "GET", url: location.href, doesSync: false, onLoad: (event) => {} }) {
		let connector = new XMLHttpRequest();
			!option.resType || (connector.responseType = option.resType);
			
			connector.open(option.type, option.url + (option.params ? "?" + (() => {
				let param = [];

				for (let paramName in option.params) {
					param.push(paramName + "=" + option.params[paramName]);
				}

				return param.join("&");
			})() : ""), option.doesSync);

			!option.headers || (() => {
				for (let headerName in option.headers) {
					connector.setRequestHeader(headerName, option.headers[headerName]);
				}
			})();

			connector.addEventListener("load", option.onLoad);
			connector.send(option.data);

		return connector;
	}
}

const toot = function (instance = "", token = "", privacy = "unlisted") {
	DOM.xhr({
		type: "POST",
		url: `${instance}/api/v1/statuses`,
		doesSync: true,
		
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`
		},
		
		data: JSON.stringify({
			status: [
				"#WhatYouarePlaying",
				"Now playing🎶",
				"",
				`【${currentTitle}】`,
				currentUrl
			].join("\n"),
			
			visibility: privacy
		})
	});
};



const URLS = [
	new RegExp("https://www\.youtube\.com/watch\\?v=.+"),
	new RegExp("http://www\.nicovideo\.jp/watch/.+"),
	new RegExp("https://twitcasting\.tv/[a-zA-Z0-9_\\-:]+$")
];

let currentInstance = "",
	currentToken = "",
	currentPrivacy = "";

let currentUrl = "",
	currentTitle = "";
	
setInterval(() => {
	if (currentUrl != location.href) {
		currentUrl = location.href;
		currentTitle = document.title;
		
		URLS.forEach(detector => {
			if (detector.exec(currentUrl)) {
				let titleObserverCount = 0;
				let titleObserver = setInterval(() => {
					if (currentTitle != document.title || titleObserverCount > 50) {
						currentTitle = document.title;

						try {
							chrome.storage.local.get(["instance", "token", "privacy"], items => {
								if (!items.instance) throw new TypeError("A config, 'instance' is invalid.");
								if (!items.token) throw new TypeError("A config, 'token' is invalid.");
								if (!items.privacy) throw new TypeError("A config, 'privacy' is invalid.");

								currentInstance = items.instance;
								currentToken = items.token;
								currentPrivacy = items.privacy;

								toot(items.instance, items.token, items.privacy);

								clearInterval(titleObserver);
							});
						} catch (error) {
							toot(currentInstance, currentToken, currentPrivacy);
							clearInterval(titleObserver);
						}
					}
					
					titleObserverCount++;
				}, 50);
			}
		});
	}
}, 200);

chrome.storage.local.get(["instance", "token", "privacy"], item => {
	item.instance = item.instance || "";
	item.token = item.token || "";
	item.privacy = item.privacy || "unlisted";
});