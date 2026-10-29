# Ex Libris – Saját könyvtáram

**Macen most kezded? Kövesd a [részletes, lépésről lépésre szóló Mac-útmutatót](MAC-UTMUTATO.md).** Telefonos videófelvétel → átmásolás a Macre → helyi könyvtár, szerverbérlés nélkül.

Magyar nyelvű, személyes könyvtáralkalmazás. Valódi helyi SQLite-adatbázis, szerkeszthető könyvek, videó- és fotófeldolgozás, ellenőrizhető OCR-javaslatok, négy katalógusnézet és menthető adatok. A kezdő könyvtár üres: nincs valódi adatoknak feltüntetett mintagyűjtemény.

## Elindítás, lépésről lépésre

Az alábbi útmutató Ubuntu/Debian Linuxra, illetve Windows alatt Ubuntu WSL-re készült. A felhőkörnyezetben a szükséges rendszerprogramok már telepítve vannak. A parancsokat terminálba kell bemásolni, nem a böngészőbe.

1. Telepíts **Node.js 24.5 vagy újabb** verziót a Node.js hivatalos telepítőjével. Ellenőrzés: `node --version`. A projekt a Node beépített SQLite-meghajtóját használja.
2. Linuxon telepítsd a helyi képfeldolgozás előfeltételeit:

   ```bash
   sudo apt-get update
   sudo apt-get install -y python3 python3-venv ffmpeg tesseract-ocr curl ca-certificates coreutils fonts-dejavu-core
   ```

3. Nyisd meg a projekt mappáját. Ebben a felhőkörnyezetben:

   ```bash
   cd /workspace/nyklibrary
   ```

   Saját gépen a letöltött/klónozott `nyklibrary` mappába lépj. Git használatakor: `git clone https://github.com/nyarykrisztian/nyklibrary.git`, miután a kód a tárolóba került. Ez a munkapéldány önmagában még nem jelent GitHubra feltöltést.

4. Egyszer futtasd:

   ```bash
   npm run setup
   ```

   Ez a `package-lock.json` alapján telepíti a webes függőségeket, létrehozza a `.venv` Python-környezetet, telepíti a rögzített Pillow-verziót, letölti a hivatalos Tesseract 4.1.0 magyar/angol modelljeit SHA-256 ellenőrzéssel, és elkészíti az alkalmazást. A parancs újra futtatható; a könyvadatokat nem törli. Internetelérés kell az npm, PyPI és raw.githubusercontent.com irányába. Tartsd meg az érvényes TLS-ellenőrzést és a környezet proxybeállításait.

5. Indítsd el:

   ```bash
   npm start
   ```

6. A böngésző címsorába írd: `http://127.0.0.1:3000`. A terminált hagyd nyitva. Leállítás: **Ctrl+C**. Újraindításkor elég az 5. lépés; a könyvek és képek megmaradnak.

Fejlesztéshez `npm run dev`; kódmódosítás utáni normál használathoz előbb `npm run build`, majd `npm start`. A Webpack buildet használjuk, mert a Next.js Turbopackja a projektbeli Python-venv külső rendszerre mutató symlinkjeit ebben a környezetben nem tudta kezelni. A program minden parancsot a projekt gyökérkönyvtárából vár. A Mac-telepítő rögzített Python 3.12-t választ; hiányos vagy eltérő verziójú `.venv` esetén a régit `.venv-incomplete-*` néven megőrzi, majd újat készít. A könyvadatokat nem módosítja. Ha a Mac nem ad vissza macOS-verzióadatot, a pip a támogatott certifi CA-listás tanúsítványellenőrzést használja. Részletek és a javítófájl használata a Mac-útmutató végén.

macOS esetén Homebrew-val `brew install node@24 python@3.12 ffmpeg tesseract expat` használható, de a teljes telepítést itt Linuxon ellenőriztük. Natív Windows helyett WSL ajánlott; a telepítő Bash-t és Linux-szerű venv-elérési utat használ.

## Használat

