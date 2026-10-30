
const Reply = require("../models/Reply");
const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const logActivity = require("../utils/activityLogger");

// ADD PUBLIC REPLY OR INTERNAL NOTE
const addReply = async (req, res) => {
    try {
        const { content, type, author } = req.body;
        const { ticketId } = req.params;

        // Validate content
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reply content is required"
            });
        }

        // Validate reply type
        if (type && !["Public", "Internal"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be Public or Internal"
            });
        }

        // Check ticket ID validity
        if (!require("mongoose").isValidObjectId(ticketId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        // Find ticket
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const replyType = type || "Public";
        const replyAuthor = author || "Support Agent";

        // Save reply or internal note
        const reply = await Reply.create({
            ticket: ticketId,
            content: content.trim(),
            type: replyType,
            author: replyAuthor
        });

        // Update ticket's last-updated time
        ticket.updatedAt = new Date();
        await ticket.save();

        // Record activity history
        await logActivity({
            ticketId: ticketId,
            action: replyType === "Internal"
                ? "Internal Note"
                : "Public Reply",
            newValue: content.trim(),
            author: replyAuthor
        });

        res.status(201).json({
            success: true,
            message: "Reply added successfully",
            data: reply
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL REPLIES AND INTERNAL NOTES
const getReplies = async (req, res) => {
    try {
        const { ticketId } = req.params;

        if (!require("mongoose").isValidObjectId(ticketId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const replies = await Reply.find({
            ticket: ticketId
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: replies.length,
            data: replies
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET TICKET ACTIVITY HISTORY
const getActivities = async (req, res) => {
    try {
        const { ticketId } = req.params;

        if (!require("mongoose").isValidObjectId(ticketId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const activities = await Activity.find({
            ticket: ticketId
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// EXPORT CONTROLLERS
module.exports = {
    addReply,
    getReplies,
    getActivities
};
