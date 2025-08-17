import { getServiceInfo, updateServiceInfo } from "./service.info.firestore.js";

export async function serviceGetServiceInfo() {
  return await getServiceInfo();
}

export async function serviceUpdateServiceInfo(payload, actor) {
  const model = {
    ...payload,
    updated: { by: actor || "system", when: new Date().toISOString() },
  };
  return await updateServiceInfo(model);
}
