const ESTRUTURA = {
    "despesa": {
        "🏠 Moradia": ["Aluguel", "Financiamento", "Condomínio", "IPTU", "Água", "Luz", "Gás", "Manutenção"],
        "🍽️ Alimentação": ["Supermercado", "Feira", "Padaria", "Restaurantes", "Delivery"],
        "🚗 Transporte": ["Combustível", "Estacionamento", "Pedágio", "Transporte Público", "Manutenção", "Seguro", "IPVA", "Multas"],
        "📱 Comunicação": ["Internet Residencial", "Internet Móvel", "Plano Celular", "Streaming"],
        "💳 Financeiro": ["Cartão Crédito", "Empréstimos", "Juros", "Tarifas Bancárias", "Financiamentos"],
        "🏥 Saúde": ["Plano Saúde", "Consultas", "Exames", "Medicamentos", "Odontologia"],
        "🎓 Educação": ["Escola/Faculdade", "Cursos", "Material Escolar", "Livros"],
        "👕 Pessoais": ["Roupas", "Calçados", "Higiene", "Salão/Barbearia"],
        "🎮 Lazer": ["Cinema", "Viagens", "Passeios", "Jogos", "Assinaturas"],
        "🧾 Obrigações": ["Impostos", "Taxas", "Multas", "Pensão"],
        "🎁 Outros": ["Presentes", "Doações", "Imprevistos"]
    },
    "receita": {
        "💼 Trabalho": ["Salário", "Adiantamento", "Horas Extras", "Comissões", "Bônus"],
        "🧑‍💻 Renda Extra": ["Freelance", "Serviços", "Vendas", "Bicos"],
        "📈 Investimentos": ["Poupança", "Juros", "Dividendos", "Fundos"],
        "🏠 Patrimônio": ["Aluguel Recebido", "Venda de Bens"],
        "🎁 Outras": ["Reembolsos", "Prêmios", "Ajuda Familiar"]
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
    resetData: () => {
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
        alert("Usuário cadastrado com sucesso!");
        auth.limparLogin();
    },
    login: () => {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        const saved = JSON.parse(localStorage.getItem('f_user'));
        if(saved && saved.u === u && saved.p === p) {
            localStorage.setItem('f_sessao', 'true');
            auth.mostrarDashboard();
        } else {
            alert("Dados incorretos!");
            auth.limparLogin(); // Limpa os campos em caso de erro
        }
    },
    limparLogin: () => {
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';
        document.getElementById('login-user').focus(); // Foca no primeiro campo
    },
    verificarSessao: () => {
        if(localStorage.getItem('f_sessao') === 'true') auth.mostrarDashboard();
    },
    mostrarDashboard: () => {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        financas.gerarOpcoesFiltro();
        financas.atualizar();
    },
    logout: () => { localStorage.removeItem('f_sessao'); location.reload(); }
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

        if(!item.desc || isNaN(item.valor)) return alert("Preencha todos os campos!");

        let d = JSON.parse(localStorage.getItem('f_data') || '[]');
        id ? (d = d.map(x => x.id === item.id ? item : x)) : d.push(item);
        
        localStorage.setItem('f_data', JSON.stringify(d));
        financas.limparForm();
        financas.gerarOpcoesFiltro();
        financas.atualizar();
    },
    limparForm: () => {
        document.getElementById('edit-id').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('valor').value = '';
        ui.resetData();
        document.getElementById('form-title').innerText = 'Novo Lançamento';
        document.getElementById('desc').focus();
    },
    gerarOpcoesFiltro: () => {
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const filtro = document.getElementById('f-periodo');
        const valAtual = filtro.value;
        const periodos = [...new Set(d.map(x => {
            const [ano, mes] = x.data.split('-');
            return `${mes}/${ano}`;
        }))].sort().reverse();
        
        let opt = '<option value="all">Todo o Período</option>';
        periodos.forEach(p => opt += `<option value="${p}">${p}</option>`);
        filtro.innerHTML = opt;
        filtro.value = valAtual || "all";
    },
    atualizar: () => {
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const fP = document.getElementById('f-periodo').value;
        
        d.sort((a,b) => new Date(a.data) - new Date(b.data));
        let sA = 0;
        const dComSaldo = d.map(x => {
            x.tipo === 'receita' ? sA += x.valor : sA -= x.valor;
            return {...x, sM: sA};
        });

        const filtrados = dComSaldo.filter(i => fP === 'all' || `${i.data.split('-')[1]}/${i.data.split('-')[0]}` === fP);
        let rT = 0, dT = 0;
        
        const html = [...filtrados].reverse().map(i => {
            i.tipo === 'receita' ? rT += i.valor : dT += i.valor;
            return `<div class="item">
                <div><b>${i.desc}</b><small>${i.cat} > ${i.sub} | ${i.data.split('-').reverse().join('/')}</small></div>
                <div class="actions">
                    <div><span class="valor-principal" style="color:${i.tipo==='receita'?'#00d488':'#ff5f5f'}">${fmt(i.valor)}</span>
                    <span class="saldo-linha">Acum: ${fmt(i.sM)}</span></div>
                    <button onclick="financas.editar(${i.id})">✏️</button>
                    <button onclick="financas.remover(${i.id})">🗑️</button>
                </div>
            </div>`;
        }).join('');

        document.getElementById('lista').innerHTML = html || '<p class="text-center">Sem dados registrados.</p>';
        document.getElementById('total-rec').innerText = fmt(rT);
        document.getElementById('total-des').innerText = fmt(dT);
        document.getElementById('total-bal').innerText = fmt(sA);
        document.getElementById('total-bal').className = sA < 0 ? 'val-bal negativo' : 'val-bal';
        financas.grafico(filtrados);
    },
    editar: (id) => {
        const item = JSON.parse(localStorage.getItem('f_data')).find(x => x.id === id);
        const [a, m, d] = item.data.split('-');
        document.getElementById('edit-id').value = item.id;
        document.getElementById('desc').value = item.desc;
        document.getElementById('valor').value = item.valor;
        document.getElementById('tipo').value = item.tipo;
        ui.atualizarCategorias(item.cat, item.sub);
        document.getElementById('dia').value = d; document.getElementById('mes').value = m; document.getElementById('ano').value = a;
        document.getElementById('form-title').innerText = 'Editando Lançamento';
        window.scrollTo(0,0);
        document.getElementById('desc').focus();
        document.getElementById('desc').select();
    },
    remover: (id) => {
        if(confirm("Deseja excluir este lançamento?")) {
            const d = JSON.parse(localStorage.getItem('f_data')).filter(x => x.id !== id);
            localStorage.setItem('f_data', JSON.stringify(d));
            financas.gerarOpcoesFiltro();
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

window.onload = () => { ui.resetData(); ui.atualizarCategorias(); auth.verificarSessao(); };