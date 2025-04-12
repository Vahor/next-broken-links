import Link from "next/link";

export default function Home() {
	return (
		<div>
			<Link href="/">Home is correct</Link>
			<Link href="/something.json">Something.json is correct</Link>
			<Link href="/hello/world/again">This is a broken link</Link>
			<Link href="/hello/world/again">This is a broken link</Link>
			<Link href="https://vahor.fr/this/also/fails">This is a broken link</Link>
			<Link href="https://vahor.fr/hello/world">But here it works</Link>
			<Link href="https://vahor.fr/something.json">
				Assets also works with absolute paths
			</Link>
		</div>
	);
}
