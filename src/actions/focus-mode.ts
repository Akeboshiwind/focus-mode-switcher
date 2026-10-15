import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	SendToPluginEvent,
	SingletonAction,
	WillAppearEvent,
	type Action,
} from "@elgato/streamdeck";

import { readFocus, type Focus } from "../focus/focus";
import { renderIcon } from "../focus/icon";
import { enableFocus, focusNameFor, installShortcut } from "../focus/shortcut";

type Settings = { modeId?: string };

const DIMMED = 0;
const LIT = 1;

const NO_ACCESS_ICON = { symbol: "lock.fill", tint: "systemRedColor" };
const UNSUPPORTED_VERSION_ICON = { symbol: "exclamationmark.triangle", tint: "systemYellowColor" };

@action({ UUID: "com.akeboshiwind.focus-mode-switcher.focus-mode" })
export class FocusModeKey extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await showFocus(ev.action, ev.payload.settings, await readFocus());
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		await showFocus(ev.action, ev.payload.settings, await readFocus());
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const focus = await readFocus();
		const focusName = focus.kind === "ok" ? focusNameFor(focus.modes, ev.payload.settings.modeId) : undefined;
		if (focusName === undefined) return ev.action.showAlert();
		try {
			await enableFocus(focusName);
		} catch (error) {
			streamDeck.logger.error(`Turning on "${focusName}" failed`, error);
			await ev.action.showAlert();
		}
	}

	override async onSendToPlugin(ev: SendToPluginEvent<{ event?: string }, Settings>): Promise<void> {
		switch (ev.payload.event) {
			case "getModes": {
				const focus = await readFocus();
				const modes = focus.kind === "ok" ? focus.modes : [];
				await streamDeck.ui.sendToPropertyInspector({
					event: "getModes",
					items: modes.map((mode) => ({ label: mode.name, value: mode.id })),
				});
				break;
			}
			case "installShortcut":
				await installShortcut();
				break;
		}
	}

	async refresh(): Promise<void> {
		const focus = await readFocus();
		await Promise.all(this.actions.map(async (key) => showFocus(key, await key.getSettings(), focus)).toArray());
	}
}

async function showFocus(key: Action<Settings>, { modeId }: Settings, focus: Focus): Promise<void> {
	if (!key.isKey()) return;
	switch (focus.kind) {
		case "no-access":
			return key.setImage(await renderIcon(NO_ACCESS_ICON, true));
		case "unsupported-version":
			return key.setImage(await renderIcon(UNSUPPORTED_VERSION_ICON, true));
		case "ok": {
			const mode = focus.modes.find((m) => m.id === modeId);
			if (mode === undefined) {
				await key.setImage();
				await key.setState(DIMMED);
				return;
			}
			const [dimmed, lit] = await Promise.all([renderIcon(mode, false), renderIcon(mode, true)]);
			await key.setImage(dimmed, { state: DIMMED });
			await key.setImage(lit, { state: LIT });
			await key.setState(mode.id === focus.activeModeId ? LIT : DIMMED);
		}
	}
}
