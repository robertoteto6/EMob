export default function TermsPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black text-white/80">
            <div className="max-w-3xl mx-auto prose prose-invert">
                <h1 className="text-3xl font-bold text-white mb-8">Términos de Uso</h1>

                <p className="mb-4">Última actualización: 27 de Enero, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">1. Aceptación de los términos</h2>
                    <p>
                        Al acceder y utilizar EMob, aceptas cumplir con estos términos y condiciones.
                        Si no estás de acuerdo con alguna parte, no deberías usar nuestros servicios.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">2. Uso del servicio</h2>
                    <p>
                        EMob proporciona información sobre esports para fines de entretenimiento.
                        No garantizamos la exactitud absoluta de todos los datos en tiempo real.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">3. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido original, diseño y código son propiedad de EMob.
                        Los logos de equipos y juegos son propiedad de sus respectivos dueños.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-white mb-4">4. Modificaciones</h2>
                    <p>
                        Nos reservamos el derecho de modificar estos términos en cualquier momento.
                        Te notificaremos sobre cambios significativos.
                    </p>
                </section>
            </div>
        </div>
    );
}
