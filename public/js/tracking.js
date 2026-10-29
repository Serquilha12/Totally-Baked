/**
 * Totally Baked Pemba — Rastreio GPS em Tempo Real com Leaflet
 * Compatível com Token Stateless HMAC para Vercel Serverless
 */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.TRACKING_DATA;
  if (!data || !document.getElementById('trackingMap') || typeof L === 'undefined') return;

  const storeCoords = [data.store.lat, data.store.lng];
  const customerCoords = [data.customerCoords.lat, data.customerCoords.lng];
  let courierCoords = data.courierCoords ? [data.courierCoords.lat, data.courierCoords.lng] : [...storeCoords];

  const map = L.map('trackingMap', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView(courierCoords, 14);

  // Camada de Azulejos do Mapa (OpenStreetMap / Carto Voyager público com attribution e fallback)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  const storeIcon = L.divIcon({
    className: 'store-pin-container',
    html: `<div style="width:36px;height:36px;border-radius:9999px;background:#181114;color:#FFFFFF;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-shadow:0 6px 16px rgba(24,17,20,0.28);"><i class="fa-solid fa-store" style="font-size:13px;"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  const customerIcon = L.divIcon({
    className: 'customer-pin-container',
    html: `<div style="width:32px;height:32px;border-radius:9999px;background:#0284C7;color:#FFFFFF;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-shadow:0 6px 14px rgba(2,132,199,0.28);"><i class="fa-solid fa-house-chimney" style="font-size:12px;"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const courierIcon = L.divIcon({
    className: 'courier-pin-container',
    html: `
      <div style="width:38px;height:38px;border-radius:9999px;background:#FF70B0;color:#FFFFFF;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-shadow:0 8px 20px rgba(255,112,176,0.48);">
        <i class="fa-solid fa-motorcycle" style="font-size:14px;"></i>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  L.marker(storeCoords, { icon: storeIcon })
    .addTo(map)
    .bindPopup(`<strong>Totally Baked Pemba</strong><br><span style="font-size:11px;">Rua da ANE, Bairro Alto Gingone</span>`);

  if (data.fulfillmentType !== 'pickup') {
    L.marker(customerCoords, { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<strong>${data.customerName}</strong><br><span style="font-size:11px;">Destino (${data.neighborhood})</span>`);

    L.polyline([storeCoords, customerCoords], {
      color: '#FF70B0',
      weight: 3.5,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);
  }

  const courierMarker = L.marker(courierCoords, { icon: courierIcon })
    .addTo(map)
    .bindPopup(`<strong>Estafeta Totally Baked</strong><br><span style="font-size:11px;">Rastreio Ativo em Pemba</span>`);

  const bounds = L.latLngBounds([storeCoords, customerCoords]);
  map.fitBounds(bounds, { padding: [52, 52], maxZoom: 15 });

  let currentStatus = data.status;

  async function checkLiveStatus() {
    try {
      const qs = data.token ? `?t=${encodeURIComponent(data.token)}` : '';
      const res = await fetch(`/api/orders/${encodeURIComponent(data.orderId)}${qs}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.order) return;

      const order = json.order;

      if (order.status !== currentStatus) {
        currentStatus = order.status;
        updateStatusTimeline(currentStatus);
      }

      if (order.courierCoords) {
        const newCoords = [order.courierCoords.lat, order.courierCoords.lng];
        courierMarker.setLatLng(newCoords);
      }
    } catch (e) {
      // Falha transitória de rede ignorada silenciosamente
    }
  }

  function updateStatusTimeline(status) {
    const line = document.getElementById('stepProgressLine');
    const etaText = document.getElementById('liveEtaText');
    const transitIcon = document.getElementById('stepInTransitIcon');

    let width = '0%';
    if (status === 'preparing') {
      width = '33%';
      if (etaText) etaText.textContent = 'Em preparação na cozinha da Rua da ANE (~20 min)';
    } else if (status === 'in_transit') {
      width = '66%';
      if (etaText) {
        etaText.innerHTML =
          data.fulfillmentType === 'pickup'
            ? '<span class="text-[#D93883] font-bold">Pronto para levantamento no balcão da Rua da ANE!</span>'
            : '<span class="text-[#D93883] font-bold">Estafeta em rota com GPS ativo (~10-15 min)</span>';
      }
      if (transitIcon) {
        transitIcon.className =
          'w-10 h-10 rounded-full bg-[#FF70B0] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm';
      }
    } else if (status === 'delivered') {
      width = '88%';
      if (etaText) {
        etaText.innerHTML = '<span class="text-emerald-700 font-bold">Encomenda entregue com sucesso! Bom apetite.</span>';
      }
    }

    if (line) line.style.width = width;
  }

  setInterval(checkLiveStatus, 5000);
});
