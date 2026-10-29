/**
 * Totally Baked Pemba — Motor GSAP de Transições de Página & Revelações Cinéticas
 * Inspirado na coreografia de https://henrietta.wearetattoodigital.com
 * Tecnologias: GSAP 3 + ScrollTrigger + Word Mask Splits + Curtain Page Transitions
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (typeof gsap === 'undefined') {
    const pre = document.getElementById('tbPreloader');
    if (pre) pre.style.display = 'none';
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* =========================================================================
     1. PRELOADER DE ENTRADA & CORTINA DE TRANSIÇÃO DE PÁGINA (HENRIETTA STYLE)
     ========================================================================= */
  function runInitialEntrance() {
    const preloader = document.getElementById('tbPreloader');
    const counterEl = document.getElementById('tbPreloaderCounter');
    const logoEl = document.getElementById('tbPreloaderLogo');
    const primaryLayer = document.getElementById('tbCurtainPrimary');
    const secondaryLayer = document.getElementById('tbCurtainSecondary');
    const mainEl = document.querySelector('main');

    if (prefersReducedMotion || window.location.search.indexOf('skipPreloader=1') !== -1) {
      if (preloader) preloader.style.display = 'none';
      return;
    }

    const fromPageTransition = sessionStorage.getItem('tb_page_enter') === '1';
    const seenPreloader = sessionStorage.getItem('tb_preloader_seen') === '1';
    sessionStorage.removeItem('tb_page_enter');

    // Caso 1: Navegação interna entre páginas -> Revela a cortina dupla suavemente
    if (fromPageTransition && primaryLayer && secondaryLayer) {
      if (preloader) preloader.style.display = 'none';

      gsap.set([primaryLayer, secondaryLayer], { yPercent: 0, y: 0 });
      if (mainEl) gsap.set(mainEl, { opacity: 0.85, y: 14 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set([primaryLayer, secondaryLayer], { yPercent: 102 });
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });

      tl.to(secondaryLayer, {
        yPercent: -102,
        duration: 0.52,
        ease: 'power4.inOut'
      }, 0)
      .to(primaryLayer, {
        yPercent: -102,
        duration: 0.56,
        ease: 'power4.inOut'
      }, 0.07);

      if (mainEl) {
        tl.to(mainEl, {
          opacity: 1,
          y: 0,
          duration: 0.48,
          ease: 'power3.out',
          clearProps: 'transform,opacity'
        }, 0.14);
      }

      initReveals(0.18);
      return;
    }

    // Caso 2: Primeira abertura da sessão -> Preloader Henrietta com contador 00->100% + Shrink Curtain
    if (!seenPreloader && preloader) {
      sessionStorage.setItem('tb_preloader_seen', '1');
      const countObj = { val: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          preloader.style.display = 'none';
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });

      if (logoEl) {
        tl.fromTo(logoEl,
          { y: 18, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'power3.out' },
          0
        );
      }

      if (counterEl) {
        tl.to(countObj, {
          val: 100,
          duration: 0.55,
          ease: 'power2.inOut',
          onUpdate: () => {
            counterEl.textContent = String(Math.round(countObj.val)).padStart(2, '0') + '%';
          }
        }, 0.05)
        .to([counterEl, logoEl], {
          scale: 0.9,
          opacity: 0,
          y: -12,
          duration: 0.24,
          ease: 'power2.in'
        }, 0.58);
      }

      tl.to(preloader, {
        yPercent: -102,
        duration: 0.62,
        ease: 'power4.inOut'
      }, 0.62);

      initReveals(0.72);
    } else {
      if (preloader) preloader.style.display = 'none';
      initReveals(0.05);
    }
  }

  /* =========================================================================
     2. INTERCEPTADOR DE CLIQUES PARA TRANSIÇÃO DE PÁGINAS (CURTAIN WIPE)
     ========================================================================= */
  function setupPageTransitionLinks() {
    if (prefersReducedMotion) return;

    const primaryLayer = document.getElementById('tbCurtainPrimary');
    const secondaryLayer = document.getElementById('tbCurtainSecondary');
    const mainEl = document.querySelector('main');
    if (!primaryLayer || !secondaryLayer) return;

    let isNavigating = false;

    document.addEventListener('click', (e) => {
      if (isNavigating) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Ignorar âncoras na mesma página, protocolos externos, novas abas ou downloads
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        link.hasAttribute('data-no-transition')
      ) {
        return;
      }

      let targetUrl;
      try {
        targetUrl = new URL(link.href, window.location.origin);
      } catch {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;
      // Se for exatamente a mesma URL apenas com hash, deixar o scroll suave nativo atuar
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
        return;
      }
      if (targetUrl.href === window.location.href) return;

      e.preventDefault();
      isNavigating = true;
      sessionStorage.setItem('tb_page_enter', '1');
      sessionStorage.setItem('tb_preloader_seen', '1');

      gsap.set([primaryLayer, secondaryLayer], { yPercent: 102, y: 0 });

      const exitTl = gsap.timeline({
        onComplete: () => {
          window.location.href = targetUrl.href;
        }
      });

      // Efeito Henrietta: página atual recua ligeiramente enquanto a cortina dupla sobe
      if (mainEl) {
        exitTl.to(mainEl, {
          scale: 0.975,
          opacity: 0.6,
          duration: 0.36,
          ease: 'power2.inOut',
          transformOrigin: 'center top'
        }, 0);
      }

      exitTl.to(primaryLayer, {
        yPercent: 0,
        duration: 0.38,
        ease: 'power4.inOut'
      }, 0)
      .to(secondaryLayer, {
        yPercent: 0,
        duration: 0.4,
        ease: 'power4.inOut'
      }, 0.06);
    });

    // Garantir recuperação limpa caso o navegador restaure do bfcache (Botão Voltar)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        isNavigating = false;
        gsap.set([primaryLayer, secondaryLayer], { yPercent: 102 });
        if (mainEl) gsap.set(mainEl, { clearProps: 'transform,opacity' });
      }
    });
  }

  /* =========================================================================
     3. COREOGRAFIA DE ENTRADA [data-ix-reveal] (WORDS, IMAGES, CARDS, SVG)
     ========================================================================= */
  function splitWordsIntoMasks(el) {
    if (el.dataset.ixSplitDone === '1') {
      return el.querySelectorAll('.ix-word');
    }
    el.dataset.ixSplitDone = '1';

    // Preservar nós filhos como <span> itálicos ou coloridos dividindo palavras nos nós de texto
    const walkAndWrap = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return;
        const frag = document.createDocumentFragment();
        const tokens = text.split(/(\s+)/);
        tokens.forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.appendChild(document.createTextNode(tok));
          } else {
            const mask = document.createElement('span');
            mask.className = 'ix-word-mask';
            const inner = document.createElement('span');
            inner.className = 'ix-word';
            inner.textContent = tok;
            mask.appendChild(inner);
            frag.appendChild(mask);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        Array.from(node.childNodes).forEach(walkAndWrap);
      }
    };

    Array.from(el.childNodes).forEach(walkAndWrap);
    return el.querySelectorAll('.ix-word');
  }

  function initReveals(baseDelay) {
    // A. Títulos com revelação de palavras mascaradas estilo Henrietta (data-ix-reveal="words")
    document.querySelectorAll('[data-ix-reveal="words"]').forEach((el) => {
      const words = splitWordsIntoMasks(el);
      if (!words.length) return;
      const isLoadTrigger = el.getAttribute('data-ix-trigger') === 'load';
      const extraDelay = parseFloat(el.getAttribute('data-ix-delay') || '0');

      const vars = {
        yPercent: 112,
        rotate: 2,
        opacity: 0,
        duration: 0.68,
        stagger: 0.032,
        ease: 'back.out(1.4)',
        clearProps: 'transform,opacity'
      };

      if (isLoadTrigger) {
        vars.delay = baseDelay + extraDelay;
      } else if (typeof ScrollTrigger !== 'undefined') {
        vars.scrollTrigger = {
          trigger: el,
          start: 'top 88%',
          once: true
        };
      }
      gsap.from(words, vars);
    });

    // B. Revelação de Imagens com Escala & Clip Suave (data-ix-reveal="image")
    document.querySelectorAll('[data-ix-reveal="image"]').forEach((wrap) => {
      const img = wrap.querySelector('img');
      const isLoadTrigger = wrap.getAttribute('data-ix-trigger') === 'load';
      const extraDelay = parseFloat(wrap.getAttribute('data-ix-delay') || '0');

      const tlVars = {};
      if (!isLoadTrigger && typeof ScrollTrigger !== 'undefined') {
        tlVars.scrollTrigger = {
          trigger: wrap,
          start: 'top 88%',
          once: true
        };
      }

      const tl = gsap.timeline(tlVars);
      const startAt = isLoadTrigger ? baseDelay + extraDelay : 0;

      tl.from(wrap, {
        y: 26,
        opacity: 0,
        scale: 0.96,
        duration: 0.72,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      }, startAt);

      if (img) {
        tl.from(img, {
          scale: 1.09,
          duration: 0.95,
          ease: 'power3.out',
          clearProps: 'transform'
        }, startAt);
      }
    });

    // C. Grupos de Cartões Escalonados (data-ix-group="...")
    const groups = {};
    document.querySelectorAll('[data-ix-group]').forEach((el) => {
      const name = el.getAttribute('data-ix-group');
      if (!groups[name]) groups[name] = [];
      groups[name].push(el);
    });

    Object.keys(groups).forEach((groupName) => {
      const items = groups[groupName];
      if (!items.length) return;
      const isLoad = items[0].getAttribute('data-ix-trigger') === 'load';

      const vars = {
        y: 30,
        opacity: 0,
        scale: 0.97,
        duration: 0.58,
        stagger: 0.065,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      };

      if (isLoad) {
        vars.delay = baseDelay + 0.12;
      } else if (typeof ScrollTrigger !== 'undefined') {
        vars.scrollTrigger = {
          trigger: items[0],
          start: 'top 89%',
          once: true
        };
      }
      gsap.from(items, vars);
    });

    // D. Elementos Individuais (data-ix-reveal="fade-up")
    document.querySelectorAll('[data-ix-reveal="fade-up"]').forEach((el) => {
      const isLoad = el.getAttribute('data-ix-trigger') === 'load';
      const extraDelay = parseFloat(el.getAttribute('data-ix-delay') || '0');

      const vars = {
        y: 22,
        opacity: 0,
        duration: 0.56,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      };

      if (isLoad) {
        vars.delay = baseDelay + extraDelay;
      } else if (typeof ScrollTrigger !== 'undefined') {
        vars.scrollTrigger = {
          trigger: el,
          start: 'top 90%',
          once: true
        };
      }
      gsap.from(el, vars);
    });

    // E. Desenho de Traço Vetorial nos Ícones SVG Animados (.svg-draw-path)
    document.querySelectorAll('.anim-svg-icon').forEach((svg) => {
      const paths = svg.querySelectorAll('path, circle, rect, line, polyline');
      paths.forEach((p) => {
        if (typeof p.getTotalLength === 'function') {
          try {
            const len = p.getTotalLength();
            if (len > 0 && len < 600) {
              gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
              gsap.to(p, {
                strokeDashoffset: 0,
                duration: 0.9,
                ease: 'power2.out',
                scrollTrigger: typeof ScrollTrigger !== 'undefined' ? {
                  trigger: svg,
                  start: 'top 92%',
                  once: true
                } : undefined,
                onComplete: () => gsap.set(p, { clearProps: 'strokeDasharray,strokeDashoffset' })
              });
            }
          } catch {}
        }
      });
    });
  }

  /* =========================================================================
     4. PARALLAX SUAVE NO HERO DESKTOP ([data-parallax-scene])
     ========================================================================= */
  function initHeroParallax() {
    if (prefersReducedMotion || !isFinePointer) return;
    const scene = document.querySelector('[data-parallax-scene]');
    if (!scene) return;

    const layers = scene.querySelectorAll('[data-parallax-depth]');
    if (!layers.length) return;

    const quickToMap = Array.from(layers).map((el) => ({
      depth: parseFloat(el.getAttribute('data-parallax-depth') || '12'),
      xTo: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }),
      yTo: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    }));

    scene.addEventListener('mousemove', (e) => {
      const rect = scene.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      quickToMap.forEach((item) => {
        item.xTo(nx * item.depth);
        item.yTo(ny * item.depth);
      });
    });

    scene.addEventListener('mouseleave', () => {
      quickToMap.forEach((item) => {
        item.xTo(0);
        item.yTo(0);
      });
    });
  }

  /* =========================================================================
     BOOT
     ========================================================================= */
  function boot() {
    setupPageTransitionLinks();
    runInitialEntrance();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
