import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	SendToPluginEvent,
	SingletonAction,
	WillAppearEvent,
	type Action,
} from "@elgato/streamdeck";

import { readActiveModeId } from "../focus/active";
import { renderIcon } from "../focus/icon";
import { readModes, type FocusMode } from "../focus/modes";
import { enableFocus, focusNameFor, installShortcut } from "../focus/shortcut";

type Settings = { modeId?: string };

const DIMMED = 0;
const LIT = 1;

@action({ UUID: "com.akeboshiwind.focus-mode-switcher.focus-mode" })
export class FocusModeKey extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await showMode(ev.action, ev.payload.settings, ...(await readFocus()));
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		await showMode(ev.action, ev.payload.settings, ...(await readFocus()));
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const focusName = focusNameFor(await readModes(), ev.payload.settings.modeId);
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
			// The property inspector's `sdpi-select` datasource request.
			case "getModes": {
				const modes = await readModes();
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
		await Promise.all(this.actions.map(async (key) => showMode(key, await key.getSettings(), ...focus)).toArray());
	}
}

function readFocus(): Promise<[FocusMode[], string | undefined]> {
	return Promise.all([readModes(), readActiveModeId()]);
}

async function showMode(key: Action<Settings>, { modeId }: Settings, modes: FocusMode[], activeModeId: string | undefined): Promise<void> {
	if (!key.isKey()) return;
	const mode = modes.find((m) => m.id === modeId);
	if (mode === undefined) {
		await key.setImage();
		await key.setState(DIMMED);
		return;
	}
	const [dimmed, lit] = await Promise.all([renderIcon(mode, false), renderIcon(mode, true)]);
	await key.setImage(dimmed, { state: DIMMED });
	await key.setImage(lit, { state: LIT });
	await key.setState(mode.id === activeModeId ? LIT : DIMMED);
}
