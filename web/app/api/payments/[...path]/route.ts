import { proxyBackendRequest } from "../../_backendProxy";

export const runtime = "nodejs";

type PaymentRouteContext = {
  params:
    | Promise<{
        path: string[];
      }>
    | {
        path: string[];
      };
};

const proxyPaymentRequest = async (
  request: Request,
  context: PaymentRouteContext
) => {
  const { path } = await context.params;

  return proxyBackendRequest({
    request,
    backendPath: `/api/payments/${path.join("/")}`,
  });
};

export const POST = proxyPaymentRequest;
