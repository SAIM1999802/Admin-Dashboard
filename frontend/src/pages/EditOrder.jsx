import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, updateOrderDetails, getProducts } from "../services/api";
import "../styles/Orders.css";

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
              (p) => String(p.id) === String(pId)
            );

            const existingQty = parseInt(item.quantity, 10) || 1;
            const storeStock = Number(
              matchedProduct?.stock_count ?? matchedProduct?.stock ?? 0
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

  // Select dropdown par direct product add karne ka function
  const handleSelectProduct = (productId) => {
    if (!productId) return;

    const product = availableProducts.find(
      (p) => String(p.id) === String(productId)
    );

    if (!product || product.is_deleted === 1) {
      alert("Selected product is unavailable.");
      return;
    }

    const storeStock = Number(product.stock_count ?? product.stock ?? 0);

    const existingItem = orderItems.find(
      (item) => String(item.id) === String(product.id)
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
        (item) => String(item.id) === String(product.id)
      );

      if (existingIndex > -1) {
        return prevItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
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

    // Reset back to placeholder option
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
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (index) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
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
      <div className="text-center-wrapper">
        <div className="spinner"></div>
        <p className="text-muted-small" style={{ marginTop: "0.5rem" }}>
          Loading Order Details...
        </p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <main className="admin-page orders-page-container">
        <div className="orders-form-card">
          <h2 className="page-title">Edit Order #{id}</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Order Status</label>
              <select
                className="form-select form-control-styled"
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

            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control form-control-styled"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Email</label>
              <input
                type="email"
                className="form-control form-control-styled"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shipping Address</label>
              <textarea
                className="form-textarea form-control-styled"
                name="shippingAddress"
                rows="3"
                value={formData.shippingAddress}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="form-group-lg">
              <label className="form-label">Add Product</label>
              <select
                className="form-select form-control-styled"
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
              >
                <option value="">Select a product to add...</option>
                {availableProducts.map((p) => {
                  const currentStock = Number(p.stock_count ?? p.stock ?? 0);
                  const isOutOfStock = currentStock <= 0;
                  return (
                    <option key={p.id} value={p.id} disabled={isOutOfStock}>
                      {p.name} - ${parseFloat(p.price).toFixed(2)}{" "}
                      {isOutOfStock
                        ? "(Out of Stock)"
                        : `(Stock: ${currentStock})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {orderItems.length > 0 && (
              <div className="items-summary-box">
                {orderItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="item-row">
                    <div className="item-info">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="item-img"
                        />
                      ) : (
                        <div className="item-img-placeholder">📦</div>
                      )}
                      <div className="item-details">
                        <div className="item-title">{item.name}</div>
                        <div className="item-subtext">
                          ${item.price.toFixed(2)} each
                        </div>
                      </div>
                    </div>

                    <div className="item-qty-wrapper">
                      <div className="qty-counter-group">
                        <button
                          type="button"
                          className="btn-minus"
                          onClick={() => handleQuantityChange(index, -1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={item.stock}
                          value={item.quantity === 0 ? "" : item.quantity}
                          placeholder="0"
                          onChange={(e) => {
                            const rawVal = e.target.value;

                            if (rawVal === "") {
                              setOrderItems((prevItems) =>
                                prevItems.map((it, i) =>
                                  i === index ? { ...it, quantity: 0 } : it
                                )
                              );
                              return;
                            }

                            const val = parseInt(rawVal, 10);
                            const newQty = isNaN(val) ? 0 : val;

                            if (newQty > item.stock) {
                              alert(
                                `Maximum available stock for ${item.name} is ${item.stock}`
                              );
                              return;
                            }

                            setOrderItems((prevItems) =>
                              prevItems.map((it, i) =>
                                i === index
                                  ? { ...it, quantity: newQty }
                                  : it
                              )
                            );
                          }}
                          onBlur={() => {
                            if (item.quantity === 0) {
                              setOrderItems((prevItems) =>
                                prevItems.map((it, i) =>
                                  i === index ? { ...it, quantity: 1 } : it
                                )
                              );
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-plus"
                          onClick={() => handleQuantityChange(index, 1)}
                        >
                          +
                        </button>
                      </div>

                      <span className="item-total-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleRemoveItem(index)}
                        title="Remove item"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="order-grand-total">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="form-group-lg">
              <label className="form-label">Payment Method</label>
              <div className="radio-group-grid">
                <label
                  className={`radio-card ${
                    formData.paymentMethod === "Cash on Delivery" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={formData.paymentMethod === "Cash on Delivery"}
                    onChange={handleChange}
                  />
                  Cash on Delivery
                </label>
                <label
                  className={`radio-card ${
                    formData.paymentMethod === "Card (Stripe)" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Card (Stripe)"
                    checked={formData.paymentMethod === "Card (Stripe)"}
                    onChange={handleChange}
                  />
                  Card (Stripe)
                </label>
              </div>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="btn-light"
                onClick={() => navigate("/orders")}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditOrderPage;