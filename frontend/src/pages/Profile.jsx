import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  PersonOutlineRounded as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LockOutlined as LockIcon,
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  Visibility,
  VisibilityOff,
  BadgeRounded as BadgeIcon,
  CalendarTodayRounded as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: '10px',
        backgroundColor: '#FAF5EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon sx={{ color: '#4E3629', fontSize: 18 }} />
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

// ── Role Badge colours ────────────────────────────────────────
const roleStyle = {
  ADMIN: { bg: '#FFF8E1', text: '#B78103' },
  MANAGER: { bg: '#E3F2FD', text: '#1565C0' },
  STAFF: { bg: '#E8F5E9', text: '#2E7D32' },
};

// ── Main Component ────────────────────────────────────────────
const Profile = () => {
  const { user, login } = useAuth();

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Change password state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const role = user?.role || 'STAFF';
  const rs = roleStyle[role] || roleStyle.STAFF;

  // ── Save profile changes ───────────────────────────────────
  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Name cannot be empty', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/api/auth/me', {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
      });
      if (res.data?.success) {
        // Refresh user in auth context by re-reading
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        setEditing(false);
        // Update localStorage so reload reflects changes
        const updated = { ...user, name: formData.name.trim(), phone: formData.phone.trim() || null };
        localStorage.setItem('user', JSON.stringify(updated));
        // Force auth context refresh
        window.dispatchEvent(new Event('storage'));
      } else {
        setSnackbar({ open: true, message: res.data?.message || 'Update failed', severity: 'error' });
      }
    } catch (err) {
      // If endpoint not yet implemented, show friendly message
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 404 || err.response?.status === 405) {
        setSnackbar({ open: true, message: 'Profile update endpoint not available on this server build.', severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: msg || 'Failed to update profile', severity: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) {
      setSnackbar({ open: true, message: 'Please fill in all password fields', severity: 'error' });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await api.put('/api/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      if (res.data?.success) {
        setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
        setPwOpen(false);
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setSnackbar({ open: true, message: res.data?.message || 'Failed', severity: 'error' });
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        setSnackbar({ open: true, message: 'Password change endpoint not available on this server build.', severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: err.response?.data?.message || 'Incorrect current password or server error', severity: 'error' });
      }
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 860, mx: 'auto' }}>

      {/* ── Page Header ── */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', letterSpacing: '-0.02em' }}>
          My Profile
        </Typography>
        <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
          Manage your personal information and account security settings
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Left: Avatar + role card ── */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #ECEAE7',
              p: 0,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center', '&:last-child': { pb: 3 } }}>
              <Avatar
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: '#4E3629',
                  fontSize: '2rem',
                  fontWeight: 800,
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 4px 16px rgba(78, 54, 41, 0.25)',
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </Avatar>

              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A1A1A', mb: 0.5 }}>
                {user?.name || 'Staff Member'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#757575', mb: 2 }}>
                {user?.email}
              </Typography>

              <Chip
                label={role}
                sx={{
                  backgroundColor: rs.bg,
                  color: rs.text,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderRadius: '8px',
                  px: 1,
                  mb: 3,
                }}
              />

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <InfoRow icon={BadgeIcon} label="User ID" value={`#${user?.id || '—'}`} />
                <InfoRow icon={CalendarIcon} label="Member Since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Edit info + Password ── */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Personal Info Card */}
            <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECEAE7' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                      Personal Information
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      Update your display name and contact details
                    </Typography>
                  </Box>
                  {!editing && (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setEditing(true)}
                      sx={{
                        color: '#4E3629',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#FAF5EE' },
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </Box>

                {editing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#8D6E63', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={user?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#8D6E63', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#8D6E63', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => { setEditing(false); setFormData({ name: user?.name || '', phone: user?.phone || '' }); }}
                        sx={{ color: '#666', textTransform: 'none', borderRadius: '10px' }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        sx={{
                          backgroundColor: '#4E3629',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 700,
                          '&:hover': { backgroundColor: '#3E2723' },
                        }}
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <InfoRow icon={PersonIcon} label="Full Name" value={user?.name} />
                    <Divider sx={{ my: 0.5, borderColor: '#F5F2EE' }} />
                    <InfoRow icon={EmailIcon} label="Email Address" value={user?.email} />
                    <Divider sx={{ my: 0.5, borderColor: '#F5F2EE' }} />
                    <InfoRow icon={PhoneIcon} label="Phone Number" value={user?.phone} />
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECEAE7' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                      Account Security
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      Change your login password
                    </Typography>
                  </Box>
                  {!pwOpen && (
                    <Button
                      startIcon={<LockIcon />}
                      onClick={() => setPwOpen(true)}
                      sx={{
                        color: '#4E3629',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#FAF5EE' },
                      }}
                    >
                      Change Password
                    </Button>
                  )}
                </Box>

                {!pwOpen ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      backgroundColor: '#FAF9F7',
                      border: '1px solid #ECEAE7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <LockIcon sx={{ color: '#8D6E63', fontSize: 22 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                        Password
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        Last changed: unknown · Click "Change Password" to update
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(['current_password', 'new_password', 'confirm_password']).map((field) => {
                      const labels = {
                        current_password: 'Current Password',
                        new_password: 'New Password',
                        confirm_password: 'Confirm New Password',
                      };
                      return (
                        <TextField
                          key={field}
                          fullWidth
                          label={labels[field]}
                          type={showPw[field.split('_')[0]] ? 'text' : 'password'}
                          value={pwForm[field]}
                          onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon sx={{ color: '#8D6E63', fontSize: 18 }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const key = field.split('_')[0];
                                    setShowPw({ ...showPw, [key]: !showPw[key] });
                                  }}
                                >
                                  {showPw[field.split('_')[0]] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                      );
                    })}
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => { setPwOpen(false); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); }}
                        sx={{ color: '#666', textTransform: 'none', borderRadius: '10px' }}
                        disabled={pwSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={pwSaving}
                        sx={{
                          backgroundColor: '#4E3629',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 700,
                          '&:hover': { backgroundColor: '#3E2723' },
                        }}
                      >
                        {pwSaving ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

          </Box>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
