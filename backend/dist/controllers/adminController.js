const Register = require('../models/Register');
const { sendApprovalEmail, sendRejectionEmail } = require('../services/emailService');

// Get all pending registrations
exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingRegistrations = await Register.find({ status: 'pending' })
            .sort({ createdAt: -1});
        res.status(200).json(pendingRegistrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all registrations (for admin dashboard)
exports.getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Register.find()
            .sort({ createdAt: -1});
        res.status(200).json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve a registration - changes status to 'doc-processing'
exports.approveRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedBy } = req.body;

        const registration = await Register.findById(id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.status !== 'pending') {
            return res.status(400).json({ message: 'Registration is not pending' });
        }

        registration.status = 'doc-processing';
        registration.approvedBy = approvedBy;
        registration.approvedAt = new Date();

        await registration.save();

        // Send approval email with partnership deed attachment
        const partnershipDeedPath = 'D:/BCA Capstone 25/park-pro-web/frontend/registerprocess/ParkPro_Partnership_Deed_With_Green_Seal.pdf';
        
        await sendApprovalEmail(
            registration.email, 
            registration.name, 
            registration.registrationId,
            [
                {
                    filename: 'ParkPro_Partnership_Deed_With_Green_Seal.pdf',
                    path: partnershipDeedPath,
                    contentType: 'application/pdf'
                }
            ]
        );

        res.status(200).json({
            message: 'Registration approved for documentation process',
            registration
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept a registration (change status to doc-process)
exports.acceptRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { acceptedBy } = req.body;

        const registration = await Register.findById(id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.status !== 'pending') {
            return res.status(400).json({ message: 'Registration is not pending' });
        }

        registration.status = 'doc-process';
        registration.approvedBy = acceptedBy;
        registration.approvedAt = new Date();

        await registration.save();

        // Send approval email with partnership deed attachment
        const partnershipDeedPath = 'D:/BCA Capstone 25/park-pro-web/frontend/registerprocess/ParkPro_Partnership_Deed_With_Green_Seal.pdf';
        
        await sendApprovalEmail(
            registration.email, 
            registration.name, 
            registration.registrationId,
            [
                {
                    filename: 'ParkPro_Partnership_Deed_With_Green_Seal.pdf',
                    path: partnershipDeedPath,
                    contentType: 'application/pdf'
                }
            ]
        );

        res.status(200).json({
            message: 'Registration accepted for documentation process',
            registration
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject a registration
exports.rejectRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectedBy, rejectionReason } = req.body;

        const registration = await Register.findById(id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.status !== 'pending') {
            return res.status(400).json({ message: 'Registration is not pending' });
        }

        registration.status = 'rejected';
        registration.approvedBy = rejectedBy;
        registration.rejectedAt = new Date();
        registration.rejectionReason = rejectionReason;

        await registration.save();

        // Send rejection email
        await sendRejectionEmail(registration.email, registration.name, rejectionReason);

        res.status(200).json({
            message: 'Registration rejected successfully',
            registration
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get registration statistics
exports.getRegistrationStats = async (req, res) => {
    try {
        const stats = await Register.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
