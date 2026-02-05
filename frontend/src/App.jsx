import "./App.css";
import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import InvitePage from "./pages/InvitePage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
    </Routes>
  );
}
