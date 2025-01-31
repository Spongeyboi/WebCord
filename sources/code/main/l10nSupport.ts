/* l10nSupport – app localization implementation */

import * as path from "path";
import * as fs from "fs";
import * as deepmerge from "deepmerge";
import { app, dialog } from "electron";
import JSONC from "../internalModules/jsoncParser"
import { jsonOrJsonc, objectsAreSameType } from "../global";
import { EventEmitter } from "events";

const langDialog = new EventEmitter();

langDialog.once('show-error', (localizedStrings:string) => {
	dialog.showMessageBoxSync({
		title: "Error loading translations for locale: '"+app.getLocale().toLocaleUpperCase()+"'!",
		type: "error",
		message: "An error occured while loading 'strings' from file: '"+
			jsonOrJsonc(localizedStrings)+"'. "+
			"Please make sure that the file syntax is correct!\n\n"+
			"This will lead to "+app.getName()+" use English strings instead."
	});
});

const fallbackStrings = {
	/** Tray menu. */
	tray: {
		toggle: "Toggle",
		quit: "Quit"
	},
	/** Context menu on right mouse click */
	context:{
		copy: "Copy",
		paste: "Paste",
		cut: "Cut",
		dictionaryAdd: "Add to the local dictionary",
		copyURL: "Copy link address",
		copyURLText: "Copy link text",
		inspectElement: "Inspect"
	},
	/** Application menubar (File, Edit, View etc.) */
	menubar: {
		enabled: "Enabled",
		file: {
			groupName:"File",
			quit:"Quit",
			relaunch:"Relaunch",
			addon: {
				groupName: "Extensions",
				loadNode: "Load node extension",
				loadChrome: "Load Chrome extension"
			}
		},
		edit: "Edit",
		view: {
			groupName: "View",
			reload: "Reload",
			forceReload: "Force reload",
			devTools: "Toggle Developer Tools",
			resetZoom: "Actual size",
			zoomIn: "Zoom in",
			zoomOut: "Zoom out",
			fullScreen: "Toggle fullscreen"
		},
		window: { 
			groupName: "Window",
			mobileMode: "Hide side bar"
		}
	},
	/** GTK / Terminal dialogs, warnings, errors etc. */
	dialog: {
		error: "Error",
		warning: "Warning",
		ver: {
			update: "New app version is available!",
			updateBadge: "[UPDATE]",
			updateTitle: "Update available!",
			recent: "Application is up-to-date!",
			newer: "Application version is newer than in the repository!",
			diff: "Application version is different than in the repository!"
		},
		permission: {
			request: {
				denied: "%s: Permission request to %s denied."
			},
			check: {
				denied: "%s: Permission check to %s denied."
			}
		},
		buttons: {
			continue: "Continue",
			yes: "Yes",
			no: "No"
		},
		/** WebCord's extension format names (in file picker). */
		mod: {
			nodeExt: "WebCord Node.js Addon",
			crx: "Chrome/Chromium Extension"
		},
		hideMenuBar: "Because you've set the option to hide the menu bar, you'll gain no access to it after you restart the app, unless you press the [ALT] key to temporarily unhide menu bar."
	},
	/** Help menu (in menubar and partialy in tray context menu) */
	help:{
		groupName: "Help",
		about: "About",
		repo: "Repository",
		docs: "Documentation",
		bugs: "Report a bug",
		contributors: "Authors and contributors:",
		credits: "Thanks to GyozaGuy for his Electron Discord app – it was a good source to learn about the Electron API and how make with it a Discord web app."
	},
	/** HTML-based configuration window */
	settings: {
		/** Title-bar translations. */
		title: "Settings",
		basic: {
			name: "Basic",
			group: {
				menuBar: {
					name: "Menu bar",
					description: "Changes visibility settings of native menu bar.",
					label: "Hide menu bar automatically."
				},
				tray: {
					name: "Tray",
					description: "Changes the visibility of the icon in the system tray.",
					label: "Disable hiding window to the system tray functionality."
				}
			}
		},
		advanced: {
			name: "Advanced",
			group: {
				devel: {
					name: "Developer mode",
					description: "Enables the access to tools and unfinished options that might be dangerous in wrong hands. Disclaimer: If you break something after you switched this option on, don't expect from the app maintainers or anyone else to fix that!",
					label: "Enable developer mode"
				},
				csp: {
					name: "Content Security Policy",
					description: "Sets a list of the websites from which Discord is allowed to display content (images, videos, iframes etc.) or connect to.",
					group: {
						thirdparty: {
							name:"Third party websites",
							list: {
								gifProviders: "GIF Providers"
							}
						}
					}
				}
			}
		}
	},
	/** Miscelaneous strings */
	misc: {
		singleInstance: "Switching to the existing window..."
	}
}

/** An object including strings from the  */

type languageStrings = typeof fallbackStrings;

/**
 * The class that can be used to get an object containing translated strings and/or English strings
 * if translation is missing or invalid.
 * 
 * Currently, it will load the translations correctly at following conditions:
 * 
 * - if application is `ready`,
 * - when translated strings are of correct type: `Partial<T>`, where `T` is the type of the
 *   fallback strings.
 * 
 * In other situations, an error message will occur and fallback strings will be used instead. 
 */

class l10n {
	/**  */
	public strings: languageStrings;
	private loadStrings():languageStrings {
		/**
		 * Computed strings (mixed localized and fallback object)
		 */
		let finalStrings: languageStrings | unknown = fallbackStrings;
		/**
		 * Translated strings in the user TranslatedStringsuage.
		 * 
		 * @todo
		 * Make `localStrings` not overwrite `l10nStrings`
		 * when it is of wrong type.
		 */
		let localStrings: Partial<unknown>;

		let internalStringsFile = path.resolve(app.getAppPath(), "sources/assets/translations/" + app.getLocale() + "/strings");
		const externalStringsFile = path.resolve(path.dirname(app.getAppPath()), 'translations/' + app.getLocale() + "/strings");

		/* Handle unofficial translations */

		if (!fs.existsSync(jsonOrJsonc(internalStringsFile)))
			internalStringsFile = externalStringsFile;

		if (!app.isReady()) console.warn(
			"[WARN] Electron may fail loading localized strings,\n" +
			"       because the app hasn't still emitted the 'ready' event!\n" +
			"[WARN] In this case, English strings will be used as a fallback.\n"
		);
		if (fs.existsSync(jsonOrJsonc(internalStringsFile))) {
			localStrings = JSONC.parse({ path: jsonOrJsonc(internalStringsFile) });
			finalStrings = deepmerge(fallbackStrings, localStrings);
		}
		if (objectsAreSameType(finalStrings, fallbackStrings)) {
			return finalStrings;
		} else {
			langDialog.emit('show-error',internalStringsFile)
			return fallbackStrings;
		}
	}
	constructor() {
		this.strings = this.loadStrings();
	}
}

export default l10n;