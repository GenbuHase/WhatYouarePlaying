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
	},

	Nana: {
		hostEquals: "nana-music.com", pathPrefix: "/sounds",
		urlMatches: "https?://nana-music\.com/sounds/.+"
	},

	KnzkLive: {
		urlMatches: "https?://[\\w.]+/watch(\\d+)"
	}
};



/**
 * @param {Number} tabId
 */
const notifyListeningInfo = (tabId) => {
	chrome.storage.local.get(["enabled", "instance", "token", "visibility"], items => {
		const { enabled, instance, token, visibility } = items;

		if (!enabled) return;
		if (!instance) throw new TypeError("A config, 'instance' is invalid.");
		if (!token) throw new TypeError("A config, 'token' is invalid.");
		if (!visibility) throw new TypeError("A config, 'visibility' is invalid.");

		

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
				}, currentId => {
					chrome.notifications.onClicked.addListener(notificationId => {
						if (notificationId === currentId) {
							chrome.tabs.highlight({ windowId: tabInfo.windowId, tabs: tabInfo.index });
							chrome.notifications.clear(currentId);
						}

						chrome.notifications.onClicked.removeListener(event);
					});
				});

				tootListeningInfo(title, url);
			});
		})(tabId);
	});
};

/**
 * @param {String} title
 * @param {String} url
 * 
 * @returns {Promise | void}
 */
const tootListeningInfo = (title, url) => {
	chrome.storage.local.get(["type", "instance", "token", "visibility"], items => {
		const { type, instance, token, visibility } = items;

		const status = [
			"#WhatYouarePlaying",
			"#NowPlaying",
			"",
			"Now playing🎶",
			"",
			`【${title}】`,
			url
		].join("\n");

		switch (type) {
			case "None":
				throw new URIError("The instance is not acceptable.");

			case "Mastodon":
				return fetch(`${instance}/api/v1/statuses`, {
					method: "POST",
			
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${token}`
					},
			
					body: JSON.stringify({
						status,
						visibility
					})
				});

			case "Misskey":
				return fetch(`${instance}/api/notes/create`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },

					body: JSON.stringify({
						i: token,

						text: status,
						visibility
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
			URLMatchers.TwitCasting,
			URLMatchers.Nana
		]
	}
);

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
		const url = new URL(details.url);
		const liveId = url.href.match(new RegExp(URLMatchers.KnzkLive.urlMatches))[1];
		
		fetch(`${url.origin}/api/client/watch?id=${liveId}`).then(resp => {
			if (!resp.ok) return Promise.reject();
	
			return resp.json();
		}).then(info => {
			if (info.error) return Promise.reject();

			notifyListeningInfo(details.tabId);
		}).catch(() => {});
	},

	{
		url: [ URLMatchers.KnzkLive ]
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
			URLMatchers.YouTube,
			URLMatchers.Niconico
		]
	}
);

chrome.storage.local.get(["enabled", "instance", "token"], items => {
	let { enabled } = items;
	const { instance, token } = items;

	if (!instance || !token) enabled = false;
	chrome.browserAction.setBadgeText({ text: enabled ? "ON" : "OFF" });
});