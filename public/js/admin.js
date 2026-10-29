/**
 * Totally Baked Pemba - Sistema Administrativo & Cozinha em Tempo Real
 */

(function () {
  let audioEnabled = true;
  let lastKnownOrderCount = 0;

  const Admin = {
    init() {
      this.setupListeners();
      this.setupAudio();
      this.startPolling();
    },

    setupAudio() {
      const toggleBtn = document.getElementById('toggleAudioBtn');
      const statusText = document.getElementById('audioStatusText');
      const icon = document.getElementById('audioIcon');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          audioEnabled = !audioEnabled;
          if (statusText) statusText.innerText = `Alerta Sonoro: ${audioEnabled ? 'Ligado' : 'Mudo'}`;
          if (icon) {
            icon.className = audioEnabled ? 'fa-solid fa-bell text-brand-gold' : 'fa-solid fa-bell-slash text-gray-400';
          }
        });
      }
    },

    playAlert() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Toca dois tons harmônicos agradáveis (chime de confeitaria)
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

    async updateStatus(orderId, newStatus) {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          // Recarregar suavemente a página para refletir as colunas do Kanban
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
      if (!confirm('Tem certeza de que deseja remover este produto do catálogo?')) return;
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

    startPolling() {
      // Polling a cada 5 segundos para verificar novos pedidos
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
              // Notificação visual
              alert('🛎️ Novo Pedido Recebido na Totally Baked! Atualizando o Kanban...');
              window.location.reload();
            }
            lastKnownOrderCount = currentCount;
          }
        } catch (e) {
          // Silencioso em caso de erro transitório de rede
        }
      }, 5000);
    },

    setupListeners() {
      // Modal Novo Produto
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
