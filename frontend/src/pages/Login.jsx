import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  EmailOutlined as EmailIcon,
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  StorefrontRounded as StoreIcon,
  CheckCircleOutlineRounded as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#F7F7F5',
      }}
    >
      {/* Visual Showcase Panel (Desktop) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1.1,
          position: 'relative',
          backgroundImage:
            'url("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#FFFFFF',
          '::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(42, 28, 20, 0.45) 0%, rgba(42, 28, 20, 0.85) 100%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StoreIcon sx={{ fontSize: 26, color: '#FFFFFF' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              FurniCraft
            </Typography>
            <Typography variant="caption" sx={{ letterSpacing: '0.08em', opacity: 0.85, fontSize: '0.72rem' }}>
              LUXURY ATELIER & COMMERCE
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              lineHeight: 1.25,
              mb: 2,
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            Artistry in wood, timeless in precision.
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.7, fontSize: '1.05rem' }}>
            A comprehensive management platform engineered for luxury furniture showrooms, artisan inventory control, and multi-tier commerce fulfillment.
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            © {new Date().getFullYear()} FurniCraft Enterprises • Enterprise Edition
          </Typography>
        </Box>
      </Box>

      {/* Form Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 460,
            borderRadius: '20px',
            border: '1px solid #ECEAE7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            backgroundColor: '#FFFFFF',
            p: { xs: 2.5, sm: 4 },
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Box sx={{ mb: 3.5, textAlign: 'center' }}>
              <Box
                sx={{
                  display: { xs: 'inline-flex', lg: 'none' },
                  alignItems: 'center',
                  gap: 1.2,
                  mb: 2,
                }}
              >
                <StoreIcon sx={{ fontSize: 28, color: '#4E3629' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4E3629' }}>
                  FurniCraft
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4E3629', mb: 1, fontSize: '1.75rem' }}>
                Store Portal Login
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575' }}>
                Sign in with your verified operational credentials
              </Typography>
            </Box>

            {/* Error Message */}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@furniture.com"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#8D6E63' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#8D6E63' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    py: 1.4,
                    mt: 1,
                    backgroundColor: '#4E3629',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(78, 54, 41, 0.25)',
                    '&:hover': {
                      backgroundColor: '#3E2723',
                    },
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Workspace'}
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3.5, borderColor: '#ECEAE7' }}>
              <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600 }}>
                ONE-CLICK DEMO ACCESS
              </Typography>
            </Divider>

            {/* Quick Demo Fill Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Chip
                label="Admin: admin@furniture.com"
                onClick={() => fillDemo('admin@furniture.com', 'Admin@123')}
                icon={<CheckIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  borderRadius: '10px',
                  py: 2.2,
                  justifyContent: 'flex-start',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  backgroundColor: '#FAF9F7',
                  border: '1px solid #ECEAE7',
                  color: '#4E3629',
                  '&:hover': { backgroundColor: '#F0EDE8' },
                }}
              />
              <Chip
                label="Manager: manager@furniture.com"
                onClick={() => fillDemo('manager@furniture.com', 'Manager@123')}
                icon={<CheckIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  borderRadius: '10px',
                  py: 2.2,
                  justifyContent: 'flex-start',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  backgroundColor: '#FAF9F7',
                  border: '1px solid #ECEAE7',
                  color: '#4E3629',
                  '&:hover': { backgroundColor: '#F0EDE8' },
                }}
              />
              <Chip
                label="Staff: staff@furniture.com"
                onClick={() => fillDemo('staff@furniture.com', 'Staff@123')}
                icon={<CheckIcon sx={{ fontSize: '1rem !important' }} />}
                sx={{
                  borderRadius: '10px',
                  py: 2.2,
                  justifyContent: 'flex-start',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  backgroundColor: '#FAF9F7',
                  border: '1px solid #ECEAE7',
                  color: '#4E3629',
                  '&:hover': { backgroundColor: '#F0EDE8' },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
