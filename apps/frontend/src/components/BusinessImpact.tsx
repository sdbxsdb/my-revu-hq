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
          The Numbers That Matter
        </Title>
        <Text size="sm" className="text-gray-400 max-w-2xl mx-auto">
          Real data showing why automated review requests transform your business
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" className="mb-6">
        <ImpactCard
          icon={<IconStar size={48} />}
          stat="10x"
          description="More reviews collected when you consistently ask every customer—most businesses forget to ask"
          delay={0}
        />

        <ImpactCard
          icon={<IconTrendingUp size={48} />}
          stat="+45%"
          description="Potential revenue increase from improving your rating to 5 stars with more positive reviews"
          delay={100}
        />

        <ImpactCard
          icon={<IconUsers size={48} />}
          stat="3x"
          description="More customer clicks and inquiries for businesses with 10+ reviews vs those with few or none"
          delay={200}
        />

        <ImpactCard
          icon={<IconClock size={48} />}
          stat="98%"
          description="SMS open rate within 3 minutes—the fastest way to reach customers when satisfaction is highest"
          delay={300}
        />
      </SimpleGrid>

      <Paper p="md" className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-700/30">
        <Text size="sm" className="text-center text-gray-200 leading-relaxed">
          <span className="font-semibold text-teal-300">Here's Why It Works:</span> Most businesses
          rely on customers remembering to leave reviews—but the best performers systematically ask
          every time. MyRevuHQ makes it effortless to send review requests the moment the job is
          done. More reviews mean more customers choosing you.
        </Text>
      </Paper>
    </Paper>
  );
};

