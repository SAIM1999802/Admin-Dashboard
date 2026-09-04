import "../styles/EditOrder.css";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getOrderById, updateOrderDetails, getProducts } from "../services/api";

const EditOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    paymentMethod: "Cash on Delivery",
    status: "Pending",
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || id === "undefined") return setLoading(false);

      try {
        setLoading(true);
        const [orderRes, productsRes] = await Promise.all([
          getOrderById(id),
          getProducts(),
        ]);

        const rawProducts =
          productsRes.data?.data || productsRes.data || productsRes || [];
        const productsList = Array.isArray(rawProducts)
          ? rawProducts.filter((p) => !p.is_deleted)
          : [];
        setAvailableProducts(productsList);

        const order = orderRes.data?.data || orderRes.data || orderRes;

        if (order) {
          const currentStatus = order.status || "Pending";

          setFormData({
            customerName: order.customer_name || order.customerName || "",
            customerEmail: order.customer_email || order.customerEmail || "",
            shippingAddress:
              order.shipping_address || order.shippingAddress || "",
            paymentMethod:
              order.payment_method || order.paymentMethod || "Cash on Delivery",
            status: currentStatus,
          });

          const items = order.items || order.order_items || [];
          const formattedItems = items.map((item) => {
            const pId = item.product_id || item.id;
            const matchedProduct = productsList.find(
              (p) => String(p.id) === String(pId),
            );

            const existingQty = parseInt(item.quantity, 10) || 1;
            const storeStock = Number(
              matchedProduct?.stock_count ?? matchedProduct?.stock ?? 0,
            );

            const totalAllowedStock = storeStock + existingQty;

            return {
              id: pId,
              name: item.product_name || matchedProduct?.name || "Product",
              price: parseFloat(item.price || matchedProduct?.price || 0),
              quantity: existingQty,
              stock: totalAllowedStock,
              image:
                matchedProduct?.image ||
                matchedProduct?.image_url ||
                (Array.isArray(matchedProduct?.images)
                  ? matchedProduct.images[0]
                  : ""),
            };
          });

          setOrderItems(formattedItems);
        }
      } catch (error) {
        console.error("Error loading order details:", error);
        alert("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;

    const product = availableProducts.find(
      (p) => String(p.id) === String(selectedProductId),
    );

    if (!product || product.is_deleted === 1) {
      alert("Selected product is unavailable.");
      return;
    }

    const storeStock = Number(product.stock_count ?? product.stock ?? 0);

    const existingItem = orderItems.find(
      (item) => String(item.id) === String(product.id),
    );

    const currentQty = existingItem ? existingItem.quantity : 0;
    const maxAllowed = existingItem ? existingItem.stock : storeStock;

    if (storeStock <= 0 && !existingItem) {
      alert("This product is currently Out of Stock!");
      return;
    }

    if (currentQty + 1 > maxAllowed) {
      alert(`Cannot add more. Maximum available stock is ${maxAllowed}`);
      return;
    }

    setOrderItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => String(item.id) === String(product.id),
      );

      if (existingIndex > -1) {
        return prevItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            quantity: 1,
            stock: storeStock,
            image:
              product.image ||
              product.image_url ||
              (Array.isArray(product.images) ? product.images[0] : ""),
          },
        ];
      }
    });

    setSelectedProductId("");
  };

  const handleQuantityChange = (index, delta) => {
    const item = orderItems[index];
    if (!item) return;

    const newQty = item.quantity + delta;

    if (delta > 0 && newQty > item.stock) {
      alert(`Maximum available stock for ${item.name} is ${item.stock}`);
      return;
    }

    setOrderItems((prevItems) =>
      prevItems
        .map((it, i) => {
          if (i === index) {
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean),
    );
  };

  const handleRemoveItem = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        items: orderItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      await updateOrderDetails(id, payload);
      navigate("/orders");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading Order Details...</p>
        </div>
      </>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <Navbar />

      <main className="container py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div
              className="card border-0 shadow-sm p-4"
              style={{ borderRadius: "12px" }}
            >
              <h2 className="fw-bold fs-3 mb-3">Edit Order #{id}</h2>

              <form onSubmit={handleSubmit}>
                {/* Order Status */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Order Status
                  </label>
                  <select
                    className="form-select"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Customer Email */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Shipping Address */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Shipping Address
                  </label>
                  <textarea
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="shippingAddress"
                    rows="3"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                {/* Add Product Dropdown */}
                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">
                    Add Product
                  </label>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">Select a product</option>
                      {availableProducts.map((p) => {
                        const currentStock = Number(
                          p.stock_count ?? p.stock ?? 0,
                        );
                        const isOutOfStock = currentStock <= 0;
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={isOutOfStock}
                          >
                            {p.name} - ${parseFloat(p.price).toFixed(2)}{" "}
                            {isOutOfStock
                              ? "(Out of Stock)"
                              : `(Stock: ${currentStock})`}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary px-4 fw-semibold"
                      onClick={handleAddProduct}
                      disabled={!selectedProductId}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {orderItems.length > 0 && (
                  <div className="border rounded-3 p-3 mb-4 bg-light-subtle">
                    {orderItems.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="d-flex align-items-center justify-content-between py-2 border-bottom gap-2"
                      >
                        {/* Product Info Section */}
                        <div
                          className="d-flex align-items-center gap-2 overflow-hidden flex-shrink-1 me-2"
                          style={{ minWidth: 0 }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              className="bg-secondary text-white rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: "40px", height: "40px" }}
                            >
                              📦
                            </div>
                          )}
                          <div className="text-truncate">
                            <div className="fw-bold text-dark text-truncate small">
                              {item.name}
                            </div>
                            <div
                              className="text-muted extra-small"
                              style={{ fontSize: "0.75rem" }}
                            >
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          <div
                            className="input-group input-group-sm flex-nowrap"
                            style={{ width: "80px" }}
                          >
                            <button
                              type="button"
                              className="btn btn-outline-danger px-2"
                              onClick={() => handleQuantityChange(index, -1)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={item.stock}
                              value={item.quantity === 0 ? "" : item.quantity}
                              className="form-control"
                              placeholder="0"
                              onChange={(e) => {
                                const rawVal = e.target.value;

                                // Empty string handling (Backspace dabane par)
                                if (rawVal === "") {
                                  setOrderItems((prevItems) =>
                                    prevItems.map((it, i) =>
                                      i === index ? { ...it, quantity: 0 } : it,
                                    ),
                                  );
                                  return;
                                }

                                const val = parseInt(rawVal, 10);
                                const newQty = isNaN(val) ? 0 : val;

                                if (newQty > item.stock) {
                                  alert(
                                    `Maximum available stock for ${item.name} is ${item.stock}`,
                                  );
                                  return;
                                }

                                setOrderItems((prevItems) =>
                                  prevItems.map((it, i) =>
                                    i === index
                                      ? { ...it, quantity: newQty }
                                      : it,
                                  ),
                                );
                              }}
                              onBlur={() => {
                                // Input focus out hone par agar 0 ho to minimum 1 reset kar de
                                if (item.quantity === 0) {
                                  setOrderItems((prevItems) =>
                                    prevItems.map((it, i) =>
                                      i === index ? { ...it, quantity: 1 } : it,
                                    ),
                                  );
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-success px-2"
                              onClick={() => handleQuantityChange(index, 1)}
                            >
                              +
                            </button>
                          </div>

                          <span
                            className="fw-bold text-end small"
                            style={{ minWidth: "60px", whiteSpace: "nowrap" }}
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 ms-1"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove item"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="d-flex justify-content-between align-items-center pt-3 mt-2">
                      <span className="fw-bold fs-5">Total</span>
                      <span className="fw-bold fs-4">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold d-block">
                    Payment Method
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <label
                        className={`border rounded p-3 d-flex align-items-center gap-2 w-100 ${
                          formData.paymentMethod === "Cash on Delivery"
                            ? "border-primary bg-light"
                            : ""
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Cash on Delivery"
                          checked={
                            formData.paymentMethod === "Cash on Delivery"
                          }
                          onChange={handleChange}
                        />
                        <span className="small fw-semibold">
                          Cash on Delivery
                        </span>
                      </label>
                    </div>
                    <div className="col-6">
                      <label
                        className={`border rounded p-3 d-flex align-items-center gap-2 w-100 ${
                          formData.paymentMethod === "Card (Stripe)"
                            ? "border-primary bg-light"
                            : ""
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Card (Stripe)"
                          checked={formData.paymentMethod === "Card (Stripe)"}
                          onChange={handleChange}
                        />
                        <span className="small fw-semibold">Card (Stripe)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-light w-50 py-2 fw-semibold"
                    style={{ backgroundColor: "#f4f6f9" }}
                    onClick={() => navigate("/orders")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary w-50 py-2 fw-semibold"
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditOrderPage;
