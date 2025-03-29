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
} from 'reactflow';
import 'reactflow/dist/style.css';
import ConfigPanel from './ConfigPanel';
import { TriggerNode, ActionNode, ConditionNode } from './nodes';
import NodeSilhouette from './NodeSilhouette';
import NodeSelectorModal from './NodeSelectorModal';

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
        schedule: ''
      }
    },
  },
];

const WorkflowBuilderContent: React.FC = () => {
  const { project } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string; data: NodeData } | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState({
    name: '',
    description: '',
    timeoutSec: 3600,
    delaySec: 0,
    histRetentionDays: 30
  });

  // Connection state
  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [silhouettePosition, setSilhouettePosition] = useState<XYPosition | null>(null);
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
      data: node.data as NodeData
    });
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  const handleWorkflowConfigChange = (field: string, value: any) => {
    setWorkflowConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNodeConfigChange = (field: string, value: any) => {
    if (field === 'back') {
      setSelectedNode(null);
      return;
    }

    if (!selectedNode) return;

    setNodes(nds =>
      nds.map(node =>
        node.id === selectedNode.id
          ? {
            ...node,
            data: {
              ...node.data,
              type: field === 'type' ? value : node.data.type,
              label: field === 'type' ? (value === 'webhook' ? 'Webhook' : 'Schedule') : node.data.label,
              config: {
                ...(node.data as NodeData).config,
                type: field === 'type' ? value : (node.data as NodeData).config.type,
                [field]: value,
              },
            },
          }
          : node
      )
    );

    setSelectedNode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          type: field === 'type' ? value : prev.data.type,
          label: field === 'type' ? (value === 'webhook' ? 'Webhook' : 'Schedule') : prev.data.label,
          config: {
            ...prev.data.config,
            type: field === 'type' ? value : prev.data.config.type,
            [field]: value,
          },
        },
      };
    });
  };

  // Connection handlers
  const onConnectStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
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
    (event: MouseEvent | TouchEvent) => {
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
          position: { x, y }
        });
        setShowNodeSelector(true);
      }

      connectingHandleId.current = null;
      setSilhouettePosition(null);
      setIsConnecting(false);
    },
    []
  );

  const handleNodeSelect = useCallback((type: string) => {
    if (!pendingConnection) return;

    const { sourceNodeId, sourceHandleId, position } = pendingConnection;
    const newNodeId = `node-${nodes.length + 1}`;

    // Create new node
    const newNode = {
      id: newNodeId,
      type,
      position: project(position),
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        config: {}
      }
    };

    // Create edge
    const newEdge = {
      id: `edge-${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      ...(sourceHandleId && { sourceHandle: sourceHandleId })
    };

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    setPendingConnection(null);
  }, [nodes.length, pendingConnection, project]);

  const showInstruction = nodes.length === 1 && edges.length === 0;

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 250px)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Left side - Workflow Canvas */}
      <Box sx={{
        flex: '1 1 80%',
        height: '100%',
        bgcolor: 'background.default',
        position: 'relative',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}>
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
              boxShadow: 1
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Click and drag from the output handle to create a new node
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right side - Configuration Panel */}
      <Paper sx={{
        flex: '0 0 20%',
        height: '100%',
        overflow: 'auto'
      }}>
        <ConfigPanel
          selectedNode={selectedNode}
          workflowConfig={workflowConfig}
          onWorkflowConfigChange={handleWorkflowConfigChange}
          onNodeConfigChange={handleNodeConfigChange}
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

const WorkflowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder; 