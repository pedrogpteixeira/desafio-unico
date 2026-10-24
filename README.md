# Desafio Único — Angular + Netlify Forms

Migração independente do site inicial: Angular 22 standalone, TypeScript, CSS e Netlify Forms. Não depende de ChatGPT, Sites, React, Vinext, Cloudflare Workers, R2, API própria ou Supabase.

## Arranque local

Requisitos: Node 24.19.0 (ver `.nvmrc`) e npm. Em Windows podes instalar essa versão do Node diretamente; não é obrigatório usar nvm.

```bash
npm ci
npm start
```

Abrir o endereço indicado pelo Angular CLI (normalmente http://localhost:4200).

```bash
npm run build
npm run test:forms
```

O build de produção fica em `dist/desafio-unico/browser`. O projeto inclui `package-lock.json` para instalações reproduzíveis. `node_modules`, `dist` e caches não são distribuídos.

## Deploy na tua Netlify

1. Extrair o ZIP e colocar o conteúdo da pasta `desafio-unico-angular` na raiz de um repositório Git.
2. Na Netlify, importar esse repositório como um novo projeto.
3. O `netlify.toml` já define:
   - Build command: `npm run build`
   - Publish directory: `dist/desafio-unico/browser`
   - Node: `24.19.0`
4. No painel Netlify, abrir **Forms → Enable form detection**. Se o primeiro deploy já tiver terminado, fazer um novo deploy depois de ativar a deteção.
5. Confirmar que aparece o formulário **candidaturas**.
6. No endereço publicado, fazer uma candidatura de teste com um PDF fictício. Confirmar a receção no painel Forms, incluindo a pasta Spam e o anexo. A resposta HTTP de sucesso, por si só, não substitui esta confirmação.
7. Configurar as notificações por email no painel Netlify, caso sejam desejadas. Não há destinatário nem credenciais de email no código.

Alternativa: após `npm ci` e `npm run build`, pode ser feito deploy manual da pasta `dist/desafio-unico/browser`, o ficheiro `_redirects` incluído mantém as rotas da SPA. A importação do repositório é o fluxo recomendado e já configurado.

Não foi feito deploy na tua conta Netlify nem configurado domínio: essas operações dependem da tua conta/repositório. O site anterior no ChatGPT não foi modificado nem apagado.

## Como funciona o formulário

- Formulário Angular visível: `src/app/features/application.component.html`.
- Blueprint HTML estático: `public/netlify-forms.html`, copiado automaticamente para o build.
- Serviço de submissão: `src/app/core/netlify-form.ts`.
- Nome: `candidaturas`.
- Endpoint: `POST /netlify-forms.html`.
- FormData multipart, sem definir Content-Type manualmente (necessário para o boundary do ficheiro).
- Campo oculto `form-name=candidaturas`; honeypot `bot-field`.
- PDF até 5 MB, nome, email e autorização obrigatórios; telefone, URL e mensagem opcionais.
- O limite de 5 MB é uma regra de interface abaixo do limite de 8 MB por pedido atualmente documentado pela Netlify. As validações do browser não são validação de segurança do servidor.
- Em desenvolvimento/localhost, o formulário valida os campos mas não envia nem apresenta um sucesso fictício.
- Em caso de erro HTTP/rede, mantém os campos e o ficheiro; impede duplicação de cliques durante o envio. Em caso de timeout pode haver entrega sem confirmação, pelo que convém verificar o painel antes de reenviar um teste.
- `scripts/verify-forms.mjs` verifica no build se o HTML estático existe e se os campos correspondem ao Angular.

Ao adicionar um campo, atualizar o template Angular, o FormGroup, o tipo `ApplicationData`, o blueprint HTML e a verificação de campos. Não colocar chaves de API Netlify no frontend. As candidaturas são consultadas no painel Netlify, não numa página pública deste site.

## Candidaturas reais e privacidade

O texto de privacidade continua assinalado como demonstração. Antes de disponibilizar o formulário a candidatos reais, completar a identificação e contactos da empresa, finalidade/fundamento, destinatários, prazo de conservação e exercício de direitos, e definir quem tem acesso às submissões e como são eliminadas.

A documentação da Netlify indica que uploads contendo dados pessoais (como CVs) requerem configuração adicional de segurança e recomenda uma integração de proteção de dados. Essa integração NÃO está incluída neste projeto. O upload está implementado para testes, mas não deve ser tratado como um canal de documentos confidenciais pronto para produção. Validar a solução de segurança com a empresa antes de recolher CVs reais; alternativamente, remover o anexo do Angular e do blueprint e usar o campo de perfil/portefólio até existir um canal adequado.

As condições e limites de Forms dependem do plano Netlify. Confirmar o plano na conta; não se assume custo zero ou capacidade ilimitada.

## Alterar as vagas

Editar `src/app/data/jobs.ts`. Cada objeto tem:

- `id`: identificador único e estável;
- `title`: cargo;
- `area`: categoria (os filtros são calculados automaticamente);
- `place`: localização/modalidade;
- `type`: regime/condições;
- `profile`: resumo do perfil;
- `tasks`: responsabilidades;
- `skills`: requisitos.

Adicionar ou remover objetos atualiza os cards, a contagem e as opções do formulário. Com uma lista vazia, continua disponível a candidatura espontânea. Não há painel administrativo ou CMS nesta versão.

Em `src/app/data/site.config.ts`, manter `jobsAreExamples: true` até os cargos serem reais e aprovados. Depois definir `false`: desaparecem os avisos de exemplo e o botão de cada vaga passa a selecionar o cargo no formulário. Fazer commit e redeploy para publicar alterações.

## Marca, imagens e vídeo

- Cores, tipografia e responsividade: `src/styles.css`.
- Marca tipográfica provisória: `src/app/app.component.html`.
- Conteúdo e secções: `src/app/features/site-page.component.html`.
- Fotografias/vídeo: `src/app/data/site.config.ts`.
- Privacidade: `src/app/shared/privacy.component.ts`.
- Favicon: `public/favicon.svg`.

Os materiais atuais são ilustrativos, não fotografias da equipa. Para usar materiais próprios, colocar, por exemplo, `equipa.webp` e `filme.mp4` em `public/media/` e atualizar as URLs para `/media/equipa.webp` e `/media/filme.mp4`. Validar direitos de utilização dos materiais. As fontes usam Google Fonts; podem ser alojadas localmente se necessário.

O vídeo só começa após interação, tem pausa e controlos. As animações CSS respeitam `prefers-reduced-motion`. Os detalhes das vagas e a privacidade usam `<dialog>` nativo, com foco modal e fecho por Escape.

## Rotas e redirecionamentos

- `/`: página institucional.
- `/carreiras`: recrutamento e candidatura.
- `/netlify-forms.html`: ficheiro técnico estático de deteção/submissão (noindex).
- `/obrigado.html`: página de confirmação para submissão HTML nativa.
- Outras rotas: página 404 do Angular.

A regra `/* → /index.html` tem `force = false`, mantendo acessíveis os ficheiros estáticos e permitindo refresh direto em `/carreiras`. Como é uma SPA sem SSR/prerender, o HTML inicial não contém todo o conteúdo das páginas; SEO avançado/prerender pode ser acrescentado separadamente.

## Verificação realizada

- Build Angular de produção com compilação estrita dos templates.
- Blueprint de Forms presente no output e nomes dos campos iguais aos do Angular.
- Testes do payload multipart, PDF, erros HTTP e erros de rede, com fetch simulado.
- Nenhuma candidatura real foi enviada. A deteção e receção efetivas devem ser confirmadas após o primeiro deploy Netlify.

Referências técnicas consultadas:
- https://docs.netlify.com/manage/forms/setup/
- https://docs.netlify.com/manage/forms/troubleshooting-tips/
- https://angular.dev/reference/versions

## Revisão editorial e movimento — Outubro de 2026

A landing page tem agora uma secção de vídeo integrada entre a apresentação e as soluções, e a página de carreiras tem a sua própria secção de vídeo entre a cultura e as vagas. O vídeo é iniciado apenas quando o visitante clica; não existe autoplay nem som obrigatório. Os efeitos de entrada dependem de IntersectionObserver, respeitam `prefers-reduced-motion` e não escondem conteúdo sem JavaScript.

Para trocar os dois vídeos de demonstração, coloca os ficheiros aprovados em `public/media/` e altera `companyVideoUrl` e `careersVideoUrl` em `src/app/data/site.config.ts` (assim como `windImage` e `teamImage`, que servem de imagem estática). Os campos apontam temporariamente para o **mesmo vídeo externo de demonstração**. Antes de publicar, usar **dois vídeos diferentes e representativos** do trabalho da empresa: para a página institucional, planos energéticos/comerciais; para carreiras, pessoas/equipa/ambiente profissional. Exportar vídeos curtos, silenciosos ou com som opcional, com posterior otimizado, tamanho reduzido e direitos de uso confirmados. Evitar footage de instalação/manutenção de infraestruturas se a empresa trabalha apenas na vertente comercial.

O projeto continua com textos e ofertas de emprego editoriais que devem ser aprovados pela Desafio Único. Não publicar CVs reais sem concluir o texto de privacidade, a configuração de segurança da Netlify Forms e a política de conservação/acesso aos dados.

### Vulnerabilidade transitiva do Vite

A versão `@angular/build@22.2.4` utilizada no projeto prende uma versão vulnerável de Vite (no lock original, `vite@8.3.0`). Os avisos são relativos a ferramentas de desenvolvimento e **não significam, por si só, que o JavaScript estático servido na Netlify contenha esse código**. A correção de Vite foi lançada em `8.3.3`.

**No teu ambiente Windows, com Node compatível e acesso ao registo npm:**

```powershell
npm pkg set "overrides.vite=8.3.3"
npm install
npm ls vite
npm audit
npm run check
npm run build
npm run test:forms
```

O comando `npm install` tem de regenerar o `package-lock.json`; guardar/commitar o `package.json` **e** o novo `package-lock.json` juntos. Não usar `npm audit fix --force` sem uma revisão da alteração de versão do Angular builder. Depois de atualizar, confirmar se subsistem avisos diferentes e proceder caso a caso. Estes comandos de atualização **não foram executados neste pacote** por falta de acesso ao registo npm no ambiente de análise.


## Fase 2 — Soluções Repsol, contacto comercial e correções de layout

O website distingue agora **dois públicos**: particulares e empresas. Os exemplos editoriais de vagas em `src/app/data/jobs.ts` distinguem igualmente a vertente comercial para particulares e para empresas, continuando assinalados como exemplos até aprovação das oportunidades reais. Os cartões no segmento `#solucoes` permitem iniciar um pedido de informação e passam a seleção para o formulário `#contacto`. As opções comerciais apresentadas são **eletricidade**, **eletricidade e gás natural** ou **aconselhamento**; não há contratação isolada de gás nesta interface, nem simulações ou afirmações de poupança sem tarifas verificadas. A secção Repsol contém links oficiais para os dois segmentos.

**Precisão comercial:** a declaração de que a Desafio Único trabalha com a Repsol foi fornecida pelo cliente do projeto. Antes da publicação, confirmar com a Desafio Único a redação, a utilização da marca, a autorização comercial e quaisquer restrições de comunicação. Não são publicadas condições, preços, promoções ou percentagens temporárias. Não há logótipo oficial nem menção a “parceiro certificado”.

### Novo formulário de contactos

- Frontend: `src/app/features/lead.component.ts` e `src/app/features/lead.component.html`.
- Payload e submissão: `src/app/core/lead-form.ts`.
- Formulário Netlify: `pedidos-energia`, **independente** de `candidaturas`.
- Campos: nome, telefone, email, segmento, interesse, empresa (obrigatório apenas para segmento empresarial), mensagem, consentimento e honeypot `bot-field`.
- A validação impede pedidos incompletos; no localhost o formulário não envia nem finge um sucesso. Em produção, envia `POST /netlify-forms.html` com `application/x-www-form-urlencoded` e valida a resposta HTTP.
- `public/netlify-forms.html` inclui as **duas definições estáticas** para deteção pela Netlify. Após publicar, ativar Netlify Forms, executar novo deploy, confirmar os dois formulários no painel e testar com dados fictícios. Configurar destinatários/avisos no painel Netlify e controlar permissões e conservação separadamente para contatos e CVs.
- **Privacidade antes de produção:** completar o aviso de tratamento de dados com a identificação do responsável, base legal, prazos de conservação, destinatários, contactos e direitos, incluindo este novo formulário. Não recolher contactos comerciais reais com o aviso demonstrativo atual.

### Layout responsivo

- Hero: o título, subtítulo, botões e nota de rodapé permanecem no fluxo de layout flexível; o cartão técnico passa a fazer parte da grelha, deixando de poder sobrepor os botões ou o título.
- Tipografia: limite máximo da dimensão do `h1`, largura de texto controlada e comportamentos próprios para tablet/telemóvel; a composição mantém alinhamento em grandes resoluções.
- Ticker: duas sequências **idênticas** de seis frases repetidas cada uma, a deslizar exatamente a largura de uma sequência. Assim deixa de existir vazio lateral em 2560 × 1440 e a transição é contínua também em monitores mais largos.
- Acessibilidade: mantém-se a preferência `prefers-reduced-motion` e todos os botões têm ação e indicação de foco.

### Testes

```bash
npm ci
npm run check
npm run test:forms
npm run build
```

`npm run test:forms` cobre agora também o pedido comercial, o isolamento de dados do formulário de candidaturas e os erros HTTP. O script `scripts/verify-forms.mjs` valida a existência de **ambos** os formulários no output de produção. Nota: o build completo deve ser executado num ambiente com Node compatível com Angular 22 e dependências nativas da plataforma. A configuração anterior para a vulnerabilidade do Vite continua a exigir a regeneração local de `package-lock.json`, conforme instruções da Fase 1.
