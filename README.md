# João Paulo & Paloma · 10 de abril de 2027

Landing page em React/Vite e JavaScript, CSS tradicional, Lucide, Google Apps Script e Cloudflare Pages Functions. As duas capas originais foram preservadas. Nenhuma alteração foi feita na planilha durante o desenvolvimento.

## Executar

Requer Node.js 22.12 ou superior (recomendado Node 24) e acesso ao registro npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço informado pelo Vite, normalmente `http://127.0.0.1:5173`. No Windows com scripts PowerShell desabilitados, use `npm.cmd`; não é necessário mudar a política do sistema. Em outros sistemas, `npm` funciona normalmente.

O Vite local abre em **modo demonstrativo** por padrão: um presente identificado como exemplo, recomendações vazias e Pix desabilitado. Os botões de envio são desabilitados; nenhuma gravação ou confirmação é simulada. Esse modo só funciona com `import.meta.env.DEV`, portanto nunca é ativado no build de produção. A opção `VITE_DEMO_MODE=false` em `.env.local` permite desativá-lo no Vite, mas o Vite sozinho não executa Pages Functions.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`preview` serve o build estático, sem backend. Para testes completos use `pages:dev` conforme abaixo.

## Arquivos e conteúdo

- `src/data/wedding.js`: nomes, data com offset UTC-03, locais, URLs Maps, horários, história, linha do tempo e galeria. Os links Maps iniciais são **pesquisas pelo nome e cidade**, não coordenadas verificadas. Substitua-os pelos links oficiais quando disponíveis. Recepção sem horário inventado.
- `src/components/`: Header, Footer, Modal acessível, GiftCard, GiftSelectionModal e utilitários de formulário.
- `src/sections/`: Hero, WeddingCountdown, OurStory, PhotoGallery, WeddingLocations, Hotels e MakeupArtists (em Recommendations), GiftRegistry, PixGift e RSVPForm.
- `src/hooks/useWeddingData.js`: consultas, atualização a cada 60 segundos quando presentes estão visíveis e ao recuperar foco.
- `src/services/api.js`: cliente com timeout, mensagens de erro e modo demonstrativo.
- `src/utils/`: validação e geração de payload Pix BR Code/CRC16.
- `src/styles/global.css`: cores centralizadas, fontes, layouts mobile-first, foco, contraste e movimento reduzido.
- `functions/api/wedding.js`: proxy de servidor, proteção de origem, validação, limite de corpo e segredo.
- `apps-script/Code.gs` e `appsscript.json`: backend da planilha e manifesto com Sheets API v4.
- `tests/`: testes de regras e contratos do backend, sem acessar serviços reais.
- `public/_headers`, `_routes.json`, `wrangler.toml`: configuração de hospedagem.

As capas já existem em `public/images/capa-mobile.png` e `capa-desktop.png`. A composição inteira é exibida sem texto sobreposto: as artes já contêm os nomes. Não há fotografias falsas. Crie `public/images/galeria/` e adicione fotografias reais, depois preencha `photos` em `wedding.js`, por exemplo:

```js
photos: [
  { src: '/images/galeria/01.jpg', alt: 'Descrição real desta fotografia', width: 1200, height: 1600 },
],
```

Use as dimensões reais, mantenha a ordem desejada e prefira fotos comprimidas em WebP/JPEG. A galeria preserva proporções; o modal suporta setas, Escape, Tab e retorno do foco. A história provisória está identificada e sua linha do tempo vem desativada até ser preenchida pelos noivos.

## Conectar a planilha existente

Use exclusivamente a planilha fornecida: `https://docs.google.com/spreadsheets/d/1GqFTftQ0MBzt9N4SsRbUq5X4aZoCGmz90QeHFekKOuc/edit`. O ID está fixado no Apps Script. Não publique a planilha na internet, não habilite compartilhamento público e não crie outra para presentes.

