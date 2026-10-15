import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { FocusMode } from "./modes";

const execFileAsync = promisify(execFile);

const FALLBACK_SYMBOL = "circle.fill";
const DIMMED_ALPHA = 0.3;

const RENDER = String.raw`
function run([symbolName, tintName, alphaText]) {
	ObjC.import("AppKit");
	const alpha = Number(alphaText);
	const size = 144;

	const symbol = $.NSImage.imageWithSystemSymbolNameAccessibilityDescription($(symbolName), $());
	if (symbol.isNil()) return "";
	const tint = $.NSColor.respondsToSelector(tintName) ? $.NSColor[tintName] : $.NSColor.systemGrayColor;

	const rep = $.NSBitmapImageRep.alloc.initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
		$(), size, size, 8, 4, true, false, $.NSDeviceRGBColorSpace, 0, 0,
	);
	$.NSGraphicsContext.saveGraphicsState;
	$.NSGraphicsContext.setCurrentContext($.NSGraphicsContext.graphicsContextWithBitmapImageRep(rep));

	tint.colorWithAlphaComponent(alpha).setFill;
	$.NSBezierPath.fillRect($.NSMakeRect(0, 0, size, size));

	const config = $.NSImageSymbolConfiguration.configurationWithPointSizeWeight(64, 0).configurationByApplyingConfiguration(
		$.NSImageSymbolConfiguration.configurationWithPaletteColors($([$.NSColor.whiteColor])),
	);
	const glyph = symbol.imageWithSymbolConfiguration(config);
	const { width, height } = glyph.size;
	glyph.drawInRectFromRectOperationFraction($.NSMakeRect((size - width) / 2, (size - height) / 2, width, height), $.NSZeroRect, 2, alpha);

	$.NSGraphicsContext.restoreGraphicsState;
	return rep.representationUsingTypeProperties(4, $()).base64EncodedStringWithOptions(0).js;
}`;

async function render(symbol: string, tint: string, alpha: number): Promise<string> {
	const { stdout } = await execFileAsync("osascript", ["-l", "JavaScript", "-e", RENDER, symbol, tint, String(alpha)]);
	return stdout.trim();
}

const cache = new Map<string, Promise<string>>();

/**
 * The key image for a mode, as a PNG data URI: in its colour when lit, faded when dimmed.
 */
export function renderIcon({ symbol, tint }: Pick<FocusMode, "symbol" | "tint">, lit: boolean): Promise<string> {
	const key = `${symbol}|${tint}|${lit}`;
	let icon = cache.get(key);
	if (icon === undefined) {
		const alpha = lit ? 1 : DIMMED_ALPHA;
		const tintName = tint ?? "systemGrayColor";
		icon = render(symbol ?? FALLBACK_SYMBOL, tintName, alpha)
			.then(async (png) => png || render(FALLBACK_SYMBOL, tintName, alpha))
			.then((png) => `data:image/png;base64,${png}`);
		icon.catch(() => cache.delete(key));
		cache.set(key, icon);
	}
	return icon;
}
