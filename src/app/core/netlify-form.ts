export const FORM_NAME = 'candidaturas';
export const FORM_ENDPOINT = '/netlify-forms.html';
export const MAX_CV_BYTES = 5 * 1024 * 1024;
export interface ApplicationData { name:string; email:string; phone:string; interestArea:string; position:string; portfolio:string; message:string; consent:boolean; 'bot-field':string; }
/** Upload validation is client-side UX, not a server-side security boundary. */
export async function validateCv(file: File | null): Promise<string | null> {
  if (!file || !file.size) return 'Seleciona o teu CV em PDF.';
  if (file.size > MAX_CV_BYTES) return 'O CV deve ter, no máximo, 5 MB.';
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'O CV deve ser um ficheiro PDF.';
  if (new TextDecoder().decode(await file.slice(0,5).arrayBuffer()) !== '%PDF-') return 'O ficheiro selecionado não é um PDF válido.';
  return null;
}
export function createFormData(data: ApplicationData, cv: File): FormData {
  const body = new FormData();
  body.set('form-name', FORM_NAME);
  for (const [key,value] of Object.entries(data)) body.set(key, typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value.trim());
  body.set('cv',cv,cv.name);
  return body;
}
export async function sendApplication(body: FormData, request: typeof fetch = fetch): Promise<void> {
  // Let the browser set the multipart boundary. Do not set Content-Type manually.
  const response = await request(FORM_ENDPOINT,{method:'POST',body,signal:AbortSignal.timeout(30_000)});
  if (!response.ok) throw new Error('Não foi possível enviar a candidatura. Tenta novamente mais tarde.');
}
