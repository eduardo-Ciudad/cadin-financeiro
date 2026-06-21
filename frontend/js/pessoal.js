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
                            '<div class="pessoal-submit-btn" style="display:flex;gap:var(--space-sm);align-items:flex-end">' +
                                '<button type="submit" class="btn btn-primary" id="btnAdicionarConta">Adicionar</button>' +
                                '<button type="button" class="btn btn-secondary" id="btnAbrirParcelamento">Parcelamento</button>' +
                            '</div>' +
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

        // Inject installment modal into body
        var modalEl = document.createElement('div');
        modalEl.id = 'modalParcelamento';
        modalEl.className = 'modal-overlay';
        modalEl.style.display = 'none';
        modalEl.innerHTML =
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<span class="modal-title">Novo Parcelamento</span>' +
                    '<button class="modal-close" id="btnFecharParcelamento" type="button">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="formParcelamento" novalidate>' +
                        '<div class="form-group">' +
                            '<label class="form-label" for="parcDescricao">Descrição *</label>' +
                            '<input class="form-input" type="text" id="parcDescricao" placeholder="Ex: Geladeira Consul" autocomplete="off">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label" for="parcValorTotal">Valor Total *</label>' +
                            '<input class="form-input font-mono" type="number" id="parcValorTotal" min="0.01" step="0.01" placeholder="0,00">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label" for="parcQuantidade">Nº de Parcelas *</label>' +
                            '<input class="form-input font-mono" type="number" id="parcQuantidade" min="2" max="48" step="1" placeholder="Ex: 4">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label" for="parcVencimento">Vencimento da 1ª Parcela *</label>' +
                            '<input class="form-input" type="date" id="parcVencimento">' +
                        '</div>' +
                        '<div id="parcPreview" style="display:none;margin-top:var(--space-md)"></div>' +
                        '<div style="display:flex;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-lg)">' +
                            '<button type="button" class="btn btn-secondary" id="btnCancelarParcelamento">Cancelar</button>' +
                            '<button type="submit" class="btn btn-primary" id="btnConfirmarParcelamento">Criar Parcelas</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modalEl);

        // Form events
        document.getElementById('formPessoal').addEventListener('submit', handleFormSubmit);

        // Filter tabs
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

        // Modal open/close
        document.getElementById('btnAbrirParcelamento').addEventListener('click', function () {
            document.getElementById('modalParcelamento').style.display = 'flex';
        });
        document.getElementById('btnFecharParcelamento').addEventListener('click', fecharModalParcelamento);
        document.getElementById('btnCancelarParcelamento').addEventListener('click', fecharModalParcelamento);
        document.getElementById('modalParcelamento').addEventListener('click', function (e) {
            if (e.target === this) fecharModalParcelamento();
        });

        // Live preview on input
        ['parcValorTotal', 'parcQuantidade', 'parcVencimento'].forEach(function (id) {
            document.getElementById(id).addEventListener('input', atualizarPreview);
        });

        // Parcelamento submit
        document.getElementById('formParcelamento').addEventListener('submit', handleParcelamentoSubmit);
    }

    function fecharModalParcelamento() {
        document.getElementById('modalParcelamento').style.display = 'none';
        document.getElementById('formParcelamento').reset();
        document.getElementById('parcPreview').style.display = 'none';
        document.getElementById('parcPreview').innerHTML = '';
    }

    function atualizarPreview() {
        var total = parseFloat(document.getElementById('parcValorTotal').value);
        var qtd = parseInt(document.getElementById('parcQuantidade').value);
        var dataStr = document.getElementById('parcVencimento').value;
        var preview = document.getElementById('parcPreview');

        if (!total || !qtd || qtd < 2 || !dataStr) {
            preview.style.display = 'none';
            return;
        }

        var valorParcela = Math.floor(total / qtd * 100) / 100;
        var valorUltima = parseFloat((total - valorParcela * (qtd - 1)).toFixed(2));

        var html = '<p style="font-size:var(--text-sm);color:var(--text-secondary);margin:0 0 var(--space-xs)">Prévia:</p>';
        html += '<div style="display:flex;flex-direction:column;gap:2px;font-size:var(--text-sm)">';

        var base = new Date(dataStr + 'T12:00:00');
        for (var i = 0; i < qtd; i++) {
            var d = new Date(base);
            d.setMonth(d.getMonth() + i);
            var valor = i === qtd - 1 ? valorUltima : valorParcela;
            html += '<div style="display:flex;justify-content:space-between;padding:var(--space-xs) var(--space-sm);background:var(--bg-tertiary);border-radius:var(--radius-sm)">' +
                '<span>' + (i + 1) + '/' + qtd + ' — ' + d.toLocaleDateString('pt-BR') + '</span>' +
                '<span class="font-mono">' + formatMoney(valor) + '</span>' +
            '</div>';
        }
        html += '</div>';

        preview.innerHTML = html;
        preview.style.display = 'block';
    }

    async function handleParcelamentoSubmit(e) {
        e.preventDefault();
        var btn = document.getElementById('btnConfirmarParcelamento');
        setButtonLoading(btn, true);

        var body = {
            descricao: document.getElementById('parcDescricao').value.trim(),
            valorTotal: parseFloat(document.getElementById('parcValorTotal').value),
            quantidadeParcelas: parseInt(document.getElementById('parcQuantidade').value),
            dataVencimentoPrimeira: document.getElementById('parcVencimento').value,
        };

        try {
            var parcelas = await api.post('/pessoal/parcelamentos', body);
            showToast(parcelas.length + ' parcelas criadas com sucesso.', 'success');
            fecharModalParcelamento();
            loadContas();
        } catch (err) {
            handleApiError(err);
        } finally {
            setButtonLoading(btn, false);
        }
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
