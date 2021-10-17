class LocaleManager {
	static get CURRENT_LANG () { return browser.i18n.getUILanguage() }



	constructor () {
		this.definedMessages = {};
		this.load(LocaleManager.CURRENT_LANG);
	}

	get hasInitialized () { return Object.keys(this.definedMessages).length > 0 }

	/**
	 * Loads localization datas of provided language
	 * @param {String} lang
	 */
	load (lang) {
		fetch(chrome.extension.getURL(`_locales/${lang}/messages.json`))
			.catch(() => fetch(chrome.extension.getURL("_locales/en/messages.json")))
			.then(response => response.json())
			.then(messages => this.definedMessages = messages);
	}

	/**
	 * Dispatches provided event when it has been true
	 * 
	 * @param {"init"} eventname
	 * @param {Function} [callback]
	 * 
	 * @return {Promise<LocaleManager>}
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



let definedMessages = {};

const localeManager = new LocaleManager();
localeManager.on("init").then(() => {
	definedMessages = localeManager.definedMessages;

	let localeElements = document.querySelectorAll('Locale[Message]');
		localeElements.forEach(elem => {
			let localeId = elem.getAttribute("Message");

			try {
				elem.textContent = definedMessages[localeId].message;
			} catch (error) {
				throw new TypeError(`The provided locale-id<${localeId}> is not defined`);
			}
		});

	let localeAttrs = document.querySelectorAll('*[Locale-Message]');
		localeAttrs.forEach(attrElem => {
			let localeId = attrElem.getAttribute("Locale-Message");

			try {
				attrElem.textContent = definedMessages[localeId].message;
			} catch (error) {
				throw new TypeError(`The provided locale-id<${localeId}> is not defined`);
			}
		});
});