import React, { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  OnConnectStartParams,
  XYPosition,
  useReactFlow,
  ReactFlowProvider,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ConfigPanel from './ConfigPanel';
import { TriggerNode, ActionNode, ConditionNode } from './nodes';
import NodeSilhouette from './NodeSilhouette';
import NodeSelectorModal from './NodeSelectorModal';
import * as yaml from 'js-yaml';
import ErrorModal from '../molecules/ErrorModal';

interface NodeData {
  label: string;
  type: string;
  config: any;
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: {
      label: 'Webhook',
      type: 'webhook',
      config: {
        type: 'webhook',
        schedule: '',
      },
    },
  },
];

interface WorkflowBuilderProps {
  yamlContent?: string;
  dagName?: string;
  isEditMode?: boolean;
  onYamlChange?: (yaml: string) => void;
}

interface Step {
  name: string;
  command?: string;
  description?: string;
  output?: string;
  script?: string;
  precondition?: any;
  depends?: string[];
  mailOn?: {
    success?: boolean;
    failure?: boolean;
  };
  continueOn?: {
    failure?: boolean;
    skipped?: boolean;
    markSuccess?: boolean;
  };
  retryPolicy?: {
    limit?: number;
    intervalSec?: number;
  };
}

// Update the WorkflowConfig interface to include environment variables
interface WorkflowConfig {
  name: string;
  description: string;
  timeoutSec: number;
  delaySec: number;
  histRetentionDays: number;
  parameters: Parameter[];
  mailOn: {
    success: boolean;
    failure: boolean;
  };
  schedule: string;
  env: EnvironmentVariable[]; // Add environment variables
}

