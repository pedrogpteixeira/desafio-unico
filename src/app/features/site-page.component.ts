import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { jobs, Job } from '../data/jobs';
import { siteConfig } from '../data/site.config';
import { FilmComponent } from '../shared/film.component';
import { RevealDirective } from '../shared/reveal.directive';
import { ApplicationComponent } from './application.component';
import { LeadComponent } from './lead.component';
import { LeadSegment, LeadService } from '../core/lead-form';
@Component({standalone:true,imports:[RouterLink,FilmComponent,ApplicationComponent,LeadComponent,RevealDirective],templateUrl:'./site-page.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class SitePageComponent {
  private readonly data = toSignal(inject(ActivatedRoute).data);
  readonly careers = computed(() => !!this.data()?.['careers']);
  readonly config = siteConfig;
  readonly jobs = jobs;
  readonly filter = signal('Todas');
  readonly selected = signal<Job|null>(null);
  readonly filters = ['Todas', ...new Set(jobs.map(j => j.area))];
  readonly filteredJobs = computed(() => jobs.filter(j => this.filter() === 'Todas' || j.area === this.filter()));
  readonly jobDialog = viewChild.required<ElementRef<HTMLDialogElement>>('jobDialog');
  readonly application = viewChild(ApplicationComponent);
  readonly lead = viewChild(LeadComponent);
  readonly services = [
    {n:'01',icon:'↯',title:'Eletricidade',description:'Exploramos as opções disponíveis para o teu perfil de consumo e explicamos as condições com clareza.',interest:'Eletricidade' as LeadService},
    {n:'02',icon:'◈',title:'Eletricidade + gás natural',description:'Uma solução combinada para quem pretende reunir as duas energias, mediante disponibilidade.',interest:'Eletricidade e gás natural' as LeadService},
    {n:'03',icon:'⊕',title:'Análise personalizada',description:'Tens dúvidas sobre potência, horários ou tipo de contrato? Começamos por perceber as tuas necessidades.',interest:'Quero aconselhamento' as LeadService},
  ];
  readonly audiences = [
    {number:'01',label:'PARTICULARES',title:'Energia para a tua casa.',description:'Queres perceber se o teu contrato responde às necessidades da tua casa? Começamos pelos teus hábitos de consumo.',points:['Soluções de eletricidade para o dia a dia','Possibilidade de combinar luz e gás natural','Apoio a conhecer as condições e os próximos passos'],segment:'Particular' as LeadSegment,cta:'Analisar energia para casa'},
    {number:'02',label:'EMPRESAS',title:'Energia para o teu negócio.',description:'De pequenos negócios a operações com outras exigências, ouvimos primeiro para perceber o que faz sentido analisar.',points:['Soluções de eletricidade para negócios','Opções de eletricidade e gás natural','Análise comercial orientada ao perfil de consumo'],segment:'Empresa' as LeadSegment,cta:'Analisar energia para empresa'},
  ];
  readonly steps = [
    {title:'Escutar primeiro',description:'Compreender o contexto, o consumo e o que realmente importa.'},
    {title:'Explicar com clareza',description:'Dar espaço às perguntas e tornar as opções mais fáceis de compreender.'},
    {title:'Acompanhar de perto',description:'Valorizar a confiança em cada etapa da relação.'},
  ];
  requestContact(segment: LeadSegment, service: LeadService = 'Quero aconselhamento'): void {
    this.lead()?.setRequest(segment, service);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('contacto')?.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth'});
  }
  requestService(service: LeadService): void {
    this.requestContact(this.lead()?.form.controls.segment.value ?? 'Particular', service);
  }
  openJob(job: Job): void { this.selected.set(job); this.jobDialog().nativeElement.showModal(); }
  closeJob(): void { this.jobDialog().nativeElement.close(); }
  apply(): void {
    const job = this.selected();
    this.closeJob();
    this.application()?.selectOpportunity(job?.area ?? 'Geral / A definir', job?.title ?? 'Candidatura espontânea');
    document.getElementById('candidatura')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
}
