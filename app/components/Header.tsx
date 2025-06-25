import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] py-4">
      <div className="container mx-auto flex justify-between px-4">
        <Link href="/" className="text-xl font-bold text-[var(--accent)]">
          eMob
        </Link>
        <nav className="flex gap-4 items-center">
          <Link
            href="/esports"
            className="text-sm text-gray-300 hover:text-[var(--accent)]"
          >
            Partidos
          </Link>
        </nav>
      </div>
    </header>
  );
}
