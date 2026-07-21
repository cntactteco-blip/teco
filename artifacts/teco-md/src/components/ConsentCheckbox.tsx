// ─── ConsentCheckbox — checkbox GDPR refolosibil pentru toate formularele ──

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  className?: string;
}

export function ConsentCheckbox({ checked, onChange, required = true, className = "" }: Props) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none ${className}`}>
      {/* Wrapper cu touch target minim 44×44px pe mobile */}
      <span className="flex-shrink-0 flex items-center justify-center -m-2 p-2 rounded-xl" style={{ minWidth: 44, minHeight: 44 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="sr-only"
        />
        <span
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${
            checked
              ? "bg-[#FF4F00] border-[#FF4F00] shadow-sm"
              : "border-zinc-400 bg-white"
          }`}
        >
          {checked && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </span>

      <span className="text-xs text-zinc-500 leading-relaxed pt-0.5">
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
