import { NavLink } from "react-router-dom";
import './Navbar.css';

export default function Navbar() {
  return (
    <div className="navbar-wrapper">
      <div className="navbar-container">

        <NavLink
          to="/about"
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          About
        </NavLink>

        <NavLink
          to="/"
          end
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          Search
        </NavLink>

      </div>
    </div>
  );
}