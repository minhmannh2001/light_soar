import React from 'react';
import { Box, Paper } from '@mui/material';
import ReactFlow, { Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import ConfigPanel from './ConfigPanel';
import { TriggerNode, ActionNode, ConditionNode } from './nodes';

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

const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = React.useState<{ id: string; type: string; data: NodeData } | null>(null);
  const [workflowConfig, setWorkflowConfig] = React.useState({
    name: '',
    description: '',
    timeoutSec: 3600,
    delaySec: 0,
    histRetentionDays: 30
  });

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

    // Update selectedNode state to reflect changes immediately
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

  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 250px)',
      overflow: 'hidden'
    }}>
      {/* Left side - Workflow Canvas */}
      <Box sx={{
        flex: '1 1 80%',
        height: '100%',
        bgcolor: 'background.default'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
        />
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
    </Box>
  );
};

export default WorkflowBuilder; 