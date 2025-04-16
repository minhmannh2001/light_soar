import React, { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
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
}

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({
  yamlContent,
  dagName,
  isEditMode,
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
    name: dagName || '', // Initialize with dagName if provided
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
  });

  // Add effect to load YAML content when switching to visual editor
  React.useEffect(() => {
    if (yamlContent) {
      const config = parseYamlConfig(yamlContent);

      // Update each field individually to maintain other existing values
      if (config.description !== undefined) {
        setWorkflowConfig((prev) => ({
          ...prev,
          description: config.description,
        }));
      }
      if (config.parameters) {
        setWorkflowConfig((prev) => ({
          ...prev,
          parameters: config.parameters,
        }));
      }
      if (config.mailOn) {
        setWorkflowConfig((prev) => ({
          ...prev,
          mailOn: config.mailOn,
        }));
      }
    }
  }, [yamlContent]);

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

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!connectingNodeId.current) return;

    const targetIsPane = (event?.target as HTMLElement)?.classList.contains(
      'react-flow__pane'
    );

    if (targetIsPane) {
      const x = (event as MouseEvent).clientX;
      const y = (event as MouseEvent).clientY;

      setPendingConnection({
        sourceNodeId: connectingNodeId.current,
        sourceHandleId: connectingHandleId.current,
        position: { x, y },
      });
      setShowNodeSelector(true);
    }

    connectingHandleId.current = null;
    setSilhouettePosition(null);
    setIsConnecting(false);
  }, []);

  const handleNodeSelect = useCallback(
    (type: string) => {
      if (!pendingConnection) return;

      const { sourceNodeId, sourceHandleId, position } = pendingConnection;
      const newNodeId = `node-${nodes.length + 1}`;

      // Get the source node's name for the depends field
      const sourceNode = nodes.find((node) => node.id === sourceNodeId);
      const sourceNodeName =
        sourceNode?.data.config?.name || sourceNode?.data.label;

      // Create new node with proper initial config structure
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
                  name: '',
                  description: '',
                  output: '',
                  command: '',
                  script: '',
                  retryPolicy: {
                    limit: 2,
                    intervalSec: 5,
                  },
                  continueOn: {
                    failure: false,
                    skipped: false,
                    exitCode: [],
                    markSuccess: false,
                  },
                }
              : {}),
            // Add depends field with the source node's name
            depends: sourceNodeName ? [sourceNodeName] : [],
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
    [nodes.length, pendingConnection, project, nodes]
  );

  const showInstruction = nodes.length === 1 && edges.length === 0;

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => [
      ...eds,
      { ...params, id: `${params.source}-${params.target}` } as Edge,
    ]);

    // Update the target node's depends field
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== params.target) return node;

        const sourceNode = nds.find((n) => n.id === params.source);
        const sourceNodeName =
          sourceNode?.data.config?.name || sourceNode?.data.label;

        if (!sourceNodeName) return node;

        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              depends: [...(node.data.config?.depends || []), sourceNodeName],
            },
          },
        };
      })
    );
  }, []);

  return (
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
      />
    </Box>
  );
};

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  yamlContent,
  dagName,
  isEditMode,
}) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent
        yamlContent={yamlContent}
        dagName={dagName}
        isEditMode={isEditMode}
      />
    </ReactFlowProvider>
  );
};

// Add the YAML parsing utility if not already present
const parseYamlConfig = (yamlContent: string): Partial<WorkflowConfig> => {
  try {
    const config = yaml.load(yamlContent) as any;
    return {
      description: config.description || '',
      parameters: parseYamlParams(config.params || []),
      mailOn: {
        success: config.mailOn?.success || false,
        failure: config.mailOn?.failure || false,
      },
    };
  } catch (e) {
    console.error('Failed to parse YAML:', e);
    return {};
  }
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

export default WorkflowBuilder;
