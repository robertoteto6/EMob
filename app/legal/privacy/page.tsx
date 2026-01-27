export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black text-white/80">
            <div className="max-w-3xl mx-auto prose prose-invert">
                <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidad</h1>

                <p className="mb-4">Última actualización: 27 de Enero, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">1. Introducción</h2>
                    <p>
                        En EMob, nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos,
                        usamos y protegemos tu información personal cuando utilizas nuestra plataforma.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">2. Información que recopilamos</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Información de cuenta (nombre de usuario, email).</li>
                        <li>Preferencias de juegos y equipos.</li>
                        <li>Datos de uso y navegación en la plataforma.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">3. Uso de la información</h2>
                    <p>
                        Utilizamos tu información para personalizar tu experiencia, enviarte notificaciones relevantes
                        sobre partidos y mejorar nuestros servicios.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-white mb-4">4. Contacto</h2>
                    <p>
                        Si tienes preguntas sobre esta política, contáctanos en <a href="mailto:privacy@emob.gg" className="text-emerald-400">privacy@emob.gg</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
