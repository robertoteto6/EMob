export default function CookiesPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black text-white/80">
            <div className="max-w-3xl mx-auto prose prose-invert">
                <h1 className="text-3xl font-bold text-white mb-8">Política de Cookies</h1>

                <p className="mb-4">Última actualización: 27 de Enero, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">1. ¿Qué son las cookies?</h2>
                    <p>
                        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo
                        para ayudar a que el sitio web funcione mejor y recordar tus preferencias.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">2. Cómo usamos las cookies</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Esenciales:</strong> Para mantener tu sesión iniciada.</li>
                        <li><strong>Preferencias:</strong> Para recordar tus juegos y equipos favoritos.</li>
                        <li><strong>Analíticas:</strong> Para entender cómo usas nuestra plataforma y mejorarla.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-white mb-4">3. Control de cookies</h2>
                    <p>
                        Puedes controlar y/o eliminar las cookies según desees desde la configuración de tu navegador.
                    </p>
                </section>
            </div>
        </div>
    );
}
