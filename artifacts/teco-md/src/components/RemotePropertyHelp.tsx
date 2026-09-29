import { Link } from "wouter";
import { MessageCircle } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useStore } from "@/lib/store";

export default function RemotePropertyHelp({ repair = false }: { repair?: boolean }) {
  const { lang } = useLang();
  const ro = lang === "ro";
  const phone = useStore(s => s.settings.general?.adminPhone || "37367200463").replace(/\D/g, "");
  const message = ro
    ? `Bună ziua! Locuiesc peste hotare și am nevoie de ${repair ? "diagnosticarea camerelor" : "montaj camere"} la o proprietate în Moldova. Localitatea: __. ${repair ? "Problema și modelul echipamentului" : "Tipul proprietății și zonele de supravegheat"}: __. Persoana care poate oferi acces: __.`
    : `Здравствуйте! Я живу за границей. Нужна ${repair ? "диагностика видеонаблюдения" : "установка камер"} на объекте в Молдове. Населённый пункт: __. ${repair ? "Неисправность и модель оборудования" : "Тип объекта и зоны наблюдения"}: __. Кто может предоставить доступ: __.`;
  return <section className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
    <h2 className="text-xl md:text-2xl font-bold text-zinc-950">{ro ? "Locuiești peste hotare și ai o proprietate în Moldova?" : "Живёте за границей, а ваш объект находится в Молдове?"}</h2>
    <p className="mt-4 leading-relaxed text-zinc-600">{ro
      ? "Poți începe discuția pe WhatsApp din țara în care locuiești. Lucrarea se evaluează pentru adresa din Moldova; programarea, accesul la proprietate și costurile se confirmă înainte de intervenție."
      : "Начать обсуждение можно в WhatsApp из страны, где вы живёте. Работа оценивается для адреса в Молдове; время выезда, доступ к объекту и стоимость согласовываются заранее."}</p>
    <ol className="mt-4 list-decimal space-y-3 pl-5 text-zinc-600 leading-relaxed">
      <li>{ro ? "Trimite localitatea, tipul proprietății și fotografii ale zonelor de supravegheat sau ale echipamentului existent." : "Укажите населённый пункт и тип объекта. Пришлите фотографии зон наблюдения или имеющегося оборудования."}</li>
      <li>{ro ? "Spune cine poate oferi acces la fața locului și dacă există internet și alimentare electrică." : "Сообщите, кто может предоставить доступ на месте, есть ли интернет и электричество."}</li>
      <li>{ro ? "Cere devizul cu echipamente, materiale, manoperă și deplasare separate. Disponibilitatea și durata se stabilesc după evaluare." : "Запросите смету с отдельными суммами за оборудование, материалы, работу и выезд. Доступность и сроки определяются после оценки."}</li>
      <li>{ro ? "Pentru vizualizarea de pe telefon, verificăm compatibilitatea aplicației și conexiunea sistemului. Accesul de la distanță depinde de internetul disponibil la obiect." : "Для просмотра с телефона проверяются совместимость приложения и подключение системы. Удалённый доступ зависит от интернета на объекте."}</li>
    </ol>
    <div className="mt-6 flex flex-wrap gap-3">
      <a href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#FF4F00] px-5 py-3 font-bold text-white"><MessageCircle size={18} />{ro ? "Discută proiectul pe WhatsApp" : "Обсудить проект в WhatsApp"}</a>
      {!repair && <Link href="/oferta" className="inline-flex items-center rounded-xl border border-zinc-200 px-5 py-3 font-semibold text-zinc-950">{ro ? "Trimite o cerere de ofertă" : "Запросить предложение"}</Link>}
    </div>
  </section>;
}
