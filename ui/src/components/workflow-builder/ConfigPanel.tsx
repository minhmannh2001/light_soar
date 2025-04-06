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
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Switch,
  SxProps,
  Theme,
  Paper
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

interface ActionNodeConfig {
  // Basic Info
  name: string;              // Required
  description?: string;      // Optional description
  output?: string;          // Variable name to store output

  // Execution
  command?: string;         // Command to execute
  script?: string;          // Inline script content

  // Retry Settings
  retryPolicy?: {
    limit: number;          // Number of retry attempts
    intervalSec: number;    // Seconds between retries
  };

  // Error Handling
  continueOn?: {
    failure: boolean;       // Continue workflow on failure
    skipped: boolean;       // Continue if step is skipped
    exitCode: number[];     // Array of acceptable exit codes
    markSuccess: boolean;   // Mark as success despite failure
  };
}

interface ConditionConfig {
  condition: string;
}

interface PreconditionConfig {
  condition: string;
  expected?: string;
}

interface ConditionNodeConfig {
  name: string;
  nextNodes: {
    [nodeId: string]: {
      precondition: PreconditionConfig;
    };
  };
}

interface ConfigPanelProps {
  selectedNode: {
    id: string;
    type: string;
    data: any;
  } | null;
  workflowConfig: any;
  onWorkflowConfigChange: (field: string, value: any) => void;
  onNodeConfigChange: (field: string, value: any) => void;
  nodes: Array<any>;
  edges: Array<any>;
}

interface ActionConfigPanelProps {
  config: ActionNodeConfig;
  onChange: (field: string, value: any) => void;
}

