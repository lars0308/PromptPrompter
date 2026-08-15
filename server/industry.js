// Eine Branche, eine Wahrheit.
//
// Die Einordnung lag vorher als kurze Kette aus fünf Regexen in preview-image.js und galt nur
// für das Vorschaubild. Zwei Probleme: die Konzepte und der freie Prompt wussten nichts davon,
// und ein Auftragssatz wie "bau mir eine Website für einen Kosmetikladen" traf über `bau` das
// Handwerk - der Bildauftrag verlangte daraufhin Werkzeug in einem Kosmetikstudio.
//
// Deshalb hier: die Anweisungsverben werden entfernt, bevor überhaupt gesucht wird, jede Branche
// bringt ihre eigenen Merkmale mit, und spezielle Muster gehen vor allgemeinen. Was eine Branche
// mitbringt, ist bewusst mehr als ein Stichwort - `subject` steuert das Bild, `sections` die
// Seitenstruktur, `tone` die Ansprache. Damit unterscheiden sich zwei Aufträge aus verschiedenen
// Branchen im Ergebnis wirklich, statt nur in der Überschrift.

// Fast jeder Auftrag beginnt mit einer Anweisung an uns ("bau mir eine Website für ..."). Diese
// Verben gehören nicht zum Gewerbe des Kunden und dürfen die Einordnung nicht bestimmen.
const BRIEF_VERBS=/\b(bau(e|en)?|erstell(e|en)?|mach(e|en)?|entwickl(e|er|n)?|gestalt(e|en)?|programmier(e|en)?|design(e|en)?|brauche|benötige|möchte|will|hätte gern|wünsche)\b\s*(mir|uns|bitte)?\s*(eine|einen|ein|die|der|das)?\s*(neue|moderne|schöne|einfache|professionelle)?\s*(website|webseite|internetseite|homepage|seite|landingpage|shop|onlineshop)?/gi;

