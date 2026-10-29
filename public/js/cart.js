/**
 * Totally Baked Pemba — Carrinho, Customizador, Catering & Checkout de Produção
 * Suporta Entrega ao Domicílio (9 bairros de Pemba) + Levantamento na Loja (Rua da ANE, Alto Gingone)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'totallybaked_cart_v2';
  const RECENT_ORDERS_KEY = 'totallybaked_recent_orders';

  let currentCustomProduct = {
    id: '',
    name: '',
    basePrice: 0,
    imageUrl: '',
    sizeLabel: 'Individual',
    sizeMultiplier: 1,
    qty: 1
  };

  const Cart = {
    items: [],
    fulfillmentType: 'delivery', // 'delivery' | 'pickup'
    deliveryFee: 100, // Padrão Alto Gingone / Pemba
    FREE_SHIPPING_GOAL: 1500,

    init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        this.items = stored ? JSON.parse(stored) : [];
      } catch {
        this.items = [];
      }
      this.syncActiveTrackingLinks();
      this.render();
      this.setupListeners();
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {}
      this.render();
    },

    saveRecentOrder(order, trackingUrl, whatsappUrl) {
      try {
        const raw = localStorage.getItem(RECENT_ORDERS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          trackingUrl,
          whatsappUrl,
          createdAt: order.createdAt
        });
        localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(list.slice(0, 5)));
        this.syncActiveTrackingLinks();
      } catch {}
    },

    syncActiveTrackingLinks() {
      try {
        const raw = localStorage.getItem(RECENT_ORDERS_KEY);
        if (!raw) return;
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0 && list[0].trackingUrl) {
          document.querySelectorAll('[data-live-tracking-link]').forEach((a) => {
            a.setAttribute('href', list[0].trackingUrl.replace('?confirmed=1&', '?').replace('?confirmed=1', ''));
          });
        }
      } catch {}
    },

    triggerHaptic(duration = 10) {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try {
          window.navigator.vibrate(duration);
        } catch {}
      }
    },

    addItem(productId, name, price, imageUrl, notes = '', silentDrawer = false) {
      this.triggerHaptic(12);
      const numericPrice = Number(price);
      const existing = this.items.find(
        (i) => i.productId === productId && i.price === numericPrice && (i.notes || '') === (notes || '')
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({
          key: `${productId}_${numericPrice}_${Date.now().toString(36)}`,
          productId,
          name,
          price: numericPrice,
          imageUrl,
          notes,
          quantity: 1
        });
      }
      this.save();
      if (!silentDrawer) {
        this.openDrawer();
      }
      this.showToast(`"${name}" adicionado à sua cesta.`);
    },

    removeItemByIndex(idx) {
      this.triggerHaptic(8);
      this.items.splice(idx, 1);
      this.save();
    },

    updateQuantityByIndex(idx, delta) {
      this.triggerHaptic(8);
      const item = this.items[idx];
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.items.splice(idx, 1);
      }
      this.save();
    },

    clear() {
      this.items = [];
      this.save();
    },

    getSubtotal() {
      return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getEffectiveDeliveryFee() {
      const subtotal = this.getSubtotal();
      if (this.items.length === 0) return 0;
      if (this.fulfillmentType === 'pickup') return 0;
      if (subtotal >= this.FREE_SHIPPING_GOAL) return 0;
      return this.deliveryFee;
    },

    getTotal() {
      return this.getSubtotal() + this.getEffectiveDeliveryFee();
    },

    setFulfillmentType(mode) {
      this.fulfillmentType = mode === 'pickup' ? 'pickup' : 'delivery';
      const deliveryFields = document.getElementById('deliveryAddressSection');
      const pickupInfo = document.getElementById('pickupStoreInfo');
      const neighborhoodField = document.getElementById('checkoutNeighborhood');
      const addressField = document.getElementById('checkoutAddressInput');

      document.querySelectorAll('[data-fulfillment-btn]').forEach((btn) => {
        const active = btn.getAttribute('data-fulfillment-btn') === this.fulfillmentType;
        btn.classList.toggle('bg-[#181114]', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('border-[#181114]', active);
        btn.classList.toggle('bg-white', !active);
        btn.classList.toggle('text-[#524149]', !active);
        btn.classList.toggle('border-[#F0DEE7]', !active);
      });

      if (this.fulfillmentType === 'pickup') {
        if (deliveryFields) deliveryFields.classList.add('hidden');
        if (pickupInfo) pickupInfo.classList.remove('hidden');
        if (neighborhoodField) neighborhoodField.removeAttribute('required');
        if (addressField) addressField.removeAttribute('required');
      } else {
        if (deliveryFields) deliveryFields.classList.remove('hidden');
        if (pickupInfo) pickupInfo.classList.add('hidden');
        if (neighborhoodField) neighborhoodField.setAttribute('required', 'required');
        if (addressField) addressField.setAttribute('required', 'required');
      }

      this.render();
    },

    render() {
      const badge = document.getElementById('cartBadgeCount');
      const mobileBadge = document.getElementById('mobileDockBadge');
      const container = document.getElementById('cartItemsContainer');
      const subtotalEl = document.getElementById('cartSubtotal');
      const totalEl = document.getElementById('cartTotal');
      const deliveryEstEl = document.getElementById('cartDeliveryEst');
      const modalSubtotalEl = document.getElementById('modalSubtotal');
      const modalFinalTotalEl = document.getElementById('modalFinalTotal');
      const modalDeliveryFeeEl = document.getElementById('modalDeliveryFee');
      const openCheckoutBtn = document.getElementById('openCheckoutModalBtn');

      const freeShippingText = document.getElementById('freeShippingText');
      const freeShippingPercent = document.getElementById('freeShippingPercent');
      const freeShippingBar = document.getElementById('freeShippingBar');

      const totalCount = this.items.reduce((sum, i) => sum + i.quantity, 0);
      const subtotal = this.getSubtotal();
      const effectiveFee = this.getEffectiveDeliveryFee();
      const total = this.getTotal();

      [badge, mobileBadge].forEach((el) => {
        if (!el) return;
        el.innerText = totalCount;
        if (totalCount > 0) {
          el.classList.remove('scale-0');
          el.classList.add('scale-100');
          el.classList.remove('badge-bounce');
          void el.offsetWidth;
          el.classList.add('badge-bounce');
        } else {
          el.classList.remove('scale-100', 'badge-bounce');
          el.classList.add('scale-0');
        }
      });

      const dock = document.getElementById('quickCartPill');
      const dockItemCount = document.getElementById('dockItemCount');
      const dockSubtotal = document.getElementById('dockSubtotal');
      if (dock) {
        if (totalCount > 0) {
          dock.classList.remove('hidden-dock');
          dock.classList.add('visible-dock');
          if (dockItemCount) dockItemCount.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'itens'}`;
          if (dockSubtotal) dockSubtotal.textContent = `${subtotal} MZN`;
        } else {
          dock.classList.remove('visible-dock');
          dock.classList.add('hidden-dock');
        }
      }

      if (freeShippingText && freeShippingPercent && freeShippingBar) {
        const goal = this.FREE_SHIPPING_GOAL;
        if (subtotal >= goal) {
          freeShippingPercent.innerText = '100%';
          freeShippingPercent.className = 'tabular-nums text-emerald-600 font-bold';
          freeShippingBar.style.width = '100%';
          freeShippingBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out';
          freeShippingText.innerHTML =
            '<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-circle-check mr-1"></i>Entrega cortesia ativada em Pemba!</span>';
        } else {
          const remaining = goal - subtotal;
          const percent = Math.min(100, Math.round((subtotal / goal) * 100));
          freeShippingPercent.innerText = `${percent}%`;
          freeShippingPercent.className = 'tabular-nums text-[#D93883] font-bold';
          freeShippingBar.style.width = `${percent}%`;
          freeShippingBar.className =
            'h-full bg-gradient-to-r from-[#FF70B0] to-[#FFA0CA] rounded-full transition-all duration-500 ease-out';
          freeShippingText.innerHTML = `Faltam <strong class="text-[#181114] tabular-nums">${remaining} MZN</strong> para entrega grátis`;
        }
      }

      if (container) {
        if (this.items.length === 0) {
          container.innerHTML = `
            <div class="text-center py-14 text-[#85707A]">
              <div class="w-14 h-14 rounded-2xl bg-[#FFECF5] text-[#D93883] flex items-center justify-center mx-auto mb-3 border border-[#FFC4DE]">
                <i class="fa-solid fa-bag-shopping text-lg"></i>
              </div>
              <p class="text-sm text-[#181114] font-semibold">A sua cesta está vazia</p>
              <p class="text-xs mt-1 text-[#85707A]">Adicione pães frescos, bolos, sorvetes ou refeições do nosso menu.</p>
              <a href="/menu" onclick="window.Cart.closeDrawer()" class="inline-block mt-5 px-5 py-2.5 rounded-full btn-rose-glow text-xs font-semibold">Ver o menu completo</a>
            </div>
          `;
          if (openCheckoutBtn) openCheckoutBtn.disabled = true;
        } else {
          if (openCheckoutBtn) openCheckoutBtn.disabled = false;
          container.innerHTML = this.items
            .map(
              (item, idx) => `
            <div class="flex items-start gap-3 bg-[#FAF7F9] p-3.5 rounded-2xl border border-[#F0DEE7] transition-colors">
              <img src="${item.imageUrl}" alt="${item.name}" class="w-14 h-14 rounded-xl object-cover bg-[#FFECF5] flex-shrink-0 border border-[#F0DEE7]">
              <div class="flex-grow min-w-0">
                <h4 class="font-moret text-sm font-bold text-[#181114] leading-snug line-clamp-2">${item.name}</h4>
                ${item.notes ? `<p class="text-[11px] text-[#85707A] line-clamp-1 mt-0.5">${item.notes}</p>` : ''}
                <span class="text-xs tabular-nums text-[#D93883] font-semibold block mt-1">${item.price * item.quantity} MZN <span class="text-[11px] text-[#85707A] font-normal">(${item.price} un.)</span></span>
                
                <div class="flex items-center gap-2 mt-2">
                  <button 
                    type="button"
                    onclick="window.Cart.updateQuantityByIndex(${idx}, -1)" 
                    class="w-7 h-7 rounded-full bg-white border border-[#F0DEE7] text-[#181114] hover:border-[#FF70B0] flex items-center justify-center text-xs font-bold active:scale-90"
                    aria-label="Diminuir">-</button>
                  <span class="text-xs tabular-nums font-bold text-[#181114] w-5 text-center">${item.quantity}</span>
                  <button 
                    type="button"
                    onclick="window.Cart.updateQuantityByIndex(${idx}, 1)" 
                    class="w-7 h-7 rounded-full bg-white border border-[#F0DEE7] text-[#181114] hover:border-[#FF70B0] flex items-center justify-center text-xs font-bold active:scale-90"
                    aria-label="Aumentar">+</button>
                </div>
              </div>
              <button 
                type="button"
                onclick="window.Cart.removeItemByIndex(${idx})" 
                class="w-8 h-8 rounded-full hover:bg-red-50 text-[#85707A] hover:text-red-500 flex items-center justify-center text-xs transition-colors flex-shrink-0" 
                aria-label="Remover item">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          `
            )
            .join('');
        }
      }

      if (subtotalEl) subtotalEl.innerText = `${subtotal} MZN`;
      if (totalEl) totalEl.innerText = `${total} MZN`;
      if (deliveryEstEl) {
        if (this.fulfillmentType === 'pickup') {
          deliveryEstEl.innerHTML = '<span class="font-semibold text-emerald-700 text-xs">Grátis (Levantamento na Loja)</span>';
        } else if (subtotal >= this.FREE_SHIPPING_GOAL && this.items.length > 0) {
          deliveryEstEl.innerHTML = '<span class="font-semibold text-emerald-700 text-xs">Cortesia (Pedido ≥ 1.500 MZN)</span>';
        } else {
          deliveryEstEl.innerText = `${this.deliveryFee} MZN (Pemba)`;
        }
      }

      if (modalSubtotalEl) modalSubtotalEl.innerText = `${subtotal} MZN`;
      if (modalDeliveryFeeEl) {
        if (this.fulfillmentType === 'pickup') {
          modalDeliveryFeeEl.innerHTML = '<span class="text-emerald-700 font-semibold">0 MZN (Levantamento Rua da ANE)</span>';
        } else if (effectiveFee === 0 && this.items.length > 0) {
          modalDeliveryFeeEl.innerHTML = '<span class="text-emerald-700 font-semibold">0 MZN (Cortesia)</span>';
        } else {
          modalDeliveryFeeEl.innerText = `${effectiveFee} MZN`;
        }
      }
      if (modalFinalTotalEl) modalFinalTotalEl.innerText = `${total} MZN`;
    },

    openDrawer() {
      this.triggerHaptic(8);
      const drawer = document.getElementById('cartDrawer');
      const backdrop = document.getElementById('cartDrawerBackdrop');
      if (drawer && backdrop) {
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100', 'pointer-events-auto');
        drawer.classList.remove('translate-x-full');
      }
    },

    closeDrawer() {
      this.triggerHaptic(6);
      const drawer = document.getElementById('cartDrawer');
      const backdrop = document.getElementById('cartDrawerBackdrop');
      if (drawer && backdrop) {
        backdrop.classList.remove('opacity-100', 'pointer-events-auto');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-x-full');
      }
    },

    openCheckout() {
      if (this.items.length === 0) {
        this.showToast('Adicione itens do menu antes de finalizar.');
        return;
      }
      this.closeDrawer();
      const modal = document.getElementById('checkoutModal');
      if (modal) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
          modal.classList.remove('opacity-0');
          modal.classList.add('tb-modal-open');
        });
      }
    },

    closeCheckout() {
      const modal = document.getElementById('checkoutModal');
      if (modal) {
        modal.classList.remove('tb-modal-open');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 240);
      }
    },

    showToast(message) {
      // Remove qualquer toast anterior para evitar empilhamento no mobile
      document.querySelectorAll('.tb-toast-notification').forEach((el) => el.remove());

      const toast = document.createElement('div');
      toast.className = 'tb-toast-notification';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      toast.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-6 h-6 rounded-full bg-[#FF70B0] text-white flex items-center justify-center text-[10px] flex-shrink-0 shadow-sm">
            <i class="fa-solid fa-check"></i>
          </span>
          <span class="text-xs font-medium leading-snug line-clamp-2 text-white/95">${message}</span>
        </div>
        <button type="button" class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/75 flex items-center justify-center text-[10px] flex-shrink-0 transition-colors" aria-label="Fechar aviso">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      const closeBtn = toast.querySelector('button');
      const dismissToast = () => {
        toast.classList.remove('tb-toast-visible');
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 220);
      };

      if (closeBtn) {
        closeBtn.addEventListener('click', dismissToast);
      }

      document.body.appendChild(toast);
      requestAnimationFrame(() => {
        toast.classList.add('tb-toast-visible');
      });

      setTimeout(dismissToast, 2200);
    },

    setupListeners() {
      const openBtn = document.getElementById('cartDrawerBtn');
      const closeBtn = document.getElementById('closeCartBtn');
      const backdrop = document.getElementById('cartDrawerBackdrop');
      const openCheckoutBtn = document.getElementById('openCheckoutModalBtn');
      const closeCheckoutBtn = document.getElementById('closeCheckoutModalBtn');

      if (openBtn) openBtn.addEventListener('click', () => this.openDrawer());
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeDrawer());
      if (backdrop) backdrop.addEventListener('click', () => this.closeDrawer());
      if (openCheckoutBtn) openCheckoutBtn.addEventListener('click', () => this.openCheckout());
      if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => this.closeCheckout());

      const sheetBackdrop = document.getElementById('productDetailSheetBackdrop');
      if (sheetBackdrop) {
        sheetBackdrop.addEventListener('click', () => window.closeProductCustomizer());
      }

      const cateringBackdrop = document.getElementById('cateringModal');
      if (cateringBackdrop) {
        cateringBackdrop.addEventListener('click', (e) => {
          if (e.target === cateringBackdrop) window.closeCateringModal();
        });
      }

      const checkoutBackdrop = document.getElementById('checkoutModal');
      if (checkoutBackdrop) {
        checkoutBackdrop.addEventListener('click', (e) => {
          if (e.target === checkoutBackdrop) this.closeCheckout();
        });
      }

      const mobileBtn = document.getElementById('mobileMenuBtn');
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden');
        });
      }

      // Alternância de método de pagamento
      document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
          const changeContainer = document.getElementById('changeForContainer');
          const mpesaHint = document.getElementById('mobileMoneyHint');
          if (changeContainer) {
            changeContainer.classList.toggle('hidden', e.target.value !== 'cash');
          }
          if (mpesaHint) {
            mpesaHint.classList.toggle('hidden', !(e.target.value === 'mpesa' || e.target.value === 'emola'));
          }
        });
      });

      // Captura de GPS real via navegador
      const captureGpsBtn = document.getElementById('captureGpsBtn');
      const gpsStatusText = document.getElementById('gpsStatusText');
      const inputLat = document.getElementById('inputLatitude');
      const inputLng = document.getElementById('inputLongitude');

      if (captureGpsBtn && gpsStatusText) {
        captureGpsBtn.addEventListener('click', () => {
          if (!navigator.geolocation) {
            gpsStatusText.textContent = 'Geolocalização não suportada neste dispositivo.';
            return;
          }
          captureGpsBtn.disabled = true;
          captureGpsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[10px]"></i> <span>A localizar...</span>';

          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = Number(pos.coords.latitude.toFixed(5));
              const lng = Number(pos.coords.longitude.toFixed(5));
              if (inputLat) inputLat.value = String(lat);
              if (inputLng) inputLng.value = String(lng);
              gpsStatusText.innerHTML = `<span class="text-emerald-700 font-semibold"><i class="fa-solid fa-circle-check mr-1"></i>GPS exacto capturado (${lat}, ${lng})</span>`;
              captureGpsBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-600 text-[10px]"></i> <span>GPS Ativo</span>';
              captureGpsBtn.disabled = false;

              try {
                const res = await fetch(`/api/delivery-fee?lat=${lat}&lng=${lng}`);
                const data = await res.json();
                if (data && typeof data.fee === 'number') {
                  this.deliveryFee = data.fee;
                  this.render();
                }
              } catch {}

              this.showToast('Coordenadas GPS registadas para o estafeta!');
            },
            () => {
              gpsStatusText.innerHTML =
                '<span class="text-[#524149]">Sinal GPS indisponível — usaremos a referência do bairro selecionado.</span>';
              captureGpsBtn.innerHTML = '<i class="fa-solid fa-crosshairs text-[10px]"></i> <span>Tentar novamente</span>';
              captureGpsBtn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      // Mudança de Bairro -> atualiza taxa de entrega em tempo real
      const neighborhoodSelect = document.getElementById('checkoutNeighborhood');
      if (neighborhoodSelect) {
        neighborhoodSelect.addEventListener('change', async (e) => {
          const neighborhood = e.target.value;
          if (!neighborhood) return;

          try {
            const res = await fetch(`/api/delivery-fee?neighborhood=${encodeURIComponent(neighborhood)}`);
            const data = await res.json();
            if (data && typeof data.fee === 'number') {
              this.deliveryFee = data.fee;
              this.render();
            }
          } catch (err) {
            console.error('Erro ao calcular taxa de entrega:', err);
          }
        });
      }

      // Submissão do Checkout de Produção
      const checkoutForm = document.getElementById('checkoutForm');
      if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const submitBtn = checkoutForm.querySelector('button[type="submit"]');
          const originalHtml = submitBtn ? submitBtn.innerHTML : '';
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>A registar encomenda...</span>';
          }

          const formData = new FormData(checkoutForm);
          const payload = {
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            fulfillmentType: this.fulfillmentType,
            neighborhood: this.fulfillmentType === 'pickup' ? 'Takeaway' : formData.get('neighborhood'),
            deliveryAddress:
              this.fulfillmentType === 'pickup'
                ? 'Levantamento na Loja (Rua da ANE, Bairro Alto Gingone, Pemba)'
                : formData.get('deliveryAddress'),
            paymentMethod: formData.get('paymentMethod'),
            changeFor: formData.get('changeFor') ? Number(formData.get('changeFor')) : undefined,
            latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
            longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
            notes: formData.get('notes'),
            items: this.items.map((i) => ({
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              notes: i.notes
            }))
          };

          try {
            const res = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && (data.order?.id || data.orderId)) {
              const targetUrl = data.trackingUrl || `/rastreio/${data.order?.id || data.orderId}?confirmed=1`;
              if (data.order) {
                this.saveRecentOrder(data.order, targetUrl, data.whatsappUrl);
              }
              this.clear();
              this.closeCheckout();
              window.location.href = targetUrl;
            } else {
              this.showToast(data.error || data.message || 'Verifique os campos obrigatórios.');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
              }
            }
          } catch (err) {
            console.error('Erro na encomenda:', err);
            this.showToast('Falha de ligação. Tente novamente.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalHtml;
            }
          }
        });
      }

      // Submissão do Formulário de Catering & Bolos de Festa
      const cateringForm = document.getElementById('cateringForm');
      if (cateringForm) {
        cateringForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = cateringForm.querySelector('button[type="submit"]');
          const prev = btn ? btn.innerHTML : '';
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>A gerar proposta...</span>';
          }

          const fd = new FormData(cateringForm);
          const payload = {
            customerName: fd.get('customerName'),
            customerPhone: fd.get('customerPhone'),
            eventType: fd.get('eventType'),
            eventDate: fd.get('eventDate'),
            guestsCount: fd.get('guestsCount'),
            details: fd.get('details')
          };

          try {
            const res = await fetch('/api/catering', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.whatsappUrl) {
              this.showToast(`Pedido ${data.quoteRef} preparado! A abrir WhatsApp...`);
              window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
              cateringForm.reset();
              window.closeCateringModal();
            } else {
              this.showToast(data.error || 'Preencha os dados do seu evento.');
            }
          } catch {
            this.showToast('Não foi possível submeter agora. Ligue +258 84 595 8546.');
          } finally {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = prev;
            }
          }
        });
      }
    }
  };

  /* =========================================================================
     FUNÇÕES GLOBAIS DE CUSTOMIZAÇÃO DE PRODUTO & CATERING
     ========================================================================= */
  window.openProductCustomizer = function (id, name, price, img, desc) {
    Cart.triggerHaptic(10);
    currentCustomProduct = {
      id,
      name,
      basePrice: Number(price),
      imageUrl: img,
      sizeLabel: 'Individual',
      sizeMultiplier: 1,
      qty: 1
    };

    const imgEl = document.getElementById('sheetProductImg');
    const nameEl = document.getElementById('sheetProductName');
    const descEl = document.getElementById('sheetProductDesc');
    const qtyEl = document.getElementById('sheetQtyDisplay');
    const noteEl = document.getElementById('sheetCustomNote');

    if (imgEl) imgEl.src = img;
    if (nameEl) nameEl.innerText = name;
    if (descEl) {
      descEl.innerText =
        desc || 'Preparado diariamente com ingredientes selecionados na nossa cozinha na Rua da ANE, Alto Gingone.';
    }
    if (qtyEl) qtyEl.innerText = '1';
    if (noteEl) noteEl.value = '';

    document.querySelectorAll('.segmented-pill').forEach((p, idx) => {
      p.classList.toggle('active', idx === 0);
    });

    const butterSwitch = document.getElementById('addonButter');
    if (butterSwitch) butterSwitch.checked = false;

    window.updateCustomizerTotal();

    const sheet = document.getElementById('productDetailSheet');
    const backdrop = document.getElementById('productDetailSheetBackdrop');
    if (sheet && backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
      sheet.classList.remove('translate-y-full');
    }
  };

  window.closeProductCustomizer = function () {
    const sheet = document.getElementById('productDetailSheet');
    const backdrop = document.getElementById('productDetailSheetBackdrop');
    if (sheet && backdrop) {
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      sheet.classList.add('translate-y-full');
    }
  };

  window.selectSize = function (btn, mult, label) {
    Cart.triggerHaptic(8);
    document.querySelectorAll('.segmented-pill').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    currentCustomProduct.sizeMultiplier = mult;
    currentCustomProduct.sizeLabel = label || btn.textContent.trim();
    window.updateCustomizerTotal();
  };

  window.adjustSheetQty = function (delta) {
    Cart.triggerHaptic(8);
    currentCustomProduct.qty = Math.max(1, currentCustomProduct.qty + delta);
    const qtyEl = document.getElementById('sheetQtyDisplay');
    if (qtyEl) qtyEl.innerText = currentCustomProduct.qty;
    window.updateCustomizerTotal();
  };

  window.updateCustomizerTotal = function () {
    let price = Math.round(currentCustomProduct.basePrice * currentCustomProduct.sizeMultiplier);
    const butterSwitch = document.getElementById('addonButter');
    if (butterSwitch && butterSwitch.checked) {
      price += 30;
    }
    const total = price * currentCustomProduct.qty;
    const priceEl = document.getElementById('sheetProductPrice');
    const btnPriceEl = document.getElementById('sheetBtnPrice');
    if (priceEl) priceEl.innerText = `${price} MZN`;
    if (btnPriceEl) btnPriceEl.innerText = `${total} MZN`;
  };

  window.confirmCustomizedAdd = function () {
    let unitPrice = Math.round(currentCustomProduct.basePrice * currentCustomProduct.sizeMultiplier);
    const notesParts = [];
    if (currentCustomProduct.sizeMultiplier > 1) {
      notesParts.push(currentCustomProduct.sizeLabel);
    }
    const warmSwitch = document.getElementById('addonWarm');
    if (warmSwitch && warmSwitch.checked) {
      notesParts.push('Aquecido');
    }
    const butterSwitch = document.getElementById('addonButter');
    if (butterSwitch && butterSwitch.checked) {
      unitPrice += 30;
      notesParts.push('+ Extra calda/manteiga');
    }
    const noteEl = document.getElementById('sheetCustomNote');
    if (noteEl && noteEl.value.trim()) {
      notesParts.push(noteEl.value.trim());
    }

    const combinedNotes = notesParts.join(' · ');

    for (let i = 0; i < currentCustomProduct.qty; i++) {
      Cart.addItem(
        currentCustomProduct.id,
        currentCustomProduct.name,
        unitPrice,
        currentCustomProduct.imageUrl,
        combinedNotes,
        i < currentCustomProduct.qty - 1
      );
    }
    window.closeProductCustomizer();
  };

  window.openCateringModal = function (presetType) {
    Cart.triggerHaptic(10);
    const modal = document.getElementById('cateringModal');
    const select = document.getElementById('cateringEventType');
    if (presetType && select) {
      select.value = presetType;
    }
    if (modal) {
      modal.classList.remove('hidden');
      requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('tb-modal-open');
      });
    }
  };

  window.closeCateringModal = function () {
    const modal = document.getElementById('cateringModal');
    if (modal) {
      modal.classList.remove('tb-modal-open');
      modal.classList.add('opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 240);
    }
  };

  window.toggleFavorite = function (btn) {
    Cart.triggerHaptic(10);
    const icon = btn.querySelector('i');
    if (icon) {
      if (icon.classList.contains('fa-regular')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        btn.classList.add('text-[#FF70B0]', 'scale-110');
        Cart.showToast('Guardado nos seus favoritos.');
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        btn.classList.remove('text-[#FF70B0]', 'scale-110');
      }
    }
  };

  window.Cart = Cart;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cart.init());
  } else {
    Cart.init();
  }
})();
