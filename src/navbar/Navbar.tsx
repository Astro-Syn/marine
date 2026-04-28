import { Link } from "react-router-dom"
import './Navbar.css';

export default function Navbar(){
    return (
        <div className='navbar-container'>
            <Link to='/about'>About</Link>
            <Link to='/'>Search</Link>
        </div>
    )
}