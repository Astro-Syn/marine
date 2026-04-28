import MarineSearch from "./search/Search"
import About from "./about/About"
import Navbar from "./navbar/Navbar"
import Title from "./title/Title";
import { Route, Routes} from 'react-router-dom';
import './App.css'

function App() {
  

  return (
    <>
    <div className='app-wrapper'>
      <div className='app-wrapper-fx'></div>
      <div className='top-effect'></div>
              <div className="bubbles">
  {Array.from({ length: 15 }).map((_, i) => (
    <span key={i} />
  ))}
</div>
      <div className='grid-bg'/>
        <div className='top-effect'/>
    <Title/>
    <Navbar/>

    <Routes>
      <Route path='/' element={<MarineSearch/>}/>
      <Route path='/about' element={<About/>}/>
    </Routes>
    
    </div>
    </>
  )
}

export default App
