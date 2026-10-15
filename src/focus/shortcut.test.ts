import assert from "node:assert/strict";
import { test } from "node:test";

import { focusNameFor, SHORTCUT } from "./shortcut";

const modes = [
	{ id: "rest", name: "Rest" },
	{ id: "work-a", name: "Work" },
	{ id: "work-b", name: "Work" },
];

test("a key's mode is switched to by its current name", () => {
	assert.equal(focusNameFor(modes, "rest"), "Rest");
});

test("a mode sharing its name with another can't be switched to, since Shortcuts picks a Focus by name", () => {
	assert.equal(focusNameFor(modes, "work-a"), undefined);
});

test("a mode that no longer exists can't be switched to", () => {
	assert.equal(focusNameFor(modes, "gone"), undefined);
});

test("the shortcut turns the Focus named by its input on, rather than toggling it", () => {
	const [setFocus] = SHORTCUT.WFWorkflowActions;
	assert.equal(setFocus.WFWorkflowActionIdentifier, "is.workflow.actions.dnd.set");
	assert.equal(setFocus.WFWorkflowActionParameters.Enabled, 1);
	assert.equal("Operation" in setFocus.WFWorkflowActionParameters, false);
	assert.deepEqual(setFocus.WFWorkflowActionParameters.FocusModes.Value, { Type: "ExtensionInput" });
});
