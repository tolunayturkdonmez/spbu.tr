import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Contacts from './pages/Contacts';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                {/* Protected Layout Routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/" element={<Inventory />} />
                    <Route path="/contacts" element={<Contacts />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}

export default App;
