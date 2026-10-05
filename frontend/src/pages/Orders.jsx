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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
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
  ReceiptLongRounded as ReceiptIcon,
  VisibilityOutlined as ViewIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutlineRounded as PaidIcon,
  PrintRounded as PrintIcon,
  RemoveCircleOutlineRounded as RemoveItemIcon,
  LocalShippingOutlined as ShippingIcon,
} from '@mui/icons-material';
import { ordersService, customersService, productsService } from '../services/api';
import { LoadingState, EmptyState, ErrorState, ConfirmDialog, StatusChip } from '../components/common/StateViews';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'MANAGER' || role === 'STAFF';

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create Order Modal (POS)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer_id: '',
    shipping_address: '',
    discount: '0',
    payment_status: 'Paid',
    order_status: 'Confirmed',
    items: [], // [{ product_id, product_name, price, quantity, max_stock, image_url }]
  });
  const [currentLineItem, setCurrentLineItem] = useState({
    product_id: '',
    quantity: '1',
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch initial auxiliary data
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          customersService.getCustomers({ limit: 100 }),
          productsService.getProducts({ limit: 100 }),
        ]);
        if (cRes.success && cRes.data) setCustomers(cRes.data);
        if (pRes.success && pRes.data) setAvailableProducts(pRes.data);
      } catch {
        // quiet fallback
      }
    };
    fetchAuxData();
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        search: search.trim() || undefined,
        order_status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_status: paymentFilter || undefined,
      };
      const res = await ordersService.getOrders(params);
      if (res.success) {
        setOrders(res.data || []);
        if (res.pagination) setTotalPages(res.pagination.total_pages);
      } else {
        setError(res.message || 'Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter]);

  // Open Order Details
  const handleOpenDetail = async (orderId) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await ordersService.getOrder(orderId);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      }
    } catch {
      setSnackbar({ open: true, message: 'Could not load order details', severity: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Status Change in Detail Modal
  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder) return;
    try {
      const res = await ordersService.updateOrderStatus(selectedOrder.id, {
        order_status: newStatus,
      });
      if (res.success && res.data) {
        setSelectedOrder(res.data);
        setSnackbar({ open: true, message: `Order status updated to ${newStatus}`, severity: 'success' });
        fetchOrders();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to update status',
        severity: 'error',
      });
    }
  };

  // Payment Status Change
  const handlePaymentStatusChange = async (newPayment) => {
    if (!selectedOrder) return;
    try {
      const res = await ordersService.updateOrderStatus(selectedOrder.id, {
        payment_status: newPayment,
      });
      if (res.success && res.data) {
        setSelectedOrder(res.data);
        setSnackbar({ open: true, message: `Payment updated to ${newPayment}`, severity: 'success' });
        fetchOrders();
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update payment status', severity: 'error' });
    }
  };

  // Open Create Order Modal
  const handleOpenCreate = () => {
    setOrderForm({
      customer_id: customers.length > 0 ? customers[0].id : '',
      shipping_address: customers.length > 0 ? customers[0].address || '' : '',
      discount: '0',
      payment_status: 'Paid',
      order_status: 'Confirmed',
      items: [],
    });
    setCurrentLineItem({
      product_id: availableProducts.length > 0 ? availableProducts[0].id : '',
      quantity: '1',
    });
    setCreateModalOpen(true);
  };

  // Add line item in form
  const handleAddLineItem = () => {
    if (!currentLineItem.product_id) return;
    const prod = availableProducts.find((p) => p.id === Number(currentLineItem.product_id));
    if (!prod) return;

    const qty = parseInt(currentLineItem.quantity, 10) || 1;
    if (qty > prod.stock_quantity) {
      setSnackbar({
        open: true,
        message: `Only ${prod.stock_quantity} units available in showroom inventory!`,
        severity: 'warning',
      });
      return;
    }

    // Check if already in items list
    const existingIndex = orderForm.items.findIndex((item) => item.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...orderForm.items];
      updated[existingIndex].quantity += qty;
      setOrderForm({ ...orderForm, items: updated });
    } else {
      setOrderForm({
        ...orderForm,
        items: [
          ...orderForm.items,
          {
            product_id: prod.id,
            product_name: prod.name,
            price: prod.price,
            discount: prod.discount,
            quantity: qty,
            max_stock: prod.stock_quantity,
            image_url: prod.image_url,
          },
        ],
      });
    }
  };

  const handleRemoveLineItem = (index) => {
    const updated = [...orderForm.items];
    updated.splice(index, 1);
    setOrderForm({ ...orderForm, items: updated });
  };

  // Calculate order totals
  const subtotal = orderForm.items.reduce((acc, item) => {
    const unitPrice = item.discount > 0 ? item.price - (item.price * item.discount) / 100 : item.price;
    return acc + unitPrice * item.quantity;
  }, 0);
  const discountVal = parseFloat(orderForm.discount || '0') || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);

  // Submit Order
  const handleSaveOrder = async () => {
    if (!orderForm.customer_id) {
      setSnackbar({ open: true, message: 'Please select a customer for this order.', severity: 'error' });
      return;
    }
    if (orderForm.items.length === 0) {
      setSnackbar({ open: true, message: 'Please add at least one furniture piece.', severity: 'error' });
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        customer_id: Number(orderForm.customer_id),
        discount: discountVal,
        payment_status: orderForm.payment_status,
        order_status: orderForm.order_status,
        shipping_address: orderForm.shipping_address,
        items: orderForm.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          price: it.price,
        })),
      };

      await ordersService.createOrder(payload);
      setSnackbar({ open: true, message: 'Order created successfully & stock updated!', severity: 'success' });
      setCreateModalOpen(false);
      fetchOrders();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to submit order',
        severity: 'error',
      });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await ordersService.deleteOrder(orderToDelete.id);
      setSnackbar({ open: true, message: 'Order record deleted.', severity: 'success' });
      setDeleteConfirmOpen(false);
      fetchOrders();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete order', severity: 'error' });
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
            Customer Orders & Sales
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575', mt: 0.3 }}>
            Point-of-sale order placement, fulfillment pipeline, and printable bills
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
            Create New Order
          </Button>
        )}
      </Box>

      {/* Filter and Status Toolbar */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search bar */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Order ID, customer, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8D6E63' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#FAF9F7' } }}
            />
          </Grid>

          {/* Payment Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={paymentFilter}
                label="Payment Status"
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ borderRadius: '10px', backgroundColor: '#FAF9F7' }}
              >
                <MenuItem value="">All Payments</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status Tabs */}
          <Grid item xs={12} md={5}>
            <Tabs
              value={statusFilter}
              onChange={(e, val) => {
                setStatusFilter(val);
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
              <Tab label="Pending" value="Pending" />
              <Tab label="Confirmed" value="Confirmed" />
              <Tab label="Processing" value="Processing" />
              <Tab label="Shipped" value="Shipped" />
              <Tab label="Delivered" value="Delivered" />
              <Tab label="Cancelled" value="Cancelled" />
            </Tabs>
          </Grid>
        </Grid>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <LoadingState message="Fetching store orders..." skeletonType="table" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="There are no client orders matching your search or status filter."
          actionText={canManage ? 'Create New Order' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <Card elevation={0} sx={{ borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #ECEAE7' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Client Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Order Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Fulfillment Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Date Placed</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>#{o.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {o.customer_name || 'Walk-in Client'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {o.customer_phone || ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{o.items_count} items</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#4E3629' }}>
                      ₹{Number(o.total_amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={o.payment_status} type="payment" />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={o.order_status} type="order" />
                    </TableCell>
                    <TableCell sx={{ color: '#777', fontSize: '0.85rem' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Receipt & Update Status">
                        <IconButton size="small" onClick={() => handleOpenDetail(o.id)} sx={{ color: '#4E3629' }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {role === 'ADMIN' && (
                        <Tooltip title="Delete Order">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setOrderToDelete(o);
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

      {/* Order Details & Bill Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Order Invoice #{selectedOrder?.id}</span>
          <Button
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ color: '#8D6E63', textTransform: 'none' }}
          >
            Print Invoice
          </Button>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '10px !important' }}>
          {loadingDetail ? (
            <LoadingState message="Fetching order invoice..." />
          ) : selectedOrder ? (
            <>
              {/* Order summary bar */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  backgroundColor: '#FAF9F7',
                  border: '1px solid #ECEAE7',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 3,
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>CLIENT DETAILS</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333' }}>
                    {selectedOrder.customer_name || 'Walk-in Client'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {selectedOrder.customer_phone} • {selectedOrder.customer?.email}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>SHIPPING ADDRESS</Typography>
                  <Typography variant="body2" sx={{ color: '#444', maxWidth: 260 }}>
                    {selectedOrder.shipping_address || 'Showroom Pickup'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>DATE PLACED</Typography>
                  <Typography variant="body2" sx={{ color: '#444' }}>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Status Update Controllers */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Update Order Status</InputLabel>
                  <Select
                    value={selectedOrder.order_status}
                    label="Update Order Status"
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Shipped">Shipped</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Cancelled" sx={{ color: '#D32F2F' }}>Cancelled (Restock Item)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={selectedOrder.payment_status}
                    label="Payment Status"
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  >
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Items Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECEAE7', borderRadius: '10px' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Furniture Item</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>Line Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedOrder.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {item.product_image && (
                              <Avatar variant="rounded" src={item.product_image} sx={{ width: 36, height: 36 }} />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.product_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: '#666' }}>{item.product_sku}</TableCell>
                        <TableCell>₹{Number(item.price).toLocaleString('en-IN')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#4E3629' }}>
                          ₹{Number(item.subtotal).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals Breakdown */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, pr: 2 }}>
                {selectedOrder.discount > 0 && (
                  <Typography variant="body2" sx={{ color: '#D32F2F', fontWeight: 600 }}>
                    Applied Order Discount: -₹{Number(selectedOrder.discount).toLocaleString('en-IN')}
                  </Typography>
                )}
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629' }}>
                  Grand Total: ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ color: '#4E3629', fontWeight: 600 }}>
            Close Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* POS Style Create New Order Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#4E3629' }}>
          Create New Customer Order (POS)
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '10px !important' }}>
          {/* Customer & Shipping Section */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Client</InputLabel>
                <Select
                  value={orderForm.customer_id}
                  label="Client"
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    setOrderForm({
                      ...orderForm,
                      customer_id: e.target.value,
                      shipping_address: cust?.address || '',
                    });
                  }}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.phone || c.city})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Delivery Address"
                value={orderForm.shipping_address}
                onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                placeholder="Street address, apartment, city..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* Line Item Picker */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4E3629' }}>
            Add Furniture Items
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={7}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Furniture Piece</InputLabel>
                <Select
                  value={currentLineItem.product_id}
                  label="Select Furniture Piece"
                  onChange={(e) => setCurrentLineItem({ ...currentLineItem, product_id: e.target.value })}
                >
                  {availableProducts.map((p) => (
                    <MenuItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                      {p.name} - ₹{Number(p.price).toLocaleString('en-IN')} ({p.stock_quantity} in stock)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Quantity"
                type="number"
                value={currentLineItem.quantity}
                onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: e.target.value })}
              />
            </Grid>

            <Grid item xs={6} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleAddLineItem}
                sx={{
                  borderColor: '#4E3629',
                  color: '#4E3629',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 0.9,
                  '&:hover': { backgroundColor: '#F5EFEB', borderColor: '#4E3629' },
                }}
              >
                + Add Item
              </Button>
            </Grid>
          </Grid>

          {/* Added Line Items Table */}
          {orderForm.items.length > 0 && (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECEAE7', borderRadius: '10px' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#FAF9F7' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Piece</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderForm.items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{it.product_name}</TableCell>
                      <TableCell>₹{Number(it.price).toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{it.quantity}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4E3629' }}>
                        ₹{Number(it.price * it.quantity).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(idx)}>
                          <RemoveItemIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Payment & Discount Controls */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Order Discount (INR)"
                type="number"
                value={orderForm.discount}
                onChange={(e) => setOrderForm({ ...orderForm, discount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={orderForm.payment_status}
                  label="Payment Status"
                  onChange={(e) => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                >
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Initial Status</InputLabel>
                <Select
                  value={orderForm.order_status}
                  label="Initial Status"
                  onChange={(e) => setOrderForm({ ...orderForm, order_status: e.target.value })}
                >
                  <MenuItem value="Confirmed">Confirmed</MenuItem>
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Total display box */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: '#FAF5EE',
              border: '1px solid #ECE0D1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#7B5E4F', fontWeight: 600 }}>
              {orderForm.items.length} piece(s) selected
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#4E3629' }}>
              Final Amount: ₹{Number(grandTotal).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#777', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveOrder}
            disabled={submittingOrder}
            sx={{
              backgroundColor: '#4E3629',
              color: '#FFFFFF',
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#3E2723' },
            }}
          >
            {submittingOrder ? <CircularProgress size={22} color="inherit" /> : 'Confirm Order & Deduct Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Order Record"
        message={`Are you sure you want to delete order #${orderToDelete?.id}? This action cannot be undone.`}
        confirmText="Delete Order"
        isDanger={true}
        onConfirm={handleDeleteOrder}
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

export default Orders;
