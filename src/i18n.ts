import type { Language } from './preferences';

const messages: Record<string, readonly [string, string, string, string]> = {
  'Locked {description}': [
    'Gesperrt {description}',
    'Verrouillé {description}',
    'Bloqueado {description}',
    'Bloccato {description}',
  ],
  '{code}: {message}': [
    '{code}: {message}',
    '{code} : {message}',
    '{code}: {message}',
    '{code}: {message}',
  ],
  'App update available.': [
    'App-Update verfügbar.',
    'Mise à jour disponible.',
    'Actualización disponible.',
    'Aggiornamento disponibile.',
  ],
  'Finish the current gesture before updating.': [
    'Beende die aktuelle Geste vor dem Aktualisieren.',
    'Terminez le geste en cours avant la mise à jour.',
    'Termina el gesto actual antes de actualizar.',
    'Termina il gesto corrente prima di aggiornare.',
  ],
  'Invalid planner backup structure.': [
    'Ungültige Sicherungsstruktur.',
    'Structure de sauvegarde invalide.',
    'Estructura de copia inválida.',
    'Struttura del backup non valida.',
  ],
  'Invalid or excessively long name/identifier.': [
    'Ungültiger oder zu langer Name/Kennung.',
    'Nom ou identifiant invalide ou trop long.',
    'Nombre o identificador inválido o demasiado largo.',
    'Nome o identificatore non valido o troppo lungo.',
  ],
  'Invalid numeric value in backup.': [
    'Ungültiger Zahlenwert in der Sicherung.',
    'Valeur numérique invalide dans la sauvegarde.',
    'Valor numérico inválido en la copia.',
    'Valore numerico non valido nel backup.',
  ],
  'Invalid inventory in backup.': [
    'Ungültiger Bestand in der Sicherung.',
    'Inventaire invalide dans la sauvegarde.',
    'Inventario inválido en la copia.',
    'Inventario non valido nel backup.',
  ],
  'Backup must contain between 1 and 100 layouts.': [
    'Die Sicherung muss 1 bis 100 Gleispläne enthalten.',
    'La sauvegarde doit contenir de 1 à 100 réseaux.',
    'La copia debe contener entre 1 y 100 trazados.',
    'Il backup deve contenere da 1 a 100 plastici.',
  ],
  'Invalid or excessively large layout.': [
    'Ungültiger oder zu großer Gleisplan.',
    'Réseau invalide ou trop grand.',
    'Trazado inválido o demasiado grande.',
    'Plastico non valido o troppo grande.',
  ],
  'Invalid track orientation.': [
    'Ungültige Gleisausrichtung.',
    'Orientation de voie invalide.',
    'Orientación de vía inválida.',
    'Orientamento del binario non valido.',
  ],
  'Invalid piece lock in backup.': [
    'Ungültige Gleissperre in der Sicherung.',
    'Verrouillage invalide dans la sauvegarde.',
    'Bloqueo inválido en la copia.',
    'Blocco non valido nel backup.',
  ],
  'Duplicate piece identifiers.': [
    'Doppelte Gleiskennungen.',
    'Identifiants de pièces en double.',
    'Identificadores de piezas duplicados.',
    'Identificatori dei pezzi duplicati.',
  ],
  'Duplicate layout identifiers.': [
    'Doppelte Gleisplankennungen.',
    'Identifiants de réseaux en double.',
    'Identificadores de trazados duplicados.',
    'Identificatori dei plastici duplicati.',
  ],
  'Baseboard dimensions must be positive.': [
    'Grundplattenmaße müssen positiv sein.',
    'Les dimensions du plateau doivent être positives.',
    'Las dimensiones del tablero deben ser positivas.',
    'Le dimensioni della base devono essere positive.',
  ],
  'Baseboard rectangles must share an edge or overlap.': [
    'Grundplattenrechtecke müssen eine Kante teilen oder überlappen.',
    'Les rectangles du plateau doivent partager un côté ou se chevaucher.',
    'Los rectángulos del tablero deben compartir un borde o superponerse.',
    'I rettangoli della base devono condividere un lato o sovrapporsi.',
  ],
  'Active layout does not exist.': [
    'Der aktive Gleisplan existiert nicht.',
    'Le réseau actif n’existe pas.',
    'El trazado activo no existe.',
    'Il plastico attivo non esiste.',
  ],
  'Select one or more distinct pieces.': [
    'Wähle ein oder mehrere unterschiedliche Gleise.',
    'Sélectionnez une ou plusieurs pièces distinctes.',
    'Selecciona una o varias piezas distintas.',
    'Seleziona uno o più pezzi distinti.',
  ],
  'Some selected pieces no longer exist.': [
    'Einige ausgewählte Gleise existieren nicht mehr.',
    'Certaines pièces sélectionnées n’existent plus.',
    'Algunas piezas seleccionadas ya no existen.',
    'Alcuni pezzi selezionati non esistono più.',
  ],
  'Cannot change a piece identifier.': [
    'Eine Gleiskennung kann nicht geändert werden.',
    'Impossible de modifier l’identifiant d’une pièce.',
    'No se puede cambiar el identificador de una pieza.',
    'Non è possibile modificare l’identificatore di un pezzo.',
  ],
  'Cannot change the type of an existing piece.': [
    'Der Typ eines vorhandenen Gleises kann nicht geändert werden.',
    'Impossible de modifier le type d’une pièce existante.',
    'No se puede cambiar el tipo de una pieza existente.',
    'Non è possibile cambiare il tipo di un pezzo esistente.',
  ],
  'Unknown track catalog entry. This file may need a newer app version.': [
    'Unbekannter Katalogeintrag. Diese Datei benötigt möglicherweise eine neuere App-Version.',
    'Référence inconnue. Ce fichier peut nécessiter une version plus récente.',
    'Referencia desconocida. Este archivo puede necesitar una versión más reciente.',
    'Voce del catalogo sconosciuta. Il file potrebbe richiedere una versione più recente.',
  ],
  'Keep at least one layout.': [
    'Behalte mindestens einen Gleisplan.',
    'Conservez au moins un réseau.',
    'Conserva al menos un trazado.',
    'Mantieni almeno un plastico.',
  ],
  'This browser does not support track sounds.': [
    'Dieser Browser unterstützt keine Gleisgeräusche.',
    'Ce navigateur ne prend pas en charge les sons.',
    'Este navegador no admite sonidos de vías.',
    'Questo browser non supporta i suoni dei binari.',
  ],
  'PNG export is unavailable in this browser.': [
    'PNG-Export ist in diesem Browser nicht verfügbar.',
    'L’export PNG n’est pas disponible dans ce navigateur.',
    'La exportación PNG no está disponible en este navegador.',
    'L’esportazione PNG non è disponibile in questo browser.',
  ],
  'The browser could not encode the PNG export.': [
    'Der Browser konnte den PNG-Export nicht kodieren.',
    'Le navigateur n’a pas pu encoder le PNG.',
    'El navegador no pudo codificar el PNG.',
    'Il browser non ha potuto codificare il PNG.',
  ],
  'The print drawing could not be generated.': [
    'Die Druckzeichnung konnte nicht erzeugt werden.',
    'Le dessin d’impression n’a pas pu être généré.',
    'No se pudo generar el dibujo para imprimir.',
    'Non è stato possibile generare il disegno di stampa.',
  ],
  'A name contains characters SVG cannot represent. Rename it before exporting.': [
    'Ein Name enthält für SVG ungültige Zeichen. Benenne ihn vor dem Export um.',
    'Un nom contient des caractères non valides en SVG. Renommez-le avant l’export.',
    'Un nombre contiene caracteres no válidos para SVG. Renómbralo antes de exportar.',
    'Un nome contiene caratteri non validi per SVG. Rinominalo prima di esportare.',
  ],
  'Track plan. Drag blank space to select; Space and drag to pan; Ctrl selects multiple pieces. Use controls for keyboard editing.':
    [
      'Gleisplan. Ziehe eine Auswahl im freien Bereich; Leertaste und Ziehen verschiebt die Ansicht; Strg wählt mehrere Gleise. Nutze die Tastaturbedienung.',
      'Plan de voies. Glissez dans le vide pour sélectionner ; Espace et glisser déplacent la vue ; Ctrl sélectionne plusieurs pièces. Utilisez les commandes clavier.',
      'Plano de vías. Arrastra en el espacio vacío para seleccionar; Espacio y arrastrar desplazan la vista; Ctrl selecciona varias piezas. Usa los controles del teclado.',
      'Piano dei binari. Trascina nello spazio vuoto per selezionare; Spazio e trascinamento spostano la vista; Ctrl seleziona più pezzi. Usa i comandi da tastiera.',
    ],
  'Tap to place track. Drag blank space to select enclosed pieces; Ctrl-click toggles selection. Drag selected pieces as a group. Space + drag pans; scroll or pinch zooms. On touch screens, drag blank space to pan. Arrows move 5 mm; Shift + arrows move 1 mm. R rotates; Delete removes; Escape cancels. Ctrl+A selects all; Ctrl+Z undoes; Ctrl+Shift+Z or Ctrl+Y redoes. Right-click a piece for lock actions, or use the buttons.':
    [
      'Tippe zum Platzieren. Ziehe im freien Bereich eine Auswahl; Strg-Klick schaltet Gleise um. Ziehe die Auswahl gemeinsam. Leertaste + Ziehen verschiebt die Ansicht; Scrollen oder Pinch zoomt. Auf Touchscreens verschiebt Ziehen im freien Bereich die Ansicht. Pfeile bewegen 5 mm, Umschalt + Pfeile 1 mm. R dreht, Entf löscht, Escape bricht ab. Strg+A wählt alle; Strg+Z macht rückgängig; Strg+Umschalt+Z oder Strg+Y wiederholt. Rechtsklick oder Schaltflächen sperren Gleise.',
      'Touchez pour placer. Glissez dans le vide pour sélectionner les pièces incluses ; Ctrl-clic bascule la sélection. Déplacez la sélection en groupe. Espace + glisser déplace la vue ; défilement ou pincement zoome. Sur écran tactile, glissez dans le vide pour déplacer la vue. Les flèches déplacent de 5 mm, Maj + flèches de 1 mm. R tourne, Suppr retire, Échap annule. Ctrl+A sélectionne tout ; Ctrl+Z annule ; Ctrl+Maj+Z ou Ctrl+Y rétablit. Clic droit ou boutons pour verrouiller.',
      'Toca para colocar. Arrastra en el espacio vacío para seleccionar piezas encerradas; Ctrl-clic alterna la selección. Arrastra la selección como grupo. Espacio + arrastrar desplaza la vista; rueda o pellizco cambia el zoom. En pantallas táctiles, arrastra en el espacio vacío para desplazar. Las flechas mueven 5 mm; Mayús + flechas 1 mm. R gira; Supr elimina; Escape cancela. Ctrl+A selecciona todo; Ctrl+Z deshace; Ctrl+Mayús+Z o Ctrl+Y rehace. Usa clic derecho o botones para bloquear.',
      'Tocca per posizionare. Trascina nello spazio vuoto per selezionare i pezzi inclusi; Ctrl-clic alterna la selezione. Trascina la selezione come gruppo. Spazio + trascina sposta la vista; rotella o pizzico modifica lo zoom. Su touch screen, trascina nello spazio vuoto per spostare la vista. Le frecce spostano di 5 mm; Maiusc + frecce di 1 mm. R ruota; Canc elimina; Escape annulla. Ctrl+A seleziona tutto; Ctrl+Z annulla; Ctrl+Maiusc+Z o Ctrl+Y ripristina. Usa clic destro o pulsanti per bloccare.',
    ],
  "For offline installation, open a production build over HTTPS (or localhost). Use your browser's Install app / Add to Home Screen option. Browser support varies.":
    [
      'Öffne für die Offline-Installation die veröffentlichte App über HTTPS oder localhost. Verwende „App installieren“ oder „Zum Startbildschirm hinzufügen“. Die Unterstützung hängt vom Browser ab.',
      'Pour l’installation hors ligne, ouvrez l’application publiée en HTTPS ou localhost. Utilisez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Le support dépend du navigateur.',
      'Para instalar sin conexión, abre la aplicación publicada por HTTPS o localhost. Usa «Instalar aplicación» o «Añadir a pantalla de inicio». La compatibilidad depende del navegador.',
      'Per installare offline, apri l’applicazione pubblicata tramite HTTPS o localhost. Usa «Installa applicazione» o «Aggiungi alla schermata Home». Il supporto dipende dal browser.',
    ],
  'To buy: not in your inventory': [
    'Zu kaufen: nicht im Bestand',
    'À acheter : absent de l’inventaire',
    'Comprar: no está en tu inventario',
    'Da acquistare: non presente nell’inventario',
  ],
  'to buy': ['zu kaufen', 'à acheter', 'por comprar', 'da acquistare'],
  Locked: ['Gesperrt', 'Verrouillé', 'Bloqueado', 'Bloccato'],
  'Approximate geometry. Verify actual connector positions physically.': [
    'Ungefähre Geometrie. Prüfe die echten Anschlusspositionen physisch.',
    'Géométrie approximative. Vérifiez physiquement les raccords réels.',
    'Geometría aproximada. Verifica físicamente las posiciones reales de conexión.',
    'Geometria approssimativa. Verifica fisicamente i raccordi reali.',
  ],
  'Select {code} at {x}, {y} mm': [
    '{code} bei {x}, {y} mm auswählen',
    'Sélectionner {code} à {x}, {y} mm',
    'Seleccionar {code} en {x}, {y} mm',
    'Seleziona {code} a {x}, {y} mm',
  ],
  'Select {code} at {x}, {y} mm, to buy': [
    '{code} bei {x}, {y} mm auswählen, zu kaufen',
    'Sélectionner {code} à {x}, {y} mm, à acheter',
    'Seleccionar {code} en {x}, {y} mm, por comprar',
    'Seleziona {code} a {x}, {y} mm, da acquistare',
  ],
  '{width} x {height} at {x}, {y} / remove': [
    '{width} x {height} bei {x}, {y} / entfernen',
    '{width} x {height} à {x}, {y} / retirer',
    '{width} x {height} en {x}, {y} / eliminar',
    '{width} x {height} a {x}, {y} / rimuovi',
  ],
  'Approximate geometry: {codes}. Verify physically before buying or building.': [
    'Ungefähre Geometrie: {codes}. Vor Kauf oder Bau physisch prüfen.',
    'Géométrie approximative : {codes}. Vérifiez physiquement avant d’acheter ou construire.',
    'Geometría aproximada: {codes}. Verifica físicamente antes de comprar o construir.',
    'Geometria approssimativa: {codes}. Verifica fisicamente prima di acquistare o costruire.',
  ],
  '{first} | {second}': [
    '{first} | {second}',
    '{first} | {second}',
    '{first} | {second}',
    '{first} | {second}',
  ],
  '{first} + {second}': [
    '{first} + {second}',
    '{first} + {second}',
    '{first} + {second}',
    '{first} + {second}',
  ],
  'Inventory must be a whole number between 0 and 9999.': [
    'Der Bestand muss eine ganze Zahl von 0 bis 9999 sein.',
    'La quantité doit être un entier entre 0 et 9999.',
    'La cantidad debe ser un entero entre 0 y 9999.',
    'La quantità deve essere un intero tra 0 e 9999.',
  ],
  'Unsupported backup version. Your original data has not been changed.': [
    'Nicht unterstützte Sicherungsversion. Die Originaldaten bleiben unverändert.',
    'Version de sauvegarde non prise en charge. Vos données originales n’ont pas changé.',
    'Versión de copia no compatible. Tus datos originales no cambiaron.',
    'Versione del backup non supportata. I dati originali non sono cambiati.',
  ],
  'Backup exceeds the 4 MB import limit.': [
    'Die Sicherung überschreitet die Importgrenze von 4 MB.',
    'La sauvegarde dépasse la limite de 4 Mo.',
    'La copia supera el límite de importación de 4 MB.',
    'Il backup supera il limite di importazione di 4 MB.',
  ],
  'These tracks have incompatible gauge, electrical system or rail code.': [
    'Diese Gleise haben inkompatible Spurweite, Stromsysteme oder Schienenprofile.',
    'Ces voies ont un écartement, système électrique ou profil incompatible.',
    'Estas vías tienen ancho, sistema eléctrico o perfil incompatibles.',
    'Questi binari hanno scartamento, sistema elettrico o profilo incompatibili.',
  ],
  'Enter finite coordinates and positive rectangle dimensions.': [
    'Gib endliche Koordinaten und positive Rechteckmaße ein.',
    'Saisissez des coordonnées finies et des dimensions positives.',
    'Introduce coordenadas finitas y dimensiones positivas.',
    'Inserisci coordinate finite e dimensioni positive.',
  ],
  'Rectangles must share an edge or overlap, not just touch at a corner.': [
    'Rechtecke müssen eine Kante teilen oder überlappen, nicht nur eine Ecke berühren.',
    'Les rectangles doivent partager un côté ou se chevaucher, pas seulement un coin.',
    'Los rectángulos deben compartir un borde o superponerse, no solo tocar una esquina.',
    'I rettangoli devono condividere un lato o sovrapporsi, non solo un angolo.',
  ],
  'Removing this rectangle would disconnect the baseboard.': [
    'Das Entfernen würde die Grundplatte trennen.',
    'Retirer ce rectangle séparerait le plateau.',
    'Eliminar este rectángulo separaría el tablero.',
    'Rimuovere questo rettangolo dividerebbe la base.',
  ],
  'PNG export failed: {detail}': [
    'PNG-Export fehlgeschlagen: {detail}',
    'Export PNG échoué : {detail}',
    'Error al exportar PNG: {detail}',
    'Esportazione PNG fallita: {detail}',
  ],
  'Editing is locked. Export the original backup, then import a valid backup to recover.': [
    'Bearbeitung gesperrt. Exportiere die Originalsicherung und importiere eine gültige Sicherung zur Wiederherstellung.',
    'Édition verrouillée. Exportez la sauvegarde originale puis importez une sauvegarde valide.',
    'Edición bloqueada. Exporta la copia original e importa una copia válida para recuperar.',
    'Modifica bloccata. Esporta il backup originale, poi importa un backup valido per recuperare.',
  ],
  'Planner data changed in another tab. Reload before editing to avoid overwriting its changes.': [
    'Die Planerdaten wurden in einem anderen Tab geändert. Lade vor dem Bearbeiten neu, um sie nicht zu überschreiben.',
    'Données modifiées dans un autre onglet. Rechargez avant d’éditer pour éviter de les écraser.',
    'Datos modificados en otra pestaña. Recarga antes de editar para no sobrescribirlos.',
    'Dati modificati in un’altra scheda. Ricarica prima di modificare per non sovrascriverli.',
  ],
  'Could not read saved data: {detail} Export the original backup or import a valid one. Editing is locked to protect your data.':
    [
      'Gespeicherte Daten konnten nicht gelesen werden: {detail} Exportiere das Original oder importiere eine gültige Sicherung. Die Bearbeitung ist zum Schutz gesperrt.',
      'Impossible de lire les données : {detail} Exportez l’original ou importez une sauvegarde valide. Édition verrouillée pour les protéger.',
      'No se pudieron leer los datos: {detail} Exporta el original o importa una copia válida. La edición está bloqueada para protegerlos.',
      'Impossibile leggere i dati: {detail} Esporta l’originale o importa un backup valido. Modifica bloccata per proteggerli.',
    ],
  'Your track. Your next great layout.': [
    'Deine Gleise. Dein nächster großartiger Gleisplan.',
    'Vos rails. Votre prochain grand réseau.',
    'Tus vías. Tu próximo gran trazado.',
    'I tuoi binari. Il tuo prossimo grande plastico.',
  ],
  'LOCAL & PRIVATE': ['LOKAL & PRIVAT', 'LOCAL & PRIVÉ', 'LOCAL Y PRIVADO', 'LOCALE E PRIVATO'],
  'Dark mode': ['Dunkler Modus', 'Mode sombre', 'Modo oscuro', 'Tema scuro'],
  Language: ['Sprache', 'Langue', 'Idioma', 'Lingua'],
  'Export backup': [
    'Sicherung exportieren',
    'Exporter la sauvegarde',
    'Exportar copia',
    'Esporta backup',
  ],
  'Import backup': [
    'Sicherung importieren',
    'Importer la sauvegarde',
    'Importar copia',
    'Importa backup',
  ],
  Layout: ['Gleisplan', 'Réseau', 'Trazado', 'Plastico'],
  'Saved layouts': [
    'Gespeicherte Gleispläne',
    'Réseaux enregistrés',
    'Trazados guardados',
    'Plastici salvati',
  ],
  'New idea': ['Neue Idee', 'Nouvelle idée', 'Nueva idea', 'Nuova idea'],
  Duplicate: ['Duplizieren', 'Dupliquer', 'Duplicar', 'Duplica'],
  Rename: ['Umbenennen', 'Renommer', 'Renombrar', 'Rinomina'],
  'Delete layout': [
    'Gleisplan löschen',
    'Supprimer le réseau',
    'Eliminar trazado',
    'Elimina plastico',
  ],
  Undo: ['Rückgängig', 'Annuler', 'Deshacer', 'Annulla'],
  Redo: ['Wiederholen', 'Rétablir', 'Rehacer', 'Ripristina'],
  'Autosave ready': [
    'Automatisches Speichern bereit',
    'Sauvegarde automatique prête',
    'Guardado automático listo',
    'Salvataggio automatico pronto',
  ],
  'Saved on this device': [
    'Auf diesem Gerät gespeichert',
    'Enregistré sur cet appareil',
    'Guardado en este dispositivo',
    'Salvato su questo dispositivo',
  ],
  'Save failed': [
    'Speichern fehlgeschlagen',
    'Échec de sauvegarde',
    'Error al guardar',
    'Salvataggio non riuscito',
  ],
  'YOUR COLLECTION': ['DEINE SAMMLUNG', 'VOTRE COLLECTION', 'TU COLECCIÓN', 'LA TUA COLLEZIONE'],
  'Track inventory': [
    'Gleisbestand',
    'Inventaire des voies',
    'Inventario de vías',
    'Inventario dei binari',
  ],
  "Plan with any piece. Missing stock appears on this idea's shopping list.": [
    'Plane mit beliebigen Gleisen. Fehlende Teile erscheinen auf der Einkaufsliste dieser Idee.',
    'Planifiez avec toutes les pièces. Les pièces manquantes figurent dans la liste d’achats de cette idée.',
    'Planifica con cualquier pieza. Las piezas que faltan aparecen en la lista de compras de esta idea.',
    'Progetta con qualsiasi pezzo. I pezzi mancanti compaiono nella lista della spesa di questa idea.',
  ],
  'Find a piece': ['Gleis suchen', 'Rechercher une pièce', 'Buscar una pieza', 'Cerca un pezzo'],
  'Code or track type...': [
    'Artikelnummer oder Gleisart...',
    'Référence ou type de voie...',
    'Código o tipo de vía...',
    'Codice o tipo di binario...',
  ],
  'Manufacturer / scale': [
    'Hersteller / Maßstab',
    'Fabricant / échelle',
    'Fabricante / escala',
    'Produttore / scala',
  ],
  'All OO manufacturers': [
    'Alle OO-Hersteller',
    'Tous les fabricants OO',
    'Todos los fabricantes OO',
    'Tutti i produttori OO',
  ],
  'Owned / left': [
    'Bestand / übrig',
    'Possédé / restant',
    'Disponible / restante',
    'Posseduti / rimanenti',
  ],
  'Reset entire inventory': [
    'Gesamten Bestand zurücksetzen',
    'Réinitialiser tout l’inventaire',
    'Reiniciar todo el inventario',
    'Azzera tutto l’inventario',
  ],
  'Drag a piece onto the plan, or choose it and tap an empty spot. No sample stock is added.': [
    'Ziehe ein Gleis auf den Plan oder wähle es und tippe auf eine freie Stelle. Es wird kein Beispielbestand ergänzt.',
    'Glissez une pièce sur le plan ou sélectionnez-la puis touchez un espace vide. Aucun stock fictif n’est ajouté.',
    'Arrastra una pieza al plano o selecciónala y toca un espacio vacío. No se añade inventario de ejemplo.',
    'Trascina un pezzo sul piano oppure selezionalo e tocca uno spazio vuoto. Non viene aggiunto inventario di esempio.',
  ],
  'Layout editor': [
    'Gleisplan-Editor',
    'Éditeur de réseau',
    'Editor del trazado',
    'Editor del plastico',
  ],
  'Select / pan': [
    'Auswählen / verschieben',
    'Sélection / déplacement',
    'Seleccionar / desplazar',
    'Seleziona / sposta vista',
  ],
  'Rotate new': [
    'Neues Gleis drehen',
    'Tourner la nouvelle pièce',
    'Girar pieza nueva',
    'Ruota nuovo pezzo',
  ],
  'Reverse new curve': [
    'Neue Kurve spiegeln',
    'Inverser la nouvelle courbe',
    'Invertir curva nueva',
    'Inverti nuova curva',
  ],
  'Select a track piece to begin': [
    'Wähle ein Gleis, um zu beginnen',
    'Sélectionnez une voie pour commencer',
    'Selecciona una vía para empezar',
    'Seleziona un binario per iniziare',
  ],
  Snap: ['Einrasten', 'Accrochage', 'Acoplar', 'Aggancio'],
  'Zoom out': ['Verkleinern', 'Dézoomer', 'Alejar', 'Riduci zoom'],
  'Zoom in': ['Vergrößern', 'Zoomer', 'Acercar', 'Aumenta zoom'],
  'Fit plan': ['Plan einpassen', 'Ajuster le plan', 'Ajustar plano', 'Adatta piano'],
  'A little space for big ideas.': [
    'Ein wenig Platz für große Ideen.',
    'Un petit espace pour de grandes idées.',
    'Un pequeño espacio para grandes ideas.',
    'Un piccolo spazio per grandi idee.',
  ],
  'Choose a track piece, then drag or tap to place it.': [
    'Wähle ein Gleis und ziehe es oder tippe zum Platzieren.',
    'Choisissez une voie, puis glissez ou touchez pour la placer.',
    'Elige una vía y arrastra o toca para colocarla.',
    'Scegli un binario, poi trascina o tocca per posizionarlo.',
  ],
  '100 mm grid / all dimensions in mm': [
    '100-mm-Raster / alle Maße in mm',
    'Grille de 100 mm / dimensions en mm',
    'Cuadrícula de 100 mm / dimensiones en mm',
    'Griglia di 100 mm / dimensioni in mm',
  ],
  'FINE TUNE': ['FEINABSTIMMUNG', 'RÉGLAGES', 'AJUSTES', 'REGOLAZIONI'],
  'Selected piece': [
    'Ausgewähltes Gleis',
    'Pièce sélectionnée',
    'Pieza seleccionada',
    'Pezzo selezionato',
  ],
  Piece: ['Gleis', 'Pièce', 'Pieza', 'Pezzo'],
  'Select placed piece': [
    'Platziertes Gleis auswählen',
    'Sélectionner une pièce placée',
    'Seleccionar pieza colocada',
    'Seleziona pezzo posizionato',
  ],
  None: ['Keine', 'Aucune', 'Ninguna', 'Nessuno'],
  'Select a piece to see its type and dimensions.': [
    'Wähle ein Gleis für Typ und Abmessungen.',
    'Sélectionnez une pièce pour voir son type et ses dimensions.',
    'Selecciona una pieza para ver su tipo y dimensiones.',
    'Seleziona un pezzo per vedere tipo e dimensioni.',
  ],
  'Select all pieces': [
    'Alle Gleise auswählen',
    'Tout sélectionner',
    'Seleccionar todas las piezas',
    'Seleziona tutti i pezzi',
  ],
  'Lock selection': [
    'Auswahl sperren',
    'Verrouiller la sélection',
    'Bloquear selección',
    'Blocca selezione',
  ],
  'Unlock selection': [
    'Auswahl entsperren',
    'Déverrouiller la sélection',
    'Desbloquear selección',
    'Sblocca selezione',
  ],
  'X (mm)': ['X (mm)', 'X (mm)', 'X (mm)', 'X (mm)'],
  'Y (mm)': ['Y (mm)', 'Y (mm)', 'Y (mm)', 'Y (mm)'],
  'Angle (degrees)': ['Winkel (Grad)', 'Angle (degrés)', 'Ángulo (grados)', 'Angolo (gradi)'],
  'Apply position': [
    'Position anwenden',
    'Appliquer la position',
    'Aplicar posición',
    'Applica posizione',
  ],
  'Rotate -22.5': ['Drehen -22,5', 'Tourner -22,5', 'Girar -22,5', 'Ruota -22,5'],
  'Rotate +22.5': ['Drehen +22,5', 'Tourner +22,5', 'Girar +22,5', 'Ruota +22,5'],
  'Reverse curve': ['Kurve spiegeln', 'Inverser la courbe', 'Invertir curva', 'Inverti curva'],
  'Remove piece': ['Gleis entfernen', 'Retirer la pièce', 'Eliminar pieza', 'Rimuovi pezzo'],
  'Remove selection': [
    'Auswahl entfernen',
    'Retirer la sélection',
    'Eliminar selección',
    'Rimuovi selezione',
  ],
  'Shopping list': ['Einkaufsliste', 'Liste d’achats', 'Lista de compras', 'Lista della spesa'],
  'Extra pieces needed for this layout only. Orange dashed track is not yet owned.': [
    'Zusätzliche Gleise nur für diesen Plan. Orange gestrichelte Gleise fehlen im Bestand.',
    'Pièces supplémentaires pour ce réseau uniquement. Les voies orange en pointillés ne sont pas encore possédées.',
    'Piezas adicionales solo para este trazado. Las vías naranjas discontinuas aún no están en el inventario.',
    'Pezzi aggiuntivi solo per questo plastico. I binari arancioni tratteggiati non sono ancora posseduti.',
  ],
  'You own all the track needed for this idea.': [
    'Du besitzt alle Gleise für diese Idee.',
    'Vous possédez toutes les voies nécessaires.',
    'Tienes todas las vías necesarias para esta idea.',
    'Possiedi tutti i binari necessari per questa idea.',
  ],
  'YOUR SPACE': ['DEIN PLATZ', 'VOTRE ESPACE', 'TU ESPACIO', 'IL TUO SPAZIO'],
  Baseboard: ['Grundplatte', 'Plateau', 'Tablero', 'Base'],
  'Unbounded until you add a rectangle. Join more rectangles for an L or U shape.': [
    'Unbegrenzt, bis du ein Rechteck ergänzt. Verbinde Rechtecke für eine L- oder U-Form.',
    'Sans limites avant l’ajout d’un rectangle. Assemblez des rectangles pour une forme en L ou U.',
    'Sin límites hasta añadir un rectángulo. Une rectángulos para formar una L o U.',
    'Senza limiti finché non aggiungi un rettangolo. Unisci rettangoli per una forma a L o U.',
  ],
  'Width (mm)': ['Breite (mm)', 'Largeur (mm)', 'Anchura (mm)', 'Larghezza (mm)'],
  'Height (mm)': ['Höhe (mm)', 'Hauteur (mm)', 'Altura (mm)', 'Altezza (mm)'],
  'Add rectangle': [
    'Rechteck hinzufügen',
    'Ajouter un rectangle',
    'Añadir rectángulo',
    'Aggiungi rettangolo',
  ],
  'Use unbounded area': [
    'Unbegrenzte Fläche verwenden',
    'Utiliser une zone illimitée',
    'Usar área ilimitada',
    'Usa area illimitata',
  ],
  'Planning checks': [
    'Planungsprüfungen',
    'Vérifications du plan',
    'Comprobaciones del plano',
    'Verifiche del piano',
  ],
  'No definite placement violations found.': [
    'Keine eindeutigen Platzierungsprobleme gefunden.',
    'Aucune violation certaine du placement.',
    'No se encontraron errores claros de colocación.',
    'Nessuna violazione certa del posizionamento.',
  ],
  '67 mm nominal Hornby track centres. Curves and turnout fans still need physical checks with your longest trains. This is not a clearance certificate.':
    [
      '67 mm nomineller Hornby-Gleisabstand. Prüfe Kurven und Weichenfächer mit deinen längsten Zügen. Dies ist kein Lichtraumzertifikat.',
      'Entraxe nominal Hornby de 67 mm. Vérifiez physiquement les courbes et faisceaux d’aiguillages avec vos trains les plus longs. Ceci n’est pas un certificat de dégagement.',
      'Separación nominal Hornby de 67 mm. Comprueba físicamente curvas y desvíos con tus trenes más largos. No es un certificado de gálibo.',
      'Interasse nominale Hornby di 67 mm. Verifica fisicamente curve e fasci di scambi con i treni più lunghi. Non è una certificazione di sagoma.',
    ],
  'Controls & mobile': [
    'Bedienung & Mobilgeräte',
    'Commandes et mobile',
    'Controles y móvil',
    'Comandi e dispositivi mobili',
  ],
  'Update app': [
    'App aktualisieren',
    'Mettre à jour l’application',
    'Actualizar aplicación',
    'Aggiorna applicazione',
  ],
  Preferences: ['Einstellungen', 'Préférences', 'Preferencias', 'Preferenze'],
  'Track sounds': ['Gleisgeräusche', 'Sons des voies', 'Sonidos de vías', 'Suoni dei binari'],
  'Confirm piece deletion': [
    'Löschen von Gleisen bestätigen',
    'Confirmer le retrait des pièces',
    'Confirmar eliminación de piezas',
    'Conferma eliminazione dei pezzi',
  ],
  'Activity & history (this session)': [
    'Aktivität & Verlauf (diese Sitzung)',
    'Activité et historique (cette session)',
    'Actividad e historial (esta sesión)',
    'Attività e cronologia (questa sessione)',
  ],
  'Undo history': [
    'Änderungsverlauf',
    'Historique des modifications',
    'Historial de cambios',
    'Cronologia delle modifiche',
  ],
  'Local activity': ['Lokale Aktivität', 'Activité locale', 'Actividad local', 'Attività locale'],
  'History is session-only: 100 undo steps and 300 activity entries. Nothing is uploaded.': [
    'Nur für diese Sitzung: 100 Rückgängig-Schritte und 300 Aktivitätseinträge. Nichts wird hochgeladen.',
    'Pour cette session uniquement : 100 annulations et 300 activités. Rien n’est envoyé.',
    'Solo esta sesión: 100 pasos de deshacer y 300 actividades. No se sube nada.',
    'Solo per questa sessione: 100 annullamenti e 300 attività. Nulla viene caricato.',
  ],
  'Planner status': [
    'Planerstatus',
    'État du planificateur',
    'Estado del planificador',
    'Stato del pianificatore',
  ],
  "Welcome. Choose any track to start planning; enter your inventory whenever you're ready.": [
    'Willkommen. Wähle ein Gleis für deinen Plan und erfasse deinen Bestand, wenn du möchtest.',
    'Bienvenue. Choisissez une voie pour commencer et renseignez votre inventaire quand vous voulez.',
    'Bienvenido. Elige una vía para empezar y registra tu inventario cuando quieras.',
    'Benvenuto. Scegli un binario per iniziare e inserisci il tuo inventario quando vuoi.',
  ],
  Confirm: ['Bestätigen', 'Confirmer', 'Confirmar', 'Conferma'],
  Cancel: ['Abbrechen', 'Annuler', 'Cancelar', 'Annulla'],
  Close: ['Schließen', 'Fermer', 'Cerrar', 'Chiudi'],
  Save: ['Speichern', 'Enregistrer', 'Guardar', 'Salva'],
  Name: ['Name', 'Nom', 'Nombre', 'Nome'],
  'Layout name': [
    'Name des Gleisplans',
    'Nom du réseau',
    'Nombre del trazado',
    'Nome del plastico',
  ],
  'Selection actions': [
    'Auswahlaktionen',
    'Actions de sélection',
    'Acciones de selección',
    'Azioni della selezione',
  ],
  'Skip future piece-delete confirmations': [
    'Künftige Gleislöschungen nicht bestätigen',
    'Ne plus confirmer le retrait des pièces',
    'No confirmar futuras eliminaciones de piezas',
    'Non confermare future eliminazioni dei pezzi',
  ],
  'Remove selected pieces?': [
    'Ausgewählte Gleise entfernen?',
    'Retirer les pièces sélectionnées ?',
    '¿Eliminar piezas seleccionadas?',
    'Rimuovere i pezzi selezionati?',
  ],
  'Remove {count} selected pieces? Your inventory quantities are unchanged. Undo is available during this session.':
    [
      '{count} ausgewählte Gleise entfernen? Dein Bestand bleibt unverändert. Rückgängig ist in dieser Sitzung verfügbar.',
      'Retirer {count} pièces sélectionnées ? Votre stock ne change pas. Vous pouvez annuler pendant cette session.',
      '¿Eliminar {count} piezas seleccionadas? El inventario no cambia. Puedes deshacer durante esta sesión.',
      'Rimuovere {count} pezzi selezionati? L’inventario non cambia. Puoi annullare durante questa sessione.',
    ],
  'Reset entire inventory?': [
    'Gesamten Bestand zurücksetzen?',
    'Réinitialiser tout l’inventaire ?',
    '¿Reiniciar todo el inventario?',
    'Azzerare tutto l’inventario?',
  ],
  'Set every owned quantity to zero? Layouts and their shopping lists are retained. Undo is available during this session.':
    [
      'Alle Bestandszahlen auf null setzen? Gleispläne und Einkaufslisten bleiben erhalten. Rückgängig ist in dieser Sitzung verfügbar.',
      'Mettre toutes les quantités à zéro ? Les réseaux et listes d’achats sont conservés. Annulation possible pendant cette session.',
      '¿Poner todas las cantidades a cero? Se conservan los trazados y listas de compras. Puedes deshacer en esta sesión.',
      'Azzerare tutte le quantità? Plastici e liste della spesa restano disponibili. Puoi annullare in questa sessione.',
    ],
  'New layout idea': [
    'Neue Gleisplan-Idee',
    'Nouvelle idée de réseau',
    'Nueva idea de trazado',
    'Nuova idea di plastico',
  ],
  'Duplicate layout': [
    'Gleisplan duplizieren',
    'Dupliquer le réseau',
    'Duplicar trazado',
    'Duplica plastico',
  ],
  'Rename layout': [
    'Gleisplan umbenennen',
    'Renommer le réseau',
    'Renombrar trazado',
    'Rinomina plastico',
  ],
  'Delete this layout?': [
    'Diesen Gleisplan löschen?',
    'Supprimer ce réseau ?',
    '¿Eliminar este trazado?',
    'Eliminare questo plastico?',
  ],
  'This removes only this idea, not your inventory. Export a backup first if you need to keep it.':
    [
      'Dies löscht nur diese Idee, nicht den Bestand. Exportiere zuerst eine Sicherung, wenn du sie behalten möchtest.',
      'Seule cette idée est supprimée, pas l’inventaire. Exportez une sauvegarde si vous voulez la conserver.',
      'Solo elimina esta idea, no el inventario. Exporta una copia si quieres conservarla.',
      'Elimina solo questa idea, non l’inventario. Esporta un backup se vuoi conservarla.',
    ],
  "Replace this device's planner data?": [
    'Planerdaten dieses Geräts ersetzen?',
    'Remplacer les données de cet appareil ?',
    '¿Reemplazar los datos de este dispositivo?',
    'Sostituire i dati di questo dispositivo?',
  ],
  'This replaces all inventory and layouts. Export a backup first. Imported geometry will be checked and any placement issues shown.':
    [
      'Ersetzt Bestand und alle Gleispläne. Exportiere zuerst eine Sicherung. Importierte Geometrie wird geprüft; Probleme werden angezeigt.',
      'Remplace tous les stocks et réseaux. Exportez d’abord une sauvegarde. La géométrie importée sera vérifiée et les problèmes affichés.',
      'Reemplaza todo el inventario y los trazados. Exporta antes una copia. Se comprobará la geometría y se mostrarán los problemas.',
      'Sostituisce tutto l’inventario e i plastici. Esporta prima un backup. La geometria importata sarà verificata e i problemi mostrati.',
    ],
  'Unexpected problem': [
    'Unerwartetes Problem',
    'Problème inattendu',
    'Problema inesperado',
    'Problema imprevisto',
  ],
  'Your last saved data is safe. Export a backup before reloading. No layout or activity data is sent with an error report.':
    [
      'Die zuletzt gespeicherten Daten sind sicher. Exportiere vor dem Neuladen eine Sicherung. Fehlerberichte enthalten keine Plan- oder Aktivitätsdaten.',
      'Vos dernières données enregistrées sont sûres. Exportez une sauvegarde avant de recharger. Aucun réseau ni historique n’est envoyé avec le rapport.',
      'Tus últimos datos guardados están seguros. Exporta una copia antes de recargar. El informe no envía trazados ni actividad.',
      'Gli ultimi dati salvati sono al sicuro. Esporta un backup prima di ricaricare. Il rapporto non invia plastici o attività.',
    ],
  'Review a GitHub issue report': [
    'GitHub-Fehlerbericht prüfen',
    'Vérifier un rapport GitHub',
    'Revisar informe de GitHub',
    'Rivedi segnalazione GitHub',
  ],
  'Unexpected error. Export a backup before reloading.': [
    'Unerwarteter Fehler. Exportiere vor dem Neuladen eine Sicherung.',
    'Erreur inattendue. Exportez une sauvegarde avant de recharger.',
    'Error inesperado. Exporta una copia antes de recargar.',
    'Errore imprevisto. Esporta un backup prima di ricaricare.',
  ],
  Straight: ['Gerade', 'Droit', 'Recta', 'Dritto'],
  'Double straight': ['Doppelte Gerade', 'Double droit', 'Recta doble', 'Dritto doppio'],
  'Long straight': ['Lange Gerade', 'Long droit', 'Recta larga', 'Dritto lungo'],
  'Quarter straight': ['Viertelgerade', 'Quart de droit', 'Cuarto de recta', 'Quarto di dritto'],
  'Short straight': ['Kurze Gerade', 'Droit court', 'Recta corta', 'Dritto corto'],
  'Special short straight': [
    'Besondere kurze Gerade',
    'Droit court spécial',
    'Recta corta especial',
    'Dritto corto speciale',
  ],
  'Double isolating straight': [
    'Doppelt isolierende Gerade',
    'Droit à double isolation',
    'Recta con doble aislamiento',
    'Dritto a doppio isolamento',
  ],
  'Power track': [
    'Anschlussgleis',
    'Voie d’alimentation',
    'Vía de alimentación',
    'Binario di alimentazione',
  ],
  '1st radius': ['Radius 1', 'Rayon 1', 'Radio 1', 'Raggio 1'],
  '1st radius double': ['Radius 1 doppelt', 'Rayon 1 double', 'Radio 1 doble', 'Raggio 1 doppio'],
  '2nd radius': ['Radius 2', 'Rayon 2', 'Radio 2', 'Raggio 2'],
  '2nd radius double': ['Radius 2 doppelt', 'Rayon 2 double', 'Radio 2 doble', 'Raggio 2 doppio'],
  '2nd radius half': ['Radius 2 halb', 'Demi-courbe rayon 2', 'Medio radio 2', 'Mezzo raggio 2'],
  '3rd radius': ['Radius 3', 'Rayon 3', 'Radio 3', 'Raggio 3'],
  '3rd radius double': ['Radius 3 doppelt', 'Rayon 3 double', 'Radio 3 doble', 'Raggio 3 doppio'],
  '4th radius': ['Radius 4', 'Rayon 4', 'Radio 4', 'Raggio 4'],
  '4th radius double': ['Radius 4 doppelt', 'Rayon 4 double', 'Radio 4 doble', 'Raggio 4 doppio'],
  'Express / Y countercurve': [
    'Express-/Y-Gegenbogen',
    'Contre-courbe express / Y',
    'Contracurva exprés / Y',
    'Controcurva express / Y',
  ],
  'Left-hand point': ['Linke Weiche', 'Aiguillage gauche', 'Desvío izquierdo', 'Scambio sinistro'],
  'Right-hand point': ['Rechte Weiche', 'Aiguillage droit', 'Desvío derecho', 'Scambio destro'],
  'Left-hand curved point': [
    'Linke Bogenweiche',
    'Aiguillage courbe gauche',
    'Desvío curvo izquierdo',
    'Scambio curvo sinistro',
  ],
  'Right-hand curved point': [
    'Rechte Bogenweiche',
    'Aiguillage courbe droit',
    'Desvío curvo derecho',
    'Scambio curvo destro',
  ],
  'Y point': ['Y-Weiche', 'Aiguillage en Y', 'Desvío en Y', 'Scambio a Y'],
  'Left-hand express point': [
    'Linke Expressweiche',
    'Aiguillage express gauche',
    'Desvío exprés izquierdo',
    'Scambio express sinistro',
  ],
  'Right-hand express point': [
    'Rechte Expressweiche',
    'Aiguillage express droit',
    'Desvío exprés derecho',
    'Scambio express destro',
  ],
  'Left-hand diamond crossing': [
    'Linke Kreuzung',
    'Croisement gauche',
    'Cruce izquierdo',
    'Incrocio sinistro',
  ],
  'Right-hand diamond crossing': [
    'Rechte Kreuzung',
    'Croisement droit',
    'Cruce derecho',
    'Incrocio destro',
  ],
  'Straights ({count})': [
    'Geraden ({count})',
    'Droits ({count})',
    'Rectas ({count})',
    'Dritti ({count})',
  ],
  'Curves ({count})': [
    'Kurven ({count})',
    'Courbes ({count})',
    'Curvas ({count})',
    'Curve ({count})',
  ],
  'Points ({count})': [
    'Weichen ({count})',
    'Aiguillages ({count})',
    'Desvíos ({count})',
    'Scambi ({count})',
  ],
  'Misc / crossings ({count})': [
    'Sonstiges / Kreuzungen ({count})',
    'Divers / croisements ({count})',
    'Varios / cruces ({count})',
    'Varie / incroci ({count})',
  ],
  'Place {code} {name}': [
    '{code} {name} platzieren',
    'Placer {code} {name}',
    'Colocar {code} {name}',
    'Posiziona {code} {name}',
  ],
  'Owned {code}': ['Bestand {code}', 'Possédé {code}', 'Disponibles {code}', 'Posseduti {code}'],
  'Remaining {code}': ['Übrig {code}', 'Restant {code}', 'Restantes {code}', 'Rimanenti {code}'],
  '{count} pieces': ['{count} Gleise', '{count} pièces', '{count} piezas', '{count} pezzi'],
  '{count} pieces selected': [
    '{count} Gleise ausgewählt',
    '{count} pièces sélectionnées',
    '{count} piezas seleccionadas',
    '{count} pezzi selezionati',
  ],
  '{count} pieces selected / includes locked pieces': [
    '{count} Gleise ausgewählt / enthält gesperrte Gleise',
    '{count} pièces sélectionnées / inclut des pièces verrouillées',
    '{count} piezas seleccionadas / incluye piezas bloqueadas',
    '{count} pezzi selezionati / include pezzi bloccati',
  ],
  '{count} undo steps / {redo} redo steps': [
    '{count} Rückgängig-Schritte / {redo} Wiederholungsschritte',
    '{count} annulations / {redo} rétablissements',
    '{count} pasos de deshacer / {redo} de rehacer',
    '{count} annullamenti / {redo} ripristini',
  ],
  'R{radius} mm / {angle} degrees': [
    'R{radius} mm / {angle} Grad',
    'R{radius} mm / {angle} degrés',
    'R{radius} mm / {angle} grados',
    'R{radius} mm / {angle} gradi',
  ],
  'Placing {code} / {angle} degrees': [
    'Platziere {code} / {angle} Grad',
    'Placement de {code} / {angle} degrés',
    'Colocando {code} / {angle} grados',
    'Posizionamento {code} / {angle} gradi',
  ],
  'Placing {code} / {angle} degrees / reversed': [
    'Platziere {code} / {angle} Grad / gespiegelt',
    'Placement de {code} / {angle} degrés / inversé',
    'Colocando {code} / {angle} grados / invertido',
    'Posizionamento {code} / {angle} gradi / invertito',
  ],
  'Added: {codes}': [
    'Hinzugefügt: {codes}',
    'Ajouté : {codes}',
    'Añadido: {codes}',
    'Aggiunto: {codes}',
  ],
  'Removed: {codes}': [
    'Entfernt: {codes}',
    'Retiré : {codes}',
    'Eliminado: {codes}',
    'Rimosso: {codes}',
  ],
  'Moved or transformed {count} pieces': [
    '{count} Gleise verschoben oder verändert',
    '{count} pièces déplacées ou transformées',
    '{count} piezas movidas o transformadas',
    '{count} pezzi spostati o trasformati',
  ],
  'Changed layout': [
    'Gleisplan gewechselt',
    'Réseau changé',
    'Trazado cambiado',
    'Plastico cambiato',
  ],
  'Changed piece locks': [
    'Gleissperren geändert',
    'Verrouillage des pièces modifié',
    'Bloqueo de piezas cambiado',
    'Blocchi dei pezzi modificati',
  ],
  'Inventory updated': [
    'Bestand aktualisiert',
    'Inventaire mis à jour',
    'Inventario actualizado',
    'Inventario aggiornato',
  ],
  'Layout updated': [
    'Gleisplan aktualisiert',
    'Réseau mis à jour',
    'Trazado actualizado',
    'Plastico aggiornato',
  ],
  'Undid last change.': [
    'Letzte Änderung rückgängig gemacht.',
    'Dernière modification annulée.',
    'Último cambio deshecho.',
    'Ultima modifica annullata.',
  ],
  'Redid last change.': [
    'Letzte Änderung wiederholt.',
    'Dernière modification rétablie.',
    'Último cambio rehecho.',
    'Ultima modifica ripristinata.',
  ],
  'Nothing to undo.': [
    'Nichts rückgängig zu machen.',
    'Rien à annuler.',
    'Nada que deshacer.',
    'Nulla da annullare.',
  ],
  'Nothing to redo.': [
    'Nichts zu wiederholen.',
    'Rien à rétablir.',
    'Nada que rehacer.',
    'Nulla da ripristinare.',
  ],
  'Unlock the selected pieces before moving or deleting them.': [
    'Entsperre die Auswahl vor dem Verschieben oder Löschen.',
    'Déverrouillez la sélection avant de la déplacer ou de la retirer.',
    'Desbloquea la selección antes de moverla o eliminarla.',
    'Sblocca la selezione prima di spostarla o eliminarla.',
  ],
  'Track overlaps another piece or crosses it at the same level.': [
    'Das Gleis überlappt ein anderes oder kreuzt es auf gleicher Höhe.',
    'La voie chevauche une autre pièce ou la croise au même niveau.',
    'La vía se superpone a otra pieza o la cruza al mismo nivel.',
    'Il binario si sovrappone a un altro o lo incrocia allo stesso livello.',
  ],
  'Track footprint must stay inside the baseboard.': [
    'Das Gleis muss vollständig auf der Grundplatte liegen.',
    'La voie doit rester entièrement sur le plateau.',
    'La vía debe permanecer dentro del tablero.',
    'Il binario deve rimanere all’interno della base.',
  ],
  'That connector is already occupied.': [
    'Dieser Anschluss ist bereits belegt.',
    'Ce raccord est déjà occupé.',
    'Ese conector ya está ocupado.',
    'Quel connettore è già occupato.',
  ],
  'Parallel tracks need {spacing} mm between centres. Check rolling-stock clearance on curves.': [
    'Parallele Gleise benötigen {spacing} mm Mittenabstand. Prüfe den Lichtraum in Kurven.',
    'Les voies parallèles nécessitent {spacing} mm d’entraxe. Vérifiez le dégagement en courbe.',
    'Las vías paralelas necesitan {spacing} mm entre centros. Comprueba el gálibo en curvas.',
    'I binari paralleli richiedono {spacing} mm di interasse. Verifica la sagoma in curva.',
  ],
  'Enter an inventory quantity.': [
    'Gib eine Bestandszahl ein.',
    'Saisissez une quantité.',
    'Introduce una cantidad.',
    'Inserisci una quantità.',
  ],
  'Select a placed piece first.': [
    'Wähle zuerst ein platziertes Gleis.',
    'Sélectionnez d’abord une pièce placée.',
    'Selecciona primero una pieza colocada.',
    'Seleziona prima un pezzo posizionato.',
  ],
  'Position must be finite.': [
    'Die Position muss endlich sein.',
    'La position doit être finie.',
    'La posición debe ser finita.',
    'La posizione deve essere finita.',
  ],
  'The layout changed. Select the pieces again before deleting.': [
    'Der Gleisplan wurde geändert. Wähle die Gleise vor dem Löschen erneut.',
    'Le réseau a changé. Sélectionnez de nouveau les pièces avant de les retirer.',
    'El trazado cambió. Selecciona de nuevo las piezas antes de eliminarlas.',
    'Il plastico è cambiato. Seleziona nuovamente i pezzi prima di eliminarli.',
  ],
  'Invalid saved preferences. Change a setting to save valid preferences.': [
    'Ungültige Einstellungen. Ändere eine Einstellung, um gültige Werte zu speichern.',
    'Préférences invalides. Modifiez un réglage pour les enregistrer correctement.',
    'Preferencias inválidas. Cambia un ajuste para guardar valores válidos.',
    'Preferenze non valide. Modifica un’impostazione per salvarle correttamente.',
  ],
  'App is cached for offline use. Your inventory stays on this device.': [
    'App für Offline-Nutzung gespeichert. Der Bestand bleibt auf diesem Gerät.',
    'Application en cache pour un usage hors ligne. L’inventaire reste sur cet appareil.',
    'Aplicación guardada para uso sin conexión. El inventario permanece en este dispositivo.',
    'Applicazione memorizzata per uso offline. L’inventario resta su questo dispositivo.',
  ],
  'Backup imported and saved on this device.': [
    'Sicherung importiert und auf diesem Gerät gespeichert.',
    'Sauvegarde importée et enregistrée sur cet appareil.',
    'Copia importada y guardada en este dispositivo.',
    'Backup importato e salvato su questo dispositivo.',
  ],
  'Print / PDF': ['Drucken / PDF', 'Imprimer / PDF', 'Imprimir / PDF', 'Stampa / PDF'],
  'Export SVG': ['SVG exportieren', 'Exporter SVG', 'Exportar SVG', 'Esporta SVG'],
  'Export PNG': ['PNG exportieren', 'Exporter PNG', 'Exportar PNG', 'Esporta PNG'],
  'Inventory CSV': ['Bestand als CSV', 'Inventaire CSV', 'Inventario CSV', 'Inventario CSV'],
  'Shopping list CSV': [
    'Einkaufsliste als CSV',
    'Liste d’achats CSV',
    'Lista de compras CSV',
    'Lista della spesa CSV',
  ],
  'Add track or a baseboard before exporting.': [
    'Füge vor dem Export Gleise oder eine Grundplatte hinzu.',
    'Ajoutez des voies ou un plateau avant d’exporter.',
    'Añade vías o un tablero antes de exportar.',
    'Aggiungi binari o una base prima di esportare.',
  ],
  'Printed overview; not a 1:1 construction template.': [
    'Gedruckte Übersicht, keine 1:1-Bauvorlage.',
    'Vue d’ensemble imprimée, pas un gabarit de construction à l’échelle 1:1.',
    'Vista impresa; no es una plantilla de construcción a escala 1:1.',
    'Panoramica stampata; non è un modello di costruzione in scala 1:1.',
  ],
  'This OO project uses a conservative Hornby 67 mm clearance target, not a universal manufacturer standard. Mixed-brand planning is geometric only; rail code and joiner fit need physical verification.':
    [
      'Dieses OO-Projekt verwendet konservativ 67 mm nach Hornby, keinen universellen Herstellerstandard. Markenübergreifende Planung ist rein geometrisch; Schienenprofil und Verbinder müssen physisch geprüft werden.',
      'Ce projet OO utilise une cible prudente Hornby de 67 mm, pas une norme universelle. La planification multimarque est géométrique uniquement ; vérifiez physiquement le profil et les éclisses.',
      'Este proyecto OO usa un objetivo conservador Hornby de 67 mm, no una norma universal. La planificación multimarca es solo geométrica; verifica físicamente el perfil y los conectores.',
      'Questo progetto OO usa un obiettivo prudente Hornby di 67 mm, non uno standard universale. La progettazione multimarche è solo geometrica; verifica fisicamente il profilo e i giunti.',
    ],
  '{message}. Saved on this device.': [
    '{message}. Auf diesem Gerät gespeichert.',
    '{message}. Enregistré sur cet appareil.',
    '{message}. Guardado en este dispositivo.',
    '{message}. Salvato su questo dispositivo.',
  ],
  'Not saved: {detail} No changes were applied. Check browser storage permissions/space.': [
    'Nicht gespeichert: {detail} Keine Änderungen angewendet. Prüfe Speicherberechtigungen und freien Platz.',
    'Non enregistré : {detail} Aucune modification appliquée. Vérifiez les autorisations et l’espace de stockage.',
    'No guardado: {detail} No se aplicaron cambios. Comprueba permisos y espacio de almacenamiento.',
    'Non salvato: {detail} Nessuna modifica applicata. Verifica permessi e spazio di archiviazione.',
  ],
  'Import failed: {detail} Original data was not changed.': [
    'Import fehlgeschlagen: {detail} Die Originaldaten wurden nicht verändert.',
    'Échec de l’import : {detail} Les données originales n’ont pas changé.',
    'Error al importar: {detail} Los datos originales no cambiaron.',
    'Importazione fallita: {detail} I dati originali non sono cambiati.',
  ],
  'Sound playback failed: {detail}': [
    'Tonwiedergabe fehlgeschlagen: {detail}',
    'Échec de lecture du son : {detail}',
    'Error al reproducir sonido: {detail}',
    'Riproduzione audio fallita: {detail}',
  ],
  '{brand} / {name}': [
    '{brand} / {name}',
    '{brand} / {name}',
    '{brand} / {name}',
    '{brand} / {name}',
  ],
};

