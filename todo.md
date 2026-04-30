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

## Sprint 13 — Fix-uri vizuale TimeTracking
- [x] TimeTracking: culori calendar mai puternice (fundal întunecat #221F1F pe zile, text alb, blocuri mai opace)
- [x] TimeTracking: fundal galben #FFCB09 + text negru pe ziua curentă; zile normale fundal întunecat + text galben
- [x] TimeTracking: buton "Azi" galben vizibil când ești pe altă săptămână, gri când ești pe săptămâna curentă

## Sprint 14 — Fix-uri vizuale TimeTracking + Layout compact
- [x] TimeTracking: fix buton "Azi" — comparație corectă cu getTime() în loc de isSameDay
- [x] TimeTracking: blocuri activitate cu culoare solidă (100% opacitate, chenar solid)
- [x] TimeTracking: eliminată legenda de tipuri activitate de jos
- [x] TimeTracking/DashboardLayout: calendar mai compact (padding redus, header mai mic, înălțime optimizată)

## Sprint 15 — Reproiectare completă Time-Tracking (Google Calendar style)
- [x] Backend: tabel company_events creat în DB
- [x] Backend: proceduri tRPC CRUD company_events (admin only)
- [x] Backend: sărbători legale România hardcodate (Paste ortodox 2024-2027 + zile fixe)
- [x] Backend: zile naștere colegi via trpc.people.upcomingBirthdays
- [x] Frontend: layout 3 coloane — sidebar stânga (mini-cal + insights + birthdays) + grid săptămânal
- [x] Frontend: grid săptămânal ore 06:00-23:00, număr săptămână în header
- [x] Frontend: zile naștere colegi în sidebar + header coloane calendar
- [x] Frontend: sărbători legale România în header coloane calendar
- [x] Frontend: blocuri evenimente admin (non-editabile, cu icon lackat + link clickabil)
- [x] Frontend: dialog creare eveniment admin (titlu, ore, link, culoare, alocare)
- [x] Frontend: time insights panel (ore azi/săptămână + bar chart per tip activitate)
- [x] Frontend: text alb pe blocuri colorate cu drop-shadow pentru lizibilitate

## Sprint 16 — Fix vizual blocuri activitate
- [x] TimeTracking: fundal blocuri activitate alternant galben #FFCB09 (text negru) / negru #221F1F (text galben) conform brand

## Sprint 17 — Fix eroare company_events
- [x] Fix: tabel company_events lipsă în DB — creat manual cu structură corectă (17 coloane)

## Sprint 19 — Fix bug-uri critice Time-Tracking
- [x] Fix: proiect opțional — submit funcționează fără proiect selectat
- [x] Fix: ora start pre-completată din slot-ul clickat, end = start+1h implicit, increment 15min
- [x] Fix: layout compact (SLOT_HEIGHT 28px), gutter w-10 aliniat între header și grid, rânduri mai dense

## Sprint 20 — Time-Tracking: Drag & Drop + Layout Fix + Dropdown ore
- [x] Drag & drop blocuri activitate: mutare pe altă zi/oră cu @dnd-kit/core
- [x] Layout fix 100vh fără scroll dublu — un singur scrollbar pe grila calendarului
- [x] Dropdown ore: fereastră ±3h față de ora selectată, minim 15min la end
- [x] Coloane perfect aliniate — GUTTER_W=44px constant în header și grid

## Sprint 21 — Fix timezone + Resize blocuri
- [x] Fix: task-urile se teleportează — backend folosea Date.UTC, acum folosește new Date local (ora României)
- [x] Fix: extractUTCTime → extractLocalTime (getHours/getMinutes în loc de getUTCHours/getUTCMinutes)
- [x] Fix: resize blocuri activitate prin handle la marginea de jos — drag mouse pentru a extinde/micșora durata

## Sprint 22 — Ștergere completă Time-Tracking
- [x] Ștergere pagina TimeTracking.tsx
- [x] Ștergere proceduri tRPC vechi (addCalendarEntry, updateCalendarEntry)
- [x] Ștergere rută /time-tracking din App.tsx
- [x] Ștergere link "Time-Tracking" din sidebar DashboardLayout.tsx
- [x] Ștergere import TimeTracking din App.tsx

## Sprint 23 — Reconstruire completă Time-Tracking de la zero
- [x] Curățare completă cod vechi Time-Tracking
- [x] Backend: proceduri noi addCalendarEntry/updateCalendarEntry cu ore ca integeri (fără Date/UTC)
- [x] Backend: proceduri companyEvents păstrate și funcționale
- [x] Frontend: layout Google Calendar fidel — sidebar stânga + grid săptămânal
- [x] Frontend: pagină fixă 100vh fără scroll dublu, coloane aliniate
- [x] Frontend: click pe slot → dialog rapid cu ora pre-completată, increment 15min, dropdown ±3h
- [x] Frontend: proiect opțional la adăugare activitate
- [x] Frontend: drag & drop mutare blocuri pe altă zi/oră
- [x] Frontend: resize blocuri prin tragere de marginea de jos
- [x] Frontend: blocuri colorate galben/negru conform brand IC
- [x] Frontend: text alb lizibil pe blocuri, buton Azi funcțional, nr săptămână vizibil
- [x] Frontend: sărbători legale RO + zile naștere colegi subtil în header
- [x] Frontend: evenimente admin (non-editabile, cu link clickabil, icon lacăt)
- [x] Reconectare rută /time-tracking în App.tsx + link sidebar
- [ ] Teste vitest (backlog)

## Sprint 24 — Fix bug-uri critice Time-Tracking
- [x] Fix: evenimente firmă editabile/ștergabile de admin (click pe eveniment → dialog editare + buton șterge)
- [x] Fix: mini-calendar — selectedDate separat de weekStart (galben = azi, negru = zi selectată)
- [x] Fix: drag threshold 5px + activated flag — click simplu deschide dialog, nu mută task-ul
- [x] Fix: double-click pe slot gol pentru adăugare (evită conflicte cu drag)
- [x] Fix: overflow-hidden pe container exterior, un singur scrollbar pe grid

## Sprint 25 — Fix grid calendar + Export rapoarte
- [x] Fix: ora 06:00 vizibilă — slotH dinamic (gridHeight / TOTAL_HOURS), fără scrollTop
- [x] Fix: grid calendar fără scrollbar — overflow-hidden pe container, celule se adaptează la ecran
- [x] Export rapoarte: buton Export în header TimeTracking + dialog cu filtre (perioadă, proiect, tip)
- [x] Export rapoarte: preview tabel cu datele filtrate + total ore
- [x] Export rapoarte: generare CSV cu BOM UTF-8 (compatibil Excel)

## Sprint 26 — Fix-uri critice Time-Tracking
- [x] Fix: bug timezone — task adăugat la 07:00 se salvează la 14:00 (offset UTC)
- [x] Fix: single click pe slot gol pentru adăugare (în loc de double-click)
- [x] Fix: grid 24h — interval complet 00:00-23:00 (nu doar 06:00-23:00)
- [x] Fix: prima oră (00:00) vizibilă fără a fi ascunsă
- [x] Export: înlocuire CSV cu Excel (.xlsx) server-side branded
- [x] Export: adăugare export PDF server-side branded
- [x] Export: adăugare filtru "Titlu activitate" în dialogul de export raport ore

## Sprint 27 — Fus orar global + Filtru Angajat export
- [x] Fix: ajustare fus orar Europe/Bucharest la nivel global (server + frontend)
- [x] Export: adăugare filtru "Angajat" vizibil doar pentru administratori (frontend + backend)

## Sprint 28 — Sistem 4 roluri + Vizualizare profil angajat
- [x] DB: extindere enum roluri cu coordonator și colaborator
- [x] DB: adăugare câmp coordinatorId pe tabelul proiecte
- [x] Backend: procedură vizualizare profil angajat (admin=tot, angajat=info bază)
- [x] Backend: procedură editare profil angajat (doar admin)
- [x] Backend: actualizare permisiuni per rol (coordonator poate crea proiecte, vedea ore echipă)
- [x] Frontend: pagină profil angajat cu vizualizare diferențiată per rol
- [x] Frontend: actualizare sidebar cu permisiuni per rol
- [x] Frontend: actualizare pagina Utilizatori cu dropdown 4 roluri
- [ ] Frontend: actualizare organigramă cu afișare rol (de implementat într-un sprint viitor)
- [x] Teste: actualizare teste vitest pentru noul sistem de roluri (39/39 trec)

## Sprint 29 — Ierarhie roluri + Echipă proiect
- [x] Backend: ierarhie permisiuni Admin moștenește toate permisiunile Coordonator
- [x] DB: creare tabel project_members (userId, projectId, role pe proiect)
- [x] Backend: proceduri tRPC echipă proiect (adăugare/eliminare membri, setare coordonator)
- [x] Frontend: dashboard proiect cu echipă vizibilă (coordonator + membri înrolați)
- [x] Frontend: posibilitate de a adăuga/elimina membri din echipa proiectului
- [x] Teste: actualizare teste vitest (39/39 trec)

## Sprint 30 — Bugetare ore pe categorii per proiect
- [x] DB: creare tabel project_budget_items (proiect, categorie activitate, ore bugetate, membru alocat)
- [x] Backend: proceduri tRPC CRUD pentru buget ore (adăugare, editare, ștergere)
- [x] Backend: procedură alocare ore bugetate pe membrii echipei
- [x] Frontend: secțiune bugetare ore pe pagina proiectului (vizibil doar admin/coordonator)
- [x] Frontend: dialog adăugare/editare categorie buget cu alocare pe membri
- [x] Frontend: vizualizare sumar buget (total ore bugetate vs. ore lucrate)
- [x] Teste: actualizare teste vitest (39/39 trec)

## Sprint 31 — Process Overview + Flux proiecte remodelat
- [x] DB: adăugare coloane startDate/endDate pe tabelul proiecte
- [x] Backend: actualizare proceduri proiecte cu date start/sfârșit
- [x] Remodelarea fluxului: eliminare duplicare ore (Ore estimate se calculează din bugetare)
- [x] Frontend: actualizare formular creare/editare proiect cu date start/sfârșit
- [x] Frontend: Ore estimate se auto-calculează din totalul bugetării pe categorii
- [x] DB + Backend: proceduri Process Overview (agregări zilnice: proiecte, concedii, zile libere)
- [x] Frontend: tab Process Overview cu tabel calendar echipă (angajați pe coloane, zile pe rânduri)
- [x] Frontend: afișare coduri proiecte, concedii (CO), zile libere legale, weekend-uri colorate
- [x] Sidebar: adăugare link Process Overview
- [x] Teste: actualizare teste vitest (39/39 trec)

## Sprint 32 — Editare/Ștergere proiecte + Ordine angajați Process Overview
- [x] Backend: procedură editare proiect (toate câmpurile: nume, cod, client, status, date)
- [x] Backend: procedură ștergere proiect (cu ștergere cascadă project_members, budget_items)
- [x] Frontend: buton editare proiect pe pagina detaliu (dialog cu toate câmpurile)
- [x] Frontend: buton ștergere proiect cu dialog confirmare sigur (tastare nume proiect)
- [x] DB: adăugare coloană displayOrder pe tabelul users
- [x] Backend: procedură actualizare displayOrder (admin-only)
- [x] Frontend: Process Overview sortare angajați după displayOrder
- [x] Frontend: buton admin "Reordonează" cu interfață up/down arrows
- [x] Teste: actualizare teste vitest (39/39 trec)

## Sprint 33 — Fix reordonare angajați
- [x] Fix: reordonare angajați în Process Overview nu persistă — query-ul getProcessOverview sorta doar după name, acum sortează după displayOrder
- [x] Simplificare legendă Process Overview: păstrate doar CO, Weekend, Liber stat (eliminat CM și LL)
- [x] Înlocuire logo peste tot cu noul PNG galben cu fundal transparent

## Sprint 34 — Redesign Tablou de bord
- [x] Adăugare card "Process Overview" în stilul celorlalte carduri
- [x] Înlocuire "Zile de naștere" cu "Calendarul IC" — calendar interactiv cu evenimente firmă + zile naștere, emoji tort, inițiale, click pentru detalii
- [x] Mutare știri recente sub pontaj zilnic (sidebar lângă pontaj)
- [x] Layout compact: pontaj, documente, proiecte, propuneri, process overview, calendar IC — toate vizibile fără scroll
- [x] Backend: folosire proceduri existente companyEvents.list + people.upcomingBirthdays combinate în frontend
- [x] Fix: emoji-uri 🎂/📎 nu apar pe celulele calendarului — corectat encoding unicode escaped → emoji direct

## Sprint 35 — Process Overview bazat pe proiecte înrolate
- [x] Schema: adăugare câmp "abbreviation" la tabelul projects
- [x] Migrare DB: ALTER TABLE projects ADD abbreviation
- [x] Backend: actualizare proceduri proiecte (create/update) pentru abbreviation
- [x] Frontend: adăugare câmp Abreviere în formularul de creare/editare proiect
- [x] Process Overview: înlocuire date time-tracking cu proiecte înrolate (project_members)
- [x] Process Overview: afișare format "cod abreviere" (ex: 255 MVT) pe zilele lucrătoare
- [x] Process Overview: respectare CO, weekend, liber stat — doar zile lucrătoare

## Sprint 36 — Editare și ștergere știri publicate
- [x] Backend: procedură update știre (news.update) — doar admin sau autorul pot edita
- [x] Backend: procedură ștergere știre (news.delete) — șterge și reacții/comentarii asociate
- [x] Frontend: butoane Editează/Șterge pe pagina de detaliu știre (vizibile doar pentru admin/autor)
- [x] Frontend: dialog editare știre (titlu, rezumat, conținut, categorie, tag-uri, fixat, important)
- [x] Frontend: dialog confirmare ștergere cu avertisment ireversibil

## Sprint 37 — Link meet zilnic pe Process Overview
- [x] Backend: tabel app_settings (key-value) pentru stocarea link-ului meet zilnic
- [x] Backend: proceduri settings.get / settings.set (admin only pentru set)
- [x] Frontend: buton "Meet zilnic" albastru pe header Process Overview cu link extern
- [x] Frontend: dialog editare link meet (admin only) cu suport Google Meet/Zoom/Teams

## Sprint 38 — Evenimente recurente zilnice + management evenimente
- [x] Backend: suport evenimente recurente zilnice (daily) cu oră fixă — expandă în calendar pe fiecare zi lucrătoare
- [x] Frontend: opțiune "zilnic" la creare/editare eveniment de firmă (checkbox recurent + frecvență + dată sfârșit)
- [x] Frontend: pagină Evenimente Firmă (/evenimente) cu listă completă — accesibilă din sidebar Administrare
- [x] Frontend: editare și ștergere evenimente din lista de management cu dialog-uri dedicate

## Sprint 39 — Sincronizare Google Calendar ↔ Time-Tracking
- [x] Actualizare GOOGLE_CLIENT_SECRET cu noul secret
- [x] Schema DB: tabel google_calendar_tokens (access_token, refresh_token per user)
- [x] Backend: OAuth flow Google Calendar (authorize + callback + token refresh automat)
- [x] Backend: proceduri googleCalendar.status, getAuthUrl, importTodayEvents, disconnect
- [x] Backend: route Express /api/oauth/google-calendar/callback
- [x] Frontend: buton "Conectează G Calendar" / "Import G Calendar" în toolbar Time-Tracking
- [x] Frontend: dialog import — listare evenimente din ziua selectată, click pentru pre-completare formular
- [x] Frontend: buton deconectare Google Calendar din dialog

## Sprint 40 — Fast Time Tracking + Fix Evenimente + GCal one-way sync

### Fix Evenimente Firmă
- [ ] Fix: evenimentele recurente zilnice apar doar în ziua creării — corectare logică expandare
- [ ] Fix: buton "Eveniment firmă" vizibil doar admin/coordonator
- [ ] Fix: butonul "Eveniment firmă" să fie shortcut redirect la /evenimente (nu dialog)
- [ ] Feature: audiență eveniment — toți / per proiect / per departament / per persoane selectate
- [ ] Schema DB: câmp audience_type + audience_ids pe companyEvents
- [ ] Backend: filtrare evenimente în calendar după audiență utilizatorului curent

### Fast Time Tracking (Bubble)
- [ ] Frontend: buton "Start Timer" în sidebar/header (vizibil pe toate paginile)
- [ ] Frontend: bubble dreptunghiular flotant mutabil (drag & drop) cu timer activ
- [ ] Frontend: bubble arată: proiect, activitate, timp scurs (HH:MM:SS)
- [ ] Frontend: click pe bubble → selectare proiect + activitate + pornire timer
- [ ] Frontend: shortcut tastatură editabil pentru start/stop timer (default: Alt+T)
- [ ] Backend: salvare automată time entry la stop timer

### Google Calendar — sincronizare unidirecțională
- [ ] Simplificare: GCal → Hub only (import evenimente din GCal, fără scriere înapoi)
- [ ] Auto-import: evenimentele din GCal apar ca sugestii în Time-Tracking zilnic

## Sprint 40 — Fast Time Tracking + Fix Evenimente + Audiență Eveniment

### Fix Evenimente Firmă
- [x] Fix: buton "Eveniment firmă" vizibil pentru admin + coordonator (era doar admin)
- [x] Fix: pagina /evenimente accesibilă coordonator (listAll, create, update, delete procedures)
- [x] Fix: recurringUntil era Date object, nu string — fix expandare recurentă în Dashboard.tsx
- [x] Feature: audiență eveniment — toți / departament / persoane selectate (targetType, targetDepartment, targetUserIds)
- [x] Backend: procedura people.list adăugată (admin + coordonator) pentru selector utilizatori

### Fast Time Tracking (Bubble)
- [x] Frontend: FloatingTimer component — bubble dreptunghiular flotant mutabil (drag & drop)
- [x] Frontend: bubble arată: activitate, proiect, timp scurs (HH:MM:SS)
- [x] Frontend: click pe bubble → selectare activitate + proiect + pornire timer
- [x] Frontend: shortcut tastatură configurabil (default: Alt+T), editabil din bubble
- [x] Frontend: buton trigger vizibil permanent (bottom-right), verde + pulsant când timer activ
- [x] Frontend: FloatingTimer adăugat în App.tsx ca overlay global

## Sprint 40b — Visual Edits (TimeTracking + FloatingTimer)

- [x] Fix: buton "Eveniment firmă" din TimeTracking navighează la /evenimente (admin + coordonator)
- [x] Feature: import Google Calendar — suport interval de date (De la / Până la) în loc de o singură zi
- [x] Feature: import Google Calendar — filtru după cuvânt cheie (titlu eveniment)
- [x] Feature: import Google Calendar — data importată se setează automat pe ziua evenimentului (nu pe ziua selectată)
- [x] Feature: TimerQuickButton inline în secțiunea TIME INSIGHTS din sidebar-ul TimeTracking
- [x] Backend: procedura importTodayEvents acceptă acum parametrul opțional dateTo pentru interval de date

## Sprint 40c — Bulk Import Google Calendar

- [x] Feature: checkbox per eveniment în dialogul de import Google Calendar
- [x] Feature: checkbox "Selectează tot" cu stare indeterminată (parțial selectat)
- [x] Feature: buton "Import (N)" apare când sunt selectate evenimente — importă toate deodată
- [x] Feature: import bulk salvează direct ca activități (tip: ședință) fără a deschide dialog individual
- [x] Feature: link "Editare" pe fiecare eveniment pentru import individual cu editare detalii
- [x] Feature: după import bulk, selecția se resetează și dialogul se închide automat

## Sprint 40d — Fix recurring company events + activityType/projectId

- [x] Fix: expandare evenimente recurente în TimeTracking.tsx (același mecanism ca Dashboard.tsx)
- [x] Feature: adăugare coloane activityType + projectId în tabelul company_events (migrare schema)
- [x] Feature: formular creare/editare eveniment firmă include tip activitate și proiect (opțional)
- [x] Fix: db.ts createCompanyEvent/updateCompanyEvent să accepte activityType și projectId
- [x] Fix: routers.ts companyEvents.create/update să accepte activityType și projectId

## Sprint 41 — Fix Profilul meu - date personale (feedback colegi)

- [x] Fix: data nașterii afișată în format american (MM/DD/YYYY) → format românesc (DD/MM/YYYY)
- [x] Fix: câmpurile de date personale sunt editabile fără a apăsa "Editează profil" (trebuie să fie read-only implicit)
- [x] Fix: eroare la salvare profil după apăsarea "Editează profil"
- [x] Fix: data nașterii dispare din câmp când intri în modul editare
- [x] Fix: CNP detectat ca parolă de browser (adaugă autocomplete="off" pe câmpul CNP)
- [x] Fix: câmpurile CNP/serie CI/număr CI nu au limită de caractere (CNP=13, serie=2 litere, număr CI=6 cifre sau 7 cifre formate noi)
- [x] Fix: validare dată naștere să fie în trecut (nu permite date viitoare)
- [x] Fix: câmpurile de adresă nu pot fi completate

## Sprint 41c — Fix browser password manager popup on profile save

- [x] Fix: câmpurile sensibile (CNP, IBAN) folosesc type="password" → browserul detectează formularul ca login și propune salvarea parolei cu CNP și orașul ca username
- [x] Fix: înlocuiește type="password" cu text mascat CSS (font de puncte sau caractere •) și autocomplete="new-password" / "off" pe câmpurile sensibile
- [x] Fix: adaugă autocomplete="off" pe întregul formular de profil

## Sprint 42 — iFlow Migration (remove pontaj/concediu, add iFlow button)

- [x] Delete: client/src/pages/PontajZilnic.tsx (sau echivalentul)
- [x] Delete: client/src/pages/CereriConcediu.tsx
- [x] Delete: client/src/pages/RapoarteHR.tsx
- [x] Delete: client/src/pages/AprobariConcediu.tsx
- [x] Fix: Remove routes for deleted pages from App.tsx
- [x] Fix: Remove sidebar items (Pontaj zilnic, Cereri concediu, Rapoarte HR, Aprobări concediu) from DashboardLayout.tsx
- [x] Fix: Remove backend procedures for leave requests, HR reports, daily pontaj from routers.ts
- [x] Fix: Remove DB helpers for leave requests from db.ts
- [x] Feature: Dashboard card "Timp lucrat azi" linked to Time-Tracking hours (today's total from time entries)
- [x] Feature: Dashboard card includes iFlow button → opens https://app.hriflow.ro in new tab
- [x] Fix: Remove any concediu/recuperare/medical/deplasare references from other pages

## Sprint 42b — Fix Dashboard "Timp lucrat azi"

- [x] Fix: Dashboard arată 18h/17 intrări în loc de 5h/5 intrări din Time-Tracking azi
- [x] Debug: myEntries query cu dateFrom/dateTo nu filtrează corect după ziua curentă

## Sprint 42c — Google Calendar import deduplication

- [x] Backend: checkTimeEntryExists helper în db.ts (userId + date + taskName)
- [x] Backend: addCalendarEntry procedure verifică duplicat înainte de insert, returnează { skipped: true }
- [x] Frontend: handleBulkImport numără ok/skipped, afișează toast detaliat (X importate, Y deja existau)
- [x] Tests: mock checkTimeEntryExists în portal.test.ts — 34/34 trec

## Sprint 43 — Time-Tracking major redesign + recurring + invitations

### 43a — Visual redesign
- [ ] All entries yellow (#FFCB09/80) with dark text, larger font (14px title, 12px time)
- [ ] Vertical scroll: page loads scrolled to 07:00, shows 07:00–23:00 visible range
- [ ] Drag ghost preview showing day column + time slot while dragging

### 43b — Recurring activities
- [ ] DB: recurringActivities table (userId, taskName, projectId, categoryId, startHour, startMin, durationMinutes, countInTime, startDate, endDate nullable)
- [ ] DB: recurringExceptions table (recurringId, exceptionDate, overrideStartHour, overrideStartMin, overrideDuration, deleted)
- [ ] Backend: CRUD procedures for recurring activities
- [ ] Backend: getRecurringForWeek — returns virtual entries merged with exceptions
- [ ] Frontend: Recurring management card under Time Insights sidebar
- [ ] Frontend: Recurring entries auto-appear in calendar grid (hourglass icon if not counted in time)
- [ ] Frontend: Drag/edit on recurring entry creates an exception for that day only

### 43c — Activity invitations
- [ ] DB: activityInvitations table (activityId, inviteeUserId, status: pending/accepted/declined, notifiedAt)
- [ ] Backend: inviteToActivity, respondToInvitation procedures
- [ ] Backend: on accept — clone entry to invitee's timeEntries
- [ ] Backend: bell notification + email to invitee on invite
- [ ] Backend: bell notification to host on accept/decline
- [ ] Frontend: invite UI in add/edit activity dialog (search users, add invitees)
- [ ] Frontend: pending invitations in bell dropdown with Accept/Decline buttons
- [ ] Frontend: host sees accepted/declined status on activity block

## Sprint 44 — Google Drive Documents Integration
- [x] Stocare GOOGLE_SERVICE_ACCOUNT_JSON ca secret în env
- [x] Instalare pachet googleapis
- [x] Creare server/googleDrive.ts cu funcții: listFilesInFolder, listSubfolders, testDriveConnection
- [x] Schema DB: tabel employee_drive_folders (userId, folderId, folderName) — migrare SQL aplicată
- [x] Proceduri tRPC: documents.listMyFiles, documents.listCompanyDocs, documents.listAngajatiSubfolders, documents.listMappings, documents.setMapping, documents.removeMapping, documents.testConnection
- [x] Pagina Documente.tsx: documente personale + documente companie (Google Drive Viewer)
- [x] PDF-urile se deschid în browser via Google Drive Viewer (fără descărcare)
- [x] Link "Documente Drive" în sidebar DashboardLayout (secțiunea ADMINISTRARE)
- [x] Pagina AdminDocumente.tsx pentru mapare angajat → folder Drive
- [x] Route /admin-documente adăugat în App.tsx
- [x] Teste Vitest pentru procedurile documents (45/45 passing)

## Sprint 45 — Drive UX improvements
- [x] AdminDocumente: angajații deja mapați nu mai apar în dropdown-ul de mapare nouă (prevenire suprascriere)
- [x] Backend: procedură tRPC documents.listSubfolderFiles(subfolderName) — listează fișierele dintr-un subfolder specific al HUB IC
- [x] Documente.tsx: secțiunea "Documentele mele" arată DOAR fișierele din folderul personal
- [x] Documente.tsx: secțiune "Regulament intern" listează fișierele din folderul HUB IC/Regulament intern
- [x] Documente.tsx: secțiune "Viziune & Valori" listează fișierele din folderul HUB IC/Viziune & Valori

## Sprint 46 — Restructurare sidebar navigație
- [x] DashboardLayout: secțiunea COMPANIE conține: Regulament intern, Viziune & Valori, Organigramă, Procese & Proceduri, Bibliotecă tehnică, Proiecte
- [x] DashboardLayout: secțiunea TIMP & PROIECTE conține: Time-Tracking, Process Overview, Formulare & Cereri
- [x] DashboardLayout: secțiunea LUCRU eliminată (conținutul mutat în COMPANIE și TIMP & PROIECTE)
- [x] Creare pagini standalone: RegulamentIntern.tsx și ViziuneValori.tsx (listează fișierele din Drive)
- [x] Documente.tsx: eliminat secțiunile Regulament intern și Viziune & Valori (rămâne doar "Documentele mele")
- [x] App.tsx: adăugate rute /regulament și /viziune cu paginile reale
