const ESTRUTURA = {
    "despesa": {
        "🏠 Moradia": ["Aluguel", "Condomínio", "IPTU", "Água", "Luz", "Gás", "Manutenção"],
        "🍽️ Alimentação": ["Supermercado", "Restaurantes", "Delivery"],
        "🚗 Transporte": ["Combustível", "Uber", "Ônibus", "Seguro"],
        "🏥 Saúde": ["Farmácia", "Plano de Saúde", "Consultas"],
        "🎮 Lazer": ["Cinema", "Viagens", "Jogos"]
    },
    "receita": {
        "💼 Trabalho": ["Salário", "Bônus"],
        "📈 Investimentos": ["Dividendos", "Juros"],
        "🧑‍💻 Renda Extra": ["Freelance", "Vendas"]
    }
};

const ui = {
    atualizarCategorias: (catSel = null, subSel = null) => {
        const tipo = document.getElementById('tipo').value;
        const catCombo = document.getElementById('cat');
        catCombo.innerHTML = Object.keys(ESTRUTURA[tipo]).map(c => `<option value="${c}">${c}</option>`).join('');
        if(catSel) catCombo.value = catSel;
        ui.atualizarSubcategorias(subSel);
    },
    atualizarSubcategorias: (subSel = null) => {
        const tipo = document.getElementById('tipo').value;
        const cat = document.getElementById('cat').value;
        const subCombo = document.getElementById('subcat');
        subCombo.innerHTML = (ESTRUTURA[tipo][cat] || []).map(s => `<option value="${s}">${s}</option>`).join('');
        if(subSel) subCombo.value = subSel;
    },
    initData: () => {
        const h = new Date();
        document.getElementById('dia').value = String(h.getDate()).padStart(2, '0');
        document.getElementById('mes').value = String(h.getMonth() + 1).padStart(2, '0');
        document.getElementById('ano').value = h.getFullYear();
    }
};

const auth = {
    registrar: () => {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if(!u || !p) return alert("Preencha usuário e senha!");
        localStorage.setItem('f_user', JSON.stringify({u, p}));
        alert("Usuário Criado com Sucesso!");
    },
    login: () => {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        const saved = JSON.parse(localStorage.getItem('f_user'));
        if(saved && saved.u === u && saved.p === p) {
            localStorage.setItem('f_sessao', 'true'); // Salva que está logado
            auth.showMain();
        } else alert("Usuário ou Senha incorretos!");
    },
    verificarSessao: () => {
        if(localStorage.getItem('f_sessao') === 'true') auth.showMain();
    },
    showMain: () => {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        financas.atualizar();
    },
    logout: () => {
        localStorage.removeItem('f_sessao');
        location.reload();
    }
};

let myChart = null;
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const financas = {
    salvar: () => {
        const id = document.getElementById('edit-id').value;
        const dia = document.getElementById('dia').value.padStart(2, '0');
        const mes = document.getElementById('mes').value;
        const ano = document.getElementById('ano').value;
        
        const item = {
            id: id ? parseInt(id) : Date.now(),
            desc: document.getElementById('desc').value.trim(),
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            cat: document.getElementById('cat').value,
            sub: document.getElementById('subcat').value,
            data: `${ano}-${mes}-${dia}`
        };

        if(!item.desc || isNaN(item.valor)) return alert("Dados inválidos!");

        let dados = JSON.parse(localStorage.getItem('f_data') || '[]');
        id ? (dados = dados.map(d => d.id === item.id ? item : d)) : dados.push(item);
        
        localStorage.setItem('f_data', JSON.stringify(dados));
        financas.limparForm();
        financas.atualizar();
    },
    limparForm: () => {
        document.getElementById('edit-id').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('valor').value = '';
        ui.initData(); // Reseta a data para hoje
        document.getElementById('form-title').innerText = 'Novo Lançamento';
    },
    atualizar: () => {
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const fM = document.getElementById('f-mes').value;
        
        d.sort((a,b) => new Date(a.data) - new Date(b.data));
        
        let rT = 0, dT = 0, sA = 0;
        const dComSaldo = d.map(x => {
            x.tipo === 'receita' ? sA += x.valor : sA -= x.valor;
            return {...x, sM: sA};
        });

        const filtrados = dComSaldo.filter(x => fM === 'all' || x.data.split('-')[1] === fM);
        
        const html = [...filtrados].reverse().map(i => {
            i.tipo === 'receita' ? rT += i.valor : dT += i.valor;
            return `<div class="item">
                <div><b>${i.desc}</b><small>${i.cat} > ${i.sub} | ${i.data.split('-').reverse().join('/')}</small></div>
                <div class="actions">
                    <span style="color:${i.tipo==='receita'?'#00d488':'#ff5f5f'}">${fmt(i.valor)}</span>
                    <span class="saldo-linha">Saldo: ${fmt(i.sM)}</span>
                    <button onclick="financas.remover(${i.id})" style="background:none;border:none;cursor:pointer">🗑️</button>
                </div>
            </div>`;
        }).join('');

        document.getElementById('lista').innerHTML = html || '<p class="text-center">Sem dados</p>';
        document.getElementById('total-rec').innerText = fmt(rT);
        document.getElementById('total-des').innerText = fmt(dT);
        document.getElementById('total-bal').innerText = fmt(sA);
        document.getElementById('total-bal').className = sA < 0 ? 'val-bal negativo' : 'val-bal';
        financas.grafico(filtrados);
    },
    remover: (id) => {
        if(confirm("Excluir?")) {
            const d = JSON.parse(localStorage.getItem('f_data')).filter(x => x.id !== id);
            localStorage.setItem('f_data', JSON.stringify(d));
            financas.atualizar();
        }
    },
    grafico: (dados) => {
        const g = dados.filter(x => x.tipo === 'despesa');
        const c = {}; g.forEach(x => c[x.cat] = (c[x.cat] || 0) + x.valor);
        const ctx = document.getElementById('chartArea').getContext('2d');
        if(myChart) myChart.destroy();
        if(Object.keys(c).length > 0) {
            myChart = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(c), datasets: [{ data: Object.values(c), backgroundColor: ['#00d488','#ff5f5f','#58a6ff','#fbbf24','#a78bfa'] }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } } } });
        }
    }
};

window.onload = () => { ui.initData(); ui.atualizarCategorias(); auth.verificarSessao(); };