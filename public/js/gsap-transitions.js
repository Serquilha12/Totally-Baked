/**
 * Totally Baked Pemba — Motor GSAP 3 de Coreografia de Entrada, Transições de Página & Micro-Interações
 * Arquitetura:
 *  1. Preloader Cinematográfico GSAP (Desenho de Traço SVG + Odómetro Numérico + Clip-Path Reveal)
 *  2. Timeline Mestre de Entrada (Navbar + Word Masks + Clip-Path Reveal de Imagens + Stagger Cards)
 *  3. Botões Magnéticos Suaves no Desktop (gsap.quickTo)
 *  4. Transição Contextual de Página Sem FOUC + Prefetch Automático
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (typeof gsap === 'undefined') {
    const pre = document.getElementById('tbPreloader');
    if (pre) pre.style.display = 'none';
    document.documentElement.classList.remove('tb-is-transitioning');
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /**
   * Mapeamento semântico de destinos para feedback visual intuitivo durante a transição
   */
  function resolveDestinationMeta(urlObj, linkEl) {
    const path = (urlObj.pathname || '/').toLowerCase();
    const search = urlObj.search || '';

    if (path === '/' || path === '/index') {
      return { label: 'Início · Atelier Pemba', icon: 'fa-solid fa-house' };
    }
    if (path.startsWith('/menu')) {
      if (search.includes('category=paes')) return { label: 'Pães Artesanais', icon: 'fa-solid fa-bread-slice' };
      if (search.includes('category=bolos')) return { label: 'Bolos & Celebrações', icon: 'fa-solid fa-cake-candles' };
      if (search.includes('category=pastelaria')) return { label: 'Pastelaria Fina', icon: 'fa-solid fa-cookie-bite' };
      if (search.includes('category=sorvetes') || search.includes('category=gelados')) return { label: 'Sorvetes Artesanais', icon: 'fa-solid fa-ice-cream' };
      if (search.includes('category=refeicoes')) return { label: 'Refeições & Pratos', icon: 'fa-solid fa-utensils' };
      if (search.includes('category=bebidas')) return { label: 'Cafetaria & Bebidas', icon: 'fa-solid fa-mug-hot' };
      return { label: 'O Nosso Menu Completo', icon: 'fa-solid fa-utensils' };
    }
    if (path.startsWith('/rastreio')) {
      return { label: 'Rastreio GPS em Tempo Real', icon: 'fa-solid fa-location-crosshairs' };
    }
    if (path.startsWith('/admin')) {
      return { label: 'Consola de Gestão & Vendas', icon: 'fa-solid fa-chart-line' };
    }

    const rawText = linkEl ? (linkEl.innerText || linkEl.getAttribute('aria-label') || '').trim() : '';
    const cleanText = rawText.replace(/\s+/g, ' ').slice(0, 28);
    return {
      label: cleanText || 'Totally Baked Pemba',
      icon: 'fa-solid fa-compass'
    };
  }

  function applyTransitionMeta(meta) {
    if (!meta) return;
    const labelEl = document.getElementById('tbTransitionLabel');
    const iconEl = document.getElementById('tbTransitionIcon');
    if (labelEl && meta.label) labelEl.textContent = meta.label;
    if (iconEl && meta.icon) iconEl.className = `${meta.icon} text-[#D93883] text-sm`;
  }

  /* =========================================================================
     1. ENTRADA DA PÁGINA (CONTINUAÇÃO CONTÍNUA DA CORTINA OU PRELOADER GSAP)
     ========================================================================= */
  function runInitialEntrance() {
    const preloader = document.getElementById('tbPreloader');
    const preloaderCard = document.getElementById('tbPreloaderCard');
    const preloaderEmblem = document.getElementById('tbPreloaderEmblem');
    const preloaderScript = document.getElementById('tbPreloaderScript');
    const preloaderSub = document.getElementById('tbPreloaderSub');
    const counterEl = document.getElementById('tbPreloaderCounter');
    const preloaderBar = document.getElementById('tbPreloaderBar');
    const primaryLayer = document.getElementById('tbCurtainPrimary');
    const secondaryLayer = document.getElementById('tbCurtainSecondary');
    const backdropEl = document.getElementById('tbTransitionBackdrop');
    const contentBadge = document.getElementById('tbTransitionContent');
    const topProgress = document.getElementById('tbTopProgressBar');
    const mainEl = document.querySelector('main');
    const headerEl = document.querySelector('header.light-glass-header');

    if (prefersReducedMotion || window.location.search.indexOf('skipPreloader=1') !== -1) {
      if (preloader) preloader.style.display = 'none';
      document.documentElement.classList.remove('tb-is-transitioning');
      return;
    }

    const fromPageTransition = sessionStorage.getItem('tb_page_enter') === '1';
    const seenPreloader = sessionStorage.getItem('tb_preloader_seen') === '1';
    const savedLabel = sessionStorage.getItem('tb_page_label');
    const savedIcon = sessionStorage.getItem('tb_page_icon');

    sessionStorage.removeItem('tb_page_enter');
    sessionStorage.removeItem('tb_page_label');
    sessionStorage.removeItem('tb_page_icon');

    // Caso 1: Chegada de uma transição entre páginas -> Abertura contínua de cima para baixo sem piscar
    if (fromPageTransition && primaryLayer && secondaryLayer) {
      if (preloader) preloader.style.display = 'none';
      if (savedLabel || savedIcon) {
        applyTransitionMeta({ label: savedLabel, icon: savedIcon });
      } else {
        applyTransitionMeta(resolveDestinationMeta(window.location, null));
      }

      gsap.set([primaryLayer, secondaryLayer], { yPercent: 0, y: 0 });
      if (backdropEl) gsap.set(backdropEl, { opacity: 1 });
      if (contentBadge) gsap.set(contentBadge, { opacity: 1, scale: 1, y: 0 });
      if (topProgress) gsap.set(topProgress, { opacity: 1, scaleX: 0.72 });
      if (mainEl) gsap.set(mainEl, { opacity: 0, y: 20 });

      document.documentElement.classList.remove('tb-is-transitioning');

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set([primaryLayer, secondaryLayer], { yPercent: 104 });
          if (backdropEl) gsap.set(backdropEl, { opacity: 0 });
          if (contentBadge) gsap.set(contentBadge, { clearProps: 'transform,opacity' });
          if (topProgress) gsap.set(topProgress, { opacity: 0, scaleX: 0 });
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });

      if (topProgress) {
        tl.to(topProgress, {
          scaleX: 1,
          duration: 0.22,
          ease: 'power2.out'
        }, 0)
        .to(topProgress, {
          opacity: 0,
          duration: 0.2,
          ease: 'power1.out'
        }, 0.28);
      }

      if (contentBadge) {
        tl.to(contentBadge, {
          y: -14,
          opacity: 0,
          scale: 0.95,
          duration: 0.22,
          ease: 'power2.in'
        }, 0.02);
      }

      tl.to(secondaryLayer, {
        yPercent: -104,
        duration: 0.48,
        ease: 'expo.inOut'
      }, 0.06)
      .to(primaryLayer, {
        yPercent: -104,
        duration: 0.52,
        ease: 'expo.inOut'
      }, 0.11);

      if (backdropEl) {
        tl.to(backdropEl, {
          opacity: 0,
          duration: 0.36,
          ease: 'power2.out'
        }, 0.15);
      }

      if (mainEl) {
        tl.to(mainEl, {
          opacity: 1,
          y: 0,
          duration: 0.46,
          ease: 'power3.out',
          clearProps: 'transform,opacity'
        }, 0.14);
      }

      initReveals(0.14);
      return;
    }

    document.documentElement.classList.remove('tb-is-transitioning');

    // Caso 2: Primeira abertura da sessão -> Preloader Cinematográfico GSAP + Entrada Coreografada
    if (!seenPreloader && preloader) {
      sessionStorage.setItem('tb_preloader_seen', '1');
      const countObj = { val: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          preloader.style.display = 'none';
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        }
      });

      // Preparar traços SVG do emblema do preloader
      const svgPaths = preloader.querySelectorAll('.tb-preload-path');
      svgPaths.forEach((p) => {
        if (typeof p.getTotalLength === 'function') {
          try {
            const len = p.getTotalLength();
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
          } catch {}
        }
      });

      if (preloaderCard) {
        tl.fromTo(preloaderCard,
          { y: 24, opacity: 0, scale: 0.94 },
          { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'expo.out' },
          0
        );
      }

      if (preloaderEmblem) {
        tl.fromTo(preloaderEmblem,
          { scale: 0.75, rotate: -8 },
          { scale: 1, rotate: 0, duration: 0.48, ease: 'back.out(1.8)' },
          0.04
        );
      }

      if (svgPaths.length) {
        tl.to(svgPaths, {
          strokeDashoffset: 0,
          duration: 0.52,
          stagger: 0.08,
          ease: 'power2.inOut'
        }, 0.06);
      }

      if (preloaderScript) {
        tl.fromTo(preloaderScript,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.42, ease: 'power3.out' },
          0.1
        );
      }

      if (preloaderSub) {
        tl.fromTo(preloaderSub,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' },
          0.18
        );
      }

      if (preloaderBar) {
        tl.to(preloaderBar, {
          width: '100%',
          duration: 0.56,
          ease: 'expo.inOut'
        }, 0.08);
      }

      if (counterEl) {
        tl.to(countObj, {
          val: 100,
          duration: 0.56,
          ease: 'expo.inOut',
          onUpdate: () => {
            counterEl.textContent = String(Math.round(countObj.val)).padStart(2, '0') + '%';
          }
        }, 0.08);
      }

      if (preloaderCard) {
        tl.to(preloaderCard, {
          y: -18,
          scale: 0.95,
          opacity: 0,
          duration: 0.26,
          ease: 'power2.in'
        }, 0.64);
      }

      tl.to(preloader, {
        yPercent: -103,
        duration: 0.6,
        ease: 'expo.inOut'
      }, 0.68);

      // Coreografia do cabeçalho simultânea à abertura da cortina
      if (headerEl) {
        tl.fromTo(headerEl,
          { y: -24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.52, ease: 'expo.out', clearProps: 'transform,opacity' },
          0.78
        );
      }

      initReveals(0.74);
    } else {
      if (preloader) preloader.style.display = 'none';
      if (headerEl) {
        gsap.fromTo(headerEl,
          { y: -14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.44, ease: 'power3.out', clearProps: 'transform,opacity' }
        );
      }
      initReveals(0.04);
    }
  }

  /* =========================================================================
     2. INTERCEPTADOR DE NAVEGAÇÃO COM PREFETCH & FEEDBACK CONTEXTUAL
     ========================================================================= */
  function setupPageTransitionLinks() {
    if (prefersReducedMotion) return;

    const primaryLayer = document.getElementById('tbCurtainPrimary');
    const secondaryLayer = document.getElementById('tbCurtainSecondary');
    const backdropEl = document.getElementById('tbTransitionBackdrop');
    const contentBadge = document.getElementById('tbTransitionContent');
    const topProgress = document.getElementById('tbTopProgressBar');
    const mainEl = document.querySelector('main');
    if (!primaryLayer || !secondaryLayer) return;

    let isNavigating = false;
    const prefetchedUrls = new Set();

    const triggerPrefetch = (e) => {
      const link = e.target.closest('a');
      if (!link || !link.href) return;
      try {
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname.startsWith('/api/')) return;
        if (prefetchedUrls.has(url.href)) return;
        prefetchedUrls.add(url.href);

        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = url.href;
        document.head.appendChild(prefetchLink);
      } catch {}
    };

    document.addEventListener('mouseover', triggerPrefetch, { passive: true });
    document.addEventListener('touchstart', triggerPrefetch, { passive: true });

    document.addEventListener('click', (e) => {
      if (isNavigating) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.includes('/export') ||
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
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
        return;
      }
      if (targetUrl.href === window.location.href) return;

      e.preventDefault();
      isNavigating = true;

      const meta = resolveDestinationMeta(targetUrl, link);
      applyTransitionMeta(meta);

      try {
        sessionStorage.setItem('tb_page_enter', '1');
        sessionStorage.setItem('tb_preloader_seen', '1');
        sessionStorage.setItem('tb_page_label', meta.label);
        sessionStorage.setItem('tb_page_icon', meta.icon);
      } catch {}

      gsap.set([primaryLayer, secondaryLayer], { yPercent: 104, y: 0 });
      if (backdropEl) gsap.set(backdropEl, { opacity: 0 });
      if (contentBadge) gsap.set(contentBadge, { opacity: 0, y: 14, scale: 0.95 });
      if (topProgress) gsap.set(topProgress, { opacity: 1, scaleX: 0 });

      const exitTl = gsap.timeline({
        onComplete: () => {
          window.location.href = targetUrl.href;
        }
      });

      if (topProgress) {
        exitTl.to(topProgress, {
          scaleX: 0.72,
          duration: 0.34,
          ease: 'power3.out'
        }, 0);
      }

      if (backdropEl) {
        exitTl.to(backdropEl, {
          opacity: 1,
          duration: 0.26,
          ease: 'power2.out'
        }, 0);
      }

      if (mainEl) {
        exitTl.to(mainEl, {
          y: -14,
          scale: 0.985,
          opacity: 0.45,
          duration: 0.32,
          ease: 'power2.inOut',
          transformOrigin: 'center top'
        }, 0);
      }

      exitTl.to(primaryLayer, {
        yPercent: 0,
        duration: 0.34,
        ease: 'expo.inOut'
      }, 0.02)
      .to(secondaryLayer, {
        yPercent: 0,
        duration: 0.38,
        ease: 'expo.inOut'
      }, 0.06);

      if (contentBadge) {
        exitTl.to(contentBadge, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          ease: 'back.out(1.5)'
        }, 0.16);
      }
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        isNavigating = false;
        document.documentElement.classList.remove('tb-is-transitioning');
        gsap.set([primaryLayer, secondaryLayer], { yPercent: 104 });
        if (backdropEl) gsap.set(backdropEl, { opacity: 0 });
        if (topProgress) gsap.set(topProgress, { opacity: 0, scaleX: 0 });
        if (mainEl) gsap.set(mainEl, { clearProps: 'transform,opacity' });
      }
    });
  }

  /* =========================================================================
     3. COREOGRAFIA DE ENTRADA GSAP [data-ix-reveal]
     ========================================================================= */
  function splitWordsIntoMasks(el) {
    if (el.dataset.ixSplitDone === '1') {
      return el.querySelectorAll('.ix-word');
    }
    el.dataset.ixSplitDone = '1';

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
    // A. Títulos com revelação de palavras em 3D suave (data-ix-reveal="words")
    document.querySelectorAll('[data-ix-reveal="words"]').forEach((el) => {
      const words = splitWordsIntoMasks(el);
      if (!words.length) return;
      const isLoadTrigger = el.getAttribute('data-ix-trigger') === 'load';
      const extraDelay = parseFloat(el.getAttribute('data-ix-delay') || '0');

      const vars = {
        yPercent: 115,
        rotateZ: 2.2,
        opacity: 0,
        duration: 0.72,
        stagger: 0.032,
        ease: 'expo.out',
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

    // B. Revelação de Imagens com Clip-Path de Cortina & Zoom Out (data-ix-reveal="image")
    document.querySelectorAll('[data-ix-reveal="image"]').forEach((wrap) => {
      const img = wrap.querySelector('img');
      const badges = wrap.querySelectorAll('[data-parallax-depth]');
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

      tl.fromTo(wrap,
        {
          y: 28,
          opacity: 0,
          scale: 0.96,
          clipPath: 'inset(12% 4% 12% 4% round 24px)'
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          clipPath: 'inset(0% 0% 0% 0% round 24px)',
          duration: 0.88,
          ease: 'expo.out',
          clearProps: 'transform,opacity,clipPath'
        },
        startAt
      );

      if (img) {
        tl.fromTo(img,
          { scale: 1.14 },
          {
            scale: 1,
            duration: 1.15,
            ease: 'expo.out',
            clearProps: 'transform'
          },
          startAt
        );
      }

      if (badges.length) {
        tl.from(badges, {
          y: 12,
          scale: 0.85,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.7)',
          clearProps: 'transform,opacity'
        }, startAt + 0.26);
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
        y: 28,
        opacity: 0,
        scale: 0.96,
        duration: 0.62,
        stagger: 0.06,
        ease: 'expo.out',
        clearProps: 'transform,opacity'
      };

      if (isLoad) {
        vars.delay = baseDelay + 0.1;
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
        y: 20,
        opacity: 0,
        duration: 0.58,
        ease: 'expo.out',
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

    // E. Desenho de Traço Vetorial nos Ícones SVG Animados (.anim-svg-icon)
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

    // F. Flutuação Contínua Suave nos Badges do Hero (Ambient Float)
    const floatingBadges = document.querySelectorAll('[data-parallax-scene] [data-parallax-depth]');
    if (floatingBadges.length && !prefersReducedMotion) {
      floatingBadges.forEach((badge, i) => {
        gsap.to(badge, {
          y: i % 2 === 0 ? -4 : 4,
          duration: 2.4 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: baseDelay + 0.8
        });
      });
    }
  }

  /* =========================================================================
     4. PARALLAX SUAVE & BOTÕES MAGNÉTICOS NO DESKTOP
     ========================================================================= */
  function initHeroParallax() {
    if (prefersReducedMotion || !isFinePointer) return;
    const scene = document.querySelector('[data-parallax-scene]');
    if (scene) {
      const layers = scene.querySelectorAll('[data-parallax-depth]');
      if (layers.length) {
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
    }

    // Efeito Magnético Suave nos Botões Principais (btn-rose-glow)
    document.querySelectorAll('.btn-rose-glow').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
        xTo(dx);
        yTo(dy);
      });

      btn.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
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
