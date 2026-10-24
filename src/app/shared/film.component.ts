import { ChangeDetectionStrategy, Component, ElementRef, input, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { siteConfig } from '../data/site.config';

/** Editorial media window: the video is opt-in and never autoplays with sound. */
@Component({
  selector: 'du-film',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="story-stage" [class.story-stage-careers]="careers()" aria-labelledby="story-title">
      <div class="story-grid">
        <div class="story-copy">
          <span class="label">{{ careers() ? '02 — A VIDA NA EQUIPA' : '02 — O NOSSO MOVIMENTO' }}</span>
          <span class="story-number" aria-hidden="true">DU / {{ careers() ? 'PEOPLE' : 'ENERGY' }}</span>
          <h2 id="story-title">
            @if (careers()) { O futuro faz-se<br>com <em>pessoas.</em> }
            @else { Mais do que energia.<br><em>Ligações reais.</em> }
          </h2>
          <p class="story-lead">{{ careers()
            ? 'As melhores equipas crescem com diferentes perspetivas, novas ideias e vontade de fazer acontecer.'
            : 'Acreditamos que as boas decisões começam com uma conversa. É assim que aproximamos pessoas e soluções energéticas.' }}</p>
          <div class="story-points" aria-label="Os nossos compromissos">
            <span><i aria-hidden="true"></i> Proximidade</span>
            <span><i aria-hidden="true"></i> Confiança</span>
            <span><i aria-hidden="true"></i> Evolução</span>
          </div>
          <a class="story-link" [routerLink]="careers() ? '/carreiras' : '/'" [fragment]="careers() ? 'oportunidades' : 'abordagem'">
            {{ careers() ? 'Explorar oportunidades' : 'Conhecer a nossa abordagem' }} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="story-visual">
          <div class="story-frame">
            <img [src]="careers() ? config.teamImage : config.windImage"
              [alt]="careers() ? 'Fotografia ilustrativa de uma equipa de profissionais' : 'Fotografia ilustrativa do setor energético'"
              loading="lazy" decoding="async">
            <video #video playsinline preload="none" [poster]="careers() ? config.teamImage : config.windImage"
              [class.is-active]="playing()" [controls]="playing()" [attr.aria-label]="'Vídeo ilustrativo sobre energia e colaboração'"
              (ended)="stop()" (error)="videoError()">
              <source [src]="careers() ? config.careersVideoUrl : config.companyVideoUrl" type="video/mp4">
              O teu navegador não suporta vídeo HTML5.
            </video>
            @if (!playing()) {
              <button type="button" class="story-play" (click)="play()" aria-label="Reproduzir vídeo ilustrativo">
                <span class="story-play-icon" aria-hidden="true">▶</span>
                <span>VER EM MOVIMENTO <small>PLAY / 01</small></span>
              </button>
            }
            @if (playing()) {
              <button type="button" class="story-stop" (click)="stop()">Fechar vídeo <span aria-hidden="true">×</span></button>
            }
            <span class="story-frame-corner" aria-hidden="true">↗</span>
          </div>
          <div class="story-visual-caption">
            <span>01 / {{ careers() ? 'EQUIPA' : 'ENERGIA' }}</span>
            <span>FILME DE AMBIENTE · IMAGENS ILUSTRATIVAS</span>
          </div>
          @if (error()) { <p class="story-video-error" role="alert">{{ error() }}</p> }
        </div>
      </div>
    </section>
  `,
})
export class FilmComponent implements OnDestroy {
  readonly careers = input(false);
  readonly config = siteConfig;
  readonly playing = signal(false);
  readonly error = signal('');
  readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  async play(): Promise<void> {
    try {
      const element = this.video().nativeElement;
      // Sound is never started without a dedicated user action.
      element.muted = true;
      await element.play();
      this.playing.set(true);
      this.error.set('');
    } catch {
      this.videoError();
    }
  }

  stop(): void {
    const element = this.video().nativeElement;
    element.pause();
    element.currentTime = 0;
    this.playing.set(false);
  }

  videoError(): void {
    this.playing.set(false);
    this.error.set('Este vídeo não está disponível de momento. Os restantes conteúdos continuam acessíveis.');
  }

  ngOnDestroy(): void {
    this.video().nativeElement.pause();
  }
}
