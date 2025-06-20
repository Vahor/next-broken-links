import Link from "next/link";

export default function Home() {
	return (
		<div>
			<Link href="/">Home is correct</Link>
			<Link href="/sitemap.xml">sitemap.xml is correct</Link>
			<Link href="/sitemap.xml?a=b">
				sitemap.xml with query params is correct
			</Link>
			<Link href="/something.json">Something.json is correct</Link>
			<Link href="/incorrect.json">This one is incorrect</Link>
			<Link href="/hello/world">This is a correct link</Link>
			<Link href="/hello/world?a=b">
				This is a correct link with query params
			</Link>
			<Link href="/hello/world/again">This is a broken link</Link>
			<Link href="https://vahor.fr/this/also/fails">This is a broken link</Link>
			<Link href="https://vahor.fr/hello/world">But here it works</Link>
			<Link href="https://vahor.fr/hello/world?b=c">
				Query params are ignored
			</Link>
			<Link href="https://vahor.fr/something.json">
				Assets also works with absolute paths
			</Link>
			<Link href="https://vahor.fr/invalid.json">This one is invalid</Link>
			<Link href="https://vahor.fr/sitemap.xml">
				sitemap.xml with domain is correct
			</Link>
			<Link href="https://vahor.fr/sitemap.xml?a">
				sitemap.xml with domain and query params is correct
			</Link>
			<Link href="https://vahor.fr/invalid-zip-file.zip">
				This file does not exist but is ignored
			</Link>
			<Link href="/another-invalid-zip-file.zip">
				This file does not exist and is not ignored
			</Link>

			{/* Image examples for testing broken link checking */}
			<img src="/something.json" alt="This image points to a valid file" />
			<img src="/invalid-image.jpg" alt="This image is broken" />
			<img
				src="https://vahor.fr/something.json"
				alt="External image pointing to valid file"
			/>
			<img
				src="https://vahor.fr/invalid-external.png"
				alt="External image that doesn't exist"
			/>
		</div>
	);
}
