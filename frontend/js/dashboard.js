/* Dashboard page logic */
(function () {
    requireAuth();

    var mainContent = document.getElementById('mainContent');

    async function loadDashboard() {
        mainContent.innerHTML = '<div class="loading-center"><span class="spinner spinner-lg"></span></div>';
        try {
            var data = await api.get('/dashboard');
            render(data);
        } catch (err) {
            mainContent.innerHTML =
                '<div class="loading-center"><p class="text-muted">Erro ao carregar dashboard. Tente recarregar a página.</p></div>';
            handleApiError(err);
        }
    }

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
            '</div>';
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

    document.addEventListener('DOMContentLoaded', loadDashboard);
})();
