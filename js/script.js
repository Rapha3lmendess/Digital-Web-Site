import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, API_BASE_URL } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const GAME_DOWNLOAD_URL = ""; // Configure when a release file is available.
const $ = (selector) => document.querySelector(selector);

async function apiRequest(path, { method = "GET", body } = {}) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) throw new Error("Authentication required");
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            ...(body === undefined ? {} : { "Content-Type": "application/json" })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "API request failed");
    return result;
}

function showMessage(element, message, kind = "info") {
    if (!element) return;
    element.textContent = message;
    element.dataset.state = kind;
}

function setBusy(form, busy, buttonLabel) {
    const button = form?.querySelector('[type="submit"]');
    if (!button) return;
    if (busy) {
        button.dataset.originalLabel = button.textContent.trim();
        button.disabled = true;
        button.textContent = buttonLabel;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalLabel || buttonLabel;
    }
}

async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return user;
}

async function updateNavigation() {
    const logoutButton = $("#logoutButton");
    if (!logoutButton) return;
    try {
        logoutButton.hidden = !(await getCurrentUser());
    } catch (error) {
        console.error("Não foi possível carregar a sessão.", error);
        logoutButton.hidden = true;
    }
}

const logoutButton = $("#logoutButton");
logoutButton?.addEventListener("click", async () => {
    logoutButton.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error(error);
        logoutButton.disabled = false;
        return;
    }
    window.location.href = window.location.pathname.includes("/paginas/")
        ? "login.html"
        : "paginas/login.html";
});

void updateNavigation();

const signupForm = $("#formCadastro");
signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("#nome_usuario").value.trim();
    const email = $("#email_usuario").value.trim();
    const password = $("#senha_usuario").value;
    const confirmation = $("#confirmar").value;
    const message = $("#mensagemCadastro");

    if (!name || !email || !password || !confirmation) {
        showMessage(message, "Preencha todos os campos.", "error");
        return;
    }
    if (password !== confirmation) {
        showMessage(message, "As senhas não coincidem.", "error");
        return;
    }
    if (password.length < 8) {
        showMessage(message, "A senha deve ter pelo menos 8 caracteres.", "error");
        return;
    }

    setBusy(signupForm, true, "Criando conta…");
    showMessage(message, "Criando sua conta…");
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
    });
    setBusy(signupForm, false);

    if (error) {
        showMessage(message, error.message, "error");
        return;
    }
    const confirmationRequired = !data.session;
    showMessage(
        message,
        confirmationRequired
            ? "Conta criada. Confirme o e-mail antes de entrar."
            : "Conta criada com sucesso. Redirecionando para o login…",
        "success"
    );
    if (!confirmationRequired) {
        window.setTimeout(() => { window.location.href = "login.html"; }, 900);
    }
});

const loginForm = $("#formLogin");
loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("#loginEmail").value.trim();
    const password = $("#loginSenha").value;
    const message = $("#mensagemLogin");
    if (!email || !password) {
        showMessage(message, "Digite e-mail e senha para entrar.", "error");
        return;
    }

    setBusy(loginForm, true, "Entrando…");
    showMessage(message, "Validando acesso…");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(loginForm, false);
    if (error) {
        showMessage(message, "Não foi possível entrar. Confira os dados e a confirmação do e-mail.", "error");
        return;
    }
    showMessage(message, "Login realizado. Redirecionando…", "success");
    const query = new URLSearchParams(window.location.search);
    const returnToPurchase = query.get("return") === "purchase";
    const edition = query.get("edition");
    const destination = returnToPurchase && purchasePlans[edition]
        ? `download.html?edition=${encodeURIComponent(edition)}`
        : "perfil.html";
    window.setTimeout(() => { window.location.href = destination; }, 500);
});

const profileCard = $(".profile-card");
if (profileCard) {
    const loadProfile = async () => {
        let profile;
        try {
            profile = await apiRequest("/api/profile");
        } catch {
            window.location.replace("login.html");
            return;
        }
        const name = profile.full_name || "Usuário";
        const heading = $(".profile-card h1");
        const spans = $(".profile-info")?.querySelectorAll("div span");
        if (heading) heading.textContent = name.toLocaleUpperCase("pt-BR");
        if (spans?.[0]) spans[0].textContent = name;
        if (spans?.[1]) spans[1].textContent = profile.email || "";
    };
    void loadProfile();
}