- **Könyv hozzáadása:** csak a cím kötelező. A könyv és kiadás adatai, a saját példány helye/jegyzetei és a dedikáció külön füleken szerkeszthetők. Ismeretlen adatot hagyj üresen. Minden hiányzó adat üresen tárolódik, a felület jelölései nem kerülnek a bibliográfiai mezőkbe.
- **Kiadások és példányok:** külön azonosítója van a műnek, a kiadásnak és a példánynak. Azonos szerző/cím azonos műhöz, egyező ISBN/kiadó/év/hely/nyelv/kötetszám azonos kiadáshoz csoportosít. Ez a megadott adatok szerinti csoportosítás, nem a kiadás automatikus bizonyítása. Hiányos adatú példányoknál a pontos kiadás csak kitöltés után különíthető el. A duplikációfigyelmeztetés nem tiltja több fizikai példány felvitelét.
- **Nézetek:** borítógaléria, hagyományos katalóguscédulák, virtuális könyvespolc és táblázat. A borító nélküli könyvek generált tipográfiai címkét kapnak, nem állítólagos eredeti borítót. Kattints a könyvre a részletes adatlaphoz.
- **Keresés:** szerző, cím, kiadó, év, ISBN, műfaj, téma, címzett, jegyzet és minden további szöveges mező; ékezetfüggetlen. A keresés és olvasottsági szűrő minden nézetben érvényes. Cím, szerző, év és felvételi idő szerint rendezhetsz.
- **Saját gyűjtemények:** kedvencek, dedikált példányok, kölcsönadott könyvek. Saját címkékre és témákra a keresőben szűrhetsz. Kölcsönadás lezárásához töröld a kölcsönvevő nevét. A véletlen ajánló kizárólag a saját könyveidből választ.
- **Polcfelismerés:** válassz videót vagy fényképet, illetve indíts helyi kamerafelvételt. A videó lassú, jól megvilágított, közeli legyen. MP4/MOV/WebM/MKV, JPG/PNG/WebP fogadható; maximum 150 MB. A kamera hang nélkül legfeljebb 3 percet rögzít. A videó első 3 percét dolgozzuk fel.
- **Ellenőrzés:** nyisd meg a forrásképet, írd be a helyes szerzőt/címet, szükség esetén keress bibliográfiai adatot, majd hagyd jóvá vagy vesd el a találatot. A jóváhagyás után a találat kipipált állapotban megmarad, másodszor nem adható hozzá. Ha a kiadás nem azonosítható, a címlap és az impresszum fotója is feltölthető a felismerőbe; az OCR még ilyenkor is kézi ellenőrzést igényel.
- **Open Library:** a könyvszerkesztőben szabad szöveggel vagy ISBN-nel kereshetsz. ISBN esetén a kapott kiadás adatait vesszük át. Szabad szöveges találatnál csak műszintű szerző/cím/forrás kerül át: más kiadás kiadóját, évét, ISBN-jét nem rendeljük hozzá. A találat nem mentődik automatikusan. Nincs találat esetén kézi felvitel lehetséges.

## Pontosan mit jelent az első OCR-verzió?

Valódi, helyi **Tesseract OCR**, nem külső látásmodell és nem szimulált eredmény. FFmpeg másodpercenként 4 képet mintáz, a videó legfeljebb 24 időszakaszából az élesebb képkockát tartjuk meg. A kép 0/90/270 fokos változatán ritka szöveges elrendezést keresünk. Az egyező normalizált szövegek és egyes tartalmazási ismétlések összevonódnak a felvételen belül.

**Fontos korlátok:** nincs még gerincenkénti detektálás, perspektívakorrekció, térbeli könyvkövetés, tanult szerző–cím párosítás vagy olvashatatlan gerincek automatikus jelölése. Egy szövegsor lehet egy szerző, címrészlet vagy zaj; nem állítjuk, hogy egy találat biztosan egy teljes könyv. A forráskép a teljes kiválasztott képkocka, nem állítólagos gerinckivágás. A könyvgerincek takarása, dőlése és a mozgáselmosódás ronthatja az eredményt. A normalizált szöveges deduplikáció nem garantál fizikai könyvenként egy találatot. Több kép azonos könyvhöz tartozását a felhasználó ellenőrzi; a felesleges javaslatokat elvetheti.

