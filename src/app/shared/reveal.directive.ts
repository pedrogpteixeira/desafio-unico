import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Progressive enhancement: without JS or with reduced motion, content stays visible. */
@Directive({ selector: '[duReveal]', standalone: true })
export class RevealDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const element = this.element.nativeElement;
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        element.classList.add('reveal-visible');
        observer.disconnect();
      }, { rootMargin: '0px 0px -25px 0px', threshold: 0.08 });

      element.classList.add('reveal-enter');
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
