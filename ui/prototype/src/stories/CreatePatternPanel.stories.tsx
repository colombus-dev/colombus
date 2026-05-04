import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { CreatePatternPanel } from '../app/components/CreatePatternPanel';
import { samplePatternName } from './storybookData';

const meta = {
  title: 'Editor/CreatePatternPanel',
  component: CreatePatternPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CreatePatternPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [patternName, setPatternName] = useState(samplePatternName);
    const [dslCode, setDslCode] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [hasActiveExecution, setHasActiveExecution] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleExecute = () => {
      setIsExecuting(true);
      setHasActiveExecution(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsExecuting(false);
      }, 1500);
    };

    const handleStop = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsExecuting(false);
      setHasActiveExecution(false);
    };

    return (
      <div className="p-5">
        <CreatePatternPanel
          patternName={patternName}
          dslCode={dslCode}
          onPatternNameChange={setPatternName}
          onDslCodeChange={setDslCode}
          onExecutePattern={handleExecute}
          onStopExecution={handleStop}
          isExecuting={isExecuting}
          hasActiveExecution={hasActiveExecution}
          onSavePattern={() => undefined}
        />
      </div>
    );
  },
};

export const Executing: Story = {
  render: () => {
    const [patternName, setPatternName] = useState('pattern loadData =');
    const [dslCode, setDslCode] = useState('# Loading data pipeline');

    return (
      <div className="p-5">
        <CreatePatternPanel
          patternName={patternName}
          dslCode={dslCode}
          onPatternNameChange={setPatternName}
          onDslCodeChange={setDslCode}
          onExecutePattern={() => undefined}
          onStopExecution={() => undefined}
          isExecuting={true}
          hasActiveExecution={true}
          onSavePattern={() => undefined}
        />
      </div>
    );
  },
};

export const ExecutionComplete: Story = {
  render: () => {
    const [patternName, setPatternName] = useState('pattern loadData =');
    const [dslCode, setDslCode] = useState('# Loading data pipeline');

    return (
      <div className="p-5">
        <CreatePatternPanel
          patternName={patternName}
          dslCode={dslCode}
          onPatternNameChange={setPatternName}
          onDslCodeChange={setDslCode}
          onExecutePattern={() => undefined}
          onStopExecution={() => undefined}
          isExecuting={false}
          hasActiveExecution={true}
          onSavePattern={() => undefined}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [patternName, setPatternName] = useState('');
    const [dslCode, setDslCode] = useState('');

    return (
      <div className="p-5">
        <CreatePatternPanel
          patternName={patternName}
          dslCode={dslCode}
          onPatternNameChange={setPatternName}
          onDslCodeChange={setDslCode}
          onExecutePattern={() => undefined}
          onStopExecution={() => undefined}
          isExecuting={false}
          hasActiveExecution={false}
          onSavePattern={() => undefined}
        />
      </div>
    );
  },
};