import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CardActions,
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

function PointsShop() {
  const [sortBy, setSortBy] = useState('points');
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { addToCart } = useCart();
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery('pointsProducts', async () => {
    const response = await axios.get('/api/points/products');
    return response.data;
  });

  const handleAddToCart = (product) => {
    addToCart(product, 1, true);
    setSnackbar({
      open: true,
      message: 'Product added to cart!',
      severity: 'success'
    });
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = filteredProducts?.sort((a, b) => {
    switch (sortBy) {
      case 'points-low':
        return a.points_price - b.points_price;
      case 'points-high':
        return b.points_price - a.points_price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return a.points_price - b.points_price;
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Points Shop
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Your Points Balance: {user?.points || 0} points
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="points-low">Points: Low to High</MenuItem>
                <MenuItem value="points-high">Points: High to Low</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={4}>
        {sortedProducts?.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={product.image_url || 'https://source.unsplash.com/random?product'}
                alt={product.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary">
                  {product.points_price} points
                </Typography>
                <Typography
                  variant="body2"
                  color={product.stock > 0 ? 'success.main' : 'error.main'}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleAddToCart(product)}
                  disabled={!user || product.stock === 0 || user.points < product.points_price}
                >
                  {!user
                    ? 'Sign in to Redeem'
                    : user.points < product.points_price
                    ? 'Insufficient Points'
                    : 'Redeem with Points'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {(!sortedProducts || sortedProducts.length === 0) && (
          <Grid item xs={12}>
            <Typography variant="h6" textAlign="center">
              No products available for points redemption
            </Typography>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default PointsShop; 