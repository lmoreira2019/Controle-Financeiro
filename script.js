const ESTRUTURA = {
    "despesa": {
        "🏠 Moradia": ["Aluguel", "Condomínio", "Luz", "Água", "Internet"],
        "🍽️ Alimentação": ["Supermercado", "Restaurante", "Lanches"],
        "🚗 Transporte": ["Combustível", "Uber", "Ônibus"],
        "🏥 Saúde": ["Farmácia", "Médico"],
        "🎁 Outros": ["Lazer", "Diversos"]
    },
    "receita": {
        "💼 Trabalho": ["Salário", "Extra"],
        "📈 Investimentos": ["Dividendos", "Juros"]
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
        document.getElementById('status-pago').checked = true; // Default pago
    }
};

const auth = {
    login: () => {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        const saved = JSON.parse(localStorage.getItem('f_user'));
        if(saved && saved.u === u && saved.p === p) {
            localStorage.setItem('f_sessao', 'true');
            auth.mostrarDashboard();
        } else { alert("Acesso inválido."); }
    },
    registrar: () => {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if(!u || !p) return alert("Preencha os campos.");
        localStorage.setItem('f_user', JSON.stringify({u, p}));
        alert("Conta cadastrada!");
    },
    mostrarDashboard: () => {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        financas.gerarOpcoesFiltro();
        financas.atualizar();
    },
    verificarSessao: () => { if(localStorage.getItem('f_sessao') === 'true') auth.mostrarDashboard(); },
    logout: () => { localStorage.removeItem('f_sessao'); location.reload(); }
};

let myChart = null;
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtPDF = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const financas = {
    salvar: () => {
        const id = document.getElementById('edit-id').value;
        const item = {
            id: id ? parseInt(id) : Date.now(),
            desc: document.getElementById('desc').value.trim(),
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            cat: document.getElementById('cat').value,
            sub: document.getElementById('subcat').value,
            pago: document.getElementById('status-pago').checked,
            data: `${document.getElementById('ano').value}-${document.getElementById('mes').value}-${document.getElementById('dia').value.padStart(2,'0')}`
        };
        if(!item.desc || isNaN(item.valor)) return alert("Preencha todos os dados.");
        let d = JSON.parse(localStorage.getItem('f_data') || '[]');
        id ? (d = d.map(x => x.id === item.id ? item : x)) : d.push(item);
        localStorage.setItem('f_data', JSON.stringify(d));
        financas.limparForm(); financas.gerarOpcoesFiltro(); financas.atualizar();
    },
    limparForm: () => {
        document.getElementById('edit-id').value = '';
        document.getElementById('desc').value = '';
        document.getElementById('valor').value = '';
        ui.resetData();
        document.getElementById('form-title').innerText = 'Novo Lançamento';
    },
    alternarStatus: (id) => {
        let d = JSON.parse(localStorage.getItem('f_data') || '[]');
        d = d.map(x => x.id === id ? {...x, pago: !x.pago} : x);
        localStorage.setItem('f_data', JSON.stringify(d));
        financas.atualizar();
    },
    gerarOpcoesFiltro: () => {
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const f = document.getElementById('f-periodo');
        const vA = f.value;
        const p = [...new Set(d.map(x => `${x.data.split('-')[1]}/${x.data.split('-')[0]}`))].sort().reverse();
        f.innerHTML = '<option value="all">Todo o Período</option>' + p.map(x => `<option value="${x}">${x}</option>`).join('');
        f.value = vA || "all";
    },
    atualizar: () => {
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const fP = document.getElementById('f-periodo').value;
        const busca = document.getElementById('busca').value.toLowerCase();
        
        d.sort((a,b) => new Date(a.data) - new Date(b.data));
        
        let sA = 0; // Saldo Acumulado Efetivado
        let rT = 0, dT = 0; // Totais do período filtrado

        const filtrados = d.filter(i => (fP==='all' || `${i.data.split('-')[1]}/${i.data.split('-')[0]}`===fP) && i.desc.toLowerCase().includes(busca));
        
        document.getElementById('lista').innerHTML = [...filtrados].reverse().map(i => {
            // Soma para o resumo apenas se estiver PAGO
            if (i.pago) {
                i.tipo === 'receita' ? rT += i.valor : dT += i.valor;
            }

            const statusIcon = i.pago ? '✅' : '⏳';
            const statusClass = i.pago ? 'pago' : 'pendente';

            return `<div class="item ${statusClass}">
                <div style="display:flex; align-items:center;">
                    <span class="status-check" onclick="financas.alternarStatus(${i.id})" title="Alterar status">${statusIcon}</span>
                    <div><b>${i.desc}</b><br><small>${i.cat} | ${i.data.split('-').reverse().join('/')}</small></div>
                </div>
                <div class="actions">
                    <div style="text-align:right">
                        <span style="color:${i.tipo==='receita'?'#34d399':'#ff5f5f'}"><b>${fmt(i.valor)}</b></span>
                    </div>
                    <button onclick="financas.editar(${i.id})">✏️</button>
                    <button onclick="financas.remover(${i.id})">🗑️</button>
                </div>
            </div>`;
        }).join('') || '<p class="text-center">Vazio.</p>';

        // Cálculo do saldo total histórico (apenas o que foi pago/recebido)
        const saldoEfetivado = d.reduce((acc, curr) => {
            if(!curr.pago) return acc;
            return curr.tipo === 'receita' ? acc + curr.valor : acc - curr.valor;
        }, 0);

        document.getElementById('total-rec').innerText = fmt(rT);
        document.getElementById('total-des').innerText = fmt(dT);
        document.getElementById('total-bal').innerText = fmt(saldoEfetivado);
        financas.grafico(filtrados);
    },
    grafico: (dados) => {
        const tG = document.getElementById('tipo-grafico').value;
        const g = dados.filter(x => x.tipo === tG);
        const c = {}; g.forEach(x => c[x.cat] = (c[x.cat] || 0) + x.valor);
        const ctx = document.getElementById('chartArea').getContext('2d');
        if(myChart) myChart.destroy();
        if(Object.keys(c).length > 0) {
            const cores = tG === 'despesa' ? ['#ff5f5f','#fb923c','#f472b6'] : ['#58a6ff','#2dd4bf','#34d399'];
            myChart = new Chart(ctx, { type: 'bar', data: { labels: Object.keys(c), datasets: [{ data: Object.values(c), backgroundColor: cores, borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } }, y: { ticks: { color: '#f0f6fc' } } } } });
        }
    },
    editar: (id) => {
        const item = JSON.parse(localStorage.getItem('f_data')).find(x => x.id === id);
        document.getElementById('edit-id').value = item.id;
        document.getElementById('desc').value = item.desc;
        document.getElementById('valor').value = item.valor;
        document.getElementById('tipo').value = item.tipo;
        document.getElementById('status-pago').checked = item.pago ?? true;
        ui.atualizarCategorias(item.cat, item.sub);
        const [a, m, d] = item.data.split('-');
        document.getElementById('dia').value = d; document.getElementById('mes').value = m; document.getElementById('ano').value = a;
        document.getElementById('form-title').innerText = 'Editando...'; window.scrollTo(0,0);
    },
    remover: (id) => { if(confirm("Excluir?")) { const d = JSON.parse(localStorage.getItem('f_data')).filter(x => x.id !== id); localStorage.setItem('f_data', JSON.stringify(d)); financas.gerarOpcoesFiltro(); financas.atualizar(); } }
};

