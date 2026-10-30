
const express = require("express");

const router = express.Router();

const {
    addReply,
    getReplies,
    getActivities
} = require("../controllers/replyController");

// Add reply or internal note
router.post("/:ticketId", addReply);

// Get activity history - keep before generic route
router.get("/:ticketId/activities", getActivities);

// Get replies and notes
router.get("/:ticketId", getReplies);

module.exports = router;
