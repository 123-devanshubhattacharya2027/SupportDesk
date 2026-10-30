
const Ticket = require("../models/Ticket");
const logActivity = require("../utils/activityLogger");

// CREATE TICKET
const createTicket = async (req, res) => {
    try {
        const {
            subject,
            customerName,
            customerEmail,
            description,
            priority,
            status,
            assignee
        } = req.body;

        // Validate required fields
        if (
            !subject?.trim() ||
            !description?.trim() ||
            (!customerName?.trim() && !customerEmail?.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Subject, description and customer name or email are required"
            });
        }

        const ticket = await Ticket.create({
            subject,
            customerName,
            customerEmail,
            description,
            priority,
            status,
            assignee
        });

        // Record ticket creation
        await logActivity({
            ticketId: ticket._id,
            action: "Created",
            newValue: ticket.subject
        });

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: ticket
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL TICKETS WITH SEARCH, FILTER AND SORT
const getTickets = async (req, res) => {
    try {
        const {
            search,
            status,
            priority,
            assignee,
            sort
        } = req.query;

        // Build dynamic filter
        const filter = {};

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignee) filter.assignee = assignee;

        // Search by subject, customer name or email
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                { customerEmail: { $regex: search, $options: "i" } }
            ];
        }

        // Default sorting: recently updated first
        let tickets = await Ticket.find(filter)
            .sort({ updatedAt: -1 });

        // Custom priority sorting
        if (sort === "priority") {

            const priorityRank = {
                Urgent: 4,
                High: 3,
                Medium: 2,
                Low: 1
            };

            tickets.sort((a, b) =>
                priorityRank[b.priority] - priorityRank[a.priority]
            );
        }

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET SINGLE TICKET
const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        res.status(200).json({
            success: true,
            data: ticket
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid ticket ID"
        });
    }
};


// UPDATE TICKET
const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const allowedFields = [
            "subject",
            "customerName",
            "customerEmail",
            "description",
            "priority",
            "status",
            "assignee"
        ];

        const changes = [];

        // Detect modified fields
        for (const field of allowedFields) {

            if (
                Object.prototype.hasOwnProperty.call(req.body, field) &&
                req.body[field] !== ticket[field]
            ) {

                changes.push({
                    field,
                    oldValue: ticket[field] || null,
                    newValue: req.body[field] || null
                });

                ticket[field] = req.body[field];
            }
        }

        // Save updated ticket
        await ticket.save();

        // Record important changes
        for (const change of changes) {

            let action = null;

            if (change.field === "status") {
                action = "Status Changed";
            }

            if (change.field === "priority") {
                action = "Priority Changed";
            }

            if (change.field === "assignee") {
                action = "Assigned";
            }

            if (action) {
                await logActivity({
                    ticketId: ticket._id,
                    action,
                    oldValue: change.oldValue,
                    newValue: change.newValue
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Ticket updated successfully",
            data: ticket
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// EXPORT CONTROLLERS
module.exports = {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket
};
