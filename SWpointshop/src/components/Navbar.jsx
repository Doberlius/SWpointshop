import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Badge,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart,
  Stars as PointsIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';

const pages = [
  { title: 'หน้าหลัก', path: '/' },
  { title: 'สินค้า', path: '/products' },
];

const settings = [
  { title: 'โปรไฟล์', path: '/profile' },
  { title: 'ออเดอร์', path: '/orders' },
  { title: 'ลงชื่อเข้าใช้ออก', path: '/logout' },
];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuClick = (path) => {
    handleCloseUserMenu();
    if (path === '/logout') {
      logout();
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src="https://i.postimg.cc/RhHd4MJG/SW-logo.jpg"
              alt="SW Logo"
              sx={{
                height: 80,
                width: 'auto'
              }}
            />
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.title}
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate(page.path);
                  }}
                >
                  <Typography textAlign="center">{page.title}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src="https://i.postimg.cc/MHFnPxrb/SW-logo.jpg"
              alt="SW Logo"
              sx={{
                height: 40,
                width: 'auto'
              }}
            />
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.title}
                component={RouterLink}
                to={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.title}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Tooltip title="Balance">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WalletIcon />
                    <Typography>฿{Number(user.balance).toLocaleString()}</Typography>
                  </Box>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

                <Tooltip title="Points">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PointsIcon />
                    <Typography>{user.points}</Typography>
                  </Box>
                </Tooltip>

                <IconButton
                  component={RouterLink}
                  to="/cart"
                  color="inherit"
                >
                  <Badge badgeContent={cartItems.length} color="secondary">
                    <ShoppingCart />
                  </Badge>
                </IconButton>

                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={user.username} src="/static/images/avatar/2.jpg" />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {settings.map((setting) => (
                    <MenuItem
                      key={setting.title}
                      onClick={() => handleMenuClick(setting.path)}
                    >
                      <Typography textAlign="center">{setting.title}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  color="inherit"
                  variant="outlined"
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  color="inherit"
                  variant="outlined"
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar; 