const languageIndex: Record<Exclude<Language, 'en'>, number> = { de: 0, fr: 1, es: 2, it: 3 };
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(messages)
  .filter(([source]) => source.includes('{'))
  .sort(([a], [b]) => b.replace(/\{\w+\}/g, '').length - a.replace(/\{\w+\}/g, '').length)
  .map(([source, values]) => {
    const keys: string[] = [];
    let pattern = '^';
    let start = 0;
    for (const match of source.matchAll(/\{(\w+)\}/g)) {
      const key = match[1];
      if (!key) throw new Error('Invalid translation parameter.');
      pattern += `${escape(source.slice(start, match.index))}(.*?)`;
      keys.push(key);
      start = match.index + match[0].length;
    }
    return { pattern: new RegExp(`${pattern}${escape(source.slice(start))}$`, 's'), keys, values };
  });

export function translate(text: string, language: Language, depth = 0): string {
  if (language === 'en' || !text.trim() || depth > 4) return text;
  const source = text.trim();
  const index = languageIndex[language];
  let translated = messages[source]?.[index];
  if (!translated) {
    for (const template of templates) {
      const match = template.pattern.exec(source);
      if (!match) continue;
      const target = template.values[index];
      if (!target) throw new Error('Missing language translation.');
      translated = target.replace(/\{(\w+)\}/g, (_, key: string) => {
        const position = template.keys.indexOf(key);
        const value = match[position + 1];
        if (position < 0 || value === undefined) throw new Error('Missing translation parameter.');
        return translate(value, language, depth + 1);
      });
      break;
    }
  }
  return translated ? text.replace(source, translated) : text;
}

const texts = new WeakMap<Node, string>();
const attributes = new WeakMap<Element, Map<string, { source: string; rendered: string }>>();
const privateText =
  '#layouts, #layout-name, #language, #app-version, #error-details, [data-user-text]';

export function translateUi(root: Element, language: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest(privateText)) continue;
    const source = texts.get(node) ?? node.textContent ?? '';
    texts.set(node, source);
    node.textContent = translate(source, language);
  }
  for (const node of [root, ...root.querySelectorAll('[aria-label], [title], [placeholder]')]) {
    const previous =
      attributes.get(node) ?? new Map<string, { source: string; rendered: string }>();
    for (const key of ['aria-label', 'title', 'placeholder']) {
      const current = node.getAttribute(key);
      if (current === null) continue;
      const record = previous.get(key);
      const source = record?.rendered === current ? record.source : current;
      const rendered = translate(source, language);
      node.setAttribute(key, rendered);
      previous.set(key, { source, rendered });
    }
    attributes.set(node, previous);
  }
}
