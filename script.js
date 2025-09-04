// ==========================================================
// VARIÁVEIS GLOBAIS
// ==========================================================
let notasFiscais = [];
let faturamentoMensal = {};
let clientes = [];
let pedagios = [];
let viagens = [];

// ==========================================================
// LÓGICA DE AUTENTICAÇÃO (NOVO)
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    // Verifica se o usuário já está logado
    if (isAuthenticated === 'true') {
        loginScreen.classList.add('hidden');
        carregarDadosIniciais();
    } else {
        loginScreen.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('login-error');

        // Lógica para permitir qualquer valor (se não estiverem vazios)
        if (username && password) {
            localStorage.setItem('isAuthenticated', 'true');
            errorMessage.style.display = 'none';
            loginScreen.classList.add('hidden');
            carregarDadosIniciais();
        } else {
            errorMessage.textContent = 'Por favor, preencha ambos os campos.';
            errorMessage.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isAuthenticated');
        location.reload(); // Recarrega a página para mostrar a tela de login novamente
    });

    // Lógica de navegação da barra lateral
    const menuItems = document.querySelectorAll('.menu-item');
    const contentPanels = document.querySelectorAll('.content-panel');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            menuItems.forEach(i => i.classList.remove('active'));
            contentPanels.forEach(p => p.classList.remove('active'));

            item.classList.add('active');

            const contentId = item.getAttribute('data-content');
            const targetPanel = document.getElementById(`${contentId}-content`);

            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
});

// ==========================================================
// FUNÇÕES DE DADOS (CARREGAMENTO, SALVAMENTO, ETC.)
// ==========================================================

function salvarDados() {
    localStorage.setItem('notasFiscais', JSON.stringify(notasFiscais));
    localStorage.setItem('faturamentoMensal', JSON.stringify(faturamentoMensal));
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('pedagios', JSON.stringify(pedagios));
    localStorage.setItem('viagens', JSON.stringify(viagens));
}

function carregarDadosIniciais() {
    const notasSalvas = localStorage.getItem('notasFiscais');
    const faturamentoSalvo = localStorage.getItem('faturamentoMensal');
    const clientesSalvos = localStorage.getItem('clientes');
    const pedagiosSalvos = localStorage.getItem('pedagios');
    const viagensSalvos = localStorage.getItem('viagens');

    if (notasSalvas) {
        notasFiscais = JSON.parse(notasSalvas);
        renderizarNotasFiscais();
    }
    if (faturamentoSalvo) {
        faturamentoMensal = JSON.parse(faturamentoSalvo);
    }
    if (clientesSalvos) {
        clientes = JSON.parse(clientesSalvos);
        renderizarTabelaClientes();
    }
    if (pedagiosSalvos) {
        pedagios = JSON.parse(pedagiosSalvos);
        renderizarPedagios();
    }
    if (viagensSalvos) {
        viagens = JSON.parse(viagensSalvos);
        gerarGraficoComparativoVeiculos();
        gerarGraficoCustoVeiculos();
        renderizarTabelaViagens();
    }
}

// ==========================================================
// FUNÇÕES DE SEÇÃO
// ==========================================================

// Notas Fiscais
document.getElementById('nf-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const clientNameNF = document.getElementById('client-name-nf').value;
    const barcodeNF = document.getElementById('barcode-nf').value;
    const valueNF = parseFloat(document.getElementById('value-nf').value);
    const typeNF = document.getElementById('type-nf').value; 
    
    if (clientNameNF && barcodeNF && !isNaN(valueNF) && typeNF) {
        adicionarNotaFiscal(clientNameNF, barcodeNF, valueNF, typeNF);
        this.reset();
    }
});

function adicionarNotaFiscal(cliente, codigoNF, valor, tipo) {
    const nf = {
        id: Date.now(),
        cliente: cliente,
        codigo: codigoNF,
        valor: valor,
        tipo: tipo, 
        data: new Date().toISOString().slice(0, 10)
    };
    notasFiscais.push(nf);
    salvarDados();
    renderizarNotasFiscais();
    calcularFaturamento();
    atualizarGraficosFaturamento();
    alert('Nota fiscal adicionada com sucesso!');
}

function removerNotaFiscal(id) {
    notasFiscais = notasFiscais.filter(nf => nf.id !== id);
    salvarDados();
    renderizarNotasFiscais();
    calcularFaturamento();
    atualizarGraficosFaturamento();
}

