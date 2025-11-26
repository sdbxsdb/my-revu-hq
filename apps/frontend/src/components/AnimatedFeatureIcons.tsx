import { useSpring, animated, useSpringValue, config } from '@react-spring/web';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import {
  IconMessageCircle,
  IconUsers,
  IconClock,
  IconLink,
  IconChartBar,
  IconCheck,
  IconSend,
} from '@tabler/icons-react';

// 1. SMS Requests - Message bubble appears → sends → delivered
export const AnimatedSMSIcon = ({ delay = 0 }: { delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const progress = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await progress.start({
        from: 0,
        to: 1,
        config: { duration: 2500, easing: (t: number) => t * (2 - t) }, // ease out quad
      });
      progress.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - 2500));
      animate();
    };
    animate();
  }, [inView, progress, delay]);

  return (
    <div ref={ref} className="relative w-[32px] h-[32px]">
      <animated.div
        style={{
          opacity: progress.to([0, 0.2, 0.4, 1], [1, 1, 0, 0]),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconMessageCircle size={32} className="text-teal-400" />
      </animated.div>
      <animated.div
        style={{
          opacity: progress.to([0, 0.3, 0.5, 0.7, 1], [0, 1, 1, 0, 0]),
          transform: progress.to((v) => `translateX(${v * 15}px) translateY(${-v * 15}px)`),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconSend size={28} className="text-blue-400" />
      </animated.div>
      <animated.div
        style={{
          opacity: progress.to([0, 0.6, 0.8, 1], [0, 0, 1, 1]),
          transform: progress.to([0, 0.6, 0.8, 1], [
            'scale(0.3)',
            'scale(0.3)',
            'scale(1.2)',
            'scale(1)',
          ]),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconCheck size={32} className="text-green-400" strokeWidth={3} />
      </animated.div>
    </div>
  );
};

// 2. Manage Customers - Person icons fill in gradually
export const AnimatedCustomersIcon = ({ delay = 0 }: { delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const fillProgress = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await fillProgress.start({
        from: 0,
        to: 1,
        config: { duration: 2500, easing: (t: number) => t * (2 - t) }, // ease out quad
      });
      fillProgress.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - 2500));
      animate();
    };
    animate();
  }, [inView, fillProgress, delay]);

  return (
    <div ref={ref} className="relative w-[32px] h-[32px] flex items-center justify-center">
      <IconUsers size={32} className="text-teal-400/20" />
      <animated.div
        style={{
          position: 'absolute',
          clipPath: fillProgress.to((v) => `inset(${100 - v * 100}% 0 0 0)`),
        }}
      >
        <IconUsers size={32} className="text-teal-400" />
      </animated.div>
    </div>
  );
};

// 3. Schedule SMS - Clock → send icon → checkmark (scheduled message process)
export const AnimatedClockIcon = ({ delay = 0 }: { delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const progress = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await progress.start({
        from: 0,
        to: 1,
        config: { duration: 2500, easing: (t: number) => t * (2 - t) }, // ease out quad
      });
      progress.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - 2500));
      animate();
    };
    animate();
  }, [inView, progress, delay]);

  return (
    <div ref={ref} className="relative w-[32px] h-[32px]">
      {/* Clock - visible at start, fades out */}
      <animated.div
        style={{
          opacity: progress.to([0, 0.25, 0.35, 1], [1, 1, 0, 0]),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconClock size={32} className="text-teal-400" />
      </animated.div>
      {/* Send icon - appears in middle, moves up-right */}
      <animated.div
        style={{
          opacity: progress.to([0, 0.35, 0.5, 0.65, 1], [0, 1, 1, 0, 0]),
          transform: progress.to((v) => `translateX(${v * 15}px) translateY(${-v * 15}px)`),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconSend size={28} className="text-blue-400" />
      </animated.div>
      {/* Checkmark - appears at end */}
      <animated.div
        style={{
          opacity: progress.to([0, 0.65, 0.8, 1], [0, 0, 1, 1]),
          transform: progress.to([0, 0.65, 0.8, 1], [
            'scale(0.3)',
            'scale(0.3)',
            'scale(1.2)',
            'scale(1)',
          ]),
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <IconCheck size={32} className="text-green-400" strokeWidth={3} />
      </animated.div>
    </div>
  );
};

// 4. Multiple Platforms - Links appear in sequence
export const AnimatedPlatformsIcon = ({ delay = 0 }: { delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const link1 = useSpringValue(0);
  const link2 = useSpringValue(0);
  const link3 = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await link1.start({ from: 0, to: 1, config: { duration: 667, tension: 180, friction: 12, easing: (t: number) => t * (2 - t) } });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await link2.start({ from: 0, to: 1, config: { duration: 667, tension: 180, friction: 12, easing: (t: number) => t * (2 - t) } });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await link3.start({ from: 0, to: 1, config: { duration: 666, tension: 180, friction: 12, easing: (t: number) => t * (2 - t) } });
      link1.set(0);
      link2.set(0);
      link3.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      const animationTime = 667 + 667 + 666 + 250 * 2; // Total animation time = 2500ms
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - animationTime));
      animate();
    };
    animate();
  }, [inView, link1, link2, link3, delay]);

  const getLinkStyle = (value: any) => ({
    opacity: value,
    transform: value.to((v: number) => `scale(${v})`),
  });

  return (
    <div ref={ref} className="relative w-[32px] h-[32px] flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <animated.div style={getLinkStyle(link1)} className="absolute -left-1 -top-1">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
        </animated.div>
        <animated.div style={getLinkStyle(link2)} className="absolute right-0 top-1">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
        </animated.div>
        <animated.div style={getLinkStyle(link3)} className="absolute -bottom-1 left-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </animated.div>
        <IconLink size={32} className="text-teal-400" />
      </div>
    </div>
  );
};

// 5. Simple Pricing - Currency symbol scales with checkmarks
export const AnimatedPricingIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const scale = useSpringValue(1);
  const check1 = useSpringValue(0);
  const check2 = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      // Currency symbol pulses
      await scale.start({ from: 1, to: 1.15, config: { duration: 500, easing: (t: number) => t * (2 - t) } });
      await scale.start({ from: 1.15, to: 1, config: { duration: 500, easing: (t: number) => t * (2 - t) } });
      
      // Checkmarks appear
      await new Promise((resolve) => setTimeout(resolve, 250));
      await check1.start({ from: 0, to: 1, config: { duration: 500, easing: (t: number) => t * (2 - t) } });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await check2.start({ from: 0, to: 1, config: { duration: 500, easing: (t: number) => t * (2 - t) } });
      
      check1.set(0);
      check2.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      const animationTime = 500 * 4 + 250 * 2; // Total animation time = 2500ms
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - animationTime));
      animate();
    };
    animate();
  }, [inView, scale, check1, check2, delay]);

  return (
    <div ref={ref} className="relative w-[32px] h-[32px] flex items-center justify-center">
      <animated.div style={{ transform: scale.to((s) => `scale(${s})`) }}>
        {children}
      </animated.div>
      <animated.div
        style={{
          opacity: check1,
          transform: check1.to((v) => `scale(${v})`),
        }}
        className="absolute -top-1 -right-1"
      >
        <IconCheck size={14} className="text-green-400" strokeWidth={3} />
      </animated.div>
      <animated.div
        style={{
          opacity: check2,
          transform: check2.to((v) => `scale(${v})`),
        }}
        className="absolute -bottom-1 -right-1"
      >
        <IconCheck size={14} className="text-green-400" strokeWidth={3} />
      </animated.div>
    </div>
  );
};

