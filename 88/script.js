// ============================================================
// VARIÁVEIS DE ESTADO E BANCO DE DADOS LOCAL (localStorage)
// ============================================================
let carrinho = [];
let usuarioLogado = null;

// Obtém ou inicializa a lista de usuários no localStorage
function obterUsuariosCadastrados() {
    const usuarios = localStorage.getItem('futstore_usuarios');
    return usuarios ? JSON.parse(usuarios) : [
        { nome: 'Cliente Teste', usuario: 'admin', senha: '123' }
    ];
}

function salvarNovoUsuario(nome, usuario, senha) {
    const usuarios = obterUsuariosCadastrados();
    usuarios.push({ nome, usuario, senha });
    localStorage.setItem('futstore_usuarios', JSON.stringify(usuarios));
}

// ============================================================
// SISTEMA DE TROCA DE TELAS (SPA)
// ============================================================
function mudarTela(idTela) {
    const telas = document.querySelectorAll('.tela');
    telas.forEach(tela => {
        tela.style.display = 'none';
    });

    const telaAlvo = document.getElementById(idTela);
    if (telaAlvo) {
        telaAlvo.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (idTela === 'carrinho') {
        renderizarCarrinho();
    }
}

// ============================================================
// LÓGICA DO CARRINHO DE COMPRAS
// ============================================================
function adicionarAoCarrinho(nome, preco, imagem) {
    const itemExistente = carrinho.find(item => item.nome === nome);
    if (itemExistente) {
        itemExistente.qtd += 1;
    } else {
        carrinho.push({ nome: nome, preco: preco, img: imagem, qtd: 1 });
    }

    atualizarContadorTopo();
    exibirNotificacao(`"${nome}" foi adicionado ao carrinho! 🛒`);
}

function alterarQtd(index, delta) {
    if (carrinho[index]) {
        carrinho[index].qtd += delta;
        if (carrinho[index].qtd <= 0) {
            carrinho.splice(index, 1);
        }
    }
    atualizarContadorTopo();
    renderizarCarrinho();
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarContadorTopo();
    renderizarCarrinho();
}

function atualizarContadorTopo() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    const contadorEl = document.getElementById('contador-carrinho-topo');
    if (contadorEl) {
        contadorEl.innerText = totalItens;
    }
}

