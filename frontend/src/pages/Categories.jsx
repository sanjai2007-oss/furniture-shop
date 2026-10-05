import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  CategoryRounded as CategoryIcon,
  WeekendRounded as LivingIcon,
  BedRounded as BedIcon,
  RestaurantRounded as DiningIcon,
  DeskRounded as OfficeIcon,
  DeckRounded as OutdoorIcon,
  StorageRounded as StorageIcon,
} from '@mui/icons-material';
import { categoriesService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, ConfirmDialog } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const getCategoryIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('living')) return <LivingIcon />;
  if (n.includes('bed')) return <BedIcon />;
  if (n.includes('dining')) return <DiningIcon />;
  if (n.includes('office')) return <OfficeIcon />;
  if (n.includes('outdoor')) return <OutdoorIcon />;
  if (n.includes('storage') || n.includes('accent')) return <StorageIcon />;
  return <CategoryIcon />;
};

const Categories = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesService.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setFormData({ name: cat.name || '', description: cat.description || '' });
    setModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name) {
      setSnackbar({ open: true, message: 'Category name is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (selectedCategory) {
        await categoriesService.updateCategory(selectedCategory.id, formData);
        setSnackbar({ open: true, message: 'Category updated!', severity: 'success' });
      } else {
        await categoriesService.createCategory(formData);
        setSnackbar({ open: true, message: 'New furniture category created!', severity: 'success' });
      }
      setModalOpen(false);
      fetchCategories();
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

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      await categoriesService.deleteCategory(selectedCategory.id);
      setSnackbar({ open: true, message: 'Category deleted.', severity: 'success' });
      setDeleteConfirmOpen(false);
      fetchCategories();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
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
            Furniture Collections & Categories
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Organize catalog classifications, showroom zones, and item groupings
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
            Create Category
          </Button>
        )}
      </Box>

      {/* Main Grid */}
      {loading ? (
        <LoadingState message="Fetching furniture categories..." skeletonType="card" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories created yet"
          actionText={canManage ? 'Create Category' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <Grid container spacing={3}>
          {categories.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECEAE7',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#FAF5EE',
                        color: '#4E3629',
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                      }}
                    >
                      {getCategoryIcon(c.name)}
                    </Avatar>

                    <Chip
                      label={`${c.product_count || 0} Products`}
                      size="small"
                      sx={{
                        backgroundColor: '#F5EFEB',
                        color: '#4E3629',
                        fontWeight: 700,
                        borderRadius: '6px',
                      }}
                    />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#333333', mb: 1 }}>
                    {c.name}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.6 }}>
                    {c.description || 'No description provided for this collection.'}
                  </Typography>
                </Box>

                {canManage && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 0.5,
                      mt: 3,
                      pt: 1.5,
                      borderTop: '1px solid #F0EEEB',
                    }}
                  >
                    <Tooltip title="Edit Category">
                      <IconButton size="small" onClick={() => handleOpenEdit(c)} sx={{ color: '#4E3629' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {role === 'ADMIN' && (
                      <Tooltip title="Delete Category">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCategory(c);
                            setDeleteConfirmOpen(true);
                          }}
                          sx={{ color: '#D32F2F' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Category Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629' }}>
          {selectedCategory ? 'Edit Category' : 'Create Furniture Category'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            fullWidth
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Living Room, Bedroom"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the items curated under this category..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
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
            {saving ? <CircularProgress size={22} color="inherit" /> : selectedCategory ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Category"
        message={`Are you sure you want to delete '${selectedCategory?.name}'? Note that existing products in this category will become uncategorized.`}
        confirmText="Delete Category"
        isDanger={true}
        loading={saving}
        onConfirm={handleDeleteCategory}
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

export default Categories;
