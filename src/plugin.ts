import streamDeck from "@elgato/streamdeck";

import { FocusModeKey } from "./actions/focus-mode";

streamDeck.logger.setLevel("trace");

streamDeck.actions.registerAction(new FocusModeKey());

streamDeck.connect();
