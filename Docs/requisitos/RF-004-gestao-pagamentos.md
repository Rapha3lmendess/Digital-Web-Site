# RF-004 — Gestão de pedidos e pagamentos simulados

> **Natureza:** protótipo acadêmico. Este requisito não processa pagamentos reais, não se conecta a provedor financeiro e não coleta dados de cartão. O termo “pagamento” designa o registro de um pedido simulado.

## 1. Metadados do requisito (2%)

| Campo | Valor |
|---|---|
| ID | RF-004 |
| Título | Gerir pedidos de compra das edições de Yokai Tales |
| Tipo | Requisito funcional |
| Prioridade | Alta — o feedback do professor identifica Gestão de Pagamentos como o próximo requisito. |
| Complexidade | Média, estimativa inicial de 5 story points; confirmar com a equipe. |
| Status | Em refinamento; código da simulação e configuração Vercel preparados. A migração Supabase, publicação Vercel e validação de ponta a ponta ainda precisam ser concluídas. |
| Criação / atualização | 23/09/2026 |
| Projeto | Digital Ghost Software — Yokai Tales |

### Metadados do projeto/equipe

- **Repositório informado nas entregas anteriores:** [AndreBlackDragon/YokaiTales-Webpage](https://github.com/AndreBlackDragon/YokaiTales-Webpage), branch `main`.
- **Supabase configurado no cliente:** projeto `thmtriwgvsgxdinsuxph` (endpoint configurado em `js/supabase-config.js`).
- **Deploy, Swagger/OpenAPI e demonstração pública:** não foram informados nas fontes.

| Integrante | Papel registrado nas entregas | Contato registrado |
|---|---|---|
| Andre Luis Macedo Nascimento | Back-end | andre58212086@edu.df.senac.br |
| Calebe Bezerra Feitosa | Marketing | calebe58107886@edu.df.senac.br |
| Douglas Rocha Vasco | Back-end / Modelagem | douglas58129016@edu.df.senac.br |
| Jonas Santos Barbosa | História / Marketing | jonas59300436@edu.df.senac.br |
| Letícia Lacerda Domingues | Dubladora | leticia49518826@edu.df.senac.br |
| Pedro Henrique Coelho Lima | Marketing | pedro57951426@edu.df.senac.br |
| Raphael Alves Mendes | Marketing / Modelagem | raphael59068396@edu.df.senac.br |
| Tiago de Andrade Lima | Modelagem de mapa | tiago59068726@edu.df.senac.br |

## 2. Descrição e atores (6%)

### Objetivo e contexto

Permitir que um usuário autenticado selecione uma edição do jogo, confirme um pedido acadêmico simulado e consulte seus próprios pedidos. O histórico registra edição, preço definido pelo banco, estado simulado e horário. Nenhuma cobrança ocorre. O pedido prevê acesso ao download quando o artefato do jogo estiver publicado.

Benefícios esperados: (1) demonstrar um fluxo de compra completo para avaliação; (2) manter histórico de pedidos associado ao usuário; (3) distinguir as edições e seus conteúdos/preços.

### Edições

| Edição | Preço simulado | Conteúdo informado |
|---|---:|---|
| Standard | R$ 20,00 | Jogo base Yokai Tales |
| Plus | R$ 40,00 | Jogo base, DLC e conteúdos adicionais |

### Atores e permissões

| Ator | Papel e responsabilidade | CRUD no escopo |
|---|---|---|
| Usuário autenticado | Seleciona a edição, confirma o pedido e consulta seu histórico. | Create e Read dos próprios pedidos. Não altera nem apaga registros de pedido. |
| Aplicação web | Exibe opções/estados, envia a edição selecionada e apresenta o recibo e a disponibilidade do download. | Solicita Create/Read; não define preço ou identidade do titular como fonte confiável. |
| Supabase Auth e banco PostgreSQL | Autentica a identidade, aplica RLS, determina o preço e persiste os pedidos. | Create/Read conforme políticas; sem atualização ou exclusão pelo cliente. |

Não há ator de provedor de pagamento: o escopo é simulado e não existe transação financeira.

## 3. Caso de uso e requisitos não funcionais (15%)

### UC-004 — Confirmar pedido simulado

**Pré-condições**

1. O site está servido por HTTP/HTTPS e o JavaScript modular carregou.
2. O usuário tem uma sessão válida do Supabase Auth.
3. A migração SQL do RF-004 foi executada e a tabela/políticas estão disponíveis.
4. O jogo apresenta as edições Standard e Plus.

**Fluxo principal**

1. O usuário acessa a página de compra.
2. A interface apresenta Standard por R$ 20,00 e Plus por R$ 40,00.
3. O usuário seleciona uma edição.
4. A interface atualiza o total exibido.
5. A página informa que a operação é acadêmica e não deve receber dados de cartão.
6. O usuário confirma o pedido simulado.
7. A aplicação obtém a sessão autenticada do Supabase.
8. A aplicação envia somente a edição para `POST /api/payments` com o token de sessão.
9. A API Node.js valida o token com Supabase Auth e encaminha a solicitação usando o JWT do próprio usuário.
10. O trigger PostgreSQL obtém `auth.uid()`, calcula o preço correspondente e define o estado `simulated_approved`.
11. A política RLS restringe o pedido ao usuário autenticado.
12. O Supabase persiste o pedido e retorna seu recibo.
13. A aplicação exibe confirmação, estado simulado e histórico de pedidos do usuário.
14. Se a URL de release estiver configurada, a interface apresenta o download; sem artefato publicado, informa que ele está pendente.

**Pós-condições**

- **Sucesso:** pedido simulado persistido e consultável somente pelo titular; sem movimentação financeira.
- **Falha:** nenhum recibo de sucesso é exibido; o usuário recebe orientação sobre sessão, rede ou configuração do banco.

**Fluxos alternativos**

- **A1 — Usuário sem sessão:** nenhum pedido é gravado; a interface pede login e preserva edição escolhida no retorno.
- **A2 — Edição ausente/inválida:** não envia a operação e solicita escolha entre Standard e Plus.
- **A3 — Banco, RLS ou rede indisponível:** não afirma sucesso e informa que a configuração do Supabase precisa ser verificada.
- **A4 — Arquivo de jogo ainda não publicado:** mostra pedido confirmado, mas mantém download indisponível e informa a pendência.

### Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Somente usuários autenticados podem registrar pedidos. |
| RN-02 | `standard` tem preço simulado fixo de R$ 20,00. |
| RN-03 | `plus` tem preço simulado fixo de R$ 40,00. |
| RN-04 | A edição é a única informação de checkout enviada pelo navegador; usuário, preço, estado e horário são determinados no banco. |
| RN-05 | Um usuário pode consultar somente os próprios pedidos. |
| RN-06 | O estado criado é `simulated_approved`; o registro não representa pagamento real e não pode ser alterado/apagado pelo cliente. |
| RN-07 | O pedido não libera arquivo inexistente; download real depende de release publicada e URL configurada. |

### Requisitos não funcionais

| ID | Atributo | Requisito | Critério de verificação |
|---|---|---|---|
| RNF-01 | Segurança | RLS separa pedidos por `auth.uid()` e o banco calcula valor/estado. | Teste com duas contas e tentativa de forjar preço/usuário/estado. Pendente de execução após aplicar SQL. |
| RNF-02 | Usabilidade | Estados vazio, seleção, processamento, erro e confirmação são claros e acessíveis. | Conferir mensagens e navegação por teclado; revisão visual ainda pendente. |
| RNF-03 | Responsividade | Checkout utilizável em 320 px e desktop 1024 px. | Verificação nessas larguras ainda pendente. |
| RNF-04 | Integridade | Cada confirmação bem-sucedida gera registro consultável com preço correto. | Conferir recibo e linha persistida no Supabase após aplicar a migração. |

## 4. Protótipo funcional (50%)

### Artefatos

- Interface: `paginas/download.html`.
- Fluxo e apresentação: `js/script.js` e `paginas/download.html`.
- API Node.js para autenticar operações e consultar/criar pedidos: `server/index.js` (`GET/POST /api/payments`, `POST /api/downloads`).
- Estilo responsivo do checkout: `css/style.css`.
- Migração PostgreSQL/RLS: `database/ddl/rf-004-simulated-payments.sql`.
- Configuração pública do cliente Supabase: `js/supabase-config.js`.

### Estados planejados no protótipo

1. **Inicial/vazio:** sem pedidos na conta.
2. **Seleção:** escolha Standard/Plus e total correspondente.
3. **Processando:** botão bloqueado enquanto grava.
4. **Erro:** sessão inválida, falha de rede ou banco não configurado.
5. **Sucesso:** pedido simulado persistido e recibo exibido.
6. **Download pendente:** estado de sucesso sem link do jogo ainda publicado.

O código local implementa a interface e o fluxo para estados acima. A integração real depende da execução da migração e de uma sessão Supabase configurada; não há evidência de deploy ou de teste ponta a ponta nesta entrega.

### Dado persistido

`simulated_payments`: UUID do pedido, UUID do usuário autenticado, edição, valor em BRL, estado `simulated_approved` e data/hora. `game_downloads` mantém a solicitação, a versão e o horário, vinculada a um pedido do mesmo usuário. A aplicação não grava número, nome ou código de cartão.

## 5. Arquitetura e ADR (15%)

### Diagrama e fluxo

```mermaid
flowchart LR
  U[Usuário autenticado] --> UI[Checkout HTML/CSS]
  UI --> JS[JavaScript modular]
  JS --> AUTH[Supabase Auth]
  JS --> API[API Node.js]
  API --> DATA[Supabase Data API com token do usuário]
  DATA --> RLS{RLS: auth.uid()}
  RLS --> DB[(simulated_payments)]
  DB --> TRG[Trigger calcula preço e estado]
  TRG --> DB
  DB --> UI
  UI -. release futura .-> FILE[Arquivo do jogo ainda não publicado]
```

### ADR-004-01 — Simulação sem provedor financeiro

- **Status:** Aceito para o protótipo acadêmico.
- **Contexto:** o professor solicitou Gestão de Pagamentos; a equipe definiu que não haverá cobrança real.
- **Decisão:** confirmar pedido simulado diretamente no Supabase, sem pedir dados de cartão.
- **Alternativas:** integração com gateway real; formulários que coletam dados de cartão. Ambas fora do escopo atual.

### ADR-004-02 — Preço calculado no PostgreSQL

- **Status:** Proposto no script SQL; pendente de execução no projeto Supabase.
- **Contexto:** valores informados pelo navegador podem ser adulterados.
- **Decisão:** trigger escolhe R$ 20 ou R$ 40 conforme edição e define o estado simulado.
- **Alternativas:** confiar no preço enviado pela tela; endpoint próprio de backend.

### ADR-004-03 — RLS por usuário autenticado

- **Status:** Proposto no script SQL; pendente de validação.
- **Contexto:** histórico precisa ser isolado entre contas.
- **Decisão:** permitir insert/select autenticado e restringir linhas por `auth.uid()`; cliente não recebe update/delete.
- **Alternativas:** tabela aberta anonimamente; controle só na interface. Ambas insuficientes para isolamento.

### ADR-004-04 — Registro de pedido imutável

- **Status:** Aceito para a simulação.
- **Contexto:** não há liquidação, estorno ou gateway; o histórico é evidência acadêmica.
- **Decisão:** usuário pode criar e consultar pedidos, mas não editar ou excluir recibos.
- **Alternativas:** permitir edição/exclusão ao cliente; adicionar fluxo administrativo de cancelamento em requisito futuro.

### Tecnologias

| Componente | Tecnologia | Motivo |
|---|---|---|
| UI | HTML5/CSS3 | Formulário sem dados financeiros reais e adaptação para telas pequenas. |
| Lógica | JavaScript ES Modules | Fluxo de sessão, seleção, mensagens e consulta do pedido. |
| API | Node.js | Valida identidade Supabase, encaminha operações e isola credenciais administrativas. |
| Autenticação e API | Supabase Auth/Data API | Identidade autenticada e persistência gerenciada já escolhida pela equipe. |
| Banco | PostgreSQL no Supabase | Trigger, constraints e RLS aplicam preço/estado e isolamento. |

## 6. Segurança OWASP (12%)

| Risco | Implementação no protótipo | Teste/evidência necessário |
|---|---|---|
| A01 — Broken Access Control: leitura de pedido/download alheio | Políticas RLS limitam pedidos e solicitações de download a `auth.uid()`; trigger exige pedido aprovado do próprio usuário. | Criar duas contas e tentar ler/gravar pedido/download usando ID da outra. Aguardar aplicação da migração; teste não executado. |
| A04 — Insecure Design / exposição de dados de cartão | Checkout simulado não pede nem persiste PAN, CVV ou nome de titular. | Inspecionar formulário, chamadas de rede e tabela; não inserir cartões reais. Evidência visual ainda pendente. |
| A05 — Authentication Failures / preço adulterado | Supabase Auth; trigger sobrescreve titular, preço, estado e horário. | Tentar enviar preço/estado/usuário adulterados e confirmar que o banco aplica valores definidos; pendente de execução. |
| A03 — Injection | Edição limitada por constraint; acesso à tabela via API estruturada do Supabase, sem SQL concatenado no cliente. | Enviar valor de edição fora do conjunto permitido e confirmar rejeição. Teste não executado. |

Os controles estão descritos em código/migração, mas a validação em ambiente Supabase, screenshots/logs e demonstração ainda são necessários para alegar aprovação OWASP.

## 7. Checklist de atendimento e pendências

| Tópico | Estado |
|---|---|
| T1 — Identificação (2%) | Preenchido; estimativa de complexidade deve ser validada pela equipe. |
| T2 — Descrição e atores (6%) | Objetivo, três atores e CRUD definidos. |
| T3 — Casos de uso/RNF (15%) | Pré/pós-condições, 12 passos, quatro alternativos, sete regras e quatro RNF. |
| T4 — Protótipo (50%) | HTML/JS/SQL e configuração Vercel incluídos; SQL ainda precisa ser executado; deploy, integração e arquivo do jogo ainda não foram confirmados. |
| T5 — Arquitetura/ADR (15%) | Diagrama, fluxo e quatro ADRs descritos. |
| T6 — OWASP (12%) | Quatro controles e planos de teste descritos; falta executar e anexar evidência. |

**Nota:** não foi atribuída pontuação. O critério de protótipo exige execução funcional, deploy e evidência; documentação isolada não prova esses itens.

## 8. Critérios de aceite

- [ ] A migração SQL é executada no Supabase sem erro.
- [ ] Duas contas conseguem criar pedido e cada uma só vê seu próprio histórico de pedidos/downloads.
- [ ] Standard sempre persiste R$ 20,00 e Plus R$ 40,00, mesmo se a requisição adulterar valor.
- [ ] Nenhum formulário/tabela solicita ou guarda dados de cartão.
- [ ] Os estados de interface são demonstrados em tela pequena e desktop.
- [ ] Publicar e validar site/API integrados na Vercel.
- [ ] Release do jogo é publicada e `GAME_DOWNLOAD_URL` recebe o endereço real antes de prometer download.
- [ ] Evidências dos testes de segurança e da demonstração são anexadas.

**Fontes usadas:** feedback do professor, documentações RF-001/RF-002 fornecidas, `requisitos.md` v15, código e estrutura local do projeto, além das decisões informadas pelo usuário. Nenhuma fonte externa foi usada.
