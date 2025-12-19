import { useState, useEffect, useCallback } from "react";
import tableService from "../services/tableService";
import { message } from "antd";

/**
 * Custom hook quản lý state và logic cho tables
 */
export const useTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    location: "",
    sort: "tableNumber",
    order: "ASC",
  });

  // Fetch tables
  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tableService.getAllTables(filters);
      setTables(data.data || []);
    } catch (error) {
      message.error("Failed to load tables");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Create table
  const createTable = async (data) => {
    try {
      await tableService.createTable(data);
      message.success("Table created successfully");
      fetchTables(); // Refresh list
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create table");
      return false;
    }
  };

  // Update table
  const updateTable = async (id, data) => {
    try {
      await tableService.updateTable(id, data);
      message.success("Table updated successfully");
      fetchTables();
      return true;
    } catch (error) {
      message.error("Failed to update table");
      return false;
    }
  };

  // Delete table
  const deleteTable = async (id) => {
    try {
      await tableService.deleteTable(id);
      message.success("Table deleted successfully");
      fetchTables();
      return true;
    } catch (error) {
      message.error("Failed to delete table");
      return false;
    }
  };

  // Toggle status
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await tableService.updateTableStatus(id, newStatus);
      message.success(
        `Table ${newStatus === "active" ? "activated" : "deactivated"}`
      );
      fetchTables();
      return true;
    } catch (error) {
      message.error("Failed to update status");
      return false;
    }
  };

  return {
    tables,
    loading,
    filters,
    setFilters,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    toggleStatus,
  };
};
