/**
 * Totally Baked Pemba — Motor de Internacionalização Bilíngue (Português PT ↔ Inglês EN)
 * Traduz instantaneamente textos, atributos placeholder, botões e preserva as máscaras GSAP
 */

(function () {
  'use strict';

  const LANG_KEY = 'totallybaked_lang';

  // Dicionário PT -> EN (Mapeamento Exato e de Substrings de Interface)
  const PT_TO_EN = {
    // Cabeçalho & Navegação
    'Padaria · Pastelaria · Catering': 'Bakery · Pastry · Catering',
    'Padaria · Pastelaria · Catering · Pemba': 'Bakery · Pastry · Catering · Pemba',
    'Início': 'Home',
    'O Nosso Menu': 'Our Menu',
    'Serviços': 'Services',
    'Sobre Nós': 'About Us',
    'Catering & Festas': 'Catering & Events',
    'Rastreio GPS': 'GPS Tracking',
    'Fazer Pedido': 'Order Now',
    'Menu Completo & Preços': 'Full Menu & Prices',
    'Os Nossos Serviços': 'Our Services',
    'A Nossa História': 'Our Story',
    'Pedir Catering ou Bolo de Festa': 'Order Catering or Celebration Cake',
    'Rastreio GPS de Encomenda': 'Live Order GPS Tracking',
    'Consola da Cozinha (/admin)': 'Kitchen Console (/admin)',
    'A abrir destino': 'Opening destination',

    // Hero Section
    'Rua da ANE, Alto Gingone · Entregas em toda Pemba': 'Rua da ANE, Alto Gingone · Delivery across Pemba',
    'Padaria, Pastelaria, Cafetaria & Catering': 'Bakery, Pastry, Coffee Shop & Catering',
    'A sua experiência completa em pão fresco de fermentação natural, bolos de celebração, sorvetes artesanais, almoços executivos e serviço de catering com qualidade em cada detalhe.':
      'Your complete experience in fresh sourdough bread, celebration cakes, artisan gelato, executive lunches, and catering services crafted with care in every detail.',
    'Ver o Menu & Encomendar': 'Explore Menu & Order',
    'Catering & Bolos de Festa': 'Catering & Celebration Cakes',
    'Simular entrega:': 'Simulate delivery:',
    'Levantamento na Loja (Grátis)': 'In-Store Pickup (Free)',
    'Buscar': 'Search',
    'Produção Fresca Diária': 'Fresh Daily Baking',
    'Poupa 70 MZN': 'Save 70 MZN',
    '★ 4.9 · Favorito em Pemba': '★ 4.9 · Pemba Favorite',
    'Entrega grátis ≥ 1.500 MZN': 'Free delivery ≥ 1,500 MZN',
    'A Nossa Sugestão da Manhã': 'Our Morning Suggestion',
    'Combo Croissant Amanteigado & Cappuccino Cremoso': 'Buttery Croissant & Creamy Cappuccino Combo',
    'Croissant laminado na manteiga recém-saído do forno acompanhado por cappuccino de especialidade moído na hora.':
      'Freshly baked butter-laminated croissant paired with freshly ground specialty cappuccino.',
    'Pedir combo agora': 'Order combo now',
    '+ Cesta': '+ Bag',

    // Seção 2: Muito mais que uma pastelaria
    'Produtos frescos todos os dias': 'Freshly baked every day',
    'Muito mais que uma pastelaria em Pemba': 'Much more than a bakery in Pemba',
    'Seja para um pequeno-almoço acabado de sair do forno, um almoço rápido e saboroso, um café demorado à tarde ou o bolo central da sua festa, reunimos num só espaço a solução perfeita para cada momento do seu dia.':
      'Whether for a fresh-from-the-oven breakfast, a quick and flavorful lunch, a lingering afternoon coffee, or the centerpiece cake for your celebration, we bring together the perfect choice for every moment of your day.',
    'Padaria': 'Bakery',
    'Levain & Pão': 'Sourdough & Bread',
    'Pastelaria': 'Pastry',
    'Bolos & Doces': 'Cakes & Sweets',
    'Cafetaria': 'Coffee Shop',
    'Café & Sumos': 'Coffee & Juices',
    'Refeições': 'Meals',
    'Almoço & Gelado': 'Lunch & Gelato',

    // Seção 3: Destaques & Menu
    'Encomende sem sair de casa': 'Order from the comfort of home',
    'Escolhas Frescas do Nosso Menu': 'Fresh Picks from Our Menu',
    'Opções preparadas diariamente para entrega ao domicílio em Pemba ou levantamento rápido na Rua da ANE.':
      'Prepared fresh daily for home delivery across Pemba or quick pickup at Rua da ANE.',
    'Destaques': 'Featured',
    'Todo o Menu': 'All Menu',
    'Pães Artesanais': 'Artisan Breads',
    'Bolos & Celebrações': 'Cakes & Celebrations',
    'Bolos & Tortas': 'Cakes & Pies',
    'Pastelaria Fina': 'Fine Pastry',
    'Sorvetes Artesanais': 'Artisan Ice Cream',
    'Gelataria de Autor': 'Artisan Gelato',
    'Refeições & Pratos': 'Meals & Dishes',
    'Refeições & Brunch': 'Meals & Brunch',
    'Cafetaria & Bebidas': 'Coffee & Drinks',
    'Opções': 'Options',
    'Esgotado hoje': 'Sold out today',
    'Fornada do dia': 'Daily batch',
    'Padaria, Pastelaria, Sorvetes & Refeições': 'Bakery, Pastry, Gelato & Meals',
    'Pães de fermentação natural, croissants amanteigados, bolos para celebrações, gelados artesanais, cafés e almoços preparados diariamente com frescura na nossa cozinha em Pemba.':
      'Naturally leavened breads, buttery croissants, celebration cakes, artisan ice cream, specialty coffee, and lunches prepared fresh daily in our Pemba kitchen.',

    // Seção 4: Serviços
    'Soluções para todos os momentos': 'Solutions for every occasion',
    'Os Nossos Serviços em Pemba': 'Our Services in Pemba',
    'Da primeira fornada matinal de pão quente aos serviços completos de catering empresarial e bolos personalizados para as suas celebrações.':
      'From the first morning batch of warm bread to full corporate catering services and custom cakes for your celebrations.',
    'Padaria Artesanal': 'Artisan Bakery',
    'Pães frescos de fermentação natural (sourdough), baguetes crocantes e pães de queijo assados diariamente com ingredientes selecionados para o seu pequeno-almoço ou lanche.':
      'Fresh sourdough breads, crispy baguettes, and cheese breads baked daily with selected ingredients for your breakfast or snack.',
    'Ver pães frescos': 'View fresh breads',
    'Pastelaria & Bolos': 'Pastry & Cakes',
    'Vasta seleção de croissants folhados, pastéis de nata, doces finos e bolos de aniversário personalizados que encantam os olhos e o paladar em qualquer celebração.':
      'Wide selection of flaky croissants, custard tarts, fine sweets, and custom birthday cakes that delight both the eyes and the palate.',
    'Explorar bolos e doces': 'Explore cakes & sweets',
    'O ponto de encontro ideal para uma pausa tranquila ou reunião em Pemba. Desfrute do nosso café de especialidade, cappuccinos, chás e sumos 100% naturais.':
      'The ideal meeting spot for a quiet break or business meeting in Pemba. Enjoy our specialty coffee, cappuccinos, teas, and 100% natural juices.',
    'Ver cafés e bebidas': 'View coffees & drinks',
    'Sabores cremosos e refrescantes batidos artesanalmente — incluindo manga madura de Pemba, maracujá e pistácio — perfeitos para o clima tropical de Cabo Delgado.':
      'Creamy, refreshing flavors churned by hand — including ripe Pemba mango, passion fruit, and pistachio — perfect for Cabo Delgado’s tropical climate.',
    'Escolher sabores': 'Choose flavors',
    'Refeições & Almoços': 'Meals & Lunches',
    'Pratos do dia equilibrados, quiches douradas, saladas frescas e sanduíches gourmet em pão brioche. Opções rápidas, completas e saborosas para o seu almoço.':
      'Balanced daily dishes, golden quiches, fresh salads, and gourmet brioche sandwiches. Fast, complete, and delicious options for your lunch.',
    'Ver almoços e lanches': 'View lunches & snacks',
    'Catering & Eventos': 'Catering & Events',
    'Empresas & Festas': 'Corporate & Parties',
    'Levamos a excelência da Totally Baked ao seu evento em Pemba: coffee-breaks corporativos, reuniões institucionais, aniversários, casamentos e celebrações privadas.':
      'We bring Totally Baked excellence to your event in Pemba: corporate coffee breaks, institutional meetings, birthdays, weddings, and private celebrations.',
    'Pedir Orçamento de Catering': 'Request Catering Quote',

    // Seção 5: Sobre Nós
    'A nossa história em Pemba': 'Our story in Pemba',
    'Uma marca construída com dedicação, consistência e sabor.': 'A brand built with dedication, consistency, and flavor.',
    'Trabalhamos todos os dias com ingredientes selecionados, receitas rigorosamente testadas e uma equipa dedicada para garantir frescura, consistência e uma experiência acolhedora — quer nos visite na Rua da ANE, quer receba a nossa caixa na sua porta.':
      'Every day we work with selected ingredients, rigorously tested recipes, and a dedicated team to guarantee freshness, consistency, and a warm experience — whether you visit us at Rua da ANE or receive our box at your door.',
    'Qualidade & Consistência': 'Quality & Consistency',
    'Ingredientes selecionados e processos cuidados em cada fornada.': 'Selected ingredients and careful processes in every batch.',
    'Frescura Diária': 'Daily Freshness',
    'Produção diária na nossa cozinha para garantir sabor em cada momento.': 'Daily production in our kitchen to guarantee flavor in every moment.',
    'Atendimento Próximo': 'Warm Service',
    'Serviço atento, simples e focado na satisfação de cada cliente.': 'Attentive, simple service focused on every customer’s satisfaction.',

    // Seção 6: Testemunhos
    'Confiança em cada visita': 'Trust in every visit',
    'O Que os Nossos Clientes Dizem': 'What Our Customers Say',
    'A satisfação de quem partilha os seus momentos connosco em Pemba é a nossa maior recompensa.':
      'The satisfaction of those who share their moments with us in Pemba is our greatest reward.',
    '“Os melhores croissants da cidade! A massa é folhada na perfeição e o recheio é delicioso. O atendimento é sempre simpático e acolhedor.”':
      '“The best croissants in town! The pastry is flaky to perfection and the filling is delicious. The service is always friendly and welcoming.”',
    '“Encomendei um bolo de aniversário e superou todas as expectativas. Lindo e delicioso! Todos os convidados elogiaram. Recomendo vivamente.”':
      '“I ordered a birthday cake and it exceeded all expectations. Beautiful and delicious! All the guests praised it. Highly recommended.”',
    '“O pão de fermentação natural é incrível. Fresco, saboroso e com uma crosta perfeita. Virou paragem obrigatória no meu dia a dia em Pemba.”':
      '“The sourdough bread is incredible. Fresh, flavorful, and with a perfect crust. It has become a must-stop in my daily routine in Pemba.”',

    // Seção 7: Contacto & Rodapé
    'Estamos à sua espera em Pemba!': 'We are waiting for you in Pemba!',
    'Visite-nos ou Faça Já o Seu Pedido': 'Visit Us or Place Your Order Now',
    'Encomende online com entrega em toda a cidade de Pemba, fale diretamente connosco pelo WhatsApp ou visite a nossa loja no Bairro Alto Gingone.':
      'Order online with delivery across Pemba, chat with us directly on WhatsApp, or visit our shop in Bairro Alto Gingone.',
    'Morada Oficial': 'Official Address',
    'Horário de Funcionamento': 'Opening Hours',
    'Todos os dias: 07h00 — 20h00': 'Every day: 07:00 AM — 08:00 PM',
    'Contacto Direto': 'Direct Contact',
    'Falar no WhatsApp': 'Chat on WhatsApp',
    'Navegação': 'Navigation',
    'Cesta': 'Bag',
    'Rastreio': 'Track',
    'Menu': 'Menu',
    'Ver Cesta & Finalizar →': 'View Bag & Checkout →',
    'A Sua Cesta': 'Your Bag',
    'Subtotal dos Produtos': 'Products Subtotal',
    'Entrega ou Levantamento': 'Delivery or Pickup',
    'Calculada a seguir': 'Calculated at checkout',
    'Total Estimado': 'Estimated Total',
    'Finalizar Encomenda': 'Proceed to Checkout',
    'Concluir Pedido em Pemba': 'Complete Order in Pemba',
    'Entrega ao Domicílio': 'Home Delivery',
    'Entrega Domicílio': 'Home Delivery',
    'Levantar na Loja (0 MZN)': 'In-Store Pickup (0 MZN)',
    'Levantar (0 MZN)': 'Pickup (0 MZN)',
    'Resumo da Cesta': 'Bag Summary',
    'O seu pedido': 'Your order',
    'Adicionar à Cesta': 'Add to Bag',
    'Personalizar Pedido': 'Customize Order',
    'Confirmar Encomenda Agora': 'Confirm Order Now',
    'Nome Completo *': 'Full Name *',
    'Telemóvel / WhatsApp *': 'Phone / WhatsApp *',
    'Confirmar & Enviar Encomenda': 'Confirm & Place Order',
    'Falar com a Loja': 'Contact Store',
    'Novo Pedido': 'New Order',
    'Progresso do Pedido': 'Order Progress',
    'Recebido': 'Received',
    'No Forno': 'In the Oven',
    'Em Rota': 'On the Way',
    'Entregue': 'Delivered',
    'Concluído': 'Completed',
    'Previsão Estimada': 'Estimated Arrival',
    'Destino / Loja': 'Destination / Shop',
    'Mapa em Tempo Real · Rua da ANE, Alto Gingone, Pemba': 'Live GPS Map · Rua da ANE, Alto Gingone, Pemba',
    'Atualização 5s': '5s Live Sync',
    'Estafeta Totally Baked': 'Totally Baked Courier',
    'Destino do Cliente': 'Customer Destination',
    'Resumo da Encomenda': 'Order Summary'
  };

  // Construir mapa inverso EN -> PT automaticamente
  const EN_TO_PT = {};
  Object.keys(PT_TO_EN).forEach((ptKey) => {
    EN_TO_PT[PT_TO_EN[ptKey]] = ptKey;
  });

  const PLACEHOLDERS_PT_EN = {
    'Procurar pão, croissant, bolo, sorvete...': 'Search bread, croissant, cake, gelato...',
    'Procurar pão, bolo, sorvete, refeição...': 'Search bread, cake, gelato, meal...',
    'Ex: Anabela Mondlane': 'E.g., Anabela Mondlane',
    'Nº pedido, nome ou telefone...': 'Order #, customer name or phone...'
  };

  const PLACEHOLDERS_EN_PT = {};
  Object.keys(PLACEHOLDERS_PT_EN).forEach((k) => {
    PLACEHOLDERS_EN_PT[PLACEHOLDERS_PT_EN[k]] = k;
  });

  const I18n = {
    currentLang: 'pt',

    init() {
      let saved = 'pt';
      try {
        saved = localStorage.getItem(LANG_KEY) || 'pt';
      } catch {}
      this.setLang(saved, true);
    },

    setLang(lang, isInitial = false) {
      const targetLang = lang === 'en' ? 'en' : 'pt';
      this.currentLang = targetLang;
      try {
        localStorage.setItem(LANG_KEY, targetLang);
      } catch {}

      document.documentElement.lang = targetLang === 'en' ? 'en' : 'pt-MZ';
      this.updateToggleButtons(targetLang);

      if (!isInitial || targetLang === 'en') {
        this.translateDOM(targetLang);
      }
    },

    updateToggleButtons(lang) {
      document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
        const btnLang = btn.getAttribute('data-lang-btn');
        if (btnLang === lang) {
          btn.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold transition-all bg-[#FF70B0] text-white shadow-sm';
        } else {
          btn.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold transition-all text-[#524149] hover:text-[#181114]';
        }
      });
    },

    translateDOM(lang) {
      const dict = lang === 'en' ? PT_TO_EN : EN_TO_PT;
      const placeholderDict = lang === 'en' ? PLACEHOLDERS_PT_EN : PLACEHOLDERS_EN_PT;

      // 1. Traduzir elementos com texto direto
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        const parentTag = node.parentElement ? node.parentElement.tagName : '';
        if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'NOSCRIPT') continue;
        // Não tocar em palavras individuais já partidas pelo GSAP word-mask
        if (node.parentElement && node.parentElement.classList.contains('ix-word')) continue;
        textNodes.push(node);
      }

      textNodes.forEach((tNode) => {
        const raw = tNode.nodeValue || '';
        const trimmed = raw.trim();
        if (!trimmed) return;
        if (dict[trimmed]) {
          tNode.nodeValue = raw.replace(trimmed, dict[trimmed]);
        }
      });

      // 2. Traduzir títulos com máscara GSAP [data-ix-reveal="words"] preservando os spans
      document.querySelectorAll('[data-ix-reveal="words"]').forEach((el) => {
        if (!el.dataset.origPtHtml) {
          el.dataset.origPtHtml = el.innerText.trim();
        }
        const origPt = el.dataset.origPtHtml;

        // Títulos compostos conhecidos
        let targetText = null;
        if (origPt.includes('Da pastelaria artesanal')) {
          targetText = lang === 'en'
            ? 'From artisan pastry to <span class="text-[#D93883] italic font-normal">complete meals</span> in Pemba.'
            : 'Da pastelaria artesanal às <span class="text-[#D93883] italic font-normal">refeições completas</span> em Pemba.';
        } else if (dict[origPt]) {
          targetText = dict[origPt];
        }

        if (targetText) {
          el.innerHTML = targetText;
        }
      });

      // 3. Traduzir Placeholders
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((inp) => {
        const ph = inp.getAttribute('placeholder');
        if (ph && placeholderDict[ph]) {
          inp.setAttribute('placeholder', placeholderDict[ph]);
        }
      });
    }
  };

  window.I18n = I18n;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
  } else {
    I18n.init();
  }
})();
