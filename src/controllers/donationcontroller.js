const Donations = require("../models/donationmodel");
const DonationPaymentStatus = require("../models/donationPaymentStatusModel");
const DonationMember = require("../models/donationmembermodel");
const { default: mongoose } = require("mongoose");
const addDonation = async (req, res) => {
  try {
    const {
      donationmember_id,
      name,
      phone,
      address,
      months, // Expects e.g. ["July 2025", "August 2025"]
      donation_type,
      donation_details,
      amount, // <-- This amount is for the main donation record
    } = req.body;

    if (!Array.isArray(months) || months.length === 0) {
      return res.status(400).json({
        message:
          "Months array is required and must not be empty. Expected format: ['Month YYYY'].",
      });
    }

    const formattedMonths = months.map((m) => {
      const parts = m.split(" ");
      if (parts.length !== 2) {
        console.error(
          `Invalid month format in input: "${m}". Expected "Month YYYY".`
        );
        throw new Error(`Invalid month format: "${m}". Expected "Month YYYY".`);
      }
      const [monthName, year] = parts;
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;

      if (isNaN(monthIndex)) {
        console.error(`Could not parse month name "${monthName}" from "${m}".`);
        throw new Error(`Invalid month name: "${monthName}" in "${m}".`);
      }
      return `${year}-${monthIndex}`;
    });

    // Create the donation record
    const newDonation = await Donations.create({
      donationmember_id,
      name,
      phone,
      address,
      months: formattedMonths,
      donation_type,
      donation_details,
      amount, // Storing amount in Donations model
    });

    // For each donated month, mark as "paid" in DonationPaymentStatus
    await Promise.all(
      formattedMonths.map(async (month) => {
        await DonationPaymentStatus.findOneAndUpdate(
          { donationmember_id, month },
          { status: "paid", amount: amount }, // <-- FIX: Add 'amount' here
          { upsert: true, new: true }
        );
      })
    );

    res.status(201).json({
      message: "Donation added successfully",
      data: newDonation,
    });
  } catch (error) {
    console.error("Error adding donation:", error.message);
    res.status(400).json({ error: error.message });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const { date, startDate, endDate, donation_type, name, phone } = req.query;

    const filter = {};

    // Filter by donation_type
    if (donation_type) {
      filter.donation_type = donation_type;
    }

    // Filter by exact date or date range
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // Search by name (case-insensitive, partial match)
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // Search by phone (case-insensitive, partial match)
    if (phone) {
      filter.phone = { $regex: phone, $options: "i" };
    }

    // Use populate to get details of the associated donation member
    const donations = await Donations.find(filter).populate(
      "donationmember_id"
    );

    res.status(200).json({
      message: "Donations fetched successfully",
      data: donations,
    });
  } catch (error) {
    console.error("Error fetching all donations:", error.message);
    res.status(400).json({ error: error.message });
  }
};

const getDonationStatus = async (req, res) => {
  try {
    const { memberId } = req.params;

    // 1. Determine the current and last year
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    // 2. Generate a list of all 24 months (current year + last year)
    const allMonthsData = [];
    for (let year = lastYear; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Format as "YYYY-M" to match your assumed data format
        const monthKey = `${year}-${month}`;
        allMonthsData.push({
          month: monthKey,
          status: "unpaid", // Default status for missing months
          amount: 0, // Default amount
          // You might want to add other default fields if applicable
          donationmember_id: memberId, // Associate with the member for consistency
        });
      }
    }

    // 3. Fetch existing payment statuses from the database
    const paymentStatuses = await DonationPaymentStatus.find({
      donationmember_id: memberId,
      // Optional: Add a date range filter if your 'month' field can be parsed into dates
      // For example, if 'month' was a Date object, you'd filter:
      // month: { $gte: new Date(lastYear, 0, 1), $lte: new Date(currentYear, 11, 31) }
    }).populate("donationmember_id");

    // 4. Merge database results with the full month list
    const mergedData = new Map(
      allMonthsData.map((item) => [item.month, { ...item }])
    ); // Use a Map for efficient merging

    paymentStatuses.forEach((dbStatus) => {
      if (mergedData.has(dbStatus.month)) {
        // Overwrite default data with actual data from the database
        mergedData.set(dbStatus.month, {
          ...mergedData.get(dbStatus.month), // Keep defaults like memberId if not present in dbStatus
          ...dbStatus.toObject(), // Convert Mongoose document to plain object
        });
      }
    });

    const finalDonationData = Array.from(mergedData.values());

    if (finalDonationData.length === 0) {
      // This case should ideally not be hit if allMonthsData always has 24 entries
      // but keeping it as a safeguard.
      console.log(
        `[getDonationStatus] No donation payment statuses (after merge) found for memberId: ${memberId}`
      );
      return res.status(404).json({
        message: "No donation payment statuses found for this member.",
        data: [],
      });
    }

    res.status(200).json({
      message: "Donation payment statuses fetched successfully for 24 months",
      data: finalDonationData,
    });
  } catch (error) {
    console.error("Error fetching donation status:", error.message);
    res.status(400).json({ error: error.message });
  }
};

