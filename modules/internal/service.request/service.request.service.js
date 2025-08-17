import {
  createServiceRequest,
  getServiceRequestById,
  updateServiceRequestById,
  deleteServiceRequestById,
  getAllServiceRequests,
} from "./service.request.firestore.js";

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
