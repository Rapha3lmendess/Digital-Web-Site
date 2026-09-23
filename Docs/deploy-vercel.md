# Publicação do site e da API na Vercel

## O que muda

A integração Vercel mantém o site estático e a API Node.js no mesmo projeto e na mesma origem. A API local continua disponível por `npm start`; no GitHub Pages o site continua sendo publicado a partir da raiz como antes. Para a publicação Vercel, `npm run build` copia apenas os arquivos públicos para `dist/`, enquanto a função em `api/[...path].js` encaminha as rotas para o handler compartilhado em `server/index.js`.

## Antes de publicar

- A branch `codex/rf004-refinement` precisa estar enviada ao GitHub para poder ser selecionada na importação.
- É necessário obter do responsável pelo projeto Supabase a URL do projeto e a chave publishable/anon. A publishable key não é senha, mas a chave secreta/`service_role` nunca deve entrar no navegador, Git ou mensagens.
- O checkout, o histórico e a leitura de perfil usam a chave pública com o JWT do usuário e RLS. A API inicia sem `SUPABASE_SERVICE_ROLE_KEY`; sem ela, apenas a exclusão de conta retorna indisponível. Para habilitar exclusão, o responsável Supabase deve adicionar a chave secreta ao ambiente do servidor Vercel.
- A migração `database/ddl/rf-004-simulated-payments.sql` ainda precisa ser aplicada no Supabase.

## Criar o projeto Vercel

1. Importe o repositório GitHub no painel Vercel e selecione `codex/rf004-refinement` como branch de produção enquanto o refinamento é validado.
2. Use a raiz do repositório como Root Directory e o preset **Other**.
3. Defina Build Command como `npm run build` e Output Directory como `dist`. O projeto usa Node.js `22.x` conforme `package.json`.
4. Em **Settings → Environment Variables**, configure para Production e Preview:
   - `SUPABASE_URL`: URL do projeto no Supabase.
   - `SUPABASE_PUBLISHABLE_KEY`: chave publishable (ou `SUPABASE_ANON_KEY` legado).
   - `ALLOWED_ORIGINS`: mantenha a origem do GitHub Pages se ele também consumirá a API. Para a UI hospedada no mesmo projeto Vercel, o handler aceita a própria origem.
   - `SUPABASE_SERVICE_ROLE_KEY`: opcional; só preencher se a exclusão de conta precisar funcionar. Cadastre no painel como variável sensível, nunca no repositório.
5. Faça o primeiro deploy e abra `/api/health` no domínio atribuído. A resposta esperada é `{"status":"ok"}`.
6. Teste login, pedido Standard/Plus e histórico usando contas de teste. Configure a URL Vercel em Supabase Auth → URL Configuration/redirect URLs se o projeto usar confirmação por e-mail.

## Manter o site GitHub Pages

O deploy Vercel pode coexistir com <https://rapha3lmendess.github.io/Digital-Web-Site/>. Para o site GitHub Pages usar a API Vercel, após conhecer o domínio Vercel:

1. Defina `API_BASE_URL` em `js/supabase-config.js` com a origem Vercel, por exemplo `https://nome-do-projeto.vercel.app` (sem `/api`).
2. Em Vercel, inclua a origem `https://rapha3lmendess.github.io` em `ALLOWED_ORIGINS`.
3. Publique a alteração do frontend no GitHub Pages e teste o fluxo com sessão autenticada.

## Referências oficiais

- [Vercel: Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel: Builds estáticos](https://vercel.com/docs/builds)
- [Vercel: variáveis de ambiente](https://vercel.com/docs/environment-variables)
- [Supabase: segurança das chaves de API](https://supabase.com/docs/guides/database/secure-data)

## Limites conhecidos

- O arquivo real do jogo continua indisponível; publicar a aplicação não cria a release nem habilita o download.
- A URL final Vercel e os valores do Supabase são definidos no painel pela equipe; não são inventados ou gravados neste repositório.
- Sem a chave secreta fornecida pelo responsável Supabase, exclusão de conta fica explicitamente indisponível; as demais rotas continuam iniciando.