const updateDonationPaymentStatus = async (req, res) => {
  try {
    const { memberId } = req.params; // Make sure memberId is present in the URL
    const { month, status, amount } = req.body;

    // This validation is NOT the source of the 400 error
    if (!month || !status || amount == null) {
      return res.status(400).json({
        message: "Month (in YYYY-M format), status, and amount are required.",
      });
    }

    // Potential source of 400: The `memberId` from req.params is missing or invalid.
    // Add a check for memberId here
    if (!memberId) {
      console.log("Validation failed: memberId is missing from URL params.");
      return res
        .status(400)
        .json({ message: "Member ID is required in the URL." });
    }

    const updatedStatus = await DonationPaymentStatus.findOneAndUpdate(
      { donationmember_id: memberId, month: month },
      { status: status, amount: amount }, // include amount here
      { new: true, upsert: true }
    );

    // --- Your NEW LOGIC (if you implemented it from my previous suggestion) ---
    // This is a potential source of error if DonationMember model is not found
    // or if there's an issue with memberId
    if (status === "paid") {
      const donationMember = await DonationMember.findById(memberId);
      if (!donationMember) {
        console.warn(
          `Donation member not found for ID: ${memberId}. Cannot create detailed donation record.`
        );
        // You might choose to return an error here if a member must exist
        // return res.status(404).json({ message: "Donation member not found." });
      }

      await Donations.create({
        donationmember_id: memberId,
        name: donationMember ? donationMember.name : "Unknown",
        phone: donationMember ? donationMember.phone : "N/A",
        address: donationMember ? donationMember.address : "N/A",
        months: [month],
        donation_type: "monthly",
        donation_details: `Payment for ${month}`,
        amount: amount,
        status: "paid",
      });
    }
    // --- END NEW LOGIC ---

    res.status(200).json({
      message: "Donation payment status updated successfully",
      data: updatedStatus,
    });
  } catch (error) {
    // THIS IS THE MOST LIKELY PLACE THE 400 IS COMING FROM NOW
    console.error("Error updating donation payment status:", error.message);
    res.status(400).json({ error: error.message }); // <--- THIS line
  }
};

const getDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donations.findById(id);
    res.status(200).json({
      message: "Donation fetched successfully",
      data: donation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// update donation
const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      donationmember_id,
      month,
      donation_type,
      amount,
      donation_details,
    } = req.body;
    const updatedDonation = await Donations.findByIdAndUpdate(
      id,
      { donationmember_id, month, donation_type, amount, donation_details },
      { new: true }
    );
    res.status(200).json({
      message: "Donation updated successfully",
      data: updatedDonation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// delete donation
// const deleteDonation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedDonation = await Donations.findByIdAndDelete(id);
//     res.status(200).json({
//       message: "Donation deleted successfully",
//       data: deletedDonation,
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedDonation = await Donations.findByIdAndDelete(id);

    if (!deletedDonation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // ✅ Delete related payment status entries
    await DonationPaymentStatus.deleteMany({
      donationmember_id: deletedDonation.donationmember_id,
    });

    res.status(200).json({
      message: "Donation and related payment statuses deleted successfully",
      data: deletedDonation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  addDonation,
  getAllDonations,
  getDonationStatus,
  updateDonationPaymentStatus,
  getDonation,
  updateDonation,
  deleteDonation,
};
