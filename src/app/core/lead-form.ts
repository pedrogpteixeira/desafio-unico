/** Pedido simples de informação comercial, independente das candidaturas. */
export const LEAD_FORM_NAME = 'pedidos-energia';
export const LEAD_FORM_ENDPOINT = '/netlify-forms.html';
export const LEAD_SEGMENTS = ['Particular', 'Empresa'] as const;
export type LeadSegment = typeof LEAD_SEGMENTS[number];
export const LEAD_SERVICES = ['Eletricidade', 'Eletricidade e gás natural', 'Quero aconselhamento'] as const;
export type LeadService = typeof LEAD_SERVICES[number];
export interface LeadData {
  name: string;
  phone: string;
  email: string;
  segment: LeadSegment;
  service: LeadService;
  company: string;
  message: string;
  consent: boolean;
  'bot-field': string;
}
export function createLeadPayload(data: LeadData): URLSearchParams {
  const payload = new URLSearchParams();
  payload.set('form-name', LEAD_FORM_NAME);
  for (const [key, value] of Object.entries(data)) {
    payload.set(key, typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value.trim());
  }
  return payload;
}
export async function sendLead(payload: URLSearchParams, request: typeof fetch = fetch): Promise<void> {
  const response = await request(LEAD_FORM_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
    body: payload.toString(),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error('Não foi possível enviar o pedido. Tenta novamente mais tarde.');
}
