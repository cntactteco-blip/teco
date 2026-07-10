import sys

path = "/home/runner/workspace/artifacts/teco-md/src/pages/Services.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    ('price: "de la 300 MDL/cameră",',
     'price: "750 MDL (o cameră) / 650 MDL per cameră (mai multe)",'),
    ('priceRu: "от 300 MDL/камера",',
     'priceRu: "750 MDL (одна камера) / 650 MDL за камеру (несколько)",'),
    ('price: "de la 200 MDL/vizită",',
     'price: "350 MDL (aduci tu) / de la 650 MDL (cu deplasare)",'),
    ('priceRu: "от 200 MDL/визит",',
     'priceRu: "350 MDL (у нас) / от 650 MDL (с выездом)",'),
    ('price: "prețuri la evaluare",',
     'price: "de la 400 MDL",'),
    ('priceRu: "цены по результатам оценки",',
     'priceRu: "от 400 MDL",'),
    ('a: "Costul reparației depinde de tipul defecțiunii. Diagnosticarea on-site costă de la 200 MDL. Reparația propriu-zisă (înlocuire matrice, lentilă, modul IR, sursă) începe de la 150 MDL. Oferim evaluare gratuită înainte de a confirma lucrarea." },',
     'a: "Costul reparației depinde de tipul defecțiunii. Diagnosticarea costă 350 MDL dacă aduci echipamentul la noi, sau de la 650 MDL cu deplasare la tine. Reparația propriu-zisă (înlocuire matrice, lentilă, modul IR, sursă) începe de la 400 MDL. Oferim evaluare gratuită înainte de a confirma lucrarea." },'),
    ('a: "Diagnosticarea este procesul de identificare a defecțiunii — costă de la 200 MDL și include deplasarea, inspecția vizuală și testarea componentelor. Reparația este intervenția propriu-zisă. Dacă nu se poate repara, nu plătești pentru reparație — doar diagnosticarea." },',
     'a: "Diagnosticarea este procesul de identificare a defecțiunii — costă 350 MDL dacă aduci echipamentul la noi, sau de la 650 MDL cu deplasare la tine, și include inspecția vizuală și testarea componentelor. Reparația este intervenția propriu-zisă. Dacă nu se poate repara, nu plătești pentru reparație — doar diagnosticarea." },'),
    ('a: "Стоимость ремонта зависит от типа неисправности. Диагностика на месте стоит от 200 MDL. Сам ремонт (замена матрицы, объектива, ИК-модуля, блока питания) начинается от 150 MDL. Предлагаем бесплатную оценку перед подтверждением работы." },',
     'a: "Стоимость ремонта зависит от типа неисправности. Диагностика стоит 350 MDL, если вы привезёте оборудование к нам, или от 650 MDL с выездом к вам. Сам ремонт начинается от 400 MDL. Предлагаем бесплатную оценку перед подтверждением работы." },'),
    ('a: "Диагностика — это процесс выявления неисправности (от 200 MDL, включая выезд и тестирование). Ремонт — это непосредственное устранение проблемы. Если ремонт невозможен, платите только за диагностику." },',
     'a: "Диагностика — это процесс выявления неисправности: 350 MDL, если привезёте оборудование к нам, или от 650 MDL с выездом. Ремонт — это непосредственное устранение проблемы. Если ремонт невозможен, платите только за диагностику." },'),
    ('schemas.service({ name: "Montaj Camere de Supraveghere", description: "Instalare profesionala camere IP, NVR, kituri complete in Moldova. Preturi de la 300 MDL/camera.", url: "https://teco.md/servicii", price: "300" }),',
     'schemas.service({ name: "Montaj Camere de Supraveghere", description: "Instalare profesionala camere IP, NVR, kituri complete in Moldova. Preturi de la 650 MDL/camera (750 MDL pentru o singura camera).", url: "https://teco.md/servicii", price: "650" }),'),
    ('schemas.service({ name: "Diagnosticare si Reparatii Sisteme Supraveghere", description: "Reparatii camere IP, NVR, DVR, sisteme analogice si alarme. Diagnosticare on-site de la 200 MDL. Garantie 6 luni.", url: "https://teco.md/servicii", price: "200" }),',
     'schemas.service({ name: "Diagnosticare si Reparatii Sisteme Supraveghere", description: "Reparatii camere IP, NVR, DVR, sisteme analogice si alarme. Diagnosticare 350 MDL la sediu sau de la 650 MDL cu deplasare. Garantie 6 luni.", url: "https://teco.md/servicii", price: "350" }),'),
    ('schemas.repairService({ name: "Reparare Camera Supraveghere Moldova", description: "Reparatii camere IP si analogice (Dahua, Hikvision, TP-Link, Reolink). Piese originale. Garantie 6 luni. Chisinau + toata Moldova.", price: "150" }),',
     'schemas.repairService({ name: "Reparare Camera Supraveghere Moldova", description: "Reparatii camere IP si analogice (Dahua, Hikvision, TP-Link, Reolink). Piese originale. Garantie 6 luni. Chisinau + toata Moldova.", price: "400" }),'),
    ('Garantie 12 luni. Preturi de la 200 MDL.',
     'Garantie 12 luni. Preturi de la 350 MDL.'),
    ('Гарантия 12 месяцев. Цены от 200 MDL.',
     'Гарантия 12 месяцев. Цены от 350 MDL.'),
]

missing = []
for old, new in replacements:
    if old not in content:
        missing.append(old[:80])
    content = content.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

if missing:
    print("ATENTIE - nu s-au gasit:")
    for m in missing:
        print(" -", m)
else:
    print("Toate cele", len(replacements), "inlocuiri au reusit.")
