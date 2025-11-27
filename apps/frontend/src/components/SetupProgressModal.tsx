import { Modal, Stack, Text, Button, Progress, Group, Badge } from '@mantine/core';
import { IconCheck, IconArrowRight, IconHome } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface SetupProgressModalProps {
  opened: boolean;
  onClose: () => void;
  completedSteps: number;
  totalSteps: number;
  nextStepLabel?: string;
  nextStepPath?: string;
}

export const SetupProgressModal = ({
  opened,
  onClose,
  completedSteps,
  totalSteps,
  nextStepLabel,
  nextStepPath,
}: SetupProgressModalProps) => {
  const navigate = useNavigate();
  const progressPercent = (completedSteps / totalSteps) * 100;

  const handleNextStep = () => {
    if (nextStepPath) {
      navigate(nextStepPath);
    }
    onClose();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text className="text-white font-semibold text-lg">Setup Progress</Text>}
      centered
      styles={{
        content: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
        },
        header: {
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #2a2a2a',
        },
        body: {
          backgroundColor: '#1a1a1a',
        },
      }}
    >
      <Stack gap="md">
        <div className="text-center">
          <div className="inline-block p-3 bg-teal-500/20 rounded-full mb-3">
            <IconCheck size={32} className="text-teal-400" />
          </div>
          <Text className="text-white font-semibold mb-2 text-lg">
            Step Complete! 🎉
          </Text>
          <Badge color="teal" size="lg" variant="light" className="mb-3">
            {completedSteps} of {totalSteps} steps done
          </Badge>
        </div>

        <div>
          <Group justify="space-between" className="mb-1">
            <Text size="xs" className="text-gray-400">
              Setup Progress
            </Text>
            <Text size="xs" className="text-teal-400 font-semibold">
              {Math.round(progressPercent)}%
            </Text>
          </Group>
          <Progress value={progressPercent} color="teal" size="md" />
        </div>

        <Stack gap="xs">
          {nextStepLabel && nextStepPath && completedSteps < totalSteps && (
            <Button
              size="md"
              color="teal"
              rightSection={<IconArrowRight size={16} />}
              onClick={handleNextStep}
              fullWidth
            >
              {nextStepLabel}
            </Button>
          )}
          <Button
            size="md"
            variant="light"
            color="blue"
            leftSection={<IconHome size={16} />}
            onClick={handleBackToDashboard}
            fullWidth
          >
            Back to Dashboard
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

