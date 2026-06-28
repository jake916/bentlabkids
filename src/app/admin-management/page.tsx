"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Shield,
  Plus,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
  UserCheck,
  Play,
  ShoppingBag,
  Key,
  Trash2,
} from "lucide-react";
import { ToastContainer, ToastItem } from "@/components/Toast";
import { AdminUser, getStoredAdmins } from "@/lib/admins-data";
import {
  getAdmins,
  inviteAdmin,
  assignUserRole,
  deleteAdmin,
  deactivateAdmin,
  activateAdmin,
  forgotPassword,
  Role,
  BackendAdminUser,
} from "@/lib/api";

const STATIC_ROLES: Role[] = [
  {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Full system access and configurations.",
    permissions: [
      { permission: "MANAGE_SYSTEM" },
      { permission: "MANAGE_ADMINS" },
      { permission: "MANAGE_USERS" },
      { permission: "MANAGE_CONTENT" },
      { permission: "MANAGE_PRODUCTS" }
    ]
  },
  {
    id: "ADMIN",
    name: "Admin",
    description: "Can manage users and most content types.",
    permissions: [
      { permission: "MANAGE_USERS" },
      { permission: "MANAGE_CONTENT" },
      { permission: "MANAGE_PRODUCTS" }
    ]
  },
  {
    id: "CONTENT_ADMIN",
    name: "Content Admin",
    description: "Upload and organize media assets.",
    permissions: [
      { permission: "MANAGE_CONTENT" }
    ]
  },
  {
    id: "PRODUCT_ADMIN",
    name: "Product Admin",
    description: "Manage store items and billing.",
    permissions: [
      { permission: "MANAGE_PRODUCTS" }
    ]
  }
];

const getRoleFromType = (adminType: string | null): Role => {
  return STATIC_ROLES.find(r => r.id === adminType) || STATIC_ROLES[1]; // default to Admin
};

const getRoleMeta = (roleName: string) => {
  const normalized = roleName.toLowerCase();
  if (normalized.includes("super")) {
    return {
      displayName: "Super Admin",
      icon: Shield,
      colorClass: "text-[#B31046]",
      bgClass: "bg-[#FFF0F2]/10",
      desc: "Full system access and configurations."
    };
  } else if (normalized.includes("content")) {
    return {
      displayName: "Content Admin",
      icon: Play,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50/10",
      desc: "Upload and organize media assets."
    };
  } else if (normalized.includes("product") || normalized.includes("store") || normalized.includes("manager")) {
    return {
      displayName: "Product Admin",
      icon: ShoppingBag,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50/10",
      desc: "Manage store items and billing."
    };
  } else {
    return {
      displayName: roleName,
      icon: ShieldCheck,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50/10",
      desc: "Can manage users and most content types."
    };
  }
};

