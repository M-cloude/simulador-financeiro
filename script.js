document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const simulationType = e.target.getAttribute('data-simulation');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            e.target.classList.add('active');

            loadSimulationContent(simulationType);
        });
    });

    const defaultItem = document.querySelector('.menu-item[data-simulation="emprestimo"]');
    if (defaultItem) {
        defaultItem.classList.add('active');
    }
    loadSimulationContent('emprestimo');
});

function formatInputNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/^0+/, '');
    if (value === '') {
        input.value = '';
        return;
    }
    let formattedValue = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0 }).format(value);
    input.value = formattedValue;
}

function formatarResultado(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) {
        return "R$ 0,00";
    }
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
}

function unformatNumber(formattedNumber) {
    if (typeof formattedNumber !== 'string') return formattedNumber;
    return parseFloat(formattedNumber.replace(/\./g, '').replace(/,/g, '.'));
}

function generateGuidance(simulationType, results) {
    const guidanceTextElement = document.getElementById('guidance-text');
    let guidanceMessage = '';

    if (simulationType === 'emprestimo') {
        const { valorEmprestimo, parcela, totalJuros } = results;
        guidanceMessage = `
            Olá! De acordo com a sua simulação de empréstimo, o valor da parcela mensal é de **R$ ${formatarResultado(parcela)}** e o total de juros pagos ao final do contrato será de **R$ ${formatarResultado(totalJuros)}**.
            
            **Dicas importantes:**
            * Compare a parcela com sua renda mensal. O ideal é que as parcelas não comprometam mais que 30% da sua renda.
            * O montante de juros é o custo real do seu empréstimo. Avalie se esse valor está dentro do seu planejamento.
            * Pesquise e negocie as taxas de juros, pois pequenas diferenças podem gerar uma grande economia a longo prazo.
        `;
    } else if (simulationType === 'habitacional') {
        const { valorFinanciado, parcela, totalJuros } = results;
        guidanceMessage = `
            Com base na sua simulação habitacional, a parcela mensal é de **R$ ${formatarResultado(parcela)}** e o total de juros ao longo do tempo é de **R$ ${formatarResultado(totalJuros)}**.
            
            **Dicas importantes:**
            * Financiamentos de longo prazo tendem a acumular um alto valor em juros. Considere se é possível amortizar o saldo devedor para reduzir o total pago.
            * Sua entrada é de **R$ ${formatarResultado(valorFinanciado)}**. Entradas maiores diminuem o valor financiado e o total de juros.
            * Lembre-se de que além da parcela, você terá custos adicionais como seguros e taxas administrativas.
        `;
    } else if (simulationType === 'renda') {
        const { rendaMensal, gastosTotais, superavit } = results;
        const superavitText = superavit >= 0 ? `superávit (sobra)` : `déficit (falta)`;
        const superavitColor = superavit >= 0 ? 'uma situação financeira saudável' : 'uma situação que exige atenção';
        const superavitAmount = Math.abs(superavit);

        guidanceMessage = `
            Sua análise de renda indica um **${superavitText}** de **R$ ${formatarResultado(superavitAmount)}**. Isso significa ${superavitColor}.
            
            **Dicas importantes:**
            * **Se você tem superávit:** Use o valor excedente para criar uma reserva de emergência ou para investir e fazer o seu dinheiro crescer.
            * **Se você tem déficit:** É essencial revisar seus gastos e encontrar maneiras de reduzir despesas variáveis. Considere também a possibilidade de aumentar sua renda.
            * Mantenha o controle das suas finanças. Um planejamento detalhado é a chave para a estabilidade e o crescimento financeiro.
        `;
    }
    guidanceTextElement.innerHTML = guidanceMessage;
}

