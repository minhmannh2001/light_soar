import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box } from '@mui/material';

interface CustomHandleProps {
  type: 'source' | 'target';
  position: Position;
  id?: string;
  className?: string;
}

const CustomHandle: React.FC<CustomHandleProps> = ({ type, position, id, className }) => {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={{
        width: 16,
        height: 16,
        background: '#b1b1b7',
        border: '2px solid #fff',
        bottom: position === Position.Bottom ? -8 : undefined,
        top: position === Position.Top ? -8 : undefined,
        zIndex: 1000,
        cursor: 'pointer',
        ...(className ? { className } : {})
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 4,
          height: 4,
          borderRadius: '50%',
          bgcolor: '#fff'
        }}
      />
    </Handle>
  );
};

export default CustomHandle; 