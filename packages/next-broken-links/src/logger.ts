import chalk from "chalk";
import ora from "ora";

export const value = (value: string) => chalk.blue(value);

export const warning = chalk.yellow("⚠ warning");
export const error = chalk.red("✖ error");
export const success = chalk.green("✔");
export const toolName = value("@vahor/next-broken-links");

export const log = (message: string) => {
	console.log(`${message}`);
};

export const debug = (message: string) => {
	if (process.env.DEBUG) {
		console.debug(chalk.magenta(`[debug] ${message}`));
	}
};

interface ProgressOptions {
	title: string;
	progress: (completed: number) => string;
	success?: string;
}

export const withProgess = async <T>(
	promises: Promise<T>[],
	{ title, progress, success }: ProgressOptions,
): Promise<T[]> => {
	const spinner = ora(title).start();
	let completed = 0;
	const tracked = promises.map(async (promise) => {
		const r = await promise;
		completed++;
		spinner.text = progress(completed);
		return r;
	});
	const results = await Promise.all(tracked);
	if (success) {
		spinner.succeed(success);
	} else {
		spinner.stop();
	}
	return results;
};
