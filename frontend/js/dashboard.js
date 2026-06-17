/* Dashboard page logic */
(function () {
    requireAuth();

    var mainContent = document.getElementById('mainContent');

    /* ===========================
       INIT
    =========================== */
    async function loadDashboard() {
        mainContent.innerHTML = '<div class="loading-center"><span class="spinner spinner-lg"></span></div>';
        try {
            var data = await api.get('/dashboard');
            render(data);
            loadResumoMensal();
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
       RESUMO MENSAL
    =========================== */
    async function loadResumoMensal() {
        try {
            var data = await api.get('/lancamentos/resumo-mensal');
            renderGrafico(data);
            renderBotoesMeses(data);
        } catch (err) {
            var botoes = document.getElementById('mesesBotoes');
            if (botoes) botoes.innerHTML = '<small class="text-muted">Não foi possível carregar o resumo mensal.</small>';
            console.error('Erro ao carregar resumo mensal', err);
        }
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

        container.innerHTML = dados.map(function (d) {
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

    document.addEventListener('DOMContentLoaded', loadDashboard);
})();
