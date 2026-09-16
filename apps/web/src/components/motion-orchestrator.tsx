'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function MotionOrchestrator() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      gsap.set('.reveal-up, .site-nav, .phantom-number, .motion-card', {
        clearProps: 'all',
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const cleanups: Array<() => void> = [];
    const context = gsap.context(() => {
      gsap.fromTo(
        '.site-nav',
        { autoAlpha: 0, y: -32 },
        { autoAlpha: 1, y: 0, duration: 0.85, ease: 'expo.out' },
      );

      gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((element, index) => {
        const animation = gsap.fromTo(
          element,
          { autoAlpha: 0, filter: 'blur(14px)', y: 64 },
          {
            autoAlpha: 1,
            delay: Math.min(index * 0.06, 0.24),
            duration: 1.05,
            ease: 'power4.out',
            filter: 'blur(0px)',
            paused: true,
            y: 0,
          },
        );

        ScrollTrigger.create({
          animation,
          once: true,
          start: 'top 88%',
          trigger: element,
        });
      });

      gsap.utils.toArray<HTMLElement>('.phantom-number').forEach((number) => {
        gsap.fromTo(
          number,
          { yPercent: -18 },
          {
            ease: 'none',
            scrollTrigger: {
              end: 'bottom top',
              scrub: 0.8,
              start: 'top bottom',
              trigger: number.closest('.group') ?? number,
            },
            yPercent: 22,
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('.motion-card').forEach((card) => {
        const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power3.out' });
        const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power3.out' });
        const scaleX = gsap.quickTo(card, 'scaleX', { duration: 0.35, ease: 'power3.out' });
        const scaleY = gsap.quickTo(card, 'scaleY', { duration: 0.35, ease: 'power3.out' });

        gsap.set(card, { transformPerspective: 900, transformStyle: 'preserve-3d' });

        const onPointerMove = (event: PointerEvent) => {
          const bounds = card.getBoundingClientRect();
          rotateY(((event.clientX - bounds.left) / bounds.width - 0.5) * 8);
          rotateX(-((event.clientY - bounds.top) / bounds.height - 0.5) * 8);
          scaleX(1.012);
          scaleY(1.012);
        };
        const onPointerLeave = () => {
          rotateX(0);
          rotateY(0);
          scaleX(1);
          scaleY(1);
        };

        card.addEventListener('pointermove', onPointerMove);
        card.addEventListener('pointerleave', onPointerLeave);
        cleanups.push(() => {
          card.removeEventListener('pointermove', onPointerMove);
          card.removeEventListener('pointerleave', onPointerLeave);
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-slot="button"]').forEach((button) => {
        const moveX = gsap.quickTo(button, 'x', { duration: 0.35, ease: 'power3.out' });
        const moveY = gsap.quickTo(button, 'y', { duration: 0.35, ease: 'power3.out' });

        const onPointerMove = (event: PointerEvent) => {
          const bounds = button.getBoundingClientRect();
          moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 7);
          moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 7);
        };
        const onPointerLeave = () => {
          moveX(0);
          moveY(0);
        };

        button.addEventListener('pointermove', onPointerMove);
        button.addEventListener('pointerleave', onPointerLeave);
        cleanups.push(() => {
          button.removeEventListener('pointermove', onPointerMove);
          button.removeEventListener('pointerleave', onPointerLeave);
        });
      });

      gsap.to('.aurora-orb-purple', {
        duration: 10,
        ease: 'sine.inOut',
        repeat: -1,
        rotation: 18,
        scale: 1.28,
        x: '16vw',
        y: '12vh',
        yoyo: true,
      });
      gsap.to('.aurora-orb-cyan', {
        duration: 13,
        ease: 'sine.inOut',
        repeat: -1,
        rotation: -14,
        scale: 1.2,
        x: '-14vw',
        y: '-10vh',
        yoyo: true,
      });

      const auroraX = gsap.quickTo('.motion-aurora', 'xPercent', {
        duration: 1.8,
        ease: 'power3.out',
      });
      const auroraY = gsap.quickTo('.motion-aurora', 'yPercent', {
        duration: 1.8,
        ease: 'power3.out',
      });
      const onWindowPointerMove = (event: PointerEvent) => {
        auroraX((event.clientX / window.innerWidth - 0.5) * 3);
        auroraY((event.clientY / window.innerHeight - 0.5) * 3);
      };

      window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onWindowPointerMove));
    });

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(refreshTimer);
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, [pathname]);

  return (
    <div aria-hidden className="motion-aurora">
      <div className="aurora-orb aurora-orb-purple" />
      <div className="aurora-orb aurora-orb-cyan" />
      <div className="aurora-noise" />
    </div>
  );
}
