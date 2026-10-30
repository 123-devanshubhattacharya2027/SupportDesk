
const express = require("express");

const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket
} = require("../controllers/ticketController");

// POST /api/tickets
router.post("/", createTicket);

// GET /api/tickets
router.get("/", getTickets);

// GET /api/tickets/:id
router.get("/:id", getTicketById);

// PUT /api/tickets/:id
router.put("/:id", updateTicket);

module.exports = router;
