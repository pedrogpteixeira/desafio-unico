import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync('dist/desafio-unico/browser/netlify-forms.html', 'utf8');
const forms = [
  {name: 'candidaturas', source: 'src/app/features/application.component.html', fields: ['name','email','phone','interestArea','position','portfolio','message','consent','bot-field','cv']},
  {name: 'pedidos-energia', source: 'src/app/features/lead.component.html', fields: ['name','phone','email','segment','service','company','message','consent','bot-field']},
];
for (const form of forms) {
  const formStart = html.indexOf(`<form name="${form.name}"`);
  assert.ok(formStart >= 0, `Missing static form: ${form.name}`);
  const formEnd = html.indexOf('</form>', formStart);
  const blueprint = html.slice(formStart, formEnd);
  const component = readFileSync(form.source, 'utf8');
  assert.match(blueprint, /data-netlify="true"/);
  assert.match(blueprint, /netlify-honeypot="bot-field"/);
  assert.ok(blueprint.includes(`name="form-name" value="${form.name}"`));
  for (const field of form.fields) {
    assert.ok(blueprint.includes(`name="${field}"`), `${form.name}: missing static ${field}`);
    assert.ok(component.includes(`name="${field}"`), `${form.name}: missing Angular ${field}`);
  }
  if (form.name === 'candidaturas') assert.match(blueprint, /enctype="multipart\/form-data"/);
}
assert.match(readFileSync('dist/desafio-unico/browser/index.html', 'utf8'), /<du-root>/);
console.log('PASS: both Netlify forms included in production build and fields match Angular.');
