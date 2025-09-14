import {
  createServiceRequest,
  getServiceRequestById,
  updateServiceRequestById,
  deleteServiceRequestById,
  getAllServiceRequests,
} from "./service.request.firestore.js";
import { db } from "../../../services/firestore.client.js";
import {
  buildFirestoreQuery,
  applySearch,
  applyFieldSelection,
  createPaginationMeta,
  convertToCSV,
  convertToJSON,
} from "../../../utilities/query.util.js";

export async function serviceCreateServiceRequest(payload, actor) {
  const model = {
    ...payload,
    created: { by: actor || "system", when: new Date().toISOString() },
  };
  await createServiceRequest(model);
  return model;
}

export async function serviceGetServiceRequestById(id) {
  return await getServiceRequestById(id);
}

export async function serviceUpdateServiceRequestById(id, data) {
  await updateServiceRequestById(id, data);
  return await serviceGetServiceRequestById(id);
}

export async function serviceDeleteServiceRequestById(id) {
  await deleteServiceRequestById(id);
}

export async function serviceGetAllServiceRequests() {
  return await getAllServiceRequests();
}

/**
 * List service requests with comprehensive query support
 */
export async function listServiceRequestsService(queryParams = {}) {
  const {
    page = 1,
    limit = 20,
    fields,
    sort = "created.when",
    order = "desc",
  } = queryParams;

  // Get base query
  const query = buildFirestoreQuery("serviceRequests", {
    page,
    limit,
    sort,
    order,
    filters: queryParams.filters || {},
  });

  // Execute query and get total count
  const [querySnapshot, totalCountSnapshot] = await Promise.all([
    query.get(),
    db.collection("serviceRequests").get(),
  ]);

  let requests = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search if provided
  if (queryParams.search) {
    requests = applySearch(requests, queryParams.search, [
      "requestType",
      "description",
      "status",
      "priority",
      "requestedBy",
    ]);
  }

  // Apply field selection
  if (fields) {
    requests = applyFieldSelection(requests, fields);
  }

  // Create pagination metadata
  const pagination = createPaginationMeta(
    page,
    limit,
    totalCountSnapshot.size,
    requests.length
  );

  return {
    data: requests,
    pagination,
  };
}

/**
 * Search service requests service
 */
export async function searchServiceRequestsService(queryParams = {}) {
  const { search, limit = 20, fields } = queryParams;

  if (!search) {
    return {
      data: [],
      pagination: createPaginationMeta(1, limit, 0, 0),
    };
  }

  // Get all requests for search
  const snapshot = await db.collection("serviceRequests").get();
  let requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search
  requests = applySearch(requests, search, [
    "requestType",
    "description",
    "status",
    "priority",
    "requestedBy",
  ]);

  // Limit results
  const limitedRequests = requests.slice(0, limit);

  // Apply field selection
  const finalRequests = fields
    ? applyFieldSelection(limitedRequests, fields)
    : limitedRequests;

  return {
    data: finalRequests,
    pagination: createPaginationMeta(
      1,
      limit,
      requests.length,
      limitedRequests.length
    ),
  };
}

/**
 * Bulk operations service for service requests
 */
export async function bulkServiceRequestsService(operation, data) {
  const results = [];
  const errors = [];

  try {
    switch (operation) {
      case "create":
        for (const requestData of data) {
          try {
            const result = await serviceCreateServiceRequest(requestData);
            results.push({ operation: "create", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "create",
              error: error.message,
              data: requestData,
            });
          }
        }
        break;

      case "update":
        for (const item of data) {
          try {
            const result = await serviceUpdateServiceRequestById(
              item.id,
              item.data
            );
            results.push({ operation: "update", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "update",
              error: error.message,
              data: item,
            });
          }
        }
        break;

      case "delete":
        for (const requestId of data) {
          try {
            await serviceDeleteServiceRequestById(requestId);
            results.push({ operation: "delete", success: true, id: requestId });
          } catch (error) {
            errors.push({
              operation: "delete",
              error: error.message,
              id: requestId,
            });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  } catch (error) {
    throw new Error(`Bulk operation failed: ${error.message}`);
  }
}

/**
 * Export service requests service
 */
export async function exportServiceRequestsService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get requests with query parameters but without pagination
    const { fields, sort = "created.when", order = "desc" } = queryParams;

    // Get all requests
    const snapshot = await db
      .collection("serviceRequests")
      .orderBy(sort, order)
      .get();

    let requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search if provided
    if (queryParams.search) {
      requests = applySearch(requests, queryParams.search, [
        "requestType",
        "description",
        "status",
        "priority",
        "requestedBy",
      ]);
    }

    // Apply field selection
    if (fields) {
      requests = applyFieldSelection(requests, fields);
    }

    // Convert to requested format
    let exportData;
    let mimeType;
    let fileExtension;

    switch (format.toLowerCase()) {
      case "csv":
        exportData = convertToCSV(requests);
        mimeType = "text/csv";
        fileExtension = "csv";
        break;
      case "json":
      default:
        exportData = convertToJSON(requests);
        mimeType = "application/json";
        fileExtension = "json";
        break;
    }

    return {
      data: exportData,
      mimeType,
      fileExtension,
      filename: `service-requests-${
        new Date().toISOString().split("T")[0]
      }.${fileExtension}`,
      totalRecords: requests.length,
    };
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

/**
 * Get service requests statistics service
 */
export async function getServiceRequestsStatsService() {
  try {
    const snapshot = await db.collection("serviceRequests").get();
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Basic statistics
    const stats = {
      total: requests.length,
      byStatus: {},
      byPriority: {},
      byType: {},
      recentActivity: {
        createdThisMonth: 0,
        updatedThisMonth: 0,
      },
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    requests.forEach((request) => {
      // Count by status
      const status = request.status || "unknown";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by priority
      const priority = request.priority || "unknown";
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Count by type
      const type = request.requestType || "unknown";
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Recent activity
      if (
        request.created?.when &&
        new Date(request.created.when) >= thisMonth
      ) {
        stats.recentActivity.createdThisMonth++;
      }
      if (
        request.updated?.when &&
        new Date(request.updated.when) >= thisMonth
      ) {
        stats.recentActivity.updatedThisMonth++;
      }
    });

    return stats;
  } catch (error) {
    throw new Error(
      `Failed to get service request statistics: ${error.message}`
    );
  }
}
