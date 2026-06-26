import React from "react";
import AdminShell from "@/components/AdminShell";

export default function AdminManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
