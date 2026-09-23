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
const logoutButton = document.getElementById("logoutButton");
const LINK_DOWNLOAD = "https://imgs.search.brave.com/P8kr9IV17POo-OX4dYjQyc9_bpKRWvaM4UWrlIGrvVI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/aWNlZ2lmLmNvbS93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyMy8w/MS9pY2VnaWYtMTY1/LmdpZg.gif";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

if (logoutButton) {
    logoutButton.hidden = !localStorage.getItem(USUARIO_LOGADO_KEY);

    logoutButton.addEventListener("click", function() {
        localStorage.removeItem(USUARIO_LOGADO_KEY);
        localStorage.removeItem("usuarioLogadoNome");

        const paginaLogin = window.location.pathname.includes("/paginas/")
            ? "login.html"
            : "paginas/login.html";

        window.location.href = paginaLogin;
    });
}

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
const cartaoModal = document.getElementById("cartaoModal");
const fecharCartaoModal = document.getElementById("fecharCartaoModal");
const formCadastroCartao = document.getElementById("formCadastroCartao");
const abrirModalSenha = document.getElementById("abrirModalSenha");
const modalSenha = document.getElementById("modalSenha");
const fecharModalSenha = document.getElementById("fecharModalSenha");
const formAlterarSenha = document.getElementById("formAlterarSenha");
const abrirModalExclusao = document.getElementById("abrirModalExclusao");
const modalExclusao = document.getElementById("modalExclusao");
const fecharModalExclusao = document.getElementById("fecharModalExclusao");
const formExclusaoConta = document.getElementById("formExclusaoConta");

function abrirLinkDownload() {
    window.location.href = LINK_DOWNLOAD;
}

async function buscarUsuarioPorEmail(email) {
    return supabase
        .from("Usuario")
        .select("nome_usuario, email_usuario")
        .eq("email_usuario", email)
        .maybeSingle();
}

async function buscarCartaoPorEmail(email) {
    return supabase
        .from("Cartao")
        .select("Numero")
    .eq("dono_cartao", email)
        .limit(1)
        .maybeSingle();
}

function fecharModalDownload() {
    if (downloadModal) {
        downloadModal.hidden = true;
    }
}

function fecharModalCartao() {
    if (cartaoModal) {
        cartaoModal.hidden = true;
    }
}

async function verificarCartaoEContinuar(email) {
    const mensagemDownload = document.getElementById("mensagemDownload");

    const { data: usuario, error: erroBuscaUsuario } = await buscarUsuarioPorEmail(email);

    if (erroBuscaUsuario) {
        console.error(erroBuscaUsuario);
        mostrarMensagem(mensagemDownload, "Erro ao verificar usuário.", "#ff5c6c");
        return;
    }

    if (!usuario) {
        localStorage.removeItem(USUARIO_LOGADO_KEY);
        localStorage.removeItem("usuarioLogadoNome");
        mostrarMensagem(mensagemDownload, "Usuário não encontrado.", "#ff5c6c");
        if (downloadModal) {
            downloadModal.hidden = false;
        }
        document.getElementById("downloadLoginEmail").focus();
        return;
    }

    const { data: cartaoEncontrado, error: erroBuscaCartao } = await buscarCartaoPorEmail(email);

    if (erroBuscaCartao) {
        console.error(erroBuscaCartao);
        if (downloadModal) {
            downloadModal.hidden = false;
        }
        mostrarMensagem(mensagemDownload, "Erro ao verificar cartão.", "#ff5c6c");
        return;
    }

    if (cartaoEncontrado) {
        abrirLinkDownload();
        return;
    }

    if (cartaoModal) {
        cartaoModal.hidden = false;
        document.getElementById("numeroCartao").focus();
    }
}

if (downloadButton) {
    downloadButton.addEventListener("click", async function() {
        const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);
        const mensagem = document.getElementById("mensagemDownload");

        if (emailLogado) {
            const { data: usuarioEncontrado, error: erroBusca } = await buscarUsuarioPorEmail(emailLogado);

            if (erroBusca) {
                console.error(erroBusca);
                downloadModal.hidden = false;
                mostrarMensagem(mensagem, "Erro ao verificar usuario.", "#ff5c6c");
                return;
            }

            if (!usuarioEncontrado) {
                localStorage.removeItem(USUARIO_LOGADO_KEY);
                localStorage.removeItem("usuarioLogadoNome");
                downloadModal.hidden = false;
                mostrarMensagem(mensagem, "O usuario não existe", "#ff5c6c");
                document.getElementById("downloadLoginEmail").focus();
                return;
            }

            await verificarCartaoEContinuar(emailLogado);
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
            mostrarMensagem(mensagem, "O usuario não existe", "#ff5c6c");
            return;
        }

        localStorage.setItem(USUARIO_LOGADO_KEY, usuarioEncontrado.email_usuario);
        localStorage.setItem("usuarioLogadoNome", usuarioEncontrado.nome_usuario);
        fecharModalDownload();
        await verificarCartaoEContinuar(usuarioEncontrado.email_usuario);
    });
}

