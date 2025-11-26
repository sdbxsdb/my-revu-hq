import { Paper, Text, Title, SimpleGrid } from '@mantine/core';
import { IconTrendingUp, IconStar, IconUsers, IconMessageCircle } from '@tabler/icons-react';
import { useSpring, animated } from '@react-spring/web';
import { useInView } from 'react-intersection-observer';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  source: string;
  delay?: number;
}

const StatCard = ({ icon, value, suffix, label, source, delay = 0 }: StatCardProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  // Slide in animation
  const slideIn = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: inView ? 1 : 0, transform: inView ? 'translateY(0px)' : 'translateY(30px)' },
    delay: inView ? delay : 0,
    config: { mass: 1, tension: 80, friction: 26 },
  });

  // Count up animation
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: inView ? value : 0 },
    delay: inView ? delay + 200 : 0,
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return (
    <animated.div ref={ref} style={slideIn}>
      <Paper
        p="lg"
        className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30 h-full hover:border-teal-500/50 transition-colors duration-300"
      >
        <div className="flex flex-col items-center text-center h-full">
          <div className="mb-4 text-teal-400">{icon}</div>
          <div className="text-4xl sm:text-5xl font-bold text-white mb-3">
            <animated.span>
              {number.to((n) => {
                if (suffix === '%') {
                  return Math.floor(n).toString();
                } else if (suffix === 'x') {
                  return n.toFixed(0);
                } else {
                  return n.toFixed(0);
                }
              })}
            </animated.span>
            <span className="text-teal-400">{suffix}</span>
          </div>
          <Text size="sm" className="text-gray-300 font-medium mb-3">
            {label}
          </Text>
          <Text size="xs" className="text-gray-500 italic mt-auto">
            {source}
          </Text>
        </div>
      </Paper>
    </animated.div>
  );
};

export const ReviewImpactStats = () => {
  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <Title order={2} className="text-2xl sm:text-3xl font-bold mb-3 text-white">
          The Power of Reviews
        </Title>
        <Text size="sm" className="text-gray-400 max-w-2xl mx-auto">
          Real data showing the measurable impact of online reviews on business growth
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatCard
          icon={<IconUsers size={48} />}
          value={88}
          suffix="%"
          label="of consumers trust online reviews as much as personal recommendations"
          source="BrightLocal Consumer Review Survey"
          delay={0}
        />

        <StatCard
          icon={<IconTrendingUp size={48} />}
          value={9}
          suffix="%"
          label="revenue increase for every 1-star rating improvement"
          source="Harvard Business Review"
          delay={100}
        />

        <StatCard
          icon={<IconStar size={48} />}
          value={3}
          suffix="x"
          label="more clicks for businesses with 10+ reviews vs those without"
          source="Google Local Search Study"
          delay={200}
        />

        <StatCard
          icon={<IconMessageCircle size={48} />}
          value={98}
          suffix="%"
          label="of text messages are opened within 3 minutes of being sent"
          source="SMS Marketing Statistics"
          delay={300}
        />
      </SimpleGrid>

      {/* Additional context */}
      <Paper p="md" className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30 mt-6">
        <Text size="sm" className="text-center text-gray-200 leading-relaxed">
          <span className="font-semibold text-teal-300">The Bottom Line:</span> Reviews directly
          impact your bottom line. Businesses with strong online reputations generate significantly
          more revenue—and SMS is the fastest, most effective way to collect them.
        </Text>
      </Paper>
    </div>
  );
};

