import { Refine, Authenticated } from "@refinedev/core";
import {
  ThemedLayoutV2,
  ErrorComponent,
  AuthPage,
  useNotificationProvider,
} from "@refinedev/antd";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./providers/auth-provider";
import { dataProvider } from "./providers/data-provider";
import { Title } from "./components/title";
import { ProductList } from "./pages/products/list";
import { ProductEdit } from "./pages/products/edit";
import { ProductCreate } from "./pages/products/create";
import { OrderList } from "./pages/orders/list";
import { OrderShow } from "./pages/orders/show";

export function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={{ token: { colorPrimary: "#171717" } }}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "products",
                list: "/products",
                create: "/products/create",
                edit: "/products/edit/:id",
                meta: { label: "Produk" },
              },
              {
                name: "orders",
                list: "/orders",
                show: "/orders/show/:id",
                meta: { label: "Order" },
              },
            ]}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="auth" fallback={<CatchAllNavigate to="/login" />}>
                    <ThemedLayoutV2 Title={Title}>
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                <Route index element={<NavigateToResource resource="orders" />} />
                <Route path="/products">
                  <Route index element={<ProductList />} />
                  <Route path="create" element={<ProductCreate />} />
                  <Route path="edit/:id" element={<ProductEdit />} />
                </Route>
                <Route path="/orders">
                  <Route index element={<OrderList />} />
                  <Route path="show/:id" element={<OrderShow />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
              <Route
                path="/login"
                element={
                  <AuthPage
                    type="login"
                    registerLink={false}
                    forgotPasswordLink={false}
                    title={<Title collapsed={false} />}
                  />
                }
              />
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
