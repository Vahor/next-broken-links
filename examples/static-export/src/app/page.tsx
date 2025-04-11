import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/hello/world">Correct link</Link>
      <Link href="/hello/world/again">This is a broken link</Link>
    </div>
  );
}
