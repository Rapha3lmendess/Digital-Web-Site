/*
====================================================
    YOKAI TAILS - JAVASCRIPT

    Este arquivo controla:
    - Cadastro de usuarios
    - Login
    - Verificacao de senha
    - Redirecionamento

    Os usuarios sao armazenados na tabela "Usuario"
    do Supabase.
====================================================
*/

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
} from "./supabase-config.js";

const USUARIO_LOGADO_KEY = "usuarioLogadoEmail";
const LINK_DOWNLOAD = "https://www.google.com/";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function mostrarMensagem(elemento, texto, cor) {
    if (!elemento) return;
    elemento.innerText = texto;
    elemento.style.color = cor;
}

/*
====================================================
                CADASTRO
====================================================
*/

const formCadastro = document.getElementById("formCadastro");

if (formCadastro) {
    formCadastro.addEventListener("submit", async function(event) {
        event.preventDefault();

        const usuario = document.getElementById("nome_usuario").value.trim();
        const email = document.getElementById("email_usuario").value.trim();
        const senha = document.getElementById("senha_usuario").value;
        const confirmaSenha = document.getElementById("confirmar").value;
        const mensagem = document.getElementById("mensagemCadastro");

        if (!usuario || !email || !senha || !confirmaSenha) {
            mostrarMensagem(mensagem, "Preencha todos os campos antes de continuar.", "#ff5c6c");
            return;
        }

        if (senha !== confirmaSenha) {
            mostrarMensagem(mensagem, "As senhas nao sao iguais.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Criando conta...", "#ffffff");

        const { data: usuarioExistente, error: erroBusca } = await supabase
            .from("Usuario")
            .select("nome_usuario")
            .eq("nome_usuario", usuario)
            .maybeSingle();

        if (erroBusca) {
            console.error(erroBusca);
            mostrarMensagem(mensagem, "Erro ao verificar usuario.", "#ff5c6c");
            return;
        }

        if (usuarioExistente) {
            mostrarMensagem(mensagem, "Esse usuario ja existe.", "#ff5c6c");
            return;
        }

        const { error: erroCadastro } = await supabase
            .from("Usuario")
            .insert({
                nome_usuario: usuario,
                email_usuario: email,
                senha_usuario: senha
            });

        if (erroCadastro) {
            console.error(erroCadastro);
            mostrarMensagem(mensagem, "Erro ao criar conta.", "#ff5c6c");
            return;
        }

        

        mostrarMensagem(mensagem, "Cadastro realizado com sucesso!", "#72e6a5");

        setTimeout(function() {
            window.location.href = "login.html";
        }, 1000);
    });
}

/*
====================================================
                LOGIN
====================================================
*/

const formLogin = document.getElementById("formLogin");

if (formLogin) {
    formLogin.addEventListener("submit", async function(event) {
        event.preventDefault();

        const usuario = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value;
        const mensagem = document.getElementById("mensagemLogin");

        if (!usuario || !senha) {
            mostrarMensagem(mensagem, "Digite e-mail e senha para entrar.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Entrando...", "#ffffff");

        const { data: usuarioEncontrado, error: erroLogin } = await supabase
            .from("Usuario")
            .select("nome_usuario, email_usuario, senha_usuario")
            .eq("email_usuario", usuario)
            .eq("senha_usuario", senha)
            .maybeSingle();

        if (erroLogin) {
            console.error(erroLogin);
            mostrarMensagem(mensagem, "Erro ao fazer login.", "#ff5c6c");
            return;
        }

        if (!usuarioEncontrado) {
            mostrarMensagem(mensagem, "Usuario ou senha incorretos.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Login realizado com sucesso!", "#72e6a5");

        localStorage.setItem(USUARIO_LOGADO_KEY, usuarioEncontrado.email_usuario);
        localStorage.setItem("usuarioLogadoNome", usuarioEncontrado.nome_usuario);

        setTimeout(function() {
            window.location.href = "perfil.html";
        }, 1000);
    });
}

const downloadButton = document.getElementById("downloadButton");
const downloadModal = document.getElementById("downloadModal");
const closeDownloadModal = document.getElementById("closeDownloadModal");
const formDownloadLogin = document.getElementById("formDownloadLogin");

function abrirLinkDownload() {
    window.location.href = LINK_DOWNLOAD;
}

function fecharModalDownload() {
    if (downloadModal) {
        downloadModal.hidden = true;
    }
}

if (downloadButton) {
    downloadButton.addEventListener("click", function() {
        if (localStorage.getItem(USUARIO_LOGADO_KEY)) {
            abrirLinkDownload();
            return;
        }

        downloadModal.hidden = false;
        document.getElementById("downloadLoginEmail").focus();
    });
}

if (closeDownloadModal) {
    closeDownloadModal.addEventListener("click", fecharModalDownload);
}

if (downloadModal) {
    downloadModal.addEventListener("click", function(event) {
        if (event.target === downloadModal) {
            fecharModalDownload();
        }
    });
}

if (formDownloadLogin) {
    formDownloadLogin.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("downloadLoginEmail").value.trim();
        const senha = document.getElementById("downloadLoginSenha").value;
        const mensagem = document.getElementById("mensagemDownload");

        mostrarMensagem(mensagem, "Confirmando login...", "#ffffff");

        const { data: usuarioEncontrado, error: erroLogin } = await supabase
            .from("Usuario")
            .select("nome_usuario, email_usuario, senha_usuario")
            .eq("email_usuario", email)
            .eq("senha_usuario", senha)
            .maybeSingle();

        if (erroLogin) {
            console.error(erroLogin);
            mostrarMensagem(mensagem, "Erro ao fazer login.", "#ff5c6c");
            return;
        }

        if (!usuarioEncontrado) {
            mostrarMensagem(mensagem, "Usuario ou senha incorretos.", "#ff5c6c");
            return;
        }

        localStorage.setItem(USUARIO_LOGADO_KEY, usuarioEncontrado.email_usuario);
        localStorage.setItem("usuarioLogadoNome", usuarioEncontrado.nome_usuario);
        abrirLinkDownload();
    });
}

async function carregarPerfilUsuario() {
    const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);

    if (!emailLogado) {
        window.location.href = "login.html";
        return;
    }

    const nomePerfil = document.querySelector(".profile-card h1");
    const nomeSpan = document.querySelector(".profile-info div:nth-of-type(1) span");
    const emailSpan = document.querySelector(".profile-info div:nth-of-type(2) span");

    if (!nomePerfil || !nomeSpan || !emailSpan) {
        return;
    }

    const { data: usuario, error } = await supabase
        .from("Usuario")
        .select("nome_usuario, email_usuario")
        .eq("email_usuario", emailLogado)
        .maybeSingle();

    if (error) {
        console.error(error);
        nomePerfil.innerText = "USUÁRIO";
        nomeSpan.innerText = "Não foi possível carregar";
        emailSpan.innerText = emailLogado;
        return;
    }

    if (!usuario) {
        nomePerfil.innerText = "USUÁRIO";
        nomeSpan.innerText = "Usuário não encontrado";
        emailSpan.innerText = emailLogado;
        return;
    }

    nomePerfil.innerText = usuario.nome_usuario.toUpperCase();
    nomeSpan.innerText = usuario.nome_usuario;
    emailSpan.innerText = usuario.email_usuario;
}

if (document.querySelector(".profile-card")) {
    carregarPerfilUsuario();
}
