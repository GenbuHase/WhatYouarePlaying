(() => {
	const urlParams = new URLSearchParams(location.search);

	fetch(`/api/client/watch?id=${urlParams.get("id")}`).then(resp => {
		if (!resp.ok) return Promise.reject();

		return resp.json();
	}).then(info => {
		if (info.error) return Promise.reject();

		chrome.runtime.sendMessage(null, { type: "KNZK_LIVE_DETECTOR", value: true });
	}).catch(() => chrome.runtime.sendMessage(null, { type: "KNZK_LIVE_DETECTOR", value: false }));
})();