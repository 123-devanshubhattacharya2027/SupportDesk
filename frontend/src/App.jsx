import { useCallback, useEffect, useMemo, useState } from "react";

import {
    LayoutDashboard,
    Ticket,
    Plus,
    Search,
    Users,
    Settings,
    Bell,
    RefreshCw,
    Clock,
    AlertCircle,
    CheckCircle2,
    CircleDot,
    MessageSquare,
    ArrowUpRight,
    X,
    Save
} from "lucide-react";

import { getDashboard, getTickets } from "./services/api";
import CreateTicket from "./pages/CreateTicket";
import TicketDetails from "./pages/TicketDetails";

// Default dashboard statistics
const EMPTY_STATS = {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    overdueTickets: 0
};

// Check whether a ticket is overdue
const isTicketOverdue = (ticket) => {
    if (
        !ticket ||
        ticket.status === "Resolved" ||
        !ticket.createdAt
    ) {
        return false;
    }

    const createdTime = new Date(ticket.createdAt).getTime();

    return (
        Number.isFinite(createdTime) &&
        Date.now() - createdTime > 24 * 60 * 60 * 1000
    );
};

function App() {
    // =====================================
    // STATES
    // =====================================

    const [stats, setStats] = useState(EMPTY_STATS);
    const [tickets, setTickets] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState("");
    const [sort, setSort] = useState("");

    const [activePage, setActivePage] = useState("dashboard");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Settings
    const [agentName, setAgentName] = useState(
        () => localStorage.getItem("supportAgentName") || "Support Agent"
    );

    const [agentEmail, setAgentEmail] = useState(
        () => localStorage.getItem("supportAgentEmail") ||
            "agent@supportdesk.com"
    );

    const [notificationsEnabled, setNotificationsEnabled] = useState(
        () => localStorage.getItem("supportNotifications") !== "false"
    );

    const [settingsMessage, setSettingsMessage] = useState("");

    // =====================================
    // FETCH DASHBOARD
    // =====================================

    const fetchDashboard = useCallback(async () => {
        try {
            const response = await getDashboard();

            setStats({
                ...EMPTY_STATS,
                ...(response.data?.data || {})
            });

        } catch (err) {
            console.error("Dashboard error:", err);
            setError("Unable to load dashboard statistics.");
        }
    }, []);

    // =====================================
    // FETCH TICKETS
    // =====================================

    const fetchTickets = useCallback(async () => {
        setLoading(true);

        try {
            const params = {};

            if (search.trim()) {
                params.search = search.trim();
            }

            if (statusFilter && statusFilter !== "Overdue") {
                params.status = statusFilter;
            }

            if (priorityFilter) {
                params.priority = priorityFilter;
            }

            if (assigneeFilter) {
                params.assignee = assigneeFilter;
            }

            if (sort) {
                params.sort = sort;
            }

            const response = await getTickets(params);

            let fetchedTickets = response.data?.data || [];

            if (statusFilter === "Overdue") {
                fetchedTickets = fetchedTickets.filter(isTicketOverdue);
            }

            setTickets(fetchedTickets);
            setError("");

        } catch (err) {
            console.error("Ticket fetching error:", err);
            setError("Unable to load tickets. Check your backend server.");
            setTickets([]);

        } finally {
            setLoading(false);
        }

    }, [search, statusFilter, priorityFilter, assigneeFilter, sort]);

    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);

        return () => clearTimeout(timer);

    }, [fetchTickets]);

    // =====================================
    // REFRESH DATA
    // =====================================

    const refreshDashboard = async () => {
        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };

    // =====================================
    // NAVIGATION
    // =====================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("");
        setPriorityFilter("");
        setAssigneeFilter("");
        setSort("");
    };

    const navigateTo = (page) => {
        setActivePage(page);
        setSelectedTicketId(null);
        setShowCreateForm(false);
        setError("");

        if (
            page === "customers" ||
            page === "conversations" ||
            page === "dashboard"
        ) {
            clearFilters();
        }
    };

    // =====================================
    // AFTER TICKET CREATION
    // =====================================

    const handleTicketCreated = async () => {
        setShowCreateForm(false);

        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };

    // =====================================
    // AFTER TICKET UPDATE
    // =====================================

    const handleTicketUpdated = async () => {
        await Promise.all([
            fetchDashboard(),
            fetchTickets()
        ]);
    };

    // =====================================
    // CUSTOMER DATA
    // =====================================

    const customers = useMemo(() => {
        const grouped = new Map();

        tickets.forEach((ticket) => {
            const email = (ticket.customerEmail || "").trim();
            const name = (ticket.customerName || "").trim();

            const key = (email || name || "unknown").toLowerCase();

            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    name: name || "Unknown Customer",
                    email: email || "No email provided",
                    ticketCount: 0
                });
            }

            grouped.get(key).ticketCount += 1;
        });

        return Array.from(grouped.values());

    }, [tickets]);

    // =====================================
    // BADGE STYLES
    // =====================================

    const getStatusStyle = (status) => {
        const styles = {
            "Open": "bg-blue-100 text-blue-700",
            "In Progress": "bg-purple-100 text-purple-700",
            "Waiting on Customer": "bg-amber-100 text-amber-700",
            "Resolved": "bg-green-100 text-green-700",
            "Overdue": "bg-red-100 text-red-700"
        };

        return styles[status] || "bg-gray-100 text-gray-700";
    };

    const getPriorityStyle = (priority) => {
        const styles = {
            "Low": "bg-gray-100 text-gray-700",
            "Medium": "bg-blue-100 text-blue-700",
            "High": "bg-orange-100 text-orange-700",
            "Urgent": "bg-red-100 text-red-700"
        };

        return styles[priority] || "bg-gray-100 text-gray-700";
    };

    // =====================================
    // DASHBOARD STATISTICS
    // =====================================

    const statCards = [
        {
            title: "Total Tickets",
            value: stats.totalTickets,
            icon: Ticket,
            color: "bg-blue-100 text-blue-600"
        },
        {
            title: "Open Tickets",
            value: stats.openTickets,
            icon: CircleDot,
            color: "bg-amber-100 text-amber-600"
        },
        {
            title: "In Progress",
            value: stats.inProgressTickets,
            icon: Clock,
            color: "bg-purple-100 text-purple-600"
        },
        {
            title: "Resolved",
            value: stats.resolvedTickets,
            icon: CheckCircle2,
            color: "bg-green-100 text-green-600"
        },
        {
            title: "Urgent Tickets",
            value: stats.urgentTickets,
            icon: AlertCircle,
            color: "bg-red-100 text-red-600"
        },
        {
            title: "Overdue Tickets",
            value: stats.overdueTickets,
            icon: Clock,
            color: "bg-orange-100 text-orange-600"
        }
    ];

    // =====================================
    // PAGE INFORMATION
    // =====================================

    const pageTitles = {
        dashboard: "Dashboard",
        tickets: "All Tickets",
        customers: "Customers",
        conversations: "Conversations",
        settings: "Settings"
    };

    const pageDescriptions = {
        dashboard: "Welcome back! Here's your support overview.",
        tickets: "Search, filter and manage support tickets.",
        customers: "View customers who submitted support requests.",
        conversations: "View customer replies and internal notes.",
        settings: "Manage your agent preferences."
    };

    const navItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard
        },
        {
            id: "tickets",
            label: "All Tickets",
            icon: Ticket
        },
        {
            id: "customers",
            label: "Customers",
            icon: Users
        },
        {
            id: "conversations",
            label: "Conversations",
            icon: MessageSquare
        }
    ];

    // =====================================
    // MAIN UI
    // =====================================

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* SIDEBAR */}

            <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 min-h-screen">

                <div className="p-6 border-b border-slate-700">

                    <div className="flex items-center gap-3">

                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Ticket size={24} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold">
                                SupportDesk
                            </h1>

                            <p className="text-xs text-slate-400">
                                Customer Support Portal
                            </p>
                        </div>

                    </div>

                </div>

                <nav className="flex-1 p-4 space-y-2">

                    <p className="text-xs text-slate-500 uppercase font-semibold px-3 mb-3">
                        Workspace
                    </p>

                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => navigateTo(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                                    activePage === item.id
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                <Icon size={19} />
                                {item.label}
                            </button>
                        );
                    })}

                    <div className="pt-6">

                        <p className="text-xs text-slate-500 uppercase font-semibold px-3 mb-3">
                            Preferences
                        </p>

                        <button
                            onClick={() => navigateTo("settings")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                                activePage === "settings"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            <Settings size={19} />
                            Settings
                        </button>

                    </div>

                </nav>

                <div className="p-4 border-t border-slate-700">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                            {agentName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                                {agentName}
                            </p>

                            <p className="text-xs text-slate-400 truncate">
                                Support Agent
                            </p>
                        </div>

                    </div>

                </div>

            </aside>

            {/* MAIN CONTENT */}

            <main className="flex-1 min-w-0">

                {/* TOP HEADER */}

                <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">

                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {pageTitles[activePage]}
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            {pageDescriptions[activePage]}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={refreshDashboard}
                            disabled={loading}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={19}
                                className={loading ? "animate-spin" : ""}
                            />
                        </button>

                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold"
                        >
                            <Plus size={19} />
                            Create Ticket
                        </button>

                    </div>

                </header>

                <div className="p-8">

                    {/* ERROR MESSAGE */}

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle size={19} />
                            {error}

                            <button
                                onClick={() => setError("")}
                                className="ml-auto"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* =====================================
                        DASHBOARD PAGE
                    ===================================== */}

                    {activePage === "dashboard" && (

                        <div className="space-y-8">

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

                                {statCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <div
                                            key={card.title}
                                            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
                                        >
                                            <div className="flex justify-between items-center">

                                                <div>
                                                    <p className="text-sm text-slate-500">
                                                        {card.title}
                                                    </p>

                                                    <h3 className="text-3xl font-bold text-slate-800 mt-2">
                                                        {loading ? "—" : card.value}
                                                    </h3>
                                                </div>

                                                <div className={`p-4 rounded-xl ${card.color}`}>
                                                    <Icon size={25} />
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}

                            </div>

                            <div className="flex justify-between items-center">

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Recent Tickets
                                    </h3>

                                    <p className="text-sm text-slate-500">
                                        Latest customer support requests
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigateTo("tickets")}
                                    className="text-indigo-600 font-semibold text-sm hover:underline"
                                >
                                    View All Tickets
                                </button>

                            </div>

                            <TicketList
                                tickets={tickets.slice(0, 5)}
                                loading={loading}
                                onSelect={setSelectedTicketId}
                                getStatusStyle={getStatusStyle}
                                getPriorityStyle={getPriorityStyle}
                                compact
                            />

                        </div>
                    )}

                    {/* =====================================
                        ALL TICKETS PAGE
                    ===================================== */}

                    {activePage === "tickets" && (

                        <TicketList
                            tickets={tickets}
                            loading={loading}
                            onSelect={setSelectedTicketId}
                            getStatusStyle={getStatusStyle}
                            getPriorityStyle={getPriorityStyle}
                            search={search}
                            setSearch={setSearch}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            assigneeFilter={assigneeFilter}
                            setAssigneeFilter={setAssigneeFilter}
                            sort={sort}
                            setSort={setSort}
                        />

                    )}

                    {/* =====================================
                        CUSTOMERS PAGE
                    ===================================== */}

                    {activePage === "customers" && (

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

                            <div className="p-6 border-b border-slate-200">

                                <h3 className="text-lg font-bold text-slate-800">
                                    Customer Directory
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    Customers who have submitted support tickets.
                                </p>

                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-500">
                                    Loading customers...
                                </div>
                            ) : customers.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    No customers found.
                                </div>
                            ) : (

                                <div className="divide-y divide-slate-100">

                                    {customers.map((customer) => (

                                        <div
                                            key={customer.key}
                                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >

                                            <div className="flex items-center gap-4">

                                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-slate-800">
                                                        {customer.name}
                                                    </h4>

                                                    <p className="text-sm text-slate-500">
                                                        {customer.email}
                                                    </p>
                                                </div>

                                            </div>

                                            <div className="flex items-center gap-4">

                                                <span className="text-sm text-slate-600">
                                                    {customer.ticketCount} ticket(s)
                                                </span>

                                                <button
                                                    onClick={() => {
                                                        setSearch(customer.email === "No email provided"
                                                            ? customer.name
                                                            : customer.email
                                                        );
                                                        setActivePage("tickets");
                                                    }}
                                                    className="text-indigo-600 text-sm font-semibold hover:underline"
                                                >
                                                    View Tickets
                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    )}

                    {/* =====================================
                        CONVERSATIONS PAGE
                    ===================================== */}

                    {activePage === "conversations" && (

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

                            <div className="p-6 border-b border-slate-200">

                                <h3 className="text-lg font-bold text-slate-800">
                                    Customer Conversations
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    Open a ticket to view replies and internal notes.
                                </p>

                            </div>

                            {loading ? (
                                <div className="p-10 text-center text-slate-500">
                                    Loading conversations...
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">
                                    No conversations available.
                                </div>
                            ) : (

                                <div className="divide-y divide-slate-100">

                                    {tickets.map((ticket) => (

                                        <button
                                            key={ticket._id}
                                            onClick={() => setSelectedTicketId(ticket._id)}
                                            className="w-full p-5 text-left hover:bg-slate-50 transition"
                                        >

                                            <div className="flex justify-between items-center gap-4">

                                                <div className="min-w-0">

                                                    <h4 className="font-semibold text-slate-800 truncate">
                                                        {ticket.subject}
                                                    </h4>

                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {ticket.customerName || ticket.customerEmail || "Unknown Customer"}
                                                    </p>

                                                </div>

                                                <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold shrink-0">
                                                    Open
                                                    <ArrowUpRight size={16} />
                                                </div>

                                            </div>

                                        </button>

                                    ))}

                                </div>

                            )}

                        </div>

                    )}

                    {/* =====================================
                        SETTINGS PAGE
                    ===================================== */}

                    {activePage === "settings" && (

                        <div className="max-w-2xl bg-white border border-slate-200 rounded-xl shadow-sm p-7">

                            <h3 className="text-lg font-bold text-slate-800">
                                Agent Settings
                            </h3>

                            <p className="text-sm text-slate-500 mt-1 mb-7">
                                Update your local agent preferences.
                            </p>

                            {settingsMessage && (
                                <div className="mb-5 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                                    {settingsMessage}
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();

                                    localStorage.setItem("supportAgentName", agentName);
                                    localStorage.setItem("supportAgentEmail", agentEmail);
                                    localStorage.setItem("supportNotifications", String(notificationsEnabled));

                                    setSettingsMessage("Settings saved successfully!");
                                }}
                                className="space-y-5"
                            >

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Agent Name
                                    </label>

                                    <input
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Agent Email
                                    </label>

                                    <input
                                        type="email"
                                        value={agentEmail}
                                        onChange={(e) => setAgentEmail(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between border rounded-lg p-4">

                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            Notifications
                                        </p>

                                        <p className="text-sm text-slate-500">
                                            Enable local notification preference.
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={notificationsEnabled}
                                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                        className="w-5 h-5 accent-indigo-600"
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-semibold"
                                >
                                    <Save size={18} />
                                    Save Settings
                                </button>

                            </form>

                        </div>

                    )}

                </div>

            </main>

            {/* CREATE TICKET MODAL */}

            {showCreateForm && (
                <CreateTicket
                    onClose={() => setShowCreateForm(false)}
                    onCreated={handleTicketCreated}
                />
            )}

            {/* TICKET DETAILS MODAL */}

            {selectedTicketId && (
                <TicketDetails
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                    onUpdated={handleTicketUpdated}
                />
            )}

        </div>
    );
}

// =====================================
// TICKET LIST COMPONENT
// =====================================

function TicketList({
    tickets,
    loading,
    onSelect,
    getStatusStyle,
    getPriorityStyle,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    sort,
    setSort,
    compact = false
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

            {/* TABLE HEADER */}

            {!compact && (
                <div className="p-6 border-b border-slate-200">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                Ticket Management
                            </h3>

                            <p className="text-sm text-slate-500 mt-1">
                                Manage all customer support tickets.
                            </p>
                        </div>

                    </div>

                </div>
            )}

            {/* SEARCH AND FILTERS */}

            {!compact && (
                <div className="p-5 border-b border-slate-200 space-y-4">

                    <div className="relative">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by subject, customer name or email..."
                            className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-3 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting on Customer">
                                Waiting on Customer
                            </option>
                            <option value="Resolved">Resolved</option>
                            <option value="Overdue">Overdue</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-3 text-sm"
                        >
                            <option value="">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>

                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-3 text-sm"
                        >
                            <option value="">All Agents</option>
                            <option value="Unassigned">Unassigned</option>
                            <option value="Agent Rahul">Agent Rahul</option>
                            <option value="Agent Amit">Agent Amit</option>
                            <option value="Agent Priya">Agent Priya</option>
                        </select>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="border border-slate-200 rounded-lg px-3 py-3 text-sm"
                        >
                            <option value="">Recently Updated</option>
                            <option value="priority">Priority</option>
                        </select>

                    </div>

                </div>
            )}

            {/* TICKET TABLE */}

            <div className="overflow-x-auto">

                <table className="w-full text-left">

                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">

                        <tr>
                            <th className="px-5 py-4">Ticket</th>
                            <th className="px-5 py-4">Customer</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4">Priority</th>
                            <th className="px-5 py-4">Assignee</th>
                            <th className="px-5 py-4">Last Updated</th>
                        </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                        {tickets.map((ticket) => (

                            <tr
                                key={ticket._id}
                                onClick={() => onSelect(ticket._id)}
                                className="hover:bg-slate-50 cursor-pointer transition"
                            >

                                <td className="px-5 py-4">

                                    <p className="font-semibold text-slate-800 max-w-xs truncate">
                                        {ticket.subject}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        #{ticket._id?.slice(-6)}
                                    </p>

                                </td>

                                <td className="px-5 py-4">

                                    <p className="text-sm font-medium text-slate-700">
                                        {ticket.customerName || "Unknown"}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                        {ticket.customerEmail || "No email"}
                                    </p>

                                </td>

                                <td className="px-5 py-4">

                                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getStatusStyle(
                                        isTicketOverdue(ticket) ? "Overdue" : ticket.status
                                    )}`}>
                                        {isTicketOverdue(ticket) ? "Overdue" : ticket.status}
                                    </span>

                                </td>

                                <td className="px-5 py-4">

                                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${getPriorityStyle(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>

                                </td>

                                <td className="px-5 py-4 text-sm text-slate-600">
                                    {ticket.assignee || "Unassigned"}
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                                    {ticket.updatedAt
                                        ? new Date(ticket.updatedAt).toLocaleDateString()
                                        : "—"}
                                </td>

                            </tr>

                        ))}

                        {!loading && tickets.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-12 text-slate-500"
                                >
                                    No tickets found.
                                </td>
                            </tr>
                        )}

                        {loading && tickets.length === 0 && (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="text-center py-12 text-slate-500"
                                >
                                    Loading tickets...
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            {/* TABLE FOOTER */}

            <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">

                <span>
                    Showing {tickets.length} tickets
                </span>

                <span className="flex items-center gap-1">
                    Live database data
                    <ArrowUpRight size={15} />
                </span>

            </div>

        </div>
    );
}

export default App;