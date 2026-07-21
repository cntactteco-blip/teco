import { useLang } from "@/contexts/LangContext";

// ─── ConsentCheckbox — checkbox GDPR refolosibil, touch-friendly ──────────────

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  className?: string;
  dark?: boolean; // pentru fonduri închise (SmartCostCalculator)
}

export function ConsentCheckbox({ checked, onChange, required = true, className = "", dark = false }: Props) {
  const { t } = useLang();
  const toggle = () => onChange(!checked);

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggle()}
      className={`flex items-start gap-3 cursor-pointer select-none ${className}`}
    >
      {/* Checkbox vizual cu touch target 44×44px */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, marginLeft: -10, marginTop: -10 }}>
        <span
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${
            checked
              ? "bg-[#FF4F00] border-[#FF4F00]"
              : dark
                ? "border-zinc-500 bg-zinc-800"
                : "border-zinc-400 bg-white"
          }`}
        >
          {checked && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </div>

      {/* Text */}
      <span className={`text-xs leading-relaxed pt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}>
        {t("consent.pre")}{" "}
        <span className={`font-semibold ${dark ? "text-zinc-200" : "text-zinc-700"}`}>TECO.MD</span>{" "}
        {t("consent.purpose")}{" "}
        <a
          href="/confidentialitate"
          className="text-[#FF4F00] underline underline-offset-2 hover:opacity-80 transition-opacity"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {t("consent.privacy_link")}
        </a>{" "}
        {t("consent.and")}{" "}
        <span className={`font-medium ${dark ? "text-zinc-300" : "text-zinc-600"}`}>{t("consent.law")}</span>.
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </div>
  );
}
