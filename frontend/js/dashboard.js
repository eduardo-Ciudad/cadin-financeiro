/* Dashboard page logic */
(function () {
    requireAuth();

    var mainContent = document.getElementById('mainContent');
    var dataDiario = todayISO();

    /* ===========================
       INIT
    =========================== */
    async function loadDashboard() {
        mainContent.innerHTML = '<div class="loading-center"><span class="spinner spinner-lg"></span></div>';
        try {
            var data = await api.get('/dashboard');
            render(data);
            setupResumoDiario();
            loadResumoMensal();
            loadVendaRapida();
        } catch (err) {
            mainContent.innerHTML =
                '<div class="loading-center"><p class="text-muted">Erro ao carregar dashboard. Tente recarregar a página.</p></div>';
            handleApiError(err);
        }
    }

    /* ===========================
       CARDS EXISTENTES (não alterar)
    =========================== */
    function render(data) {
        var total = data.totalAReceber || 0;
        var qtd   = data.qtdDevedores || 0;
        var top   = data.topDevedores || [];

        mainContent.innerHTML =
            // ===== RESUMO DO DIA (topo) =====
            '<section class="card" id="resumoDiarioSection" style="margin-bottom:var(--space-xl)">' +
                '<div class="card-header">' +
                    '<div class="dia-nav">' +
                        '<button class="btn btn-ghost btn-sm" id="btnDiaAnterior" title="Dia anterior">&#8592;</button>' +
                        '<h4 id="resumoDiarioTitulo">Resumo do Dia</h4>' +
                        '<button class="btn btn-ghost btn-sm" id="btnDiaProximo" title="Próximo dia">&#8594;</button>' +
                    '</div>' +
                '</div>' +
                '<div id="resumoDiarioBody">' +
                    '<div class="loading-center"><span class="spinner spinner-sm"></span></div>' +
                '</div>' +
            '</section>' +
            // ===== CONTEÚDO EXISTENTE =====
            '<div class="dashboard-grid">' +
                statCard(
                    'Total a Receber',
                    '<span class="' + (total > 0 ? 'text-success' : 'text-muted') + '">' + formatMoney(total) + '</span>',
                    'stat-icon-success',
                    iconMoney()
                ) +
                statCard(
                    'Clientes Devedores',
                    '<span class="' + (qtd > 0 ? 'text-danger' : 'text-muted') + '">' + qtd + '</span>',
                    'stat-icon-danger',
                    iconUsers()
                ) +
            '</div>' +
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3>Top Devedores</h3>' +
                    '<a href="clientes.html" class="btn btn-secondary btn-sm">Ver todos</a>' +
                '</div>' +
                '<div class="card-body">' +
                    renderTopDevedores(top) +
                '</div>' +
            '</div>' +

            // Seções do gráfico mensal (preenchidas por loadResumoMensal)
            '<section class="card" id="resumoMensalSection" style="margin-top:var(--space-xl)">' +
                '<div class="card-header"><h4>Movimentação Mensal</h4></div>' +
                '<div class="card-body">' +
                  '<div class="card-body">' +
    '<div id="vendaMensalHeader" class="venda-mensal-header"></div>' +
    '<div style="position:relative;height:320px;margin-bottom:var(--space-lg)">' +
        '<canvas id="graficoMensal"></canvas>' +
    '</div>' +
                    '<div id="mesesBotoes" style="display:flex;flex-wrap:wrap;gap:var(--space-sm)">' +
                        '<div class="loading-center" style="padding:var(--space-md)">' +
                            '<span class="spinner spinner-sm"></span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            '<section class="card hidden" id="detalheMesSection" style="margin-top:var(--space-lg)">' +
                '<div class="card-header">' +
                    '<h4 id="detalheMesTitulo">Detalhes</h4>' +
                    '<button class="btn btn-secondary btn-sm" id="btnFecharDetalheMes">✕ Fechar</button>' +
                '</div>' +
                '<div class="card-body">' +
                    '<div class="table-wrapper">' +
                        '<table class="table">' +
                            '<thead><tr>' +
                                '<th>Data</th>' +
                                '<th>Cliente</th>' +
                                '<th>Categoria</th>' +
                                '<th class="text-right">Valor</th>' +
                            '</tr></thead>' +
                            '<tbody id="detalheMesTableBody"></tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            // ===== VENDA RÁPIDA =====
            '<section class="card" id="vendaRapidaSection" style="margin-top:var(--space-xl)">' +
                '<div class="card-header"><h4>Venda Rápida</h4></div>' +
                '<div class="card-body">' +
                    '<form id="formVendaRapida" novalidate>' +
                        '<div class="venda-rapida-grid">' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrCliente">Cliente</label>' +
                                '<select id="vrCliente" class="form-input"><option value="">Carregando...</option></select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrProduto">Produto</label>' +
                                '<select id="vrProduto" class="form-input"><option value="">Carregando...</option></select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrQtd">Quantidade</label>' +
                                '<input id="vrQtd" type="number" class="form-input" min="0.01" step="0.01" placeholder="1">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrPreco">Preço Unitário</label>' +
                                '<input id="vrPreco" type="number" class="form-input" min="0" step="0.01" placeholder="0.00">' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrForma">Forma de Pagamento</label>' +
                                '<select id="vrForma" class="form-input">' +
                                    '<option value="">Selecione...</option>' +
                                    '<option value="PIX">PIX</option>' +
                                    '<option value="DINHEIRO">DINHEIRO</option>' +
                                    '<option value="CARTAO">CARTÃO</option>' +
                                    '<option value="FIADO">FIADO</option>' +
                                '</select>' +
                            '</div>' +
                            '<div class="form-group">' +
                                '<label class="form-label" for="vrData">Data</label>' +
                                '<input id="vrData" type="date" class="form-input" value="' + todayISO() + '">' +
                            '</div>' +
                            '<div class="venda-rapida-footer">' +
                                '<span class="venda-rapida-total" id="vrTotal">Total: R$ 0,00</span>' +
                                '<button type="submit" class="btn btn-primary btn-sm" id="btnVendaRapida">Registrar Venda</button>' +
                            '</div>' +
                        '</div>' +
                    '</form>' +
                    '<div id="vendaRapidaMsg" style="display:none;margin-top:var(--space-md);padding:var(--space-md);border-radius:var(--radius-md)"></div>' +
                '</div>' +
            '</section>';

        // Close button (once, no stacking)
        document.getElementById('btnFecharDetalheMes').addEventListener('click', function () {
            document.getElementById('detalheMesSection').classList.add('hidden');
        });
    }

    function statCard(label, valueHtml, iconClass, iconSvg) {
        return '<div class="stat-card">' +
                    '<div class="stat-icon ' + iconClass + '">' + iconSvg + '</div>' +
                    '<div class="stat-label">' + label + '</div>' +
                    '<div class="stat-value">' + valueHtml + '</div>' +
               '</div>';
    }

    function renderTopDevedores(list) {
        if (!list.length) {
            return '<p class="text-muted text-center">Nenhum devedor no momento.</p>';
        }
        return '<div class="devedores-list">' +
            list.slice(0, 5).map(function (d) {
                return '<div class="devedor-row">' +
                    '<span class="devedor-name">' + escapeHtml(d.nome) + '</span>' +
                    '<span class="devedor-saldo">' + formatMoney(d.saldo) + '</span>' +
                '</div>';
            }).join('') +
        '</div>';
    }

    function iconMoney() {
        return '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
            'd="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
        '</svg>';
    }

    function iconUsers() {
        return '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
            'd="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>' +
        '</svg>';
    }

    /* ===========================
       RESUMO DO DIA
    =========================== */
    function setupResumoDiario() {
        document.getElementById('btnDiaAnterior').addEventListener('click', function () {
            dataDiario = addDays(dataDiario, -1);
            loadResumoDiario(dataDiario);
        });
        document.getElementById('btnDiaProximo').addEventListener('click', function () {
            var proxima = addDays(dataDiario, 1);
            if (proxima <= todayISO()) {
                dataDiario = proxima;
                loadResumoDiario(dataDiario);
            }
        });
        loadResumoDiario(dataDiario);
    }

    async function loadResumoDiario(dateStr) {
        var titulo = document.getElementById('resumoDiarioTitulo');
        var body   = document.getElementById('resumoDiarioBody');
        var btnProx = document.getElementById('btnDiaProximo');

        if (titulo) titulo.textContent = 'Resumo do Dia — ' + formatDate(dateStr);
        if (body)   body.innerHTML = '<div class="loading-center"><span class="spinner spinner-sm"></span></div>';
        if (btnProx) btnProx.disabled = (dateStr >= todayISO());

        try {
            var data = await api.get('/dashboard/resumo-diario?data=' + dateStr);
            if (body) body.innerHTML = renderResumoDiarioHtml(data);
        } catch (err) {
            if (body) body.innerHTML =
                '<p class="text-muted text-center" style="padding:var(--space-lg)">Não foi possível carregar o resumo do dia.</p>';
            console.error('Erro ao carregar resumo diário', err);
        }
    }

    function renderResumoDiarioHtml(data) {
        var vendido        = parseFloat(data.totalVendido)    || 0;
        var recebido       = parseFloat(data.totalRecebido)   || 0;
        var qtdVendas      = data.quantidadeVendas            || 0;
        var qtdPagamentos  = data.quantidadePagamentos        || 0;
        var lancClientes   = data.lancamentosClientes         || [];
        var lancForns      = data.lancamentosFornecedores     || [];
        var temLancamentos = lancClientes.length + lancForns.length > 0;

        return (
            '<div class="dashboard-grid" style="grid-template-columns:1fr 1fr;padding:var(--space-lg) var(--space-lg) 0">' +
                '<div class="stat-card">' +
                    '<div class="stat-label">Total Vendido</div>' +
                    '<div class="stat-value text-danger">' + formatMoney(vendido) + '</div>' +
                    '<div class="text-muted text-sm mt-sm">' + qtdVendas + (qtdVendas === 1 ? ' venda' : ' vendas') + '</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="stat-label">Total Recebido</div>' +
                    '<div class="stat-value text-success">' + formatMoney(recebido) + '</div>' +
                    '<div class="text-muted text-sm mt-sm">' + qtdPagamentos + (qtdPagamentos === 1 ? ' pagamento' : ' pagamentos') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="padding:var(--space-lg)">' +
                (!temLancamentos
                    ? '<p class="text-muted text-center">Nenhum lançamento registrado neste dia.</p>'
                    : tabelaLancamentos('Clientes', lancClientes) + tabelaLancamentos('Fornecedores', lancForns)
                ) +
            '</div>'
        );
    }

    function tabelaLancamentos(titulo, lancamentos) {
        if (!lancamentos.length) return '';
        return (
            '<h5 class="lancamentos-section-title">' + titulo + '</h5>' +
            '<div class="table-wrapper" style="margin-bottom:var(--space-lg)">' +
                '<table class="table">' +
                    '<thead><tr>' +
                        '<th>' + titulo.slice(0, -1) + '</th>' +
                        '<th>Categoria</th>' +
                        '<th>Descrição</th>' +
                        '<th>Forma Pgto</th>' +
                        '<th class="text-right">Valor</th>' +
                    '</tr></thead>' +
                    '<tbody>' +
                        lancamentos.map(function (l) {
                            var isCredito = l.natureza === 'CREDITO';
                            var corValor  = isCredito ? 'text-success' : 'text-danger';
                            var prefixo   = isCredito ? '+' : '-';
                            return '<tr>' +
                                '<td><strong>' + escapeHtml(l.nome) + '</strong></td>' +
                                '<td>' + categoriaBadge(l.categoria) + '</td>' +
                                '<td class="text-secondary">' + escapeHtml(l.descricao || '—') + '</td>' +
                                '<td class="text-secondary">' + escapeHtml(l.formaPagamento || '—') + '</td>' +
                                '<td class="text-right font-mono ' + corValor + '">' +
                                    prefixo + formatMoney(Math.abs(parseFloat(l.valor) || 0)) +
                                '</td>' +
                            '</tr>';
                        }).join('') +
                    '</tbody>' +
                '</table>' +
            '</div>'
        );
    }

    function addDays(dateStr, n) {
        var d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    }

    /* ===========================
       RESUMO MENSAL
    =========================== */
    async function loadResumoMensal() {
    try {
        var data = await api.get('/lancamentos/resumo-mensal');
        renderVendaMensalHeader(data);
        renderGrafico(data);
        renderBotoesMeses(data);
    } catch (err) {
        var botoes = document.getElementById('mesesBotoes');
        if (botoes) botoes.innerHTML = '<small class="text-muted">Não foi possível carregar o resumo mensal.</small>';
        console.error('Erro ao carregar resumo mensal', err);
    }
}
    function renderVendaMensalHeader(dados) {
    var container = document.getElementById('vendaMensalHeader');
    if (!container || !dados.length) return;

    // Descobre o índice do mês atual
    var hoje = new Date();
    var mesAtualStr = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
    var indexAtual = -1;

    for (var i = 0; i < dados.length; i++) {
        if (dados[i].mes === mesAtualStr) {
            indexAtual = i;
            break;
        }
    }
    // Se não achou o mês atual, mostra o mais recente
    if (indexAtual === -1) indexAtual = dados.length - 1;

    window._vendaHeaderDados = dados;
    window._vendaHeaderIndex = indexAtual;

    atualizarVendaHeader();
}

function atualizarVendaHeader() {
    var container = document.getElementById('vendaMensalHeader');
    var dados = window._vendaHeaderDados;
    var idx = window._vendaHeaderIndex;
    if (!container || !dados || !dados[idx]) return;

    var d = dados[idx];
    var totalVendido = parseFloat(d.entradas) || 0;

    container.innerHTML =
        '<button class="venda-nav-btn" id="vendaPrev" ' + (idx === 0 ? 'disabled' : '') + '>‹</button>' +
        '<div class="venda-info">' +
            '<span class="venda-mes">' + formatMesLabelFull(d.mes) + '</span>' +
            '<span class="venda-valor">' + formatMoney(totalVendido) + '</span>' +
            '<span class="venda-label">vendido no mês</span>' +
        '</div>' +
        '<button class="venda-nav-btn" id="vendaNext" ' + (idx === dados.length - 1 ? 'disabled' : '') + '>›</button>';

    document.getElementById('vendaPrev').addEventListener('click', function () {
        if (window._vendaHeaderIndex > 0) {
            window._vendaHeaderIndex--;
            atualizarVendaHeader();
        }
    });

    document.getElementById('vendaNext').addEventListener('click', function () {
        if (window._vendaHeaderIndex < window._vendaHeaderDados.length - 1) {
            window._vendaHeaderIndex++;
            atualizarVendaHeader();
        }
    });
}

    function renderGrafico(dados) {
        var canvas = document.getElementById('graficoMensal');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');

        var labels   = dados.map(function (d) { return formatMesLabel(d.mes); });
        var entradas = dados.map(function (d) { return parseFloat(d.entradas) || 0; });
        var saidas   = dados.map(function (d) { return parseFloat(d.saidas)   || 0; });

        if (window.graficoMensalInstance) {
            window.graficoMensalInstance.destroy();
        }

        window.graficoMensalInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: entradas,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Saídas',
                        data: saidas,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: '#ef4444',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter, sans-serif' },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + formatMoney(context.raw);
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(45, 50, 68, 0.5)' },
                    },
                    y: {
                        ticks: {
                            color: '#94a3b8',
                            callback: function (value) { return formatMoney(value); },
                        },
                        grid: { color: 'rgba(45, 50, 68, 0.5)' },
                    },
                },
            },
        });
    }

    function renderBotoesMeses(dados) {
    var container = document.getElementById('mesesBotoes');
    if (!container) return;

    if (!dados.length) {
        container.innerHTML = '<small class="text-muted">Nenhum dado mensal disponível.</small>';
        return;
    }

    var totalEntradas = 0;
    var totalSaidas = 0;
    dados.forEach(function (d) {
        totalEntradas += parseFloat(d.entradas) || 0;
        totalSaidas   += parseFloat(d.saidas)   || 0;
    });
    var totalReceber = totalSaidas - totalEntradas;
    var totalClass = totalReceber > 0 ? 'text-danger' : 'text-success';

    var resumoGeral =
        '<div class="resumo-geral">' +
            '<span>Total a Receber: </span>' +
            '<strong class="' + totalClass + '">' + formatMoney(totalReceber) + '</strong>' +
        '</div>';

    container.innerHTML = resumoGeral + dados.map(function (d) {
        var saldo = parseFloat(d.entradas) - parseFloat(d.saidas);
        var cls = saldo >= 0 ? 'btn-success-outline' : 'btn-danger-outline';
        return '<button class="btn btn-sm ' + cls + '" data-mes="' + d.mes + '">' +
            formatMesLabel(d.mes) +
            ' <small style="opacity:0.8">(' + formatMoney(saldo) + ')</small>' +
        '</button>';
    }).join('');

    container.querySelectorAll('[data-mes]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            loadDetalheMes(this.getAttribute('data-mes'));
        });
    });
}

    /* ===========================
       DETALHE DO MÊS
    =========================== */
    async function loadDetalheMes(mes) {
        var section = document.getElementById('detalheMesSection');
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.getElementById('detalheMesTitulo').textContent = 'Detalhes — ' + formatMesLabelFull(mes);

        var tbody = document.getElementById('detalheMesTableBody');
        tbody.innerHTML = skeletonRows(4);

        try {
            var clientesData = await api.get('/clientes?page=0&size=100');
            var clientes = Array.isArray(clientesData) ? clientesData : (clientesData.content || []);

            var todosLancamentos = [];

            for (var i = 0; i < clientes.length; i++) {
                try {
                    var extrato = await api.get('/clientes/' + clientes[i].id + '/extrato?page=0&size=200');
                    var items = Array.isArray(extrato) ? extrato : (extrato.content || []);
                    items.forEach(function (item) {
                        var itemMes = (item.dataCompetencia || item.data || '').substring(0, 7);
                        if (itemMes === mes) {
                            item._clienteNome = clientes[i].nome;
                            todosLancamentos.push(item);
                        }
                    });
                } catch (_) {}
            }

            todosLancamentos.sort(function (a, b) {
                return (a.dataCompetencia || a.data || '').localeCompare(b.dataCompetencia || b.data || '');
            });

            if (!todosLancamentos.length) {
                tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Nenhum lançamento neste mês.</td></tr>';
                return;
            }

            tbody.innerHTML = todosLancamentos.map(function (item) {
                var isCredito = item.natureza === 'CREDITO' || item.categoria === 'PAGAMENTO';
                var valorColor = isCredito ? 'text-success' : 'text-danger';
                var prefix     = isCredito ? '+' : '-';
                return '<tr>' +
                    '<td class="font-mono text-sm">' + formatDate(item.dataCompetencia || item.data) + '</td>' +
                    '<td>' + escapeHtml(item._clienteNome || '—') + '</td>' +
                    '<td>' + categoriaBadge(item.categoria) + '</td>' +
                    '<td class="text-right font-mono ' + valorColor + '">' +
                        prefix + formatMoney(Math.abs(parseFloat(item.valor) || 0)) +
                    '</td>' +
                '</tr>';
            }).join('');

        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Erro ao carregar detalhes.</td></tr>';
            handleApiError(err);
        }
    }

    /* ===========================
       HELPERS DE MÊS
    =========================== */
    function formatMesLabel(mes) {
        var partes = mes.split('-');
        var nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        return nomes[parseInt(partes[1], 10) - 1] + '/' + partes[0].substring(2);
    }

    function formatMesLabelFull(mes) {
        var partes = mes.split('-');
        var nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        return nomes[parseInt(partes[1], 10) - 1] + ' ' + partes[0];
    }

    /* ===========================
       VENDA RÁPIDA
    =========================== */
    async function loadVendaRapida() {
        var selCliente = document.getElementById('vrCliente');
        var selProduto = document.getElementById('vrProduto');
        var inpQtd     = document.getElementById('vrQtd');
        var inpPreco   = document.getElementById('vrPreco');
        var form       = document.getElementById('formVendaRapida');
        if (!form || !selCliente || !selProduto) return;

        try {
            var results  = await Promise.all([
                api.get('/clientes?page=0&size=200'),
                api.get('/produtos?page=0&size=200')
            ]);
            var clientes = Array.isArray(results[0]) ? results[0] : (results[0].content || []);
            var produtos  = Array.isArray(results[1]) ? results[1] : (results[1].content  || []);

            selCliente.innerHTML = '<option value="">Selecione cliente...</option>' +
                clientes.map(function (c) {
                    return '<option value="' + c.id + '">' + escapeHtml(c.nome) + '</option>';
                }).join('');

            selProduto.innerHTML = '<option value="">Selecione produto...</option>' +
                produtos.map(function (p) {
                    return '<option value="' + p.id + '" data-preco="' + (p.precoVenda || 0) + '">' +
                        escapeHtml(p.nome) + '</option>';
                }).join('');
        } catch (err) {
            selCliente.innerHTML = '<option value="">Erro ao carregar</option>';
            selProduto.innerHTML = '<option value="">Erro ao carregar</option>';
            console.error('Erro ao carregar selects da venda rápida:', err);
        }

        selProduto.addEventListener('change', function () {
            var opt   = this.options[this.selectedIndex];
            var preco = opt ? parseFloat(opt.getAttribute('data-preco')) : NaN;
            inpPreco.value = isNaN(preco) ? '' : preco.toFixed(2);
            atualizarTotalVenda();
        });

        inpQtd.addEventListener('input', atualizarTotalVenda);
        inpPreco.addEventListener('input', atualizarTotalVenda);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleVendaRapidaSubmit();
        });
    }

    function atualizarTotalVenda() {
        var qtd   = parseFloat(document.getElementById('vrQtd').value)  || 0;
        var preco = parseFloat(document.getElementById('vrPreco').value) || 0;
        var el    = document.getElementById('vrTotal');
        if (el) el.textContent = 'Total: ' + formatMoney(qtd * preco);
    }

    async function handleVendaRapidaSubmit() {
        var clienteId       = document.getElementById('vrCliente').value;
        var produtoId       = document.getElementById('vrProduto').value;
        var quantidade      = parseFloat(document.getElementById('vrQtd').value);
        var precoUnitario   = parseFloat(document.getElementById('vrPreco').value);
        var formaPagamento  = document.getElementById('vrForma').value;
        var dataCompetencia = document.getElementById('vrData').value;

        if (!clienteId || !produtoId || !quantidade || !precoUnitario || !formaPagamento || !dataCompetencia) {
            mostrarMsgVendaRapida('Preencha todos os campos antes de registrar.', false);
            return;
        }

        var btn = document.getElementById('btnVendaRapida');
        setButtonLoading(btn, true);

        try {
            await api.post('/vendas', {
                clienteId:       parseInt(clienteId,  10),
                produtoId:       parseInt(produtoId,  10),
                quantidade:      quantidade,
                precoUnitario:   precoUnitario,
                formaPagamento:  formaPagamento,
                dataCompetencia: dataCompetencia,
            });

            mostrarMsgVendaRapida('Venda registrada com sucesso!', true);
            document.getElementById('vrCliente').value = '';
            document.getElementById('vrProduto').value = '';
            document.getElementById('vrQtd').value     = '';
            document.getElementById('vrPreco').value   = '';
            document.getElementById('vrForma').value   = '';
            document.getElementById('vrData').value    = todayISO();
            atualizarTotalVenda();
        } catch (err) {
            var msg = (err && (err.message || err.erro || err.error)) || 'Erro ao registrar a venda.';
            mostrarMsgVendaRapida(msg, false);
        } finally {
            setButtonLoading(btn, false);
        }
    }

    function mostrarMsgVendaRapida(texto, sucesso) {
        var el = document.getElementById('vendaRapidaMsg');
        if (!el) return;
        el.style.display    = 'block';
        el.style.background = sucesso ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
        el.style.border     = '1px solid ' + (sucesso ? 'var(--accent)' : 'var(--danger)');
        el.style.color      = sucesso ? 'var(--accent)' : 'var(--danger)';
        el.textContent      = texto;
        if (sucesso) {
            setTimeout(function () { el.style.display = 'none'; }, 4000);
        }
    }

    document.addEventListener('DOMContentLoaded', loadDashboard);
})();
