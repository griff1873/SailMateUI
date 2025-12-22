import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import CreateEvent from './pages/CreateEvent';
import CreateBoat from './pages/CreateBoat';
import { AuthenticationGuard } from './auth/AuthenticationGuard';

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<AuthenticationGuard component={MainLayout} />}>
        <Route index element={<Dashboard />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:id/edit" element={<CreateEvent />} />
        <Route path="events/:id/edit" element={<CreateEvent />} />
        <Route path="boats/create" element={<CreateBoat />} />
        <Route path="boats/:id/edit" element={<CreateBoat />} />
        {/* Add more routes here */}
        <Route path="*" element={<div>Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
