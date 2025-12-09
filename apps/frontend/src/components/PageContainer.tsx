import { Container, Paper } from '@mantine/core';
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Reusable page container component that provides consistent full-height layout
 * on desktop with proper padding and scrolling. Mobile styles remain unchanged.
 */
export const PageContainer = ({ children, size = 'lg' }: PageContainerProps) => {
  return (
    <Container
      size={size}
      py="md"
      className="px-xs sm:px-md lg:px-0 lg:py-0 lg:flex lg:flex-1 lg:flex-col lg:h-full lg:min-h-0 lg:w-full"
    >
      <Paper
        shadow="md"
        p="md"
        className="bg-[#1a1a1a] lg:flex lg:flex-1 lg:flex-col lg:h-full lg:min-h-0 lg:overflow-auto lg:p-10 lg:w-full"
      >
        {children}
      </Paper>
    </Container>
  );
};
