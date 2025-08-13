import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ToastContainer } from './components/Toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PostDog from './pages/PostDog';
import DogDetails from './pages/DogDetails';
import { Dashboard } from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post-dog" element={<PostDog />} />
          <Route path="/dogs/:id" element={<DogDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>

        <footer className="app-footer">
          <p>PawPal MVP - Built with ❤️ for street dogs</p>
        </footer>
        
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
