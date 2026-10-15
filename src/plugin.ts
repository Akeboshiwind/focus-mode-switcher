import streamDeck from "@elgato/streamdeck";

import { FocusModeKey } from "./actions/focus-mode";
import { watchDatabase } from "./focus/watch";

streamDeck.logger.setLevel("trace");

const focusModeKey = new FocusModeKey();
streamDeck.actions.registerAction(focusModeKey);

watchDatabase(
	() => focusModeKey.refresh().catch((error) => streamDeck.logger.error("Refreshing Focus Mode keys failed", error)),
	(error) => streamDeck.logger.error("Watching the DoNotDisturb database failed", error),
);

streamDeck.connect();
