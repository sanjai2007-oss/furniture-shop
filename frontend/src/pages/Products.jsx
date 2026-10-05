import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  GridViewRounded as GridViewIcon,
  TableRowsRounded as TableViewIcon,
  AddCircleOutlineRounded as StockAdjustIcon,
  PhotoCameraRounded as UploadPhotoIcon,
  FilterListRounded as FilterIcon,
} from '@mui/icons-material';
import { productsService, categoriesService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, ConfirmDialog, StatusChip } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER';

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockTab, setStockTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal dialog states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product form data
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    discount: '0',
    stock_quantity: '',
    minimum_stock_level: '4',
    image_url: '',
    description: '',
  });

  // Stock adjust form
  const [stockAdjustData, setStockAdjustData] = useState({
    operation: 'add',
    quantity: '1',
    reason: 'Restocking shipment',
  });

  // Notification snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoriesService.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch {
        // quiet fallback
      }
    };
    fetchCats();
  }, []);

  // Fetch products on filter changes
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        search: search.trim() || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
      };

      if (stockTab === 'available') params.stock_status = 'available';
      if (stockTab === 'low_stock') params.stock_status = 'low stock';
      if (stockTab === 'out_of_stock') params.stock_status = 'out of stock';

      const res = await productsService.getProducts(params);
      if (res.success) {
        setProducts(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.total_pages);
          setTotalCount(res.pagination.total);
        }
      } else {
        setError(res.message || 'Failed to retrieve products');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, stockTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      sku: `FUR-${Math.floor(100 + Math.random() * 900)}`,
      price: '',
      discount: '0',
      stock_quantity: '5',
      minimum_stock_level: '3',
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      description: '',
    });
    setProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      category_id: prod.category_id || '',
      sku: prod.sku,
      price: String(prod.price),
      discount: String(prod.discount || '0'),
      stock_quantity: String(prod.stock_quantity),
      minimum_stock_level: String(prod.minimum_stock_level),
      image_url: prod.image_url || '',
      description: prod.description || '',
    });
    setProductModalOpen(true);
  };

  // Open Stock Adjust Modal
  const handleOpenStockAdjust = (prod) => {
    setSelectedProduct(prod);
    setStockAdjustData({
      operation: 'add',
      quantity: '5',
      reason: 'Standard showroom restock',
    });
    setStockModalOpen(true);
  };

  // Open Delete Confirm
  const handleOpenDelete = (prod) => {
    setSelectedProduct(prod);
    setDeleteConfirmOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async () => {
    if (!formData.name || !formData.sku || !formData.price) {
      setSnackbar({ open: true, message: 'Please fill in Name, SKU, and Price.', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        sku: formData.sku,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount || '0'),
        stock_quantity: parseInt(formData.stock_quantity || '0', 10),
        minimum_stock_level: parseInt(formData.minimum_stock_level || '1', 10),
        image_url: formData.image_url,
        description: formData.description,
      };

      if (selectedProduct) {
        await productsService.updateProduct(selectedProduct.id, payload);
        setSnackbar({ open: true, message: 'Product updated successfully!', severity: 'success' });
      } else {
        await productsService.createProduct(payload);
        setSnackbar({ open: true, message: 'New furniture item created!', severity: 'success' });
      }

      setProductModalOpen(false);
      fetchProducts();
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

  // Adjust Stock Submit
  const handleSaveStockAdjust = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await productsService.updateStock(selectedProduct.id, {
        operation: stockAdjustData.operation,
        quantity: parseInt(stockAdjustData.quantity, 10),
        reason: stockAdjustData.reason,
      });
      setSnackbar({ open: true, message: 'Stock quantity updated!', severity: 'success' });
      setStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Stock adjustment failed',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await productsService.deleteProduct(selectedProduct.id);
      setSnackbar({ open: true, message: 'Product removed from catalog.', severity: 'success' });
      setDeleteConfirmOpen(false);
      fetchProducts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to delete product',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Image Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await productsService.uploadImage(file);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.data.url }));
        setSnackbar({ open: true, message: 'Photo uploaded successfully!', severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Photo upload failed. You can paste an image URL.', severity: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Action Bar */}
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
            Furniture Catalog
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Manage showcase pieces, SKU configurations, and inventory status ({totalCount} total items)
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
            Add Furniture Piece
          </Button>
        )}
      </Box>

      {/* Filter and View Toolbar */}
      <Card
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #ECEAE7',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search bar */}
          <Grid item xs={12} md={4}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search furniture by title, SKU, or style..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8D6E63' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: '#FAF9F7',
                  },
                }}
              />
            </form>
          </Grid>

          {/* Category Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ borderRadius: '10px', backgroundColor: '#FAF9F7' }}
              >
                <MenuItem value="">All Collections</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.product_count || 0})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Stock Filter Tabs */}
          <Grid item xs={12} sm={6} md={3.5}>
            <Tabs
              value={stockTab}
              onChange={(e, val) => {
                setStockTab(val);
                setPage(1);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 38,
                '& .MuiTab-root': {
                  minHeight: 38,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#777',
                  '&.Mui-selected': { color: '#4E3629' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#4E3629' },
              }}
            >
              <Tab label="All" value="all" />
              <Tab label="In Stock" value="available" />
              <Tab label="Low Stock" value="low_stock" />
              <Tab label="Out" value="out_of_stock" />
            </Tabs>
          </Grid>

          {/* View mode toggle */}
          <Grid item xs={12} md={1.5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="Visual Grid">
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  backgroundColor: viewMode === 'grid' ? '#EFE7E1' : '#FAF9F7',
                  color: viewMode === 'grid' ? '#4E3629' : '#888',
                  borderRadius: '8px',
                }}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Data Table">
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  backgroundColor: viewMode === 'table' ? '#EFE7E1' : '#FAF9F7',
                  color: viewMode === 'table' ? '#4E3629' : '#888',
                  borderRadius: '8px',
                }}
              >
                <TableViewIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <LoadingState message="Fetching furniture catalog..." skeletonType={viewMode === 'grid' ? 'card' : 'table'} count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No furniture items found"
          description="Try adjusting your filter options or add a new piece to your showroom catalog."
          actionText={canManage ? 'Add New Furniture' : null}
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'grid' ? (
        /* Visual Cards Grid */
        <Grid container spacing={3}>
          {products.map((p) => {
            const hasDiscount = p.discount > 0;
            const discountedPrice = hasDiscount ? p.price - (p.price * p.discount) / 100 : p.price;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #ECEAE7',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  {/* Photo Container */}
                  <Box sx={{ position: 'relative', height: 210, backgroundColor: '#FAF8F5' }}>
                    <CardMedia
                      component="img"
                      image={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'}
                      alt={p.name}
                      sx={{ height: '100%', objectFit: 'cover' }}
                    />
                    {hasDiscount && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: '#D32F2F',
                          color: '#FFFFFF',
                          px: 1.2,
                          py: 0.4,
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {p.discount}% OFF
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                      <StatusChip status={p.status} type="stock" />
                    </Box>
                  </Box>

                  {/* Body Info */}
                  <CardContent sx={{ p: 2.2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" sx={{ color: '#8D6E63', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {p.category?.name || 'General Furniture'} • {p.sku}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#333333',
                        fontSize: '1.05rem',
                        mt: 0.4,
                        mb: 1,
                        lineHeight: 1.3,
                        height: 42,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {p.name}
                    </Typography>

                    {/* Pricing */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 'auto', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#4E3629' }}>
                        ₹{Number(discountedPrice).toLocaleString('en-IN')}
                      </Typography>
                      {hasDiscount && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#9E9E9E' }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </Typography>
                      )}
                    </Box>

                    {/* Stock level info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #F0EEEB' }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                        In Stock: <strong style={{ color: p.stock_quantity <= p.minimum_stock_level ? '#D32F2F' : '#2E7D32' }}>{p.stock_quantity} units</strong>
                      </Typography>

                      {canManage && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Adjust Stock">
                            <IconButton size="small" onClick={() => handleOpenStockAdjust(p)} sx={{ color: '#8D6E63' }}>
                              <StockAdjustIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Product">
                            <IconButton size="small" onClick={() => handleOpenEdit(p)} sx={{ color: '#4E3629' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {role === 'ADMIN' && (
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleOpenDelete(p)} sx={{ color: '#D32F2F' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Data Table View */
        <Card elevation={0} sx={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Discount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Stock Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Status</TableCell>
                  {canManage && <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          component="img"
                          src={p.image_url}
                          alt={p.name}
                          sx={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>
                          {p.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#666', fontFamily: 'monospace' }}>{p.sku}</TableCell>
                    <TableCell>{p.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{p.discount > 0 ? `${p.discount}%` : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.stock_quantity}</TableCell>
                    <TableCell>
                      <StatusChip status={p.status} type="stock" />
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Tooltip title="Adjust Stock">
                          <IconButton size="small" onClick={() => handleOpenStockAdjust(p)} sx={{ color: '#8D6E63', mr: 0.5 }}>
                            <StockAdjustIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Product">
                          <IconButton size="small" onClick={() => handleOpenEdit(p)} sx={{ color: '#4E3629', mr: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {role === 'ADMIN' && (
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleOpenDelete(p)} sx={{ color: '#D32F2F' }}>
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
            color="primary"
            sx={{
              '& .Mui-selected': {
                backgroundColor: '#4E3629 !important',
                color: '#FFFFFF',
              },
            }}
          />
        </Box>
      )}

      {/* Create / Edit Product Dialog */}
      <Dialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#4E3629' }}>
          {selectedProduct ? 'Edit Furniture Piece' : 'Add New Furniture Collection Item'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Royal Teak 6-Seater Dining Table"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category_id}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="SKU Identifier"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="LIV-SOF-001"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Retail Price (INR)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="24999"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Discount (%)"
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="0"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Stock Quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="10"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Stock Threshold"
                type="number"
                value={formData.minimum_stock_level}
                onChange={(e) => setFormData({ ...formData, minimum_stock_level: e.target.value })}
                placeholder="3"
                helperText="Triggers low-stock warnings when inventory drops below this number"
              />
            </Grid>

            {/* Photo preview & upload */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
                <Box
                  component="img"
                  src={formData.image_url || 'https://via.placeholder.com/150'}
                  alt="Preview"
                  sx={{
                    width: 100,
                    height: 80,
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '1px solid #ECEAE7',
                    backgroundColor: '#FAF9F7',
                  }}
                />
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Product Photo URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadPhotoIcon />}
                  disabled={uploadingImage}
                  sx={{
                    borderColor: '#DDD8D3',
                    color: '#4E3629',
                    borderRadius: '10px',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Product Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe material (e.g. solid teak, walnut veneer), craftsmanship, dimensions, and cushioning details..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProductModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
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
            {saving ? <CircularProgress size={22} color="inherit" /> : selectedProduct ? 'Update Product' : 'Add to Catalog'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#4E3629' }}>
          Adjust Stock for {selectedProduct?.name}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <Typography variant="body2" sx={{ color: '#777' }}>
            Current stock: <strong>{selectedProduct?.stock_quantity} units</strong> (SKU: {selectedProduct?.sku})
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Operation Type</InputLabel>
            <Select
              value={stockAdjustData.operation}
              label="Operation Type"
              onChange={(e) => setStockAdjustData({ ...stockAdjustData, operation: e.target.value })}
            >
              <MenuItem value="add">Add Stock (Purchase / Arrival)</MenuItem>
              <MenuItem value="subtract">Subtract Stock (Damage / Scrap / Loss)</MenuItem>
              <MenuItem value="set">Set Exact Count (Physical Inventory Count)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Quantity Units"
            type="number"
            value={stockAdjustData.quantity}
            onChange={(e) => setStockAdjustData({ ...stockAdjustData, quantity: e.target.value })}
          />

          <TextField
            fullWidth
            size="small"
            label="Reason for Adjustment"
            value={stockAdjustData.reason}
            onChange={(e) => setStockAdjustData({ ...stockAdjustData, reason: e.target.value })}
            placeholder="e.g. New timber shipment received"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStockAdjust}
            disabled={saving}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Confirm Stock Adjustment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Remove Furniture Item"
        message={`Are you sure you want to permanently delete '${selectedProduct?.name}' (${selectedProduct?.sku}) from the store catalog?`}
        confirmText="Delete Furniture Item"
        isDanger={true}
        loading={saving}
        onConfirm={handleDeleteProduct}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;
