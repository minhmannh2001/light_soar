import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCopy } from '@fortawesome/free-solid-svg-icons';
import * as yaml from 'js-yaml';
import { SxProps, Theme } from '@mui/material/styles';
import { useConfig } from '../../contexts/ConfigContext';
import { AppBarContext } from '../../contexts/AppBarContext';

interface Parameter {
  name: string;
  defaultValue: string;
}

interface EnvironmentVariable {
  name: string;
  value: string;
}

interface WorkflowConfig {
  name: string;
  description: string;
  parameters: Parameter[];
  mailOn: {
    success: boolean;
    failure: boolean;
  };
  env: EnvironmentVariable[];
  isEditMode?: boolean; // Add this to track edit mode
}

interface TriggerConfig {
  type: 'webhook' | 'schedule';
  schedule?: string;
}

interface ActionNodeConfig {
  // Basic Info
  name: string; // Required
  description?: string; // Optional description
  output?: string; // Variable name to store output

  // Execution
  scriptType: 'bash' | 'python';
  pythonFile?: string;
  command?: string;
  script?: string;

  // Retry Settings
  retryPolicy?: {
    limit: number; // Number of retry attempts
    intervalSec: number; // Seconds between retries
  };

  // Error Handling
  continueOn?: {
    failure: boolean; // Continue workflow on failure
    skipped: boolean; // Continue if step is skipped
    markSuccess: boolean; // Mark as success despite failure
  };

