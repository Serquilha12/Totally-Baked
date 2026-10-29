/**
 * Totally Baked Pemba - Sistema Administrativo, Gestão de Pedidos & Relatórios de Vendas
 */

(function () {
  let audioEnabled = true;
  let lastKnownOrderCount = 0;
  let currentViewingOrder = null;

  const Admin = {
    init() {
      this.setupListeners();
      this.setupAudio();
      this.setupOrderFilters();
      this.startPolling();
    },

    // ================= CONTROLE DE ABAS =================
    switchTab(tabId) {
      // Esconder todas as abas
      document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
      // Desativar estilo nos botões
      document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-b-2', 'border-[#FF70B0]', 'text-[#1E1218]', 'bg-white', 'shadow-sm');
        btn.classList.add('text-[#7D6570]');
      });

      // Ativar aba selecionada
      const targetContent = document.getElementById(`tab-${tabId}`);
      const targetBtn = document.getElementById(`tabBtn-${tabId}`);

      if (targetContent) targetContent.classList.remove('hidden');
      if (targetBtn) {
        targetBtn.classList.add('active', 'border-b-2', 'border-[#FF70B0]', 'text-[#1E1218]', 'bg-white', 'shadow-sm');
        targetBtn.classList.remove('text-[#7D6570]');
      }
    },

    // ================= GESTÃO & FILTROS DE PEDIDOS =================
    setupOrderFilters() {
      const searchInput = document.getElementById('orderSearchInput');
      const statusFilter = document.getElementById('orderStatusFilter');
      const neighborhoodFilter = document.getElementById('orderNeighborhoodFilter');
      const paymentFilter = document.getElementById('orderPaymentFilter');

      const applyFilters = () => {
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const selectedStatus = statusFilter ? statusFilter.value : 'all';
        const selectedNeighborhood = neighborhoodFilter ? neighborhoodFilter.value : 'all';
        const selectedPayment = paymentFilter ? paymentFilter.value : 'all';

        const rows = document.querySelectorAll('.order-row');
        rows.forEach(row => {
          const number = (row.getAttribute('data-number') || '').toLowerCase();
          const customer = (row.getAttribute('data-customer') || '').toLowerCase();
          const phone = (row.getAttribute('data-phone') || '').toLowerCase();
          const id = (row.getAttribute('data-id') || '').toLowerCase();
          const status = row.getAttribute('data-status') || '';
          const neighborhood = row.getAttribute('data-neighborhood') || '';
          const payment = (row.getAttribute('data-payment') || '').toLowerCase();

          const matchesQuery = !query || number.includes(query) || customer.includes(query) || phone.includes(query) || id.includes(query);
          const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
          const matchesNeighborhood = selectedNeighborhood === 'all' || neighborhood === selectedNeighborhood;
          const matchesPayment = selectedPayment === 'all' || payment.includes(selectedPayment);

          if (matchesQuery && matchesStatus && matchesNeighborhood && matchesPayment) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      };

      if (searchInput) searchInput.addEventListener('input', applyFilters);
      if (statusFilter) statusFilter.addEventListener('change', applyFilters);
      if (neighborhoodFilter) neighborhoodFilter.addEventListener('change', applyFilters);
      if (paymentFilter) paymentFilter.addEventListener('change', applyFilters);
    },

    resetOrdersFilter() {
      const searchInput = document.getElementById('orderSearchInput');
      const statusFilter = document.getElementById('orderStatusFilter');
      const neighborhoodFilter = document.getElementById('orderNeighborhoodFilter');
      const paymentFilter = document.getElementById('orderPaymentFilter');

      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      if (neighborhoodFilter) neighborhoodFilter.value = 'all';
      if (paymentFilter) paymentFilter.value = 'all';

      document.querySelectorAll('.order-row').forEach(row => row.style.display = '');
    },

    // ================= MODAL DETALHES DO PEDIDO =================
    openOrderDetails(order) {
      currentViewingOrder = order;
      const modal = document.getElementById('orderDetailsModal');
      if (!modal) return;

      document.getElementById('modalOrderNumber').innerText = order.orderNumber || ('#' + order.id);
      document.getElementById('modalCustomerName').innerText = order.customerName || 'Cliente';
      document.getElementById('modalOrderCreatedAt').innerText = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-MZ') : '-';
      document.getElementById('modalCustomerPhone').innerText = order.customerPhone || '-';
      document.getElementById('modalNeighborhood').innerText = order.neighborhood || '-';
      document.getElementById('modalDeliveryAddress').innerText = order.deliveryAddress || '-';
      document.getElementById('modalPayment').innerText = order.paymentLabel || order.paymentMethod || '-';

      const itemsList = document.getElementById('modalOrderItemsList');
      itemsList.innerHTML = '';
      (order.items || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex justify-between py-1 text-xs';
        div.innerHTML = `
          <span>${item.quantity}x ${item.name}</span>
          <span class="font-bold text-[#1E1218]">${item.price * item.quantity} MZN</span>
        `;
        itemsList.appendChild(div);
      });

      document.getElementById('modalSubtotal').innerText = `${order.subtotal || 0} MZN`;
      document.getElementById('modalDeliveryFee').innerText = `${order.deliveryFee || 0} MZN`;
      document.getElementById('modalTotal').innerText = `${order.total || 0} MZN`;

      const trackingLink = document.getElementById('modalTrackingLink');
      if (trackingLink) trackingLink.href = `/rastreio/${order.id}`;

      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.remove('opacity-0'), 10);
    },

    closeOrderDetails() {
      const modal = document.getElementById('orderDetailsModal');
      if (!modal) return;
      modal.classList.add('opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 200);
      currentViewingOrder = null;
    },

    async cancelOrderFromModal() {
      if (!currentViewingOrder) return;
      if (!confirm(`Tem a certeza que pretende cancelar a encomenda ${currentViewingOrder.orderNumber || currentViewingOrder.id}?`)) return;

      await this.updateStatus(currentViewingOrder.id, 'cancelled');
      this.closeOrderDetails();
    },

    // ================= RELATÓRIOS DE VENDAS (AJAX FILTER) =================
    async filterReportPeriod(period) {
      let startDate = '';
      const now = new Date();

      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = start.toISOString();
      } else if (period === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      } else if (period === '30d') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = start.toISOString();
      }

      try {
        const url = startDate ? `/api/admin/reports/sales?startDate=${encodeURIComponent(startDate)}` : '/api/admin/reports/sales';
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.report) {
          const r = data.report;
          // Atualizar KPIs
          const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
          const kpiProductsRevenue = document.getElementById('kpiProductsRevenue');
          const kpiOrdersCount = document.getElementById('kpiOrdersCount');
          const kpiCompletedRate = document.getElementById('kpiCompletedRate');
          const kpiAverageTicket = document.getElementById('kpiAverageTicket');
          const kpiDeliveryFees = document.getElementById('kpiDeliveryFees');

          if (kpiTotalRevenue) kpiTotalRevenue.innerHTML = `${r.totalRevenue} <span class="text-xs font-sans text-[#FF70B0] font-bold">MZN</span>`;
          if (kpiProductsRevenue) kpiProductsRevenue.innerText = `Produtos: ${r.productsRevenue} MZN`;
          if (kpiOrdersCount) kpiOrdersCount.innerText = r.ordersCount;
          if (kpiCompletedRate) kpiCompletedRate.innerText = `${r.completedOrdersCount} entregues • ${r.cancelledOrdersCount} cancelados`;
          if (kpiAverageTicket) kpiAverageTicket.innerHTML = `${r.averageTicket} <span class="text-xs font-sans text-[#FF70B0] font-bold">MZN</span>`;
          if (kpiDeliveryFees) kpiDeliveryFees.innerHTML = `${r.deliveryFeesRevenue} <span class="text-xs font-sans text-[#FF70B0] font-bold">MZN</span>`;

          // Atualizar Métodos de Pagamento
          const pmList = document.getElementById('reportPaymentMethodList');
          if (pmList && r.salesByPaymentMethod) {
            pmList.innerHTML = r.salesByPaymentMethod.map(pm => {
              const pct = r.totalRevenue > 0 ? ((pm.total / r.totalRevenue) * 100).toFixed(0) : 0;
              return `
                <div class="p-3 rounded-xl bg-[#FAF7F9] border border-[#F0DEE7]">
                  <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="font-bold text-[#1E1218]">${pm.method}</span>
                    <span class="font-bold text-[#FF70B0]">${pm.total} MZN <span class="text-[10px] font-normal text-[#7D6570]">(${pm.count} pedidos)</span></span>
                  </div>
                  <div class="w-full bg-white h-2 rounded-full overflow-hidden border border-[#F0DEE7]">
                    <div class="bg-[#FF70B0] h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('');
          }

          // Atualizar Bairros
          const nbList = document.getElementById('reportNeighborhoodList');
          if (nbList && r.salesByNeighborhood) {
            nbList.innerHTML = r.salesByNeighborhood.slice(0, 5).map(nb => {
              const pct = r.totalRevenue > 0 ? ((nb.total / r.totalRevenue) * 100).toFixed(0) : 0;
              return `
                <div class="p-3 rounded-xl bg-[#FAF7F9] border border-[#F0DEE7]">
                  <div class="flex justify-between items-center mb-1 text-xs">
                    <span class="font-bold text-[#1E1218]">${nb.neighborhood}</span>
                    <span class="font-bold text-[#1E1218]">${nb.total} MZN <span class="text-[10px] font-normal text-[#7D6570]">(${nb.count} entregas)</span></span>
                  </div>
                  <div class="w-full bg-white h-2 rounded-full overflow-hidden border border-[#F0DEE7]">
                    <div class="bg-emerald-500 h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('');
          }

          // Atualizar Top Produtos
          const prodTable = document.getElementById('reportTopProductsTable');
          if (prodTable && r.topSellingProducts) {
            prodTable.innerHTML = r.topSellingProducts.map((prod, idx) => `
              <tr class="hover:bg-[#FFECF5]/30 transition">
                <td class="p-3.5 font-bold text-[#7D6570]">#${idx + 1}</td>
                <td class="p-3.5 font-bold text-[#1E1218]">${prod.name}</td>
                <td class="p-3.5 text-center font-semibold text-[#1E1218]">
                  <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#FFECF5] text-[#FF70B0] font-bold">
                    ${prod.quantity} un
                  </span>
                </td>
                <td class="p-3.5 text-right font-bold text-[#1E1218]">${prod.revenue} MZN</td>
              </tr>
            `).join('');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do relatório:', err);
      }
    },

    // ================= AUDIO CHIME =================
    setupAudio() {
      const toggleBtn = document.getElementById('toggleAudioBtn');
      const statusText = document.getElementById('audioStatusText');
      const icon = document.getElementById('audioIcon');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          audioEnabled = !audioEnabled;
          if (statusText) statusText.innerText = `Chime: ${audioEnabled ? 'Ligado' : 'Mudo'}`;
          if (icon) {
            icon.className = audioEnabled ? 'fa-solid fa-bell text-[#FF70B0] text-[11px]' : 'fa-solid fa-bell-slash text-stone-400 text-[11px]';
          }
        });
      }
    },

    playAlert() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.2); // D6

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.6);
        osc2.stop(audioCtx.currentTime + 0.6);
      } catch (e) {
        console.warn('Áudio Web Audio API bloqueado por autoplay ou indisponível:', e);
      }
    },

    // ================= ATUALIZAÇÃO DE STATUS =================
    async updateStatus(orderId, newStatus) {
      if (!newStatus) return;
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.message || 'Erro ao alterar status.');
        }
      } catch (err) {
        console.error('Falha ao atualizar status do pedido:', err);
      }
    },

    async toggleAvailability(productId) {
      try {
        const res = await fetch(`/api/admin/products/${productId}/toggle`, {
          method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.message || 'Erro ao alternar disponibilidade.');
        }
      } catch (err) {
        console.error('Falha ao alternar produto:', err);
      }
    },

    async deleteProduct(productId) {
      if (!confirm('Tem a certeza de que deseja remover este item da carta oficial?')) return;
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert(data.message || 'Erro ao excluir produto.');
        }
      } catch (err) {
        console.error('Falha ao excluir produto:', err);
      }
    },

    // ================= SINCRONIZAÇÃO EM TEMPO REAL =================
    startPolling() {
      setInterval(async () => {
        try {
          const res = await fetch('/api/admin/orders');
          const data = await res.json();
          if (data.success && data.orders) {
            const currentCount = data.orders.length;
            if (lastKnownOrderCount > 0 && currentCount > lastKnownOrderCount) {
              if (audioEnabled) {
                this.playAlert();
              }
              alert('🛎️ Novo Pedido Recebido na Totally Baked! Atualizando dados...');
              window.location.reload();
            }
            lastKnownOrderCount = currentCount;
          }
        } catch (e) {
          // Silencioso
        }
      }, 5000);
    },

    setupListeners() {
      const openModalBtn = document.getElementById('openNewProductModalBtn');
      const closeModalBtn = document.getElementById('closeNewProductModalBtn');
      const modal = document.getElementById('newProductModal');
      const form = document.getElementById('newProductForm');

      if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => {
          modal.classList.remove('hidden');
          setTimeout(() => modal.classList.remove('opacity-0'), 10);
        });
      }

      if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
          modal.classList.add('opacity-0');
          setTimeout(() => modal.classList.add('hidden'), 200);
        });
      }

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);

          const payload = {
            name: formData.get('name'),
            price: formData.get('price'),
            category: formData.get('category'),
            imageUrl: formData.get('imageUrl'),
            description: formData.get('description'),
            isFeatured: formData.get('isFeatured') === 'on'
          };

          try {
            const res = await fetch('/api/admin/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
              alert('Produto cadastrado com sucesso!');
              window.location.reload();
            } else {
              alert(data.message || 'Erro ao cadastrar produto.');
            }
          } catch (err) {
            console.error('Erro ao cadastrar:', err);
          }
        });
      }
    }
  };

  window.Admin = Admin;
  document.addEventListener('DOMContentLoaded', () => Admin.init());
})();