A százalék a **Tesseract által olvasott karakterek/szavak átlagos OCR-bizonyossága**, nem a könyv vagy kiadás helyességének valószínűsége. A három jelzés ezt tükrözi. Egyetlen OCR-javaslat sem kerül automatikusan a könyvtárba, és a program nem egészíti ki hiányzó címét ismert könyvcímmel. A folyamat egyszerre egy felvételt kezel, legfeljebb 8 percig; megszakadt feldolgozás tíz perc után hibásként jelenik meg, és újra feltölthető. Az alkalmazásnak a feldolgozás alatt futnia kell.

## Mobil

600 pixel alatt rögzített felső/alsó navigáció, kiemelt felvételgomb, safe-area kezelés és alsó lapként megnyíló szerkesztők. A külső oldal nem görget, a tartalomterület igen. Webmanifest és saját ikon van, offline mód vagy háttérben futó feltöltés nincs.

A beépített kamera `getUserMedia` + `MediaRecorder`, MP4/WebM támogatásvizsgálattal. HTTPS vagy localhost kell hozzá és engedély a kamerához. Nem támogatott/tiltott kamera esetén felajánlja a telefon kameraalkalmazásának megnyitását. Valódi iPhone/Android eszközön még nem ellenőriztük; a Chromium-szimuláció nem bizonyít Safari-kompatibilitást. A készülék IP-címén elérhető sima HTTP nem biztonságos kamerakörnyezet. A helyi szerver alapból a telefon számára nem érhető el: távoli/mobilos éles eléréshez külön HTTPS és hozzáférésvédelem szükséges.

## Export, import, mentés

**Adatok és beállítások** alatt:

- Excel `.xlsx` és UTF-8 CSV: a teljes aktuális katalógus, nem csak a képernyőn szűrt találatok. A mezőnevek szándékosan stabil, angol technikai nevek, hogy visszaimportálhatók legyenek.
- Import maximum 20 MB / 10 000 sor. Saját exportfájl használata ajánlott. Azonos `id` frissül, korábban nem látott `id` új példányként, ugyanazzal az azonosítóval jön létre. Az ID nélküli sor mindig új példány. Ismeretlen adat nem egészül ki. Az import tranzakcióban fut: hibás sornál nincs félig kész könyvlista.
- Teljes ZIP-mentés: könyvadatok, példányazonosítók, felvételi idők és az összes feltöltött fotó/videó/képkocka. A felismerések előzménye és függőben lévő jóváhagyása nem része a mentésnek. A ZIP érzékeny személyes adatokat tartalmazhat; őrizd saját, biztonságos helyen.
- Visszaállítás lecseréli a könyvlistát, megőrzi a mentés példányazonosítóit, és törli az aktuális OCR-előzményeket. Előtte ments! Legfeljebb 200 MB tömörített / 500 MB kitömörített saját ZIP. A meglévő feltöltési fájlokat nem törli, így a régi, már nem hivatkozott képek helyben maradhatnak.

Az alkalmazás adatai: `data/library.sqlite`, valamint `data/uploads/`. Ezek nem részei a Gitnek. A teljes mappáról leállított program mellett kézi másolat is készíthető. Futó SQLite-fájl önálló másolása helyett a beépített ZIP-mentést használd. Nem szerkeszthető közvetlenül a WAL-fájl. Törölt könyv képfájlját nem töröljük automatikusan, nehogy egy másik példány hivatkozása sérüljön. Időnként ellenőrizd a szabad tárhelyet.

## Adatvédelem és költségek

A `dev` és `start` alapértelmezésben **127.0.0.1-re** köt. Nincs regisztráció, nyilvános gyűjteménylink, jelszó vagy felhasználói jogosultságkezelés: ez személyes, helyi alkalmazás. Ne tedd közvetlenül internetre, és ne állítsd át `0.0.0.0`-ra hozzáférésvédelem nélkül. Nem küld e-mailt, és nem telepítettük Coolify/Hetzner környezetbe.