function loadSimulationContent(simulationType) {
    const simulationContentDiv = document.getElementById('simulation-content');
    simulationContentDiv.innerHTML = ''; 

    if (simulationType === 'emprestimo') {
        const emprestimoHTML = `
            <div class="dashboard-container">
                <header class="main-header">
                    <h2>Simulação de Empréstimo</h2>
                </header>
                <div class="dashboard-cards-container">
                    <div class="card input-card">
                        <p class="card-title">Valor do Empréstimo (R$)</p>
                        <input type="text" id="valor-emprestimo" placeholder="Ex: 50.000,00" oninput="formatInputNumber(this)">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Prazo (meses)</p>
                        <input type="number" id="prazo-meses" placeholder="Ex: 24">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Taxa de Juros Anual (%)</p>
                        <input type="number" id="taxa-juros" placeholder="Ex: 10.5">
                    </div>
                </div>
                <button id="calcular-emprestimo" class="btn-calculate">Calcular</button>
                <div class="dashboard-cards-container">
                    <div class="card result-card">
                        <p class="card-title">Valor da Parcela</p>
                        <h3 id="resultado-parcela">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Total Pago</p>
                        <h3 id="resultado-total-pago">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Total de Juros</p>
                        <h3 id="resultado-total-juros">R$ 0,00</h3>
                    </div>
                </div>
                <div class="chart-container">
                    <h2>Gráficos de Análise</h2>
                    <div class="chart-group-container">
                        <div class="chart-item">
                            <canvas id="amortizacao-grafico"></canvas>
                        </div>
                        <div class="chart-item">
                            <canvas id="juros-pizza-grafico"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        simulationContentDiv.innerHTML = emprestimoHTML;
        const btnCalcular = document.getElementById('calcular-emprestimo');
        if (btnCalcular) {
            btnCalcular.addEventListener('click', calcularEmprestimo);
        }

    } else if (simulationType === 'habitacional') {
        const habitacionalHTML = `
            <div class="dashboard-container">
                <header class="main-header">
                    <h2>Simulação Habitacional</h2>
                </header>
                <div class="dashboard-cards-container">
                    <div class="card input-card">
                        <p class="card-title">Valor do Imóvel (R$)</p>
                        <input type="text" id="valorImovel" name="valorImovel" required oninput="formatInputNumber(this)" placeholder="Ex: 500.000,00">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Valor da Entrada (R$)</p>
                        <input type="text" id="entrada" name="entrada" required oninput="formatInputNumber(this)" placeholder="Ex: 100.000,00">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Prazo (anos)</p>
                        <input type="number" id="prazoAnos" name="prazoAnos" required placeholder="Ex: 30">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Juros anuais (%)</p>
                        <input type="number" id="jurosAnuais" name="jurosAnuais" required placeholder="Ex: 8.5">
                    </div>
                </div>
                <button id="simular-habitacional" class="btn-calculate">Simular</button>
                <div class="dashboard-cards-container">
                    <div class="card result-card">
                        <p class="card-title">Valor da Parcela</p>
                        <h3 id="resultado-parcela-hab">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Total Pago</p>
                        <h3 id="resultado-total-pago-hab">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Total de Juros</p>
                        <h3 id="resultado-total-juros-hab">R$ 0,00</h3>
                    </div>
                </div>
                <div class="chart-container">
                    <h2>Gráficos de Análise</h2>
                    <div class="chart-group-container">
                        <div class="chart-item">
                            <canvas id="amortizacao-grafico-hab"></canvas>
                        </div>
                        <div class="chart-item">
                            <canvas id="proporcao-pizza-grafico"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        simulationContentDiv.innerHTML = habitacionalHTML;
        
        const btnSimular = document.getElementById('simular-habitacional');
        if (btnSimular) {
            btnSimular.addEventListener('click', calcularHabitacional);
        }

    } else if (simulationType === 'renda') {
        const rendaHTML = `
            <div class="dashboard-container">
                <header class="main-header">
                    <h2>Simulação de Renda Pessoal</h2>
                </header>
                <div class="dashboard-cards-container">
                    <div class="card input-card">
                        <p class="card-title">Renda Mensal Líquida (R$)</p>
                        <input type="text" id="rendaMensal" name="rendaMensal" required oninput="formatInputNumber(this)" placeholder="Ex: 5.000,00">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Dívidas Fixas (R$)</p>
                        <input type="text" id="dividasFixas" name="dividasFixas" required oninput="formatInputNumber(this)" placeholder="Ex: 1.500,00">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Dívidas Variáveis (R$)</p>
                        <input type="text" id="dividasVariaveis" name="dividasVariaveis" required oninput="formatInputNumber(this)" placeholder="Ex: 800,00">
                    </div>
                    <div class="card input-card">
                        <p class="card-title">Investimento (Projetos Pessoais) (R$)</p>
                        <input type="text" id="investimento" name="investimento" required oninput="formatInputNumber(this)" placeholder="Ex: 500,00">
                    </div>
                </div>
                <button id="calcular-renda" class="btn-calculate">Calcular</button>
                <div class="dashboard-cards-container">
                    <div class="card result-card">
                        <p class="card-title">Renda Mensal</p>
                        <h3 id="resultado-renda">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Total de Gastos</p>
                        <h3 id="resultado-gastos">R$ 0,00</h3>
                    </div>
                    <div class="card result-card">
                        <p class="card-title">Superávit/Déficit</p>
                        <h3 id="resultado-superavit">R$ 0,00</h3>
                    </div>
                </div>
                <div class="chart-container">
                    <h2>Análise Financeira</h2>
                    <div class="chart-group-container">
                        <div class="chart-item">
                            <canvas id="renda-bar-grafico"></canvas>
                        </div>
                        <div class="chart-item">
                            <canvas id="renda-pizza-grafico"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        simulationContentDiv.innerHTML = rendaHTML;
        
        const btnCalcularRenda = document.getElementById('calcular-renda');
        if (btnCalcularRenda) {
            btnCalcularRenda.addEventListener('click', calcularRenda);
        }
    }
    
    // **Ajuste importante: Adicionar os event listeners após o conteúdo ser carregado**
    const guidanceBtn = document.getElementById('show-guidance-btn');
    const closeBtn = document.getElementById('close-guidance-btn');
    const guidanceModal = document.getElementById('guidance-modal');

    if (guidanceBtn) {
        guidanceBtn.addEventListener('click', () => {
            guidanceModal.classList.add('show');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            guidanceModal.classList.remove('show');
        });
    }
}

let meuGraficoEmprestimo, meuGraficoHabitacional, meuGraficoRendaBar, meuGraficoRendaPizza, meuGraficoPizzaEmprestimo, meuGraficoPizzaHabitacional;

function calcularEmprestimo() {
    const valorEmprestimo = unformatNumber(document.getElementById('valor-emprestimo').value);
    const taxaJurosAnual = parseFloat(document.getElementById('taxa-juros').value);
    const prazoMeses = parseInt(document.getElementById('prazo-meses').value);
    if (isNaN(valorEmprestimo) || isNaN(taxaJurosAnual) || isNaN(prazoMeses) || valorEmprestimo <= 0 || prazoMeses <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }
    const taxaJurosMensal = (taxaJurosAnual / 100) / 12;
    const parcela = valorEmprestimo * (taxaJurosMensal / (1 - Math.pow(1 + taxaJurosMensal, -prazoMeses)));
    let saldoDevedor = valorEmprestimo;
    const dadosGrafico = [];
    let totalJuros = 0;
    for (let i = 0; i < prazoMeses; i++) {
        const jurosMes = saldoDevedor * taxaJurosMensal;
        const amortizacaoMes = parcela - jurosMes;
        saldoDevedor -= amortizacaoMes;
        totalJuros += jurosMes;
        dadosGrafico.push({
            mes: i + 1,
            saldo: saldoDevedor
        });
    }
    const totalPago = parcela * prazoMeses;
    exibirResultadosEmprestimo(parcela, totalPago, totalJuros);
    criarGraficoAmortizacaoEmprestimo(dadosGrafico);
    criarGraficoPizzaEmprestimo(valorEmprestimo, totalJuros);
    generateGuidance('emprestimo', { valorEmprestimo, parcela, totalJuros });
}

function exibirResultadosEmprestimo(parcela, totalPago, totalJuros) {
    document.getElementById('resultado-parcela').textContent = `R$ ${formatarResultado(parcela)}`;
    document.getElementById('resultado-total-pago').textContent = `R$ ${formatarResultado(totalPago)}`;
    document.getElementById('resultado-total-juros').textContent = `R$ ${formatarResultado(totalJuros)}`;
}

function criarGraficoAmortizacaoEmprestimo(dados) {
    const ctx = document.getElementById('amortizacao-grafico').getContext('2d');
    if (meuGraficoEmprestimo) {
        meuGraficoEmprestimo.destroy();
    }
    meuGraficoEmprestimo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(item => `Mês ${item.mes}`),
            datasets: [{
                label: 'Saldo Devedor',
                data: dados.map(item => item.saldo.toFixed(2)),
                borderColor: '#d66800',
                backgroundColor: 'rgba(214, 104, 0, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Meses' } },
                y: { title: { display: true, text: 'Valor (R$)' }, beginAtZero: true }
            },
            plugins: { title: { display: true, text: 'Evolução do Saldo Devedor' } }
        }
    });
}

function criarGraficoPizzaEmprestimo(valorPrincipal, totalJuros) {
    const ctx = document.getElementById('juros-pizza-grafico').getContext('2d');
    if (meuGraficoPizzaEmprestimo) {
        meuGraficoPizzaEmprestimo.destroy();
    }
    meuGraficoPizzaEmprestimo = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Valor Principal', 'Total de Juros'],
            datasets: [{
                data: [valorPrincipal, totalJuros],
                backgroundColor: ['#d66800', '#f8d29b']
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Proporção Principal vs. Juros' } }
        }
    });
}

function calcularHabitacional() {
    const valorImovel = unformatNumber(document.getElementById('valorImovel').value);
    const entrada = unformatNumber(document.getElementById('entrada').value);
    const prazoAnos = parseInt(document.getElementById('prazoAnos').value);
    const jurosAnuais = parseFloat(document.getElementById('jurosAnuais').value);
    if (isNaN(valorImovel) || isNaN(entrada) || isNaN(prazoAnos) || isNaN(jurosAnuais) || valorImovel <= 0 || entrada <= 0 || prazoAnos <= 0 || jurosAnuais < 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }
    if (entrada >= valorImovel) {
        alert('O valor da entrada não pode ser maior ou igual ao valor do imóvel.');
        return;
    }
    const valorFinanciado = valorImovel - entrada;
    const jurosMensais = (jurosAnuais / 100) / 12;
    const prazoMeses = prazoAnos * 12;
    const parcela = valorFinanciado * jurosMensais / (1 - Math.pow(1 + jurosMensais, -prazoMeses));
    let saldoDevedor = valorFinanciado;
    const principalData = [];
    const jurosData = [];
    let totalJurosPago = 0;
    const labels = [];
    for (let i = 1; i <= prazoMeses; i++) {
        const jurosMes = saldoDevedor * jurosMensais;
        const amortizacao = parcela - jurosMes;
        saldoDevedor -= amortizacao;
        totalJurosPago += jurosMes;
        principalData.push(amortizacao);
        jurosData.push(jurosMes);
        labels.push(`Mês ${i}`);
    }
    const totalPago = parcela * prazoMeses;
    const totalJuros = totalJurosPago;
    exibirResultadosHabitacional(parcela, totalPago, totalJuros);
    criarGraficoAmortizacaoHabitacional(labels, principalData, jurosData);
    criarGraficoPizzaHabitacional(valorFinanciado, totalJuros);
    generateGuidance('habitacional', { valorFinanciado, parcela, totalJuros });
}

function exibirResultadosHabitacional(parcela, totalPago, totalJuros) {
    document.getElementById('resultado-parcela-hab').textContent = `R$ ${formatarResultado(parcela)}`;
    document.getElementById('resultado-total-pago-hab').textContent = `R$ ${formatarResultado(totalPago)}`;
    document.getElementById('resultado-total-juros-hab').textContent = `R$ ${formatarResultado(totalJuros)}`;
}

function criarGraficoAmortizacaoHabitacional(labels, principalData, jurosData) {
    const ctx = document.getElementById('amortizacao-grafico-hab').getContext('2d');
    if (meuGraficoHabitacional) {
        meuGraficoHabitacional.destroy();
    }
    meuGraficoHabitacional = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amortização Principal',
                data: principalData,
                borderColor: '#d66800',
                backgroundColor: 'rgba(214, 104, 0, 0.2)',
                fill: true,
                tension: 0.1,
            }, {
                label: 'Juros',
                data: jurosData,
                borderColor: '#a75000',
                backgroundColor: 'rgba(167, 80, 0, 0.2)',
                tension: 0.1,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Evolução dos Pagamentos (Principal e Juros)' } },
            scales: {
                x: { title: { display: true, text: 'Meses' } },
                y: { title: { display: true, text: 'Valor (R$)' }, beginAtZero: true }
            }
        }
    });
}

function criarGraficoPizzaHabitacional(valorFinanciado, totalJuros) {
    const ctx = document.getElementById('proporcao-pizza-grafico').getContext('2d');
    if (meuGraficoPizzaHabitacional) {
        meuGraficoPizzaHabitacional.destroy();
    }
    meuGraficoPizzaHabitacional = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Valor Financiado', 'Total de Juros'],
            datasets: [{
                data: [valorFinanciado, totalJuros],
                backgroundColor: ['#d66800', '#f8d29b']
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Proporção Financiamento vs. Juros' } }
        }
    });
}

function calcularRenda() {
    const rendaMensal = unformatNumber(document.getElementById('rendaMensal').value);
    const dividasFixas = unformatNumber(document.getElementById('dividasFixas').value);
    const dividasVariaveis = unformatNumber(document.getElementById('dividasVariaveis').value);
    const investimento = unformatNumber(document.getElementById('investimento').value);
    if (isNaN(rendaMensal) || isNaN(dividasFixas) || isNaN(dividasVariaveis) || isNaN(investimento) || rendaMensal <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }
    const gastosTotais = dividasFixas + dividasVariaveis + investimento;
    const superavit = rendaMensal - gastosTotais;
    exibirResultadosRenda(rendaMensal, gastosTotais, superavit);
    criarGraficoRenda(rendaMensal, gastosTotais, dividasFixas, dividasVariaveis, investimento);
    generateGuidance('renda', { rendaMensal, gastosTotais, superavit });
}

function exibirResultadosRenda(rendaMensal, gastosTotais, superavit) {
    document.getElementById('resultado-renda').textContent = `R$ ${formatarResultado(rendaMensal)}`;
    document.getElementById('resultado-gastos').textContent = `R$ ${formatarResultado(gastosTotais)}`;
    const superavitElement = document.getElementById('resultado-superavit');
    superavitElement.textContent = `R$ ${formatarResultado(Math.abs(superavit))}`;
    if (superavit < 0) {
        superavitElement.style.color = 'red';
        superavitElement.textContent = `DÉFICIT R$ ${formatarResultado(Math.abs(superavit))}`;
    } else if (superavit > 0) {
        superavitElement.style.color = 'green';
        superavitElement.textContent = `SUPERÁVIT R$ ${formatarResultado(superavit)}`;
    } else {
        superavitElement.style.color = 'gray';
        superavitElement.textContent = `R$ ${formatarResultado(superavit)}`;
    }
}

function criarGraficoRenda(rendaMensal, gastosTotais, dividasFixas, dividasVariaveis, investimento) {
    const ctxBar = document.getElementById('renda-bar-grafico').getContext('2d');
    const ctxPie = document.getElementById('renda-pizza-grafico').getContext('2d');

    if (meuGraficoRendaBar) { meuGraficoRendaBar.destroy(); }
    if (meuGraficoRendaPizza) { meuGraficoRendaPizza.destroy(); }
    
    meuGraficoRendaBar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Renda Mensal', 'Gastos Totais'],
            datasets: [{
                label: 'Comparativo',
                data: [rendaMensal, gastosTotais],
                backgroundColor: ['#d66800', '#a75000']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Valor (R$)' } }
            },
            plugins: { title: { display: true, text: 'Renda Líquida vs. Gastos Totais' } }
        }
    });

    meuGraficoRendaPizza = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['Dívidas Fixas', 'Dívidas Variáveis', 'Investimento', 'Superávit/Déficit'],
            datasets: [{
                data: [dividasFixas, dividasVariaveis, investimento, rendaMensal - gastosTotais],
                backgroundColor: ['#d66800', '#a75000', '#f8d29b', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Distribuição da Renda' } }
        }
    });
}