import fs from "fs/promises";
import path from "path";

/**
 * Add PATCH endpoints to all controllers
 * PATCH should use the same validation as PUT but allow partial updates
 */

const controllers = [
  {
    path: "modules/internal/admin/admin.controller.js",
    functionName: "patchInternalAdminByIdHandler",
    updateSchema: "InternalAdminUpdateSchema",
    serviceName: "updateInternalAdminByIdService",
    resourceName: "Admin",
  },
  {
    path: "modules/internal/tenant/tenant.controller.js",
    functionName: "patchTenantHandler",
    updateSchema: "TenantUpdateSchema",
    serviceName: "updateTenantService",
    resourceName: "Tenant",
  },
  {
    path: "modules/internal/person/person.controller.js",
    functionName: "patchPersonHandler",
    updateSchema: "PersonUpdateSchema",
    serviceName: "updatePersonService",
    resourceName: "Person",
  },
  {
    path: "modules/internal/role/role.controller.js",
    functionName: "patchInternalRoleByIdHandler",
    updateSchema: "InternalRoleUpdateSchema",
    serviceName: "updateInternalRoleByIdService",
    resourceName: "Role",
  },
  {
    path: "modules/internal/lookup/lookup.controller.js",
    functionName: "patchLookupController",
    updateSchema: "LookupUpdateSchema",
    serviceName: "updateLookupService",
    resourceName: "Lookup",
  },
  {
    path: "modules/internal/service.request/service.request.controller.js",
    functionName: "patchServiceRequestByIdHandler",
    updateSchema: "ServiceRequestUpdateSchema",
    serviceName: "serviceUpdateServiceRequestById",
    resourceName: "Service request",
  },
  {
    path: "modules/external/tenant.admin/tenant.admin.controller.js",
    functionName: "patchTenantAdminHandler",
    updateSchema: "TenantAdminUpdateSchema",
    serviceName: "updateTenantAdminService",
    resourceName: "Tenant admin",
  },
  {
    path: "modules/external/tenant.user/tenant.user.controller.js",
    functionName: "patchTenantUserHandler",
    updateSchema: "TenantUserUpdateSchema",
    serviceName: "updateTenantUserService",
    resourceName: "Tenant user",
  },
  {
    path: "modules/internal/lookup.category/lookup.category.controller.js",
    functionName: "patchLookupCategoryById",
    updateSchema: "LookupCategoryUpdateSchema",
    serviceName: "updateLookupCategoryByIdService",
    resourceName: "Lookup category",
  },
  {
    path: "modules/internal/lookup.sub.category/lookup.sub.category.controller.js",
    functionName: "patchLookupSubCategoryById",
    updateSchema: "LookupSubCategoryUpdateSchema",
    serviceName: "updateLookupSubCategoryByIdService",
    resourceName: "Lookup sub category",
  },
  {
    path: "modules/internal/cultivar.template/cultivar.template.controller.js",
    functionName: "patchCultivarTemplate",
    updateSchema: "CultivarTemplateUpdateSchema",
    serviceName: "updateCultivarTemplateService",
    resourceName: "Cultivar template",
  },
  {
    path: "modules/internal/permission/permission.controller.js",
    functionName: "patchInternalPermissionController",
    updateSchema: "InternalPermissionUpdateSchema",
    serviceName: "updateInternalPermissionByIdService",
    resourceName: "Internal permission",
  },
  {
    path: "modules/internal/role.mapping/role.mapping.controller.js",
    functionName: "patchRoleMappingById",
    updateSchema: "RoleMappingUpdateSchema",
    serviceName: "updateRoleMappingByIdService",
    resourceName: "Role mapping",
  },
];

function generatePatchFunction(controller) {
  const { functionName, updateSchema, serviceName, resourceName } = controller;

  return `
// PATCH ${resourceName.toLowerCase()} by ID
export const ${functionName} = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = ${updateSchema}.partial().parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update ${resourceName.toLowerCase()} via service
    const updated${resourceName.replace(/\s/g, "")} = await ${serviceName}(
      id,
      validatedData,
      actor
    );

    return sendSuccess(res, updated${resourceName.replace(
      /\s/g,
      ""
    )}, "${resourceName} partially updated successfully");
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};`;
}

async function addPatchFunctions() {
  console.log("Adding PATCH functions to controllers...\n");

  for (const controller of controllers) {
    try {
      const filePath = controller.path;
      const content = await fs.readFile(filePath, "utf-8");

      // Check if PATCH function already exists
      if (content.includes(controller.functionName)) {
        console.log(`✅ ${filePath} - PATCH function already exists`);
        continue;
      }

      // Generate PATCH function
      const patchFunction = generatePatchFunction(controller);

      // Add function at the end of the file before export default
      const exportIndex = content.lastIndexOf("export default");
      const updatedContent =
        content.slice(0, exportIndex) +
        patchFunction +
        "\n\n" +
        content.slice(exportIndex);

      await fs.writeFile(filePath, updatedContent);
      console.log(
        `✅ ${filePath} - Added PATCH function: ${controller.functionName}`
      );
    } catch (error) {
      console.log(`❌ ${controller.path} - Error: ${error.message}`);
    }
  }
}

// Run the script
addPatchFunctions().catch(console.error);
