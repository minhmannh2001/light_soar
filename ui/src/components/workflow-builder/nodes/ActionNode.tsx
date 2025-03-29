import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

interface ActionNodeProps {
  data: {
    label: string;
    command: string;
  };
}

const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        bgcolor: 'secondary.main',
        color: 'secondary.contrastText',
        minWidth: 150,
        textAlign: 'center',
        boxShadow: 2
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <FontAwesomeIcon icon={faPlay} size="lg" />
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block" noWrap>
        {data.command}
      </Typography>
    </Box>
  );
};

export default ActionNode;
