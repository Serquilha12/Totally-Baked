/**
 * Totally Baked Pemba - Model de Produtos & Cardápio
 * Persistência resiliente em memória + /tmp (compatível com Vercel Serverless)
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

export interface Product {
  id: string;
  name: string;
  category: 'paes' | 'bolos' | 'pastelaria' | 'sorvetes' | 'refeicoes' | 'bebidas';
  categoryLabel: string;
  description: string;
  price: number; // Em Meticais (MZN)
  image: string;
  imageUrl?: string;
  badge?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
}

export const CATEGORIES = [
  { id: 'paes', name: 'Padaria Artesanal', icon: 'wheat' },
  { id: 'pastelaria', name: 'Pastelaria Fina', icon: 'croissant' },
  { id: 'bolos', name: 'Bolos & Celebrações', icon: 'cake' },
  { id: 'refeicoes', name: 'Refeições & Almoços', icon: 'cloche' },
  { id: 'sorvetes', name: 'Sorvetes Artesanais', icon: 'gelato' },
  { id: 'bebidas', name: 'Cafetaria & Bebidas', icon: 'coffee' },
];

const INITIAL_PRODUCTS: Product[] = [
  // PADARIA ARTESANAL
  {
    id: 'prod-01',
    name: 'Pão Rústico de Fermentação Natural (Sourdough)',
    category: 'paes',
    categoryLabel: 'Padaria Artesanal',
    description: 'Fermentado lentamente durante 24 horas para uma crosta estaladiça, dourada e miolo alveolado de sabor autêntico.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=700&q=80',
    badge: 'Fresco do Dia',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 64,
  },
  {
    id: 'prod-02',
    name: 'Baguete Tradicional de Crosta Crocante',
    category: 'paes',
    categoryLabel: 'Padaria Artesanal',
    description: 'Assada diariamente na Rua da ANE em lotes frescos — perfeita para o pequeno-almoço em família ou sanduíches.',
    price: 90,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=700&q=80',
    badge: 'Popular',
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 51,
  },
  {
    id: 'prod-03',
    name: 'Pão de Queijo & Ervas Finas (12 Unidades)',
    category: 'paes',
    categoryLabel: 'Padaria Artesanal',
    description: 'Dúzia de pães leves e quentinhos preparados com queijo curado seleccionado e aroma suave de orégãos.',
    price: 250,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=700&q=80',
    badge: 'Fornada Quente',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 73,
  },

  // BOLOS & TORTAS DE CELEBRAÇÃO
  {
    id: 'prod-04',
    name: 'Bolo Red Velvet Supreme com Cream Cheese',
    category: 'bolos',
    categoryLabel: 'Bolos & Celebrações',
    description: 'Camadas aveludadas de cacau rubi intercaladas com creme sedoso de queijo fresco — o favorito das celebrações em Pemba.',
    price: 1850,
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=700&q=80',
    badge: 'Mais Vendido',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 112,
  },
  {
    id: 'prod-05',
    name: 'Bolo Trufado de Chocolate Belga 70%',
    category: 'bolos',
    categoryLabel: 'Bolos & Celebrações',
    description: 'Massa húmida de cacau intenso coberta com ganache brilhante e raspas artesanais para aniversários e eventos.',
    price: 1950,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',
    badge: 'Celebração',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 84,
  },
  {
    id: 'prod-06',
    name: 'Cheesecake Cremoso de Maracujá de Cabo Delgado',
    category: 'bolos',
    categoryLabel: 'Bolos & Celebrações',
    description: 'Fatia generosa sobre base amanteigada crocante finalizada com redução fresca e brilhante de maracujá local.',
    price: 320,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80',
    badge: 'Especialidade',
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 59,
  },

  // PASTELARIA FINA
  {
    id: 'prod-07',
    name: 'Croissant Francês Laminado na Manteiga',
    category: 'pastelaria',
    categoryLabel: 'Pastelaria Fina',
    description: 'Folhado leve, dourado e crocante por fora com interior macio e amanteigado, assado todas as manhãs.',
    price: 140,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80',
    badge: 'Assinatura',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 128,
  },
  {
    id: 'prod-08',
    name: 'Pastel de Nata Tradicional Estaladiço',
    category: 'pastelaria',
    categoryLabel: 'Pastelaria Fina',
    description: 'Massa folhada finíssima recheada com creme de gemas aveludado, levemente tostado no forno e toque de canela.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=700&q=80',
    badge: 'Clássico',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 135,
  },
  {
    id: 'prod-09',
    name: 'Muffin Triplo Chocolate com Gotas Belgas',
    category: 'pastelaria',
    categoryLabel: 'Pastelaria Fina',
    description: 'Muffin alto e macio com coração húmido de chocolate meio-amargo, ideal para acompanhar um espresso.',
    price: 160,
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=700&q=80',
    badge: 'Lanche',
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 41,
  },

  // SORVETES ARTESANAIS
  {
    id: 'prod-10',
    name: 'Sorvete Artesanal de Manga de Pemba (250ml)',
    category: 'sorvetes',
    categoryLabel: 'Sorvetes Artesanais',
    description: 'Cremoso e refrescante, preparado na casa com polpa pura de mangas maduras da época para os dias quentes de Pemba.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=700&q=80',
    badge: 'Sabor de Pemba',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 67,
  },
  {
    id: 'prod-11',
    name: 'Sorvete Artesanal de Pistácio & Avelã (250ml)',
    category: 'sorvetes',
    categoryLabel: 'Sorvetes Artesanais',
    description: 'Textura aveludada estilo gelataria italiana com pedaços crocantes de pistácio levemente torrado.',
    price: 280,
    image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=700&q=80',
    badge: 'Artesanal',
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 44,
  },

  // REFEIÇÕES & ALMOÇOS
  {
    id: 'prod-12',
    name: 'Club Sandwich Gourmet em Pão Brioche Tostado',
    category: 'refeicoes',
    categoryLabel: 'Refeições & Almoços',
    description: 'Peito de frango grelhado no momento, queijo fundido, bacon crocante, folhas frescas e maionese da casa com batatas.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=80',
    badge: 'Almoço Completo',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 79,
  },
  {
    id: 'prod-13',
    name: 'Quiche Artesanal do Dia com Salada Fresca',
    category: 'refeicoes',
    categoryLabel: 'Refeições & Almoços',
    description: 'Massa quebrada amanteigada com recheio cremoso de queijo suíço e ervas, acompanhada de folhas verdes selecionadas.',
    price: 360,
    image: 'https://images.unsplash.com/photo-1554998171-89445e31c52b?auto=format&fit=crop&w=700&q=80',
    badge: 'Refeição Leve',
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 48,
  },

  // CAFETARIA & BEBIDAS
  {
    id: 'prod-14',
    name: 'Cappuccino Cremoso de Especialidade',
    category: 'bebidas',
    categoryLabel: 'Cafetaria & Bebidas',
    description: 'Dose dupla de café arábica moído na hora com leite vaporizado sedoso e leve toque de cacau ou canela.',
    price: 150,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=80',
    badge: 'Cafetaria',
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 95,
  },
  {
    id: 'prod-15',
    name: 'Iced Caramel Latte Refrescante',
    category: 'bebidas',
    categoryLabel: 'Cafetaria & Bebidas',
    description: 'Espresso encorpado servido sobre gelo com leite frio cremoso e fio artesanal de caramelo dourado.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=700&q=80',
    badge: 'Bebida Fria',
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 54,
  },
  {
    id: 'prod-16',
    name: 'Sumo Natural de Laranja & Gengibre Fresco (400ml)',
    category: 'bebidas',
    categoryLabel: 'Cafetaria & Bebidas',
    description: 'Espremido no momento do pedido sem adição de conservantes, revigorante a qualquer hora do dia.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=700&q=80',
    badge: '100% Natural',
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 61,
  },
  {
    id: 'prod-17',
    name: 'Bolo Caseiro de Cenoura com Calda de Chocolate',
    category: 'bolos',
    categoryLabel: 'Bolos & Celebrações',
    description: 'Fatia alta, fofa e perfumada coberta por generosa camada cremosa de brigadeiro artesanal.',
    price: 320,
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=700&q=80',
    badge: 'Pausa da Tarde',
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 70,
  },
  {
    id: 'prod-18',
    name: 'Tartelete Fina de Limão Merengada',
    category: 'pastelaria',
    categoryLabel: 'Pastelaria Fina',
    description: 'Base sablée crocante recheada com curd cítrico de limão fresco e coroada com merengue maçaricado.',
    price: 240,
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=700&q=80',
    badge: 'Doces Finos',
    isAvailable: true,
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 52,
  },
];

const TMP_PRODUCTS_FILE = path.join(os.tmpdir(), 'totallybaked_products_v2.json');

class ProductManager {
  private products: Map<string, Product> = new Map();

  constructor() {
    INITIAL_PRODUCTS.forEach((p) => this.products.set(p.id, { ...p }));
    this.loadFromTmp();
  }

  private loadFromTmp(): void {
    try {
      if (fs.existsSync(TMP_PRODUCTS_FILE)) {
        const raw = fs.readFileSync(TMP_PRODUCTS_FILE, 'utf8');
        const saved: Product[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length >= INITIAL_PRODUCTS.length) {
          saved.forEach((p) => this.products.set(p.id, p));
        }
      }
    } catch {
      // Ignorar silenciosamente em ambientes restritos
    }
  }

  private persistToTmp(): void {
    try {
      const arr = Array.from(this.products.values());
      fs.writeFileSync(TMP_PRODUCTS_FILE, JSON.stringify(arr), 'utf8');
    } catch {
      // Ignorar silenciosamente se /tmp não estiver disponível
    }
  }

  public getAll(): Product[] {
    return Array.from(this.products.values()).map((p) => ({
      ...p,
      imageUrl: p.imageUrl || p.image,
      isFeatured: p.isFeatured ?? (p.badge === 'Popular' || p.badge === 'Mais Vendido' || p.badge === 'Fresco do Dia'),
    }));
  }

  public getFeatured(): Product[] {
    return this.getAll().filter((p) => p.isFeatured);
  }

  public search(query: string): Product[] {
    if (!query) return this.getAll();
    const q = query.toLowerCase().trim();
    return this.getAll().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }

  public getAvailable(): Product[] {
    return this.getAll().filter((p) => p.isAvailable);
  }

  public getByCategory(category: string): Product[] {
    if (!category || category === 'todos') {
      return this.getAll();
    }
    return this.getAll().filter((p) => p.category === category);
  }

  public getById(id: string): Product | undefined {
    const p = this.products.get(id);
    if (!p) return undefined;
    return { ...p, imageUrl: p.imageUrl || p.image };
  }

  public toggleAvailability(id: string): Product | undefined {
    const prod = this.products.get(id);
    if (!prod) return undefined;
    prod.isAvailable = !prod.isAvailable;
    this.products.set(id, prod);
    this.persistToTmp();
    return prod;
  }

  public create(data: Omit<Product, 'id' | 'rating' | 'reviewsCount'>): Product {
    const id = 'prod-' + (this.products.size + 1).toString().padStart(2, '0');
    const newProduct: Product = {
      ...data,
      id,
      rating: 5.0,
      reviewsCount: 1,
    };
    this.products.set(id, newProduct);
    this.persistToTmp();
    return newProduct;
  }

  public update(id: string, updates: Partial<Product>): Product | undefined {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.products.set(id, updated);
    this.persistToTmp();
    return updated;
  }

  public delete(id: string): boolean {
    const deleted = this.products.delete(id);
    if (deleted) this.persistToTmp();
    return deleted;
  }
}

export const productModel = new ProductManager();
export { productModel as ProductModel };
