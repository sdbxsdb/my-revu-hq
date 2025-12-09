import { Skeleton, Stack, SimpleGrid } from '@mantine/core';
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
            <Skeleton height={60} className="w-full" />
            <Skeleton height={100} className="w-full" />
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