function renderizarNotasFiscais() {
    let total = 0;
    let impostos = 0;
    let count = 0;
    let tipoNF = 'N/A';

    notasFiscais.forEach(nf => {
        total += nf.valor;
        impostos += nf.valor * 0.10;
        count++;
        tipoNF = nf.tipo;
    });

    document.getElementById('nf-count').textContent = count;
    document.getElementById('nf-totais').textContent = total.toFixed(2);
    document.getElementById('nf-taxes').textContent = impostos.toFixed(2);
    document.getElementById('nf-type').textContent = tipoNF.charAt(0).toUpperCase() + tipoNF.slice(1);
    document.getElementById('current-client').textContent = notasFiscais.length > 0 ? notasFiscais[notasFiscais.length - 1].cliente : "Nenhum";

    const tabelaBody = document.getElementById('nf-table').querySelector('tbody');
    tabelaBody.innerHTML = '';
    
    notasFiscais.forEach(nf => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = nf.data;
        row.insertCell(1).textContent = nf.cliente;
        row.insertCell(2).textContent = `R$ ${nf.valor.toFixed(2)}`;
        row.insertCell(3).textContent = nf.tipo.charAt(0).toUpperCase() + nf.tipo.slice(1);

        const acoesCell = row.insertCell(4);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => removerNotaFiscal(nf.id);
        acoesCell.appendChild(removeButton);
    });
}

// Faturamento
function calcularFaturamento() {
    let totalFaturamento = 0;
    notasFiscais.forEach(nf => {
        let valorNota = parseFloat(nf.valor);
        if (nf.tipo !== 'devolucao') {
            totalFaturamento += valorNota;
        } else {
            totalFaturamento -= valorNota;
        }
    });

    const totalImpostos = totalFaturamento * 0.10;
    const faturamentoLiquido = totalFaturamento - totalImpostos;
    document.getElementById('faturamento-valor').textContent = faturamentoLiquido.toFixed(2);
    salvarDados();
}

function atualizarGraficosFaturamento() {
    const notasFrete = notasFiscais.filter(nf => nf.tipo === 'frete');
    const notasServico = notasFiscais.filter(nf => nf.tipo === 'servico');
    const notasDevolucao = notasFiscais.filter(nf => nf.tipo === 'devolucao');
    exibirResumoDeNotas('frete', notasFrete);
    exibirResumoDeNotas('servico', notasServico);
    exibirResumoDeNotas('devolucao', notasDevolucao);
    gerarGraficoFaturamentoLiquido();
    gerarGraficoFaturamentoPorTipo('frete-chart', 'Faturamento de Frete', notasFrete, '#3498db');
    gerarGraficoFaturamentoPorTipo('servico-chart', 'Faturamento de Serviço', notasServico, '#2ecc71');
    gerarGraficoFaturamentoPorTipo('devolucao-chart', 'Notas de Devolução', notasDevolucao, '#e74c3c');
}

function exibirResumoDeNotas(tipo, notas) {
    const totalNotas = notas.length;
    const somaValores = notas.reduce((total, nf) => total + nf.valor, 0);
    document.getElementById(`${tipo}-count`).textContent = totalNotas;
    document.getElementById(`${tipo}-value`).textContent = somaValores.toFixed(2);
}

function gerarGraficoFaturamentoLiquido() {
    const ctx = document.getElementById('faturamento-liquido-chart').getContext('2d');
    const dadosPorMes = notasFiscais.reduce((acc, nf) => {
        const mesAno = new Date(nf.data).toISOString().slice(0, 7);
        let valor = parseFloat(nf.valor);
        if (nf.tipo !== 'devolucao') {
            valor = valor * 0.90;
        } else {
            valor = valor * -1;
        }
        acc[mesAno] = (acc[mesAno] || 0) + valor;
        return acc;
    }, {});
    const labels = Object.keys(dadosPorMes).sort();
    const data = labels.map(mes => dadosPorMes[mes]);
    if (window.faturamentoLiquidoChart instanceof Chart) {
        window.faturamentoLiquidoChart.destroy();
    }
    window.faturamentoLiquidoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento Líquido (R$)',
                data: data,
                borderColor: '#2980b9',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mês/Ano'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

function gerarGraficoFaturamentoPorTipo(canvasId, titulo, notas, cor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const dadosPorMes = notas.reduce((acc, nf) => {
        const mesAno = new Date(nf.data).toISOString().slice(0, 7);
        let valor = parseFloat(nf.valor);
        if (nf.tipo !== 'devolucao') {
            valor = valor * 0.90;
        }
        acc[mesAno] = (acc[mesAno] || 0) + valor;
        return acc;
    }, {});
    const labels = Object.keys(dadosPorMes).sort();
    const data = labels.map(mes => dadosPorMes[mes]);
    if (window[canvasId] instanceof Chart) {
        window[canvasId].destroy();
    }
    window[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: data,
                backgroundColor: cor,
                borderColor: cor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mês/Ano'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    }
                }
            }
        }
    });
}

