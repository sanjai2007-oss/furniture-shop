import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Paper,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  WarningAmberRounded as WarningIcon,
  InboxOutlined as EmptyIcon,
  ErrorOutlineRounded as ErrorIcon,
} from '@mui/icons-material';

/**
 * Polished loading state with optional skeletons or centered spinner
 */
export const LoadingState = ({ message = 'Loading details...', skeletonType = null, count = 3 }) => {
  if (skeletonType === 'card') {
    return (
      <Grid container spacing={3}>
        {Array.from(new Array(count)).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper sx={{ p: 2, borderRadius: '14px', height: 280 }}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '10px', mb: 2 }} />
              <Skeleton variant="text" width="80%" height={28} />
              <Skeleton variant="text" width="50%" height={20} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '6px' }} />
                <Skeleton variant="rectangular" width={50} height={24} sx={{ borderRadius: '6px' }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (skeletonType === 'table') {
    return (
      <Paper sx={{ p: 2, borderRadius: '14px' }}>
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        {Array.from(new Array(count || 5)).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={44} sx={{ my: 1, borderRadius: '6px' }} />
        ))}
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: '100%',
      }}
    >
      <CircularProgress sx={{ color: '#4E3629' }} size={42} thickness={4} />
      <Typography variant="body2" sx={{ color: '#757575', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};

/**
 * Refined empty state container
 */
export const EmptyState = ({
  icon: Icon = EmptyIcon,
  title = 'No items found',
  description = 'There are currently no items to display in this section.',
  actionText = null,
  onAction = null,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px dashed #DDD8D3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 520,
        mx: 'auto',
        my: 4,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: '#F5F2EE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: '#8D6E63',
        }}
      >
        <Icon sx={{ fontSize: 32 }} />
      </Box>
      <Typography variant="h6" sx={{ color: '#4E3629', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#757575', maxWidth: 380, mb: actionText ? 3 : 0 }}>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            backgroundColor: '#4E3629',
            color: '#FFFFFF',
            px: 3,
            py: 1,
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#3E2723' },
          }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

/**
 * Error state with retry trigger
 */
export const ErrorState = ({
  title = 'Unable to load data',
  message = 'An error occurred while fetching information. Please try again.',
  onRetry = null,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: '#FDF2F2',
        border: '1px solid #F8D7DA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 520,
        mx: 'auto',
        my: 4,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#FFEBEE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: '#D32F2F',
        }}
      >
        <ErrorIcon sx={{ fontSize: 30 }} />
      </Box>
      <Typography variant="h6" sx={{ color: '#C62828', fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#616161', mb: onRetry ? 2.5 : 0 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          onClick={onRetry}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          Retry Request
        </Button>
      )}
    </Paper>
  );
};

/**
 * Reusable Confirmation Modal
 */
export const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1,
          maxWidth: 440,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#4E3629', fontWeight: 600 }}>
        {isDanger && <WarningIcon sx={{ color: '#D32F2F' }} />}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#555555', fontSize: '0.9375rem' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: '#666', textTransform: 'none' }}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            backgroundColor: isDanger ? '#D32F2F' : '#4E3629',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: isDanger ? '#B71C1C' : '#3E2723',
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * StatusChip with Material 3 styling
 */
export const StatusChip = ({ status, type = 'order', size = 'small' }) => {
  if (!status) return null;

  let label = status;
  let bg = '#E0E0E0';
  let text = '#424242';

  const s = String(status).toLowerCase();

  if (type === 'order') {
    if (s === 'delivered') {
      bg = '#E8F5E9'; text = '#2E7D32';
    } else if (s === 'shipped') {
      bg = '#E3F2FD'; text = '#1565C0';
    } else if (s === 'processing' || s === 'confirmed') {
      bg = '#FFF8E1'; text = '#B78103';
    } else if (s === 'pending') {
      bg = '#FFF3E0'; text = '#E65100';
    } else if (s === 'cancelled') {
      bg = '#FFEBEE'; text = '#C62828';
    }
  } else if (type === 'stock') {
    if (s.includes('out') || s === '0') {
      bg = '#FFEBEE'; text = '#C62828'; label = 'Out of Stock';
    } else if (s.includes('low')) {
      bg = '#FFF3E0'; text = '#E65100'; label = 'Low Stock';
    } else {
      bg = '#E8F5E9'; text = '#2E7D32'; label = 'In Stock';
    }
  } else if (type === 'payment') {
    if (s === 'paid') {
      bg = '#E8F5E9'; text = '#2E7D32';
    } else {
      bg = '#FFF3E0'; text = '#E65100';
    }
  }

  return (
    <Chip
      size={size}
      label={label}
      sx={{
        backgroundColor: bg,
        color: text,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
        borderRadius: '6px',
        px: 0.5,
        border: 'none',
      }}
    />
  );
};
