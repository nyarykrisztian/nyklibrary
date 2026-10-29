# Ex Libris – első indítás Macen, programozói tudás nélkül

A telefon csak videókameraként működik. A videót átmásolod a Macre, az alkalmazást a Mac böngészőjében használod. A könyvlista, feltöltött képek és videók a Macen maradnak. Nem kell webcímet, szervert vagy fizetős AI-t vásárolnod.

A teljes Mac-telepítést ebben a Linuxos fejlesztői környezetben nem tudtuk lefuttatni. A Mac-indítók szintaxisát és a macOS-en használható SHA-256 ellenőrzési módot ellenőriztük; maga a webalkalmazás Linuxon teljes integrációs tesztet kapott. Ha valamelyik Mac-lépés megáll, a hibaüzenetből tudunk továbbmenni.

## 1. Tedd helyére a letöltött alkalmazást

1. Nyisd meg a https://github.com/nyarykrisztian/nyklibrary oldalt. Ha privát a tároló, jelentkezz be a saját GitHub-fiókodba. Kattints a zöld **Code** gombra, majd a **Download ZIP** lehetőségre.
2. Finderben a Letöltések mappában kattints duplán a letöltött ZIP-re. A kicsomagolt mappa neve általában `nyklibrary-main`. Jelöld ki, nyomj Entert, nevezd át pontosan **`ex-libris`** névre, majd ismét Enter. Ha a böngésző már kicsomagolta, ezt a mappát keresd.
3. Jelöld ki az átnevezett `ex-libris` mappát, és nyomj Command+C-t.
4. Nyomd meg a Shift+Command+H billentyűket: megnyílik a saját felhasználói mappád.
5. Nyomj Command+V-t. Most a saját felhasználói mappádban legyen az `ex-libris` mappa, ne a Letöltésekben. Ezt a mappát a telepítés után ne mozgasd és ne töröld: később ebbe kerül a könyvadatbázis is. Ne helyezd aktívan szinkronizált iCloud/Dropbox mappába.

## 2. Nyisd meg a Terminált

Nyomj Command+Szóközt, írd be: `Terminál` (vagy `Terminal`), majd Enter. Megjelenik egy szöveges ablak. Ebbe másold a következő parancsokat, egyesével, minden sor után Enterrel. A parancsok begépelése nem programozás: az előkészített telepítőt indítják el.

## 3. Telepítsd a Homebrew-t – egyszer kell

A Homebrew egy ismert, ingyenes Mac-programtelepítő, ezzel kerülnek fel a videófeldolgozó eszközök.

Először írd a Terminálba:

```bash
brew --version
```

Ha verziószám jelenik meg, a Homebrew már telepítve van: folytasd a 4. lépéssel. Ha `command not found` jön, nyisd meg a Homebrew hivatalos oldalát: https://brew.sh

Az ott szereplő telepítőparancsot is használhatod; ez az ismert hivatalos parancs:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Ha `Password` jelenik meg, a Mac-felhasználód bejelentkezési jelszavát kéri. Gépelés közben sem betű, sem csillag nem látszik: ez normális. Utána Enter. Jelszót ne küldj a beszélgetésbe.
- A `Press RETURN/ENTER to continue` azt jelenti: nyomj Entert.
- Ha az Apple parancssori fejlesztőeszközök telepítését kéri, hagyd települni.
- Várd meg, amíg befejeződik és ismét parancsot fogad. Ne zárd be közben az ablakot. A végén kiírt „Next steps” beállításokat a mi Mac-indítónkhoz nem kell kézzel begépelned: az indító az Apple Silicon és az Intel szokásos Homebrew-helyét is megkeresi.

## 4. Telepítsd az Ex Librist – egyszer kell

A Terminálba másold:

```bash
cd "$HOME/ex-libris"
```

Majd:

```bash
bash Telepites.command
```

Ez automatikusan telepíti a Node.js-t, a rögzített Python 3.12-t, FFmpeget, Tesseractot, a Homebrew Expat XML-könyvtárát, a magyar és angol felismerőmodelleket, valamint az alkalmazás függőségeit. Végül elkészíti a futtatható alkalmazást. Az első alkalom 10–30 percet, lassabb vagy régebbi Macen többet is igénybe vehet. Internet kell hozzá. Az eszközök és modellek használatához nincs előfizetési díj.

