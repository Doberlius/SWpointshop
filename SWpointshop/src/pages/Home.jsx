import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  useTheme,
  Fade,
  Grow,
  Chip,
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  LocalOffer as LocalOfferIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  const { data: featuredProducts } = useQuery('featuredProducts', async () => {
    const response = await axios.get('/api/products');
    return response.data.slice(0, 4); // Get first 4 products as featured
  });

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 6,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(https://source.unsplash.com/random?shopping)',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
        }}
      >
        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.5)',
            backdropFilter: 'blur(2px)',
          }}
        />
        <Grow in={true} timeout={1000}>
          <Box
            sx={{
              position: 'relative',
              p: { xs: 3, md: 6 },
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            <Typography
              component="h1"
              variant="h2"
              color="inherit"
              gutterBottom
              sx={{
                fontWeight: 700,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                mb: 3,
              }}
            >
              SWpointshop
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/products')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 2,
                py: 1.5,
                px: 4,
                fontSize: '1.2rem',
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: 'primary.main',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[15],
                },
                transition: 'all 0.2s',
              }}
            >
              เริ่มช้อปเลย
            </Button>
          </Box>
        </Grow>
      </Paper>

      <Container maxWidth="lg">

        {/* Featured Products */}
        <Box sx={{ my: 8 }}>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 4,
              position: 'relative',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 60,
                height: 4,
                backgroundColor: 'primary.main',
                borderRadius: 2,
              }
            }}
          >
            รายการสินค้า
          </Typography>
          <Grid container spacing={4}>
            {featuredProducts?.map((product, index) => (
              <Grid item key={product.id} xs={12} sm={6} md={3}>
                <Fade in={true} timeout={1000 + (index * 500)}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        height: 280,
                        objectFit: 'contain',
                        bgcolor: 'background.paper',
                        p: 2,
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      image={product.image_url || 'https://source.unsplash.com/random?product'}
                      alt={product.name}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography gutterBottom variant="h6" component="h3" sx={{ fontWeight: 500 }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                          {Number(product.price).toFixed(2)} บาท
                        </Typography>
                        {product.points_price && (
                          <Chip 
                            label={`${product.points_price} points`}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/products')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[2],
                },
                transition: 'all 0.2s',
              }}
            >
              ดูสินค้าทั้งหมด
            </Button>
          </Box>
        </Box>

        {/* Call to Action */}
        {!user && (
          <Fade in={true} timeout={1000}>
            <Paper
              sx={{
                bgcolor: 'primary.main',
                p: { xs: 4, md: 8 },
                my: 8,
                textAlign: 'center',
                borderRadius: 4,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
                },
              }}
            >
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600}}>
                เข้าร่วมกับเรา
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  py: 1.5,
                  px: 4,
                  mt: 5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  },
                  transition: 'all 0.2s',
                }}
              >
                สมัครสมาชิก
              </Button>
            </Paper>
          </Fade>
        )}
      </Container>
    </Box>
  );
}

export default Home; 