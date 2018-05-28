/**
 * @param {String} instance
 * @param {String} token
 * @param {String} [privacy="unlisted"]
 * 
 * @returns {Promise}
 */
const tootListeningInfo = (instance, token, privacy = "unlisted") => {
	return fetch(`${instance}/api/v1/statuses`, {
		method: "POST",

		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`
		},

		body: JSON.stringify({
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

const notifyListeningInfo = (icon) => {
	if (Notification) {
		Notification.requestPermission(state => {
			switch (state) {
				default:
				case "denied":
					break;

				case "granted":
					new Notification(currentTitle, { icon }).addEventListener("click", function () {
						window.focus();
						this.close();
					});

					break;
			}
		});
	}
};



const URLS = [
	{
		name: "YouTube",
		icon: "https://s.ytimg.com/yts/img/favicon_48-vflVjB_Qk.png",
		expression: new RegExp("https://www\.youtube\.com/watch\\?v=.+")
	},

	{
		name: "Niconico",
		icon: "http://www.nicovideo.jp/favicon.ico",
		expression: new RegExp("http://www\.nicovideo\.jp/watch/.+")
	},

	{
		name: "TwitCasting",
		icon: document.querySelector('#submenu-header > Img.usericon') && document.querySelector('#submenu-header > Img.usericon').src,
		expression: new RegExp("https://twitcasting\.tv/[a-zA-Z0-9_\\-:]+/?$")
	}
];

let currentEnabled = false,
	currentInstance = "",
	currentToken = "",
	currentPrivacy = "";
	
let currentUrl = "",
	currentTitle = "";
	
setInterval(() => {
	if (currentUrl != location.href) {
		currentUrl = location.href;
		currentTitle = document.title;
		
		
		URLS.forEach(url => {
			const detector = url.expression;

			if (detector.exec(currentUrl)) {
				let titleObserverCount = 0;
				let titleObserver = setInterval(() => {
					if (currentTitle != document.title || titleObserverCount > 50) {
						currentTitle = document.title;

						try {
							chrome.storage.local.get(["enabled", "instance", "token", "privacy"], items => {
								currentEnabled = items.enabled;

								if (!currentEnabled) {
									clearInterval(titleObserver);
									return;
								}
								
								if (!items.instance) throw new TypeError("A config, 'instance' is invalid.");
								if (!items.token) throw new TypeError("A config, 'token' is invalid.");
								if (!items.privacy) throw new TypeError("A config, 'privacy' is invalid.");
								
								currentInstance = items.instance;
								currentToken = items.token;
								currentPrivacy = items.privacy;

								tootListeningInfo(currentInstance, currentToken, currentPrivacy);
								notifyListeningInfo(url.icon);

								clearInterval(titleObserver);
							});
						} catch (error) {
							if (!currentEnabled) {
								clearInterval(titleObserver);
								return;
							}
							
							tootListeningInfo(currentInstance, currentToken, currentPrivacy);
							notifyListeningInfo(url.icon);

							clearInterval(titleObserver);
						}
					}
					
					titleObserverCount++;
				}, 50);
			}
		});
	}
}, 200);

chrome.storage.local.get(["enabled", "instance", "token", "privacy"], items => {
	items.enabled = items.enabled == undefined ? false : items.enabled;
	items.instance = items.instance || "";
	items.token = items.token || "";
	items.privacy = items.privacy || "unlisted";
});