// Add an interface for environment variables
interface EnvironmentVariable {
  name: string;
  value: string;
}

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({
  yamlContent,
  dagName,
  isEditMode,
  onYamlChange,
}) => {
  const { project } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    type: string;
    data: NodeData;
  } | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState({
    name: dagName || '',
    description: '',
    timeoutSec: 3600,
    delaySec: 0,
    histRetentionDays: 30,
    parameters: [],
    mailOn: {
      success: false,
      failure: false,
    },
    schedule: '',
    env: [], // Initialize empty environment variables array
  });
  const [errorModalVisible, setErrorModalVisible] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleGenerateYaml = () => {
    if (onYamlChange) {
      try {
        const newYaml = generateYamlFromWorkflow(nodes, edges, workflowConfig);
        onYamlChange(newYaml);
      } catch (error) {
        setErrorMessage(error.message);
        setErrorModalVisible(true);
      }
    }
  };

  // Add effect to load YAML content when switching to visual editor
  React.useEffect(() => {
    if (yamlContent) {
      const config = parseYamlConfig(yamlContent);

      // Update workflow configuration
      setWorkflowConfig((prev) => ({
        ...prev,
        description: config.description || prev.description,
        parameters: config.parameters || prev.parameters,
        mailOn: config.mailOn || prev.mailOn,
        env: config.env || prev.env, // Add environment variables
      }));

      // Set nodes and edges from the parsed YAML
      if (config.nodes) {
        setNodes(config.nodes);
      }
      if (config.edges) {
        setEdges(config.edges);
      }
    }
  }, [yamlContent, setNodes, setEdges]);

  // Remove the auto-update effect that was here before

  // Connection state
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [silhouettePosition, setSilhouettePosition] =
    useState<XYPosition | null>(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourceHandleId: string | null;
    position: XYPosition;
    sourceNodeType?: string;
  } | null>(null);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode({
      id: node.id,
      type: node.type || '',
      data: node.data as NodeData,
    });
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  const handleWorkflowConfigChange = (field: string, value: any) => {
    setWorkflowConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNodeConfigChange = (field: string, value: any) => {
    if (!selectedNode) return;

    // Handle nested fields (e.g., 'retryPolicy.limit', 'continueOn.failure')
    const updateNestedConfig = (
      config: any,
      path: string[],
      value: any
    ): Record<string, any> => {
      if (path.length === 1) {
        // When updating script field, don't modify scriptType and command
        if (path[0] === 'script') {
          return {
            ...config,
            [path[0]]: value,
          };
        }
        return { ...config, [path[0]]: value };
      }

      const [current, ...rest] = path;
      return {
        ...config,
        [current]: updateNestedConfig(config[current] || {}, rest, value),
      };
    };

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedNode.id) return node;

        // Split the field path (e.g., 'retryPolicy.limit' -> ['retryPolicy', 'limit'])
        const fieldPath = field.split('.');

        // Update the config using the nested update function
        const newConfig = updateNestedConfig(
          node.data.config || {},
          fieldPath,
          value
        );

        return {
          ...node,
          data: {
            ...node.data,
            config: newConfig,
          },
        };
      })
    );

    // Update selected node state
    setSelectedNode((prev) => {
      if (!prev) return null;

      const fieldPath = field.split('.');
      const newConfig = updateNestedConfig(
        prev.data.config || {},
        fieldPath,
        value
      );

      return {
        ...prev,
        data: {
          ...prev.data,
          config: newConfig,
        },
      };
    });
  };

  // Connection handlers
  const onConnectStart = useCallback(
    (
      event: React.MouseEvent | React.TouchEvent,
      params: OnConnectStartParams
    ) => {
      // Only allow connections from output handles (bottom handles)
      if (params.handleId && params.handleId === 'target') {
        return;
      }
      connectingNodeId.current = params.nodeId;
      connectingHandleId.current = params.handleId;
      setIsConnecting(true);
    },
    []
  );

  const onPaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isConnecting) return;

      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      setSilhouettePosition({ x, y });
    },
    [isConnecting]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent) => {
      if (!connectingNodeId.current) return;

      const targetIsPane = (event.target as Element).classList.contains(
        'react-flow__pane'
      );

      if (targetIsPane) {
        // Get the source node type
        const sourceNode = nodes.find(
          (node) => node.id === connectingNodeId.current
        );
        const sourceNodeType = sourceNode?.type || '';

        // Set pending connection with source node type
        setPendingConnection({
          sourceNodeId: connectingNodeId.current,
          sourceHandleId: connectingHandleId.current,
          position: project({
            x: event.clientX,
            y: event.clientY,
          }),
          sourceNodeType, // Add source node type
        });

        setShowNodeSelector(true);
      }

      setIsConnecting(false);
      setSilhouettePosition(null);
      connectingNodeId.current = null;
      connectingHandleId.current = null;
    },
    [project, nodes]
  );

  const handleNodeSelect = useCallback(
    (type: string) => {
      if (!pendingConnection) return;

      const { sourceNodeId, sourceHandleId, position } = pendingConnection;
      const newNodeId = `node-${nodes.length + 1}`;

      // Create new node with source node ID in depends, but only if source is not trigger
      const newNode = {
        id: newNodeId,
        type,
        position: project(position),
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          type,
          config: {
            ...(type === 'action'
              ? {
                  name: `${newNodeId}`,
                  description: '',
                  output: '',
                  scriptType: 'bash',
                  command: 'bash',
                  pythonFile: '',
                  script: '',
                  retryPolicy: {
                    limit: 2,
                    intervalSec: 5,
                  },
                  continueOn: {
                    failure: false,
                    skipped: false,
                    markSuccess: false,
                  },
                  mailOn: {
                    success: false,
                    failure: false,
                  },
                }
              : {}),
            // Only add to depends if source is not trigger node
            depends:
              sourceNodeId && !sourceNodeId.startsWith('trigger-')
                ? [sourceNodeId]
                : [],
          },
        },
      };

      // Create edge
      const newEdge = {
        id: `edge-${sourceNodeId}-${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        ...(sourceHandleId && { sourceHandle: sourceHandleId }),
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);
      setPendingConnection(null);
    },
    [nodes.length, pendingConnection, project]
  );

  const showInstruction = nodes.length === 1 && edges.length === 0;

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => [
      ...eds,
      { ...params, id: `${params.source}-${params.target}` } as Edge,
    ]);

    // Update the target node's depends field, but only if source is not trigger
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== params.target) return node;

        // Skip updating depends if source is trigger node
        if (params.source.startsWith('trigger-')) {
          return node;
        }

        // Get current depends array or initialize empty array
        const currentDepends = node.data.config?.depends || [];

        // Only add if not already in depends
        if (!currentDepends.includes(params.source)) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                depends: [...currentDepends, params.source],
              },
            },
          };
        }

        return node;
      })
    );
  }, []);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 250px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left side - Workflow Canvas */}
        <Box
          sx={{
            flex: '1 1 80%',
            height: '100%',
            bgcolor: 'background.default',
            position: 'relative',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 10,
              display: 'flex',
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={handleGenerateYaml}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Generate YAML
            </Button>
          </Box>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onPaneMouseMove={onPaneMouseMove}
            fitView
            onConnect={onConnect}
          >
            <NodeSilhouette
              position={silhouettePosition}
              isConnecting={isConnecting}
            />
          </ReactFlow>
          {showInstruction && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                bgcolor: 'background.paper',
                px: 3,
                py: 2,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Click and drag from the output handle to create a new node
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right side - Configuration Panel */}
        <Paper
          sx={{
            flex: '0 0 20%',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <ConfigPanel
            selectedNode={selectedNode}
            workflowConfig={workflowConfig}
            onWorkflowConfigChange={handleWorkflowConfigChange}
            onNodeConfigChange={handleNodeConfigChange}
            nodes={nodes}
            edges={edges}
            yamlContent={yamlContent}
            isEditMode={isEditMode}
          />
        </Paper>

        {/* Node Selector Modal */}
        <NodeSelectorModal
          open={showNodeSelector}
          onClose={() => {
            setShowNodeSelector(false);
            setPendingConnection(null);
          }}
          onSelect={handleNodeSelect}
          sourceNodeType={pendingConnection?.sourceNodeType}
        />
      </Box>
      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </>
  );
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  yamlContent,
  dagName,
  isEditMode,
  onYamlChange,
}) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent
        yamlContent={yamlContent}
        dagName={dagName}
        isEditMode={isEditMode}
        onYamlChange={onYamlChange}
      />
    </ReactFlowProvider>
  );
};

const parseYamlConfig = (
  yamlContent: string
): Partial<WorkflowConfig> & { nodes: any[]; edges: any[] } => {
  try {
    const config = yaml.load(yamlContent) as any;
    const steps = config.steps || [];

    // Parse environment variables
    const env: EnvironmentVariable[] = [];
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

    // Create trigger node at the top
    const triggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 50 }, // Start trigger a bit lower from top
      data: {
        label: 'Trigger',
        type: 'trigger',
        config: {
          type: 'webhook',
          schedule: config.schedule || '',
        },
      },
    };

    // First, create all regular nodes
    const nodesMap = new Map();
    const nodes = [triggerNode];
    const edges = [];
    let conditionNodeCounter = 0;

    // Create a map of step name to node
    steps.forEach((step: Step, index: number) => {
      const nodeId = `node-${index + 1}`;
      const nodeType = 'action';

      let scriptType = 'bash';
      let command = 'bash';
      let script = step.script || '';

      if (step.command && step.command !== 'bash') {
        script = step.command;
      }

      const node = {
        id: nodeId,
        type: nodeType,
        position: { x: 0, y: 0 }, // Position will be set later
        data: {
          label: step.name,
          type: nodeType,
          config: {
            name: step.name,
            description: step.description || '',
            command: command,
            output: step.output || '',
            script: script,
            scriptType: scriptType,
            pythonFile: '',
            depends: step.depends || [],
            mailOn: {
              success: step.mailOn?.success || false,
              failure: step.mailOn?.failure || false,
            },
            continueOn: {
              failure: step.continueOn?.failure || false,
              skipped: step.continueOn?.skipped || false,
              markSuccess: step.continueOn?.markSuccess || false,
            },
            retryPolicy: {
              limit: step.retryPolicy?.limit || 2,
              intervalSec: step.retryPolicy?.intervalSec || 5,
            },
          },
        },
      };

      nodes.push(node);
      nodesMap.set(step.name, node);
    });

    // Process dependencies and create edges
    steps.forEach((step: Step) => {
      const targetNode = nodesMap.get(step.name);

      if (!targetNode) return;

      // If no dependencies, connect to trigger
      if (!step.depends || step.depends.length === 0) {
        edges.push({
          id: `edge-trigger-1-${targetNode.id}`,
          source: 'trigger-1',
          target: targetNode.id,
        });
        return;
      }

      // Process each dependency
      (Array.isArray(step.depends) ? step.depends : [step.depends]).forEach(
        (sourceName: string) => {
          const sourceNode = nodesMap.get(sourceName);
          if (!sourceNode) return;

          // Check if this node has preconditions
          if (step.preconditions || step.precondition) {
            const preconditions =
              step.preconditions ||
              (step.precondition ? [step.precondition] : []);

            // Create a condition node for each precondition
            preconditions.forEach((precondition: any) => {
              conditionNodeCounter++;
              const conditionNodeId = `condition-${conditionNodeCounter}`;

              // Create condition node
              const conditionNode = {
                id: conditionNodeId,
                type: 'condition',
                position: { x: 0, y: 0 }, // Position will be set later
                data: {
                  label: 'Condition',
                  type: 'condition',
                  config: {
                    name: `Condition ${conditionNodeCounter}`,
                    nextNodes: {
                      [targetNode.id]: {
                        precondition: {
                          condition:
                            typeof precondition === 'string'
                              ? precondition
                              : precondition.condition || '',
                          expected:
                            typeof precondition === 'string'
                              ? ''
                              : precondition.expected || '',
                        },
                      },
                    },
                  },
                },
              };

              nodes.push(conditionNode);

              // Create edge from source to condition
              edges.push({
                id: `edge-${sourceNode.id}-${conditionNodeId}`,
                source: sourceNode.id,
                target: conditionNodeId,
              });

              // Create edge from condition to target
              edges.push({
                id: `edge-${conditionNodeId}-${targetNode.id}`,
                source: conditionNodeId,
                target: targetNode.id,
              });
            });
          } else {
            // No preconditions, create direct edge
            edges.push({
              id: `edge-${sourceNode.id}-${targetNode.id}`,
              source: sourceNode.id,
              target: targetNode.id,
            });
          }
        }
      );
    });

    // Position nodes by level
    positionNodes(nodes, edges);

    return {
      description: config.description || '',
      parameters: parseYamlParams(config.params || []),
      mailOn: {
        success: config.mailOn?.success || false,
        failure: config.mailOn?.failure || false,
      },
      env, // Add parsed environment variables
      nodes,
      edges,
    };
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return { nodes: [], edges: [] };
  }
};

// Helper function to position nodes in a visually appealing way
const positionNodes = (nodes, edges) => {
  // Create a map of node levels
  const nodeLevels = new Map();
  const nodesByLevel = new Map();

  // Set trigger node at level 0
  const triggerNode = nodes.find((node) => node.type === 'trigger');
  if (triggerNode) {
    nodeLevels.set(triggerNode.id, 0);
    if (!nodesByLevel.has(0)) nodesByLevel.set(0, []);
    nodesByLevel.get(0).push(triggerNode);
  }

  // Build a graph of dependencies
  const graph = new Map();
  edges.forEach((edge) => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source).push(edge.target);
  });

  // Perform topological sort to determine node levels
  const visited = new Set();
  const assignLevel = (nodeId, level) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Assign level to this node
    const currentLevel = nodeLevels.get(nodeId) || 0;
    const newLevel = Math.max(currentLevel, level);
    nodeLevels.set(nodeId, newLevel);

    // Add to nodesByLevel map
    if (!nodesByLevel.has(newLevel)) nodesByLevel.set(newLevel, []);
    nodesByLevel.get(newLevel).push(nodes.find((node) => node.id === nodeId));

    // Process children
    if (graph.has(nodeId)) {
      graph.get(nodeId).forEach((childId) => {
        assignLevel(childId, newLevel + 1);
      });
    }
  };

  // Start from trigger node
  if (triggerNode) {
    assignLevel(triggerNode.id, 0);
  }

  // Position nodes by level
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 200;

  nodesByLevel.forEach((levelNodes, level) => {
    const levelY = 50 + level * VERTICAL_SPACING;
    const levelWidth = levelNodes.length * HORIZONTAL_SPACING;
    const startX = Math.max(250 - levelWidth / 2, 50);

    levelNodes.forEach((node, index) => {
      node.position = {
        x: startX + index * HORIZONTAL_SPACING,
        y: levelY,
      };
    });
  });
};

// Add the parameters parsing utility if not already present
const parseYamlParams = (
  yamlParams: Array<Record<string, any>>
): Parameter[] => {
  if (!yamlParams) return [];

  return yamlParams.map((param) => {
    const [name, value] = Object.entries(param)[0];
    let defaultValue = String(value);

    // For numbers, keep as is without quotes
    if (typeof value === 'number') {
      defaultValue = String(value);
    } else {
      // For strings, always add quotes, even if they contain backticks
      if (!defaultValue.startsWith('"')) {
        defaultValue = `"${defaultValue}"`;
      }
    }

    return {
      name,
      defaultValue,
    };
  });
};

// Add this function to convert nodes and edges back to YAML format
const generateYamlFromWorkflow = (
  nodes: Node[],
  edges: Edge[],
  workflowConfig: any
): string => {
  // Get all nodes except the trigger node
  const stepNodes = nodes.filter((node) => node.id !== 'trigger-1');

  // Separate condition nodes and regular nodes
  const conditionNodes = stepNodes.filter((node) => node.type === 'condition');
  const regularNodes = stepNodes.filter((node) => node.type !== 'condition');

  // Create maps for edges
  const outgoingEdges = new Map();
  const incomingEdges = new Map();

  edges.forEach((edge) => {
    // Outgoing edges
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source).push(edge);

    // Incoming edges
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target).push(edge);
  });

  // Create a map to track condition node sources
  const conditionSourceMap = new Map();

  // Find the source node for each condition node
  conditionNodes.forEach((conditionNode) => {
    if (incomingEdges.has(conditionNode.id)) {
      const sourceEdges = incomingEdges.get(conditionNode.id);
      // Get the first regular node that points to this condition
      const sourceEdge = sourceEdges.find((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        return sourceNode && sourceNode.type !== 'condition';
      });

      if (sourceEdge) {
        conditionSourceMap.set(conditionNode.id, sourceEdge.source);
      }
    }
  });

  // Check for unconfigured nodes
  const unconfiguredNodes = stepNodes.filter((node) => {
    if (node.type === 'condition') {
      // Condition node is configured if it has a name and at least one condition
      return !(
        node.data.config?.name &&
        Object.values(node.data.config?.nextNodes || {}).some(
          (n: any) => n.precondition?.condition
        )
      );
    } else {
      // Action node is configured if it has a name and either a script or command
      return !(
        node.data.config?.name &&
        (node.data.config?.script || node.data.config?.command)
      );
    }
  });

  if (unconfiguredNodes.length > 0) {
    const nodeNames = unconfiguredNodes
      .map((node) => node.data.config?.name || node.id)
      .join(', ');
    throw new Error(`Please configure the following nodes: ${nodeNames}`);
  }

  // Create a map of node IDs to names for dependency resolution
  const nodeIdToName = new Map(
    regularNodes.map((node) => [node.id, node.data.config.name])
  );

  // Convert nodes to steps format
  const steps = regularNodes.map((node) => {
    const config = node.data.config;
    const step: any = {
      name: config.name,
    };

    // Add description if present
    if (config.description) {
      step.description = config.description;
    }

    // Handle script and command
    if (config.scriptType === 'bash') {
      step.command = 'bash';
      if (config.script) {
        step.script = config.script;
      }
    } else if (config.scriptType === 'python') {
      step.command = 'python';
      if (config.pythonFile) {
        // Handle Python file selection
        step.script = config.pythonFile;
      }
    }

    // Add output if present
    if (config.output) {
      step.output = config.output;
    }

    // Process dependencies
    const dependencies = new Set<string>();

    // Add existing dependencies
    if (config.depends && config.depends.length > 0) {
      config.depends.forEach((id) => {
        const name = nodeIdToName.get(id);
        if (name) dependencies.add(name);
      });
    }

    // Check if this node is a target of any condition node
    conditionNodes.forEach((conditionNode) => {
      if (outgoingEdges.has(conditionNode.id)) {
        outgoingEdges.get(conditionNode.id).forEach((edge) => {
          if (edge.target === node.id) {
            // Add the condition's source node as a dependency
            const sourceNodeId = conditionSourceMap.get(conditionNode.id);
            if (sourceNodeId) {
              const sourceName = nodeIdToName.get(sourceNodeId);
              if (sourceName) dependencies.add(sourceName);
            }

            // Add precondition if it exists
            if (conditionNode.data.config?.nextNodes?.[node.id]?.precondition) {
              const precondition =
                conditionNode.data.config.nextNodes[node.id].precondition;
              if (!step.preconditions) {
                step.preconditions = [];
              }
              step.preconditions.push({
                condition: precondition.condition,
                expected: precondition.expected || '',
              });
            }
          }
        });
      }
    });

    // Add dependencies to step
    if (dependencies.size > 0) {
      step.depends = Array.from(dependencies);
    }

    // Add retry policy if present
    if (config.retryPolicy?.limit > 0) {
      step.retryPolicy = {
        limit: config.retryPolicy.limit,
        intervalSec: config.retryPolicy.intervalSec,
      };
    }

    // Add continue on if present
    if (
      config.continueOn?.failure ||
      config.continueOn?.skipped ||
      config.continueOn?.markSuccess
    ) {
      step.continueOn = {
        ...(config.continueOn.failure && { failure: true }),
        ...(config.continueOn.skipped && { skipped: true }),
        ...(config.continueOn.markSuccess && { markSuccess: true }),
      };
    }

    // Add mail on if present
    if (config.mailOn?.success || config.mailOn?.failure) {
      step.mailOn = {
        ...(config.mailOn.success && { success: true }),
        ...(config.mailOn.failure && { failure: true }),
      };
    }

    return step;
  });

  const yamlStructure: any = {
    steps,
  };

  // Add description if present
  if (workflowConfig.description) {
    yamlStructure.description = workflowConfig.description;
  }

  // Add schedule only if it's not empty
  if (workflowConfig.schedule) {
    yamlStructure.schedule = workflowConfig.schedule;
  }

  // Add environment variables if present
  if (workflowConfig.env && workflowConfig.env.length > 0) {
    yamlStructure.env = workflowConfig.env.map((env: EnvironmentVariable) => {
      return { [env.name]: env.value };
    });
  }

  // Add parameters if present
  if (workflowConfig.parameters && workflowConfig.parameters.length > 0) {
    yamlStructure.params = workflowConfig.parameters.map((param) => {
      const value = param.defaultValue.replace(/^["']|["']$/g, '');

      // If value can be converted to a number and doesn't start with quotes, keep it as number
      const numValue = Number(value);
      if (!isNaN(numValue) && !param.defaultValue.startsWith('"')) {
        return { [param.name]: numValue };
      }

      // Otherwise keep it as string
      return { [param.name]: value };
    });
  }

  // Add mail configuration if enabled
  if (workflowConfig.mailOn?.success || workflowConfig.mailOn?.failure) {
    yamlStructure.mailOn = {
      ...(workflowConfig.mailOn.success && { success: true }),
      ...(workflowConfig.mailOn.failure && { failure: true }),
    };
  }

  // Convert to YAML string
  return yaml.dump(yamlStructure, { indent: 2 });
};

export default WorkflowBuilder;