function renderizarCarrinho() {
    const container = document.getElementById('itens-carrinho');
    const footerCarrinho = document.getElementById('footer-carrinho');
    
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #8b95a5;">
                <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
                <p>O seu carrinho está vazio no momento.</p>
                <button onclick="mudarTela('menu-principal')" class="btn-acessar" style="max-width: 250px; margin: 15px auto 0 auto; display: block; border: none; cursor: pointer;">Explorar Produtos ➔</button>
            </div>
        `;
        if (footerCarrinho) footerCarrinho.style.display = 'none';
        return;
    }

    let html = '';
    let totalGeral = 0;

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.qtd;
        totalGeral += subtotal;

        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 12px 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${item.img}" alt="${item.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'">
                    <div>
                        <h4 style="color: #fff; margin: 0 0 4px 0; font-size: 15px;">${item.nome}</h4>
                        <p style="color: #00ff9d; margin: 0; font-size: 13px;">R$ ${item.preco.toFixed(2).replace('.', ',')} cada</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="alterarQtd(${index}, -1)" style="background: rgba(255,255,255,0.1); color: #fff; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="color: #fff; font-weight: bold; width: 20px; text-align: center;">${item.qtd}</span>
                    <button onclick="alterarQtd(${index}, 1)" style="background: rgba(255,255,255,0.1); color: #fff; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                    <button onclick="removerDoCarrinho(${index})" title="Remover item" style="background: rgba(255,0,0,0.2); color: #ff6b6b; border: none; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; margin-left: 5px;">🗑️</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    const totalGeralEl = document.getElementById('total-geral-carrinho');
    if (totalGeralEl) {
        totalGeralEl.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    }
    
    if (footerCarrinho) footerCarrinho.style.display = 'block';
}

// ============================================================
// AUTENTICAÇÃO E CHECKOUT
// ============================================================
function iniciarCheckout() {
    if (carrinho.length === 0) {
        alert("O seu carrinho está vazio!");
        return;
    }

    if (!usuarioLogado) {
        exibirNotificacao("Por favor, aceda à sua conta para continuar.");
        mudarTela('login');
    } else {
        mudarTela('pagamento');
    }
}

function processarLogin(event) {
    event.preventDefault();
    const userInp = document.getElementById('login-usuario').value.trim();
    const passInp = document.getElementById('login-senha').value.trim();
    const msgErro = document.getElementById('msg-erro-login');

    const usuarios = obterUsuariosCadastrados();
    const usuarioEncontrado = usuarios.find(u => u.usuario === userInp && u.senha === passInp);

    if (usuarioEncontrado) {
        usuarioLogado = usuarioEncontrado;
        msgErro.style.display = 'none';
        atualizarStatusUsuario();
        exibirNotificacao(`Bem-vindo de volta, ${usuarioLogado.nome}! 👋`);

        if (carrinho.length > 0) {
            mudarTela('pagamento');
        } else {
            mudarTela('menu-principal');
        }
    } else {
        msgErro.style.display = 'block';
    }
}

function processarCadastro(event) {
    event.preventDefault();
    const nome = document.getElementById('cad-nome').value.trim();
    const usuario = document.getElementById('cad-usuario').value.trim();
    const senha = document.getElementById('cad-senha').value.trim();

    if (!nome || !usuario || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const usuarios = obterUsuariosCadastrados();
    const jaExiste = usuarios.some(u => u.usuario === usuario);

    if (jaExiste) {
        alert("Este nome de usuário já está registado. Escolha outro!");
        return;
    }

    salvarNovoUsuario(nome, usuario, senha);
    usuarioLogado = { nome, usuario, senha };
    
    atualizarStatusUsuario();
    exibirNotificacao(`Conta criada com sucesso! Bem-vindo, ${nome}! 🚀`);

    if (carrinho.length > 0) {
        mudarTela('pagamento');
    } else {
        mudarTela('menu-principal');
    }
}

function atualizarStatusUsuario() {
    const btnUsuario = document.getElementById('btn-usuario-topo');
    if (btnUsuario && usuarioLogado) {
        btnUsuario.innerHTML = `👤 ${usuarioLogado.nome.split(' ')[0]}`;
        btnUsuario.onclick = (e) => {
            e.preventDefault();
            if (confirm(`Deseja sair da conta de ${usuarioLogado.nome}?`)) {
                usuarioLogado = null;
                btnUsuario.innerHTML = `🔐 Login`;
                btnUsuario.onclick = (ev) => { ev.preventDefault(); mudarTela('login'); };
                mudarTela('menu-principal');
                exibirNotificacao("Você saiu da conta.");
            }
        };
    }
}

function finalizarPedido() {
    if (carrinho.length === 0) return;
    carrinho = [];
    atualizarContadorTopo();
    mudarTela('sucesso');
}

// Notificação visual no canto da tela (Toast)
function exibirNotificacao(mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = mensagem;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Inicialização e vinculação automática de segurança para todos os botões e links
document.addEventListener('DOMContentLoaded', () => {
    mudarTela('menu-principal');
    atualizarContadorTopo();

    // Garante que qualquer link ou botão com onclick funcione perfeitamente
    document.querySelectorAll('a, button').forEach(element => {
        // Se o elemento tiver um onclick escrito no HTML, garantimos que ele dispare
        const onclickAttr = element.getAttribute('onclick');
        if (onclickAttr && !element.hasAttribute('data-bound')) {
            element.setAttribute('data-bound', 'true');
            element.addEventListener('click', (e) => {
                // Se for um link #, evita o comportamento padrão de pular a página
                if (element.getAttribute('href') === '#') {
                    e.preventDefault();
                }
            });
        }
    });
});