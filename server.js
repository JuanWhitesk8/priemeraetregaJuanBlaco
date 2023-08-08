const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

const PRODUCTS_FILE = 'productos.json';
const CARTS_FILE = 'carrito.json';

// Función para leer el archivo de productos
const readProductsFile = () => {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    if (data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
};

// Función para escribir en el archivo de productos
const writeProductsFile = (products) => {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
};

// Función para leer el archivo de carritos
const readCartsFile = () => {
  try {
    const data = fs.readFileSync(CARTS_FILE, 'utf8');
    if (data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading carts file:', error);
    return [];
  }
};

// Función para escribir en el archivo de carritos
const writeCartsFile = (carts) => {
  fs.writeFileSync(CARTS_FILE, JSON.stringify(carts, null, 2), 'utf8');
};

// Rutas para productos
const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  let products = readProductsFile();

  if (limit) {
    products = products.slice(0, limit);
  }

  res.json(products);
});

productsRouter.get('/:pid', (req, res) => {
  const productId = req.params.pid;
  const products = readProductsFile();
  const product = products.find((p) => p.id === productId);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

productsRouter.post('/', (req, res) => {
  const {
    title,
    description,
    code,
    price,
    stock,
    category,
    thumbnails,
  } = req.body;

  if (
    !title ||
    !description ||
    !code ||
    !price ||
    !stock ||
    !category ||
    !thumbnails
  ) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails,
  };

  const products = readProductsFile();
  products.push(newProduct);
  writeProductsFile(products);

  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', (req, res) => {
  const productId = req.params.pid;
  const updatedProduct = req.body;

  if (!updatedProduct || !Object.keys(updatedProduct).length) {
    res.status(400).json({ message: 'Invalid data provided' });
    return;
  }

  const products = readProductsFile();
  const existingProduct = products.find((p) => p.id === productId);

  if (!existingProduct) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const updatedProductData = { ...existingProduct, ...updatedProduct };
  const updatedProducts = products.map((p) =>
    p.id === productId ? updatedProductData : p
  );

  writeProductsFile(updatedProducts);
  res.json(updatedProductData);
});

productsRouter.delete('/:pid', (req, res) => {
  const productId = req.params.pid;
  const products = readProductsFile();
  const remainingProducts = products.filter((p) => p.id !== productId);

  if (products.length === remainingProducts.length) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  writeProductsFile(remainingProducts);
  res.json({ message: 'Product deleted successfully' });
});

app.use('/api/products', productsRouter);

// Rutas para carritos
const cartsRouter = express.Router();

cartsRouter.post('/', (req, res) => {
  const newCart = {
    id: uuidv4(),
    products: [],
  };

  const carts = readCartsFile();
  carts.push(newCart);
  writeCartsFile(carts);

  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', (req, res) => {
  const cartId = req.params.cid;
  const carts = readCartsFile();
  const cart = carts.find((c) => c.id === cartId);

  if (cart) {
    res.json(cart.products);
  } else {
    res.status(404).json({ message: 'Cart not found' });
  }
});

cartsRouter.post('/:cid/product/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const quantity = req.body.quantity || 1;

  if (!quantity || quantity <= 0) {
    res.status(400).json({ message: 'Invalid quantity provided' });
    return;
  }

  const carts = readCartsFile();
  const cart = carts.find((c) => c.id === cartId);

  if (!cart) {
    res.status(404).json({ message: 'Cart not found' });
    return;
  }

  const productToAdd = {
    product: productId,
    quantity,
  };

  const existingProduct = cart.products.find((p) => p.product === productId);

  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    cart.products.push(productToAdd);
  }

  writeCartsFile(carts);
  res.json(cart.products);
});

app.use('/api/carts', cartsRouter);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});