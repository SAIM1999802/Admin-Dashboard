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
      const customersData =
        response?.data?.data || response?.data || [];

      const formattedList = [];

      for (let i = 0; i < customersData.length; i++) {
        const cust = customersData[i];

        formattedList.push({
          id:
            cust.custom_id ||
            `#${String(cust.id).padStart(3, "0")}`,
          dbId: cust.id,
          name: cust.name || "Unknown Customer",
          email: cust.email || "No Email",
          orders: Number(
            cust.orders ?? cust.total_orders ?? 0
          ),
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

    if (
      !window.confirm(
        "Are you sure you want to delete this customer?"
      )
    ) {
      return;
    }

    try {
      await deleteCustomer(id);

      setCustomersList((prev) =>
        prev.filter((cust) => cust.dbId !== id)
      );
    } catch (error) {
      console.error("Error deleting customer:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete customer"
      );
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
          <td
            colSpan="5"
            className="text-center py-4"
            style={{ color: "#64748b" }}
          >
            Fetching live customer records...
          </td>
        </tr>
      );
    }

    if (filteredCustomers.length === 0) {
      return (
        <tr>
          <td
            colSpan="5"
            className="text-center py-4"
            style={{ color: "#64748b" }}
          >
            No customers found.
          </td>
        </tr>
      );
    }

    return filteredCustomers.map((customer, i) => (
      <tr
        key={customer.dbId || customer.id}
        onClick={() => handleRowClick(customer.dbId)}
        className="clickable-row"
      >
        <td
          style={{
            color: "#ff5000",
            fontWeight: "700",
          }}
        >
          #{i + 1}
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
              type="button"
              className="btn-action-edit"
              onClick={(e) =>
                handleEdit(e, customer.dbId)
              }
            >
              <i className="bi bi-pencil-fill me-1"></i>
              Edit
            </button>

            <button
              type="button"
              className="btn-action-delete"
              onClick={(e) =>
                handleDelete(e, customer.dbId)
              }
            >
              <i className="bi bi-trash-fill me-1"></i>
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <Navbar />

      <main className="admin-page container">
        <div className="row">
          <div className="col-12">

            {/* PAGE HEADER */}
            <div className="page-header">
              <h1>
                Customer Directory
              </h1>

              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  navigate("/customers/add")
                }
              >
                <i className="bi bi-plus-lg me-1"></i>
                Add Customer
              </button>
            </div>

            {/* SEARCH */}
            <div className="search-box">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search by Name or Email..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            {/* TABLE */}
            <div className="table-card">
              <div className="tab-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "15%" }}>
                        ID
                      </th>

                      <th>
                        NAME
                      </th>

                      <th>
                        EMAIL
                      </th>

                      <th>
                        TOTAL ORDERS PLACED
                      </th>

                      <th style={{ width: "25%" }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {renderCustomerRows()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
};

export default Customers;

