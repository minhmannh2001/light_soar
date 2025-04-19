import React from 'react';
import { Position } from 'reactflow';
import { Card, Typography, Box, Chip, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomHandle from './CustomHandle';

interface ActionNodeProps {
  data: {
    label: string;
    config: {
      name: string;
      command: string;
      script: string;
    };
  };
}

const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  const isConfigured = Boolean(
    data.config?.name && data.config?.command && data.config?.script
  );

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <CustomHandle type="target" position={Position.Top} />
      <CustomHandle type="source" position={Position.Bottom} />
      <Card
        sx={{
          width: 160,
          borderRadius: 2,
          boxShadow: 2,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          position: 'relative',
          overflow: 'visible',
          // Add visual indication of configuration status
          border: isConfigured ? '2px solid #4caf50' : '2px solid #ff9800',
        }}
      >
        {/* Top Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: isConfigured ? 'success.main' : 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesomeIcon icon={faPlay} size="xs" color="#fff" />
          </Box>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ fontSize: '0.75rem' }}
          >
            {data.config?.name || data.label}
          </Typography>
          {isConfigured && (
            <CheckCircleIcon
              sx={{
                fontSize: 16,
                color: 'success.main',
                marginLeft: 'auto',
              }}
            />
          )}
        </Box>
        {/* Add status indicator */}
        <Typography
          variant="caption"
          sx={{
            color: isConfigured ? 'success.main' : 'warning.main',
            fontSize: '0.6rem',
          }}
        >
          {isConfigured ? 'Configured' : 'Not Configured'}
        </Typography>
      </Card>
    </Box>
  );
};

export default ActionNode;
