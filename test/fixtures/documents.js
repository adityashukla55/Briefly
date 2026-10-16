export default [
  {
    id: 'de-tax-assessment',
    country: 'de',
    kind: 'tax assessment',
    expect: { pay: 412, deadline: '2026-11-13', action: true },
    text: `Finanzamt Chemnitz-Mitte · Postfach 1234 · 09111 Chemnitz
Herrn
Max Beispiel
Musterstraße 4
09111 Chemnitz
Steuernummer: 214/123/45678
Datum: 09.10.2026
Bescheid für 2025 über Einkommensteuer
Festgesetzt werden: Einkommensteuer 3.812,00 €
Abzüglich bereits gezahlt: 3.400,00 €
Verbleibende Beträge: 412,00 €
Bitte zahlen Sie den Betrag von 412,00 € spätestens bis zum 13.11.2026 auf das unten genannte Konto.
IBAN: DE89 3704 0044 0532 0130 00
Rechtsbehelfsbelehrung: Gegen diesen Bescheid ist der Einspruch zulässig. Er ist innerhalb eines Monats nach Bekanntgabe einzulegen.`,
  },
  {
    id: 'de-tax-refund',
    country: 'de',
    kind: 'tax assessment',
    expect: { pay: null, deadline: null, action: false },
    text: `Finanzamt Köln-Altstadt
Frau
Lena Muster
Ringstraße 8
50667 Köln
Datum: 06.10.2026
Bescheid für 2025 über Einkommensteuer
Festgesetzt werden: 2.140,00 €
Bereits gezahlt: 2.996,00 €
Erstattung: 856,00 €
Der Erstattungsbetrag wird auf Ihr Konto DE12 3704 0044 0532 0130 99 überwiesen.
Rechtsbehelfsbelehrung: Der Einspruch ist innerhalb eines Monats nach Bekanntgabe einzulegen.`,
  },
  {
    id: 'de-bank-statement',
    country: 'de',
    kind: 'bank statement',
    expect: { pay: null, deadline: null, action: false },
    text: `Sparkasse Musterstadt
Kontoauszug Nr. 9/2026 vom 30.09.2026
Herrn Max Mustermann
IBAN: DE89 3704 0044 0532 0130 00
Datum       Buchungstext                         Betrag in EUR
01.09.2026  Gehalt Muster GmbH                  +2.450,00
03.09.2026  Miete September                       -820,00
05.09.2026  Lastschrift Telekom                    -39,99
10.09.2026  Kontoführungsgebühr                     -5,90
15.09.2026  Kartenzahlung REWE                     -58,00
Alter Kontostand vom 31.08.2026                   1.204,50 EUR
Neuer Kontostand vom 30.09.2026                   2.730,61 EUR`,
  },
  {
    id: 'de-payslip',
    country: 'de',
    kind: 'payslip',
    expect: { pay: null, deadline: null, action: false },
    text: `Muster GmbH · Lohnbüro
Verdienstabrechnung September 2026
Personalnummer 00412
Herr Max Mustermann
Steuerklasse 1
Gehalt                                 3.200,00 €
Lohnsteuer                              -412,25 €
Solidaritätszuschlag                       0,00 €
Krankenversicherung                     -268,80 €
Rentenversicherung                      -297,60 €
Arbeitslosenversicherung                 -41,60 €
Pflegeversicherung                       -54,40 €
Nettoverdienst                         2.125,35 €
Auszahlungsbetrag                      2.125,35 €
Überweisung am 30.09.2026 auf DE89 3704 0044 0532 0130 00`,
  },
  {
    id: 'de-reminder',
    country: 'de',
    kind: 'payment reminder',
    expect: { pay: 94.97, deadline: '2026-10-25', action: true },
    text: `Telekom Deutschland GmbH
Herrn
Max Mustermann
Hauptstraße 12
10115 Berlin
Kundennummer: 123456789
Datum: 12.10.2026
Zahlungserinnerung – 1. Mahnung
Sehr geehrter Herr Mustermann,
leider konnten wir für Ihre Rechnung vom 02.09.2026 noch keinen Zahlungseingang feststellen.
Offener Rechnungsbetrag: 89,97 €
Mahngebühr: 5,00 €
Gesamtbetrag: 94,97 €
Bitte überweisen Sie den Gesamtbetrag bis zum 25.10.2026.
Mit freundlichen Grüßen
Ihre Telekom`,
  },
  {
    id: 'de-electricity-direct-debit',
    country: 'de',
    kind: 'bill paid by direct debit',
    expect: { pay: null, deadline: null, action: false },
    text: `Stadtwerke Musterstadt GmbH
Frau Erika Muster
Lindenweg 3
12345 Musterstadt
Vertragskonto 400123987
Rechnung Strom Oktober 2026
Rechnungsdatum: 08.10.2026
Verbrauch 210 kWh
Rechnungsbetrag: 123,45 €
Der Rechnungsbetrag wird am 01.11.2026 per SEPA-Lastschrift von Ihrem Konto DE12 5001 0517 0648 4898 90 abgebucht. Sie müssen nichts tun.`,
  },
  {
    id: 'de-jobcenter-appointment',
    country: 'de',
    kind: 'appointment',
    expect: { pay: null, deadline: '2026-10-28', action: true },
    text: `Jobcenter Leipzig
Frau Erika Muster
Beispielweg 7
04109 Leipzig
BG-Nummer: 05301//0012345
Datum: 07.10.2026
Einladung
Sehr geehrte Frau Muster,
bitte kommen Sie am 28.10.2026 um 09:30 Uhr in das Jobcenter Leipzig, Raum 214, zu einem Gespräch über Ihre berufliche Situation.
Bringen Sie bitte Ihren Personalausweis und Ihren Lebenslauf mit.
Wenn Sie ohne wichtigen Grund nicht kommen, kann Ihr Bürgergeld gemindert werden.`,
  },
  {
    id: 'de-rent-increase',
    country: 'de',
    kind: 'rent increase',
    expect: { pay: null, deadline: '2026-12-31', action: true },
    text: `Hausverwaltung Schmidt & Partner
Herrn Max Mustermann
Hauptstraße 12
10115 Berlin
Datum: 01.10.2026
Mieterhöhung nach § 558 BGB
Sehr geehrter Herr Mustermann,
wir bitten Sie, einer Erhöhung der Nettokaltmiete von 820,00 € auf 865,00 € monatlich ab dem 01.01.2027 zuzustimmen.
Bitte senden Sie uns Ihre Zustimmung bis zum 31.12.2026 zurück.
Mit freundlichen Grüßen
Hausverwaltung Schmidt & Partner`,
  },
  {
    id: 'de-insurance-info',
    country: 'de',
    kind: 'insurance information',
    expect: { pay: null, deadline: null, action: false },
    text: `Muster Versicherung AG
Frau Erika Muster
Lindenweg 3
12345 Musterstadt
Versicherungsnummer: HV-2231-998
Datum: 05.10.2026
Ihre Hausratversicherung: Beitrag ab 2027
Sehr geehrte Frau Muster,
ab dem 01.01.2027 beträgt Ihr Beitrag 32,40 € im Monat statt bisher 30,10 €. Wir buchen den Beitrag wie gewohnt von Ihrem Konto ab.
Sie müssen nichts tun.`,
  },
  {
    id: 'de-parking-fine',
    country: 'de',
    kind: 'fine',
    expect: { pay: 35, deadline: '2026-10-23', action: true },
    text: `Stadt Musterstadt · Ordnungsamt
Herrn
Max Mustermann
Hauptstraße 12
10115 Berlin
Aktenzeichen: 2026-778812
Datum: 09.10.2026
Verwarnung mit Verwarnungsgeld
Ihnen wird vorgeworfen, am 02.10.2026 um 14:12 Uhr in der Bahnhofstraße im Halteverbot geparkt zu haben.
Verwarnungsgeld: 35,00 €
Bitte zahlen Sie das Verwarnungsgeld bis zum 23.10.2026 unter Angabe des Aktenzeichens.`,
  },
  {
    id: 'de-job-contract',
    country: 'de',
    kind: 'job contract',
    expect: { pay: null, deadline: '2026-10-25', action: true },
    text: `Muster GmbH · Personalabteilung
Herrn Max Mustermann
Hauptstraße 12
10115 Berlin
Datum: 10.10.2026
Ihr Arbeitsvertrag
Sehr geehrter Herr Mustermann,
wir freuen uns, Ihnen die Stelle als Lagerist ab dem 01.12.2026 anzubieten. Das Bruttogehalt beträgt 2.900,00 € im Monat.
Bitte unterschreiben Sie beide Exemplare des Vertrags und senden Sie eines bis zum 25.10.2026 an uns zurück.
Mit freundlichen Grüßen
Muster GmbH`,
  },
  {
    id: 'en-hmrc-pay',
    country: 'uk',
    kind: 'tax bill',
    expect: { pay: 320, deadline: '2027-01-31', action: true },
    text: `HM Revenue & Customs
Mr John Smith
12 Sample Road
Leeds
LS1 4AB
Unique Taxpayer Reference: 1234567890
Date: 8 October 2026
Self Assessment: you owe £320.00
We have worked out that you owe £320.00 for the 2025 to 2026 tax year.
Pay by 31 January 2027 to avoid interest and penalties.
Use your Unique Taxpayer Reference as the payment reference.`,
  },
  {
    id: 'en-irs-refund',
    country: 'us',
    kind: 'tax refund',
    expect: { pay: null, deadline: null, action: false },
    text: `Department of the Treasury
Internal Revenue Service
Notice CP12
Date: October 5, 2026
Taxpayer ID number: XXX-XX-1234
Jane Doe
45 Example St
Springfield, IL 62701
We changed your 2025 Form 1040 to correct a calculation error.
As a result, you are due a refund of $1,250.00.
If you agree with the changes, you don't need to do anything. You should receive your refund in 4 to 6 weeks.`,
  },
  {
    id: 'en-bank-statement',
    country: 'uk',
    kind: 'bank statement',
    expect: { pay: null, deadline: null, action: false },
    text: `Example Bank plc
Current account statement
Mr John Smith
Sort code 12-34-56  Account 12345678
Statement period 1 September 2026 to 30 September 2026
Date      Description                    Paid out   Paid in    Balance
01 Sep    Opening balance                                       1,040.12
02 Sep    Salary EXAMPLE LTD                        2,100.00   3,140.12
04 Sep    Card payment TESCO             58.00                 3,082.12
10 Sep    Direct debit COUNCIL TAX       184.20                2,897.92
30 Sep    Closing balance                                       2,897.92`,
  },
  {
    id: 'en-school-trip',
    country: 'uk',
    kind: 'school letter',
    expect: { pay: 15, deadline: '2026-10-30', action: true },
    text: `Sample Primary School
Dear Parent or Carer,
Year 4 will visit the Science Museum on Friday 13 November 2026.
The trip costs £15.00 per child. Please pay on ParentPay and return the signed consent form to the school office by 30 October 2026.
Children should bring a packed lunch.
Kind regards,
Mrs A. Teacher`,
  },
  {
    id: 'en-energy-credit',
    country: 'uk',
    kind: 'energy statement',
    expect: { pay: null, deadline: null, action: false },
    text: `Example Energy
Mr John Smith
Account number: 7788990011
Your energy statement, 1 July 2026 to 30 September 2026
Electricity used: 612 kWh, £168.40
Payments received: £224.60
Your account is in credit by £56.20.
You don't need to pay anything. Your monthly Direct Debit stays at £74.00.`,
  },
  {
    id: 'fr-caf-repayment',
    country: 'fr',
    kind: 'repayment demand',
    expect: { pay: 240, deadline: '2026-11-15', action: true },
    text: `Caisse d'allocations familiales de Paris
Madame Claire Dubois
12 rue de la Paix
75002 Paris
Numéro allocataire : 1234567
Le 07/10/2026
Objet : indu d'aide au logement
Madame,
Après examen de votre dossier, vous avez perçu à tort 240,00 € d'aide au logement.
Merci de rembourser cette somme avant le 15/11/2026.
Vous pouvez contester cette décision dans un délai de deux mois.`,
  },
  {
    id: 'fr-edf-direct-debit',
    country: 'fr',
    kind: 'bill paid by direct debit',
    expect: { pay: null, deadline: null, action: false },
    text: `EDF
Monsieur Jean Martin
8 avenue Victor Hugo
69003 Lyon
Référence client : 6001234567
Facture du 06/10/2026
Montant TTC : 78,90 €
Ce montant sera prélevé le 05/11/2026 sur votre compte bancaire.
Vous n'avez aucune démarche à faire.`,
  },
  {
    id: 'es-hacienda-pay',
    country: 'es',
    kind: 'tax payment demand',
    expect: { pay: 156.3, deadline: '2026-11-20', action: true },
    text: `Agencia Tributaria
Don Carlos García López
Calle Mayor 10, 2º B
28013 Madrid
NIF: 12345678Z
Fecha: 08/10/2026
Liquidación provisional – IRPF 2025
Importe a ingresar: 156,30 euros
Plazo de ingreso: hasta el 20/11/2026.
Puede presentar recurso de reposición en el plazo de un mes.`,
  },
  {
    id: 'it-fine',
    country: 'it',
    kind: 'fine',
    expect: { pay: 87, deadline: '2026-12-08', action: true },
    text: `Comune di Milano – Polizia Locale
Sig. Marco Rossi
Via Roma 5
20121 Milano
Verbale n. 2026/0045512
Data: 06/10/2026
Violazione dell'art. 7 del Codice della Strada: sosta vietata.
Importo da pagare: 87,00 euro entro 60 giorni dalla notifica.
Se paga entro 5 giorni dalla notifica, l'importo è ridotto del 30%.`,
  },
  {
    id: 'nl-tax-bill',
    country: 'nl',
    kind: 'tax bill',
    expect: { pay: 310, deadline: '2026-11-30', action: true },
    text: `Belastingdienst
De heer J. de Vries
Kerkstraat 21
1017 GC Amsterdam
Aanslagnummer: 1234.56.789.H.66
Datum: 09-10-2026
Aanslag inkomstenbelasting 2025
U moet € 310 betalen. Betaal dit bedrag vóór 30 november 2026.
Bent u het niet eens met deze aanslag? Dan kunt u binnen 6 weken bezwaar maken.`,
  },
  {
    id: 'pl-payment-demand',
    country: 'pl',
    kind: 'payment demand',
    expect: { pay: 450, deadline: '2026-11-10', action: true },
    text: `Naczelnik Urzędu Skarbowego Warszawa-Mokotów
Pan Jan Kowalski
ul. Lipowa 5 m. 12
00-123 Warszawa
Warszawa, dnia 08.10.2026 r.
Wezwanie do zapłaty
Wzywam do zapłaty zaległości podatkowej w kwocie 450,00 zł w terminie do 10.11.2026.
Wpłaty należy dokonać na rachunek urzędu podany poniżej.`,
  },
];