1. Abra essa planilha com a conta dos noivos e acesse **Extensões → Apps Script**, criando um script vinculado à planilha. Isso permite usar o menu administrativo seguro.
2. Copie `apps-script/Code.gs` para o editor.
3. Em configurações, habilite a exibição do manifesto `appsscript.json`; substitua seu conteúdo pelo arquivo deste projeto. Ele define `America/Bahia`, runtime V8 e o serviço avançado Sheets v4. Alternativamente, adicione **Google Sheets API v4** em Serviços. Se utilizar um projeto Google Cloud próprio, habilite também Google Sheets API no console desse projeto.
4. Nas **Propriedades do script**, cadastre `SHARED_SECRET` com um segredo aleatório de pelo menos 32 caracteres. Gere localmente, por exemplo, com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Não salve o valor no repositório e não o envie no chat.
5. Execute **`configurarInicial`** manualmente no editor e autorize a conta. Ela verifica os cabeçalhos existentes antes de qualquer escrita, preenche somente cabeçalhos ausentes, acrescenta abas ausentes e configurações Pix ausentes. Não limpa dados nem substitui abas. `Como preencher` não é modificada. Se um cabeçalho existente divergir, a execução interrompe para revisão, sem substituir o conteúdo.
6. Recarregue a planilha: aparecerá o menu **Casamento**. A execução inicial adiciona `Confirmacoes`, `Hoteis` e `Maquiadores` se ainda não existirem. Não modifica o fuso da planilha existente; os registros usam texto ISO com offset explícito `-03:00`.
7. Vá a **Implantar → Nova implantação → Aplicativo da Web**. Execute como **sua conta**, acesso **Qualquer pessoa**. Essa disponibilidade permite à Function acessar a aplicação; os dados continuam protegidos pelo segredo no corpo de todas as operações. O `doGet` não retorna dados. Se a organização proibir esse acesso, será necessário ajustar a política com o administrador da conta.
8. Copie a URL final **`https://script.google.com/macros/s/…/exec`**, nunca `/dev`. Cadastre-a apenas no servidor como `APPS_SCRIPT_URL`. Cadastre o mesmo segredo como `APPS_SCRIPT_SECRET`.
9. Depois de alterar o código, gerencie a implantação e selecione uma **nova versão**, mantendo a URL.

