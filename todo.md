# Portal Inginerie Creativă — TODO

## Setup & Brand
- [x] Schema bază de date completă (users, pontaj, time-tracking, stiri, documente, procese, propuneri)
- [x] Brand: culori alb/negru/galben #FFCB09, font TeX Gyre Heros
- [x] Upload logo și assets brand (CDN)
- [x] Layout principal cu sidebar (DashboardLayout customizat IC)
- [x] Pagina de login cu Google OAuth

## Autentificare & RBAC
- [x] Google OAuth restricționat la @ingineriecreativa.ro
- [x] Roluri: super_admin, admin_hr, manager, angajat, colaborator
- [x] Middleware RBAC pe proceduri tRPC
- [x] Profil utilizator (fotografie, funcție, departament)

## Dashboard Principal
- [x] Widget status pontaj (check-in/check-out, ore lucrate azi)
- [x] Timer activitate curentă (time-tracking în desfășurare)
- [x] Anunțuri și știri recente
- [x] Acces rapid la resurse frecvente
- [x] Notificări (documente noi, aprobări, pontaj neînchis)
- [ ] Calendar intern cu evenimente (placeholder - viitor)

## Modul Pontaj
- [x] Check-in manual la login
- [x] Check-out manual
- [x] Înregistrare pauze
- [x] Tipuri prezență: birou/remote/deplasare/concediu/medical/liber
- [x] Fișă pontaj lunară per angajat (calendar view)
- [x] Raport centralizat HR
- [ ] Cereri corecție pontaj (flux aprobare) - viitor
- [ ] Export salarizare - viitor

## Modul Time-Tracking
- [x] Timer în timp real (start/stop)
- [x] Înregistrare manuală retroactivă
- [x] Organizare pe proiecte
- [x] Flag facturabil/nefacturabil
- [x] Tablou de bord personal (ore azi vs normă, distribuție săptămânală)
- [x] Raport per proiect
- [ ] Raport profitabilitate (ore estimate vs reale) - viitor

## Modul Știri & Comunicare
- [x] Articole cu text formatat și imagini
- [x] Categorii: Companie, Proiecte, HR, IT, Evenimente, Realizări
- [x] Sistem reacții și comentarii
- [x] Arhivă căutabilă
- [ ] Notificări push/email pentru știri importante - viitor

## Modul Documente Personale
- [x] Spațiu personal securizat (vizibil doar angajat + HR)
- [x] Tipuri: contract, fișă post, evaluare, certificate, salariu, concedii
- [x] Upload fișiere (stocat în S3)
- [x] Jurnal audit accese
- [ ] Criptare AES-256 la nivel de fișier - viitor

## Modul Procese & Proceduri
- [x] Bibliotecă organizată pe departamente
- [x] Control versiuni (versiune, dată actualizare, proprietar)
- [x] Pași detaliați, diagrame flux, formulare asociate
- [x] Funcționalitate "Confirmare Lectură"
- [x] Rapoarte status confirmări

## Modul Propuneri de Îmbunătățire
- [x] Formular propunere (titlu, descriere, beneficii)
- [x] Număr referință automat
- [x] Vot și comentarii colegi
- [x] Flux aprobare: Angajat → Manager → Comitet
- [x] Notificări status propunere

## Integrare Google Drive
- [x] Listare proiecte din Google Drive (structură manuală + sync)
- [x] Sincronizare foldere → proiecte time-tracking
- [ ] Afișare documente cu respectarea drepturilor de acces - necesită Google API key
- [ ] Căutare full-text în documente Drive - necesită Google API key

## Non-funcționale
- [x] Responsive design (desktop + mobil)
- [x] Loading states și error handling
- [x] Vitest tests pentru proceduri principale (33/33 passed)

## Buguri Active
- [x] Fix eroare "OAuth callback failed" la autentificare cu cont @ingineriecreativa.ro
- [x] Fix erori SQL: coloane lipsă în tabele (proposals, projects, news, pontaj) - discrepanță schema Drizzle vs DB
- [x] Fix SelectItem value gol în pagina /stiri (și alte pagini cu Select)
- [x] Fix routing conflict /stiri/nou vs /stiri/:id - NaN la newsId/id
- [x] Redesign Pontaj: selector dată, dropdown ore din 30 în 30 min, locații firmă, notă, asociere proiect
- [x] Enum pontaj extins: santier, eveniment adăugate în schema DB și migrare SQL aplicată
- [x] Pontaj: locații specifice firmei (București Caracas 4, Cluj KITE, Miercurea-Ciuc, Brașov IASC, Eveniment, Deplasare, Vizită Șantier, Telemuncă)
- [x] Pontaj: selecție locație mai vizibilă (border galben mai gros + fundal galben mai intens)
- [x] Pontaj: fix bug timezone - orele se salvează cu offset UTC (8:30 → 14:30)
- [x] Pontaj: editare intrări trecute din raportul lunar
- [x] Pontaj: blocare editare dacă luna este închisă (luna curentă = deschisă, lunile anterioare = închise)
- [x] Pontaj: fix bug timezone backend - orele se salvează cu offset +6h (8:30 → 14:30)
- [x] Pontaj: UX dropdown ieșire - elimină opțiunea "Fără Ieșire", pornire de la ora intrare +30min
- [x] Rapoarte HR: instalare exceljs + pdfkit pe server
- [x] Rapoarte HR: proceduri tRPC pentru 5 rapoarte (pontaj lunar, sumar echipă, concedii/absențe, ore suplimentare, pontaj per proiect)
- [x] Rapoarte HR: endpoint Express pentru generare și descărcare Excel branded
- [x] Rapoarte HR: endpoint Express pentru generare și descărcare PDF branded
- [x] Rapoarte HR: pagina RapoarteHR.tsx cu filtre, preview tabel, butoane export Excel+PDF
- [x] Rapoarte HR: acces restricționat la rolurile super_admin, admin_hr, manager

