import streamDeck, { action, SendToPluginEvent, SingletonAction } from "@elgato/streamdeck";

import { readModes } from "../focus/modes";

type Settings = { modeId?: string };

@action({ UUID: "com.akeboshiwind.focus-mode-switcher.focus-mode" })
export class FocusModeKey extends SingletonAction<Settings> {
	/**
	 * Answers the property inspector's `sdpi-select` datasource request.
	 */
	override async onSendToPlugin(ev: SendToPluginEvent<{ event?: string }, Settings>): Promise<void> {
		if (ev.payload.event !== "getModes") return;
		const modes = await readModes();
		await streamDeck.ui.sendToPropertyInspector({
			event: "getModes",
			items: modes.map((mode) => ({ label: mode.name, value: mode.id })),
		});
	}
}
