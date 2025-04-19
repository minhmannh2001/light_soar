import React from 'react';
import { Position } from 'reactflow';
import { Card, Typography, Box, Chip, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomHandle from './CustomHandle';

interface TriggerNodeProps {
  data: {
    label: string;
    type: string;
    config: {
      type: string;
      schedule: string;
    };
  };
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ data }) => {
  const isConfigured =
    data.config.type === 'webhook' ||
    (data.config.type === 'schedule' && Boolean(data.config.schedule));

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
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
            <FontAwesomeIcon icon={faBolt} size="xs" color="#fff" />
          </Box>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ fontSize: '0.75rem' }}
          >
            {data.label}
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

        {/* Description */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.7rem' }}
        >
          {data.config.type === 'webhook'
            ? 'Webhook Trigger'
            : 'Schedule Trigger'}
        </Typography>

        {/* Divider */}
        <Divider sx={{ my: 0.5 }} />

        {/* Status */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Chip
            label={isConfigured ? 'Configured' : 'Not Configured'}
            sx={{
              bgcolor: isConfigured
                ? 'rgba(46, 125, 50, 0.1)'
                : 'rgba(237, 108, 2, 0.1)',
              color: isConfigured ? 'success.main' : 'warning.main',
              height: 20,
              '& .MuiChip-label': {
                fontSize: '0.6rem',
                px: 0.5,
              },
            }}
            size="small"
          />
        </Box>
      </Card>
    </Box>
  );
};

export default TriggerNode;
