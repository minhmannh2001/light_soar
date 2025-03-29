import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface ConfigPanelProps {
  config: {
    name: string;
    description: string;
    timeoutSec: number;
    delaySec: number;
    histRetentionDays: number;
  };
  onConfigChange: (field: string, value: any) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Workflow Configuration</Typography>
      <Stack spacing={2}>
        <Tooltip title="The name of the DAG (optional, defaults to filename)">
          <TextField
            fullWidth
            label="Name"
            value={config.name}
            onChange={(e) => onConfigChange('name', e.target.value)}
            size="small"
          />
        </Tooltip>

        <Tooltip title="Brief description of the DAG">
          <TextField
            fullWidth
            label="Description"
            value={config.description}
            onChange={(e) => onConfigChange('description', e.target.value)}
            multiline
            rows={2}
            size="small"
          />
        </Tooltip>

        <Tooltip title="DAG timeout in seconds">
          <TextField
            fullWidth
            label="Execution Timeout (seconds)"
            type="number"
            value={config.timeoutSec}
            onChange={(e) => onConfigChange('timeoutSec', parseInt(e.target.value))}
            size="small"
          />
        </Tooltip>

        <Tooltip title="Delay between steps in seconds">
          <TextField
            fullWidth
            label="Delay Between Steps (seconds)"
            type="number"
            value={config.delaySec}
            onChange={(e) => onConfigChange('delaySec', parseInt(e.target.value))}
            size="small"
          />
        </Tooltip>

        <Tooltip title="Number of days to keep execution history">
          <TextField
            fullWidth
            label="History Retention (days)"
            type="number"
            value={config.histRetentionDays}
            onChange={(e) => onConfigChange('histRetentionDays', parseInt(e.target.value))}
            size="small"
          />
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default ConfigPanel; 