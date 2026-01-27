import { CheckIcon, StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

const features = [
    "Sin publicidad",
    "Estadísticas avanzadas en tiempo real",
    "Predicciones de IA ilimitadas",
    "Insignia Pro en tu perfil",
    "Soporte prioritario",
    "Acceso anticipado a nuevas funciones",
];

export default function ProPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black/95">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent mb-6">
                        Eleva tu juego con EMob Pro
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Desbloquea todo el potencial de tu experiencia esports con herramientas exclusivas y contenido premium.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-2">Básico</h2>
                        <p className="text-white/50 mb-6">Para el fan casual de esports</p>
                        <div className="text-3xl font-bold text-white mb-8">Gratis</div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-white/70">
                                <CheckIcon className="w-5 h-5 text-emerald-400" />
                                Seguimiento de partidos en vivo
                            </li>
                            <li className="flex items-center gap-3 text-white/70">
                                <CheckIcon className="w-5 h-5 text-emerald-400" />
                                Noticias y resultados básicos
                            </li>
                            <li className="flex items-center gap-3 text-white/70">
                                <CheckIcon className="w-5 h-5 text-emerald-400" />
                                Comunidad y foros
                            </li>
                        </ul>

                        <Link
                            href="/"
                            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-center transition-all"
                        >
                            Continuar Gratis
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-8 flex flex-col group overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-all duration-500" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-2xl font-bold text-amber-300">Pro</h2>
                                <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                                    Recomendado
                                </div>
                            </div>
                            <p className="text-amber-200/60 mb-6">Para el verdadero entusiasta</p>

                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-4xl font-bold text-white">$4.99</span>
                                <span className="text-white/50">/ mes</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-white">
                                        <StarIcon className="w-5 h-5 text-amber-400" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-center shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02]">
                                Obtener Pro
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <p className="text-white/40 text-sm">
                        Pagos seguros procesados por Stripe. Cancelación disponible en cualquier momento.
                    </p>
                </div>
            </div>
        </div>
    );
}
