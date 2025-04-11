interface PageProps {
	params: Promise<{ slug: string[] }>;
}

export default async function Page({ params }: PageProps) {
	const { slug } = await params;

	return (
		<div>
			<h1>Page: {slug.join("/")}</h1>
		</div>
	);
}

export async function generateStaticParams() {
	return [{ slug: ["hello", "world"] }];
}
