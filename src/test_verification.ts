/**
 * Totally Baked Pemba — Suíte de Verificação & Integração de Produção (Vercel Ready)
 * Executa testes automatizados em todos os módulos centrais do sistema
 */

import {
  calculateDistanceKm,
  calculateDeliveryFee,
  STORE_LOCATION,
  STORE_ADDRESS,
  PEMBA_NEIGHBORHOODS,
} from './lib/geo';
import { ProductModel } from './models/ProductModel';
import { OrderModel, CreateOrderInput } from './models/OrderModel';

async function runTests() {
  console.log('🧪 Iniciando Testes de Verificação — Totally Baked Pemba (Vercel Ready)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. TESTES DO MÓDULO GEOGRÁFICO & MORADA OFICIAL (RUA DA ANE, ALTO GINGONE)
  console.log('📌 [1] Testando Módulo Geográfico, Morada Oficial & Levantamento na Loja:');
  assert(
    STORE_ADDRESS.includes('Rua da ANE') && STORE_ADDRESS.includes('Alto Gingone'),
    `Morada oficial validada: ${STORE_ADDRESS}`
  );

  const wimbiCoords = PEMBA_NEIGHBORHOODS['Wimbi'].coords;
  const distWimbi = calculateDistanceKm(STORE_LOCATION, wimbiCoords);
  assert(distWimbi > 0 && distWimbi < 15, `Distância Rua da ANE -> Wimbi calculada: ${distWimbi.toFixed(2)} km`);

  const feeWimbi = calculateDeliveryFee(wimbiCoords, 'Wimbi');
  assert(feeWimbi.fee >= 80, `Taxa de entrega para Wimbi calculada: ${feeWimbi.fee} MZN`);
  assert(
    feeWimbi.estimatedMinutes >= 15 && feeWimbi.estimatedMinutes <= 50,
    `Tempo estimado para Wimbi: ${feeWimbi.estimatedMinutes} min`
  );

  const feeChuiba = calculateDeliveryFee(undefined, 'Chuiba');
  assert(feeChuiba.fee === 200, `Taxa de entrega para Chuiba é 200 MZN (obtido: ${feeChuiba.fee} MZN)`);

  const feeTakeaway = calculateDeliveryFee(undefined, 'Takeaway');
  assert(
    feeTakeaway.fee === 0 && feeTakeaway.estimatedMinutes === 15,
    `Levantamento na Loja (Takeaway) tem taxa 0 MZN e preparo em 15 min`
  );

  // 2. TESTES DO MODELO DE PRODUTOS
  console.log('\n🥐 [2] Testando Modelo de Produtos & 6 Categorias Oficiais:');
  const allProducts = ProductModel.getAll();
  assert(allProducts.length >= 18, `Catálogo seeded contém ${allProducts.length} produtos (mínimo 18 esperado)`);

  const featured = ProductModel.getFeatured();
  assert(featured.length > 0, `Produtos em destaque carregados: ${featured.length} itens`);

  const bakery = ProductModel.getByCategory('paes');
  assert(bakery.length > 0, `Categoria 'paes' contém ${bakery.length} itens`);

  const gelato = ProductModel.getByCategory('sorvetes');
  assert(gelato.length > 0, `Categoria 'sorvetes' contém ${gelato.length} itens`);

  const meals = ProductModel.getByCategory('refeicoes');
  assert(meals.length > 0, `Categoria 'refeicoes' contém ${meals.length} itens`);

  const searchResults = ProductModel.search('Croissant');
  assert(searchResults.length >= 1, `Busca por 'Croissant' retornou ${searchResults.length} produtos`);

  const firstProd = allProducts[0];
  const initialAvailability = firstProd.isAvailable;
  const toggled = ProductModel.toggleAvailability(firstProd.id);
  assert(
    toggled !== undefined && toggled.isAvailable === !initialAvailability,
    `Toggle de disponibilidade funciona (${firstProd.name}: ${initialAvailability} -> ${toggled?.isAvailable})`
  );
  ProductModel.toggleAvailability(firstProd.id);

  // 3. TESTES DO MODELO DE PEDIDOS, TOKEN STATELESS HMAC (VERCEL) & KANBAN
  console.log('\n🛵 [3] Testando Modelo de Pedidos, Token Stateless HMAC & Kanban:');
  const testInput: CreateOrderInput = {
    customerName: 'Manuel Chissano',
    customerPhone: '+258841234567',
    fulfillmentType: 'delivery',
    deliveryAddress: 'Av. Marginal, Condomínio Pemba Beach, Apto 4B',
    neighborhood: 'Wimbi',
    coords: wimbiCoords,
    paymentMethod: 'mpesa',
    items: [
      {
        productId: allProducts[0].id,
        name: allProducts[0].name,
        price: allProducts[0].price,
        quantity: 2,
        notes: 'Aquecido',
      },
      {
        productId: allProducts[1].id,
        name: allProducts[1].name,
        price: allProducts[1].price,
        quantity: 1,
      },
    ],
    subtotal: allProducts[0].price * 2 + allProducts[1].price,
    deliveryFee: 150,
    estimatedMinutes: 30,
    notes: 'Campainha com defeito, favor ligar ao chegar.',
  };

  const createdOrder = OrderModel.create(testInput);
  assert(Boolean(createdOrder.id), `Pedido criado com sucesso ID: ${createdOrder.id}`);
  assert(createdOrder.total === testInput.subtotal + 150, `Cálculo total do pedido correto: ${createdOrder.total} MZN`);
  assert(createdOrder.status === 'pending', `Status inicial do pedido é 'pending'`);

  // Testar Token Criptográfico Stateless HMAC (Vercel Serverless Cold-Start Resilience)
  const signedToken = OrderModel.encodeOrderToken(createdOrder);
  assert(signedToken.includes('.') && signedToken.length > 40, `Token stateless HMAC assinado gerado com sucesso`);

  const hydrated = OrderModel.hydrateFromToken(signedToken);
  assert(
    hydrated !== undefined && hydrated.id === createdOrder.id && hydrated.total === createdOrder.total,
    `Hidratação stateless do pedido via token HMAC validada (${hydrated?.orderNumber})`
  );

  const tampered = OrderModel.hydrateFromToken(signedToken + 'tamper');
  assert(tampered === undefined, `Token HMAC adulterado é rejeitado com segurança`);

  // Avançar status no Kanban
  const prep = OrderModel.updateStatus(createdOrder.id, 'preparing');
  assert(prep?.status === 'preparing', `Status atualizado para 'preparing'`);

  const inTransit = OrderModel.updateStatus(createdOrder.id, 'in_transit');
  assert(inTransit?.status === 'in_transit', `Status atualizado para 'in_transit'`);
  assert(
    Boolean(inTransit?.courierCoords),
    `Coordenadas do estafeta calculadas: lat=${inTransit?.courierCoords?.lat}, lng=${inTransit?.courierCoords?.lng}`
  );

  const delivered = OrderModel.updateStatus(createdOrder.id, 'delivered');
  assert(delivered?.status === 'delivered', `Status atualizado para 'delivered'`);

  // Testar mensagem do WhatsApp (+258 84 595 8546) com URL de produção Vercel
  const waMsg = OrderModel.formatWhatsAppMessage(createdOrder, 'https://totallybaked.vercel.app');
  assert(
    waMsg.includes('Totally Baked Pemba') &&
      waMsg.includes(createdOrder.id) &&
      waMsg.includes('https://totallybaked.vercel.app/rastreio/'),
    `Mensagem WhatsApp contém ID e URL dinâmica de produção (https://totallybaked.vercel.app)`
  );

  // Testar Estatísticas do Dashboard
  const stats = OrderModel.getDailyStats();
  assert(stats.totalOrders > 0, `Total de pedidos no painel diário: ${stats.totalOrders}`);
  assert(stats.totalRevenue > 0, `Faturamento acumulado: ${stats.totalRevenue} MZN`);

  console.log(`\n=================================================`);
  console.log(`Resumo dos Testes: ${passed} Passaram | ${failed} Falharam`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 Todos os testes passaram com 100% de sucesso!');
  }
}

runTests();
