import { EnvelopeIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Contáctanos</h1>

                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <p className="text-white/60 mb-8 leading-relaxed">
                            ¿Tienes alguna pregunta, sugerencia o problema? Nos encantaría escucharte.
                            Nuestro equipo de soporte está disponible para ayudarte.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <EnvelopeIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Email</h3>
                                    <a href="mailto:support@emob.gg" className="text-emerald-400 hover:underline">
                                        support@emob.gg
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                                    <MapPinIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Ubicación</h3>
                                    <p className="text-white/60">
                                        Madrid, España<br />
                                        (100% Remoto)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <form className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="w-full rounded-lg bg-black/50 border border-white/10 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full rounded-lg bg-black/50 border border-white/10 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1">Mensaje</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full rounded-lg bg-black/50 border border-white/10 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                                    placeholder="¿En qué podemos ayudarte?"
                                />
                            </div>
                            <button
                                type="button" // Static for now
                                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                            >
                                Enviar Mensaje
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
