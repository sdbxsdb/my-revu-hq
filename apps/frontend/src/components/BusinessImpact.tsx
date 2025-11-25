import { Paper, Text, Title, SimpleGrid } from '@mantine/core';
import { IconTrendingUp, IconUsers, IconStar, IconClock } from '@tabler/icons-react';
import { useInView } from 'react-intersection-observer';
import { useSpring, animated } from '@react-spring/web';

interface ImpactCardProps {
  icon: React.ReactNode;
  stat: string;
  description: string;
  delay?: number;
}

const ImpactCard = ({ icon, stat, description, delay = 0 }: ImpactCardProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const slideIn = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: inView ? 1 : 0, transform: inView ? 'translateY(0px)' : 'translateY(30px)' },
    delay: inView ? delay : 0,
    config: { mass: 1, tension: 80, friction: 26 },
  });

  return (
    <animated.div ref={ref} style={slideIn}>
      <Paper p="lg" className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 border border-teal-700/30 h-full">
        <div className="flex flex-col items-center text-center h-full">
          <div className="mb-4 text-teal-400">{icon}</div>
          <Text className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {stat}
          </Text>
          <Text size="sm" className="text-gray-300">
            {description}
          </Text>
        </div>
      </Paper>
    </animated.div>
  );
};

export const BusinessImpact = () => {
  return (
    <Paper p="lg" className="bg-[#1a1a1a] border border-[#2a2a2a]">
      <div className="text-center mb-8">
        <Title order={3} className="text-xl font-bold mb-2 text-white">
          What Businesses Typically Achieve
        </Title>
        <Text size="sm" className="text-gray-400 max-w-2xl mx-auto">
          Real outcomes from businesses using automated SMS review requests
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" className="mb-6">
        <ImpactCard
          icon={<IconStar size={48} />}
          stat="3-5x"
          description="More reviews collected in the first 3 months compared to manual requests"
          delay={0}
        />

        <ImpactCard
          icon={<IconTrendingUp size={48} />}
          stat="+0.5★"
          description="Average rating improvement within 6 months from increased positive reviews"
          delay={100}
        />

        <ImpactCard
          icon={<IconUsers size={48} />}
          stat="15-25%"
          description="Increase in new customer inquiries from improved online reputation"
          delay={200}
        />

        <ImpactCard
          icon={<IconClock size={48} />}
          stat="5 hours"
          description="Average time saved per month by automating review requests"
          delay={300}
        />
      </SimpleGrid>

      <Paper p="md" className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30">
        <Text size="sm" className="text-center text-gray-200 leading-relaxed">
          <span className="font-semibold text-teal-300">The Simple Truth:</span> Businesses that
          consistently ask for reviews get more of them. With MyRevuHQ, every satisfied customer
          automatically receives a review request—so you never miss an opportunity to grow your
          reputation.
        </Text>
      </Paper>
    </Paper>
  );
};

