import React from 'react';
import Navbar from './Navbar';

const Home = () => {
  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="jumbotron">
          <h1 className="display-4">Welcome to the Projects Section</h1>
          <p className="lead">Explore and manage your projects with ease.</p>
          <hr className="my-4" />
          <p>Click on "<a href='/New'>New Project</a>" to post your new project or "<a href='/Projects'>Projects</a>" viewing all projects.</p>
          <p>Navigate to respective pages with the help of Navbar</p>
        </div>
      </div>
    </div>
  );
}

export default Home;

