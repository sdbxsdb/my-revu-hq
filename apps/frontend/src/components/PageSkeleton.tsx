import { Skeleton, Stack, SimpleGrid, Paper } from '@mantine/core';
import { PageContainer } from './PageContainer';

interface PageSkeletonProps {
  variant?: 'default' | 'dashboard' | 'table' | 'form';
  rows?: number;
}

/**
 * Reusable full-width page skeleton component for loading states.
 * Ensures skeletons fill the full width of the page container.
 */
export const PageSkeleton = ({ variant = 'default', rows = 3 }: PageSkeletonProps) => {
  return (
    <PageContainer>
      <Stack gap="lg" className="lg:flex-1 w-full">
        {variant === 'dashboard' ? (
          <>
            <Skeleton height={120} className="w-full" />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} className="w-full">
              <Skeleton height={150} className="w-full" />
              <Skeleton height={150} className="w-full" />
              <Skeleton height={150} className="w-full" />
            </SimpleGrid>
          </>
        ) : variant === 'table' ? (
          <>
            <Skeleton height={40} className="w-full" />
            <Skeleton height={300} className="w-full" />
          </>
        ) : variant === 'form' ? (
          <>
            <Skeleton height={40} className="w-full" />
            <Skeleton height={60} className="w-full" />
            <Paper shadow="sm" p="md" className="bg-[#2a2a2a]/50 border border-[#2a2a2a] w-full max-w-full">
              <Stack gap="sm" className="w-full">
                <Skeleton height={24} className="w-full max-w-[60%]" />
                <Skeleton height={16} className="w-full max-w-[80%]" />
                <Skeleton height={40} className="w-full max-w-[40%]" />
                <Skeleton height={16} className="w-full" />
                <Skeleton height={16} className="w-full" />
                <Skeleton height={16} className="w-full max-w-[90%]" />
                <Skeleton height={40} className="w-full" />
              </Stack>
            </Paper>
          </>
        ) : (
          <>
            <Skeleton height={40} className="w-full" />
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} height={200} className="w-full" />
            ))}
          </>
        )}
      </Stack>
    </PageContainer>
  );
};

