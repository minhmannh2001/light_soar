import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faClock } from '@fortawesome/free-solid-svg-icons';

interface TriggerNodeProps {
  data: {
    label: string;
    type: 'webhook' | 'schedule';
  };
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data }) => {
  const getIcon = () => {
    switch (data.type) {
      case 'webhook':
        return faBolt;
      case 'schedule':
        return faClock;
      default:
        return faBolt;
    }
  };

  return (
    <Box
      sx={{
        padding: 1.5,
        borderRadius: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        minWidth: 120,
        textAlign: 'center',
        boxShadow: 2
      }}
    >
      <Handle type="source" position={Position.Bottom} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <FontAwesomeIcon icon={getIcon()} size="lg" />
        <Typography variant="subtitle2">
          {data.type === 'webhook' ? 'Webhook' : 'Schedule'}
        </Typography>
      </Box>
    </Box>
  );
};

export default TriggerNode;