  // Mail Notifications
  mailOn?: {
    failure: boolean;
    success: boolean;
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

interface SubDagNodeConfig {
  // Basic Info
  name: string;
  description?: string;
  run: string; // The sub-workflow to run
  params?: string; // Parameters to pass to the sub-workflow
  output?: string; // Variable name to store output

  // Retry Settings
  retryPolicy?: {
    limit: number;
    intervalSec: number;
  };

  // Error Handling
  continueOn?: {
    failure: boolean;
    skipped: boolean;
    markSuccess: boolean;
  };

  // Mail Notifications
  mailOn?: {
    failure: boolean;
    success: boolean;
  };
}

interface ConfigPanelProps {
  selectedNode: {
    id: string;
    type: string;
    data: any;
  } | null;
  workflowConfig: WorkflowConfig;
  onWorkflowConfigChange: (field: string, value: any) => void;
  onNodeConfigChange: (field: string, value: any) => void;
  nodes: Array<any>;
  edges: Array<any>;
  yamlContent?: string; // Add this to receive YAML content
  isEditMode?: boolean; // Add this to receive edit mode status
}

interface ActionConfigPanelProps {
  config: ActionNodeConfig;
  onChange: (field: string, value: any) => void;
}

interface PythonFile {
  name: string;
  content: string;
}

interface SubDagParameter {
  name: string;
  defaultValue: string;
}

const commonStyles: SxProps<Theme> = {
  p: 2,
};

const isValidName = (name: string): boolean => {
  return /^[^\s]+$/.test(name);
};

const isValidParamValue = (value: string): boolean => {
  // Allow strings and numbers (including decimals)
  return (
    /^[0-9]+(\.[0-9]+)?$/.test(value) ||
    /^".*"$/.test(value) ||
    /^'.*'$/.test(value)
  );
};

// Add a function to parse YAML parameters
const parseYamlParams = (
  yamlParams: Array<Record<string, any>>
): Parameter[] => {
  if (!yamlParams) return [];

  return yamlParams.map((param) => {
    const [name, value] = Object.entries(param)[0];
    let defaultValue = String(value);

    // If value is already a string with backticks, keep it as is
    if (!defaultValue.startsWith('`')) {
      // For numbers, keep as is
      if (typeof value === 'number') {
        defaultValue = String(value);
      } else {
        // For strings, add quotes
        defaultValue = `"${value}"`;
      }
    }

    return {
      name,
      defaultValue,
    };
  });
};

// Add a YAML parsing utility
const parseYamlConfig = (yamlContent: string): Partial<WorkflowConfig> => {
  try {
    const config = yaml.load(yamlContent) as any;

    // Parse environment variables
    let env: EnvironmentVariable[] = [];
    if (config.env) {
      if (Array.isArray(config.env)) {
        // Handle array of objects format: [{ KEY: "value" }, { KEY2: "value2" }]
        config.env.forEach((envVar: any) => {
          if (typeof envVar === 'object') {
            Object.entries(envVar).forEach(([name, value]) => {
              env.push({ name, value: String(value) });
            });
          }
        });
      } else if (typeof config.env === 'object') {
        // Handle object format: { KEY: "value", KEY2: "value2" }
        Object.entries(config.env).forEach(([name, value]) => {
          env.push({ name, value: String(value) });
        });
      }
    }

    return {
      description: config.description || '',
      parameters: parseYamlParams(config.params || []),
      mailOn: {
        success: config.mailOn?.success || false,
        failure: config.mailOn?.failure || false,
      },
      env: env,
    };
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return {};
  }
};

const ActionNodePanel: React.FC<{
  config: ActionNodeConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => {
  // Initialize scriptType if it's not set
  React.useEffect(() => {
    if (!config.scriptType) {
      onChange('scriptType', 'bash');
      onChange('command', 'bash');
    }
  }, []);

  const [pythonFiles, setPythonFiles] = React.useState<PythonFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchPythonFiles = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getConfig().apiURL}/python-files`);
      if (!response.ok) {
        throw new Error('Failed to fetch Python files');
      }
      const files = await response.json();
      setPythonFiles(files);
    } catch (error) {
      console.error('Error fetching Python files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (config.scriptType === 'python') {
      fetchPythonFiles();
    }
  }, [config.scriptType]);

  // Update script type handler
  const handleScriptTypeChange = (newType: 'bash' | 'python') => {
    onChange('scriptType', newType);
    if (newType === 'bash') {
      onChange('command', 'bash');
    } else if (newType === 'python') {
      onChange('command', 'python');
    }
    onChange('script', ''); // Clear script
    onChange('pythonFile', ''); // Clear selected Python file
  };

  // Handle script content change without modifying the command
  const handleScriptChange = (newScript: string) => {
    onChange('script', newScript);
    // Remove this line that was changing the command
    // onChange('command', newScript);
  };

  const handlePythonFileSelect = async (fileName: string) => {
    try {
      const response = await fetch(
        `${getConfig().apiURL}/python-files/${fileName}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch Python file content');
      }
      const data = await response.json();
      onChange('script', data.content);
      onChange('pythonFile', fileName);
    } catch (error) {
      console.error('Error fetching Python file content:', error);
    }
  };

  return (
    <>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Script Type</InputLabel>
        <Select
          value={config.scriptType || (config.command === 'bash' ? 'bash' : '')}
          onChange={(e) =>
            handleScriptTypeChange(e.target.value as 'bash' | 'python')
          }
          label="Script Type"
        >
          <MenuItem value="bash">Bash Script</MenuItem>
          <MenuItem value="python">Python Script</MenuItem>
        </Select>
      </FormControl>

      {config.scriptType === 'python' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Python File</InputLabel>
          <Select
            value={config.pythonFile || ''}
            onChange={(e) => handlePythonFileSelect(e.target.value)}
            label="Python File"
            disabled={isLoading}
          >
            {isLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              pythonFiles.map((file) => (
                <MenuItem key={file.name} value={file.name}>
                  {file.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}

      <TextField
        fullWidth
        multiline
        rows={6}
        label="Script Content"
        value={config.script || ''}
        onChange={(e) => handleScriptChange(e.target.value)}
        disabled={config.scriptType === 'python'} // Disable editing for Python files
        sx={{ mb: 2 }}
      />
    </>
  );
};

const EnvironmentVariablesEditor: React.FC<{
  env: EnvironmentVariable[];
  onChange: (env: EnvironmentVariable[]) => void;
}> = ({ env, onChange }) => {
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAddVariable = () => {
    if (newVarName.trim() === '') return;

    onChange([...env, { name: newVarName, value: newVarValue }]);
    setNewVarName('');
    setNewVarValue('');
  };

  const handleRemoveVariable = (index: number) => {
    const newEnv = [...env];
    newEnv.splice(index, 1);
    onChange(newEnv);
  };

  const handleUpdateVariable = (
    index: number,
    field: 'name' | 'value',
    value: string
  ) => {
    const newEnv = [...env];
    newEnv[index][field] = value;
    onChange(newEnv);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Environment Variables
      </Typography>

      <List dense>
        {env.map((variable, index) => (
          <ListItem
            key={index}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => handleRemoveVariable(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
              <TextField
                size="small"
                label="Name"
                value={variable.name}
                onChange={(e) =>
                  handleUpdateVariable(index, 'name', e.target.value)
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Value"
                value={variable.value}
                onChange={(e) =>
                  handleUpdateVariable(index, 'value', e.target.value)
                }
                sx={{ flex: 1 }}
              />
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
        <TextField
          size="small"
          label="Name"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Value"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddVariable}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

const SubDagNodePanel: React.FC<{
  config: SubDagNodeConfig;
  onChange: (field: string, value: any) => void;
}> = ({ config, onChange }) => {
  const appConfig = useConfig();
  const appBarContext = React.useContext(AppBarContext);
  const [isLoading, setIsLoading] = React.useState(false);
  const [dags, setDags] = React.useState<Array<any>>([]);
  const [subDagParameters, setSubDagParameters] = React.useState<
    SubDagParameter[]
  >([]);
  const [isLoadingParams, setIsLoadingParams] = React.useState(false);

  // Fetch available DAGs using the same API as the DAGs page
  const fetchDags = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Fix: Extract the DAG name correctly from the URL path
      const pathParts = window.location.pathname.split('/');
      const editIndex = pathParts.indexOf('edit');
      const currentDagName = editIndex > 0 ? pathParts[editIndex - 1] : '';

      const response = await fetch(
        `${
          appConfig.apiURL
        }/dags?page=1&limit=50&searchName=&searchTag=&remoteNode=${
          appBarContext.selectedRemoteNode || 'local'
        }`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch DAGs');
      }

      const data = await response.json();

      // Extract DAGs from the response and filter out the current DAG
      let availableDags: any[] = [];
      if (data && data.DAGs) {
        for (const val of data.DAGs) {
          if (!val.Error && val.DAG && val.DAG.Name !== currentDagName) {
            availableDags.push({
              name: val.DAG.Name,
              location: val.DAG.Location,
            });
          }
        }
      }

      setDags(availableDags);
    } catch (error) {
      console.error('Error fetching DAGs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [appConfig, appBarContext.selectedRemoteNode]);

  // Fetch parameters for the selected DAG
  const fetchDagParameters = React.useCallback(
    async (dagName: string) => {
      if (!dagName) return;

      try {
        setIsLoadingParams(true);
        const response = await fetch(
          `${appConfig.apiURL}/dags/${dagName}?tab=spec&remoteNode=${
            appBarContext.selectedRemoteNode || 'local'
          }`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch DAG details for ${dagName}`);
        }

        const data = await response.json();

        // Parse parameters from the DAG's YAML content
        if (data.Definition) {
          try {
            const dagConfig = yaml.load(data.Definition) as any;

            // Extract parameters from the DAG
            let parameters: SubDagParameter[] = [];

            if (dagConfig.params) {
              if (typeof dagConfig.params === 'string') {
                // Handle string format: "param1 param2"
                const paramNames = dagConfig.params.split(' ').filter(Boolean);
                parameters = paramNames.map((name) => ({
                  name,
                  defaultValue: '',
                }));
              } else if (Array.isArray(dagConfig.params)) {
                // Handle array format: [{ NAME: "value" }, { NAME2: "value2" }]
                parameters = dagConfig.params.map((param: any) => {
                  const [name, value] = Object.entries(param)[0];
                  return {
                    name: String(name),
                    defaultValue: String(value),
                  };
                });
              }
            }

            setSubDagParameters(parameters);

            // Update the params field with the current values
            updateParamsField(parameters);
          } catch (error) {
            console.error('Error parsing DAG YAML:', error);
          }
        }
      } catch (error) {
        console.error(`Error fetching DAG parameters for ${dagName}:`, error);
      } finally {
        setIsLoadingParams(false);
      }
    },
    [appConfig, appBarContext.selectedRemoteNode]
  );

  // Update the params field when parameters change
  const updateParamsField = (parameters: SubDagParameter[]) => {
    const paramsString = parameters
      .map((param) => `${param.name}=${param.defaultValue}`)
      .join(' ');

    onChange('params', paramsString);
  };

  // Handle parameter value change
  const handleParameterValueChange = (index: number, value: string) => {
    const updatedParams = [...subDagParameters];
    updatedParams[index].defaultValue = value;
    setSubDagParameters(updatedParams);
    updateParamsField(updatedParams);
  };

  // Effect to fetch DAGs on mount
  React.useEffect(() => {
    fetchDags();
  }, [fetchDags]);

  // Effect to fetch parameters when DAG selection changes
  React.useEffect(() => {
    if (config.run) {
      fetchDagParameters(config.run);
    } else {
      setSubDagParameters([]);
    }
  }, [config.run, fetchDagParameters]);

  return (
    <>
      <TextField
        fullWidth
        required
        label="Step Name"
        value={config.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        error={!config.name}
        helperText={!config.name ? 'Step name is required' : ''}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={config.description || ''}
        onChange={(e) => onChange('description', e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Sub Workflow</InputLabel>
        <Select
          value={config.run || ''}
          onChange={(e) => onChange('run', e.target.value)}
          label="Sub Workflow"
          disabled={isLoading}
        >
          {isLoading ? (
            <MenuItem disabled>Loading...</MenuItem>
          ) : dags.length > 0 ? (
            dags.map((dag) => (
              <MenuItem key={dag.location} value={dag.name}>
                {dag.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No DAGs available</MenuItem>
          )}
        </Select>
      </FormControl>

      {/* Parameters Table */}
      {config.run && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Parameters
          </Typography>

          {isLoadingParams ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : subDagParameters.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subDagParameters.map((param, index) => (
                    <TableRow key={`param-${param.name}-${index}`}>
                      <TableCell>
                        <Typography variant="body2">{param.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={param.defaultValue}
                          onChange={(e) =>
                            handleParameterValueChange(index, e.target.value)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No parameters defined in the selected workflow.
            </Typography>
          )}
        </>
      )}

      <TextField
        fullWidth
        label="Output Variable"
        value={config.output || ''}
        onChange={(e) => onChange('output', e.target.value)}
        helperText="Variable name to store output of this sub-workflow"
        sx={{ mb: 2 }}
      />

      {/* Retry Policy */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Retry Policy
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            type="number"
            label="Retry Limit"
            value={config.retryPolicy?.limit ?? 2}
            onChange={(e) =>
              onChange('retryPolicy.limit', parseInt(e.target.value))
            }
          />
          <TextField
            type="number"
            label="Interval (sec)"
            value={config.retryPolicy?.intervalSec ?? 5}
            onChange={(e) =>
              onChange('retryPolicy.intervalSec', parseInt(e.target.value))
            }
          />
        </Box>
      </Box>

      {/* Continue On */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Continue On
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={config.continueOn?.failure || false}
              onChange={(e) => onChange('continueOn.failure', e.target.checked)}
            />
          }
          label="Continue on Failure"
        />
        <FormControlLabel
          control={
            <Switch
              checked={config.continueOn?.skipped || false}
              onChange={(e) => onChange('continueOn.skipped', e.target.checked)}
            />
          }
          label="Continue if Skipped"
        />
        <FormControlLabel
          control={
            <Switch
              checked={config.continueOn?.markSuccess || false}
              onChange={(e) =>
                onChange('continueOn.markSuccess', e.target.checked)
              }
            />
          }
          label="Mark as Success"
        />
      </FormGroup>

      {/* Mail On */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Mail On
      </Typography>
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={config.mailOn?.success || false}
              onChange={(e) => onChange('mailOn.success', e.target.checked)}
            />
          }
          label="Success"
        />
        <FormControlLabel
          control={
            <Switch
              checked={config.mailOn?.failure || false}
              onChange={(e) => onChange('mailOn.failure', e.target.checked)}
            />
          }
          label="Failure"
        />
      </FormGroup>
    </>
  );
};

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  selectedNode,
  workflowConfig,
  onWorkflowConfigChange,
  onNodeConfigChange,
  nodes,
  edges,
  yamlContent,
  isEditMode,
}) => {
  // Add effect to load YAML content when switching to visual editor
  React.useEffect(() => {
    if (yamlContent) {
      const config = parseYamlConfig(yamlContent);

      // Update each field individually to maintain other existing values
      if (config.description !== undefined) {
        onWorkflowConfigChange('description', config.description);
      }
      if (config.parameters) {
        onWorkflowConfigChange('parameters', config.parameters);
      }
      if (config.mailOn) {
        onWorkflowConfigChange('mailOn', config.mailOn);
      }
    }
  }, [yamlContent]);

  if (!selectedNode) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Workflow Configuration
        </Typography>

        <TextField
          fullWidth
          required
          label="Name"
          value={workflowConfig.name}
          onChange={(e) => onWorkflowConfigChange('name', e.target.value)}
          error={
            workflowConfig.name !== '' && !isValidName(workflowConfig.name)
          }
          helperText={
            workflowConfig.name !== '' && !isValidName(workflowConfig.name)
              ? 'Name cannot contain spaces'
              : ''
          }
          disabled={isEditMode} // Disable name field in edit mode
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          label="Description"
          value={workflowConfig.description}
          onChange={(e) =>
            onWorkflowConfigChange('description', e.target.value)
          }
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Parameters
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Default Value</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(workflowConfig.parameters || []).map((param, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={param.name}
                      onChange={(e) => {
                        const newParams = [...workflowConfig.parameters];
                        newParams[index].name = e.target.value;
                        onWorkflowConfigChange('parameters', newParams);
                      }}
                      error={param.name !== '' && !isValidName(param.name)}
                      helperText={
                        param.name !== '' && !isValidName(param.name)
                          ? 'Name cannot contain spaces'
                          : ''
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={param.defaultValue}
                      onChange={(e) => {
                        const newParams = [...workflowConfig.parameters];
                        newParams[index].defaultValue = e.target.value;
                        onWorkflowConfigChange('parameters', newParams);
                      }}
                      error={
                        param.defaultValue !== '' &&
                        !isValidParamValue(param.defaultValue)
                      }
                      helperText={
                        param.defaultValue !== '' &&
                        !isValidParamValue(param.defaultValue)
                          ? 'Must be a number or quoted string'
                          : ''
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newParams = workflowConfig.parameters.filter(
                          (_, i) => i !== index
                        );
                        onWorkflowConfigChange('parameters', newParams);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            fullWidth
            onClick={() => {
              const newParams = [
                ...(workflowConfig.parameters || []),
                { name: '', defaultValue: '' },
              ];
              onWorkflowConfigChange('parameters', newParams);
            }}
            sx={{ mt: 1 }}
          >
            Add Parameter
          </Button>
        </TableContainer>

        {/* Environment Variables Section */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Environment Variables
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(workflowConfig.env || []).map((envVar, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={envVar.name}
                      onChange={(e) => {
                        const newEnv = [...workflowConfig.env];
                        newEnv[index].name = e.target.value;
                        onWorkflowConfigChange('env', newEnv);
                      }}
                      error={envVar.name !== '' && !isValidName(envVar.name)}
                      helperText={
                        envVar.name !== '' && !isValidName(envVar.name)
                          ? 'Name cannot contain spaces'
                          : ''
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={envVar.value}
                      onChange={(e) => {
                        const newEnv = [...workflowConfig.env];
                        newEnv[index].value = e.target.value;
                        onWorkflowConfigChange('env', newEnv);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newEnv = workflowConfig.env.filter(
                          (_, i) => i !== index
                        );
                        onWorkflowConfigChange('env', newEnv);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            fullWidth
            onClick={() => {
              const newEnv = [
                ...(workflowConfig.env || []),
                { name: '', value: '' },
              ];
              onWorkflowConfigChange('env', newEnv);
            }}
            sx={{ mt: 1 }}
          >
            Add Environment Variable
          </Button>
        </TableContainer>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Send Mail On
        </Typography>
        <FormGroup sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={workflowConfig.mailOn?.success || false}
                onChange={(e) =>
                  onWorkflowConfigChange('mailOn', {
                    ...workflowConfig.mailOn,
                    success: e.target.checked,
                  })
                }
              />
            }
            label="Success"
          />
          <FormControlLabel
            control={
              <Switch
                checked={workflowConfig.mailOn?.failure || false}
                onChange={(e) =>
                  onWorkflowConfigChange('mailOn', {
                    ...workflowConfig.mailOn,
                    failure: e.target.checked,
                  })
                }
              />
            }
            label="Failure"
          />
        </FormGroup>

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
              helperText={
                !selectedNode.data.config?.name ? 'Step name is required' : ''
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={selectedNode.data.config?.description || ''}
              onChange={(e) =>
                onNodeConfigChange('description', e.target.value)
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Output Variable"
              value={selectedNode.data.config?.output || ''}
              onChange={(e) => onNodeConfigChange('output', e.target.value)}
              helperText="Variable name to store output of this action"
              sx={{ mb: 2 }}
            />

            <ActionNodePanel
              config={selectedNode.data.config || {}}
              onChange={onNodeConfigChange}
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
                  onChange={(e) =>
                    onNodeConfigChange(
                      'retryPolicy.limit',
                      parseInt(e.target.value)
                    )
                  }
                />
                <TextField
                  type="number"
                  label="Interval (sec)"
                  value={
                    selectedNode.data.config?.retryPolicy?.intervalSec ?? 5
                  }
                  onChange={(e) =>
                    onNodeConfigChange(
                      'retryPolicy.intervalSec',
                      parseInt(e.target.value)
                    )
                  }
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
                    checked={
                      selectedNode.data.config?.continueOn?.failure || false
                    }
                    onChange={(e) =>
                      onNodeConfigChange('continueOn.failure', e.target.checked)
                    }
                  />
                }
                label="Continue on Failure"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      selectedNode.data.config?.continueOn?.skipped || false
                    }
                    onChange={(e) =>
                      onNodeConfigChange('continueOn.skipped', e.target.checked)
                    }
                  />
                }
                label="Continue if Skipped"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      selectedNode.data.config?.continueOn?.markSuccess || false
                    }
                    onChange={(e) =>
                      onNodeConfigChange(
                        'continueOn.markSuccess',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Mark as Success"
              />
            </FormGroup>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Mail On
            </Typography>
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedNode.data.config?.mailOn?.success || false}
                    onChange={(e) =>
                      onNodeConfigChange('mailOn.success', e.target.checked)
                    }
                  />
                }
                label="Success"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedNode.data.config?.mailOn?.failure || false}
                    onChange={(e) =>
                      onNodeConfigChange('mailOn.failure', e.target.checked)
                    }
                  />
                }
                label="Failure"
              />
            </FormGroup>
          </Box>
        </Paper>
      );

    case 'subdag':
      return (
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Sub Workflow Configuration
            </Typography>

            <SubDagNodePanel
              config={selectedNode.data.config || {}}
              onChange={onNodeConfigChange}
            />
          </Box>
        </Paper>
      );

    case 'condition':
      const followingNodes = edges
        .filter((edge) => edge.source === selectedNode.id)
        .map((edge) => nodes.find((node) => node.id === edge.target))
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
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Node: {node.data.config?.name || node.id}
                    </Typography>

                    <TextField
                      fullWidth
                      required
                      label="Condition"
                      value={
                        selectedNode.data.config?.nextNodes?.[node.id]
                          ?.precondition?.condition || ''
                      }
                      onChange={(e) =>
                        onNodeConfigChange(
                          `nextNodes.${node.id}.precondition.condition`,
                          e.target.value
                        )
                      }
                      helperText="Enter condition (e.g., $WEEKDAY, `date '+%d'`, or shell command)"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Expected Value (Optional)"
                      value={
                        selectedNode.data.config?.nextNodes?.[node.id]
                          ?.precondition?.expected || ''
                      }
                      onChange={(e) =>
                        onNodeConfigChange(
                          `nextNodes.${node.id}.precondition.expected`,
                          e.target.value
                        )
                      }
                      helperText="Enter expected value (e.g., Friday, 01)"
                    />
                  </Box>
                ))}
              </>
            ) : (
              <Typography color="text.secondary">
                Connect this condition to other nodes to configure their
                preconditions
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
