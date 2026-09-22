  import React, { useState } from "react";
  import { useNavigate, Link } from "react-router-dom";
  import Navbar from "../components/Navbar";
  import { addOrder } from "../services/api";
  import "../styles/Checkout.css";

  const getRegisteredEmail = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.email || "";
    } catch (error) {
      console.error("Failed to get registered user:", error);
      return "";
    }
  };

  export default function Checkout({ cartItems = [], setCartItems, clearCart }) {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [items, setItems] = useState(cartItems);

    const [formData, setFormData] = useState({
      email: getRegisteredEmail(),
      country: "Pakistan",
      firstName: "",
      lastName: "",
      address: "",
      apartment: "",
      city: "",
      postalCode: "",
      billingAddress: "same",
      paymentMethod: "cod",
      billingCountry: "Pakistan",
      billingFirstName: "",
      billingLastName: "",
      billingAddressText: "",
      billingApartment: "",
      billingCity: "",
      billingPostalCode: "",
    });

    const subtotal = items.reduce(
      (acc, item) =>
        acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0,
    );
    const shippingFee = items.length > 0 ? 20 : 0;
    const total = subtotal + shippingFee;

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    };

    const persistCartItems = (updatedItems) => {
      setItems(updatedItems);
      if (setCartItems) setCartItems(updatedItems);
      try {
        localStorage.setItem("cart", JSON.stringify(updatedItems));
      } catch (err) {
        console.error("Failed to persist cart:", err);
      }
    };

    const handleQuantityChange = (id, delta) => {
      const updatedItems = items
        .map((item) => {
          if (item.id !== id) return item;

          const newQty = (item.quantity || 1) + delta;

          if (delta > 0 && item.stock != null && newQty > Number(item.stock)) {
            alert(`Only ${item.stock} item(s) available in stock!`);
            return item;
          }

          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean);

      persistCartItems(updatedItems);
    };

    const handleRemoveItem = (id) => {
      persistCartItems(items.filter((item) => item.id !== id));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (items.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      if (!formData.email.trim()) {
        alert("Email address is required!");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.email.trim())) {
        alert("Please enter a valid email address!");
        return;
      }

      const customerName = `${formData.firstName} ${formData.lastName}`.trim();

      if (!customerName) {
        alert("Please enter your name!");
        return;
      }

      if (!formData.address.trim()) {
        alert("Please enter your address!");
        return;
      }

      if (!formData.city.trim()) {
        alert("Please enter your city!");
        return;
      }

      const orderData = {
        customerName,
        customerEmail: formData.email.trim().toLowerCase(),
        shippingAddress: [
          formData.address,
          formData.apartment,
          formData.city,
          formData.postalCode,
          formData.country,
        ]
          .filter(Boolean)
          .join(", "),
        items: items.map((item) => ({
          product_id: item.id || item.product_id,
          product_name: item.title || item.name,
          quantity: item.quantity || 1,
          price: item.price,
        })),
        totalAmount: total,
        paymentMethod:
          formData.paymentMethod === "stripe"
            ? "Card (Stripe)"
            : "Cash on Delivery",
        successUrl: `${window.location.origin}/order-completed`,   // NEW
        cancelUrl: `${window.location.origin}/checkout`,             // NEW
      };

      try {
        setIsSubmitting(true);

        const res = await addOrder(orderData);
        console.log("Order created:", res.data);

        if (formData.paymentMethod === "stripe" && res?.data?.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
          return;
        }

        if (clearCart) clearCart();

        try {
          localStorage.removeItem("cart");
        } catch (error) {
          console.error("Failed to clear local cart:", error);
        }

        navigate("/order-completed", {
          state: {
            orderId: res?.data?.data?.id,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            totalAmount: orderData.totalAmount,
          },
        });
      } catch (error) {
        console.error("Error placing order:", error);
        alert(
          error.response?.data?.message ||
            "Failed to place order. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <>
        <Navbar />
        <div className="checkout-page-container">
          <div className="checkout-main-content">
            <div className="checkout-left-col">
              <header className="checkout-header">
                <Link to="/market" className="checkout-brand-logo">
                  Velure
                </Link>
              </header>

              <form onSubmit={handleSubmit} className="checkout-form">
                <section className="checkout-section">
                  <h2 className="section-title">Delivery</h2>

                  <div className="form-group">
                    <label className="input-label">Email address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={formData.email}
                      className="form-control"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Country/Region</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="Pakistan">Pakistan</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United Arab Emirates">
                        United Arab Emirates
                      </option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group half-width">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="form-control"
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="form-group half-width">
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="form-control"
                        required
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control"
                      required
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Apartment, suite, etc. (optional)"
                      value={formData.apartment}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group half-width">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-control"
                        required
                        autoComplete="address-level2"
                      />
                    </div>
                    <div className="form-group half-width">
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="Postal code (optional)"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="form-control"
                        autoComplete="postal-code"
                      />
                    </div>
                  </div>
                </section>

                <section className="checkout-section">
                  <h2 className="section-title">Shipping method</h2>
                  <div className="shipping-option-card">
                    <span className="shipping-title">International Shipping</span>
                    <span className="shipping-price">
                      ${shippingFee.toFixed(2)}
                    </span>
                  </div>
                </section>

                <section className="checkout-section">
                  <h2 className="section-title">Payment</h2>
                  <p className="section-subtitle">
                    All transactions are secure and encrypted.
                  </p>

                  <div className="payment-methods-group">
                    <label
                      className={`payment-method-card ${
                        formData.paymentMethod === "cod" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                      />
                      <span className="payment-method-radio-dot" />
                      <i className="bi bi-cash-stack payment-method-icon"></i>
                      <span className="payment-method-label">
                        Cash on Delivery (COD)
                      </span>
                    </label>

                    <label
                      className={`payment-method-card ${
                        formData.paymentMethod === "stripe" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={formData.paymentMethod === "stripe"}
                        onChange={handleChange}
                      />
                      <span className="payment-method-radio-dot" />
                      <i className="bi bi-credit-card payment-method-icon"></i>
                      <span className="payment-method-label">Stripe Pay</span>
                    </label>
                  </div>
                </section>

                <section className="checkout-section">
                  <h2 className="section-title">Billing address</h2>

                  <div className="billing-options-container">
                    <label
                      className={`radio-box ${
                        formData.billingAddress === "same" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        value="same"
                        checked={formData.billingAddress === "same"}
                        onChange={handleChange}
                      />
                      <span>Same as shipping address</span>
                    </label>

                    <label
                      className={`radio-box ${
                        formData.billingAddress === "different" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        value="different"
                        checked={formData.billingAddress === "different"}
                        onChange={handleChange}
                      />
                      <span>Use a different billing address</span>
                    </label>

                    {formData.billingAddress === "different" && (
                      <div className="billing-details-form">
                        <div className="form-group">
                          <label className="input-label">Country/Region</label>
                          <select
                            name="billingCountry"
                            value={formData.billingCountry}
                            onChange={handleChange}
                            className="form-control"
                          >
                            <option value="Pakistan">Pakistan</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="United Arab Emirates">
                              United Arab Emirates
                            </option>
                          </select>
                        </div>

                        <div className="form-row">
                          <div className="form-group half-width">
                            <input
                              type="text"
                              name="billingFirstName"
                              placeholder="First name"
                              value={formData.billingFirstName}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group half-width">
                            <input
                              type="text"
                              name="billingLastName"
                              placeholder="Last name"
                              value={formData.billingLastName}
                              onChange={handleChange}
                              className="form-control"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <input
                            type="text"
                            name="billingAddressText"
                            placeholder="Address"
                            value={formData.billingAddressText}
                            onChange={handleChange}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <input
                            type="text"
                            name="billingApartment"
                            placeholder="Apartment, suite, etc. (optional)"
                            value={formData.billingApartment}
                            onChange={handleChange}
                            className="form-control"
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group half-width">
                            <input
                              type="text"
                              name="billingCity"
                              placeholder="City"
                              value={formData.billingCity}
                              onChange={handleChange}
                              className="form-control"
                              required
                            />
                          </div>
                          <div className="form-group half-width">
                            <input
                              type="text"
                              name="billingPostalCode"
                              placeholder="Postal code (optional)"
                              value={formData.billingPostalCode}
                              onChange={handleChange}
                              className="form-control"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <button
                  type="submit"
                  className="complete-order-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Processing..."
                    : formData.paymentMethod === "stripe"
                      ? "Continue to Payment"
                      : "Complete order"}
                </button>
              </form>
            </div>

            <div className="checkout-right-col">
              <div className="order-summary-box">
                <div className="order-items-list">
                  {items.map((item, index) => (
                    <div key={item.id || index} className="summary-item">
                      <div className="item-img-wrapper">
                        <img
                          src={item.image || "https://via.placeholder.com/65"}
                          alt={item.title || item.name}
                        />
                      </div>

                      <div className="item-details">
                        <h4 className="item-name">{item.title || item.name}</h4>

                        <div className="item-qty-controls">
                          <button
                            type="button"
                            className="item-qty-btn"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            -
                          </button>

                          <span className="item-qty-value">
                            {item.quantity || 1}
                          </span>

                          <button
                            type="button"
                            className="item-qty-btn"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="item-price-col">
                        <div className="item-price">
                          ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${shippingFee.toFixed(2)}</span>
                  </div>

                  <div className="summary-row total-row">
                    <span>Total</span>
                    <div className="total-amount">
                      <span className="currency-code">USD</span>
                      <span className="final-price">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
