// ─── ConsentCheckbox — checkbox GDPR refolosibil pentru toate formularele ──
import { Shield } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  className?: string;
}

export function ConsentCheckbox({ checked, onChange, required = true, className = "" }: Props) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer group ${className}`}>
      <div className="mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="sr-only"
        />
        <div
          onClick={() => onChange(!checked)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            checked
              ? "bg-[#FF4F00] border-[#FF4F00]"
              : "border-zinc-300 bg-white group-hover:border-[#FF4F00]"
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-xs text-zinc-500 leading-relaxed">
        Sunt de acord cu prelucrarea datelor mele cu caracter personal (nume și telefon) de către{" "}
        <span className="font-semibold text-zinc-700">TECO.MD</span> în scopul contactării comerciale,
        conform{" "}
        <a
          href="/confidentialitate"
          className="text-[#FF4F00] underline underline-offset-2 hover:opacity-80 transition-opacity"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Politicii de Confidențialitate
        </a>{" "}
        și{" "}
        <span className="font-medium text-zinc-600">Legii nr. 133/2011</span> (Republica Moldova).
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </label>
  );
}
