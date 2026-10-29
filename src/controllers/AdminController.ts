import { Request, Response } from 'express';
import { OrderModel, OrderStatus, Order, SalesReportOptions } from '../models/OrderModel';
import { ProductModel, CATEGORIES } from '../models/ProductModel';
import { PEMBA_NEIGHBORHOODS } from '../lib/geo';

export class AdminController {
  public static getDashboard(req: Request, res: Response): void {
    const orders: Order[] = OrderModel.getAll();
    const products = ProductModel.getAll();
    const stats = OrderModel.getDailyStats();
    const salesReport = OrderModel.getSalesReport();
    const neighborhoods = Object.keys(PEMBA_NEIGHBORHOODS);

    // Agrupar pedidos por status para o Kanban
    const kanban = {
      pending: orders.filter((o: Order) => o.status === 'pending' || o.status === 'recebido'),
      preparing: orders.filter((o: Order) => o.status === 'preparing'),
      in_transit: orders.filter((o: Order) => o.status === 'in_transit' || o.status === 'em_rota'),
      delivered: orders.filter((o: Order) => o.status === 'delivered' || o.status === 'entregue'),
      cancelled: orders.filter((o: Order) => o.status === 'cancelled')
    };

    res.render('admin', {
      title: 'Painel Administrativo | Totally Baked Pemba',
      orders,
      kanban,
      products,
      categories: CATEGORIES,
      stats,
      salesReport,
      neighborhoods,
      activeNav: 'admin'
    });
  }

  public static updateOrderStatus(req: Request, res: Response): void {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: OrderStatus[] = ['pending', 'preparing', 'in_transit', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status inválido. Escolha um dos seguintes: ${validStatuses.join(', ')}`
      });
      return;
    }

    const updated = OrderModel.updateStatus(id, status as OrderStatus);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
      return;
    }

    res.json({
      success: true,
      message: `Status do pedido #${id} alterado para "${status}".`,
      order: updated
    });
  }

  public static toggleProductAvailability(req: Request, res: Response): void {
    const { id } = req.params;
    const updated = ProductModel.toggleAvailability(id);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      return;
    }

    res.json({
      success: true,
      message: `Produto "${updated.name}" agora está ${updated.isAvailable ? 'DISPONÍVEL' : 'ESGOTADO'}.`,
      product: updated
    });
  }

  public static createProduct(req: Request, res: Response): void {
    try {
      const { name, description, price, category, imageUrl, isFeatured } = req.body;

      if (!name || !price || !category) {
        res.status(400).json({
          success: false,
          message: 'Nome, preço e categoria são campos obrigatórios.'
        });
        return;
      }

      const catObj = CATEGORIES.find(c => c.id === category);
      const imgUrl = imageUrl || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80';

      const newProduct = ProductModel.create({
        name,
        description: description || '',
        price: parseFloat(price),
        category,
        categoryLabel: catObj ? catObj.name : 'Gourmet Pemba',
        image: imgUrl,
        imageUrl: imgUrl,
        isAvailable: true,
        isFeatured: Boolean(isFeatured)
      });

      res.status(201).json({
        success: true,
        message: 'Produto adicionado com sucesso ao cardápio!',
        product: newProduct
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar produto.',
        error: error.message
      });
    }
  }

  public static deleteProduct(req: Request, res: Response): void {
    const { id } = req.params;
    const deleted = ProductModel.delete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      return;
    }

    res.json({
      success: true,
      message: 'Produto removido com sucesso do catálogo.'
    });
  }

  public static getStatsApi(req: Request, res: Response): void {
    const stats = OrderModel.getDailyStats();
    res.json({ success: true, stats });
  }

  public static getOrdersApi(req: Request, res: Response): void {
    const orders = OrderModel.getAll();
    res.json({ success: true, count: orders.length, orders });
  }

  public static getSalesReportApi(req: Request, res: Response): void {
    try {
      const { startDate, endDate, neighborhood, paymentMethod, status } = req.query;
      const options: SalesReportOptions = {};

      if (typeof startDate === 'string' && startDate) options.startDate = startDate;
      if (typeof endDate === 'string' && endDate) options.endDate = endDate;
      if (typeof neighborhood === 'string' && neighborhood) options.neighborhood = neighborhood;
      if (typeof paymentMethod === 'string' && paymentMethod) options.paymentMethod = paymentMethod;
      if (typeof status === 'string' && status) options.status = status;

      const report = OrderModel.getSalesReport(options);
      res.json({ success: true, report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao gerar relatório de vendas.', error: error.message });
    }
  }

  public static exportSalesReportCsv(req: Request, res: Response): void {
    try {
      const { startDate, endDate, neighborhood, paymentMethod, status } = req.query;
      const options: SalesReportOptions = {};

      if (typeof startDate === 'string' && startDate) options.startDate = startDate;
      if (typeof endDate === 'string' && endDate) options.endDate = endDate;
      if (typeof neighborhood === 'string' && neighborhood) options.neighborhood = neighborhood;
      if (typeof paymentMethod === 'string' && paymentMethod) options.paymentMethod = paymentMethod;
      if (typeof status === 'string' && status) options.status = status;

      const report = OrderModel.getSalesReport(options);

      // Gerar CSV com BOM (\uFEFF) para compatibilidade nativa com Excel Windows em Moçambique / PT
      const headers = ['ID', 'Numero_Pedido', 'Data_Hora', 'Cliente', 'Telefone', 'Bairro', 'Modalidade', 'Subtotal_MZN', 'Taxa_Entrega_MZN', 'Total_MZN', 'Metodo_Pagamento', 'Status', 'Itens'];
      
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const rows = report.orders.map((o: Order) => {
        const itemsSummary = (o.items || [])
          .map(i => `${i.quantity}x ${i.name}`)
          .join(' + ');

        return [
          escapeCsv(o.id),
          escapeCsv(o.orderNumber),
          escapeCsv(o.createdAt),
          escapeCsv(o.customerName),
          escapeCsv(o.customerPhone),
          escapeCsv(o.neighborhood),
          escapeCsv(o.fulfillmentType === 'pickup' ? 'Levantamento' : 'Entrega'),
          o.subtotal,
          o.deliveryFee,
          o.total,
          escapeCsv(o.paymentLabel || o.paymentMethod),
          escapeCsv(o.status),
          escapeCsv(itemsSummary)
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
      const filenameDate = new Date().toISOString().slice(0, 10);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-vendas-totallybaked-${filenameDate}.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Erro ao exportar CSV.', error: error.message });
    }
  }
}
