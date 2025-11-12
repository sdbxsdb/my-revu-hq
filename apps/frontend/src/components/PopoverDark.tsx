import { Popover, PopoverProps } from '@mantine/core';
import { ReactNode } from 'react';

interface PopoverDarkProps extends Omit<PopoverProps, 'children'> {
  popoverTitle?: string;
  popoverContentList?: string[];
  children: ReactNode;
}

export const PopoverDark = ({
  popoverTitle,
  popoverContentList,
  children,
  ...props
}: PopoverDarkProps) => {
  return (
    <Popover
      shadow="md"
      position="bottom-start"
      withArrow
      {...props}
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown
        style={{
          backgroundColor: 'rgb(30 30 30)',
          border: '1px solid rgb(55 55 55)',
          color: 'rgb(255 255 255)',
        }}
      >
        {popoverTitle && (
          <div
            style={{
              fontWeight: 600,
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {popoverTitle}
          </div>
        )}
        {popoverContentList && (
          <div style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
            {popoverContentList.map((item, index) => (
              <div key={index}>{item}</div>
            ))}
          </div>
        )}
      </Popover.Dropdown>
    </Popover>
  );
};

