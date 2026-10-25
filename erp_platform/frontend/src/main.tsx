
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";

import {
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import App from "./App";

import {
  CustomerConfigProvider,
  useCustomerConfig,
} from "./config/customers/CustomerConfigContext";

import { createAppTheme } from "./theme/theme";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function ConfiguredApp() {
  const { config, loading } = useCustomerConfig();

  const theme = React.useMemo(
    () => createAppTheme(config.theme),
    [config.theme],
  );

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}


ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <ViewModeProvider>
            <CustomerConfigProvider>
              <ConfiguredApp />
            </CustomerConfigProvider>
          </ViewModeProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
