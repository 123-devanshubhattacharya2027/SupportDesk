
import { useState } from "react";
import { createTicket } from "../services/api";
import { X, Send } from "lucide-react";

function CreateTicket({ onClose, onCreated }) {

    const [form, setForm] = useState({
        subject: "",
        customerName: "",
        customerEmail: "",
        description: "",
        priority: "Medium",
        status: "Open",
        assignee: "Unassigned"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (
            !form.subject.trim() ||
            !form.description.trim() ||
            (!form.customerName.trim() && !form.customerEmail.trim())
        ) {
            setError("Subject, description and customer name or email are required.");
            return;
        }

        try {
            setLoading(true);

            await createTicket(form);

            alert("Ticket created successfully!");

            onCreated();
            onClose();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create ticket."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputStyle =
        "w-full border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center p-6 border-b">

                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Create New Ticket
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Create a customer support request.
                        </p>
                    </div>

                    <button onClick={onClose}>
                        <X />
                    </button>

                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Subject *
                        </label>

                        <input
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="Enter ticket subject"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Customer Name
                            </label>

                            <input
                                name="customerName"
                                value={form.customerName}
                                onChange={handleChange}
                                className={inputStyle}
                                placeholder="Customer name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Customer Email
                            </label>

                            <input
                                type="email"
                                name="customerEmail"
                                value={form.customerEmail}
                                onChange={handleChange}
                                className={inputStyle}
                                placeholder="customer@email.com"
                            />
                        </div>

                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            Description *
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className={inputStyle}
                            rows="4"
                            placeholder="Describe the customer issue..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Priority
                            </label>

                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Status
                            </label>

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Waiting on Customer</option>
                                <option>Resolved</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Assignee
                            </label>

                            <select
                                name="assignee"
                                value={form.assignee}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option>Unassigned</option>
                                <option>Agent Rahul</option>
                                <option>Agent Amit</option>
                                <option>Agent Priya</option>
                            </select>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 border rounded-lg"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg disabled:opacity-50"
                        >
                            <Send size={17} />
                            {loading ? "Creating..." : "Create Ticket"}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}

export default CreateTicket;
