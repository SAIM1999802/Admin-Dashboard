import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCustomers, deleteCustomer } from "../services/api";
import "../styles/Customers.css";

const Customers = () => {
  const [search, setSearch] = useState("");
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();
      const customersData = response?.data?.data || response?.data || [];

      const formattedList = [];
      for (let i = 0; i < customersData.length; i++) {
        const cust = customersData[i];
        formattedList.push({
          id: cust.custom_id || `#${String(cust.id).padStart(3, "0")}`,
          dbId: cust.id,
          name: cust.name || "Unknown Customer",
          email: cust.email || "No Email",
          orders: Number(cust.orders ?? cust.total_orders ?? 0),
        });
      }

      formattedList.sort((a, b) => a.dbId - b.dbId);
      setCustomersList(formattedList);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }
    try {
      await deleteCustomer(id);
      setCustomersList((prev) => prev.filter((cust) => cust.dbId !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleEdit = (e, dbId) => {
    e.stopPropagation();
    navigate(`/customers/edit/${dbId}`);
  };

  const handleRowClick = (dbId) => {
    navigate(`/customers/details/${dbId}`);
  };

  const filteredCustomers = customersList.filter((cust) => {
    const term = search.toLowerCase().trim();
    return (
      cust.name.toLowerCase().includes(term) ||
      cust.email.toLowerCase().includes(term) ||
      cust.id.toLowerCase().includes(term)
    );
  });

  const renderCustomerRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4 text-muted">
            Fetching live customer records...
          </td>
        </tr>
      );
    }

    if (filteredCustomers.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4 text-muted">
            No customers found.
          </td>
        </tr>
      );
    }

    const customerRows = [];
    for (let i = 0; i < filteredCustomers.length; i++) {
      const customer = filteredCustomers[i];
      customerRows.push(
        <tr
          key={customer.dbId || customer.id}
          onClick={() => handleRowClick(customer.dbId)}
          style={{ cursor: "pointer" }}
          className="clickable-row"
        >
          <td style={{ color: "#0969d7", fontWeight: "600" }}>
            #CUST-{i+1}
          </td>
          <td>{customer.name}</td>
          <td>{customer.email}</td>
          <td>
            {customer.orders}{" "}
            {customer.orders === 1 ? "Order" : "Orders"}
          </td>
          <td>
            <div className="d-flex gap-2">
              <button
                className="btn-action-edit custom-tooltip"
                onClick={(e) => handleEdit(e, customer.dbId)}
                data-title="Edit Customer"
              >
                <i className="bi bi-pencil-fill me-1"></i>
                Edit
              </button>

              <button
                className="btn-action-delete custom-tooltip"
                onClick={(e) => handleDelete(e, customer.dbId)}
                data-title="Delete Customer"
              >
                <i className="bi bi-trash-fill me-1"></i>
                Delete
              </button>
            </div>
          </td>
        </tr>
      );
    }
    return customerRows;
  };

  return (
    <>
      <Navbar />

      <main className="admin-page">
        <div className="page-header">
          <h1 className="page-title">Customer Directory</h1>

          <button
            className="primary-btn"
            onClick={() => navigate("/customers/add")}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Add Customer
          </button>
        </div>

        <div className="search-box">
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search by Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-card">
          <div className="tab-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="tab-scroll">CUSTOMER ID</th>
                  <th className="tab-scroll">NAME</th>
                  <th className="tab-scroll">EMAIL</th>
                  <th className="tab-scroll">TOTAL ORDERS PLACED</th>
                  <th className="tab-scroll">ACTIONS</th>
                </tr>
              </thead>

              <tbody>{renderCustomerRows()}</tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default Customers;