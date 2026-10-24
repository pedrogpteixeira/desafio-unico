import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { jobs } from '../data/jobs';
import { PrivacyComponent } from '../shared/privacy.component';
import { createFormData, sendApplication, validateCv } from '../core/netlify-form';
@Component({selector:'du-application',standalone:true,imports:[ReactiveFormsModule,PrivacyComponent],templateUrl:'./application.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ApplicationComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly jobs = jobs;
  readonly areas = ['Geral / A definir', ...new Set(jobs.map(job => job.area))];
  readonly busy = signal(false);
  readonly status = signal('');
  readonly failed = signal(false);
  readonly submitted = signal(false);
  readonly file = signal<File|null>(null);
  readonly fileError = signal('');
  readonly localPreview = isDevMode() || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  readonly form = this.fb.group({
    name:['',[Validators.required,Validators.maxLength(120),Validators.pattern(/\S/)]],
    email:['',[Validators.required,Validators.email,Validators.maxLength(200)]],
    phone:['',[Validators.maxLength(30)]],
    interestArea:['Geral / A definir',[Validators.required]],
    position:['Candidatura espontânea',[Validators.required]],
    portfolio:['',[Validators.maxLength(500),Validators.pattern(/^https?:\/\/[^\s]+$/)]],
    message:['',[Validators.maxLength(5000)]],
    consent:[false,[Validators.requiredTrue]],
    'bot-field':[''],
  });
  selectInterestArea(area:string):void { this.form.controls.interestArea.setValue(area); }
  selectPosition(position:string):void { this.form.controls.position.setValue(position); }
  selectOpportunity(area:string, position?:string):void {
    this.selectInterestArea(area);
    this.selectPosition(position ?? 'Candidatura espontânea');
  }
  async chooseFile(event:Event):Promise<void> {
    const file=(event.target as HTMLInputElement).files?.[0]??null;
    this.file.set(file);
    const error=await validateCv(file);
    if(this.file()===file) this.fileError.set(error??'');
  }
  async submit(fileInput:HTMLInputElement):Promise<void> {
    if(this.busy())return;
    this.submitted.set(true);this.status.set('');this.failed.set(false);this.form.markAllAsTouched();
    const cv=this.file();const validation=await validateCv(cv);this.fileError.set(validation??'');
    if(this.form.invalid||validation||!cv){this.failed.set(true);this.status.set('Revê os campos assinalados antes de enviar.');return;}
    if(this.form.controls['bot-field'].value){this.failed.set(true);this.status.set('Não foi possível validar o formulário.');return;}
    if(this.localPreview){this.failed.set(true);this.status.set('Formulário validado. O envio só fica disponível após o deploy na Netlify com Form detection ativo. Nenhuma candidatura foi enviada.');return;}
    this.busy.set(true);
    try {
      await sendApplication(createFormData(this.form.getRawValue(),cv));
      this.status.set('Candidatura enviada. Obrigado por partilhares o teu próximo desafio connosco.');
      this.form.reset({name:'',email:'',phone:'',interestArea:'Geral / A definir',position:'Candidatura espontânea',portfolio:'',message:'',consent:false,'bot-field':''});
      this.file.set(null);fileInput.value='';this.submitted.set(false);
    } catch(error) {
      this.failed.set(true);
      this.status.set(error instanceof Error && error.name==='TimeoutError' ? 'O envio demorou demasiado. Confirma a tua ligação e tenta novamente. Os campos foram preservados.' : error instanceof Error ? error.message : 'Não foi possível enviar. Tenta novamente mais tarde.');
    } finally {this.busy.set(false);}
  }
}