## Module Noi (Sprint 3)
- [x] Cereri Concediu: schema DB (tabel leave_requests cu status flux)
- [x] Cereri Concediu: proceduri tRPC (creare, listare, aprobare, respingere)
- [x] Cereri Concediu: pagina angajat (formular depunere + istoric cereri proprii)
- [x] Cereri Concediu: pagina manager/HR (lista cereri echipă + aprobare/respingere)
- [x] Cereri Concediu: notificări automate la schimbare status
- [x] Admin Utilizatori: proceduri tRPC (listare, update rol, dezactivare, invitare)
- [x] Admin Utilizatori: pagina cu tabel angajați, filtre, editare rol inline
- [x] Admin Utilizatori: dialog adăugare utilizator manual + dezactivare cont
- [x] Dashboard HR: statistici pontaj lunar (prezențe, absențe, ore totale echipă)
- [x] Dashboard HR: statistici cereri concediu (în așteptare, aprobate, respinse)
- [x] Dashboard HR: grafic distribuție locații și tipuri prezență
- [x] Dashboard HR: alerte angajați fără pontaj înregistrat în ziua curentă
- [x] Sidebar: secțiunea ADMINISTRARE extinsă cu noile pagini

## Fix-uri vizuale (Sprint 4)
- [x] Sidebar: scrollbar galben pe fundal transparent (înlocuiește scrollbar-ul default)
- [x] DashboardLayout: eliminare header duplicat care apare de două ori
- [x] AdminUtilizatori: fix overlap buton schimbare rol cu chenarul din spate
- [x] AdminUtilizatori: simplificare roluri la admin, angajat, manager, colaborator

## Fix-uri (Sprint 5)
- [x] PDF Export: fix diacritice românești (ă, â, î, ș, ț) — font pdfkit înlocuit cu Roboto TTF Unicode

## Simplificare roluri (Sprint 6)
- [x] Schema DB: enum role simplificat la admin, angajat, colaborator (migrare SQL)
- [x] RBAC middleware: adminProcedure verifică role === 'admin' (în loc de super_admin/admin_hr/manager)
- [x] routers.ts: actualizare toate referințele la roluri vechi
- [x] AdminUtilizatori.tsx: dropdown cu 3 roluri (Admin, Angajat, Colaborator)
- [x] DashboardHR, RapoarteHR, AprobariConcediu: acces restricționat la role === 'admin'
- [x] Migrare date: utilizatorii cu super_admin/admin_hr/manager → admin

## Profil extins (Sprint 7)
- [x] Schema DB: câmpuri noi în users (birthDate, hireDate, addressBuletin, addressSecondary, cnp, ciSeries, ciNumber, ciExpiry, iban, emergencyContact, emergencyPhone, bloodType, notes)
- [x] Backend: proceduri tRPC profile.getMyProfile, profile.updateMyProfile, profile.adminGetProfile
- [x] Frontend: pagina Profil.tsx redesenată cu secțiuni (Info personale, Adrese, Date CI, Financiar, Contact urgență)
- [x] Câmpuri sensibile (CNP, IBAN, CI) vizibile doar utilizatorului propriu și adminului
- [ ] Reminder zile de naștere: afișare în calendar și notificare (backlog)

## Fix-uri profil (Sprint 8)
- [x] Profil: câmp separat telefon mobil personal + telefon de serviciu (2 câmpuri distincte)

## Fix-uri vizuale (Sprint 9)
- [x] Sidebar: logo mai mare, fundal transparent, versiunea galbenă cu text negru

## Sprint 10 — Zile naștere + Organigramă
- [x] Backend: procedură tRPC people.upcomingBirthdays (30 zile viitoare)
- [x] Backend: procedură tRPC people.orgChart (structură ierarhică din department + jobTitle)
- [x] Dashboard: card "Zile de naștere" cu avatare, nume, data și countdown zile
- [x] Organigramă: pagina interactivă cu noduri per departament, expand/collapse, căutare

## Sprint 11 — Fix-uri critice
- [x] Profil: fix bug salvare — datele se salvează pe userId, nu pe sesiune globală
- [x] Profil: dropdown departamente cu 5 opțiuni (proiectare arhitectură, structură, instalații, vânzări, execuție)
- [x] Dashboard: fix card zile de naștere — vizibil mereu, cu mesaj gol dacă nu există date
- [x] Dashboard: elimină widget pontaj duplicat, înlocuiește cu shortcut rapid spre Pontaj zilnic
- [x] AdminUtilizatori: buton ștergere completă utilizator + dialog confirmare cu avertisment
- [x] AdminUtilizatori: sortare alfabetică — activi primii, inactivi la final
- [x] AdminUtilizatori: dropdown departamente în dialogul de editare profil

## Sprint 12 — Time-Tracking Calendar View + Restricție Login
- [x] Time-Tracking: instalare react-big-calendar + date-fns adaptor
- [x] Time-Tracking: backend — proceduri tRPC pentru calendar entries (săptămânal, creare, editare, ștergere)
- [x] Time-Tracking: UI calendar săptămânal cu sloturi 30 min (06:00–21:00)
- [x] Time-Tracking: click pe slot gol → dialog rapid creare intrare (proiect + titlu + durată)
- [x] Time-Tracking: blocuri colorate per tip activitate + proiect
- [ ] Time-Tracking: drag & drop pentru redimensionare/mutare blocuri (backlog)
- [ ] Time-Tracking: vedere zi + lună (backlog)
- [ ] Time-Tracking: integrare cu pontaj zilnic (backlog)
- [x] Restricție login: verificare email @ingineriecreativa.ro în OAuth callback
