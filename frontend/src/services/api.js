
import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

// Dashboard APIs
export const getDashboard = () =>
    API.get("/dashboard");

// Ticket APIs
export const getTickets = (params = {}) =>
    API.get("/tickets", { params });

export const getTicket = (id) =>
    API.get(`/tickets/${id}`);

export const createTicket = (data) =>
    API.post("/tickets", data);

export const updateTicket = (id, data) =>
    API.put(`/tickets/${id}`, data);

// Reply APIs
export const getReplies = (ticketId) =>
    API.get(`/replies/${ticketId}`);

export const addReply = (ticketId, data) =>
    API.post(`/replies/${ticketId}`, data);

export const getActivities = (ticketId) =>
  API.get(`/replies/${ticketId}/activities`);



export default API;