// Performance Veículos
document.getElementById('vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const distance = parseFloat(document.getElementById('distance').value);
    const fuelLiters = parseFloat(document.getElementById('fuel-liters').value);
    const fuelPrice = parseFloat(document.getElementById('fuel-price').value);
    const vehicle = document.getElementById('vehicle').value;
    const vehicleCondition = document.getElementById('vehicle-condition').value;
    if (!isNaN(distance) && !isNaN(fuelLiters) && !isNaN(fuelPrice) && vehicle && vehicleCondition) {
        const codigoViagem = gerarCodigoViagem();
        calcularDesempenhoVeiculo(distance, fuelLiters, fuelPrice, vehicle, vehicleCondition, codigoViagem);
        this.reset();
    }
});

function gerarCodigoViagem() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'V-';
    for (let i = 0; i < 8; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

function calcularDesempenhoVeiculo(distancia, litros, precoCombustivel, veiculo, condicaoVeiculo, codigoViagem) {
    const custoCombustivel = litros * precoCombustivel;
    const eficiencia = distancia / litros;
    const custoPorKm = custoCombustivel / distancia;
    const novaViagem = {
        id: Date.now(),
        veiculo: veiculo,
        distancia: distancia,
        eficiencia: eficiencia,
        custoTotal: custoCombustivel,
        codigoViagem: codigoViagem
    };
    viagens.push(novaViagem);
    salvarDados();
    document.getElementById('fuel-cost').textContent = `R$ ${custoCombustivel.toFixed(2)}`;
    document.getElementById('fuel-efficiency').textContent = `${eficiencia.toFixed(2)} km/L`;
    document.getElementById('cost-per-km').textContent = `R$ ${custoPorKm.toFixed(2)}`;
    document.getElementById('code-travel').value = codigoViagem;
    gerarGraficoComparativoVeiculos();
    gerarGraficoCustoVeiculos();
    renderizarTabelaViagens();
    alert('Desempenho da viagem calculado e salvo!');
}

function removerViagem(id) {
    viagens = viagens.filter(viagem => viagem.id !== id);
    salvarDados();
    gerarGraficoComparativoVeiculos();
    gerarGraficoCustoVeiculos();
    renderizarTabelaViagens();
}

function renderizarTabelaViagens() {
    const tabelaBody = document.getElementById('vehicle-table').querySelector('tbody');
    tabelaBody.innerHTML = '';
    viagens.forEach(viagem => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = viagem.codigoViagem;
        row.insertCell(1).textContent = viagem.veiculo;
        row.insertCell(2).textContent = `${viagem.distancia} km`;
        row.insertCell(3).textContent = `${viagem.eficiencia.toFixed(2)} km/L`;
        row.insertCell(4).textContent = `R$ ${viagem.custoTotal.toFixed(2)}`;
        const acoesCell = row.insertCell(5);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => removerViagem(viagem.id);
        acoesCell.appendChild(removeButton);
    });
}

function gerarGraficoComparativoVeiculos() {
    const ctx = document.getElementById('vehicle-comparison-chart').getContext('2d');
    const labels = viagens.map(v => v.veiculo); 
    const data = viagens.map(v => v.eficiencia);
    if (window.vehicleComparisonChart instanceof Chart) {
        window.vehicleComparisonChart.destroy();
    }
    window.vehicleComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Eficiência (Km/L)',
                data: data,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1,
                barPercentage: 0.8,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => {
                        return value.toFixed(2) + ' km/L';
                    },
                    color: '#000',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Eficiência (Km/L)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Veículo'
                    }
                }
            }
        }
    });
}

function gerarGraficoCustoVeiculos() {
    const ctx = document.getElementById('cost-breakdown-chart').getContext('2d');
    const ultimoCusto = viagens.length > 0 ? viagens[viagens.length - 1].custoTotal : 0;
    const custoPedagios = pedagios.reduce((total, p) => total + p.valor, 0);
    const data = {
        labels: ['Combustível', 'Pedágios', 'Outros'],
        datasets: [{
            data: [ultimoCusto, custoPedagios, 100], 
            backgroundColor: ['#3498db', '#f1c40f', '#e74c3c'],
            hoverBackgroundColor: ['#2980b9', '#f39c12', '#c0392b']
        }]
    };
    if (window.costBreakdownChart instanceof Chart) {
        window.costBreakdownChart.destroy();
    }
    window.costBreakdownChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Pedágios
document.getElementById('toll-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('toll-value').value);
    const data = document.getElementById('toll-date').value;
    const veiculo = document.getElementById('toll-vehicle').value;
    const codigoViagem = document.getElementById('toll-code-travel').value;
    if (!isNaN(valor) && data && veiculo && codigoViagem) {
        adicionarPedagio(valor, data, veiculo, codigoViagem);
        this.reset();
    }
});

