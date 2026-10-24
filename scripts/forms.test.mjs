import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFormData,sendApplication,validateCv,MAX_CV_BYTES} from '../src/app/core/netlify-form.ts';
const cv=()=>new File(['%PDF-1.4\nDummy technical test'], 'cv.pdf',{type:'application/pdf'});
test('PDF validation rejects missing, empty, oversized and disguised files',async()=>{
 assert.equal(await validateCv(cv()),null);assert.ok(await validateCv(null));assert.ok(await validateCv(new File([],'cv.pdf')));assert.ok(await validateCv(new File(['not pdf'],'cv.pdf')));assert.ok(await validateCv(new File(['%PDF-1.4'],'cv.exe')));assert.ok(await validateCv(new File([new Uint8Array(MAX_CV_BYTES+1)],'cv.pdf')));
});
test('Netlify receives matching form-name, all fields and multipart CV without a manual Content-Type',async()=>{
 const body=createFormData({name:' Test ',email:'test@example.com',phone:'',interestArea:'Comercial',position:'Consultor/a Comercial — Particulares',portfolio:'',message:'Olá',consent:true,'bot-field':''},cv());
 assert.equal(body.get('name'),'Test');assert.equal(body.get('form-name'),'candidaturas');assert.equal(body.get('interestArea'),'Comercial');assert.equal(body.get('consent'),'Sim');assert.ok(body.get('cv') instanceof File);
 await sendApplication(body,async(url,options)=>{assert.equal(url,'/netlify-forms.html');assert.equal(options.method,'POST');assert.equal(options.body,body);assert.equal(options.headers,undefined);return new Response(null,{status:200})});
});
test('HTTP errors never report success',async()=>{await assert.rejects(()=>sendApplication(new FormData(),async()=>new Response(null,{status:500})),/Não foi possível/)});
test('network errors propagate',async()=>{await assert.rejects(()=>sendApplication(new FormData(),async()=>{throw new Error('Network error')}),/Network error/)});

import {createLeadPayload,sendLead,LEAD_FORM_NAME} from '../src/app/core/lead-form.ts';
test('commercial lead uses its own Netlify form without mixing CV data', async () => {
 const payload=createLeadPayload({name:' Maria ',phone:' 912345678 ',email:'maria@example.pt',segment:'Empresa',service:'Eletricidade',company:' Empresa X ',message:'Interesse em soluções',consent:true,'bot-field':''});
 assert.equal(payload.get('form-name'), LEAD_FORM_NAME);
 assert.equal(payload.get('company'), 'Empresa X');
 assert.equal(payload.get('segment'), 'Empresa');
 assert.equal(payload.get('consent'), 'Sim');
 assert.equal(payload.has('cv'), false);
 await sendLead(payload, async (url, options) => {
  assert.equal(url, '/netlify-forms.html');
  assert.equal(options.method, 'POST');
  assert.match(options.headers['Content-Type'], /application\/x-www-form-urlencoded/);
  assert.equal(new URLSearchParams(options.body).get('name'), 'Maria');
  return new Response(null,{status:200});
 });
});
test('commercial lead does not show a successful submission on HTTP error',async()=> {
 await assert.rejects(()=>sendLead(new URLSearchParams(),async()=>new Response(null,{status:500})),/Não foi possível/);
});
