import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';

interface ConditionNodeProps {
  data: {
    label: string;
    condition: string;
  };
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data }) => {
  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        bgcolor: 'info.main',
        color: 'info.contrastText',
        minWidth: 150,
        textAlign: 'center',
        boxShadow: 2
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="true" />
      <Handle type="source" position={Position.Right} id="false" />
      <FontAwesomeIcon icon={faCodeBranch} size="lg" />
      <Typography variant="subtitle1" sx={{ mt: 1 }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block" noWrap>
        {data.condition}
      </Typography>
    </Box>
  );
};

export default ConditionNode;
