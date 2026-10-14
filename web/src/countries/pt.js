import { addDays, formatLocalDate, fromIso } from '../dates.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function nextWorkday(iso) {
  let date = iso;
  while ([0, 6].includes(fromIso(date).getUTCDay())) date = addDays(date, 1);
  return date;
}

const portugueseDate = (iso) => formatLocalDate(iso, '/', 'dmy');

function longDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} de ${MESES[month - 1]} de ${year}`;
}

function letterOf(result) {
  return result.letterDate ? `de ${portugueseDate(result.letterDate)}` : 'de [DD/MM/AAAA]';
}

function amountOf(result) {
  const money = result.money?.toPay;
  return money ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: money.currency ?? 'EUR' }).format(money.amount) : '[montante]';
}

export default {
  id: 'pt',
  slug: 'portugal',
  name: 'Portugal',
  adjective: 'Portuguese',
  flag: '🇵🇹',
  language: 'pt',
  locale: 'pt-PT',
  currency: 'EUR',
  decimal: ',',
  thousands: '. ',
  dateSeparator: '/',
  dateOrder: 'dmy',
  ibanLength: 25,
  intro: 'In Portugal, many letters from the tax office and social security also arrive in your online account (Portal das Finanças, Segurança Social Direta) or in the ViaCTT electronic mailbox. Deadlines are often counted in working days (dias úteis), so read them carefully.',
  signals: [
    /\bPortugal\b/i,
    /\.pt\b/i,
    /\bPT50\s?\d{4}/,
    /\b\d{4}-\d{3}\s+\p{Lu}/u,
    /Autoridade Tribut[aá]ria|Portal das Finan[cç]as|\bAT\b/,
    /Seguran[cç]a Social/i,
    /\bNIF\b|\bNISS\b/,
    /\bAIMA\b|\bSEF\b/,
    /\bIEFP\b/,
    /C[aâ]mara Municipal|Junta de Freguesia/i,
    /\bMultibanco\b|\bEntidade\s*:?\s*\d{5}\b/i,
    /\bIMI\b|\bIUC\b|\bIRS\b/,
    /\bANSR\b|\bPSP\b|\bGNR\b/,
  ],
  deliveryDays: 3,
  deliveryNote: 'In Portugal, a letter sent by registered post is usually treated as received on the third day after it was posted. Check if the deadline is in working days (dias úteis) or in calendar days.',
  objectionAdvice: 'Use this if you think the decision is wrong. Many offices let you object online (for example in the Portal das Finanças or Segurança Social Direta). Send it before the deadline and keep proof — for example a registered letter (carta registada).',
  objectionDefault: 'reclamação',
  deadlineWords: ['prazo', 'até', 'data limite'],
  objection: [
    { word: 'reclamação graciosa', pattern: /reclamação graciosa/i },
    { word: 'audiência prévia', pattern: /audiência prévia|direito de audição/i },
    { word: 'defesa', pattern: /apresentar (?:a sua )?defesa|\bdefesa\b/i },
    { word: 'oposição', pattern: /\boposição\b/i },
    { word: 'impugnação', pattern: /impugnação/i },
    { word: 'recurso', pattern: /\brecurso\b/i },
    { word: 'reclamação', pattern: /reclamação/i },
  ],
  help: {
    debt: 'the debt help office of DECO (Gabinete de Proteção Financeira) or your local social services (ação social)',
    tenant: 'a tenants’ association (associação de inquilinos) or a lawyer through legal aid (apoio judiciário)',
    instalments: 'pagamento em prestações',
    general: 'the free Loja do Cidadão / Espaço Cidadão help desks, a migrant support centre (CLAIM), or legal aid (apoio judiciário) through Segurança Social',
  },
  localAccount(text) {
    const entity = text.match(/\bentidade\s*:?\s*(\d{5})\b/i);
    const reference = text.match(/\brefer[eê]ncia(?: multibanco)?\s*:?\s*(\d{3}\s?\d{3}\s?\d{3})\b/i);
    if (!entity || !reference) return null;
    const ref = reference[1].replace(/\s/g, '').replace(/(\d{3})(?=\d)/g, '$1 ');
    return { text: `Multibanco, entity ${entity[1]}, reference ${ref}`, rows: [['Multibanco entity (Entidade)', entity[1]], ['Reference (Referência)', ref]] };
  },
  senders: [
    {
      id: 'at',
      slug: 'financas-autoridade-tributaria',
      name: 'Tax office',
      local: 'Finanças / Autoridade Tributária e Aduaneira (AT)',
      about: 'The tax office. It handles income tax (IRS), property tax (IMI), car tax (IUC), VAT and tax debts.',
      patterns: [/Autoridade Tribut[aá]ria/i, /\bAT\b/, /Portal das Finan[cç]as/i, /servi[cç]o de finan[cç]as/i, /\bIRS\b/, /\bIMI\b/, /\bIUC\b/, /nota de (?:liquidação|cobrança)/i, /demonstração de liquidação/i, /execução fiscal/i, /documento único de cobrança|\bDUC\b/i],
      letters: ['Nota de liquidação / demonstração de liquidação — the result of your income tax: a refund or tax to pay', 'Nota de cobrança — a bill for IMI, IUC or other tax, with a payment reference', 'Citação em execução fiscal — unpaid tax is now being collected by force', 'Coima — a fine, often for a late tax return'],
      tips: ['Check every letter in the Portal das Finanças. Many messages only arrive in your online mailbox (caixa postal eletrónica).', 'If you can’t pay at once, you can often ask to pay in instalments (pagamento em prestações) online.'],
    },
    {
      id: 'ss',
      slug: 'seguranca-social',
      name: 'Social security',
      local: 'Segurança Social',
      about: 'Social security. It pays benefits such as unemployment, sickness and child benefit, and collects contributions.',
      patterns: [/Seguran[cç]a Social/i, /Instituto da Seguran[cç]a Social|\bISS\b/i, /Segurança Social Direta/i, /\bNISS\b/, /subsídio de (?:desemprego|doença|parentalidade)/i, /abono de família/i, /rendimento social de inserção|\bRSI\b/i, /contribuições/i, /secção de processo executivo/i],
      letters: ['Decisão — your benefit was approved, refused or changed', 'Audiência prévia — they plan a decision and you can give your side first', 'Restituição de prestações — benefits paid too much that you must give back', 'Dívida de contribuições — unpaid contributions, for example as self-employed'],
      tips: ['When you get an audiência prévia letter, answer within the deadline (often 10 working days) — it can change the final decision.', 'Keep your details up to date in Segurança Social Direta.'],
    },
    {
      id: 'iefp',
      slug: 'iefp',
      name: 'Job centre',
      local: 'IEFP (Instituto do Emprego e Formação Profissional)',
      about: 'The public employment service. It helps you find work and checks the job search of people who get unemployment benefits.',
      patterns: [/\bIEFP\b/, /Instituto do Emprego/i, /centro de emprego/i, /convocatória/i, /plano pessoal de emprego/i, /procura ativa de emprego/i],
      letters: ['Convocatória — an appointment at the job centre or a training session', 'Oferta de emprego — a job offer you must answer', 'Anulação da inscrição — your registration was cancelled, for example after a missed appointment'],
      tips: ['Go to every appointment. If you can’t, send a justification quickly (often within 5 working days) — otherwise you can lose your unemployment benefit.'],
    },
    {
      id: 'aima',
      slug: 'aima',
      name: 'Immigration agency',
      local: 'AIMA (Agência para a Integração, Migrações e Asilo)',
      about: 'The immigration agency (it replaced SEF in 2023). It decides on residence permits and their renewal.',
      patterns: [/\bAIMA\b/, /Agência para a Integração/i, /\bSEF\b/, /autorização de residência/i, /título de residência/i, /manifestação de interesse/i, /agendamento/i, /abandono voluntário/i],
      letters: ['Agendamento — an appointment to give your documents and biometrics', 'Decisão — your residence permit was granted or refused', 'Notificação para abandono voluntário — you must leave Portugal by a set date'],
      tips: ['Keep proof of every application and appointment. Many people wait a long time — your documents may stay valid while you wait.', 'If you get a refusal, contact a lawyer or a migrant support centre (CLAIM) quickly — deadlines are short.'],
    },
    {
      id: 'camara',
      slug: 'camara-municipal',
      name: 'Town hall',
      local: 'Câmara Municipal / Junta de Freguesia',
      about: 'Your town hall (câmara) and parish office (junta de freguesia). They handle local fees, licences, parking and certificates of residence.',
      patterns: [/C[aâ]mara Municipal/i, /Junta de Freguesia/i, /\bmunicípio\b/i, /atestado de residência/i, /\bEMEL\b/, /taxa municipal/i, /estacionamento/i],
      letters: ['Taxa / licença — a local fee or licence', 'Auto de contraordenação (estacionamento) — a parking fine', 'Notificação — a decision or request from the town hall'],
      tips: ['For parking fines from companies like EMEL, check the deadline to pay or defend yourself on the notice.'],
    },
    {
      id: 'court',
      slug: 'tribunal',
      name: 'Court',
      local: 'Tribunal',
      about: 'A court. Court papers (citação, notificação) are always important — never ignore them.',
      patterns: [/\btribunal\b/i, /\bcitação\b/i, /\bcitado\b/i, /\bprocesso n\.?º/i, /\bjuízo\b/i, /contestação/i, /\bréu\b|\bautor\b/i, /injunção|Balcão Nacional de Injunções|\bBNI\b/i, /sentença/i],
      letters: ['Citação — someone started a court case against you; you have a deadline to answer', 'Injunção — a quick court order for a debt; you have 15 days to pay or oppose', 'Notificação de audiência — a hearing date', 'Sentença — the court’s decision'],
      tips: ['Deadlines are strict. If you don’t answer an injunção within 15 days, the creditor can enforce it.', 'If your income is low, ask Segurança Social for legal aid (apoio judiciário) — it can pay for a lawyer.'],
    },
    {
      id: 'agente-execucao',
      slug: 'agente-de-execucao',
      name: 'Enforcement agent',
      local: 'Agente de execução',
      about: 'An enforcement agent. Collects debts after a court decision, for example by seizing part of your salary or bank account (penhora).',
      patterns: [/agente de execução/i, /\bpenhora\b/i, /execução (?:n\.?º|judicial)/i, /oposição à execução/i, /\bexequente\b|\bexecutado\b/i],
      letters: ['Citação para execução — pay or oppose, usually within 20 days', 'Notificação de penhora — part of your salary, pension or bank account is seized'],
      tips: ['Part of your salary and pension is protected from seizure. Ask for advice if too much is taken.', 'Contact the enforcement agent and ask for a payment plan — it can stop or reduce the seizure.'],
    },
    {
      id: 'ansr',
      slug: 'ansr-coimas',
      name: 'Road safety authority',
      local: 'ANSR / PSP / GNR',
      about: 'Road traffic fines (coimas) are handled by the road safety authority ANSR, after the police (PSP or GNR) or a speed camera record an offence.',
      patterns: [/\bANSR\b/, /Autoridade Nacional de Segurança Rodoviária/i, /\bPSP\b|\bGNR\b/, /auto de contraordenação/i, /contraordenação rodoviária/i, /\bcoima\b/i, /excesso de velocidade/i, /identificação do condutor/i, /radar|SINCRO/i],
      letters: ['Auto de contraordenação — a traffic offence notice; pay the minimum fine or defend yourself, usually within 15 working days', 'Pedido de identificação do condutor — say who was driving', 'Decisão — the final fine and any driving ban'],
      tips: ['If you weren’t driving, identify the driver within the deadline (usually 15 working days).', 'Paying the minimum fine voluntarily is usually cheaper, but it can still bring points on your licence.'],
    },
    {
      id: 'tolls',
      slug: 'portagens',
      name: 'Toll roads',
      local: 'Portagens (Via Verde / Infraestruturas de Portugal)',
      about: 'Unpaid road tolls. If you don’t pay, extra costs are added and the tax office can collect them.',
      patterns: [/portage(?:m|ns)/i, /Via Verde/i, /Infraestruturas de Portugal/i, /\bEstradas de Portugal\b/i, /pórtico/i, /taxa de portagem/i],
      letters: ['Aviso de pagamento — tolls you haven’t paid yet', 'Notificação de contraordenação — unpaid tolls with a fine'],
      tips: ['Pay toll notices quickly — costs grow and can end up as a tax debt.'],
    },
    {
      id: 'energy',
      slug: 'fornecedor-energia',
      name: 'Energy supplier',
      local: 'Fornecedor de energia (EDP, Galp, Endesa…)',
      about: 'The company that sells you electricity or gas.',
      patterns: [/\bEDP\b|\bGalp\b|\bEndesa\b|\bIberdrola\b|Goldenergy|\bRepsol\b/i, /eletricidade|electricidade/i, /\bgás natural\b/i, /\bkWh\b/i, /\bCPE\b/, /\bERSE\b/, /interrupção do fornecimento|corte do fornecimento/i, /leitura do contador/i],
      letters: ['Fatura — your bill with the amount and due date', 'Aviso de interrupção — an unpaid bill; they may cut the supply after the notice period', 'Alteração de preços — your price changes'],
      tips: ['If you can’t pay, call them and ask for a payment plan before the cut-off date.', 'If your income is low, ask about the social tariff (tarifa social).'],
    },
    {
      id: 'water',
      slug: 'agua',
      name: 'Water company',
      local: 'Serviços de água (SMAS, EPAL, Águas de…)',
      about: 'Your local water company.',
      patterns: [/\bSMAS\b|\bEPAL\b|Águas d[eo]/i, /abastecimento de água/i, /\bsaneamento\b/i, /consumo de água/i, /\bm3\b|\bm³(?![A-Za-zÀ-ɏ])/],
      letters: ['Fatura de água — your water bill', 'Aviso de corte — unpaid bills; they may cut the supply'],
      tips: ['Ask your water company about a social tariff if your income is low.'],
    },
    {
      id: 'landlord',
      slug: 'senhorio',
      name: 'Landlord',
      local: 'Senhorio / Proprietário',
      about: 'The owner of your home, or the agency that manages it.',
      patterns: [/\bsenhorio\b/i, /\barrendatário\b|\binquilino\b/i, /contrato de arrendamento/i, /\brenda\b/i, /oposição à renovação/i, /\bdenúncia\b/i, /atualização da renda/i, /Balcão Nacional do Arrendamento|\bBNA\b|despejo/i],
      letters: ['Oposição à renovação / denúncia — your landlord ends the rental contract', 'Atualização da renda — your rent goes up', 'Rendas em atraso — you are behind with rent'],
      tips: ['Only a court or the Balcão Nacional do Arrendamento can order an eviction. Your landlord can’t change the locks or remove your things.', 'If you get papers about an eviction (despejo), get advice quickly — the deadline to oppose is short.'],
    },
    {
      id: 'sns',
      slug: 'sns',
      name: 'Health service',
      local: 'SNS (Serviço Nacional de Saúde)',
      about: 'The national health service. It sends appointment letters and, in some cases, bills.',
      patterns: [/\bSNS\b/, /Serviço Nacional de Saúde/i, /centro de saúde/i, /\bhospital\b/i, /\bULS\b|Unidade Local de Saúde/i, /consulta/i, /taxa moderadora/i, /número de utente/i],
      letters: ['Marcação de consulta — date, time and place of an appointment', 'Fatura / taxa moderadora — a bill for care you received'],
      tips: ['If you can’t go to an appointment, cancel it so someone else can have it.'],
    },
    {
      id: 'collection',
      slug: 'cobrancas',
      name: 'Debt collector',
      local: 'Empresa de cobranças / Recuperação de crédito',
      about: 'A company that collects debts for banks, phone companies or shops. Check that the debt is yours and the amount is right.',
      patterns: [/cobrança(?:s)? de dívidas/i, /recuperação de crédito/i, /empresa de cobranças/i, /\bcredor\b/i, /dívida (?:em atraso|vencida)/i, /regularização da dívida/i, /\bcessão de créditos\b/i],
      letters: ['Carta de cobrança — they ask you to pay a debt', 'Proposta de acordo — they offer a payment plan or a discount', 'Aviso de ação judicial — they plan to go to court'],
      tips: ['Ask for proof (contract and invoices) if you don’t recognise the debt.', 'Many consumer debts expire after a few years (prescrição). Get advice before you pay an old debt.'],
    },
  ],
  kinds: [
    {
      id: 'execution', type: 'enforcement', local: 'Execução fiscal / Penhora', name: 'Enforcement', about: 'Unpaid tax or a court debt is now collected by force. Part of your salary, pension or bank account can be seized (penhora).', urgency: 'high', objection: false, patterns: [/execução fiscal/i, /\bpenhora\b/i, /citação para (?:pagamento|execução)/i, /cobrança coerciva/i, /agente de execução/i, /processo de execução/i],
      steps: ['Act today. Pay, or ask for payment in instalments (pagamento em prestações) — this can stop the seizure.', 'You can oppose the execution (oposição) if the debt is wrong, usually within 30 days for tax and 20 days for court debts. Get legal advice.'],
    },
    {
      id: 'citation', type: 'court-order', local: 'Citação / Injunção', name: 'Court case against you', about: 'Someone started a court case or a debt order (injunção) against you. You must answer within the deadline, or they can enforce it.', urgency: 'high', objection: false, extendable: false, patterns: [/\bcitação\b/i, /\binjunção\b/i, /Balcão Nacional de Injunções/i, /\bcontestação\b/i, /fica citad[oa]/i, /requerimento de injunção/i],
      steps: ['Answer in time: for an injunção you have 15 days to pay or oppose; in other court cases often 30 days to file a defence (contestação).', 'If your income is low, ask Segurança Social for legal aid (apoio judiciário) right away.'],
    },
    {
      id: 'reminder', type: 'reminder', local: 'Aviso / Lembrete de pagamento', name: 'Payment reminder', about: 'A payment is late. If you don’t pay, costs or interest can be added, or the debt can go to enforcement.', urgency: 'high', patterns: [/\baviso de pagamento\b/i, /\blembrete\b/i, /em atraso/i, /\bdívida\b/i, /não (?:foi|se encontra) (?:efetuad|regularizad)/i, /último aviso/i, /\bfalta de pagamento\b/i],
    },
    {
      id: 'repayment', type: 'repayment', local: 'Restituição / Reposição de prestações', name: 'Request to pay money back', about: 'They say they paid you too much, for example unemployment or other benefits, and want the money back.', urgency: 'high', patterns: [/restituição de prestações/i, /reposição de (?:prestações|montantes)/i, /indevidamente (?:pag|receb)/i, /pagamento indevido/i, /montante a restituir/i],
      steps: ['If you think it’s wrong, answer within the deadline in the letter (for example in the audiência prévia) or file a complaint.', 'If you can’t pay at once, ask to pay in instalments.'],
    },
    {
      id: 'traffic-fine', type: 'fine', local: 'Auto de contraordenação / Coima', name: 'Fine', about: 'A fine (coima), for example for speeding, parking or a late tax return. You can usually pay the minimum amount or defend yourself within the deadline.', urgency: 'high', patterns: [/auto de contraordenação/i, /\bcoima\b/i, /contraordenação/i, /pagamento voluntário/i, /\bpontos? na carta\b/i, /excesso de velocidade/i],
      steps: ['Within the deadline (often 15 working days) you can pay the minimum fine voluntarily, or send your defence (defesa). If you weren’t driving, identify the driver.', 'If you do nothing, the fine can go up and become a debt with the tax office.'],
    },
    {
      id: 'tax-bill', type: 'tax-assessment', local: 'Nota de liquidação / Nota de cobrança', name: 'Tax bill', about: 'Your tax bill — for example income tax (IRS), property tax (IMI) or car tax (IUC). It shows the amount, the payment reference and the deadline.', urgency: 'medium', patterns: [/nota de (?:liquidação|cobrança)/i, /demonstração de liquidação/i, /\bIRS\b/, /\bIMI\b/, /\bIUC\b/, /imposto a pagar/i, /referência para pagamento/i],
      steps: ['Check the figures in the Portal das Finanças. If something is wrong, you can file a reclamação graciosa — usually within 120 days after the end of the payment deadline.', 'Pay with the payment reference in the letter (at a Multibanco, in home banking or online). If you can’t pay, ask for instalments before the deadline.'],
    },
    {
      id: 'prior-hearing', type: 'hearing', local: 'Audiência prévia / Direito de audição', name: 'Chance to give your side', about: 'They plan a decision and invite you to give your side first, usually within 10 working days. Your answer can change the final decision.', urgency: 'medium', objection: false, patterns: [/audiência prévia/i, /direito de audição/i, /projeto de decisão/i, /pronunciar-se/i, /exercer o direito de/i],
    },
    {
      id: 'decision', type: 'decision', local: 'Decisão / Notificação', name: 'Decision', about: 'A decision about your benefits, residence or another request — for example what you get, a change or that it stops.', urgency: 'medium', patterns: [/\bdecisão\b/i, /\bdeferid[oa]\b|\bindeferid[oa]\b/i, /foi decidido/i, /\bnotificação\b/i, /cessação/i, /suspensão/i],
      steps: ['Read the part about your right to complain or appeal (reclamação, recurso hierárquico or court). It says where and by when.'],
    },
    {
      id: 'refusal', type: 'rejection', local: 'Indeferimento', name: 'Refusal', about: 'Your request was refused. The letter says if and how you can challenge it, and by when.', urgency: 'medium', patterns: [/indeferid[oa]|indeferimento/i, /não (?:foi )?aceite/i, /não reúne as condições/i, /recusad[oa]/i],
      steps: ['Look for the part about your right to appeal. Deadlines differ — from a few working days to 3 months. Get advice quickly for immigration refusals.'],
    },
    { id: 'approval', type: 'approval', local: 'Deferimento', name: 'Approval', about: 'Your request was approved. Check that the amounts and dates are right.', urgency: 'low', patterns: [/\bdeferid[oa]\b|\bdeferimento\b/i, /foi aprovad[oa]/i, /\batribuíd[oa]\b/i, /temos o prazer/i] },
    {
      id: 'appointment', type: 'appointment', local: 'Convocatória / Agendamento', name: 'Appointment', about: 'They want you to come to an appointment, for example at the job centre, AIMA or a hospital. Missing it can cut your benefits or delay your case.', urgency: 'medium', patterns: [/convocatória/i, /\bconvocad[oa]\b/i, /agendamento/i, /\bcomparecer\b/i, /\bentrevista\b/i, /marcação/i, /\bconsulta\b/i],
      steps: ['For the job centre (IEFP): if you miss an appointment, send a justification quickly — often within 5 working days — or you can lose your unemployment benefit.'],
    },
    {
      id: 'documents', type: 'documents', local: 'Pedido de documentos / elementos', name: 'Request for documents', about: 'They need papers or information before they can decide.', urgency: 'medium', patterns: [/pedido de (?:documentos|elementos|esclarecimentos)/i, /deverá (?:apresentar|enviar|entregar)/i, /documentos em falta/i, /solicitamos (?:o envio|que envie)/i] },
    {
      id: 'termination', type: 'termination', local: 'Oposição à renovação / Denúncia', name: 'End of contract', about: 'Someone ends a contract with you — for example your landlord ends the rental contract.', urgency: 'high', objection: false, patterns: [/oposição à renovação/i, /\bdenúncia\b/i, /\bresolução do contrato\b/i, /cessação do contrato/i, /desocupar o (?:locado|imóvel)/i, /\bdespejo\b/i],
      steps: ['Check the notice period and the reason. Ask a tenants’ association or a lawyer before you agree to leave.'],
    },
    {
      id: 'utility-bill', type: 'utility-bill', local: 'Fatura de energia ou água', name: 'Energy or water bill', about: 'A bill for electricity, gas or water.', urgency: 'medium', patterns: [/\bkWh\b/i, /\bCPE\b/, /leitura (?:real|estimada)/i, /consumo de (?:água|eletricidade|gás)/i, /\bm3\b|\bm³(?![A-Za-zÀ-ɏ])/, /potência contratada/i],
      steps: ['Check the meter readings. If the bill is estimated, send a real reading (leitura).'],
    },
    { id: 'bill', type: 'bill', local: 'Fatura', name: 'Bill', about: 'A bill. It tells you how much to pay and by when.', urgency: 'medium', weight: 0.6, patterns: [/\bfatura\b/i, /data (?:limite|de vencimento)/i, /\bvalor a pagar\b/i, /\bmontante a pagar\b/i, /\bMultibanco\b/i] },
  ],
  references: [
    { name: 'Case number', local: 'Processo n.º', pattern: /(?:\bprocesso\s?(?:n\.?\s?º|n\.?o|nº|número)|\bn\.?\s?º\s?(?:do\s)?processo|\bnossa referência|\bnossa ref\.?|\bvossa referência)/gi },
    { name: 'Tax document number', local: 'N.º de documento / liquidação', pattern: /(?:\bdocumento\s?n\.?\s?º|\bn\.?\s?º\s?(?:do\s)?documento|\bliquidação\s?n\.?\s?º|\bn\.?\s?º\s?(?:da\s)?liquidação|\bnota de cobrança\s?n\.?\s?º)/gi },
    { name: 'Fine number', local: 'Auto n.º', pattern: /(?:\bauto\s?(?:de contraordenação\s?)?n\.?\s?º|\bn\.?\s?º\s?(?:do\s)?auto)/gi },
    { name: 'Customer number', local: 'N.º de cliente', pattern: /(?:\bn\.?\s?º\s?(?:de\s)?cliente|\bnúmero de cliente|\bn\.?\s?º\s?(?:de\s)?contrato|\bconta contrato)/gi },
    { name: 'Invoice number', local: 'Fatura n.º', pattern: /(?:\bfatura\s?n\.?\s?º|\bn\.?\s?º\s?(?:da\s)?fatura)/gi },
    { name: 'Energy point code', local: 'CPE', pattern: /\bCPE\b/gi },
    { name: 'Vehicle registration', local: 'Matrícula', pattern: /\bmatrícula/gi },
    { name: 'Tax number', local: 'NIF', personal: true, pattern: /\bNIF\b/gi },
    { name: 'Social security number', local: 'NISS', personal: true, pattern: /\bNISS\b/gi },
    { name: 'Payment reference', local: 'Referência para pagamento', payment: true, pattern: /\breferência (?:para|de) pagamento/gi },
  ],
  glossary: [
    { term: 'Finanças', slug: 'financas', pattern: /\bFinan[cç]as\b|Autoridade Tribut[aá]ria/i, meaning: 'The tax office (Autoridade Tributária e Aduaneira, AT).' },
    { term: 'Portal das Finanças', slug: 'portal-das-financas', pattern: /Portal das Finan[cç]as/i, meaning: 'The tax office website. You can see letters, pay and object there.' },
    { term: 'NIF', slug: 'nif', pattern: /\bNIF\b/, meaning: 'Tax identification number (número de identificação fiscal). A 9-digit personal number you need for almost everything in Portugal.' },
    { term: 'NISS', slug: 'niss', pattern: /\bNISS\b/, meaning: 'Social security number (número de identificação da segurança social).' },
    { term: 'IRS', slug: 'irs', pattern: /\bIRS\b/, meaning: 'Personal income tax (imposto sobre o rendimento das pessoas singulares).' },
    { term: 'IMI', slug: 'imi', pattern: /\bIMI\b/, meaning: 'Yearly property tax for the owner of a house or flat.' },
    { term: 'IUC', slug: 'iuc', pattern: /\bIUC\b/, meaning: 'Yearly car tax, paid in the month the car was first registered.' },
    { term: 'nota de liquidação', slug: 'nota-de-liquidacao', pattern: /nota de liquidação|demonstração de liquidação/i, meaning: 'The tax office’s calculation of your tax: a refund or tax to pay.' },
    { term: 'nota de cobrança', slug: 'nota-de-cobranca', pattern: /nota de cobrança/i, meaning: 'A tax bill with the amount, the deadline and a payment reference.' },
    { term: 'referência para pagamento', slug: 'referencia-para-pagamento', pattern: /referência (?:para|de) pagamento/i, meaning: 'The number you use to pay a bill at a Multibanco machine, in home banking or online.', tip: 'Copy it exactly. A wrong reference means the payment isn’t linked to your bill.' },
    { term: 'Multibanco', slug: 'multibanco', pattern: /\bMultibanco\b/i, meaning: 'The Portuguese cash machine and payment network. You pay bills with an entity number (entidade) and a reference (referência).' },
    { term: 'reclamação graciosa', slug: 'reclamacao-graciosa', pattern: /reclamação graciosa/i, meaning: 'A free complaint to the tax office against a tax bill.', tip: 'Usually possible within 120 days after the end of the payment deadline. You can do it in the Portal das Finanças.' },
    { term: 'impugnação judicial', slug: 'impugnacao-judicial', pattern: /impugnação judicial/i, meaning: 'Challenging a tax bill in court. Usually within 3 months.' },
    { term: 'execução fiscal', slug: 'execucao-fiscal', pattern: /execução fiscal/i, meaning: 'Forced collection of unpaid tax by the tax office, for example by seizing salary or bank money.' },
    { term: 'penhora', slug: 'penhora', pattern: /\bpenhora/i, meaning: 'Seizure of money or goods to pay a debt — for example part of your salary.', tip: 'Part of your salary and pension is protected. Ask for advice if too much is taken.' },
    { term: 'citação', slug: 'citacao', pattern: /\bcitação\b|\bcitad[oa]\b/i, meaning: 'Official notice that a court case or enforcement was started against you. Deadlines start from it.' },
    { term: 'notificação', slug: 'notificacao', pattern: /\bnotificação\b|\bnotificad[oa]\b/i, meaning: 'An official letter that tells you about a decision or a step in a process.' },
    { term: 'injunção', slug: 'injuncao', pattern: /\binjunção\b/i, meaning: 'A quick court procedure for a debt. You have 15 days to pay or oppose.' },
    { term: 'contestação', slug: 'contestacao', pattern: /contestação/i, meaning: 'Your written defence in a court case.' },
    { term: 'oposição', slug: 'oposicao', pattern: /\boposição\b/i, meaning: 'A formal objection, for example against an enforcement or an injunção.' },
    { term: 'agente de execução', slug: 'agente-de-execucao', pattern: /agente de execução/i, meaning: 'An enforcement agent who collects court debts, for example by seizing salary.' },
    { term: 'coima', slug: 'coima', pattern: /\bcoima/i, meaning: 'A fine for an administrative offence, for example speeding or a late tax return.' },
    { term: 'auto de contraordenação', slug: 'auto-de-contraordenacao', pattern: /auto de contraordenação/i, meaning: 'An offence notice, for example for speeding or parking.', tip: 'You usually have 15 working days to pay the minimum fine or send your defence.' },
    { term: 'pagamento voluntário', slug: 'pagamento-voluntario', pattern: /pagamento voluntário/i, meaning: 'Paying a fine early, usually at the minimum amount.' },
    { term: 'defesa', slug: 'defesa', pattern: /\bdefesa\b/i, meaning: 'Your written explanation against a fine or accusation.' },
    { term: 'audiência prévia', slug: 'audiencia-previa', pattern: /audiência prévia|direito de audição/i, meaning: 'Your right to give your side before a final decision.', tip: 'Answer within the deadline, often 10 working days. It can change the decision.' },
    { term: 'deferimento', slug: 'deferimento', pattern: /\bdeferid[oa]\b|\bdeferimento\b/i, meaning: 'Approval of your request.' },
    { term: 'indeferimento', slug: 'indeferimento', pattern: /indeferid[oa]|indeferimento/i, meaning: 'Refusal of your request.' },
    { term: 'recurso hierárquico', slug: 'recurso-hierarquico', pattern: /recurso hierárquico/i, meaning: 'An appeal to a higher level of the same office.' },
    { term: 'dias úteis', slug: 'dias-uteis', pattern: /dias úteis/i, meaning: 'Working days — weekends and public holidays don’t count.' },
    { term: 'prazo', slug: 'prazo', pattern: /\bprazo\b/i, meaning: 'Deadline or time limit.' },
    { term: 'pagamento em prestações', slug: 'pagamento-em-prestacoes', pattern: /pagamento em prestações|planos? prestacion/i, meaning: 'Paying a debt in monthly parts.' },
    { term: 'Segurança Social Direta', slug: 'seguranca-social-direta', pattern: /Segurança Social Direta/i, meaning: 'The social security website, where you can see letters, apply and object.' },
    { term: 'subsídio de desemprego', slug: 'subsidio-de-desemprego', pattern: /subsídio de desemprego/i, meaning: 'Unemployment benefit.' },
    { term: 'abono de família', slug: 'abono-de-familia', pattern: /abono de família/i, meaning: 'Child benefit.' },
    { term: 'restituição', slug: 'restituicao', pattern: /restituição|reposição/i, meaning: 'Paying back money you received but weren’t entitled to.' },
    { term: 'convocatória', slug: 'convocatoria', pattern: /convocatória|\bconvocad[oa]\b/i, meaning: 'An official invitation to an appointment.' },
    { term: 'autorização de residência', slug: 'autorizacao-de-residencia', pattern: /autorização de residência|título de residência/i, meaning: 'Residence permit.' },
    { term: 'apoio judiciário', slug: 'apoio-judiciario', pattern: /apoio judiciário/i, meaning: 'Legal aid. Segurança Social can pay for a lawyer and court costs if your income is low.' },
    { term: 'carta registada', slug: 'carta-registada', pattern: /carta registada|registo postal/i, meaning: 'Registered letter. You get proof that it was sent.' },
    { term: 'senhorio', slug: 'senhorio', pattern: /\bsenhorio\b/i, meaning: 'Landlord.' },
    { term: 'renda', slug: 'renda', pattern: /\brenda\b/i, meaning: 'Rent.' },
    { term: 'despejo', slug: 'despejo', pattern: /\bdespejo\b/i, meaning: 'Eviction.', tip: 'Only a court or the Balcão Nacional do Arrendamento can order it. Get advice quickly.' },
    { term: 'prescrição', slug: 'prescricao', pattern: /prescri[çc]ão|prescrit[oa]/i, meaning: 'When a debt or fine is too old to be collected.' },
  ],
  extraReplies: [
    {
      id: 'reclamacao-graciosa',
      title: 'Object to the tax bill (reclamação graciosa)',
      advice: 'Use this if you think your tax bill is wrong. You can usually send it within 120 days after the end of the payment deadline — the easiest way is online in the Portal das Finanças (e-balcão). Objecting doesn’t pause the payment unless you give a guarantee.',
      english: 'I object to the tax bill [number]. Reason: [your reason]. I ask you to correct it and confirm that you received my complaint.',
      subject: 'Assunto: Reclamação graciosa',
      body: (result) => [
        `Venho, por este meio, apresentar reclamação graciosa contra a liquidação ${letterOf(result)}${result.references.find((reference) => reference.name === 'Tax document number') ? `, n.º ${result.references.find((reference) => reference.name === 'Tax document number').value}` : ''}.`,
        '',
        'Fundamentos: [Explique o que está errado, por exemplo uma dedução que falta ou um valor incorreto.]',
        '',
        '[Junto os documentos comprovativos.]',
        '',
        'Peço a anulação ou correção da liquidação e a confirmação da receção desta reclamação.',
      ],
      when: (result) => result.kind?.id === 'tax-bill',
      replaces: 'objection',
    },
    {
      id: 'defesa',
      title: 'Send your defence against the fine (defesa)',
      advice: 'Use this if you think the fine is wrong. Send it within the deadline on the notice (often 15 working days), by registered post or online if the notice allows it.',
      english: 'I do not accept the offence notice [number]. Reason: [your reason]. I ask that the case be closed.',
      subject: 'Assunto: Defesa — auto de contraordenação',
      body: (result) => [
        `Venho, por este meio, apresentar a minha defesa relativamente ao auto de contraordenação ${letterOf(result)}${result.references.find((reference) => reference.name === 'Fine number') ? `, n.º ${result.references.find((reference) => reference.name === 'Fine number').value}` : ''}.`,
        '',
        'Fundamentos: [Explique porque é que a coima não é devida, por exemplo: eu não era o condutor / a sinalização não era visível.]',
        '',
        '[Junto provas: fotografias, documentos ou testemunhas.]',
        '',
        'Peço o arquivamento do processo.',
      ],
      when: (result) => result.kind?.id === 'traffic-fine',
      replaces: 'objection',
    },
    {
      id: 'audiencia-previa',
      title: 'Give your side before the decision (audiência prévia)',
      advice: 'Use this to explain your side before they make the final decision. Send it within the deadline in the letter (often 10 working days), online or by registered post.',
      english: 'About your letter, I want to give my side: [your explanation]. I attach proof. I ask you to take this into account in your decision.',
      subject: 'Assunto: Audiência prévia — pronúncia por escrito',
      body: (result) => [
        `Na sequência da vossa notificação ${letterOf(result)}, venho exercer o meu direito de audiência prévia.`,
        '',
        'Fundamentos: [Explique a sua situação e porque é que a decisão prevista não está correta.]',
        '',
        '[Junto documentos comprovativos.]',
        '',
        'Peço que estes elementos sejam tidos em conta na decisão final.',
      ],
      when: (result) => result.kind?.id === 'prior-hearing',
    },
    {
      id: 'contestar-divida',
      title: 'Dispute the debt or invoice',
      advice: 'Use this if you think the invoice or debt is wrong or not yours. Send it by registered post and keep a copy.',
      english: 'I dispute this debt. Please send me proof (contract and invoices) and stop collecting until then.',
      subject: 'Assunto: Contestação de dívida',
      body: (result) => [
        `Recebi a vossa carta ${letterOf(result)} sobre o montante de ${amountOf(result)}.`,
        '',
        'Venho contestar esta dívida. Motivo: [por exemplo: já paguei / nunca celebrei este contrato / o valor está errado.]',
        '',
        'Peço que me enviem os documentos que comprovam a dívida (contrato e faturas) e que suspendam a cobrança até à vossa resposta.',
        '',
        'Esta carta não constitui reconhecimento da dívida.',
      ],
      when: (result) => ['collection', 'energy', 'water'].includes(result.sender?.id),
    },
  ],
  samples: [
    {
      id: 'at',
      title: 'Finanças',
      subtitle: 'IUC car tax bill with a payment reference',
      build(today) {
        const letter = addDays(today, -3);
        const due = addDays(letter, 30);
        const year = Number(today.slice(0, 4));
        return `AUTORIDADE TRIBUTÁRIA E ADUANEIRA
