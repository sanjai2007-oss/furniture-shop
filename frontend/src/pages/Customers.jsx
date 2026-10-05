import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Pagination,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  VisibilityOutlined as ViewIcon,
  PersonOutlineRounded as CustomerIcon,
  PhoneOutlined as PhoneIcon,
  MailOutlineRounded as MailIcon,
  LocationOnOutlined as LocationIcon,
  ShoppingBagOutlined as OrdersBagIcon,
} from '@mui/icons-material';
import { customersService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, ConfirmDialog, StatusChip } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER' || role === 'STAFF';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal dialog states
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
      };
      const res = await customersService.getCustomers(params);
      if (res.success) {
        setCustomers(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.total_pages);
          setTotalCount(res.pagination.total);
        }
      } else {
        setError(res.message || 'Failed to fetch customer directory');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  // Open Create Customer
  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
    setCustomerModalOpen(true);
  };

  // Open Edit Customer
  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      pincode: cust.pincode || '',
    });
    setCustomerModalOpen(true);
  };

  // Open Details Modal with past orders
  const handleOpenDetail = async (custId) => {
    setDetailModalOpen(true);
    try {
      const res = await customersService.getCustomer(custId);
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setCustomerOrders(res.data.orders || []);
      }
    } catch {
      setSnackbar({ open: true, message: 'Could not load customer profile', severity: 'error' });
    }
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async () => {
    if (!formData.name) {
      setSnackbar({ open: true, message: 'Customer name is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (selectedCustomer) {
        await customersService.updateCustomer(selectedCustomer.id, formData);
        setSnackbar({ open: true, message: 'Customer profile updated!', severity: 'success' });
      } else {
        await customersService.createCustomer(formData);
        setSnackbar({ open: true, message: 'New customer added!', severity: 'success' });
      }
      setCustomerModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Operation failed',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      await customersService.deleteCustomer(selectedCustomer.id);
      setSnackbar({ open: true, message: 'Customer removed from system', severity: 'success' });
      setDeleteConfirmOpen(false);
      fetchCustomers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete customer', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
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
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#4E3629' }}>
            Client Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Showroom client accounts, purchase histories, and lifetime valuation ({totalCount} total registered clients)
          </Typography>
        </Box>

        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
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
            Add New Client
          </Button>
        )}
      </Box>

      {/* Search Toolbar */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search clients by name, phone, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8D6E63' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#FAF9F7' } }}
          />
        </form>
      </Card>

      {/* Customer Table */}
      {loading ? (
        <LoadingState message="Fetching client directory..." skeletonType="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCustomers} />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Try modifying your search query or create a new client account."
          actionText={canManage ? 'Add New Client' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <Card elevation={0} sx={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Contact Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Total Orders</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Lifetime Spend</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Last Purchase</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#4E3629', width: 38, height: 38, fontWeight: 700, fontSize: '0.9rem' }}>
                          {c.name ? c.name[0] : 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            Client ID: #{c.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#444' }}>{c.phone || '-'}</Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>{c.email || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.city || '-'}</Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>{c.state || ''}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.orders_count || 0} orders</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#4E3629' }}>
                      ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ color: '#777', fontSize: '0.85rem' }}>
                      {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View History & Details">
                        <IconButton size="small" onClick={() => handleOpenDetail(c.id)} sx={{ color: '#8D6E63' }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canManage && (
                        <Tooltip title="Edit Profile">
                          <IconButton size="small" onClick={() => handleOpenEdit(c)} sx={{ color: '#4E3629', ml: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {role === 'ADMIN' && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{ color: '#D32F2F', ml: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, val) => setPage(val)}
            sx={{ '& .Mui-selected': { backgroundColor: '#4E3629 !important', color: '#FFF' } }}
          />
        </Box>
      )}

      {/* Client Profile & Past Orders Dialog */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629' }}>
          Client Profile: {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          {/* Quick info banner */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, borderRadius: '10px', backgroundColor: '#FAF9F7', border: '1px solid #ECEAE7' }}>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>CONTACT</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedCustomer?.phone || 'No phone'}</Typography>
                <Typography variant="caption" sx={{ color: '#777' }}>{selectedCustomer?.email || 'No email'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, borderRadius: '10px', backgroundColor: '#FAF9F7', border: '1px solid #ECEAE7' }}>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>DELIVERY ADDRESS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{selectedCustomer?.address || 'Showroom client'}</Typography>
                <Typography variant="caption" sx={{ color: '#777' }}>{selectedCustomer?.city}, {selectedCustomer?.state} - {selectedCustomer?.pincode}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, borderRadius: '10px', backgroundColor: '#FAF5EE', border: '1px solid #ECE0D1' }}>
                <Typography variant="caption" sx={{ color: '#7B5E4F', fontWeight: 600 }}>LIFETIME VALUE</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4E3629', mt: 0.5 }}>
                  ₹{Number(selectedCustomer?.total_spent || 0).toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8D6E63' }}>{customerOrders.length} orders placed</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Past orders */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#4E3629', mt: 1 }}>
            Past Purchases & Orders
          </Typography>

          {customerOrders.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#777', fontStyle: 'italic', py: 2 }}>
              No orders registered for this client yet.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECEAE7', borderRadius: '10px' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>#{o.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>₹{Number(o.total_amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell><StatusChip status={o.payment_status} type="payment" /></TableCell>
                      <TableCell><StatusChip status={o.order_status} type="order" /></TableCell>
                      <TableCell align="right" sx={{ color: '#777' }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ color: '#4E3629', fontWeight: 600 }}>
            Close Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Customer Modal */}
      <Dialog
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629' }}>
          {selectedCustomer ? 'Edit Client Details' : 'Add New Client'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Vikram Malhotra"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98201 12345"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@gmail.com"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Street Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Apt 4B, Emerald Heights, Worli"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Maharashtra"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="400018"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCustomerModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomer}
            disabled={saving}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : selectedCustomer ? 'Update Client' : 'Save Client'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Client Record"
        message={`Are you sure you want to remove '${selectedCustomer?.name}' from the client directory?`}
        confirmText="Delete Client"
        isDanger={true}
        loading={saving}
        onConfirm={handleDeleteCustomer}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

export default Customers;
