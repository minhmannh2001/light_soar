import React from 'react';
import { Position } from 'reactflow';
import { Card, Typography, Box, Chip, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomHandle from './CustomHandle';

interface ConditionNodeProps {
  data: {
    label: string;
    config: {
      name: string;
      nextNodes: {
        [nodeId: string]: {
          precondition: {
            condition: string;
            expected?: string;
          };
        };
      };
    };
  };
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data }) => {
  // Check if name is filled and at least one condition is configured
  const isConfigured = data.config?.name &&
    Object.values(data.config?.nextNodes || {}).some(
      node => node.precondition?.condition
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
              bgcolor: 'info.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon
              icon={faCodeBranch}
              size="xs"
              color="#fff"
            />
          </Box>
          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
            {data.config?.name || data.label}
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Conditional Branch
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

export default ConditionNode;
