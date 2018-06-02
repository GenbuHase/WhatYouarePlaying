const URLMatchers = {
	YouTube: {
		hostSuffix: "youtube.com", pathPrefix: "/watch",
		urlMatches: "https://\\w+\.youtube\.com/watch\\?(?:.|&)*v=.+"
	},

	Niconico: {
		hostSuffix: "nicovideo.jp", pathPrefix: "/watch",
		urlMatches: "http://\\w+\.nicovideo\.jp/watch/.+"
	},

	TwitCasting: {
		hostEquals: "twitcasting.tv",
		urlMatches: "https://twitcasting\.tv/[\\w\\-:]+(/?|/movie/\\d+)$"
	}
};



/**
 * @param {Number} tabId
 */
const notifyListeningInfo = (tabId) => {
	chrome.storage.local.get(["enabled"], items => {
		const { enabled } = items;

		if (enabled) {
			(function looper (tabId) {
				chrome.tabs.get(tabId, tabInfo => {
					const { status, title, url } = tabInfo;

					if (status === "loading") {
						setTimeout(looper(tabId), 200);
						return;
					}

					chrome.notifications.create(null, {
						type: chrome.notifications.TemplateType.BASIC,

						title,
						message: url,
						iconUrl: "icons/icon48.png"
					});

					tootListeningInfo(title, url);
				});
			})(tabId);
		}
	});
};

/**
 * @param {String} title
 * @param {String} url
 * 
 * @returns {Promise | void}
 */
const tootListeningInfo = (title, url) => {
	chrome.storage.local.get(["enabled", "instance", "token", "privacy"], items => {
		const { enabled, instance, token, privacy } = items;
		
		if (!instance) throw new TypeError("A config, 'instance' is invalid.");
		if (!token) throw new TypeError("A config, 'token' is invalid.");
		if (!privacy) throw new TypeError("A config, 'privacy' is invalid.");

		if (enabled) {
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
						`【${title}】`,
						url
					].join("\n"),
					
					visibility: privacy
				})
			});
		}
	});
};



chrome.webNavigation.onDOMContentLoaded.addListener(
	/**
	 * @param {Object} details
	 * @param {Number} details.tabId
	 * @param {String} details.url
	 * @param {Number} details.processId
	 * @param {Number} details.frameId
	 * @param {Number} details.timeStamp
	 */
	details => {
		notifyListeningInfo(details.tabId);
	},

	{
		url: [
			URLMatchers.YouTube,
			URLMatchers.Niconico,
			URLMatchers.TwitCasting
		]
	}
);

const recentHistories = [];
chrome.webNavigation.onHistoryStateUpdated.addListener(
	/**
	 * @param {Object} details
	 * @param {Number} details.tabId
	 * @param {String} details.url
	 * @param {Number} details.processId
	 * @param {Number} details.frameId
	 * @param {any} details.transitionType
	 * @param {Array<any>} details.transitionQualifiers
	 * @param {Number} details.timeStamp
	 */
	details => {
		recentHistories.push(details);

		if (recentHistories.length === 3) {
			setTimeout(() => notifyListeningInfo(details.tabId), 1000);
			recentHistories.splice(0, 3);

			return;
		}

		new Promise(resolve => {
			const currentLength = recentHistories.length;
			let milliseconds = 0;

			let detector = setInterval(() => {
				milliseconds++;

				if (milliseconds >= 1000) {
					clearInterval(detector);
					resolve();
				}

				if (currentLength !== recentHistories.length) clearInterval(detector);
			}, 1);
		}).then(() => {
			notifyListeningInfo(details.tabId);
			recentHistories.splice(0, 3);
		});
	},

	{
		url: [
			URLMatchers.YouTube
		]
	}
);