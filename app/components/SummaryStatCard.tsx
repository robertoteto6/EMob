import { memo } from "react";

const SummaryStatCard = memo(function SummaryStatCard({
    label,
    value,
    helper,
    accent,
}: {
    label: string;
    value: string;
    helper: string;
    accent: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        {label}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{helper}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-white tabular-nums">{value}</p>
                    <p className="text-xs font-semibold text-white/50">{accent}</p>
                </div>
            </div>
        </div>
    );
});

export default SummaryStatCard;
