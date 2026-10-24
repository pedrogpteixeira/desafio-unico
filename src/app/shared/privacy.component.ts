import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
@Component({selector:'du-privacy',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,template:`
<dialog #dialog class="modal native-modal" aria-labelledby="privacy-title">
<button class="close" autofocus (click)="dialog.close()">Fechar ×</button>
<h2 id="privacy-title">A tua privacidade</h2>
<p>Existem dois formulários independentes. Os pedidos de contacto de energia recolhem nome, telefone, email, tipo de cliente, interesse comercial e eventuais informações facultativas para dar seguimento ao pedido. As candidaturas recolhem os dados submetidos e o CV para análise de recrutamento. Com Netlify Forms ativo, ambos são processados pela Netlify.</p>
<p><strong>Versão de demonstração:</strong> antes de recolher contactos comerciais ou candidaturas reais, a empresa deve completar esta informação com a identificação do responsável pelo tratamento, finalidade e fundamento, destinatários, prazo de conservação e contacto para exercício dos direitos. Até lá, utiliza apenas dados de teste.</p>
<p>As fotografias e o vídeo são ilustrativos, carregados de serviços externos (Unsplash e Pexels). As fontes são carregadas do Google Fonts. Estas imagens não representam a equipa da Desafio Único.</p>
</dialog>`})
export class PrivacyComponent {
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  open(): void { this.dialog().nativeElement.showModal(); }
}