const passwordForm = $("#formAlterarSenha");
const nameModal = $("#modalNome");
const nameForm = $("#formNome");
$("#abrirModalNome")?.addEventListener("click", () => {
    const userName = $(".profile-info div span")?.textContent || "";
    $("#novoNome").value = userName;
    if (nameModal) nameModal.hidden = false;
    $("#novoNome")?.focus();
});
$("#fecharModalNome")?.addEventListener("click", () => {
    if (nameModal) nameModal.hidden = true;
});
nameModal?.addEventListener("click", (event) => {
    if (event.target === nameModal) nameModal.hidden = true;
});
nameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("#novoNome").value.trim();
    const message = $("#mensagemNome");
    if (name.length < 2) {
        showMessage(message, "Informe pelo menos dois caracteres.", "error");
        return;
    }
    setBusy(nameForm, true, "Salvando…");
    let result;
    try {
        result = await apiRequest("/api/profile", { method: "PATCH", body: { full_name: name } });
    } catch (error) {
        setBusy(nameForm, false);
        showMessage(message, error.message, "error");
        return;
    }
    setBusy(nameForm, false);
    const heading = $(".profile-card h1");
    const spans = $(".profile-info")?.querySelectorAll("div span");
    if (heading) heading.textContent = name.toLocaleUpperCase("pt-BR");
    if (spans?.[0]) spans[0].textContent = result.full_name || name;
    showMessage(message, "Nome atualizado.", "success");
});

const deleteModal = $("#modalExclusao");
const deleteForm = $("#formExclusaoConta");
$("#abrirModalExclusao")?.addEventListener("click", () => {
    if (deleteModal) deleteModal.hidden = false;
    $("#confirmarExclusao")?.focus();
});
$("#fecharModalExclusao")?.addEventListener("click", () => {
    if (deleteModal) deleteModal.hidden = true;
});
deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) deleteModal.hidden = true;
});
deleteForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#mensagemExclusao");
    if ($("#confirmarExclusao").value.trim() !== "EXCLUIR") {
        showMessage(message, "Digite EXCLUIR para confirmar.", "error");
        return;
    }
    const user = await getCurrentUser().catch(() => null);
    if (!user?.email) {
        showMessage(message, "Entre novamente para excluir a conta.", "error");
        return;
    }
    setBusy(deleteForm, true, "Excluindo…");
    const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: $("#senhaConfirmarExclusao").value
    });
    if (reauthError) {
        setBusy(deleteForm, false);
        showMessage(message, "Senha atual inválida. A conta não foi excluída.", "error");
        return;
    }
    let deleteError = null;
    try {
        await apiRequest("/api/account/delete", { method: "POST" });
    } catch (error) {
        deleteError = error;
    }
    setBusy(deleteForm, false);
    if (deleteError) {
        console.error("Falha na exclusão da conta.", deleteError);
        showMessage(message, "Não foi possível excluir. Confira se a API Node.js está publicada e configurada.", "error");
        return;
    }
    await supabase.auth.signOut();
    window.location.replace("../index.html");
});

const passwordModal = $("#modalSenha");
$("#abrirModalSenha")?.addEventListener("click", () => {
    if (passwordModal) passwordModal.hidden = false;
    $("#novaSenha")?.focus();
});
$("#fecharModalSenha")?.addEventListener("click", () => {
    if (passwordModal) passwordModal.hidden = true;
});
passwordModal?.addEventListener("click", (event) => {
    if (event.target === passwordModal) passwordModal.hidden = true;
});
passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("#novaSenha").value;
    const confirmation = $("#confirmarNovaSenha").value;
    const message = $("#mensagemSenha");
    if (password.length < 8) {
        showMessage(message, "A senha deve ter pelo menos 8 caracteres.", "error");
        return;
    }
    if (password !== confirmation) {
        showMessage(message, "As senhas não coincidem.", "error");
        return;
    }
    setBusy(passwordForm, true, "Atualizando…");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(passwordForm, false);
    showMessage(message, error ? "Não foi possível atualizar a senha." : "Senha atualizada.", error ? "error" : "success");
    if (!error) passwordForm.reset();
});

const purchaseList = $("#purchaseList");
const purchaseMessage = $("#purchaseMessage");
const purchasePlans = {
    standard: { label: "Standard", value: 20 },
    plus: { label: "Plus", value: 40 }
};

