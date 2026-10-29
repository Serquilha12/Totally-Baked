import { Request, Response } from 'express';
import { OrderModel, CreateOrderInput, PaymentMethod, FulfillmentType } from '../models/OrderModel';
import { ProductModel } from '../models/ProductModel';
import {
  calculateDeliveryFee,
  STORE_LOCATION,
  STORE_ADDRESS,
  STORE_WHATSAPP,
  PEMBA_NEIGHBORHOODS,
  Coordinates,
} from '../lib/geo';

const FREE_SHIPPING_THRESHOLD = 1500;

export function getPublicBaseUrl(req: Request): string {
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  if (host) {
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export class OrderController {
  public static calculateFee(req: Request, res: Response): void {
    const neighborhood = (req.body?.neighborhood || req.query?.neighborhood) as string | undefined;
    let coords: Coordinates | undefined = req.body?.coords;

    if (!coords && req.query?.lat && req.query?.lng) {
      coords = {
        lat: parseFloat(req.query.lat as string),
        lng: parseFloat(req.query.lng as string),
      };
    }

    const deliveryInfo = calculateDeliveryFee(coords, neighborhood);

    res.json({
      success: true,
      fee: deliveryInfo.fee,
      estimatedMinutes: deliveryInfo.estimatedMinutes,
      distanceKm: deliveryInfo.distanceKm,
      neighborhood: deliveryInfo.neighborhood,
      data: deliveryInfo,
      store: STORE_LOCATION,
    });
  }

  public static createOrder(req: Request, res: Response): void {
    try {
      const {
        customerName,
        customerPhone,
        fulfillmentType,
        deliveryAddress,
        neighborhood,
        coords,
        latitude,
        longitude,
        paymentMethod,
        changeFor,
        items,
        notes,
      } = req.body;

      const mode: FulfillmentType = fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
      const resolvedNeighborhood = mode === 'pickup' ? 'Takeaway' : neighborhood;
      const resolvedAddress =
        mode === 'pickup'
          ? `Levantamento na Loja (${STORE_ADDRESS})`
          : (deliveryAddress || '').trim();

      if (!customerName || !customerPhone || (mode === 'delivery' && (!resolvedAddress || !resolvedNeighborhood))) {
        res.status(400).json({
          success: false,
          error: 'Por favor, preencha Nome, Telefone e os dados de entrega em Pemba.',
          message: 'Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Endereço e Bairro).',
        });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'A sua cesta está vazia. Adicione produtos antes de finalizar.',
          message: 'O carrinho está vazio. Selecione itens do menu antes de finalizar.',
        });
        return;
      }

      const detailedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = ProductModel.getById(item.productId);
        if (!product) {
          res.status(400).json({
            success: false,
            error: `Produto ${item.productId} não encontrado na carta.`,
            message: `Produto com ID ${item.productId} não foi encontrado.`,
          });
          return;
        }

        if (!product.isAvailable) {
          res.status(400).json({
            success: false,
            error: `O item "${product.name}" esgotou na fornada de hoje.`,
            message: `O produto "${product.name}" está indisponível no momento.`,
          });
          return;
        }

        const quantity = Math.max(1, Math.min(50, parseInt(item.quantity, 10) || 1));
        // Permitir ajuste seguro de porção/adicionais (entre 1x e 2.5x o preço base)
        let unitPrice = product.price;
        if (item.price && typeof item.price === 'number') {
          const requested = Math.round(item.price);
          if (requested >= product.price && requested <= Math.round(product.price * 2.5)) {
            unitPrice = requested;
          }
        }

        subtotal += unitPrice * quantity;

        detailedItems.push({
          productId: product.id,
          name: item.name && String(item.name).startsWith(product.name) ? String(item.name) : product.name,
          price: unitPrice,
          quantity,
          notes: item.notes ? String(item.notes).slice(0, 160) : undefined,
          imageUrl: product.imageUrl || product.image,
        });
      }

      // Resolver coordenadas GPS (coords diretas, latitude/longitude do form ou coordenadas do bairro)
      let resolvedCoords: Coordinates | undefined = coords;
      if (!resolvedCoords && typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
        resolvedCoords = { lat: latitude, lng: longitude };
      }
      if (!resolvedCoords && resolvedNeighborhood && PEMBA_NEIGHBORHOODS[resolvedNeighborhood]) {
        resolvedCoords = PEMBA_NEIGHBORHOODS[resolvedNeighborhood].coords;
      }

      const deliveryCalc = calculateDeliveryFee(
        mode === 'pickup' ? undefined : resolvedCoords,
        resolvedNeighborhood
      );

      const effectiveFee =
        mode === 'pickup' || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : deliveryCalc.fee;

      const input: CreateOrderInput = {
        customerName: String(customerName),
        customerPhone: String(customerPhone),
        fulfillmentType: mode,
        deliveryAddress: resolvedAddress,
        neighborhood: deliveryCalc.neighborhood,
        coords: resolvedCoords || STORE_LOCATION,
        paymentMethod: (paymentMethod as PaymentMethod) || 'mpesa',
        changeFor: changeFor ? parseFloat(changeFor) : undefined,
        items: detailedItems,
        subtotal,
        deliveryFee: effectiveFee,
        estimatedMinutes: deliveryCalc.estimatedMinutes,
        notes: notes ? String(notes).slice(0, 300) : undefined,
      };

      const order = OrderModel.create(input);
      const baseUrl = getPublicBaseUrl(req);
      const token = OrderModel.encodeOrderToken(order);
      const whatsappText = OrderModel.formatWhatsAppMessage(order, baseUrl);
      const whatsappUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`;
      const trackingUrl = `/rastreio/${order.id}?confirmed=1${token ? `&t=${encodeURIComponent(token)}` : ''}`;

      res.status(201).json({
        success: true,
        message: 'Pedido realizado com sucesso!',
        orderId: order.id,
        order,
        token,
        trackingUrl,
        whatsappUrl,
      });
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({
        success: false,
        error: 'Ocorreu um erro ao processar o seu pedido.',
        message: 'Ocorreu um erro ao processar o seu pedido.',
      });
    }
  }

  public static createCateringInquiry(req: Request, res: Response): void {
    try {
      const { customerName, customerPhone, eventType, eventDate, guestsCount, details } = req.body;

      if (!customerName || !customerPhone || !eventType) {
        res.status(400).json({
          success: false,
          error: 'Informe o seu nome, contacto e o tipo de evento.',
        });
        return;
      }

      const quoteRef = '#CAT-' + Math.floor(1000 + Math.random() * 9000);
      const text =
        `*PEDIDO DE CATERING & EVENTOS — Totally Baked Pemba*\n` +
        `-------------------------------------\n` +
        `*Referência:* ${quoteRef}\n` +
        `*Cliente / Empresa:* ${customerName}\n` +
        `*Telefone:* ${customerPhone}\n` +
        `*Tipo de Evento:* ${eventType}\n` +
        `${eventDate ? `*Data Prevista:* ${eventDate}\n` : ''}` +
        `${guestsCount ? `*Nº Estimado de Convidados:* ${guestsCount}\n` : ''}` +
        `${details ? `*Detalhes / Pedido Especial:* ${details}\n` : ''}` +
        `-------------------------------------\n` +
        `Enviado através da plataforma oficial Totally Baked Pemba.`;

      const whatsappUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;

      res.status(201).json({
        success: true,
        quoteRef,
        message: 'Proposta de Catering formatada com sucesso!',
        whatsappUrl,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Não foi possível gerar o pedido de catering.',
      });
    }
  }

  public static getTrackingView(req: Request, res: Response): void {
    const { id } = req.params;
    const token = req.query.t as string | undefined;
    const isConfirmed = req.query.confirmed === '1';

    const order = OrderModel.getById(id) || OrderModel.hydrateFromToken(token);

    if (!order) {
      res.status(404).render('tracking_not_found', {
        title: 'Pedido Não Encontrado | Totally Baked Pemba',
        orderId: id,
        activeNav: 'tracking',
      });
      return;
    }

    const baseUrl = getPublicBaseUrl(req);
    const whatsappText = OrderModel.formatWhatsAppMessage(order, baseUrl);
    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`;

    res.render('tracking', {
      title: `Acompanhar Pedido ${order.orderNumber} | Totally Baked Pemba`,
      order,
      store: STORE_LOCATION,
      storeAddress: STORE_ADDRESS,
      whatsappUrl,
      isConfirmed,
      orderToken: token || OrderModel.encodeOrderToken(order),
      activeNav: 'tracking',
    });
  }

  public static getOrderApi(req: Request, res: Response): void {
    const { id } = req.params;
    const token = req.query.t as string | undefined;
    const order = OrderModel.getById(id) || OrderModel.hydrateFromToken(token);

    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
      return;
    }

    res.json({
      success: true,
      order,
      store: STORE_LOCATION,
    });
  }

  public static getPembaNeighborhoodsApi(req: Request, res: Response): void {
    res.json({
      success: true,
      store: STORE_LOCATION,
      storeAddress: STORE_ADDRESS,
      neighborhoods: PEMBA_NEIGHBORHOODS,
    });
  }
}
