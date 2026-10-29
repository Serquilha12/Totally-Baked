/**
 * Totally Baked Pemba - Model de Pedidos, Rastreio GPS & Hidratação Stateless (Vercel Ready)
 */

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { Coordinates, TOTALLY_BAKED_COORDS, STORE_ADDRESS } from '../lib/geo';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'recebido'
  | 'em_rota'
  | 'entregue';

export type PaymentMethod = 'mpesa' | 'emola' | 'pos' | 'cartao' | 'dinheiro' | 'card_on_delivery' | 'cash';
export type FulfillmentType = 'delivery' | 'pickup';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: #TB-7801
  customerName: string;
  customerPhone: string;
  fulfillmentType?: FulfillmentType;
  neighborhood: string;
  deliveryAddress: string;
  customerAddress?: string;
  coords: Coordinates;
  customerCoords?: Coordinates;
  courierCoords?: Coordinates;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  changeFor?: number;
  notes?: string;
  orderNotes?: string;
  status: OrderStatus;
  statusLabel: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddress: string;
  neighborhood: string;
  coords?: Coordinates;
  paymentMethod: PaymentMethod;
  changeFor?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  estimatedMinutes: number;
  notes?: string;
}

const DEMO_ORDERS: Order[] = [
  {
    id: 'ord-01',
    orderNumber: '#TB-1024',
    customerName: 'Dra. Ancha Jamal',
    customerPhone: '+258 84 123 4567',
    fulfillmentType: 'delivery',
    neighborhood: 'Praia do Wimbi',
    deliveryAddress: 'Av. Marginal, Condomínio Pemba Beach, Casa 4',
    customerAddress: 'Av. Marginal, Condomínio Pemba Beach, Casa 4',
    coords: { lat: -12.9667, lng: 40.5500 },
    customerCoords: { lat: -12.9667, lng: 40.5500 },
    courierCoords: { lat: -12.9700, lng: 40.5350 },
    items: [
      {
        productId: 'prod-04',
        name: 'Bolo Red Velvet Supreme com Cream Cheese',
        price: 1850,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80',
        notes: 'Com vela de aniversário simples',
      },
      {
        productId: 'prod-07',
        name: 'Croissant Francês Laminado na Manteiga',
        price: 140,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 2130,
    deliveryFee: 0,
    total: 2130,
    paymentMethod: 'mpesa',
    paymentLabel: 'M-Pesa (Vodacom)',
    status: 'in_transit',
    statusLabel: 'Em Rota com o Estafeta',
    estimatedMinutes: 15,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-02',
    orderNumber: '#TB-1025',
    customerName: 'Eng. Mussa Momade',
    customerPhone: '+258 82 987 6543',
    fulfillmentType: 'delivery',
    neighborhood: 'Centro da Cidade',
    deliveryAddress: 'Rua do Comércio, Edifício BCI, 2º Andar',
    customerAddress: 'Rua do Comércio, Edifício BCI, 2º Andar',
    coords: { lat: -12.9680, lng: 40.5180 },
    customerCoords: { lat: -12.9680, lng: 40.5180 },
    courierCoords: { ...TOTALLY_BAKED_COORDS },
    items: [
      {
        productId: 'prod-01',
        name: 'Pão Rústico de Fermentação Natural (Sourdough)',
        price: 180,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod-15',
        name: 'Iced Caramel Latte Refrescante',
        price: 220,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 620,
    deliveryFee: 80,
    total: 700,
    paymentMethod: 'emola',
    paymentLabel: 'E-Mola (Movitel)',
    status: 'preparing',
    statusLabel: 'Em Preparação na Cozinha',
    estimatedMinutes: 20,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-03',
    orderNumber: '#TB-1026',
    customerName: 'Fátima Noormahomed',
    customerPhone: '+258 86 555 1234',
    fulfillmentType: 'delivery',
    neighborhood: 'Alto Gingone',
    deliveryAddress: 'Próximo à Rua da ANE, Rua 3',
    customerAddress: 'Próximo à Rua da ANE, Rua 3',
    coords: { lat: -12.9800, lng: 40.5200 },
    customerCoords: { lat: -12.9800, lng: 40.5200 },
    courierCoords: { ...TOTALLY_BAKED_COORDS },
    items: [
      {
        productId: 'prod-10',
        name: 'Sorvete Artesanal de Manga de Pemba (250ml)',
        price: 220,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 440,
    deliveryFee: 100,
    total: 540,
    paymentMethod: 'mpesa',
    paymentLabel: 'M-Pesa (Vodacom)',
    status: 'pending',
    statusLabel: 'Novo Pedido Recebido',
    estimatedMinutes: 20,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

const TMP_ORDERS_FILE = path.join(os.tmpdir(), 'totallybaked_orders_v2.json');
const TOKEN_SECRET = process.env.ORDER_TOKEN_SECRET || 'tb-pemba-hmac-secret-2026';

class OrderManager {
  private orders: Map<string, Order> = new Map();

  constructor() {
    DEMO_ORDERS.forEach((o) => this.orders.set(o.id, { ...o }));
    this.loadFromTmp();
  }

  private loadFromTmp(): void {
    try {
      if (fs.existsSync(TMP_ORDERS_FILE)) {
        const raw = fs.readFileSync(TMP_ORDERS_FILE, 'utf8');
        const saved: Order[] = JSON.parse(raw);
        if (Array.isArray(saved)) {
          saved.forEach((o) => this.orders.set(o.id, o));
        }
      }
    } catch {
      // Silencioso em ambientes restritos
    }
  }

  private persistToTmp(): void {
    try {
      const arr = Array.from(this.orders.values()).slice(0, 200);
      fs.writeFileSync(TMP_ORDERS_FILE, JSON.stringify(arr), 'utf8');
    } catch {
      // Silencioso caso escrita não disponível
    }
  }

  /**
   * Gera um token assinado compacto para recuperar o pedido mesmo em cold-starts Serverless na Vercel
   */
  public encodeOrderToken(order: Order): string {
    try {
      const compact = JSON.stringify(order);
      const compressed = zlib.deflateRawSync(Buffer.from(compact, 'utf8')).toString('base64url');
      const sig = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(compressed)
        .digest('base64url')
        .slice(0, 16);
      return `${compressed}.${sig}`;
    } catch {
      return '';
    }
  }

  /**
   * Hidrata um pedido validando a assinatura HMAC caso a instância Serverless tenha reiniciado
   */
  public hydrateFromToken(token?: string): Order | undefined {
    if (!token || typeof token !== 'string' || !token.includes('.')) return undefined;
    try {
      const [compressed, sig] = token.split('.');
      const expected = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(compressed)
        .digest('base64url')
        .slice(0, 16);
      if (sig !== expected) return undefined;
      const json = zlib.inflateRawSync(Buffer.from(compressed, 'base64url')).toString('utf8');
      const parsed: Order = JSON.parse(json);
      if (parsed && parsed.id) {
        if (!this.orders.has(parsed.id)) {
          this.orders.set(parsed.id, parsed);
          this.persistToTmp();
        }
        return this.orders.get(parsed.id);
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  public getAll(): Order[] {
    this.loadFromTmp();
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getById(id: string): Order | undefined {
    if (!this.orders.has(id)) {
      this.loadFromTmp();
    }
    return this.orders.get(id);
  }

  public create(data: CreateOrderInput): Order {
    const id = 'ord-' + Date.now().toString(36);
    const orderNumber = '#TB-' + Math.floor(1000 + Math.random() * 9000);

    const paymentLabels: Record<string, string> = {
      mpesa: 'M-Pesa (Vodacom)',
      emola: 'E-Mola (Movitel)',
      pos: 'POS / Cartão na Entrega',
      cartao: 'POS / Cartão na Entrega',
      card_on_delivery: 'POS / Cartão na Entrega',
      dinheiro: 'Numerário (Dinheiro)',
      cash: 'Numerário (Dinheiro)',
    };

    const coords = data.coords || { ...TOTALLY_BAKED_COORDS };

    const newOrder: Order = {
      id,
      orderNumber,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      fulfillmentType: data.fulfillmentType || 'delivery',
      neighborhood: data.neighborhood,
      deliveryAddress: data.deliveryAddress.trim(),
      customerAddress: data.deliveryAddress.trim(),
      coords,
      customerCoords: coords,
      courierCoords: { ...TOTALLY_BAKED_COORDS },
      items: data.items.map((item) => ({
        ...item,
        imageUrl:
          item.imageUrl ||
          item.image ||
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      })),
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      total: data.subtotal + data.deliveryFee,
      paymentMethod: data.paymentMethod,
      paymentLabel: paymentLabels[data.paymentMethod] || 'M-Pesa (Vodacom)',
      changeFor: data.changeFor,
      notes: data.notes,
      orderNotes: data.notes,
      status: 'pending',
      statusLabel: 'Novo Pedido Recebido',
      estimatedMinutes: data.estimatedMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(id, newOrder);
    this.persistToTmp();
    return newOrder;
  }

  public updateStatus(id: string, newStatus: OrderStatus): Order | undefined {
    const order = this.getById(id);
    if (!order) return undefined;

    let normalizedStatus: OrderStatus = newStatus;
    if (newStatus === 'recebido') normalizedStatus = 'pending';
    if (newStatus === 'em_rota') normalizedStatus = 'in_transit';
    if (newStatus === 'entregue') normalizedStatus = 'delivered';

    const statusLabels: Record<string, string> = {
      pending: 'Novo Pedido Recebido',
      recebido: 'Novo Pedido Recebido',
      preparing: 'Em Preparação na Cozinha',
      in_transit: order.fulfillmentType === 'pickup' ? 'Pronto para Levantamento no Balcão' : 'Em Rota com o Estafeta',
      em_rota: 'Em Rota com o Estafeta',
      delivered: 'Pedido Entregue com Sucesso',
      entregue: 'Pedido Entregue com Sucesso',
      cancelled: 'Pedido Cancelado',
    };

    order.status = normalizedStatus;
    order.statusLabel = statusLabels[normalizedStatus] || 'Atualizado';
    order.updatedAt = new Date().toISOString();

    const targetCoords = order.coords || order.customerCoords;

    if (normalizedStatus === 'in_transit' && targetCoords) {
      order.courierCoords = {
        lat: (TOTALLY_BAKED_COORDS.lat + targetCoords.lat) / 2 + 0.001,
        lng: (TOTALLY_BAKED_COORDS.lng + targetCoords.lng) / 2 + 0.001,
      };
    } else if (normalizedStatus === 'delivered' && targetCoords) {
      order.courierCoords = { ...targetCoords };
    }

    this.orders.set(id, order);
    this.persistToTmp();
    return order;
  }

  public getDailyStats(): {
    totalRevenue: number;
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    topNeighborhood: string;
  } {
    const orders = this.getAll();
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'entregue' && o.status !== 'cancelled'
    ).length;
    const deliveredOrders = orders.filter(
      (o) => o.status === 'delivered' || o.status === 'entregue'
    ).length;

    const counts: Record<string, number> = {};
    validOrders.forEach((o) => {
      counts[o.neighborhood] = (counts[o.neighborhood] || 0) + 1;
    });

    let topNeighborhood = 'Alto Gingone';
    let max = 0;
    for (const [neigh, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        topNeighborhood = neigh;
      }
    }

    return {
      totalRevenue,
      totalOrders: orders.length,
      activeOrders,
      deliveredOrders,
      topNeighborhood,
    };
  }

  public getStats() {
    return this.getDailyStats();
  }

  public formatWhatsAppMessage(order: Order, baseUrl = 'https://www.totallybaked.co.mz'): string {
    const itemsList = order.items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.name} — ${i.price * i.quantity} MZN${i.notes ? ` (${i.notes})` : ''}`
      )
      .join('\n');

    const token = this.encodeOrderToken(order);
    const cleanBase = baseUrl.replace(/\/$/, '');
    const trackingLink = `${cleanBase}/rastreio/${order.id}${token ? `?t=${token}` : ''}`;
    const isPickup = order.fulfillmentType === 'pickup' || order.neighborhood.includes('Levantamento');

    return (
      `*NOVO PEDIDO — Totally Baked Pemba*\n` +
      `-------------------------------------\n` +
      `*Pedido:* ${order.orderNumber} (#${order.id})\n` +
      `*Cliente:* ${order.customerName}\n` +
      `*Telefone:* ${order.customerPhone}\n` +
      `*Modalidade:* ${isPickup ? `Levantamento na Loja (${STORE_ADDRESS})` : `Entrega ao Domicílio — ${order.neighborhood}`}\n` +
      `${!isPickup ? `*Morada:* ${order.deliveryAddress}\n` : ''}` +
      `*Pagamento:* ${order.paymentLabel}${order.changeFor ? ` (Troco para ${order.changeFor} MZN)` : ''}\n` +
      `-------------------------------------\n` +
      `*Itens da Encomenda:*\n${itemsList}\n` +
      `-------------------------------------\n` +
      `*Subtotal:* ${order.subtotal} MZN\n` +
      `*Entrega:* ${order.deliveryFee === 0 ? 'Grátis / Cortesia' : `${order.deliveryFee} MZN`}\n` +
      `*TOTAL A PAGAR:* *${order.total} MZN*\n` +
      `-------------------------------------\n` +
      `*Acompanhar Pedido:* ${trackingLink}\n` +
      `${order.notes ? `*Observações:* ${order.notes}\n` : ''}` +
      `Obrigado por escolher a Totally Baked Pemba!`
    );
  }
}

export const orderModel = new OrderManager();
export { orderModel as OrderModel };
