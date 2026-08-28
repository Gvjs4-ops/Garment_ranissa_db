import { BrowserRouter } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <AppRoutes />
      </CompanyProvider>
    </BrowserRouter>
  );
}

export default App;
