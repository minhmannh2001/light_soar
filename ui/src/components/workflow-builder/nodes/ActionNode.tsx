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
    type: string;
    config: {
      command: string;
    };
  };
}

const ActionNode: React.FC<ActionNodeProps> = ({ data }) => {
  const isConfigured = data.config.command !== '';

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
          overflow: 'visible'
        }}
      >
        {/* Top Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon
              icon={faPlay}
              size="xs"
              color="#fff"
            />
          </Box>
          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
            {data.label}
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Action Node
        </Typography>

        {/* Divider */}
        <Divider sx={{ my: 0.5 }} />

        {/* Status */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Chip
            icon={<CheckCircleIcon sx={{ color: isConfigured ? 'success.main' : 'warning.main', fontSize: '0.7rem' }} />}
            label={isConfigured ? 'Configured' : 'Not Configured'}
            sx={{
              bgcolor: isConfigured ? 'rgba(46, 125, 50, 0.1)' : 'rgba(237, 108, 2, 0.1)',
              color: isConfigured ? 'success.main' : 'warning.main',
              height: 20,
              '& .MuiChip-label': {
                fontSize: '0.6rem',
                px: 0.5
              },
              '& .MuiChip-icon': {
                fontSize: '0.75rem',
                ml: 0.5
              }
            }}
            size="small"
          />
        </Box>
      </Card>
    </Box>
  );
};

export default ActionNode;
