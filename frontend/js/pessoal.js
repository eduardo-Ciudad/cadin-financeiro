/* Pessoal — contas pessoais do proprietário */
(function () {
    requireAuth();

    var mainContent = document.getElementById('mainContent');
    var state = { filtroStatus: '' };

    document.addEventListener('DOMContentLoaded', function () {
        renderPage();
        loadContas();
    });

    function renderPage() {
        mainContent.innerHTML =
            '<div class="card" style="margin-bottom:var(--space-lg)">' +
                '<div class="card-header"><h3>Adicionar Conta</h3></div>' +
                '<div style="padding:var(--space-lg)">' +
                    '<form id="formPessoal" novalidate>' +
                        '<div class="pessoal-form-grid">' +
                            '<div class="form-group" style="margin:0">' +
                                '<label class="form-label" for="pessoalDescricao">Descrição *</label>' +
                                '<input class="form-input" type="text" id="pessoalDescricao" placeholder="Ex: Conta de luz" autocomplete="off">' +
                                '<span class="form-error" id="descricaoError"></span>' +
                            '</div>' +
                            '<div class="form-group" style="margin:0">' +
                                '<label class="form-label" for="pessoalValor">Valor *</label>' +
                                '<input class="form-input font-mono" type="number" id="pessoalValor" min="0.01" step="0.01" placeholder="0,00">' +
                                '<span class="form-error" id="valorError"></span>' +
                            '</div>' +
                            '<div class="form-group" style="margin:0">' +
                                '<label class="form-label" for="pessoalVencimento">Vencimento *</label>' +
                                '<input class="form-input" type="date" id="pessoalVencimento">' +
                                '<span class="form-error" id="dataVencimentoError"></span>' +
                            '</div>' +
                            '<button type="submit" class="btn btn-primary pessoal-submit-btn" id="btnAdicionarConta">Adicionar</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
            '<div class="card">' +
                '<div class="card-header">' +
                    '<h3>Contas Pessoais</h3>' +
                    '<div id="filterTabs" style="display:flex;gap:var(--space-xs)">' +
                        '<button class="btn btn-sm btn-primary filter-btn" data-status="">Todas</button>' +
                        '<button class="btn btn-sm btn-secondary filter-btn" data-status="PENDENTE">Pendentes</button>' +
                        '<button class="btn btn-sm btn-secondary filter-btn" data-status="PAGA">Pagas</button>' +
                    '</div>' +
                '</div>' +
                '<div class="table-wrapper">' +
                    '<table class="table">' +
                        '<thead><tr>' +
                            '<th>Descrição</th>' +
                            '<th class="text-right">Valor</th>' +
                            '<th>Vencimento</th>' +
                            '<th>Status</th>' +
                            '<th>Pagamento</th>' +
                            '<th class="text-right">Ações</th>' +
                        '</tr></thead>' +
                        '<tbody id="pessoalTableBody">' + skeletonRows(6) + '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('formPessoal').addEventListener('submit', handleFormSubmit);

        document.getElementById('filterTabs').querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.filter-btn').forEach(function (b) {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-secondary');
                });
                this.classList.remove('btn-secondary');
                this.classList.add('btn-primary');
                state.filtroStatus = this.getAttribute('data-status');
                loadContas();
            });
        });
    }

    async function loadContas() {
        var tbody = document.getElementById('pessoalTableBody');
        if (tbody) tbody.innerHTML = skeletonRows(6);

        try {
            var params = state.filtroStatus ? '?status=' + state.filtroStatus : '';
            var data = await api.get('/pessoal' + params);
            var contas = Array.isArray(data) ? data : (data.content || []);
            renderTabela(contas);
        } catch (err) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Erro ao carregar contas.</td></tr>';
            handleApiError(err);
        }
    }

    function renderTabela(contas) {
        var tbody = document.getElementById('pessoalTableBody');
        if (!tbody) return;

        if (!contas.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhuma conta cadastrada.</td></tr>';
            return;
        }

        var hoje = todayISO();
        tbody.innerHTML = contas.map(function (c) {
            var isVencida = c.status === 'PENDENTE' && c.dataVencimento && c.dataVencimento < hoje;
            var badge;
            if (c.status === 'PAGA') {
                badge = '<span class="badge badge-success">Paga</span>';
            } else if (isVencida) {
                badge = '<span class="badge badge-danger">Vencida</span>';
            } else {
                badge = '<span class="badge badge-warning">Pendente</span>';
            }

            var acoes = '';
            if (c.status !== 'PAGA') {
                acoes += '<button class="btn btn-sm btn-success-outline btn-pagar" data-id="' + c.id + '" style="margin-right:var(--space-xs)">Pagar</button>';
            }
            acoes += '<button class="btn btn-sm btn-ghost btn-excluir" data-id="' + c.id + '">Excluir</button>';

            return '<tr' + (isVencida ? ' style="background:rgba(239,68,68,0.05)"' : '') + '>' +
                '<td>' + escapeHtml(c.descricao) + '</td>' +
                '<td class="text-right font-mono">' + formatMoney(c.valor) + '</td>' +
                '<td class="font-mono">' + formatDate(c.dataVencimento) + '</td>' +
                '<td>' + badge + '</td>' +
                '<td class="font-mono text-secondary">' + (c.dataPagamento ? formatDate(c.dataPagamento) : '—') + '</td>' +
                '<td class="text-right">' + acoes + '</td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('.btn-pagar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                pagarConta(this.getAttribute('data-id'));
            });
        });

        tbody.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                confirmDialog(
                    'Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.',
                    function () { excluirConta(id); },
                    'Excluir conta'
                );
            });
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        clearFormErrors(document.getElementById('formPessoal'));

        var btn = document.getElementById('btnAdicionarConta');
        setButtonLoading(btn, true);

        var body = {
            descricao: document.getElementById('pessoalDescricao').value.trim(),
            valor: parseFloat(document.getElementById('pessoalValor').value),
            dataVencimento: document.getElementById('pessoalVencimento').value,
        };

        try {
            await api.post('/pessoal', body);
            showToast('Conta adicionada com sucesso.', 'success');
            document.getElementById('pessoalDescricao').value = '';
            document.getElementById('pessoalValor').value = '';
            document.getElementById('pessoalVencimento').value = '';
            loadContas();
        } catch (err) {
            handleApiError(err);
        } finally {
            setButtonLoading(btn, false);
        }
    }

    async function pagarConta(id) {
        try {
            await api.patch('/pessoal/' + id + '/pagar');
            showToast('Conta marcada como paga.', 'success');
            loadContas();
        } catch (err) {
            handleApiError(err);
        }
    }

    async function excluirConta(id) {
        try {
            await api.delete('/pessoal/' + id);
            showToast('Conta excluída.', 'success');
            loadContas();
        } catch (err) {
            handleApiError(err);
        }
    }
})();
