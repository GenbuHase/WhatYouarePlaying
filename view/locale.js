const LANG = chrome.app.getDetails().current_locale;

let definedMessages = {};
	fetch(chrome.extension.getURL(`_locales/${LANG}/messages.json`)).catch(error => fetch(chrome.extension.getURL(`_locales/en/messages.json`))).then(response => response.json()).then(messages => {
		definedMessages = messages;

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