O código usa LockService e uma chamada atômica de Sheets `batchUpdate` para atualizar status e acrescentar histórico juntos. Não remova o serviço avançado do manifesto. Referências: [LockService](https://developers.google.com/apps-script/reference/lock/), [serviços avançados](https://developers.google.com/apps-script/guides/services/advanced), [batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate).

## Administração das abas

### Presentes e Escolhas

Mantenha os cabeçalhos A:O existentes exatamente como estão. Cada presente precisa de um **ID único e permanente**, nome e `Exibir no site? = Sim`. Status vazio é tratado como disponível sem reescrever o item. `Disponível` habilita escolha, `Escolhido` impede escolha. Status desconhecido bloqueia a escolha por segurança. IDs duplicados também ficam bloqueados; corrija-os na planilha. Preço deve ser numérico, formatado em reais no Sheets; imagens e links devem ser URLs HTTPS públicas.

As colunas K, M, N e O não são retornadas ao navegador. Não coloque informações privadas em descrições ou observações públicas de serviços. `Escolhas` registra ID, produto, convidado, contato, data, ação e um identificador privado de pedido em Observações internas. Esse identificador garante reenvio sem duplicação após uma falha de rede. O site não confirma compra.

**Desistência:** na planilha, abra **Casamento → Liberar presente com histórico**, informe ID e motivo. Somente editores autorizados da planilha podem executar essa rotina. Ela exige status Escolhido, limpa M:O, libera o presente e registra a liberação com o motivo no histórico sob o mesmo lock. Não altere L manualmente para liberar: isso não produz histórico. O endpoint público não aceita ações administrativas. Restrinja acesso de edição às pessoas necessárias.

### Hoteis

`Nome | Imagem | Endereço | Telefone | WhatsApp | Link de referência | Observações`

### Maquiadores

`Nome | Imagem | Especialidade | Telefone | WhatsApp | Instagram | Observações`

WhatsApp: código do país + DDD + número, só dígitos, por exemplo no formato `55DDDNÚMERO` (não use um número fictício). Formate telefone e WhatsApp como **texto simples** para preservar símbolos e zeros. Instagram aceita URL HTTPS ou `@usuario`. Exclua a linha para remover a recomendação; linhas sem nome não aparecem. Essas abas são públicas por intenção: obtenha autorização para exibir contatos e fotos dos profissionais. URLs de imagens devem apontar ao arquivo público, não à página de edição do Drive.

### Pix

A estrutura existente é preservada: `Configuração | Valor | Orientação`. Preencha os valores das linhas `Habilitar Pix no site?`, `Chave Pix`, `Nome do recebedor`, `Cidade do recebedor`, `Valores sugeridos (R$)` e `Mensagem`. Só troque habilitação para `Sim` depois de revisar tudo. Valores sugeridos: `50, 100, 200`, separados por vírgula ou ponto e vírgula; para centavos nesta configuração use ponto decimal, por exemplo `50.50; 100; 200`.

Nome e cidade são normalizados para maiúsculas sem acentos, com limites de 25 e 15 caracteres do BR Code. Se excederem os limites, o Pix fica indisponível até corrigir a configuração. A chave pode ser e-mail, CPF/CNPJ sem pontuação, telefone no formato internacional `+55…` ou chave aleatória UUID. Para CPF/CNPJ, formate o valor como texto simples. Não há verificação bancária da titularidade: **os noivos precisam testar a chave e conferir o recebedor** antes de habilitar.

O payload é calculado no navegador com valor, CRC16 e txid `***`; `qrcode` gera a imagem localmente, sem serviço de QR externo. A chave Pix é necessariamente pública quando habilitada. Não há webhook nem confirmação bancária. Antes de publicar, escaneie com um aplicativo bancário e compare recebedor, valor e Copia e Cola, **sem necessidade de concluir pagamento**. Consulte o [manual oficial Pix do Banco Central](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf).

### Confirmacoes

`Identificador da resposta | Data e hora | Nome completo | Comparecerá? | Quantidade de adultos | Quantidade de crianças | E-mail | Telefone | Observações`

O site gera UUID aleatório e o mantém no localStorage deste navegador. Reenvios com esse identificador atualizam a mesma linha sob lock. O ID funciona como uma capacidade privada: não existe consulta pública de respostas, busca por contato ou lista de convidados. Limpar o armazenamento, trocar aparelho ou navegador cria outra resposta; nesse caso os noivos podem revisar duplicatas manualmente. Para responder por outra família, use outro perfil/navegador. Não é autenticação de identidade nem uma lista restrita de convidados. Nenhum dado pessoal é salvo no navegador, exceto o identificador aleatório.

## Testar as Functions localmente

1. Copie `.env.example` para `.dev.vars` e mantenha apenas `APPS_SCRIPT_URL` e `APPS_SCRIPT_SECRET` com os valores reais.
2. Execute `npm.cmd run pages:dev` (compila e inicia Wrangler).
3. Abra o endereço informado pelo Wrangler, normalmente `http://localhost:8788`. O build usa integração real; sem configuração, mostra erro explicativo, nunca sucesso fictício.
4. Os envios locais apontam à planilha real. Use IDs de teste explícitos e remova/revise somente suas linhas de teste depois. Nunca use dados pessoais de terceiros em testes.

As Pages Functions são executadas por Wrangler, não por Vite. Referência: [desenvolvimento local](https://developers.cloudflare.com/pages/functions/local-development/).

## Publicar no Cloudflare Pages

1. Coloque o projeto em seu repositório Git, sem `.env`, `.dev.vars` nem segredos.
2. No Cloudflare, crie projeto **Pages**, conecte o repositório e configure comando **`npm run build`**, saída **`dist`**, raiz do projeto esta pasta e Node 24 (`NODE_VERSION=24`).
3. Em **Settings → Variables and Secrets**, cadastre `APPS_SCRIPT_URL` e `APPS_SCRIPT_SECRET` como secrets para **Production** e **Preview**, se desejar testar previews. Não use prefixo `VITE_`.
4. Faça o deploy. A pasta `functions/` na raiz é compilada junto pelo Pages. O `_routes.json` limita execução das Functions a `/api/*`. Não use upload manual de apenas `dist` pelo painel: esse fluxo não inclui as Functions.
5. Alternativa CLI: após autenticar com `npx wrangler login`, execute `npm run build` e `npx wrangler pages deploy dist` a partir da raiz para incluir Functions. Configure os secrets no projeto correspondente.
6. Escolha seu domínio e, em `index.html`, transforme `og:image` em URL HTTPS absoluta da capa desktop e adicione `og:url`/canonical com o domínio real. A arte original já serve como imagem de compartilhamento; não foi inventado domínio. Favicon editável em `public/favicon.svg`.
7. Em configurações de Functions, prefira **fail closed** para as rotas de API se o limite de execução for atingido. Não configure cache para `/api/*`. A API envia `Cache-Control: no-store` e não retorna nomes de convidados.
8. Faça o roteiro de aceitação abaixo antes de distribuir no WhatsApp.

Referências: [Functions](https://developers.cloudflare.com/pages/functions/get-started/), [bindings e variáveis](https://developers.cloudflare.com/pages/functions/bindings/), [configuração Wrangler](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

## Proteção e limites

Somente quatro ações públicas são permitidas (`public`, `availability`, `choose`, `rsvp`). Origem é validada; não há CORS liberado. Corpo limitado a 12 KB, validação nos dois servidores, campos obrigatórios e limites de tamanho, honeypot e intervalo mínimo de preenchimento. O Apps Script limita pedidos por hash de IP sob lock, via CacheService (8 gravações ou 90 leituras por janela deslizante aproximada de 60s). O IP bruto não é enviado à planilha. CacheService pode remover entradas antecipadamente: essa proteção é básica, não uma garantia contra ataques distribuídos. Se necessário, adicione regras de rate limiting do Cloudflare para `/api/wedding`. Usuários na mesma rede compartilham limite de IP. Textos enviados são gravados como stringValue e não executam fórmulas.

Segredos só existem na Function e nas propriedades do script. Restringir edição da planilha também é essencial: mudanças manuais podem ocorrer fora do lock do Apps Script. O serviço depende das quotas e disponibilidade do Google e do Cloudflare. Não há monitoramento ou integração bancária.

## Testes e situação da entrega

`npm test` executa os testes de contagem com offset, validação, BR Code/CRC16, privacidade, bloqueio, gravação atômica, idempotência, falhas, RSVP, IDs duplicados, ações não permitidas e proxy. Os testes do Apps Script usam **mocks em memória**: não substituem testes no Google e não comprovam o funcionamento de quotas, permissões ou concorrência real da plataforma.

Nesta sessão, **14 testes passaram** com Node. A sintaxe de 25 arquivos JS, JSX e CSS foi verificada com esbuild disponível no cache local. `npm install` não pôde acessar `registry.npmjs.org` porque a rede do shell está bloqueada; consequentemente `npm run build` foi tentado e falhou porque Vite ainda não está instalado. **Build, inspeção visual em navegador, leitura pela aplicação publicada, gravações reais e leitura bancária do QR Code permanecem pendentes.** A leitura dos cabeçalhos da planilha pelo conector foi realizada; isso não configura o backend nem publica o Apps Script.

Roteiro após instalar e configurar:

1. `npm run build` deve terminar sem erros. Execute `npm test` e `npm run pages:dev`.
2. Teste larguras 320, 375, 390, 768 e 1440 px: sem rolagem horizontal, capa inteira, botões confortáveis, menu aberto/fechado por teclado e Escape. Use movimento reduzido e navegação Tab.
3. Confira o contador em `2027-04-10T20:00:00Z` e depois: mensagem do grande dia, sem negativos (o relógio depende do dispositivo).
4. Adicione fotos reais e confira carregamento, ampliação, setas, Escape, ciclo de Tab e retorno do foco.
5. RSVP: testar contato ausente/inválido, zero adultos, crianças negativas, Não (pessoas ocultas e zeros no servidor), Sim (1/0 iniciais), envio, falha de rede e reenvio no mesmo navegador. Verifique uma única linha por identificador e mensagens somente após registro.
6. Cadastre presente de teste com ID único e `Sim`; confira categorias, faixas, preço, imagem e loja. Itens `Não` não aparecem. Status vazio é disponível e não é reescrito só pela consulta.
7. Em dois navegadores, tente escolher o mesmo item: apenas um deve gravar, o outro deve receber conflito. Reenvie após interrupção de rede: uma única escolha/histórico. Verifique L:O e a aba Escolhas; confirme ausência de dados privados na resposta de `/api/wedding`.
8. Use o menu administrativo para liberar; verifique histórico e disponibilidade após atualizar/focar a página. Teste escolha depois da liberação com novo pedido.
9. Atualize hotéis e profissionais pela planilha; refaça foco/consulta. Confira links reais de Maps, telefone, WhatsApp e Instagram. Teste abas vazias e falha de integração.
10. Pix desabilitado/sem chave não oferece cobrança. Habilitado, confira R$ 50/100/200 e valor personalizado, QR lido no banco, código copiado e recebedor correto; nunca deve surgir confirmação de pagamento.
11. Confirme compartilhamento no WhatsApp com URLs absolutas e contraste/foco em dispositivo real.