function adicionarPedagio(valor, data, veiculo, codigoViagem) {
    const novoPedagio = {
        id: Date.now(),
        valor: valor,
        data: data,
        veiculo: veiculo,
        codigoViagem: codigoViagem
    };
    pedagios.push(novoPedagio);
    salvarDados();
    renderizarPedagios();
    alert('Pedágio adicionado com sucesso!');
}

function removerPedagio(id) {
    pedagios = pedagios.filter(pedagio => pedagio.id !== id);
    salvarDados();
    renderizarPedagios();
}

function renderizarPedagios() {
    const tabelaBody = document.getElementById('toll-table').querySelector('tbody');
    tabelaBody.innerHTML = '';
    let totalPedagios = 0;
    pedagios.forEach(pedagio => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = pedagio.data;
        row.insertCell(1).textContent = pedagio.veiculo;
        row.insertCell(2).textContent = pedagio.codigoViagem;
        row.insertCell(3).textContent = `R$ ${pedagio.valor.toFixed(2)}`;
        const acoesCell = row.insertCell(4);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => removerPedagio(pedagio.id);
        acoesCell.appendChild(removeButton);
        totalPedagios += pedagio.valor;
    });
    document.getElementById('toll-total').textContent = totalPedagios.toFixed(2);
    salvarDados();
}

// Clientes
document.getElementById('client-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('client-name').value;
    const cnpj = document.getElementById('client-cnpj').value;
    const contato = document.getElementById('client-contact').value;
    if (nome && cnpj && contato) {
        adicionarCliente(nome, cnpj, contato);
        this.reset();
    }
});

function adicionarCliente(nome, cnpj, contato) {
    const novoCliente = {
        id: Date.now(),
        nome: nome,
        cnpj: cnpj,
        contato: contato,
        dataAdicao: new Date().toISOString().slice(0, 10)
    };
    clientes.push(novoCliente);
    salvarDados();
    renderizarTabelaClientes();
    alert('Cliente adicionado com sucesso!');
}

function removerCliente(id) {
    clientes = clientes.filter(cliente => cliente.id !== id);
    salvarDados();
    renderizarTabelaClientes();
}

function renderizarTabelaClientes() {
    const tabelaBody = document.getElementById('client-table').querySelector('tbody');
    tabelaBody.innerHTML = '';
    clientes.forEach(cliente => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = cliente.nome;
        row.insertCell(1).textContent = cliente.cnpj;
        row.insertCell(2).textContent = cliente.contato;
        const acoesCell = row.insertCell(3);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover';
        removeButton.classList.add('remove-btn');
        removeButton.onclick = () => removerCliente(cliente.id);
        acoesCell.appendChild(removeButton);
    });
}

// Funções de Exportação de Dados
function exportarParaExcel(dados, nomeDoArquivo) {
    if (dados.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const headers = Object.keys(dados[0]);
    const csvRows = [];
    csvRows.push(headers.join(';'));
    for (const row of dados) {
        const values = headers.map(header => {
            const value = row[header];
            let formattedValue = String(value).replace(/;/g, ',').replace(/\n/g, '').replace(/"/g, '""');
            if (formattedValue.includes(',') || !isNaN(value)) {
                formattedValue = `"${formattedValue}"`;
            }
            return formattedValue;
        });
        csvRows.push(values.join(';'));
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${nomeDoArquivo}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Event Listeners para os botões de download
document.getElementById('download-nf-excel').addEventListener('click', () => {
    exportarParaExcel(notasFiscais, 'NotasFiscais');
});
document.getElementById('download-vehicle-excel').addEventListener('click', () => {
    exportarParaExcel(viagens, 'PerformanceVeiculos');
});
document.getElementById('download-toll-excel').addEventListener('click', () => {
    exportarParaExcel(pedagios, 'HistoricoPedagios');
});
document.getElementById('download-client-excel').addEventListener('click', () => {
    exportarParaExcel(clientes, 'ListaClientes');
});