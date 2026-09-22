import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getProducts, getCustomers, addOrder } from "../services/api";
import "../styles/Orders.css";

const CreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialDraft = () => {
    try {
      const saved = sessionStorage.getItem("createOrderDraft");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error("Failed to parse draft from sessionStorage:", err);
      return null;
    }
  };

  const initialDraft = getInitialDraft();

  const [customerName, setCustomerName] = useState(
    initialDraft?.customerName || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialDraft?.customerEmail || ""
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialDraft?.shippingAddress || ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialDraft?.paymentMethod || "Card (Stripe)"
  );
  const [selectedCustomer, setSelectedCustomer] = useState(
    initialDraft?.selectedCustomer || null
  );
  const [selectedItems, setSelectedItems] = useState(
    initialDraft?.selectedItems || []
  );

  const [customersList, setCustomersList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getCustomers().catch(() => ({ data: [] })),
        ]);
        const rawProducts = prodRes.data?.data || prodRes.data || prodRes || [];
        setAvailableProducts(
          Array.isArray(rawProducts)
            ? rawProducts.filter((p) => !p.is_deleted)
            : []
        );

        const custs = custRes.data?.data || custRes.data || custRes || [];
        setCustomersList(custs);

        if (location.state?.newCustomer) {
          const newCust = location.state.newCustomer;
          setCustomerName(newCust.name || "");
          setCustomerEmail(newCust.email || "");
          setShippingAddress(newCust.address || newCust.shippingAddress || "");
          setSelectedCustomer(newCust);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [location.state?.newCustomer]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const draft = {
      customerName,
      customerEmail,
      shippingAddress,
      paymentMethod,
      selectedCustomer,
      selectedItems,
    };
    sessionStorage.setItem("createOrderDraft", JSON.stringify(draft));
  }, [
    customerName,
    customerEmail,
    shippingAddress,
    paymentMethod,
    selectedCustomer,
    selectedItems,
  ]);

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedCustomer(null);

    if (value.trim() !== "") {
      const filtered = customersList.filter((c) =>
        c.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);

      const matchedCustomer = customersList.find(
        (c) => c.name?.toLowerCase() === value.toLowerCase()
      );

      if (matchedCustomer) {
        setCustomerEmail(matchedCustomer.email || "");
        setShippingAddress(
          matchedCustomer.address || matchedCustomer.shippingAddress || ""
        );
        setSelectedCustomer(matchedCustomer);
      } else {
        setCustomerEmail("");
        setShippingAddress("");
      }
    } else {
      setFilteredCustomers([]);
      setShowDropdown(false);
      setCustomerEmail("");
      setShippingAddress("");
    }
  };

  const handleSelectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || "");
    setShippingAddress(customer.address || customer.shippingAddress || "");
    setSelectedCustomer(customer);
    setFilteredCustomers([]);
    setShowDropdown(false);
  };

  const handleProductSelect = (productId) => {
    if (!productId) return;

    const productObj = availableProducts.find(
      (p) => String(p.id) === String(productId)
    );

    if (!productObj || productObj.is_deleted === 1) {
      alert("Selected product is unavailable.");
      return;
    }

    const availableStock = Number(
      productObj.stock_count ?? productObj.stock ?? 0
    );

    if (availableStock <= 0) {
      alert("This product is currently Out of Stock!");
      return;
    }

    const existingIndex = selectedItems.findIndex(
      (item) => String(item.id) === String(productId)
    );

    if (existingIndex > -1) {
      const currentQty = selectedItems[existingIndex].quantity;
      if (currentQty + 1 > availableStock) {
        alert(`Cannot add more. Available stock: ${availableStock}`);
        return;
      }
      setSelectedItems((prevItems) =>
        prevItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          id: productObj.id,
          name: productObj.name,
          price: parseFloat(productObj.price) || 0,
          stock: availableStock,
          image:
            productObj.image ||
            productObj.image_url ||
            (Array.isArray(productObj.images) ? productObj.images[0] : ""),
          quantity: 1,
        },
      ]);
    }
    setSelectedProductId("");
  };

  const handleQuantityChange = (id, delta) => {
    setSelectedItems((prevItems) =>
      prevItems
        .map((item) => {
          if (String(item.id) === String(id)) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert(`Maximum available stock is ${item.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleManualQuantityChange = (id, value, stock) => {
    if (value === "") {
      setSelectedItems((prevItems) =>
        prevItems.map((item) =>
          String(item.id) === String(id) ? { ...item, quantity: 0 } : item
        )
      );
      return;
    }

    const parsedVal = parseInt(value, 10);
    let newQty = isNaN(parsedVal) ? 0 : parsedVal;

    if (newQty > stock) {
      alert(`Maximum available stock is ${stock}`);
      newQty = stock;
    } else if (newQty < 0) {
      newQty = 0;
    }

    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(id) ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleQuantityBlur = (id) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(id) && item.quantity === 0
          ? { ...item, quantity: 1 }
          : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) =>
      prev.filter((item) => String(item.id) !== String(id))
    );
  };

  const grandTotal = Number(
    selectedItems
      .reduce((acc, item) => acc + item.price * item.quantity, 0)
      .toFixed(2)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert("Please select a valid customer from the records.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    const orderData = {
      customerId: selectedCustomer.id,
      customerName,
      customerEmail,
      shippingAddress,
      items: selectedItems.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: grandTotal,
      paymentMethod,
    };

    try {
      const res = await addOrder(orderData);

      if (paymentMethod === "Card (Stripe)" && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        sessionStorage.removeItem("createOrderDraft");
        navigate("/orders");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert(error.response?.data?.message || "Failed to create order");
    }
  };

  const isFormValid = Boolean(selectedCustomer) && selectedItems.length > 0;

  return (
    <>

      <main className="admin-page orders-page-container">
        <div className="orders-form-card">
          <h2 className="page-title">Create Order</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group" ref={dropdownRef}>
              <label className="form-label">Customer Name</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type to search customer..."
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  onFocus={() => {
                    if (
                      customerName.trim() !== "" &&
                      filteredCustomers.length > 0
                    ) {
                      setShowDropdown(true);
                    }
                  }}
                  required
                />
                <button
                  type="button"
                  className="btn-primary custom-tooltip"
                  data-title="Add New Customer"
                  onClick={() => navigate("/customers/add")}
                >
                  <i className="bi bi-person-plus"></i> Add New Customer
                </button>
              </div>

              {showDropdown && filteredCustomers.length > 0 && (
                <ul className="dropdown-menu-custom">
                  {filteredCustomers.map((cust, idx) => (
                    <li
                      key={cust.id || idx}
                      className="dropdown-item-custom"
                      onClick={() => handleSelectCustomer(cust)}
                    >
                      <div className="dropdown-item-name">{cust.name}</div>
                      {cust.email && (
                        <div className="dropdown-item-email">{cust.email}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {customerName.trim() !== "" &&
                !selectedCustomer &&
                filteredCustomers.length === 0 && (
                  <div className="text-muted-small" style={{ marginTop: "0.5rem" }}>
                    Customer not found in records.
                  </div>
                )}
            </div>

            {selectedCustomer && (
              <div className="form-group">
                <label className="form-label">Shipping address</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                ></textarea>
              </div>
            )}

            <div className="form-group-lg">
              <label className="form-label">Add product</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Select a product</option>
                {availableProducts.map((prod) => {
                  const currentStock = Number(
                    prod.stock_count ?? prod.stock ?? 0
                  );
                  const isOutOfStock = currentStock <= 0;
                  return (
                    <option
                      key={prod.id}
                      value={prod.id}
                      disabled={isOutOfStock}
                    >
                      {prod.name} - ${parseFloat(prod.price || 0).toFixed(2)}{" "}
                      {isOutOfStock
                        ? "(Out of Stock)"
                        : `(Stock: ${currentStock})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedItems.length > 0 && (
              <div className="items-summary-box">
                {selectedItems.map((item) => (
                  <div key={item.id} className="item-row">
                    <div className="item-info">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="item-img"
                        />
                      ) : (
                        <div className="item-img-placeholder" />
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
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={item.stock}
                          value={item.quantity === 0 ? "" : item.quantity}
                          placeholder="0"
                          onChange={(e) =>
                            handleManualQuantityChange(
                              item.id,
                              e.target.value,
                              item.stock
                            )
                          }
                          onBlur={() => handleQuantityBlur(item.id)}
                        />
                        <button
                          type="button"
                          className="btn-plus"
                          onClick={() => handleQuantityChange(item.id, 1)}
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
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="order-grand-total">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="form-group-lg">
              <label className="form-label">Payment method</label>
              <div className="radio-group-grid">
                <label
                  className={`radio-card ${
                    paymentMethod === "Cash on Delivery" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash on Delivery
                </label>
                <label
                  className={`radio-card ${
                    paymentMethod === "Card (Stripe)" ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Card (Stripe)"
                    checked={paymentMethod === "Card (Stripe)"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Card (Stripe)
                </label>
              </div>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="btn-light"
                onClick={() => {
                  sessionStorage.removeItem("createOrderDraft");
                  navigate("/orders");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-success"
                disabled={!isFormValid}
              >
                Continue to Payment
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default CreateOrder;