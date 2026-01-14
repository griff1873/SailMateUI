
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import CreateEvent from './pages/CreateEvent';
import CreateBoat from './pages/CreateBoat';
import SearchBoats from './pages/SearchBoats';
import Profile from './pages/Profile';
import Crew from './pages/Crew';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import MyBoats from './pages/MyBoats';
import Messages from './pages/Messages';
import { AuthenticationGuard } from './auth/AuthenticationGuard';
import ProfileGuard from './auth/ProfileGuard';

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<AuthenticationGuard component={MainLayout} />}>
        <Route element={<ProfileGuard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="events/create" element={<CreateEvent />} />
          <Route path="events/:id/edit" element={<CreateEvent />} />

          <Route path="boats/create" element={<CreateBoat />} />
          <Route path="boats/search" element={<SearchBoats />} />
          <Route path="boats/:id/edit" element={<CreateBoat />} />
          <Route path="/boats" element={<MyBoats />} />
          <Route path="crew" element={<Crew />} />
          <Route path="messages" element={<Messages />} /> {/* Added Route for Messages */}
        </Route>

        <Route path="profile" element={<Profile />} />
        <Route path="profile/:id" element={<Profile />} />
        {/* Add more routes here */}
        <Route path="*" element={<div>Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
