const CustomerModel = require('../models/customerModel');

exports.getCustomers = async (req, res) => {
  try {
    const customers = await CustomerModel.getAllCustomers();

    const formattedCustomers = customers.map((cust) => ({
      id: cust.id,
      custom_id: `#CUST-${String(cust.id).padStart(3, '0')}`,
      name: cust.name,
      email: cust.email,
      phone: cust.phone || '',
      address: cust.address || '',
      orders: Number(cust.total_orders || 0),
      total_spent: Number(cust.total_spent || 0),
      created_at: cust.created_at,
    }));

    return res.status(200).json({
      success: true,
      count: formattedCustomers.length,
      data: formattedCustomers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching customers.',
    });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided.',
      });
    }

    const customer = await CustomerModel.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const formattedId = `#CUST-${String(customer.id).padStart(3, '0')}`;

    return res.status(200).json({
      success: true,
      data: {
        id: customer.id,
        custom_id: formattedId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        orders: Number(customer.total_orders || 0),
        created_at: customer.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching customer details.',
    });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingCustomer = email
      ? await CustomerModel.getCustomerByEmail(email.trim().toLowerCase())
      : null;

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email already exists.',
      });
    }

    const newCustomer = await CustomerModel.createCustomer(
      name ? name.trim() : '',
      email ? email.trim().toLowerCase() : ''
    );
    const formattedId = `#CUST-${String(newCustomer.id).padStart(3, '0')}`;

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: {
        id: newCustomer.id,
        custom_id: formattedId,
        name: newCustomer.name,
        email: newCustomer.email,
        orders: 0,
      },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating customer.',
    });
  }
};

exports.getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const customer = await CustomerModel.getCustomerById(id, userId);
    if (!customer)
      return res.status(404).json({ message: 'customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided.',
      });
    }

    const result = await CustomerModel.updateCustomer(
      id,
      name ? name.trim() : '',
      email ? email.trim().toLowerCase() : '',
      phone ? phone.trim() : null,
      address ? address.trim() : null
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or failed to update.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating customer.',
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided.',
      });
    }

    const result = await CustomerModel.deleteCustomer(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting customer.',
    });
  }
};