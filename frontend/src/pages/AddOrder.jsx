import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, getCustomers, addOrder } from "../services/api";
import "../styles/Orders.css";

const CreateOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card (Stripe)");

  const [customersList, setCustomersList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getCustomers().catch(() => ({ data: [] })),
        ]);

        // Fix 1: Properly extract array from nested API responses (EditOrder reference)
        const rawProducts = prodRes.data?.data || prodRes.data || prodRes || [];
        setAvailableProducts(
          Array.isArray(rawProducts)
            ? rawProducts.filter((p) => !p.is_deleted)
            : [],
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

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);
    setSelectedCustomer(null);

    if (value.trim() !== "") {
      const filtered = customersList.filter((c) =>
        c.name?.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredCustomers(filtered);
      setShowDropdown(true);

      const matchedCustomer = customersList.find(
        (c) => c.name?.toLowerCase() === value.toLowerCase(),
      );

      if (matchedCustomer) {
        setCustomerEmail(matchedCustomer.email || "");
        setShippingAddress(
          matchedCustomer.address || matchedCustomer.shippingAddress || "",
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

  // Fix 2: Updated handleAddProduct logic & state immutability
  const handleAddProduct = () => {
    if (!selectedProductId) return;

    const productObj = availableProducts.find(
      (p) => String(p.id) === String(selectedProductId),
    );

    if (!productObj || productObj.is_deleted === 1) {
      alert("Selected product is unavailable.");
      return;
    }

    const availableStock = Number(
      productObj.stock_count ?? productObj.stock ?? 0,
    );

    if (availableStock <= 0) {
      alert("This product is currently Out of Stock!");
      return;
    }

    const existingIndex = selectedItems.findIndex(
      (item) => String(item.id) === String(selectedProductId),
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
            : item,
        ),
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
        .filter(Boolean),
    );
  };

  const handleManualQuantityChange = (id, value, stock) => {
    // Field clear (backspace) hone par temporarily 0 rehne dein
    if (value === "") {
      setSelectedItems((prevItems) =>
        prevItems.map((item) =>
          String(item.id) === String(id) ? { ...item, quantity: 0 } : item,
        ),
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
        String(item.id) === String(id) ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleQuantityBlur = (id) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(id) && item.quantity === 0
          ? { ...item, quantity: 1 }
          : item,
      ),
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems((prev) =>
      prev.filter((item) => String(item.id) !== String(id)),
    );
  };

  const grandTotal = Number(
    selectedItems
      .reduce((acc, item) => acc + item.price * item.quantity, 0)
      .toFixed(2),
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

    // Fix 3: Standardizing items array payload sent to backend
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
      await addOrder(orderData);
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      alert(error.response?.data?.message || "Failed to create order");
    }
  };

  const isFormValid = Boolean(selectedCustomer) && selectedItems.length > 0;

  return (
    <>
      <Navbar />
      <main className="admin-page d-flex justify-content-center py-4">
        <div
          className="card p-4 shadow-sm border-0 rounded-4"
          style={{ maxWidth: "650px", width: "100%", backgroundColor: "#fff" }}
        >
          <h2 className="fw-bold mb-4">Create Order</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3 position-relative" ref={dropdownRef}>
              <label className="form-label text-muted small fw-semibold">
                Customer Name
              </label>
              <div className="input-group mb-1">
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
                  className="btn btn-sm btn-primary fw-semibold custom-tooltip"
                  data-title="Add New Customer"
                  onClick={() => navigate("/customers/add")}
                >
                  <i className="bi bi-person-plus me-1"></i>Add New Customer
                </button>
              </div>

              {showDropdown && filteredCustomers.length > 0 && (
                <ul
                  className="list-group position-absolute w-100 shadow-sm mt-1 overflow-auto rounded-3"
                  style={{
                    maxHeight: "200px",
                    zIndex: 1000,
                    backgroundColor: "#ffffff",
                  }}
                >
                  {filteredCustomers.map((cust, idx) => (
                    <li
                      key={cust.id || idx}
                      className="list-group-item list-group-item-action border-0 px-3 py-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSelectCustomer(cust)}
                    >
                      <div className="fw-medium text-dark">{cust.name}</div>
                      {cust.email && (
                        <div
                          className="text-muted extra-small"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {cust.email}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {customerName.trim() !== "" &&
                !selectedCustomer &&
                filteredCustomers.length === 0 && (
                  <div className="mt-2 text-muted small d-flex align-items-center justify-content-between">
                    <span>Customer not found in records.</span>
                  </div>
                )}
            </div>

            {selectedCustomer && (
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">
                  Shipping address
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                ></textarea>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">
                Add product
              </label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Select a product</option>
                  {availableProducts.map((prod) => {
                    const currentStock = Number(
                      prod.stock_count ?? prod.stock ?? 0,
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
                <button
                  type="button"
                  className="btn btn-secondary text-white px-4 fw-semibold"
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                >
                  Add
                </button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="border rounded-3 p-3 mb-4 bg-light-subtle">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="d-flex align-items-center justify-content-between py-2 border-bottom gap-2"
                  >
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
                          className="bg-secondary-subtle rounded flex-shrink-0"
                          style={{ width: "40px", height: "40px" }}
                        />
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

                    <div className="d-flex align-items-center gap-2 item-qty-wrapper flex-shrink-0">
                      <div
                        className="input-group input-group-sm flex-nowrap"
                        style={{ width: "100px" }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline-danger px-2"
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
                          className="form-control text-center px-1"
                          onChange={(e) =>
                            handleManualQuantityChange(
                              item.id,
                              e.target.value,
                              item.stock,
                            )
                          }
                          onBlur={() => handleQuantityBlur(item.id)}
                        />
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
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-between align-items-center pt-3 fw-bold fs-5">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label text-muted small fw-semibold">
                Payment method
              </label>
              <div className="d-flex gap-3">
                <label className="border rounded p-3 flex-fill d-flex align-items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Cash on Delivery
                </label>
                <label className="border rounded p-3 flex-fill d-flex align-items-center gap-2 cursor-pointer">
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

            <div className="d-flex gap-3">
              <button
                type="button"
                className="btn btn-light flex-fill py-2 fw-semibold"
                onClick={() => navigate("/orders")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-success flex-fill py-2 fw-semibold"
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
