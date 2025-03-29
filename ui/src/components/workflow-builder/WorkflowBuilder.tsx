import React from 'react';
import { Box, Paper } from '@mui/material';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import ConfigPanel from './ConfigPanel';

const WorkflowBuilder: React.FC = () => {
  const [config, setConfig] = React.useState({
    name: '',
    description: '',
    timeoutSec: 3600,
    delaySec: 0,
    histRetentionDays: 30
  });

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 250px)', // Adjusted to account for parent padding/margins
      overflow: 'hidden'
    }}>
      {/* Left side - Workflow Canvas */}
      <Box sx={{
        flex: '1 1 80%',
        height: '100%',
        bgcolor: 'background.default'
      }}>
        <ReactFlow>
          {/* React Flow content will go here */}
        </ReactFlow>
      </Box>

      {/* Right side - Configuration Panel */}
      <Paper sx={{
        flex: '0 0 20%',
        height: '100%',
        overflow: 'auto'
      }}>
        <ConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
        />
      </Paper>
    </Box>
  );
};

export default WorkflowBuilder; 