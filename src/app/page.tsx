import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-50">
      <h1 className="text-5xl font-bold tracking-tight text-stone-900">StoryAlive</h1>
      <p className="text-stone-500">An animated story experience</p>
      <Link
        href="/calibrate"
        className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
      >
        Begin Story
      </Link>
    </main>
  );
}