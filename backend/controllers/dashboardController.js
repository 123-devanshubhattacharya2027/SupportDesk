
const Ticket = require("../models/Ticket");

const getDashboardStats = async (req, res) => {
    try {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        const tickets = await Ticket.find();

        const totalTickets = tickets.length;

        const openTickets = tickets.filter(
            ticket => ticket.status === "Open"
        ).length;

        const inProgressTickets = tickets.filter(
            ticket => ticket.status === "In Progress"
        ).length;

        const resolvedTickets = tickets.filter(
            ticket => ticket.status === "Resolved"
        ).length;

        const urgentTickets = tickets.filter(
            ticket => ticket.priority === "Urgent"
        ).length;

        const overdueTickets = tickets.filter(ticket =>
            ticket.status !== "Resolved" &&
            now - ticket.createdAt.getTime() > twentyFourHours
        ).length;

        res.status(200).json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
                urgentTickets,
                overdueTickets
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { getDashboardStats };