function mapBackendUserToAdmin(user: BackendAdminUser): AdminUser {
  const status: "Active" | "Disabled" = (user.status === "ACTIVE" || user.status === "PENDING_INVITATION") ? "Active" : "Disabled";

  const matchedRole = getRoleFromType(user.adminType);
  const permissionsList = matchedRole.permissions?.map(p => p.permission) || [];
  let accessScope = "No Permissions";
  if (permissionsList.length > 0) {
    accessScope = permissionsList.map(p => {
      return p.replace("MANAGE_", "").replace("VIEW_", "").toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    }).join(", ");
  }
  if (user.adminType === "SUPER_ADMIN") {
    accessScope = "Global / Full Control";
  }

  const name = user.name || "Pending Invite";

  const initials = name
    .trim()
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const colors = [
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const pickedColor = colors[sum % colors.length];

  return {
    id: user.id,
    name,
    email: user.email,
    role: (matchedRole.name || "Admin") as any,
    accessScope,
    status,
    lastLogin: user.status === "PENDING_INVITATION" ? "Pending invitation" : (user.emailVerified ? "Active session" : "Never logged in"),
    avatarColorBg: pickedColor.bg,
    avatarColorText: pickedColor.text,
    avatarInitials: initials,
  };
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);
  const itemsPerPage = 4; // Matching mockup rows count

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form inputs state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formScope, setFormScope] = useState("User Management, CMS");
  const [formStatus, setFormStatus] = useState<"Active" | "Disabled">("Active");

  // Change Password & Delete Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdminForAction, setSelectedAdminForAction] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleOpenChangePasswordModal = (admin: AdminUser) => {
    setSelectedAdminForAction(admin);
    setNewPassword("");
    setShowChangePasswordModal(true);
  };

  const handleGenerateActionPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewPassword(pass);
    addToast("info", "Generated new password!");
  };

  const handleChangePassword = async () => {
    if (!selectedAdminForAction) return;
    try {
      const res = await forgotPassword({
        email: selectedAdminForAction.email,
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (res && res.success) {
        addToast("success", `Password reset email sent to ${selectedAdminForAction.email}`);
        setShowChangePasswordModal(false);
        setSelectedAdminForAction(null);
      } else {
        addToast("error", "Failed to send password reset request");
      }
    } catch (err: any) {
      console.error("Failed to send reset email:", err);
      addToast("error", err?.message || "Failed to trigger password reset");
    }
  };

  const handleOpenDeleteConfirm = (admin: AdminUser) => {
    setSelectedAdminForAction(admin);
    setShowDeleteModal(true);
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdminForAction) return;
    try {
      const res = await deleteAdmin(selectedAdminForAction.id);
      if (res && res.success) {
        addToast("success", `Successfully deleted admin account for ${selectedAdminForAction.name}`);
        setShowDeleteModal(false);
        setSelectedAdminForAction(null);
        await fetchAdminsAndRoles();
      } else {
        addToast("error", "Failed to delete administrator");
      }
    } catch (err: any) {
      console.error("Failed to delete admin:", err);
      addToast("error", err?.message || "Failed to delete admin");
    }
  };

  // Helper to generate secure password
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormPassword(pass);
    addToast("info", "Generated secure password!");
  };

  const fetchAdminsAndRoles = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setRoles(STATIC_ROLES);

      const adminsRes = await getAdmins();
      if (adminsRes && adminsRes.success && adminsRes.data) {
        const mapped = adminsRes.data.map(mapBackendUserToAdmin);
        setAdmins(mapped);
      }
    } catch (e) {
      console.error("Failed to refresh admin data:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load admins & roles
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await fetchAdminsAndRoles();
      } catch (e) {
        console.error("Failed to load admin/role data from API, using local storage fallback", e);
        setAdmins(getStoredAdmins());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync access scope suggestion when role changes in form
  const handleRoleChange = (roleId: string) => {
    setFormRoleId(roleId);
    const matched = roles.find(r => r.id === roleId);
    if (matched) {
      setFormScope(matched.permissions.map(p => p.permission).join(", "));
    }
  };

  const handleOpenAddModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    if (roles.length > 0) {
      const def = roles.find(r => r.name.toLowerCase().includes("admin") && !r.name.toLowerCase().includes("super")) || roles[0];
      setFormRoleId(def.id);
      setFormScope(def.permissions.map(p => p.permission).join(", "));
    } else {
      setFormRoleId("");
      setFormScope("");
    }
    setFormStatus("Active");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormPassword("••••••••••••");
    const matchedRole = roles.find(r => r.name === admin.role);
    if (matchedRole) {
      setFormRoleId(matchedRole.id);
      setFormScope(matchedRole.permissions.map(p => p.permission).join(", "));
    } else {
      setFormRoleId("");
      setFormScope(admin.accessScope);
    }
    setFormStatus(admin.status);
    setShowEditModal(true);
  };

  const handleAddAdmin = async () => {
    if (!formEmail.trim() || !formRoleId) {
      addToast("error", "Please enter an email and select a role");
      return;
    }
    if (!formEmail.includes("@")) {
      addToast("error", "Please enter a valid administrator email");
      return;
    }

    try {
      const res = await inviteAdmin({
        email: formEmail.trim(),
        adminType: formRoleId as any
      });
      if (res && res.success) {
        addToast("success", `Successfully invited admin ${formEmail}`);
        setShowAddModal(false);
        await fetchAdminsAndRoles();
      } else {
        addToast("error", "Failed to invite administrator");
      }
    } catch (err: any) {
      console.error("Failed to invite admin:", err);
      const validationDetails = err?.errors && Array.isArray(err.errors)
        ? ": " + err.errors.map((e: any) => `${e.path || e.field || ""}: ${e.message || ""}`).join(", ")
        : "";
      addToast("error", (err?.message || "Failed to invite administrator") + validationDetails);
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin || !formRoleId) return;
    try {
      const res = await assignUserRole(selectedAdmin.id, {
        adminType: formRoleId as any
      });
      if (res && res.success) {
        addToast("success", `Successfully updated role for ${formName}`);
        setShowEditModal(false);
        setSelectedAdmin(null);
        await fetchAdminsAndRoles();
      } else {
        addToast("error", "Failed to update administrator role");
      }
    } catch (err: any) {
      console.error("Failed to update admin role:", err);
      const validationDetails = err?.errors && Array.isArray(err.errors)
        ? ": " + err.errors.map((e: any) => `${e.path || e.field || ""}: ${e.message || ""}`).join(", ")
        : "";
      addToast("error", (err?.message || "Failed to update administrator role") + validationDetails);
    }
  };

  const handleToggleStatus = async (admin: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = admin.status === "Active" ? "deactivate" : "activate";
      let res;
      if (admin.status === "Active") {
        res = await deactivateAdmin(admin.id);
      } else {
        res = await activateAdmin(admin.id);
      }
      if (res && res.success) {
        addToast("success", `${admin.name} access is now ${admin.status === "Active" ? "Disabled" : "Active"}`);
        await fetchAdminsAndRoles();
      } else {
        addToast("error", `Failed to ${nextStatus} admin`);
      }
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      addToast("error", err?.message || "Failed to change admin status");
    }
  };

  // Filter & Search Logic
  const filteredAdmins = admins.filter((a) => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.accessScope.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === "All" || a.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = filteredAdmins.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("super")) {
      return "bg-rose-50 border border-rose-100 text-rose-700";
    } else if (r.includes("content")) {
      return "bg-emerald-50 border border-emerald-100 text-emerald-700";
    } else if (r.includes("product") || r.includes("store") || r.includes("manager")) {
      return "bg-amber-50 border border-amber-100 text-amber-700";
    } else {
      return "bg-blue-50 border border-blue-100 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#B31046] border-t-transparent animate-spin mb-4" />
        <h2 className="text-sm font-bold text-zinc-700">Loading system access data...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F9FC] p-8 space-y-6 font-sans relative">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">System Access</h1>
          <p className="text-xs font-semibold text-zinc-500">
            Manage credentials and permissions for the editorial team.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin</span>
        </button>
      </header>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search admins or permissions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:border-[#B31046] outline-none shadow-xs"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(roles.length > 0 ? ["All", ...Array.from(new Set(roles.map(r => r.name)))] : ["All", "Super Admin", "Admin", "Content Admin", "Product Admin"]).map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? "bg-[#FFF0F2] text-[#B31046] border border-[#B31046]/30"
                  : "bg-white hover:bg-zinc-50 text-zinc-500 border border-zinc-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Board ── */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#FFF0F2]/50 bg-[#FFF0F2]/20">
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Admin</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Role</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Access Scope</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase">Last Login</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-400 tracking-wider uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {paginatedAdmins.length > 0 ? (
                paginatedAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-zinc-50/40 transition-colors group cursor-pointer"
                    onClick={() => handleOpenEditModal(admin)}
                  >
                    {/* Admin Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 select-none ${admin.avatarColorBg} ${admin.avatarColorText}`}>
                          {admin.avatarInitials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-extrabold text-zinc-800 group-hover:text-[#B31046] transition-colors truncate">
                            {admin.name}
                          </span>
                          <span className="text-xs text-zinc-400 truncate">
                            {admin.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getRoleBadgeStyle(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>

                    {/* Access Scope */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-zinc-500">
                      {admin.accessScope}
                    </td>

                    {/* Status Dot */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.status === "Active" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-400">
                      {admin.lastLogin}
                    </td>

                    {/* Quick Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="p-2 rounded-full hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] transition-all cursor-pointer"
                          title="Edit Credentials"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenChangePasswordModal(admin)}
                          className="p-2 rounded-full hover:bg-[#FFF0F2] text-zinc-400 hover:text-[#B31046] transition-all cursor-pointer"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleToggleStatus(admin, e)}
                          className={`p-2 rounded-full transition-all cursor-pointer ${
                            admin.status === "Active"
                              ? "hover:bg-red-50 text-zinc-400 hover:text-red-600"
                              : "hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"
                          }`}
                          title={admin.status === "Active" ? "Disable Admin" : "Enable Admin"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        {admin.status === "Disabled" && (
                          <button
                            onClick={() => handleOpenDeleteConfirm(admin)}
                            className="p-2 rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-all cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#B31046]">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-extrabold text-zinc-800 mt-2">No Administrators Found</h4>
                      <p className="text-xs text-zinc-400 max-w-xs">
                        Try refining your search terms or filters to locate the administrator credentials.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="px-6 py-5 border-t border-zinc-50 flex items-center justify-between bg-zinc-50/20">
          <span className="text-xs font-semibold text-zinc-400">
            Showing {filteredAdmins.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(page * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length}{" "}
            administrators
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 border border-zinc-200 rounded-full bg-white hover:bg-zinc-50 text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-zinc-700 min-w-[2rem] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-zinc-200 rounded-full bg-white hover:bg-zinc-50 text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Admin Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Create New Admin</h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">Assign role and access level for new team member.</p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-[#FFF0F2]/30 border border-zinc-200/60 rounded-2xl p-3 px-4 font-semibold text-zinc-800 text-xs focus:border-[#B31046] focus:ring-1 focus:ring-[#B31046] focus:bg-white transition-all outline-none"
                  placeholder="alex.r@bentlab.tv"
                />
              </div>

              {/* Role Selection Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Role Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const meta = getRoleMeta(r.name);
                    const Icon = meta.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`p-3 rounded-2xl text-left transition-all border-2 flex flex-col justify-between h-[84px] cursor-pointer ${
                          formRoleId === r.id
                            ? "border-[#B31046] bg-white shadow-xs"
                            : "border-transparent bg-[#FFF0F2]/30 hover:bg-[#FFF0F2]/50"
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 ${meta.colorClass}`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-black">{meta.displayName}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-semibold leading-tight line-clamp-2">
                          {r.description || meta.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] font-extrabold text-xs rounded-full transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAdmin}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer text-center"
              >
                Create Administrator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ── */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedAdmin(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Edit Administrator</h3>
              <p className="text-xs text-zinc-400 font-medium">Modify system authorization and role scope for this user</p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  readOnly
                  disabled
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 px-4 font-semibold text-zinc-500 text-xs outline-none cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  readOnly
                  disabled
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 px-4 font-semibold text-zinc-500 text-xs outline-none cursor-not-allowed"
                />
              </div>

              {/* Role Selection Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Role Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const meta = getRoleMeta(r.name);
                    const Icon = meta.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`p-3 rounded-2xl text-left transition-all border-2 flex flex-col justify-between h-[84px] cursor-pointer ${
                          formRoleId === r.id
                            ? "border-[#B31046] bg-white shadow-xs"
                            : "border-transparent bg-[#FFF0F2]/30 hover:bg-[#FFF0F2]/50"
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 ${meta.colorClass}`}>
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-black">{meta.displayName}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-semibold leading-tight line-clamp-2">
                          {r.description || meta.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                }}
                className="flex-1 py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] font-extrabold text-xs rounded-full transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditAdmin}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer text-center"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showChangePasswordModal && selectedAdminForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowChangePasswordModal(false);
                setSelectedAdminForAction(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Send Password Reset</h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                Trigger a secure password reset email for <span className="text-zinc-800 font-black">{selectedAdminForAction.name}</span>.
              </p>
            </div>

            <div className="space-y-4 text-center py-5 bg-[#FFF0F2]/20 border border-[#FFF0F2]/50 rounded-2xl">
              <Key className="w-8 h-8 text-[#B31046] mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-zinc-500 max-w-xs mx-auto leading-relaxed px-4">
                For security reasons, administrators must manage their own credentials. This action triggers an official reset link sent directly to <span className="text-[#B31046] font-bold">{selectedAdminForAction.email}</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setSelectedAdminForAction(null);
                }}
                className="flex-1 py-3 bg-[#FFF0F2] hover:bg-[#ffe2e6] text-[#B31046] font-extrabold text-xs rounded-full transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                className="flex-1 py-3 bg-[#B31046] hover:bg-[#960d3a] text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer text-center"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && selectedAdminForAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-zinc-100 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedAdminForAction(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Delete Administrator</h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                Are you sure you want to permanently delete <span className="text-zinc-800 font-black">{selectedAdminForAction.name}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-800 block">System Access Revocation</span>
                <span className="text-[11px] font-semibold text-amber-600 leading-normal block">
                  The user will lose all dashboard authorizations instantly. Any active sessions will be invalidated immediately.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdminForAction(null);
                }}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-extrabold text-xs rounded-full transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full transition-all shadow-md cursor-pointer text-center"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
