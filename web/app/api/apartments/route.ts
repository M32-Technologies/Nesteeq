import { proxyBackendRequest } from "../_backendProxy";

export const runtime = "nodejs";

export const POST = (request: Request) => {
  return proxyBackendRequest({
    request,
    backendPath: "/api/apartments",
  });
};
