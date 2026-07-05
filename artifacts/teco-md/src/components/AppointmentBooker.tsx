import { useState } from "react";
import { Calendar, Clock, Wrench, CheckCircle, Phone } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";

const SERVICES_RO = ["Montaj camere (casă)", "Montaj camere (afacere)", "Diagnosticare sistem", "Reparații echipament", "Configurare aplicație", "Audit securitate"];
const SERVICES_RU = ["Монтаж камер (дом)", "Монтаж камер (бизнес)", "Диагностика системы", "Ремонт оборудования", "Настройка приложения", "Аудит безопасности"];

function getNextDays(n: number) {
  const days = [];
  const now = new Date();
  const dayNamesRo = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const dayNamesRu = ["Вск", "Пнд", "Втр", "Срд", "Чтв", "Птн", "Сбт"];
  const monthNamesRo = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
  const monthNamesRu = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  for (let i = 1; i <= n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() === 0) continue;
    days.push({
      date: d,
      labelRo: `${dayNamesRo[d.getDay()]} ${d.getDate()} ${monthNamesRo[d.getMonth()]}`,
      labelRu: `${dayNamesRu[d.getDay()]} ${d.getDate()} ${monthNamesRu[d.getMonth()]}`,
      isoDate: d.toISOString().split("T")[0],
    });
    if (days.length >= n) break;
  }
  return days;
}

const TIME_SLOTS = ["09:00–11:00", "11:00–13:00", "13:00–15:00", "15:00–17:00", "17:00–19:00"];

export function AppointmentBooker() {
  const { lang } = useLang();
  const ro = lang === "ro";
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");

  const [step, setStep] = useState<"service" | "date" | "time" | "done">("service");
  const [service, setService] = useState<string | null>(null);
  const [day, setDay] = useState<(typeof days)[0] | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const days = getNextDays(7);
  const services = ro ? SERVICES_RO : SERVICES_RU;

  const handleBook = () => {
    if (!service || !day || !time) return;
    const label = ro ? day.labelRo : day.labelRu;
    const msg = ro
      ? `Bună ziua! Vreau să programez: ${service}\nData: ${label}\nInterval: ${time}\nVă rog confirmați programarea.`
      : `Здравствуйте! Хочу записаться: ${service}\nДата: ${label}\nВремя: ${time}\nПожалуйста, подтвердите запись.`;
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    setStep("done");
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#09090B] px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <Calendar className="w-5 h-5 text-[#FF4F00]" />
          <h3 className="font-black text-white text-lg">
            {ro ? "Programează Instalarea" : "Запись на Установку"}
          </h3>
        </div>
        <p className="text-zinc-400 text-sm">
          {ro ? "Alege serviciul, data și intervalul — tehnicianul vine la tine." : "Выберите услугу, дату и время — техник приедет к вам."}
        </p>
        {/* Progress */}
        <div className="flex items-center gap-1.5 mt-4">
          {(["service", "date", "time"] as const).map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step === "done" || (step === "time" && i <= 2) || (step === "date" && i <= 1) || (step === "service" && i === 0) ? "bg-[#FF4F00]" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="p-5">
        {step === "done" ? (
          <div className="text-center py-6">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h4 className="font-black text-[#09090B] text-xl mb-2">
              {ro ? "Cerere trimisă!" : "Заявка отправлена!"}
            </h4>
            <p className="text-zinc-500 text-sm mb-1">
              {ro ? `Serviciu: ${service}` : `Услуга: ${service}`}
            </p>
            <p className="text-zinc-500 text-sm mb-1">
              {day ? (ro ? day.labelRo : day.labelRu) : ""} • {time}
            </p>
            <p className="text-zinc-400 text-xs mt-3">
              {ro ? "Un inginer vă va confirma în 15 minute pe WhatsApp." : "Инженер подтвердит запись в течение 15 минут в WhatsApp."}
            </p>
            <button onClick={() => { setStep("service"); setService(null); setDay(null); setTime(null); }} className="mt-5 text-[#FF4F00] font-semibold text-sm hover:underline">
              {ro ? "Programează altă vizită" : "Записаться на другой визит"}
            </button>
          </div>
        ) : step === "service" ? (
          <>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{ro ? "1. Alege serviciul" : "1. Выберите услугу"}</p>
            <div className="grid grid-cols-1 gap-2">
              {services.map((s) => (
                <button key={s} onClick={() => { setService(s); setStep("date"); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-all hover:border-[#FF4F00] hover:bg-orange-50 ${service === s ? "border-[#FF4F00] bg-orange-50 text-[#FF4F00]" : "border-zinc-200 text-[#09090B]"}`}>
                  <Wrench className="w-4 h-4 flex-shrink-0 text-[#FF4F00]" />
                  {s}
                </button>
              ))}
            </div>
          </>
        ) : step === "date" ? (
          <>
            <button onClick={() => setStep("service")} className="text-xs text-zinc-400 mb-3 hover:text-zinc-600 transition-colors flex items-center gap-1">← {ro ? "Înapoi" : "Назад"}</button>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{ro ? "2. Alege data" : "2. Выберите дату"}</p>
            <div className="grid grid-cols-3 gap-2">
              {days.map((d) => (
                <button
                  key={d.isoDate}
                  onClick={() => { setDay(d); setStep("time"); }}
                  className={`py-3 px-2 rounded-xl border text-center text-xs font-bold transition-all hover:border-[#FF4F00] hover:bg-orange-50 ${day?.isoDate === d.isoDate ? "border-[#FF4F00] bg-orange-50 text-[#FF4F00]" : "border-zinc-200 text-[#09090B]"}`}
                >
                  {ro ? d.labelRo : d.labelRu}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep("date")} className="text-xs text-zinc-400 mb-3 hover:text-zinc-600 transition-colors flex items-center gap-1">← {ro ? "Înapoi" : "Назад"}</button>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{ro ? "3. Alege intervalul orar" : "3. Выберите временной интервал"}</p>
            <div className="space-y-2 mb-5">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all hover:border-[#FF4F00] hover:bg-orange-50 ${time === t ? "border-[#FF4F00] bg-orange-50 text-[#FF4F00]" : "border-zinc-200 text-[#09090B]"}`}
                >
                  <Clock className="w-4 h-4 text-[#FF4F00]" />
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={handleBook}
              disabled={!time}
              className="w-full bg-[#FF4F00] text-white font-black py-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {ro ? "Confirmă pe WhatsApp" : "Подтвердить в WhatsApp"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
