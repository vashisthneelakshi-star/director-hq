import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Meetings from "./pages/Meetings";
import Tasks from "./pages/Tasks";
import Credentials from "./pages/Credentials";
import Analytics from "./pages/Analytics";
import Notes from "./pages/Notes";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-paper flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/meetings" element={<Meetings />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/credentials" element={<Credentials />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