- **FFmpeg, Tesseract, SQLite:** nincs használati díj vagy API-kulcs. A feldolgozás CPU-t, memóriát, tárhelyet használ. Külső AI nincs bekötve, így AI-díj sincs. Egy későbbi látásmodell API-ja külön, használatalapú költség lenne.
- **Open Library:** API-kulcs nélkül kérjük le a nyilvános bibliográfiai adatokat. Ehhez internet és `openlibrary.org` hálózati engedély kell, a borítókhoz `covers.openlibrary.org`. A szolgáltatás rendelkezésre állása és adatainak teljessége nem garantált. A lekérdezésed elhagyja a gépet; videó nem kerül hozzájuk. Külső borítót a böngésző a forrásáról tölti le. Offline megőrzéshez tölts fel saját képfájlt.
- **Betűk:** helyben tárolt, SIL OFL-licencű Libre Caslon Display és DM Sans; licencek a `public/fonts` mappában. Nincs külső betűletöltés a felület használatakor.
- A saját jegyzet, dedikáció, bibliográfiai forrás és ismertető külön mező. A program **nem keres könyvek teljes szövegében**. Külső AI-chat nincs ebben a kiadásban.
- A Next.js saját buildtelemetriája kikapcsolható: `NEXT_TELEMETRY_DISABLED=1`; a setup ezt már beállítja. Sem a felületbe, sem a forrásba nem került API-kulcs vagy látogatáskövető.

## Mi működik, mi későbbi fejlesztés?

Működik a kézi CRUD, a helyi tartós adatbázis, négy nézet, a keresés/rendezés, a videó/fotó és helyi OCR, a kézi jóváhagyás/elvetés, az Open Library integráció, a fényképes dedikációgaléria, a helyadatok, a kölcsönadás, a címkék, a véletlen ajánló, a szerző/téma/évtized/olvasottság statisztikái, valamint az export/import és ZIP-mentés.

Későbbi: gerincdetektálás és megbízható könyvenkénti követés; nagy fájlok folytatható/darabolt feltöltése; Google Books; vonalkód kameraolvasó (ISBN kézzel megadható); sorozathiányok automatikus jelzése; teljes szövegre támaszkodó AI-asszisztens; külön szerkeszthető tematikus gyűjtemények; angol felület; többfelhasználós PostgreSQL, nyilvános/megosztott linkek és e-mailes export. A bemásolt korábbi projekt 158 könyves pontosságát/tesztszámait nem vettük át: ez önálló implementáció, külön mérési eredményekkel.

## Ellenőrzések

```bash
npm test
npm run typecheck
npm run build
```

A `npm test` **10 konkrét tesztet** (7 adatkezelési és 3 Python-futtatókörnyezeti) futtat ideiglenes SQLite-adatbázissal. Egy nulla tesztes vagy csak fájlszintű eredmény nem helyettesíti ezt. Egyes korlátozott futtatókban alfolyamatok indításához a környezet által biztosított engedélyezett parancsfuttatás kellhet.

A végpontok és böngészős felület integrációs tesztjéhez **ne a saját könyvadatbázisodat használd**. Üres, elkülönített tesztpéldány kell. Az alábbi első parancs futva marad:

```bash
EX_LIBRIS_DATA_DIR=$(mktemp -d) npm start -- --port 3001
```

Másik terminálban a projekt mappájában:

```bash
npm run test:acceptance
```

A teszt Chromiumot vár `/usr/bin/chromium` alatt, Python Pillow-t, FFmpeget és DejaVu fontot használ egy **mesterségesen feliratozott tesztvideóhoz**. Ellenőrzi a CRUD-ot, XLSX/CSV adatokat, importot, mentést és fotó-visszaállítást, valódi OCR-eredményt, jóváhagyást, többszörös jóváhagyás tiltását, az origin-védelmet, mind a négy nézetet, keresést és a mobilkeretet. Képernyőképei `/tmp/exlibris-desktop.png` és `/tmp/exlibris-mobile.png`.

