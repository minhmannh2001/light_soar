import React from 'react';
import { Box, Button, Modal, Stack, Typography } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

interface Props {
  visible: boolean;
  message: string;
  onClose: () => void;
}

function ErrorModal({ visible, message, onClose }: Props) {
  return (
    <Modal open={visible} onClose={onClose}>
      <Box sx={style}>
        <Stack direction="column" spacing={2}>
          <Typography variant="h6" component="h2">
            Error
          </Typography>
          <Typography sx={{ mt: 2 }}>
            {message}
          </Typography>
          <Button variant="contained" onClick={onClose}>
            OK
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}

export default ErrorModal;