A sok futó szöveg normális. A `deprecated` kezdetű npm-figyelmeztetés önmagában nem jelenti a telepítés hibáját. A befejezéskor ezt kell látnod: **„A telepítés elkészült. Indítás: bash Inditas.command”**.

Ha `No such file or directory` jelenik meg a `cd` után, a mappa nincs a várt helyen. Ellenőrizd az 1. lépést, vagy írd be a `cd` szót egy szóközzel, húzd rá Finderből az `ex-libris` mappát a Terminál ablakára, majd Enter. Ez a pontos mappába lép.

## 5. Indítsd el

Ugyanebben a Terminál-ablakban:

```bash
bash Inditas.command
```

Az indító megvárja a szervert, és automatikusan megnyitja a böngészőt. Ha nem nyílik meg, a Mac böngészőjének címsorába írd: `http://127.0.0.1:3000`.

Ez a cím a saját Macedet jelenti. Nem nyilvános weboldal, és a telefonodon nem ezt kell megnyitnod. Használat közben a Terminál maradjon nyitva; háttérbe teheted.

## 6. Először próbálj ki egy kézzel felvitt könyvet

1. Kattints a **Könyv hozzáadása** gombra.
2. Írd be egy saját könyved címét és szerzőjét. A többi adat egyelőre maradhat üresen.
3. A **Saját példány** fülön megadhatod a szobát, polcot és olvasottságot.
4. Kattints a **Könyv mentése** gombra.
5. Nyisd meg az adatlapot a könyvre kattintva. Próbáld ki a **Szerkesztés** gombot.
6. A könyvlista fölötti négy ikonnal válthatsz a borítógaléria, katalóguscédula, könyvespolc és táblázat között.

## 7. Készíts egy rövid videót a telefonnal

1. A telefon saját Kamera alkalmazását nyisd meg, és válaszd a videófelvételt.
2. Elsőre 5–10 könyvet vegyél fel 10–20 másodpercben. Ha állítható, 1080p/30 fps elég; 4K nem szükséges.
3. Jó fényben, lassan haladj a könyvgerincek előtt. Ne legyen fényvisszaverődés, és lehetőleg a teljes gerinc férjen a képbe. Ne takarja másik könyv a címet.
4. Az első próbafájl maradjon 150 MB alatt. Az alkalmazás legfeljebb a videó első 3 percét dolgozza fel.

## 8. Másold át a videót a Macre

**iPhone:** Fotók → videó kiválasztása → Megosztás → AirDrop → saját Mac. A két eszközön legyen Wi-Fi és Bluetooth bekapcsolva. Ha jóváhagyást kér, fogadd el a Macen. A videót rendszerint a Letöltésekben találod; ha a Fotók alkalmazás nyitotta meg, onnan exportáld fájlként.