A böngészős teszt nem mér valódi, dőlt könyvgerinceken felismerési pontosságot, és nem teszteli az Open Library élő elérését. Ebben a felhőkörnyezetben az Open Library kérése 403-as hálózati tiltást kapott; az engedélykérés a környezet konfigurációtervezetébe mentve van. Éles bibliográfiai lekérés csak a hálózati beállítás alkalmazása és újratesztelés után tekinthető ellenőrzöttnek.

## Fejlesztői felépítés

- `app/page.tsx`, `app/globals.css`: magyar, reszponzív felület.
- `app/CameraRecorder.tsx`: kamera és videófelvétel.
- `app/api/[...path]/route.ts`: saját, helyi API; az adatváltoztató kérések origin-ellenőrzést kapnak.
- `lib/db.ts`: SQLite, tranzakciók és mű/kiadás/példány kapcsolatok. A Node 24 beépített SQLite-jával nincs külön natív npm adatbáziscsomag-fordítás.
- `scripts/recognize.py`: FFmpeg + Pillow élességvizsgálat + Tesseract OCR.
- `lib/exchange.ts`: ExcelJS, CSV; az ExcelJS valódi XLSX-et ír, nem átnevezett CSV-t.
- `scripts/archive.py`: ellenőrzött útvonalú, méretkorlátos ZIP-mentés/visszaállítás.
- `EX_LIBRIS_DATA_DIR`: adattárolási hely, alapból `./data`.
- `PYTHON_BIN`: opcionális Python-futtató; felismeréshez alapból `.venv/bin/python`, annak hiányában `python3`. A ZIP-művelethez elegendő a rendszer Python standard könyvtára.

SQLite indokolt a személyes, egygépes használathoz: nem igényel külön adatbázis-szervert vagy jelszót. A videófeldolgozás Pythonban áttekinthető, helyben fut, FFmpeg és Tesseract szabványos eszközöket használ. A Next.js/TypeScript közös adattípusokat és egyetlen webes indítási pontot ad. Szándékosan nincs fizetős AI-függőség vagy kitalált könyvészeti adat.

### A jelenlegi változat ellenőrzési eredménye

- A teljes `npm run setup` Linuxon sikerült, a rögzített függőségekkel, ellenőrzött magyar/angol modellekkel és sikeres production builddel.
- 10/10 adatkezelési/Python-futtatókörnyezeti teszt és 29/29 API-/asztali/mobil böngészős ellenőrzés sikeres, valódi FFmpeg- és magyar–angol Tesseract-feldolgozással.
- Külön Chromium tesztkamerával a MediaRecorder tényleges felvételt, leállítást és Blob-videóelőnézetet készített (`TEST_BASE_URL=http://127.0.0.1:3001 node tests/camera.mjs`). Ez továbbra sem valódi iPhone/Android teszt.
- Szerver-újraindítás után a három tesztkönyv és a dedikációs kép visszaolvasható volt. A tesztek külön `/tmp` adatkönyvtárban futottak; a személyes `data/` könyvtár üres maradt.
- TypeScript-ellenőrzés sikeres. Élő Open Library adatlekérés: a felhőhálózat jelenlegi tiltása miatt nem ellenőrzött. A kereső hibát mutat, nem hamis találatot.


Macen a Homebrew Expat-könyvtára szükséges az olyan Python-telepítésekhez, amelyek a rendszer régebbi `libexpat` verziójával nem tudják betölteni a `pyexpat` modult. A telepítő és indító megkeresi az Expat Homebrew-helyét. A telepítési Python-parancsok, az OCR és a ZIP-mentés/visszaállítás ugyanazt a könyvtárat kapják meg, csak a saját Python-folyamataikhoz. Nem módosítjuk a macOS rendszerkönyvtárait és nem állítunk be globális betöltőváltozókat. Az érintett felhasználó Macjén az Expat 2.9.0 betöltésével a `pyexpat` és a macOS 26.0 verziólekérdezés működését visszaigazolta.
