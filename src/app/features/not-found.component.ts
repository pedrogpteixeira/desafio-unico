import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({standalone:true,imports:[RouterLink],template:`<section class="section"><span class="label">404</span><h1>Parece que este caminho<br>ficou sem energia.</h1><p>A página que procuras não existe.</p><a routerLink="/" class="button lime">Voltar ao início ↗</a></section>`})
export class NotFoundComponent {}
