import React from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../services/api";

const CartDrawer = ({
  cart = [],
  products = [],
  isDrawerOpen,
  setIsDrawerOpen,
  persistCart,
  triggerToast,
  updateCartCount,
}) => {
  const navigate = useNavigate();

  const getLiveProduct = async (productId) => {
    try {
      const res = await getProducts();

      const productList = Array.isArray(res?.data)
        ? res.data
        : res?.data?.data || res?.data || [];

      const liveProduct = productList.find(
        (p) => String(p.id) === String(productId)
      );

      return liveProduct || products.find(
        (p) => String(p.id) === String(productId)
      );
    } catch (error) {
      console.error("Failed to fetch live product stock:", error);

      return products.find(
        (p) => String(p.id) === String(productId)
      );
    }
  };

  const handleQuantityChange = async (productId, delta) => {
    const liveProduct = await getLiveProduct(productId);

    const currentStock = Number(
      liveProduct?.stock_count ?? liveProduct?.stock ?? 0
    );

    const currentItem = cart.find(
      (item) => String(item.id) === String(productId)
    );

    if (!currentItem) return;

    const newQty = Number(currentItem.quantity || 0) + delta;

    // Allow decreasing/removing even if stock is currently 0.
    if (delta < 0) {
      const updatedCart = cart
        .map((item) => {
          if (String(item.id) === String(productId)) {
            return newQty > 0
              ? { ...item, quantity: newQty }
              : null;
          }

          return item;
        })
        .filter(Boolean);

      persistCart(updatedCart);
      return;
    }

    // Product currently has no stock.
    if (currentStock <= 0) {
      triggerToast("Item is Out of Stock.", "danger");
      return;
    }

    // Prevent quantity from exceeding live stock.
    if (newQty > currentStock) {
      triggerToast(
        `Cannot add more! Only ${currentStock} item(s) available in stock.`,
        "danger"
      );
      return;
    }

    const updatedCart = cart.map((item) => {
      if (String(item.id) === String(productId)) {
        return {
          ...item,
          quantity: newQty,
          stock: currentStock,
        };
      }

      return item;
    });

    persistCart(updatedCart);
  };

  const handleQuantityInput = async (productId, val) => {
    const liveProduct = await getLiveProduct(productId);

    const currentStock = Number(
      liveProduct?.stock_count ?? liveProduct?.stock ?? 0
    );

    if (currentStock <= 0) {
      triggerToast("Item is Out of Stock.", "danger");
      return;
    }

    let newQty = parseInt(val, 10);

    if (isNaN(newQty) || newQty <= 0) {
      newQty = 1;
    }

    if (newQty > currentStock) {
      triggerToast(
        `Cannot add more! Only ${currentStock} item(s) available in stock.`,
        "danger"
      );

      newQty = currentStock;
    }

    const updatedCart = cart.map((item) => {
      if (String(item.id) === String(productId)) {
        return {
          ...item,
          quantity: newQty,
          stock: currentStock,
        };
      }

      return item;
    });

    persistCart(updatedCart);
  };

  const handleRemoveItem = (productId) => {
    const updatedCart = cart.filter(
      (item) => String(item.id) !== String(productId)
    );

    persistCart(updatedCart);
  };

  const calculateSubtotal = () => {
    return cart
      .reduce(
        (sum, item) =>
          sum + parseFloat(item.price || 0) * item.quantity,
        0
      )
      .toFixed(2);
  };

  const totalCartCount = updateCartCount
    ? updateCartCount()
    : cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* CART DRAWER OVERLAY */}
      <div
        className={`drawer-overlay ${isDrawerOpen ? "open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* CART DRAWER PANEL */}
      <div className={`cart-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">Your cart</h3>

          <button
            className="close-btn"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart-text">
              <i className="bi bi-bag-x fs-1"></i>
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="drawer-cart-item"
              >
                <img
                  src={
                    item.image ||
                    "https://via.placeholder.com/80?text=Product"
                  }
                  alt={item.name}
                  className="drawer-item-img"
                />

                <div className="drawer-item-info">
                  <h5 className="drawer-item-name">
                    {item.name}
                  </h5>

                  <div className="drawer-item-price">
                    ${parseFloat(item.price || 0).toFixed(2)}
                  </div>
                </div>

                <div className="quantity-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      handleQuantityChange(item.id, -1)
                    }
                  >
                    -
                  </button>

                  <input
                    type="number"
                    className="qty-input"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityInput(
                        item.id,
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      handleQuantityChange(item.id, 1)
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer">
          <div className="subtotal-row">
            <span className="subtotal-label">
              Subtotal
            </span>

            <span className="subtotal-amount">
              ${calculateSubtotal()}
            </span>
          </div>

          <button
            className="btn-checkout"
            onClick={() => {
              setIsDrawerOpen(false);
              navigate("/checkout");
            }}
            disabled={cart.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="floating-cart-btn"
        title="View Cart Drawer"
      >
        <div className="cart-icon-container">
          <i className="bi bi-cart4 fs-5"></i>

          {totalCartCount > 0 && (
            <span className="cart-badge">
              {totalCartCount}
            </span>
          )}
        </div>
      </button>
    </>
  );
};

export default CartDrawer;