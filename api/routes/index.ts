import dashboardRoutes from "./admin";
import unrestricted from "./unrestricted";
import user from "./user";

const routes = [unrestricted, user, dashboardRoutes];

export default routes;