if (fecharCartaoModal) {
    fecharCartaoModal.addEventListener("click", fecharModalCartao);
}

if (cartaoModal) {
    cartaoModal.addEventListener("click", function(event) {
        if (event.target === cartaoModal) {
            fecharModalCartao();
        }
    });
}

if (formCadastroCartao) {
    formCadastroCartao.addEventListener("submit", async function(event) {
        event.preventDefault();

        const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);
        const numeroCartao = document.getElementById("numeroCartao").value.trim();
        const numSeg = document.getElementById("numSeg").value.trim();
        const nomeCartao = document.getElementById("nomeCartao").value.trim();
        const mensagem = document.getElementById("mensagemCartao");

        if (!emailLogado) {
            fecharModalCartao();
            if (downloadModal) {
                downloadModal.hidden = false;
            }
            document.getElementById("downloadLoginEmail").focus();
            return;
        }

        const { data: usuario, error: erroBuscaUsuario } = await buscarUsuarioPorEmail(emailLogado);

        if (erroBuscaUsuario || !usuario) {
            localStorage.removeItem(USUARIO_LOGADO_KEY);
            localStorage.removeItem("usuarioLogadoNome");
            fecharModalCartao();
            if (downloadModal) {
                downloadModal.hidden = false;
            }
            mostrarMensagem(
                document.getElementById("mensagemDownload"),
                "Não foi possível confirmar o usuário.",
                "#ff5c6c"
            );
            document.getElementById("downloadLoginEmail").focus();
            return;
        }

        if (!numeroCartao || !numSeg || !nomeCartao) {
            mostrarMensagem(mensagem, "Preencha todos os campos do cartão.", "#ff5c6c");
            return;
        }

        if (!/^\d{16}$/.test(numeroCartao)) {
            mostrarMensagem(mensagem, "O cartão deve ter exatamente 16 dígitos.", "#ff5c6c");
            return;
        }

        if (!/^\d{3}$/.test(numSeg)) {
            mostrarMensagem(mensagem, "O número de segurança deve ter exatamente 3 dígitos.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Registrando cartão...", "#ffffff");

        const { error: erroCadastroCartao } = await supabase
            .from("Cartao")
            .insert({
                Numero: numeroCartao,
                Num_seg: numSeg,
                nome_cartao: nomeCartao,
                dono_cartao: usuario.email_usuario
            });

        if (erroCadastroCartao) {
            console.error(erroCadastroCartao);
            const textoErro = erroCadastroCartao.code === "22003"
                ? "A coluna Numero precisa aceitar 16 dígitos. Atualize o tipo da coluna no Supabase."
                : "Erro ao registrar cartão.";
            mostrarMensagem(mensagem, textoErro, "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Cartão registrado com sucesso!", "#72e6a5");
        formCadastroCartao.reset();

        setTimeout(function() {
            fecharModalCartao();
            abrirLinkDownload();
        }, 1000);
    });
}

function fecharModalAlterarSenha() {
    if (modalSenha) {
        modalSenha.hidden = true;
    }
}

if (abrirModalSenha) {
    abrirModalSenha.addEventListener("click", function() {
        const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);

        if (!emailLogado) {
            window.location.href = "login.html";
            return;
        }

        modalSenha.hidden = false;
        document.getElementById("novaSenha").focus();
    });
}

if (fecharModalSenha) {
    fecharModalSenha.addEventListener("click", fecharModalAlterarSenha);
}

if (modalSenha) {
    modalSenha.addEventListener("click", function(event) {
        if (event.target === modalSenha) {
            fecharModalAlterarSenha();
        }
    });
}