**Android:** a Macre másoláshoz használhatsz például LocalSendet mindkét készüléken (https://localsend.org), ugyanazon a Wi-Fi-hálózaton. Ezzel a kiválasztott videót átküldöd, és a Macen elmented. Ez csak fájlátvitel, a telefonon a könyvtáralkalmazás nem fut. A telefon és Mac közti másolásnak más, már megszokott módja is megfelel.

## 9. Töltsd fel és ellenőrizd a találatokat

1. A Macen, az Ex Libris oldalsó menüjében kattints a **Polcfelismerés** lehetőségre.
2. Kattints a **Fájl kiválasztása** gombra, és válaszd ki az átmásolt videót. A fájlt rá is húzhatod a feltöltőmezőre.
3. Várj. Feldolgozás alatt ne állítsd le az alkalmazást. A felismerés néhány percet is igénybe vehet.
4. A találatok alatt megnyithatod a forrásképeket. Az **Ellenőrzés** gombbal írd be vagy javítsd a helyes címet/szerzőt.
5. Ha hiányos vagy zavaros a felirat, ne fogadd el találomra. A könyvet nézd meg a polcon, vagy készíts közeli fotót a címlapról/impresszumról, és azt töltsd fel ugyanitt.
6. Kattints a **Jóváhagyás és felvétel** gombra. A felesleges és ismételt javaslatokat az X-szel vesd el.
7. A jóváhagyott könyv megjelenik a könyvtárban. A kiolvasott szöveg nem kerül be automatikusan.

Az első OCR-verzió nem tökéletes könyvazonosító: címrészletet és szerzőnevet is külön találatként adhat. Ezért kell az ellenőrzés. A magyar és angol nyomtatott szöveg helyben kerül feldolgozásra, fizetős külső AI nélkül. A bibliográfiai kereséshez internet szükséges, de az ismeretlen mezők üresen hagyhatók.

## 10. Ments rendszeresen

**Adatok és beállítások** → **Teljes biztonsági mentés**: letölthető ZIP készül a könyvekkel és a feltöltött képekkel/videókkal. Tedd például külső meghajtóra vagy saját mentési helyre. Ezt a kész ZIP-et már nyugodtan tárolhatod iCloudban is.

**Excel (.xlsx):** megnyitható Excelben vagy az Apple Numbersben; a könyvlista adatait tartalmazza, a képfájlokat nem. A fényképek megőrzéséhez a teljes ZIP-mentés kell.

A `data` mappát ne töröld; ez a valódi könyvtárad. Az eredeti letöltött forrás-ZIP nem helyettesíti a későbbi adatmentést.

## Leállítás és későbbi indítás

Leállítás: kattints az alkalmazást futtató Terminál-ablakra, és nyomj **Control+C**-t. Ez nem Command+C. A könyvek és képek megmaradnak.

Következő alkalommal nyiss Terminált, majd:

```bash
cd "$HOME/ex-libris"
bash Inditas.command
```

A Homebrew és a teljes telepítés nem kell minden alkalommal. A telefonos felvételt csak akkor készítsd újra, ha új könyveket szeretnél feldolgozni.

## Ha elakadsz

Írd meg, melyik számozott lépésnél tartasz, és másold be a hiba utolsó 10–20 sorát, vagy küldj képernyőképet. Jelszót és személyes könyvlistát ne másolj be. Ha a Mac engedélyt vagy hibát mutat, a pontos szöveg alapján tudunk segíteni; nem kell vaktában módosítanod a biztonsági beállításokat.


## Javítás, ha a telepítés az ensurepip lépésnél megállt

Ha az üzenetben `.venv/bin/python3.15`, `ensurepip` és `non-zero exit status 1` szerepel, a Python-környezet létrehozása szakadt meg. A sárga npm-figyelmeztetések önmagukban nem ezt okozzák. A pontos ensurepip-ok a rövid hibaüzenetből nem állapítható meg; a javított telepítő rögzített Python 3.12-t használ, és a hiányos környezetet újra létrehozza.

A régebbi ZIP-ből telepített mappában a két javított fájlt így frissítheted, a Terminálban, egyenként:

```bash
cd "$HOME/ex-libris"
curl --fail --location https://raw.githubusercontent.com/nyarykrisztian/nyklibrary/main/Telepites.command -o Telepites.command.download && mv Telepites.command.download Telepites.command
curl --fail --location https://raw.githubusercontent.com/nyarykrisztian/nyklibrary/main/scripts/setup.sh -o scripts/setup.sh.download && mv scripts/setup.sh.download scripts/setup.sh
bash Telepites.command
```

Csak a telepítés sikeres befejezése után indítsd: `bash Inditas.command`. A frissítés a könyvadatbázishoz nem nyúl. A sikertelen régi `.venv` mappát a telepítő `.venv-incomplete-*` néven megőrzi; nem kell kézzel törölnöd.

Ha a `curl` 404-es vagy hozzáférési hibát ad, ne folytasd a következő paranccsal: jelezd a hiba szövegét. Privát GitHub-tárolónál a böngészős GitHub-bejelentkezés önmagában nem hitelesíti a Terminál letöltését; ilyenkor böngészőből töltsd le a friss forrás-ZIP-et, és csak a benne lévő `Telepites.command` és `scripts/setup.sh` fájlokat másold a meglévők helyére. A teljes alkalmazásmappát és különösen a `data` mappát ne cseréld le.


## Javítás: truststore / macOS-verzió / ValueError

Ha a részletes hiba a `pip/_vendor/truststore/_macos.py` fájlban `ValueError: invalid literal for int() with base 10: ''`, a pip tanúsítványkezelője üres macOS-verzióadatot kapott. A Python-verzióváltás önmagában ezt nem oldja meg.

A javított setup először pip nélkül hozza létre a virtuális környezetet, majd a Pythonhoz mellékelt eredeti pip-wheelből, hálózati letöltés nélkül telepíti a pipet. Csak macOS alatt, hiányzó verzióadat esetén a pip támogatott `--use-deprecated=legacy-certs` kapcsolóját választja. Ezzel a pip saját certifi CA-listája ellenőrzi a TLS-t; nincs `--trusted-host`, nincs kikapcsolt tanúsítványellenőrzés. Érvényes macOS-verzióadat esetén az alapértelmezett tanúsítványkezelés marad.

A `scripts/repair-macos.command` frissíti a három szükséges telepítőfájlt, majd újrafuttatja a Mac-telepítőt. Megadható neki az ellenőrzött teljes Git-commitazonosító, hogy a GitHub gyorsítótára helyett biztosan a kívánt változatot töltse le. A beszélgetésben megadott legújabb javítóparancsot használd; az előző részben szereplő kétfájlos frissítés önmagában ehhez a hibához már nem elegendő.

Fejlesztői ellenőrzés: `.venv/bin/python tests/python-packages-test.py` (3 célzott regressziós teszt), `node tests/setup-install.mjs` (hiányos környezet megőrzése és újraépítése). A pip offline telepítését üres, valódi venv-ben is ellenőriztük Linuxon; a teljes macOS folyamatot a felhasználó gépén kell visszaellenőrizni.


## A tényleges macOS-ok: nem betölthető pyexpat

A felhasználó Macjén a részletes ellenőrzés kimutatta: a Python `pyexpat` modulja a rendszer `/usr/lib/libexpat.1.dylib` fájljából egy hiányzó `_XML_SetAllocTrackerActivationThreshold` funkciót próbált betölteni. Emiatt a `plistlib` sem működött, a macOS-verzió üres lett, és a pip több helyen elakadt. A tanúsítványkezelés korábbi módosítása önmagában nem javította az XML-betöltést.

A Homebrew `expat` telepítése és annak célzott megadása a Python számára a felhasználó gépén ezt adta: `XML: expat_2.9.0`, `macOS: 26.0`. Ez visszaigazolta a tényleges megoldást. Az új telepítő és indító már ezt alkalmazza. A rendszer saját fájljait nem cseréljük le, Homebrew force-link nem szükséges.

A `scripts/python-env.sh` minden telepítési Python-indításhoz külön adja át a megfelelő könyvtárat. A webszerver `lib/python.ts` segédje ugyanezt teszi az OCR és a ZIP-mentési/visszaállítási Python-folyamatokhoz. A macOS védett parancsértelmezői eltávolíthatnak DYLD-változókat, ezért a beállítást közvetlenül a Python-folyamat kapja meg, nem a teljes rendszer.

A legújabb `scripts/repair-macos.command` már az indítót és a Python-folyamatokat kezelő alkalmazásfájlokat is frissíti, majd újrafuttatja a telepítést. Az aktuális beszélgetésben adott legújabb javítóparancsot használd; a korábbi javításazonosítók még nem tartalmazzák ezt. A `data` mappát és a könyveket a javítás nem módosítja.


## Ha a modellek letöltése után „usage: sha256sum” jelenik meg

Ha előtte a `Successfully installed pip` és `Successfully installed Pillow` sorok szerepelnek, a Python-javítás már sikerült. Ilyenkor a Mac SHA-256 eszköze nem ismeri a GNU-s `--check` kapcsolót. A javított telepítő a macOS `shasum -a 256 -c` parancsát részesíti előnyben, tartalékként a hordozható `sha256sum -c` alakot használja. A várt modellhash-ek változatlanok, sérült letöltést továbbra sem fogad el. Ehhez a javításhoz csak a `scripts/setup.sh` fájlt kell frissíteni, majd újrafuttatni a Mac-telepítőt.
