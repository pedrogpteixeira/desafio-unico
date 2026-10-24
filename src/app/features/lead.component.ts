import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, isDevMode, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { createLeadPayload, LeadSegment, LeadService, LEAD_SEGMENTS, LEAD_SERVICES, sendLead } from '../core/lead-form';
import { PrivacyComponent } from '../shared/privacy.component';
import { siteConfig } from '../data/site.config';

@Component({
  selector: 'du-lead',
  standalone: true,
  imports: [ReactiveFormsModule, PrivacyComponent],
  templateUrl: './lead.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly contact = siteConfig.contact;
  readonly segments = LEAD_SEGMENTS;
  readonly services = LEAD_SERVICES;
  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly failed = signal(false);
  readonly status = signal('');
  readonly localPreview = isDevMode() || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9 ()-]{9,25}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    segment: this.fb.control<LeadSegment>('Particular', {validators: [Validators.required]}),
    service: this.fb.control<LeadService>('Quero aconselhamento', {validators: [Validators.required]}),
    company: ['', [Validators.maxLength(180)]],
    message: ['', [Validators.maxLength(1500)]],
    consent: [false, [Validators.requiredTrue]],
    'bot-field': [''],
  });

  setRequest(segment: LeadSegment, service: LeadService = 'Quero aconselhamento'): void {
    this.form.patchValue({segment, service});
    this.updateCompanyValidators();
    this.changeDetector.markForCheck();
  }

  private updateCompanyValidators(): void {
    const company = this.form.controls.company;
    company.setValidators(this.form.controls.segment.value === 'Empresa'
      ? [Validators.required, Validators.maxLength(180)]
      : [Validators.maxLength(180)]);
    company.updateValueAndValidity();
  }

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.submitted.set(true);
    this.failed.set(false);
    this.status.set('');
    this.form.markAllAsTouched();
    this.updateCompanyValidators();
    if (this.form.invalid) {
      this.failed.set(true);
      this.status.set('Revê os campos assinalados para enviar o pedido.');
      return;
    }
    if (this.form.controls['bot-field'].value) {
      this.failed.set(true);
      this.status.set('Não foi possível validar o formulário.');
      return;
    }
    if (this.localPreview) {
      this.failed.set(true);
      this.status.set('Os dados estão válidos. O envio de pedidos só funciona depois do deploy na Netlify com a deteção de formulários ativa.');
      return;
    }
    this.busy.set(true);
    try {
      await sendLead(createLeadPayload(this.form.getRawValue()));
      this.status.set('Pedido enviado com sucesso. Obrigado pelo teu interesse; entraremos em contacto assim que possível.');
      this.form.reset();
      this.updateCompanyValidators();
      this.submitted.set(false);
    } catch (error) {
      this.failed.set(true);
      this.status.set(error instanceof Error && error.name === 'TimeoutError'
        ? 'A resposta demorou demasiado. Antes de tentares novamente, confirma se o pedido foi recebido.'
        : 'Não foi possível confirmar o envio. Tenta novamente mais tarde.');
    } finally { this.busy.set(false); }
  }
}
