import React from 'react';
import { Box } from '@mui/material';
import { XYPosition } from 'reactflow';
import AddIcon from '@mui/icons-material/Add';

interface NodeSilhouetteProps {
  position: XYPosition | null;
  isConnecting: boolean;
}

const NodeSilhouette: React.FC<NodeSilhouetteProps> = ({ position, isConnecting }) => {
  if (!isConnecting || !position) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 20%)',
        minWidth: '288px',
        minHeight: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'primary.main',
        opacity: 0.5,
        pointerEvents: 'none',
      }}
    >
      <AddIcon sx={{ color: 'text.secondary', opacity: 0.7 }} />
    </Box>
  );
};

export default NodeSilhouette; 