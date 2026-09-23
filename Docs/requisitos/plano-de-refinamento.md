# Plano de refinamento geral — Yokai Tales / Digital Ghost

Este plano cruza o feedback semanal do professor, as documentações anteriormente enviadas e o estado local do repositório. “Preparado no código” não significa “demonstrado”: configuração remota do Supabase, deploy, publicação do jogo e evidências precisam de validação da equipe.

## Retorno do professor e resposta do projeto

| Semana / requisito | Feedback registrado | Refinamento nesta revisão | Ainda necessário |
|---|---|---|---|
| Semana 1 — RF-001 login | Protótipo de autenticação sem funcionalidade; primeira entrega usava Local Storage. | Login migrado para Supabase Auth; retiradas consultas de senha próprias e identidade montada via Local Storage. | Validar sessão no Supabase, contas e confirmação de e-mail; gerar evidência de demonstração. |
| Semana 1 — RF-002 cadastro | Cadastro apresentado parcialmente com Local Storage. | Cadastro migrado para `supabase.auth.signUp`, nome em metadado e validações de formulário. | Contas antigas em `Usuario` não são migradas automaticamente. Definir redefinição/recadastro e validar confirmação de e-mail. |
| Semana 2 — RF-002 gestão de usuário | Professor não conseguiu ver Create/Read/Update/Delete; registrou referência a Supabase/Node.js. | Create via Auth, Read do próprio perfil, Update de nome/senha via Auth e Delete próprio por API Node.js. Interface antiga que validava senha de administrador no navegador foi removida. | Publicar a API com segredo server-side e demonstrar C/R/U/D. |
| Semana 3 — RF-003 download | Protótipo avaliado em 90%; professor sugeriu controle/histórico de download; documentação marcada 0%/não entregue. | Criada documentação RF-003; incluído histórico de solicitações de download na migração e no fluxo quando houver release publicada. Link aleatório de mídia removido. | Arquivo do jogo ainda não existe; portanto não há download real possível. Definir release/URL e versão. Validar RLS e demonstrar. |
| Próximo requisito — RF-004 pagamentos | Feedback define gestão de pagamentos como próximo requisito. | Criado checkout simulado Standard (R$ 20) e Plus (R$ 40), persistência com estado acadêmico, sem coletar cartão e com histórico por usuário. | Executar migração Supabase, demonstrar as duas edições e anexar evidências. Não é transação financeira. |

## Ajustes na documentação

- Substituídos conteúdos copiados de hotelaria/combate que não correspondiam ao sistema de login/cadastro.
- Criadas documentações individuais para RF-001, RF-002, RF-003 e RF-004.
- Os pontos que dependem de ambiente externo ou comprovação são identificados como pendentes; não foram inventados links de deploy, artefatos, testes ou pontuações.
- Removida a regra do `.gitignore` que escondia a pasta `Docs` do Git.

## Ajustes técnicos locais

- Auth migrou para Supabase Auth; o cliente não compara nem persiste senhas em `localStorage`/tabela própria.
- Perfil lê/atualiza nome e senha pela sessão; API Node.js valida token e limita a exclusão à identidade autenticada.
- Compra simulada grava edição; trigger define usuário, valor, estado e horário.
- Políticas RLS separam pedidos por `auth.uid()`; cliente tem apenas leitura/criação, sem edição/exclusão de recibo.
- Migração desabilita acesso dos papéis web às antigas tabelas `Usuario`, `Cartao` e `Administrador` quando existirem, habilitando RLS sem políticas. Seguindo a orientação da equipe, **as linhas são preservadas e permanecem bloqueadas para acesso web**; nenhuma exclusão de dados foi feita.
- Interface deixa claro que não há cobrança e não pede número de cartão/CVV.
- História de pedidos e tentativas de download vinculadas ao usuário autenticado.
- O botão de download não promete arquivo inexistente; exige uma URL de release configurada.
- `README.md` agora informa configuração Supabase, aplicação do SQL e limitações conhecidas.

## Passos para concluir no ambiente da equipe

1. Revisar e executar `database/ddl/rf-004-simulated-payments.sql` no SQL Editor do Supabase. O script cria duas tabelas e triggers/policies, além de bloquear acesso browser às tabelas legadas sem apagar registros. Após executar, revisar o resultado e confirmar que a aplicação consegue inserir/consultar pedidos.
2. Conferir no painel que as tabelas antigas estão inacessíveis aos papéis web. Dados legados de `Usuario`/`Cartao` são preservados e bloqueados, conforme a decisão atual da equipe; eventual remoção deve ser discutida separadamente.
3. Verificar as configurações de Auth no painel (confirmação por e-mail e URLs de redirecionamento). Criar contas novas para teste; não publicar credenciais pessoais.
4. Publicar a API Node.js com secrets no ambiente server-side; nunca expor `SUPABASE_SERVICE_ROLE_KEY` no JavaScript ou Git.
5. Demonstrar cadastro, login, logout, perfil, atualização de nome/senha, exclusão própria, pedidos Standard/Plus, histórico e tentativas de acesso indevido entre duas contas.
6. Publicar o binário/release do jogo e então preencher `GAME_DOWNLOAD_URL` em `js/script.js`; testar histórico de download com um arquivo controlado.
7. O site já possui deploy no GitHub Pages: <https://rapha3lmendess.github.io/Digital-Web-Site/>. Publicar a API Node.js separadamente, informar sua URL, configurar `API_BASE_URL` e `ALLOWED_ORIGINS`, e validar as rotas no deploy HTTPS. `.env.example` já lista a origem do site para CORS.
8. Registrar screenshots/logs dos testes funcionais e OWASP, sem senhas, tokens, números de cartão ou dados pessoais.

## Status de conclusão

O refinamento local de documentação e código foi preparado nesta revisão. O site tem URL pública, mas o projeto ainda não pode ser declarado inteiramente conforme: depende da execução da migração, validação do Supabase remoto, publicação/configuração da API Node.js, arquivo real do jogo, evidências de demonstração e resolução segura dos dados legados.