// 6. Track Analytics - Bar chart bars grow
export const AnimatedAnalyticsIcon = ({ delay = 0 }: { delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const bar1 = useSpringValue(0);
  const bar2 = useSpringValue(0);
  const bar3 = useSpringValue(0);

  useEffect(() => {
    if (!inView) return;

    const TOTAL_CYCLE = 25000; // 6 animations × 2.5s + 10s pause
    
    const animate = async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await bar1.start({ from: 0, to: 1, config: { duration: 667, easing: (t: number) => t * (2 - t) } });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await bar2.start({ from: 0, to: 1, config: { duration: 750, easing: (t: number) => t * (2 - t) } });
      await new Promise((resolve) => setTimeout(resolve, 250));
      await bar3.start({ from: 0, to: 1, config: { duration: 583, easing: (t: number) => t * (2 - t) } });
      bar1.set(0);
      bar2.set(0);
      bar3.set(0);
      // Wait for the full cycle before looping (maintaining the stagger)
      const animationTime = 667 + 750 + 583 + 250 * 2; // Total animation time = 2500ms
      await new Promise((resolve) => setTimeout(resolve, TOTAL_CYCLE - animationTime));
      animate();
    };
    animate();
  }, [inView, bar1, bar2, bar3, delay]);

  return (
    <div ref={ref} className="relative w-[32px] h-[32px] flex items-center justify-center">
      <IconChartBar size={32} className="text-teal-400/20" />
      <div className="absolute inset-0 flex items-end justify-center gap-[3px] pb-[6px]">
        <animated.div
          style={{
            height: bar1.to((v) => `${v * 12}px`),
          }}
          className="w-[4px] bg-teal-400 rounded-t"
        />
        <animated.div
          style={{
            height: bar2.to((v) => `${v * 18}px`),
          }}
          className="w-[4px] bg-teal-400 rounded-t"
        />
        <animated.div
          style={{
            height: bar3.to((v) => `${v * 15}px`),
          }}
          className="w-[4px] bg-teal-400 rounded-t"
        />
      </div>
    </div>
  );
};

