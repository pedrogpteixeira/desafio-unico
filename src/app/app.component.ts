import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PrivacyComponent } from './shared/privacy.component';
import { siteConfig } from './data/site.config';
@Component({selector:'du-root', standalone:true, imports:[RouterLink,RouterLinkActive,RouterOutlet,PrivacyComponent], templateUrl:'./app.component.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly previewIndexBlocked = this.doc.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content.includes('noindex') ?? false;
  readonly contact = siteConfig.contact;
  readonly menu = signal(false);
  // Do not render the shared footer until the lazy route has activated.
  // Otherwise it briefly appears directly below the header and shifts down.
  readonly initialRouteReady = signal(false);
  readonly year = new Date().getFullYear();

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.syncRouteMetadata();
      this.initialRouteReady.set(true);
    });
  }

  private syncRouteMetadata(): void {
    const path = this.router.url.split(/[?#]/)[0];
    const careers = /^\/carreiras\/?$/.test(path);
    const unknown = path !== '/' && !careers;
    this.meta.updateTag({ name: 'robots', content: this.previewIndexBlocked || unknown ? 'noindex,nofollow' : 'index,follow' });
    if (unknown) {
      this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
      this.meta.removeTag('property="og:url"');
      return;
    }
    const description = careers
      ? 'Conhece a Desafio Único, descobre o nosso espírito de equipa e envia uma candidatura espontânea para oportunidades no setor energético.'
      : 'Na Desafio Único ajudamos particulares e empresas a conhecer soluções de eletricidade e gás natural, com acompanhamento comercial próximo e esclarecimento de dúvidas.';
    const ogTitle = careers ? 'Carreiras | Desafio Único' : 'Desafio Único | Energia para Casa e Empresas';
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: careers
      ? 'Conhece a nossa cultura de equipa e apresenta a tua candidatura à Desafio Único.'
      : 'Eletricidade e gás natural para particulares e empresas, com acompanhamento comercial da Desafio Único.' });

    // Keep the canonical/OG URL in sync when Angular navigates without a reload.
    // Preview deployments and unconfigured local builds do not have an SEO origin.
    const origin = this.doc.head.querySelector<HTMLMetaElement>('meta[name="seo:site-origin"]')?.content;
    if (!origin || this.previewIndexBlocked) return;
    const url = `${origin}${careers ? '/carreiras/' : '/'}`;
    let canonical = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.doc.createElement('link');
      canonical.rel = 'canonical';
      this.doc.head.appendChild(canonical);
    }
    canonical.href = url;
    this.meta.updateTag({ property: 'og:url', content: url });
  }
}