// Reihenfolge ist Absicht: das Speziellere steht vorn. "Zahnarztpraxis" ist eine Praxis und kein
// allgemeiner Handel, "Fotostudio" kein Kosmetikstudio.
const INDUSTRIES=[
  {key:'gastronomie',label:'Gastronomie',
   match:/restaurant|café|cafe\b|kaffee|döner|doener|pizza|pizzeria|bistro|imbiss|gastro|küche|kueche|bäcker|baecker|konditor|metzger|fleischer|catering|foodtruck|eisdiele|bar\b|kneipe|brauerei|weinhandl/,
   subject:'real food, ingredients, kitchen or dining atmosphere',
   sections:'Speisen/Karte, Öffnungszeiten, Anfahrt und Parken, Reservierung oder Bestellung, Bilder vom Ort',
   tone:'appetitlich und konkret, keine Werbefloskeln'},
  {key:'beauty',label:'Beauty & Kosmetik',
   match:/friseur|frisör|barber|beauty|kosmetik|nagel|nail|salon|spa\b|wellness|massage|waxing|permanent make|wimpern|visagist/,
   subject:'a credible beauty, salon or treatment environment',
   sections:'Behandlungen mit Preisen, Terminbuchung, Team, Vorher/Nachher oder Raumbilder, Anfahrt',
   tone:'ruhig, hochwertig, vertrauensbildend'},
  {key:'gesundheit',label:'Gesundheit & Praxis',
   match:/arzt|ärzt|aerzt|praxis|zahnarzt|kieferorthop|physio|therapie|therapeut|heilprakt|osteopath|logopäd|psycholog|apotheke|pflege|hebamme|klinik|sanitätshaus/,
   subject:'a calm, clean practice or treatment room, real people at work',
   sections:'Leistungen, Sprechzeiten, Team mit Qualifikation, Terminvergabe, Kassen/Privat, Anfahrt',
   tone:'sachlich, beruhigend, ohne Heilversprechen'},
  {key:'handwerk',label:'Handwerk',
   match:/handwerk|elektr|hausmeister|maler|lackier|sanitär|sanitaer|heizung|klempner|tischler|schreiner|zimmerei|dachdeck|fliesenleg|maurer|stuckateur|gerüstbau|schlosser|metallbau|glaser|reparatur|montage/,
   subject:'real hands-on trade work, tools, materials and work in progress',
   sections:'Leistungen, Einsatzgebiet, Referenzprojekte mit echten Bildern, Notdienst, direkte Rufnummer, Kontaktformular',
   tone:'bodenständig, konkret, verlässlich'},
  {key:'bau',label:'Bau & Ausbau',
   match:/bauunternehm|baufirma|baustelle|hochbau|tiefbau|rohbau|abbruch|sanierung|bauträger|architekt|statik|vermessung|geruestbau/,
   subject:'real construction work, site, materials and finished buildings',
   sections:'Leistungen, Referenzobjekte, Ablauf eines Projekts, Team, Anfrage mit Projektdaten',
   tone:'solide, erfahren, ohne Übertreibung'},
  {key:'garten',label:'Garten & Landschaft',
   match:/garten|landschaftsbau|galabau|baumpflege|forst|gärtner|gaertner|floristik|blumen/,
   subject:'real outdoor work, plants, gardens and finished grounds',
   sections:'Leistungen, Referenzgärten nach Jahreszeit, Pflege­angebote, Einsatzgebiet, Anfrage',
   tone:'natürlich, saisonal, handfest'},
  {key:'kfz',label:'Kfz & Mobilität',
   match:/autohaus|autowerkstatt|kfz|werkstatt|reifen|lackierer|abschlepp|fahrschule|motorrad|karosserie|autoglas/,
   subject:'a real workshop, vehicles and technicians at work',
   sections:'Leistungen, Termin, Preise oder Kostenvoranschlag, Marken/Spezialisierung, Anfahrt',
   tone:'technisch klar, preistransparent'},
  {key:'fitness',label:'Sport & Fitness',
   match:/fitness|gym\b|crossfit|yoga|pilates|kampfsport|tanzschul|schwimm|verein|sportstudio|personal train/,
   subject:'training, gym space or athletic energy with real people',
   sections:'Kurse und Zeitplan, Mitgliedschaften mit Preisen, Trainer, Probetraining, Räume',
   tone:'motivierend, aber ohne Marktschreierei'},
  {key:'hotel',label:'Hotel & Tourismus',
   match:/hotel|pension|ferienwohnung|fewo|gästehaus|campingplatz|reisebüro|tourismus|herberge|apartments?\b/,
   subject:'real rooms, the house and its surroundings',
   sections:'Zimmer und Preise, Verfügbarkeit/Buchung, Ausstattung, Umgebung, Anreise',
   tone:'einladend, ehrlich, konkret'},
  {key:'handel',label:'Handel & Shop',
   match:/onlineshop|online-shop|e-?commerce|shop\b|laden|einzelhandel|boutique|warenkorb|verkauf von|hofladen|sortiment/,
   subject:'the real products and the place they are sold',
   sections:'Sortiment/Kategorien, Produktdetails, Versand und Zahlung, Widerruf, Kontakt',
   tone:'produktnah, klar, ohne Kaufdruck'},
  {key:'immobilien',label:'Immobilien',
   match:/immobilien|makler|hausverwaltung|wohnungsbau|vermietung von wohn/,
   subject:'real buildings, interiors and locations',
   sections:'Objekte mit Eckdaten, Suchauftrag, Bewertung, Ablauf, Team, Kontakt',
   tone:'seriös, faktenorientiert'},
  {key:'beratung',label:'Recht, Steuern & Beratung',
   match:/anwalt|anwält|kanzlei|rechtsberat|steuerberat|steuerbüro|notar|wirtschaftsprüf|unternehmensberat|consulting|coach|mediation/,
   subject:'a professional office environment, documents and people in conversation',
   sections:'Fachgebiete, Team mit Qualifikation, Ablauf einer Mandatierung, Erstberatung, Kontakt',
   tone:'seriös, präzise, zurückhaltend'},
  {key:'finanzen',label:'Finanzen & Versicherung',
   match:/versicherung|finanzberat|bank\b|kredit|vorsorge|makler für versicher|bausparen/,
   subject:'a professional advisory setting, real people in conversation',
   sections:'Leistungen, Beratungsablauf, Vergleich oder Rechner, Team, Termin',
   tone:'vertrauenswürdig, ohne Versprechen'},
  {key:'bildung',label:'Bildung & Kurse',
   match:/schule|nachhilfe|kita|kindergarten|bildung|akademie|weiterbildung|seminar|kurse|musikschul|sprachschul|volkshochschul/,
   subject:'real learning situations, rooms and people',
   sections:'Angebot und Kurse, Termine, Preise, Anmeldung, Team, Räume',
   tone:'freundlich, klar, für Eltern und Teilnehmende verständlich'},
  {key:'industrie',label:'Industrie & Produktion',
   match:/industrie|produktion|fertigung|maschinenbau|zuliefer|werkstoff|anlagenbau|logistik|spedition|transport|großhandel|grosshandel|lager/,
   subject:'real production, machines, plant floor or logistics',
   sections:'Leistungen und Verfahren, Anlagen und Kapazitäten, Branchen und Referenzen, Qualität/Zertifikate, Kontakt für Anfragen',
   tone:'technisch, belegbar, B2B-nüchtern'},
  {key:'energie',label:'Energie & Gebäudetechnik',
   match:/solar|photovoltaik|wärmepumpe|waermepumpe|energieberat|klimatechnik|lüftung|smart home|stromanbieter/,
   subject:'real installations on buildings and technical equipment',
   sections:'Leistungen, Ablauf von Beratung bis Montage, Förderung, Referenzanlagen, Anfrage',
   tone:'erklärend, rechenbar, ohne Panikmache'},
  {key:'kreativ',label:'Agentur & Kreativ',
   match:/agentur|werbeagentur|marketing|grafikdesign|webdesign|texter|branding|pr-\b|social media agentur/,
   subject:'the work itself - real projects and results',
   sections:'Leistungen, Arbeiten/Cases, Arbeitsweise, Team, Anfrage',
   tone:'selbstbewusst, aber belegt statt behauptet'},
  {key:'medien',label:'Foto, Film & Musik',
   match:/fotograf|fotostudio|videograf|filmproduktion|tonstudio|musiker|band\b|dj\b|veranstaltung|event|hochzeitsfotograf/,
   subject:'the portfolio itself - real photographs or stills',
   sections:'Portfolio nach Bereichen, Pakete und Preise, Ablauf, Über mich, Anfrage',
   tone:'zurückhaltend - die Arbeiten tragen die Seite'},
  {key:'tiere',label:'Tiere',
   match:/tierarzt|tierärzt|tierheim|hundeschule|tierpension|zoofachhandel|tierbedarf|hufschmied|pferde/,
   subject:'real animals and the people caring for them',
   sections:'Leistungen, Sprechzeiten oder Kurse, Notfall, Team, Anfahrt',
   tone:'warm, verantwortungsvoll'},
  {key:'reinigung',label:'Reinigung & Service',
   match:/gebäudereinigung|reinigung|putzservice|entrümpel|umzug|entsorgung|winterdienst|sicherheitsdienst|wachdienst/,
   subject:'real service work in buildings or outdoors',
   sections:'Leistungen, Einsatzgebiet, Preisrahmen, Referenzen, Anfrage',
   tone:'zuverlässig, direkt'},
  {key:'software',label:'Software & Digitalprodukt',
   match:/web-?app|software|saas|dashboard|plattform|portal|app-?entwicklung|it-?dienstleist|hosting|cloud/,
   subject:'the digital product interface and its real workflow',
   sections:'Funktionen, Anwendungsfälle, Preise/Pläne, Integration, Sicherheit, Zugang oder Demo',
   tone:'präzise, funktionsorientiert'},
  {key:'verein',label:'Verein & Gemeinnützig',
   match:/verein\b|e\.v\.|gemeinnütz|stiftung|ehrenamt|kirchengemeinde|feuerwehr|hilfsorganisation/,
   subject:'real members and activities of the organisation',
   sections:'Über uns, Aktivitäten und Termine, Mitglied werden, Spenden, Vorstand, Kontakt',
   tone:'nahbar, gemeinschaftlich'}
];

