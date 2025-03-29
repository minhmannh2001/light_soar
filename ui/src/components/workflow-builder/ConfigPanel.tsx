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
  MenuItem,
  IconButton,
  Button,
  InputAdornment
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCopy } from '@fortawesome/free-solid-svg-icons';

interface WorkflowConfig {
  name: string;
  description: string;
  timeoutSec: number;
  delaySec: number;
  histRetentionDays: number;
}

interface TriggerConfig {
  type: 'webhook' | 'schedule';
  schedule?: string;
}

interface ActionConfig {
  command: string;
  workingDir: string;
}

interface ConditionConfig {
  condition: string;
}

interface ConfigPanelProps {
  selectedNode: {
    id: string;
    type: string;
    data: {
      label: string;
      type: string;
      config: any;
    };
  } | null;
  workflowConfig: WorkflowConfig;
  onWorkflowConfigChange: (field: string, value: any) => void;
  onNodeConfigChange: (field: string, value: any) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  selectedNode,
  workflowConfig,
  onWorkflowConfigChange,
  onNodeConfigChange
}) => {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    const { type, config } = selectedNode.data;

    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => onNodeConfigChange('back', null)} sx={{ mr: 1 }}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </IconButton>
          <Typography variant="h6">Node Configuration</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trigger Type
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              sx={{
                flex: 1,
                p: 1,
                border: '1px solid',
                borderColor: type === 'webhook' ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: type === 'webhook' ? 'primary.light' : 'transparent',
                color: type === 'webhook' ? 'primary.contrastText' : 'text.primary',
              }}
              onClick={() => onNodeConfigChange('type', 'webhook')}
            >
              <Typography variant="body2" align="center">Webhook</Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1,
                border: '1px solid',
                borderColor: type === 'schedule' ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: type === 'schedule' ? 'primary.light' : 'transparent',
                color: type === 'schedule' ? 'primary.contrastText' : 'text.primary',
              }}
              onClick={() => onNodeConfigChange('type', 'schedule')}
            >
              <Typography variant="body2" align="center">Schedule</Typography>
            </Box>
          </Box>
        </Box>

        {type === 'webhook' ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Webhook URL
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                value={`https://your-domain.com/api/webhook/${selectedNode.id}`}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <Tooltip title="Copy to clipboard">
                <IconButton onClick={() => handleCopyToClipboard(`https://your-domain.com/api/webhook/${selectedNode.id}`)}>
                  <FontAwesomeIcon icon={faCopy} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Schedule (Cron Expression)
            </Typography>
            <TextField
              fullWidth
              placeholder="*/5 * * * *"
              value={config.schedule || ''}
              onChange={(e) => onNodeConfigChange('schedule', e.target.value)}
              size="small"
              helperText="Example: */5 * * * * (every 5 minutes)"
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {selectedNode ? (
        renderNodeConfig()
      ) : (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Workflow Configuration
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Name
            </Typography>
            <TextField
              fullWidth
              value={workflowConfig.name}
              onChange={(e) => onWorkflowConfigChange('name', e.target.value)}
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={workflowConfig.description}
              onChange={(e) => onWorkflowConfigChange('description', e.target.value)}
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Execution Timeout (seconds)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={workflowConfig.timeoutSec}
              onChange={(e) => onWorkflowConfigChange('timeoutSec', parseInt(e.target.value))}
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Delay Between Steps (seconds)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={workflowConfig.delaySec}
              onChange={(e) => onWorkflowConfigChange('delaySec', parseInt(e.target.value))}
              size="small"
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              History Retention (days)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={workflowConfig.histRetentionDays}
              onChange={(e) => onWorkflowConfigChange('histRetentionDays', parseInt(e.target.value))}
              size="small"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConfigPanel; 