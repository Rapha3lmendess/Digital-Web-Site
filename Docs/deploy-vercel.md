# Publicação do site e da API na Vercel

## O que muda

A integração Vercel publica o site estático e a API Node.js no mesmo projeto e na mesma origem. A API local continua disponível por `npm start`. Para a publicação Vercel, `npm run build` copia apenas os arquivos públicos para `dist/`, enquanto a função em `api/[...path].js` encaminha as rotas para o handler compartilhado em `server/index.js`.

## Antes de publicar

- A branch `codex/rf004-refinement` precisa estar enviada ao GitHub para poder ser selecionada na importação.
- A URL base Supabase é `https://thmtriwgvsgxdinsuxph.supabase.co`. O valor fornecido com `/rest/v1/` é uma rota REST; não use o sufixo em `SUPABASE_URL`. URL e chave publishable/anon já estão em `js/supabase-config.js`; a API Node.js usa esses valores como padrão. As variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` na Vercel são opcionais, para sobrescrever esses defaults.
- A publishable key não é senha, mas a chave secreta/`service_role` nunca deve entrar no navegador, Git ou mensagens.
- O checkout, o histórico e a leitura de perfil usam a chave pública com o JWT do usuário e RLS. A API inicia sem `SUPABASE_SERVICE_ROLE_KEY`; sem ela, apenas a exclusão de conta retorna indisponível. Para habilitar exclusão, um administrador do projeto pode copiar a chave secreta em Supabase → Project Settings → API Keys e cadastrá-la diretamente nas variáveis da Vercel. Ele não precisa enviá-la para você nem para este repositório.
- A migração `database/ddl/rf-004-simulated-payments.sql` ainda precisa ser aplicada no Supabase.

## Criar o projeto Vercel

1. No terminal, na raiz do repositório, envie a branch: `git push -u origin codex/rf004-refinement`.
2. Entre no painel da Vercel, escolha **Add New → Project**, conecte o GitHub se necessário e importe o repositório do projeto. Selecione `codex/rf004-refinement` como Production Branch deste novo projeto. Isso publica esta branch na Vercel; não altera `master`/`main` nem o deploy GitHub Pages.
3. Nas opções do projeto, use a raiz do repositório como Root Directory e o preset **Other**. Defina Build Command como `npm run build` e Output Directory como `dist`; mantenha o comando de instalação padrão (`npm install`). O projeto usa Node.js `22.x` conforme `package.json`.
4. Em **Settings → Environment Variables**, configure para Production e Preview somente `SUPABASE_SERVICE_ROLE_KEY` caso queira habilitar exclusão de conta. Cadastre como variável sensível; nunca no repositório. Sem acesso a ela, o site e as demais rotas ainda podem usar os valores públicos já presentes em `js/supabase-config.js`, mas a exclusão de conta permanecerá indisponível.
5. Não configure `ALLOWED_ORIGINS` nem `API_BASE_URL` no deploy integrado. A UI chama `/api/...` na própria origem.
6. Clique em **Deploy**. Abra `https://DOMINIO-ATRIBUIDO.vercel.app/api/health`; a resposta esperada é `{"status":"ok"}`. Se configurar ou alterar uma variável depois do primeiro deploy, faça novo deploy para que ela entre em vigor.
7. No Supabase SQL Editor, aplique `database/ddl/rf-004-simulated-payments.sql` antes de testar checkout e histórico.
8. Em Supabase Auth → URL Configuration, defina a URL Vercel de produção como Site URL. Adicione `https://DOMINIO-ATRIBUIDO.vercel.app/paginas/login.html` à lista de Redirect URLs. O cadastro envia o link de confirmação para a página de login no mesmo domínio do formulário; se usar previews, adicione um padrão de redirect Preview restrito à equipe, conforme a [documentação Supabase](https://supabase.com/docs/guides/auth/redirect-urls).
9. Teste login, pedido Standard/Plus e histórico com contas de teste. Para atender exclusão de conta, confirme com o responsável Supabase que `SUPABASE_SERVICE_ROLE_KEY` está configurada e teste a exclusão de uma conta de teste.

## Referências oficiais

- [Vercel: Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel: Builds estáticos](https://vercel.com/docs/builds)
- [Vercel: variáveis de ambiente](https://vercel.com/docs/environment-variables)
- [Supabase: segurança das chaves de API](https://supabase.com/docs/guides/database/secure-data)

## Limites conhecidos

- O arquivo real do jogo continua indisponível; publicar a aplicação não cria a release nem habilita o download.
- A URL final Vercel é definida no painel; não é inventada ou gravada neste repositório.
- Sem a chave secreta fornecida pelo responsável Supabase, exclusão de conta fica explicitamente indisponível; as demais rotas continuam iniciando.
