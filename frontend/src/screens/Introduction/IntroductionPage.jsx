import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing
import "./IntroductionPage.css";
import softwareImage from './../../assets/software.png'; 
import marketingImage from './../../assets/Marketing.jpg'; 
import itImage from './../../assets/IT.jpeg';
import designImage from './../../assets/Design.png';
import operationsImage from './../../assets/Operations.webp';  // Add the Operations image import

const IntroductionPage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate('/register'); 
  };

  const handleGetItFree = () => {
    navigate('/register'); 
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <img src="../src/assets/emotional-intelligence.png" alt="Logo" />
          </div>
          <div className="navbar-links">
            {['Features', 'Product guide', 'Templates', 'Pricing', 'Enterprise'].map(item => (
              <a key={item} href="#" className="navbar-link">{item}</a>
            ))}
            <button className="btn-primary" onClick={handleGetItFree}>Get it free</button>
            <button className="btn-secondary" onClick={handleSignIn}>Sign in</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="main-content-left">
          <h1 className="heading">Great outcomes start with EI Scrum Planner</h1>
          <p className="subheading">The only project management tool you need to plan and track work across every team.</p>
        </div>
        <div className="signup-container">
          <button className="btn-primary" onClick={handleSignUp}>Sign up</button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="feature-cards">
        {[
          { title: 'Software Development', category: 'PRODUCT & ISSUE TRACKING', image: softwareImage },
          { title: 'Marketing', category: 'PLAN & LAUNCH CAMPAIGNS', image: marketingImage },
          { title: 'IT', category: 'PLAN & TRACK IT PROJECTS', image: itImage },
          { title: 'Design', category: 'BUILD CREATIVE WORKFLOWS', image: designImage },
          { title: 'Operations', category: 'CREATE CUSTOM PROCESSES', image: operationsImage } // Add Operations here
        ].map((feature, index) => (
          <a key={index} href={feature.link} className="feature-card">
            <img src={feature.image} alt={feature.title} className="feature-image" />
            <div className="feature-category">{feature.category}</div>
            <h3 className="feature-title">{feature.title}</h3>
          </a>
        ))}
      </div>
    </div>
  );
};

export default IntroductionPage;