const util = {
    exportar: () => {
        const b = new Blob([localStorage.getItem('f_data') || '[]'], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `backup_financepro.json`; a.click();
    },
    importar: () => {
        const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
        i.onchange = e => {
            const r = new FileReader(); r.onload = ev => { if(confirm("Importar dados?")) { localStorage.setItem('f_data', ev.target.result); financas.gerarOpcoesFiltro(); financas.atualizar(); } };
            r.readAsText(e.target.files[0]);
        };
        i.click();
    },
    gerarPDF: () => {
        const { jsPDF } = window.jspdf;
        const doc = jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        const fP = document.getElementById('f-periodo').value;
        const d = JSON.parse(localStorage.getItem('f_data') || '[]');
        const filtrados = d.filter(i => fP === 'all' || `${i.data.split('-')[1]}/${i.data.split('-')[0]}` === fP).sort((a,b) => new Date(a.data) - new Date(b.data));
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("RELATORIO FINANCEPRO", 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Periodo: ${fP} | Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);
        
        let tr = 0, td = 0;
        const body = filtrados.map(i => {
            if(i.pago) i.tipo === 'receita' ? tr += i.valor : td += i.valor;
            const statusTxt = i.pago ? 'OK' : 'PEND';
            return [
                i.data.split('-').reverse().join('/'), 
                i.desc, 
                i.tipo === 'receita' ? 'REC' : 'DES', 
                statusTxt,
                fmtPDF(i.valor)
            ];
        });

        doc.autoTable({ 
            startY: 35, 
            head: [['Data', 'Descricao', 'Tipo', 'Status', 'Valor (R$)']], 
            body: body, 
            headStyles: {fillColor: [88, 166, 255]}
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Total Efetivado: ${fmtPDF(tr-td)}`, 14, finalY);
        doc.save(`relatorio_${fP.replace('/','-')}.pdf`);
    }
};

window.onload = () => { ui.resetData(); ui.atualizarCategorias(); auth.verificarSessao(); };
