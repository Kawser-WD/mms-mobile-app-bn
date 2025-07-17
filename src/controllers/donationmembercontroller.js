const DonationMember = require("../models/donationmembermodel");

// create donation member
const createDonationMember = async (req, res) => {
  try {
    const { name, phone, address, amount, password } = req.body;
    const newDonationMember = await DonationMember.create({
      name,
      phone,
      address,
      amount,
      password,
    });
    res.status(201).json({
      message: "Donation member created successfully",
      data: newDonationMember,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get all donation members
const getAllDonationMembers = async (req, res) => {
  try {
    const donationMembers = await DonationMember.find();
    res.status(200).json({
      message: "Donation members fetched successfully",
      data: donationMembers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// get single donation member
const getDonationMember = async (req, res) => {
  try {
    const { id } = req.params;
    const donationMember = await DonationMember.findById(id);
    res.status(200).json({
      message: "Donation member fetched successfully",
      data: donationMember,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update donation member
const updateDonationMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, amount } = req.body;
    const updatedDonationMember = await DonationMember.findByIdAndUpdate(
      id,
      { name, phone, address, amount },
      { new: true }
    );
    res.status(200).json({
      message: "Donation member updated successfully",
      data: updatedDonationMember,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete donation member

const deleteDonationMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDonationMember = await DonationMember.findByIdAndDelete(id);
    res.status(200).json({
      message: "Donation member deleted successfully",
      data: deletedDonationMember,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createDonationMember,
  getAllDonationMembers,
  getDonationMember,
  updateDonationMember,
  deleteDonationMember,
};
