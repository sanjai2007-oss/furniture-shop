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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  LocalShippingRounded as SupplierIcon,
  PhoneOutlined as PhoneIcon,
  MailOutlineRounded as MailIcon,
  BusinessOutlined as CompanyIcon,
} from '@mui/icons-material';
import { suppliersService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, ConfirmDialog } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Suppliers = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
      };
      const res = await suppliersService.getSuppliers(params);
      if (res.success) {
        setSuppliers(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.total_pages);
          setTotalCount(res.pagination.total);
        }
      } else {
        setError(res.message || 'Failed to load suppliers');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: '',
    });
    setSupplierModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name || '',
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      city: sup.city || '',
    });
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name) {
      setSnackbar({ open: true, message: 'Supplier company name is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (selectedSupplier) {
        await suppliersService.updateSupplier(selectedSupplier.id, formData);
        setSnackbar({ open: true, message: 'Supplier updated successfully!', severity: 'success' });
      } else {
        await suppliersService.createSupplier(formData);
        setSnackbar({ open: true, message: 'New supplier verified and saved!', severity: 'success' });
      }
      setSupplierModalOpen(false);
      fetchSuppliers();
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

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    setSaving(true);
    try {
      await suppliersService.deleteSupplier(selectedSupplier.id);
      setSnackbar({ open: true, message: 'Supplier removed', severity: 'success' });
      setDeleteConfirmOpen(false);
      fetchSuppliers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete supplier', severity: 'error' });
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
            Timber & Fabric Suppliers
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Verified suppliers for raw timber, leather fabrics, and hardware fittings ({totalCount} verified partners)
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
            Add Supplier
          </Button>
        )}
      </Box>

      {/* Search Toolbar */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search suppliers by business name, contact person, or city..."
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

      {/* Suppliers Table */}
      {loading ? (
        <LoadingState message="Loading supplier directory..." skeletonType="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSuppliers} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          description="Add verified suppliers to manage raw material fulfillment."
          actionText={canManage ? 'Add Supplier' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <Card elevation={0} sx={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Supplier Enterprise</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Contact Representative</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Phone & Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Address & City</TableCell>
                  {canManage && <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#FAF5EE', color: '#8D6E63', width: 38, height: 38, borderRadius: '10px' }}>
                          <CompanyIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                            {s.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#888' }}>
                            ID: #{s.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{s.contact_person || 'Representative'}</TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                    <TableCell>{s.email || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.address || '-'}</Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>{s.city || ''}</Typography>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Tooltip title="Edit Supplier">
                          <IconButton size="small" onClick={() => handleOpenEdit(s)} sx={{ color: '#4E3629', mr: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {role === 'ADMIN' && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSupplier(s);
                                setDeleteConfirmOpen(true);
                              }}
                              sx={{ color: '#D32F2F' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
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

      {/* Add / Edit Supplier Modal */}
      <Dialog
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629' }}>
          {selectedSupplier ? 'Edit Supplier' : 'Register New Material Supplier'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            fullWidth
            label="Supplier Company Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Apex Teak & Timber Ltd"
          />

          <TextField
            fullWidth
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98112 34567"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@apexteak.com"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Warehouse Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Plot 45, Timber Market, Kirti Nagar"
          />

          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="New Delhi"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSupplierModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSupplier}
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
            {saving ? <CircularProgress size={22} color="inherit" /> : selectedSupplier ? 'Update Supplier' : 'Save Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Supplier Record"
        message={`Are you sure you want to remove supplier '${selectedSupplier?.name}'?`}
        confirmText="Delete Supplier"
        isDanger={true}
        loading={saving}
        onConfirm={handleDeleteSupplier}
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

export default Suppliers;