if (formAlterarSenha) {
    formAlterarSenha.addEventListener("submit", async function(event) {
        event.preventDefault();

        const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);
        const novaSenha = document.getElementById("novaSenha").value;
        const confirmarNovaSenha = document.getElementById("confirmarNovaSenha").value;
        const mensagem = document.getElementById("mensagemSenha");

        if (!emailLogado) {
            window.location.href = "login.html";
            return;
        }

        if (!novaSenha || !confirmarNovaSenha) {
            mostrarMensagem(mensagem, "Preencha os dois campos de senha.", "#ff5c6c");
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            mostrarMensagem(mensagem, "As senhas nao sao iguais.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Atualizando senha...", "#ffffff");

        const { data: usuarioExistente, error: erroBuscaUsuario } = await buscarUsuarioPorEmail(emailLogado);

        if (erroBuscaUsuario) {
            console.error(erroBuscaUsuario);
            mostrarMensagem(mensagem, "Erro ao verificar usuario.", "#ff5c6c");
            return;
        }

        if (!usuarioExistente) {
            mostrarMensagem(mensagem, "Usuario nao encontrado.", "#ff5c6c");
            return;
        }

        const { error: erroAtualizacao } = await supabase
            .from("Usuario")
            .update({ senha_usuario: novaSenha })
            .eq("email_usuario", emailLogado);

        if (erroAtualizacao) {
            console.error(erroAtualizacao);
            mostrarMensagem(mensagem, "Erro ao atualizar senha.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Senha atualizada com sucesso!", "#72e6a5");
        formAlterarSenha.reset();

        setTimeout(function() {
            fecharModalAlterarSenha();
        }, 1000);
    });
}

function fecharModalDeExclusao() {
    if (modalExclusao) {
        modalExclusao.hidden = true;
    }
}

if (abrirModalExclusao) {
    abrirModalExclusao.addEventListener("click", function() {
        const emailLogado = localStorage.getItem(USUARIO_LOGADO_KEY);

        if (!emailLogado) {
            window.location.href = "login.html";
            return;
        }

        modalExclusao.hidden = false;
        document.getElementById("loginAdministrador").focus();
    });
}

if (fecharModalExclusao) {
    fecharModalExclusao.addEventListener("click", fecharModalDeExclusao);
}

if (modalExclusao) {
    modalExclusao.addEventListener("click", function(event) {
        if (event.target === modalExclusao) {
            fecharModalDeExclusao();
        }
    });
}

if (formExclusaoConta) {
    formExclusaoConta.addEventListener("submit", async function(event) {
        event.preventDefault();

        const emailUsuario = localStorage.getItem(USUARIO_LOGADO_KEY);
        const loginAdministrador = document.getElementById("loginAdministrador").value.trim();
        const senhaAdministrador = document.getElementById("senhaAdministrador").value;
        const mensagem = document.getElementById("mensagemExclusao");

        if (!emailUsuario) {
            window.location.href = "login.html";
            return;
        }

        if (!loginAdministrador || !senhaAdministrador) {
            mostrarMensagem(mensagem, "Preencha o login e a senha do administrador.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Validando administrador...", "#ffffff");

        const { data: administrador, error: erroAdministrador } = await supabase
            .from("Administrador")
            .select("login_administrador")
            .eq("login_administrador", loginAdministrador)
            .eq("senha_administrador", senhaAdministrador)
            .limit(1)
            .maybeSingle();

        if (erroAdministrador) {
            console.error(erroAdministrador);
            mostrarMensagem(mensagem, "Erro ao validar administrador.", "#ff5c6c");
            return;
        }

        if (!administrador || administrador.login_administrador !== loginAdministrador) {
            mostrarMensagem(mensagem, "Login ou senha de administrador invalidos.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Excluindo conta...", "#ffffff");

        const { data: usuarioExistente, error: erroBuscaUsuario } = await buscarUsuarioPorEmail(emailUsuario);

        if (erroBuscaUsuario) {
            console.error(erroBuscaUsuario);
            mostrarMensagem(mensagem, "Erro ao verificar usuario.", "#ff5c6c");
            return;
        }

        if (!usuarioExistente) {
            mostrarMensagem(mensagem, "Usuario nao encontrado.", "#ff5c6c");
            return;
        }

        const { error: erroExclusao } = await supabase
            .from("Usuario")
            .delete()
            .eq("email_usuario", emailUsuario);

        if (erroExclusao) {
            console.error(erroExclusao);
            mostrarMensagem(mensagem, "Erro ao excluir conta.", "#ff5c6c");
            return;
        }

        localStorage.removeItem(USUARIO_LOGADO_KEY);
        localStorage.removeItem("usuarioLogadoNome");
        mostrarMensagem(mensagem, "Conta excluida com sucesso.", "#72e6a5");

        setTimeout(function() {
            window.location.href = "../index.html";
        }, 1000);
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
