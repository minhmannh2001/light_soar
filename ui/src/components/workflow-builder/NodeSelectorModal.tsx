import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import CloseIcon from '@mui/icons-material/Close';

interface NodeSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  sourceNodeType?: string; // Add source node type prop
}

const nodeTypes = [
  {
    type: 'action',
    label: 'Action Node',
    icon: faCode,
    description: 'Execute a command or script',
  },
  {
    type: 'condition',
    label: 'Condition Node',
    icon: faCodeBranch,
    description: 'Add conditional branching',
  },
];

const NodeSelectorModal: React.FC<NodeSelectorModalProps> = ({
  open,
  onClose,
  onSelect,
  sourceNodeType,
}) => {
  // Filter node types based on source node type
  const availableNodeTypes =
    sourceNodeType === 'condition'
      ? nodeTypes.filter((node) => node.type !== 'condition')
      : nodeTypes;

  // Check if source is a condition node
  const isSourceCondition = sourceNodeType === 'condition';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '600px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h6">Add a node</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isSourceCondition && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Condition nodes cannot be connected to other condition nodes. Only
            action nodes can be added.
          </Alert>
        )}
        <List>
          {availableNodeTypes.map((node) => (
            <ListItemButton
              key={node.type}
              onClick={() => {
                onSelect(node.type);
                onClose();
              }}
            >
              <ListItemIcon>
                <FontAwesomeIcon icon={node.icon} />
              </ListItemIcon>
              <ListItemText primary={node.label} secondary={node.description} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default NodeSelectorModal;
