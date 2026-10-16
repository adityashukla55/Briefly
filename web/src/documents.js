export const GENERAL_KINDS = [
  {
    type: 'bank-statement',
    name: 'Bank statement',
    local: 'Bank statement',
    about: 'A list of the money that came into and went out of your account. It doesn’t ask you to pay anything.',
    urgency: 'low',
    objection: false,
    instalments: false,
    extendable: false,
    steps: ['Check that you know every payment. If you see one you don’t recognise, call your bank straight away.'],
    pattern: /kontoauszug|kontoübersicht|(?:current|bank|checking|savings) account statement|bank statement|relevé de (?:compte|banque)|extracto (?:de cuenta|bancario)|estratto (?:conto|di conto)|rekeningafschrift|bankafschrift|wyciąg (?:z rachunku|bankowy)|kontoutdrag|kontoudtog|extrato (?:de conta|bancário)|rekeningoverzicht/iu,
  },
  {
    type: 'payslip',
    name: 'Payslip',
    local: 'Payslip',
    about: 'Shows what your employer paid you and what was taken off for tax and insurance. It doesn’t ask you to pay anything.',
    urgency: 'low',
    objection: false,
    instalments: false,
    extendable: false,
    steps: ['Check your hours, tax class and pay. If something is wrong, ask your employer’s payroll office.', 'Keep your payslips. You may need them for your tax return, or when you apply for a flat or a loan.'],
    pattern: /verdienstabrechnung|gehaltsabrechnung|lohnabrechnung|entgeltabrechnung|lohnzettel|payslip|pay slip|pay stub|earnings statement|bulletin de (?:paie|salaire)|fiche de paie|nómina|recibo de (?:salário|vencimento)|busta paga|cedolino|loonstrook|salarisstrook|pasek (?:wypłaty|płacowy)|lönespecifikation|lønseddel|lønspecifikation/iu,
  },
];

export function generalKind(text) {
  const head = text.slice(0, 400);
  return GENERAL_KINDS.find((kind) => kind.pattern.test(head)) ?? null;
}
