import { Request, Response } from 'express';
import { ProductModel, CATEGORIES } from '../models/ProductModel';

export class MenuController {
  public static getHome(req: Request, res: Response): void {
    const featured = ProductModel.getFeatured();
    const categories = CATEGORIES;
    res.render('index', {
      title: 'Totally Baked Pemba | Pastelaria Artesanal, Padaria & Gelados',
      featured,
      categories,
      activeNav: 'home'
    });
  }

  public static getMenu(req: Request, res: Response): void {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;

    let products = ProductModel.getAll();

    if (category && category !== 'todos') {
      products = ProductModel.getByCategory(category);
    }

    if (query) {
      products = ProductModel.search(query);
    }

    res.render('menu', {
      title: 'Menu Online & Encomendas | Totally Baked Pemba',
      products,
      categories: CATEGORIES,
      activeCategory: category || 'todos',
      searchQuery: query || '',
      activeNav: 'menu'
    });
  }

  public static getProductsApi(req: Request, res: Response): void {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;

    let products = ProductModel.getAll();

    if (category && category !== 'todos') {
      products = ProductModel.getByCategory(category);
    }

    if (query) {
      products = ProductModel.search(query);
    }

    res.json({
      success: true,
      count: products.length,
      categories: CATEGORIES,
      products
    });
  }

  public static getProductByIdApi(req: Request, res: Response): void {
    const { id } = req.params;
    const product = ProductModel.getById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Produto não encontrado.' });
      return;
    }

    res.json({ success: true, product });
  }
}