Serviço de Finanças de Lisboa-3
Rua do Exemplo, 10
1000-001 Lisboa

Lisboa, ${longDate(letter)}

Exmo. Senhor
João Exemplo
Rua das Amostras, 25, 2.º Esq.
1100-200 Lisboa

NIF: 123456789
Nota de cobrança n.º 2026 1234567
Matrícula: AA-00-ZZ

Imposto Único de Circulação (IUC) — ano ${year}

Montante a pagar: 1.234,56 €
Data limite de pagamento: ${portugueseDate(due)}
Referência para pagamento: 1234 5678 9012 345

O pagamento pode ser efetuado em qualquer caixa Multibanco, no homebanking (Pagamentos ao Estado) ou nos Serviços de Finanças.

Caso não concorde com a liquidação, pode apresentar reclamação graciosa no prazo de 120 dias a contar do termo do prazo de pagamento voluntário, ou impugnação judicial no prazo de 3 meses.

A falta de pagamento dentro do prazo implica a cobrança de juros de mora e a instauração de processo de execução fiscal.

Com os melhores cumprimentos,

O Chefe do Serviço de Finanças`;
      },
    },
    {
      id: 'aima',
      title: 'AIMA',
      subtitle: 'Appointment for a residence permit',
      build(today) {
        const letter = addDays(today, -2);
        const appointment = nextWorkday(addDays(today, 8));
        return `AIMA — Agência para a Integração, Migrações e Asilo
Avenida do Exemplo, 100
1000-100 Lisboa

Lisboa, ${longDate(letter)}
Processo n.º 2026/123456

Exma. Senhora
Priya Exemplo
Rua das Flores, 7, 1.º Dto.
4000-123 Porto

Assunto: Agendamento — renovação de autorização de residência

Exma. Senhora,

Fica convocada para comparecer no dia ${longDate(appointment)}, às 9h30, na Loja AIMA do Porto, Rua do Exemplo, 50, para a renovação da sua autorização de residência.

Deverá apresentar:
- passaporte válido;
- título de residência atual;
- comprovativo de morada;
- comprovativo de meios de subsistência.

Caso não possa comparecer, deverá reagendar com a antecedência mínima de 48 horas através do portal da AIMA. A falta de comparência sem justificação pode levar ao arquivamento do pedido.

Com os melhores cumprimentos,

AIMA`;
      },
    },
  ],
};
