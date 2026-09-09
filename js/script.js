/*
====================================================
    YOKAI TAILS - JAVASCRIPT

    Este arquivo controla:
    - Cadastro de usuarios
    - Login
    - Verificacao de senha
    - Redirecionamento

    Os usuarios sao armazenados na tabela "senha"
    do Supabase.
====================================================
*/

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://thmtriwgvsgxdinsuxph.supabase.co";
const SUPABASE_KEY = "sb_publishable_UEFgvCGMxI5rGKZ0ac8OsA_xV_Sgy4h";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function mostrarMensagem(elemento, texto, cor) {
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

        const usuario = document.getElementById("novoUsuario").value.trim();
        const email = document.getElementById("novoEmail").value.trim();
        const senha = document.getElementById("novaSenha").value;
        const confirmaSenha = document.getElementById("confirmaSenha").value;
        const mensagem = document.getElementById("mensagemCadastro");

        if (senha !== confirmaSenha) {
            mostrarMensagem(mensagem, "As senhas nao sao iguais.", "#ff5c6c");
            return;
        }

        mostrarMensagem(mensagem, "Criando conta...", "#ffffff");

        const { data: usuarioExistente, error: erroBusca } = await supabase
            .from("senha")
            .select("usuario")
            .eq("usuario", usuario)
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
            .from("senha")
            .insert({
                usuario: usuario,
                email: email,
                senha: senha
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

        const usuario = document.getElementById("usuario").value.trim();
        const senha = document.getElementById("senha").value;
        const mensagem = document.getElementById("mensagemLogin");

        mostrarMensagem(mensagem, "Entrando...", "#ffffff");

        const { data: usuarioEncontrado, error: erroLogin } = await supabase
            .from("senha")
            .select("usuario")
            .eq("usuario", usuario)
            .eq("senha", senha)
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

        localStorage.setItem("usuarioLogado", usuarioEncontrado.usuario);

        setTimeout(function() {
            window.location.href = "download.html";
        }, 1000);
    });
}
