import chalk from "chalk";
import ora from "ora";

export const value = (value: string) => chalk.blue(value);

export const error = chalk.red("✖");
export const success = chalk.green("✔");

export const debug = (message: string) => {
	if (process.env.DEBUG) {
		console.debug(chalk.magenta(`[debug] ${message}`));
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
	const spinner = ora(title).start();
	let completed = 0;
	for (const promise of promises) {
		promise.then(() => {
			completed++;
			spinner.text = progress(completed);
		});
	}
	try {
		const results = await Promise.all(promises);
		if (success) {
			spinner.succeed(success);
		} else {
			spinner.stop();
		}
		return results;
	} catch (e) {
		spinner.fail(fail);
		console.log(`${error} ${(e as Error).message}`);
		if (process.env.DEBUG) {
			throw e;
		}
		process.exit(1);
	}
};
