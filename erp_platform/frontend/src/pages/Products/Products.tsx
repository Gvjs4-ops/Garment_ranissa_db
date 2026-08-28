import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import type { Product } from "../../api/products";
import AddProductDialog from "./AddProductDialog";
import type { NewProductInput } from "./AddProductDialog";

import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";

import EditProductDialog from "./EditProductDialog";
import type { EditProductInput } from "./EditProductDialog";

import {
  createProduct,
  fetchProducts,
  updateProduct,
} from "../../api/products";

interface Product {
  id: string;
  sku: string | null;
  style_code: string | null;
  name: string;
  fabric: string | null;
  color: string | null;
  size: string | null;
  selling_price: number;
  is_active: boolean;
}

export default function Products() {
  // 1. State
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 2. Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };

    loadProducts();
  }, []);

  // 3. Create product
  const handleCreateProduct = async (product: NewProductInput) => {
    try {
      await createProduct(product);

      const updatedProducts = await fetchProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  };

  // 4. Filter products
  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(value) ||
      product.sku?.toLowerCase().includes(value) ||
      product.style_code?.toLowerCase().includes(value)
    );
  });

  // update products
  const handleUpdateProduct = async (
  productId: string,
  product: EditProductInput) => {
  try {
    await updateProduct(productId, product);

    const updatedProducts = await fetchProducts();
    setProducts(updatedProducts);
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
};

const handleEditProduct = (product: Product) => {
  setSelectedProduct(product);
  setEditDialogOpen(true);
};

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Products
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage garment styles, SKUs, pricing and product details.
          </Typography>
        </Box>
        <Button
	  variant="contained"
	  startIcon={<AddIcon />}
	  onClick={() => setAddDialogOpen(true)}
	>
	  Add Product
	</Button>
      </Stack>

      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by product name, SKU or style code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ mb: 3 }}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Style Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Fabric</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Selling Price</TableCell>
                <TableCell>Status</TableCell>
		<TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
			<TableRow key={product.id} hover>
  <TableCell>{product.sku || "—"}</TableCell>

  <TableCell>{product.style_code || "—"}</TableCell>

  <TableCell>
    <Typography fontWeight={600}>
      {product.name}
    </Typography>
  </TableCell>

  <TableCell>{product.fabric || "—"}</TableCell>

  <TableCell>{product.color || "—"}</TableCell>

  <TableCell>{product.size || "—"}</TableCell>

  <TableCell align="right">
    ₹{Number(product.selling_price || 0).toLocaleString("en-IN")}
  </TableCell>

  <TableCell>
    <Chip
      label={product.is_active ? "Active" : "Inactive"}
      color={product.is_active ? "success" : "default"}
      size="small"
    />
  </TableCell>

  {/* NEW ACTION COLUMN */}
  <TableCell align="center">
    <IconButton
      size="small"
      onClick={() => handleEditProduct(product)}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  </TableCell>
</TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddProductDialog
	open={addDialogOpen}
	onClose={() => setAddDialogOpen(false)}
	 onSave={handleCreateProduct}
      />
      <EditProductDialog
	open={editDialogOpen}
	product={selectedProduct}
	onClose={() => {
	setEditDialogOpen(false);
	setSelectedProduct(null);
	}}
	onSave={handleUpdateProduct}
      />
    </Box>
  );
}
