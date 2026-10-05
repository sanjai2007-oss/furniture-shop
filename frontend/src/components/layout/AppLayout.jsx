import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardRounded as DashboardIcon,
  WeekendRounded as ProductsIcon,
  Inventory2Rounded as InventoryIcon,
  ReceiptLongRounded as OrdersIcon,
  TrendingUpRounded as SalesIcon,
  PeopleAltRounded as CustomersIcon,
  LocalShippingRounded as SuppliersIcon,
  CategoryRounded as CategoriesIcon,
  AssessmentRounded as ReportsIcon,
  NotificationsNoneRounded as NotificationsIcon,
  LogoutRounded as LogoutIcon,
  PersonOutlineRounded as ProfileIcon,
  StorefrontRounded as StoreIcon,
  ManageAccountsRounded as UsersIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/api';

const DRAWER_WIDTH = 260;

const navItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Products Catalog', path: '/products', icon: <ProductsIcon /> },
  { text: 'Inventory & Stock', path: '/inventory', icon: <InventoryIcon /> },
  { text: 'Orders & Sales', path: '/orders', icon: <OrdersIcon /> },
  { text: 'Sales & Revenue', path: '/sales', icon: <SalesIcon /> },
  { text: 'Customers', path: '/customers', icon: <CustomersIcon /> },
  { text: 'Suppliers', path: '/suppliers', icon: <SuppliersIcon /> },
  { text: 'Categories', path: '/categories', icon: <CategoriesIcon /> },
  { text: 'Reports & BI', path: '/reports', icon: <ReportsIcon /> },
];

const adminNavItems = [
  { text: 'User Management', path: '/users', icon: <UsersIcon /> },
];

const AppLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await dashboardService.getLowStock();
        if (res.success && res.data) {
          setLowStockCount(res.data.length);
        }
      } catch {
        // quiet error
      }
    };
    fetchAlerts();
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  // Find active title — covers main nav, admin nav, and special routes
  const allNavItems = [...navItems, ...adminNavItems];
  const currentNav = allNavItems.find((item) => location.pathname.startsWith(item.path));
  const specialTitles = { '/profile': 'My Profile & Settings', '/users': 'User Management' };
  const currentTitle = specialTitles[location.pathname] || (currentNav ? currentNav.text : 'FurniCraft Management');

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => {
          navigate('/dashboard');
          if (isMobile) setMobileOpen(false);
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#4E3629',
            width: 42,
            height: 42,
            boxShadow: '0 2px 8px rgba(78, 54, 41, 0.25)',
          }}
        >
          <StoreIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
        </Avatar>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#4E3629',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            FurniCraft
          </Typography>
          <Typography variant="caption" sx={{ color: '#8D6E63', fontWeight: 600, letterSpacing: '0.04em' }}>
            STUDIO & ATELIER
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#F0EEEB', mx: 2 }} />

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, px: 2, py: 2 }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            pb: 1,
            display: 'block',
            fontWeight: 700,
            color: '#9E9E9E',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.7rem',
          }}
        >
          Operations & Store
        </Typography>

        <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '10px',
                    py: 1.1,
                    px: 1.8,
                    backgroundColor: isActive ? '#F5EFEB' : 'transparent',
                    color: isActive ? '#4E3629' : '#555555',
                    '&:hover': {
                      backgroundColor: isActive ? '#EFE7E1' : '#FAF8F5',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 38,
                      color: isActive ? '#4E3629' : '#8D6E63',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                  {item.text === 'Inventory & Stock' && lowStockCount > 0 && (
                    <Chip
                      size="small"
                      label={lowStockCount}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#FFEBEE',
                        color: '#C62828',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Admin-only section */}
        {user?.role === 'ADMIN' && (
          <>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                pb: 1,
                mt: 2,
                display: 'block',
                fontWeight: 700,
                color: '#9E9E9E',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.7rem',
              }}
            >
              Administration
            </Typography>
            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: '10px',
                        py: 1.1,
                        px: 1.8,
                        backgroundColor: isActive ? '#F5EFEB' : 'transparent',
                        color: isActive ? '#4E3629' : '#555555',
                        '&:hover': {
                          backgroundColor: isActive ? '#EFE7E1' : '#FAF8F5',
                        },
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38, color: isActive ? '#4E3629' : '#8D6E63' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>

      {/* User Footer Profile */}
      <Box
        sx={{
          p: 2,
          m: 1.5,
          borderRadius: '12px',
          backgroundColor: '#FAF9F7',
          border: '1px solid #EFECE7',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#F5EFEB' },
          transition: 'background-color 0.15s ease',
        }}
        onClick={() => {
          navigate('/profile');
          if (isMobile) setMobileOpen(false);
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: '#8D6E63',
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          {user?.name ? user.name[0] : 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#333' }}>
            {user?.name || 'Authorized Staff'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
            <Chip
              size="small"
              label={user?.role || 'STAFF'}
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                backgroundColor: '#E8F5E9',
                color: '#2E7D32',
                borderRadius: '4px',
              }}
            />
          </Box>
        </Box>
        <Tooltip title="Logout">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            sx={{ color: '#888', '&:hover': { color: '#D32F2F' } }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F7F5' }}>
      {/* Top Application Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #ECEAE7',
          color: '#212121',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { md: 'none' }, color: '#4E3629' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#4E3629', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
              {currentTitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={`${lowStockCount} Low stock alerts`}>
              <IconButton
                size="medium"
                onClick={() => navigate('/inventory')}
                sx={{
                  color: '#616161',
                  backgroundColor: '#F5F5F3',
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: '#ECEAE7' },
                }}
              >
                <Badge badgeContent={lowStockCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Box
              onClick={handleUserMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                cursor: 'pointer',
                p: 0.5,
                pl: 1,
                borderRadius: '24px',
                backgroundColor: '#FAF9F7',
                border: '1px solid #ECEAE7',
                '&:hover': { backgroundColor: '#F0EDE8' },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#4E3629',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {user?.name ? user.name[0] : 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, pr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', lineHeight: 1.1 }}>
                  {user?.name?.split(' ')[0] || 'Admin'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                  {user?.role || 'ADMIN'}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  mt: 1.5,
                  minWidth: 180,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid #ECEAE7',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4E3629' }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#777' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={() => { handleUserMenuClose(); navigate('/profile'); }}
                sx={{ gap: 1, fontSize: '0.9rem' }}
              >
                <ProfileIcon fontSize="small" sx={{ color: '#4E3629' }} />
                My Profile
              </MenuItem>
              {user?.role === 'ADMIN' && (
                <MenuItem
                  onClick={() => { handleUserMenuClose(); navigate('/users'); }}
                  sx={{ gap: 1, fontSize: '0.9rem' }}
                >
                  <UsersIcon fontSize="small" sx={{ color: '#4E3629' }} />
                  User Management
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#D32F2F', gap: 1 }}>
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation mailbox"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Permanent Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #ECEAE7',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#F7F7F5',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;