const FALLBACK={key:'allgemein',label:'Allgemein',
  subject:'the exact real subject matter described by the project brief',
  sections:'Startseite mit klarem Angebot, Leistungen, Über uns, Kontakt, rechtliche Pflichtseiten',
  tone:'klar und konkret, ohne austauschbare Floskeln'};

// Der Rohtext des Auftrags, gesäubert um die Anweisungsverben.
function normalize(parts){
  return String(parts||'').toLowerCase().replace(BRIEF_VERBS,' ').replace(/\s+/g,' ').trim();
}

// Nimmt die Textbausteine eines Projekts und gibt genau eine Branche zurück.
function detectIndustry(...parts){
  const text=normalize(parts.filter(Boolean).join(' '));
  if(!text)return FALLBACK;
  for(const industry of INDUSTRIES)if(industry.match.test(text))return industry;
  return FALLBACK;
}

// Für den Prompt: eine kurze, verwertbare Beschreibung der Branche.
function industryBlock(industry){
  const item=industry||FALLBACK;
  if(item.key==='allgemein')return '';
  return `Branche: ${item.label}\nTypische Pflichtbereiche dieser Branche: ${item.sections}\nTonalität: ${item.tone}`;
}

module.exports={detectIndustry,industryBlock,INDUSTRIES,FALLBACK,BRIEF_VERBS};
