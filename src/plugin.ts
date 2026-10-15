import streamDeck from "@elgato/streamdeck";

import { FocusModeKey } from "./actions/focus-mode";
import { watchDatabase } from "./focus/watch";
import { checkForUpdate } from "./update/updater";

/** A scheduled Focus window opens and closes without touching the DB, so nothing but time notices it. */
const SCHEDULE_CHECK_MS = 10_000;
const UPDATE_CHECK_MS = 24 * 60 * 60 * 1000;

streamDeck.logger.setLevel("trace");

const focusModeKey = new FocusModeKey();
streamDeck.actions.registerAction(focusModeKey);

const refresh = () => focusModeKey.refresh().catch((error) => streamDeck.logger.error("Refreshing Focus Mode keys failed", error));
watchDatabase(refresh, (error) => streamDeck.logger.error("Watching the DoNotDisturb database failed", error));
setInterval(refresh, SCHEDULE_CHECK_MS);

await streamDeck.connect();

const checkForUpdates = () =>
	checkForUpdate(streamDeck.info.plugin.version).catch((error) => streamDeck.logger.debug("Checking for an update failed", error));
void checkForUpdates();
setInterval(checkForUpdates, UPDATE_CHECK_MS);
