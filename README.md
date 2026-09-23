# Digital Ghost Software — Yokai Tales

Site acadêmico de apresentação do estúdio fictício Digital Ghost Software e do jogo Yokai Tales. O projeto usa HTML, CSS, JavaScript, Node.js e Supabase. O checkout é uma **simulação acadêmica**: não processa pagamentos nem coleta dados de cartão.

## Funcionalidades no projeto

- Páginas de apresentação, cadastro, login, perfil e compra/download.
- Cadastro e autenticação com Supabase Auth.
- Pedidos simulados das edições Standard (R$ 20,00) e Plus (R$ 40,00).
- Registro/histórico de pedidos e solicitações de download no Supabase, limitados ao usuário autenticado por RLS.
- Troca de senha pela sessão autenticada.

## API Node.js

`server/index.js` verifica o bearer token do Supabase Auth. Rotas: `GET /api/profile`, `GET/POST /api/payments`, `POST /api/downloads` e `POST /api/account/delete`. Consultas de perfil/pedido/download usam o JWT do usuário e mantêm as políticas RLS; a atualização do nome usa Supabase Auth no cliente. `server/local.js` inicia o servidor HTTP local; a chave administrativa é opcional e só é usada para exclusão da identidade autenticada.

## Deploy

Esta branch está configurada para publicar site estático e API Node.js no mesmo projeto Vercel. Consulte [`Docs/deploy-vercel.md`](Docs/deploy-vercel.md) para importar a branch, definir build/variáveis e validar o deploy. `API_BASE_URL` fica vazio para as chamadas `/api/...` permanecerem na mesma origem. A chave `SUPABASE_SERVICE_ROLE_KEY` é opcional para iniciar a API e necessária para exclusão de conta.

## Configuração

1. Configure o projeto Supabase indicado em `js/supabase-config.js` e mantenha no cliente somente a chave publicável/anon. Nunca coloque uma `service_role` key no repositório.
2. No painel do Supabase, execute [`database/ddl/rf-004-simulated-payments.sql`](database/ddl/rf-004-simulated-payments.sql) no SQL Editor. O script cria a tabela de pedidos, política RLS e cálculo autoritativo dos valores.
3. Habilite a autenticação por e-mail no Supabase. Para cadastro sem confirmação, ajuste a confirmação de e-mail no painel; caso ela permaneça habilitada, o usuário deve confirmar o e-mail antes do login.
4. Execute `npm install` com Node.js 22.x e copie `.env.example` para `.env`. URL e chave publishable do Supabase já são lidas de `js/supabase-config.js`; use variáveis de ambiente apenas para sobrescrevê-las. `SUPABASE_SERVICE_ROLE_KEY` só é necessária para exclusão de conta e fica exclusivamente no servidor.
5. Inicie a API Node.js com `npm start`. Ela valida o token do usuário; exclusão de conta exige `SUPABASE_SERVICE_ROLE_KEY` no servidor e só permite excluir a própria conta.
6. Sirva a pasta do site por um servidor HTTP estático. Os módulos JavaScript e chamadas Supabase não devem ser executados abrindo páginas como `file://`.
7. Um arquivo público do jogo ainda não foi disponibilizado. Quando houver uma URL estável de release, configure `GAME_DOWNLOAD_URL` em `js/script.js`; até lá o pedido é registrado, mas o botão de download informa que o arquivo está pendente.

## Estrutura

```text
.
├── database/ddl/          # SQL do RF-004
├── Docs/requisitos/       # Documentação por requisito funcional
├── css/style.css
├── imagens/
├── js/script.js           # Auth, perfil e checkout simulado
├── js/supabase-config.js  # URL e chave publicável
├── paginas/
├── server/index.js        # Handler compartilhado pela Vercel e execução local
├── server/local.js        # Servidor HTTP para desenvolvimento local
├── api/[...path].js       # Adaptador da API para Vercel Functions
├── scripts/build-static.js # Gera os arquivos estáticos da Vercel em dist/
├── vercel.json            # Build e diretório estático Vercel
├── .env.example           # Modelo das variáveis server-side
└── index.html
```

## Documentação

- [RF-001 — Login](Docs/requisitos/RF-001-login.md)
- [RF-002 — Cadastro de usuário](Docs/requisitos/RF-002-cadastro-usuario.md)
- [RF-003 — Gerenciar download do jogo](Docs/requisitos/RF-003-gerenciar-download-do-jogo.md)
- [RF-004 — Gestão de pagamentos](Docs/requisitos/RF-004-gestao-pagamentos.md)
- [Plano de refinamento e pendências](Docs/requisitos/plano-de-refinamento.md)
- [Publicação na Vercel](Docs/deploy-vercel.md)

## Limites desta versão

O banco Supabase precisa receber a migração SQL e ser configurado no painel. A migração bloqueia acesso web às tabelas legadas `Usuario`, `Cartao` e `Administrador`, caso existam, mas preserva os registros atuais sem os apagar. Embora o site tenha URL pública, ainda falta a URL pública da API Node.js e o arquivo do jogo; portanto, a integração no deploy e o download real não estão confirmados. A simulação não representa uma transação financeira.
