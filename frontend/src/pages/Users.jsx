import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  ManageAccountsRounded as UsersIcon,
  PersonOutlineRounded as PersonIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LockOutlined as LockIcon,
  RefreshRounded as RefreshIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettingsRounded as AdminIcon,
  SupervisorAccountRounded as ManagerIcon,
  BadgeRounded as StaffIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateViews';

// ── Role config ────────────────────────────────────────────────
const ROLES = [
  { value: 'ADMIN', label: 'Admin', icon: AdminIcon, bg: '#FFF8E1', text: '#B78103' },
  { value: 'MANAGER', label: 'Manager', icon: ManagerIcon, bg: '#E3F2FD', text: '#1565C0' },
  { value: 'STAFF', label: 'Staff', icon: StaffIcon, bg: '#E8F5E9', text: '#2E7D32' },
];

const getRoleStyle = (role) => ROLES.find((r) => r.value === role) || ROLES[2];

const formatDate = (isoStr) =>
  isoStr ? new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Main Component ─────────────────────────────────────────────
const Users = () => {
  const { user: currentUser, role: currentRole } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiSupported, setApiSupported] = useState(true);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF',
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch users ────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setApiSupported(true);
      } else {
        setError(res.data?.message || 'Failed to load users');
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        // Endpoint not implemented — show graceful fallback with current user
        setApiSupported(false);
        setUsers(currentUser ? [currentUser] : []);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to connect to server');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentRole !== 'ADMIN') return;
    fetchUsers();
  }, [fetchUsers, currentRole]);

  // ── Create user ────────────────────────────────────────────
  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setSnackbar({ open: true, message: 'Name, email, and password are required', severity: 'error' });
      return;
    }
    if (formData.password.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        password: formData.password,
        role: formData.role,
      });
      if (res.data?.success) {
        setSnackbar({ open: true, message: `User "${formData.name}" created successfully!`, severity: 'success' });
        setCreateOpen(false);
        setFormData({ name: '', email: '', phone: '', password: '', role: 'STAFF' });
        // If API is supported, refresh. Otherwise add manually.
        if (apiSupported) {
          fetchUsers();
        } else {
          setUsers((prev) => [...prev, res.data.data]);
        }
      } else {
        setSnackbar({ open: true, message: res.data?.message || 'Failed to create user', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to create user',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // ── Access guard ───────────────────────────────────────────
  if (currentRole !== 'ADMIN') {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <UsersIcon sx={{ fontSize: 64, color: '#D6CFC8', mb: 2 }} />
        <Typography variant="h5" sx={{ color: '#4E3629', fontWeight: 700 }}>
          Admin Access Required
        </Typography>
        <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
          Only administrators can manage user accounts.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629', letterSpacing: '-0.02em' }}>
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Manage staff accounts and role-based access control · {users.length} user{users.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Refresh list">
            <IconButton
              onClick={fetchUsers}
              sx={{ border: '1px solid #D6CFC8', borderRadius: '12px', color: '#4E3629' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '12px',
              py: 1.2,
              px: 2.5,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(78, 54, 41, 0.2)',
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* ── Role Legend ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {ROLES.map((r) => (
          <Chip
            key={r.value}
            label={`${r.label}`}
            size="small"
            sx={{
              backgroundColor: r.bg,
              color: r.text,
              fontWeight: 700,
              borderRadius: '8px',
              fontSize: '0.78rem',
            }}
          />
        ))}
        <Typography variant="caption" sx={{ color: '#888', alignSelf: 'center' }}>
          — Role access levels
        </Typography>
      </Box>

      {/* ── Fallback notice if /api/users not implemented ── */}
      {!apiSupported && !loading && (
        <Alert
          severity="info"
          sx={{ borderRadius: '12px', border: '1px solid #BBDEFB', backgroundColor: '#E3F2FD' }}
        >
          <strong>Note:</strong> The user list API endpoint is not yet implemented on this server build. Showing your
          current session only. You can still create new users using the "Add User" button above.
        </Alert>
      )}

      {/* ── Table ── */}
      {loading ? (
        <LoadingState message="Loading user accounts..." skeletonType="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Create staff accounts to grant system access."
          actionText="Create First User"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #ECEAE7' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Staff Member</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const rs = getRoleStyle(u.role);
                  return (
                    <TableRow key={u.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: '#4E3629',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                            }}
                          >
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                              {u.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              ID #{u.id}
                              {u.id === currentUser?.id && (
                                <Chip
                                  label="You"
                                  size="small"
                                  sx={{ ml: 1, height: 16, fontSize: '0.6rem', backgroundColor: '#FAF5EE', color: '#4E3629' }}
                                />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#555' }}>{u.email}</TableCell>
                      <TableCell sx={{ color: '#555' }}>{u.phone || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{
                            backgroundColor: rs.bg,
                            color: rs.text,
                            fontWeight: 700,
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#555' }}>{formatDate(u.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ── Create User Dialog ── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629', pb: 1 }}>
          Create Staff Account
          <Typography variant="body2" sx={{ color: '#888', fontWeight: 400, mt: 0.3 }}>
            New user will be able to log in immediately
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={handleFormChange('name')}
            placeholder="e.g. Priya Sharma"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#8D6E63', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleFormChange('email')}
            placeholder="priya@furnicraft.com"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#8D6E63', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone (optional)"
                value={formData.phone}
                onChange={handleFormChange('phone')}
                placeholder="+91 98765 43210"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#8D6E63', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} label="Role" onChange={handleFormChange('role')}>
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={r.label}
                          size="small"
                          sx={{ backgroundColor: r.bg, color: r.text, fontWeight: 700, borderRadius: '6px' }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={formData.password}
            onChange={handleFormChange('password')}
            placeholder="Min. 6 characters"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#8D6E63', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{ color: '#666', textTransform: 'none', borderRadius: '10px' }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={saving}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Users;
