import { Routes , Route , BrowserRouter } from 'react-router-dom'
import Home from './Components/Home';
import New from './Components/New';
import Projects from './Components/Projects';
import LoginForm from './Components/LoginForm';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>

          <Route path='/' element={ <LoginForm/> } />
          <Route path='/Home' element={ <Home/> } />
          <Route path='/New' element={ <New/> } />
          <Route path='/Projects' element={ <Projects/> } />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
