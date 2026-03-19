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