const commonStyles: SxProps<Theme> = {
  p: 2
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  selectedNode,
  workflowConfig,
  onWorkflowConfigChange,
  onNodeConfigChange,
  nodes,
  edges
}) => {
  if (!selectedNode) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Workflow Configuration
        </Typography>
        <TextField
          fullWidth
          label="Name"
          value={workflowConfig.name}
          onChange={(e) => onWorkflowConfigChange('name', e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Description"
          value={workflowConfig.description}
          onChange={(e) => onWorkflowConfigChange('description', e.target.value)}
          sx={{ mb: 2 }}
        />
        {/* ... rest of workflow config ... */}
      </Box>
    );
  }

  switch (selectedNode.type) {
    case 'trigger':
      return (
        <Paper sx={{ height: '100%' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Trigger Configuration
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Trigger Type</InputLabel>
              <Select
                value={selectedNode.data.config.type}
                onChange={(e) => onNodeConfigChange('type', e.target.value)}
              >
                <MenuItem value="webhook">Webhook</MenuItem>
                <MenuItem value="schedule">Schedule</MenuItem>
              </Select>
            </FormControl>

            {selectedNode.data.config.type === 'schedule' && (
              <TextField
                fullWidth
                label="Cron Expression"
                value={selectedNode.data.config.schedule}
                onChange={(e) => onNodeConfigChange('schedule', e.target.value)}
                helperText="Enter cron expression (e.g., '0 0 * * *')"
              />
            )}

            {selectedNode.data.config.type === 'webhook' && (
              <TextField
                fullWidth
                label="Webhook URL"
                value="/api/workflow/trigger"
                disabled
              />
            )}
          </Box>
        </Paper>
      );

    case 'action':
      return (
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Action Configuration
            </Typography>

            <TextField
              fullWidth
              required
              label="Step Name"
              value={selectedNode.data.config?.name || ''}
              onChange={(e) => onNodeConfigChange('name', e.target.value)}
              error={!selectedNode.data.config?.name}
              helperText={!selectedNode.data.config?.name ? 'Step name is required' : ''}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={selectedNode.data.config?.description || ''}
              onChange={(e) => onNodeConfigChange('description', e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Output Variable"
              value={selectedNode.data.config?.output || ''}
              onChange={(e) => onNodeConfigChange('output', e.target.value)}
              helperText="Variable name to store step output"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Command"
              value={selectedNode.data.config?.command || ''}
              onChange={(e) => onNodeConfigChange('command', e.target.value)}
              helperText="Command to execute"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Script Content"
              value={selectedNode.data.config?.script || ''}
              onChange={(e) => onNodeConfigChange('script', e.target.value)}
              helperText="Inline script content"
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Retry Policy
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="number"
                  label="Retry Limit"
                  value={selectedNode.data.config?.retryPolicy?.limit ?? 2}
                  onChange={(e) => onNodeConfigChange('retryPolicy.limit', parseInt(e.target.value))}
                />
                <TextField
                  type="number"
                  label="Interval (sec)"
                  value={selectedNode.data.config?.retryPolicy?.intervalSec ?? 5}
                  onChange={(e) => onNodeConfigChange('retryPolicy.intervalSec', parseInt(e.target.value))}
                />
              </Box>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Continue On
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedNode.data.config?.continueOn?.failure || false}
                    onChange={(e) => onNodeConfigChange('continueOn.failure', e.target.checked)}
                  />
                }
                label="Continue on Failure"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedNode.data.config?.continueOn?.skipped || false}
                    onChange={(e) => onNodeConfigChange('continueOn.skipped', e.target.checked)}
                  />
                }
                label="Continue if Skipped"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedNode.data.config?.continueOn?.markSuccess || false}
                    onChange={(e) => onNodeConfigChange('continueOn.markSuccess', e.target.checked)}
                  />
                }
                label="Mark as Success"
              />
            </FormGroup>

            <TextField
              fullWidth
              label="Exit Codes"
              value={selectedNode.data.config?.continueOn?.exitCode?.join(', ') || ''}
              onChange={(e) => {
                const codes = e.target.value
                  .split(',')
                  .map(code => parseInt(code.trim()))
                  .filter(code => !isNaN(code));
                onNodeConfigChange('continueOn.exitCode', codes);
              }}
              helperText="Comma-separated list of acceptable exit codes"
            />
          </Box>
        </Paper>
      );

    case 'condition':
      const followingNodes = edges
        .filter(edge => edge.source === selectedNode.id)
        .map(edge => nodes.find(node => node.id === edge.target))
        .filter(Boolean);

      return (
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Condition Configuration
            </Typography>

            <TextField
              fullWidth
              required
              label="Condition Name"
              value={selectedNode.data.config?.name || ''}
              onChange={(e) => onNodeConfigChange('name', e.target.value)}
              sx={{ mb: 3 }}
            />

            {followingNodes.length > 0 ? (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Configure Conditions for Following Nodes
                </Typography>

                {followingNodes.map((node: any) => (
                  <Box
                    key={node.id}
                    sx={{
                      mb: 3,
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Node: {node.data.config?.name || node.id}
                    </Typography>

                    <TextField
                      fullWidth
                      required
                      label="Condition"
                      value={selectedNode.data.config?.nextNodes?.[node.id]?.precondition?.condition || ''}
                      onChange={(e) => onNodeConfigChange(
                        `nextNodes.${node.id}.precondition.condition`,
                        e.target.value
                      )}
                      helperText="Enter condition (e.g., $WEEKDAY, `date '+%d'`, or shell command)"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Expected Value (Optional)"
                      value={selectedNode.data.config?.nextNodes?.[node.id]?.precondition?.expected || ''}
                      onChange={(e) => onNodeConfigChange(
                        `nextNodes.${node.id}.precondition.expected`,
                        e.target.value
                      )}
                      helperText="Enter expected value (e.g., Friday, 01)"
                    />
                  </Box>
                ))}
              </>
            ) : (
              <Typography color="text.secondary">
                Connect this condition to other nodes to configure their preconditions
              </Typography>
            )}
          </Box>
        </Paper>
      );

    default:
      return (
        <Box sx={{ p: 2 }}>
          <Typography>Select a node to configure</Typography>
        </Box>
      );
  }
};

export default ConfigPanel; 