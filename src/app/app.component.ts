import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PrivacyComponent } from './shared/privacy.component';
import { siteConfig } from './data/site.config';
@Component({selector:'du-root', standalone:true, imports:[RouterLink,RouterLinkActive,RouterOutlet,PrivacyComponent], templateUrl:'./app.component.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class AppComponent {
  readonly contact = siteConfig.contact;
  readonly menu = signal(false);
  readonly year = new Date().getFullYear();
}
