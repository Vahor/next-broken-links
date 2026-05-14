import { styleText } from "node:util";
import { Spinner } from "picospinner";

export const value = (value: string) => styleText("blue", value);

export const error = styleText("red", "✖");
export const success = styleText("green", "✔");

export const debug = (message: string) => {
	if (process.env.DEBUG) {
		console.debug(styleText("magenta", `[debug] ${message}`));
	}
};

interface ProgressOptions {
	title: string;
	progress: (completed: number) => string;
	success?: string;
	fail?: string;
}

export const withProgress = async <T>(
	promises: Promise<T>[],
	{ title, progress, success, fail }: ProgressOptions,
): Promise<T[]> => {
	const spinner = new Spinner(title);
	spinner.start();
	let completed = 0;
	const trackedPromises = promises.map(async (promise) => {
		const result = await promise;
		completed++;
		spinner.setText(progress(completed));
		return result;
	});

	try {
		const results = await Promise.all(trackedPromises);
		if (success) {
			spinner.succeed(success);
		} else {
			spinner.stop();
		}
		return results;
	} catch (e) {
		spinner.fail(fail ?? "Failed");
		console.log(`${error} ${(e as Error).message}`);
		if (process.env.DEBUG) {
			throw e;
		}
		process.exit(1);
	}
};
