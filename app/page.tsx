import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4 sm:p-8 font-sans flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-[var(--accent)]">Seguimiento de eSports</h1>
      <p className="text-center max-w-md">
        Bienvenido a la aplicación de seguimiento de deportes electrónicos. Consulta
        los próximos encuentros y resultados de tus equipos favoritos.
      </p>
      <Link
        href="/esports"
        className="bg-[var(--accent)] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
      >
        Ver partidos
      </Link>
    </main>
  );
}
