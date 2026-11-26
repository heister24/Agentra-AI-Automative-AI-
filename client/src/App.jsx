import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { useEffect } from "react";
import getCurrentUser from "./features/getCurrentUser";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "./redux/userSlice";
import MyAgents from "./pages/MyAgents";
import CreateAgent from "./pages/CreateAgent";
import Integration from "./pages/Integration";
import AgentDetail from "./pages/AgentDetail";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

const App = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const getCurrentUserData = async () => {
      const response = await getCurrentUser();
      if (response?.user) {
        dispatch(setUserData(response.user));
      }
    };
    getCurrentUserData();
  }, [dispatch]);

  return (
    <Routes>
      <Route
        path="/login"
        element={userData ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/agents"
        element={userData ? <MyAgents /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/agent/:id"
        element={userData ? <AgentDetail /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/createAgent"
        element={userData ? <CreateAgent /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/integration"
        element={userData ? <Integration /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={userData ? <Settings /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/notifications"
        element={userData ? <Notifications /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default App;