function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function renderOrder(order, target, downloadHistory = []) {
    const article = document.createElement("article");
    article.className = "purchase-receipt";
    const title = document.createElement("h3");
    title.textContent = `Yokai Tales — ${purchasePlans[order.edition]?.label || order.edition}`;
    const details = document.createElement("p");
    details.textContent = `${formatBRL(Number(order.amount_brl))} · Pedido simulado · ${new Date(order.created_at).toLocaleString("pt-BR")}`;
    const status = document.createElement("p");
    status.className = "purchase-status";
    status.textContent = "Pedido confirmado para fins acadêmicos. Nenhuma cobrança foi realizada.";
    article.append(title, details, status);
    const orderDownloads = downloadHistory.filter((item) => item.payment_id === order.id);
    if (orderDownloads.length) {
        const history = document.createElement("p");
        history.textContent = `Solicitações de download: ${orderDownloads.length} (última: ${new Date(orderDownloads[0].requested_at).toLocaleString("pt-BR")})`;
        article.append(history);
    }

    const download = document.createElement("a");
    download.className = "btn-primary";
    if (GAME_DOWNLOAD_URL) {
        download.href = GAME_DOWNLOAD_URL;
        download.setAttribute("download", "");
        download.textContent = "BAIXAR JOGO";
        download.addEventListener("click", async (event) => {
            event.preventDefault();
            download.setAttribute("aria-disabled", "true");
            try {
                await apiRequest("/api/downloads", { method: "POST", body: { payment_id: order.id } });
            } catch (error) {
                console.error("Não foi possível registrar a solicitação de download.", error);
                showMessage(purchaseMessage, "Não foi possível registrar o download. Tente novamente.", "error");
                download.removeAttribute("aria-disabled");
                return;
            }
            window.location.assign(GAME_DOWNLOAD_URL);
        });
    } else {
        download.href = "#download-not-ready";
        download.textContent = "ARQUIVO DO JOGO PENDENTE";
        download.setAttribute("aria-disabled", "true");
        download.addEventListener("click", (event) => {
            event.preventDefault();
            showMessage(purchaseMessage, "O pedido foi registrado, mas o arquivo de download ainda não foi publicado.", "error");
        });
    }
    article.append(download);
    target.append(article);
}

async function loadPurchaseHistory() {
    if (!purchaseList) return;
    purchaseList.replaceChildren();
    let result;
    try {
        result = await apiRequest("/api/payments");
    } catch (error) {
        showMessage(purchaseMessage, `${error.message}. Confira a API Node.js e a migração Supabase.`, "error");
        return;
    }
    if (!result.payments.length) {
        showMessage(purchaseMessage, "Nenhum pedido registrado nesta conta.");
        return;
    }
    for (const order of result.payments) renderOrder(order, purchaseList, result.downloads);
}

if ($("#purchaseForm")) {
    const purchaseForm = $("#purchaseForm");
    const editionInput = $("#edition");
    const priceOutput = $("#editionPrice");
    const updatePrice = () => {
        const plan = purchasePlans[editionInput.value];
        priceOutput.textContent = plan ? formatBRL(plan.value) : "Selecione uma versão";
    };
    const requestedEdition = new URLSearchParams(window.location.search).get("edition");
    if (purchasePlans[requestedEdition]) editionInput.value = requestedEdition;
    editionInput.addEventListener("change", updatePrice);
    updatePrice();

    purchaseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const user = await getCurrentUser().catch(() => null);
        if (!user) {
            const loginLink = $("#purchaseLoginLink a");
            if (loginLink) {
                loginLink.href = `login.html?return=purchase&edition=${encodeURIComponent(editionInput.value)}`;
                $("#purchaseLoginLink").hidden = false;
            }
            showMessage(purchaseMessage, "Entre na sua conta para registrar o pedido.", "error");
            return;
        }
        const edition = editionInput.value;
        if (!purchasePlans[edition]) {
            showMessage(purchaseMessage, "Escolha uma versão válida.", "error");
            return;
        }

        setBusy(purchaseForm, true, "Confirmando pedido…");
        showMessage(purchaseMessage, "Registrando a simulação…");
        let order;
        let orderError;
        try {
            order = await apiRequest("/api/payments", { method: "POST", body: { edition } });
        } catch (error) {
            orderError = error;
        }
        setBusy(purchaseForm, false);

        if (orderError) {
            console.error("Falha ao registrar o pedido simulado.", orderError);
            showMessage(purchaseMessage, `${orderError.message}. Confira a API Node.js e a migração Supabase.`, "error");
            return;
        }
        showMessage(purchaseMessage, `Pedido confirmado: ${formatBRL(Number(order.amount_brl))}.`, "success");
        await loadPurchaseHistory();
    });

    void getCurrentUser().then((user) => {
        const loginLink = $("#purchaseLoginLink");
        if (loginLink) {
            loginLink.hidden = Boolean(user);
            const anchor = loginLink.querySelector("a");
            if (anchor) anchor.href = `login.html?return=purchase&edition=${encodeURIComponent(editionInput.value)}`;
        }
        if (user) void loadPurchaseHistory();
    }).catch((error) => {
        console.error("Não foi possível verificar a sessão.", error);
    });
}
