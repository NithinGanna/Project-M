import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const New = () => {
  const [domainNameDomainForm, setDomainNameDomainForm] = useState('');
  const [domainNameProjectForm, setDomainNameProjectForm] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainFormSubmissionStatus, setDomainFormSubmissionStatus] = useState('');
  const [projectFormSubmissionStatus, setProjectFormSubmissionStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/domains', { withCredentials: true });
        if (!response.data) {
          throw new Error('Failed to fetch domains');
        }
        setDomains(response.data.domains);
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };

    fetchDomains();
  }, []);

  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/domains', { domainName: domainNameDomainForm }, { withCredentials: true });
      if (response.status === 300) {
        alert("You are not allowed to enter");
        navigate("/Home");
        return;
      }
      console.log('Domain Name submitted:', domainNameDomainForm);
      setDomainNameDomainForm('');
      setDomainFormSubmissionStatus('success');
      // Update domains state with the new domain
      setDomains(prevDomains => [...prevDomains, { domainName: domainNameDomainForm }]);
    } catch (error) {
      console.error('Error submitting domain:', error);
      setDomainFormSubmissionStatus('error');
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/project', {
        domain: domainNameProjectForm,
        projectName: projectName,
        description: description
      }, { withCredentials: true });
      if (response.status === 300) {
        alert("You are not allowed to enter");
        navigate("/Home");
        return;
      }
      console.log('Project added successfully!');
      setProjectName('');
      setDescription('');
      setShowProjectForm(false);
      setProjectFormSubmissionStatus('success');
    } catch (error) {
      console.error('Error adding project:', error);
      setProjectFormSubmissionStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-6">
            {domainFormSubmissionStatus === 'success' && <p className="text-success">Domain submitted successfully!</p>}
            {domainFormSubmissionStatus === 'error' && <p className="text-danger">Failed to submit domain. Please try again.</p>}
            <form onSubmit={handleDomainSubmit}>
              <div className="mb-3">
                <label htmlFor="domainName" className="form-label">Add Domain Name:</label>
                <input type="text" className="form-control" id="domainName" value={domainNameDomainForm} onChange={(e) => setDomainNameDomainForm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary">Submit Domain</button>
            </form>
          </div>
          <div className="col-md-6">
            {projectFormSubmissionStatus === 'success' && <p className="text-success">Project added successfully!</p>}
            {projectFormSubmissionStatus === 'error' && <p className="text-danger">Failed to add project. Please try again.</p>}
            {showProjectForm && (
              <form onSubmit={handleProjectSubmit}>
                <div className="mb-3">
                  <label htmlFor="domain" className="form-label">Select Domain:</label>
                  <select className="form-control" id="domain" value={domainNameProjectForm} onChange={(e) => setDomainNameProjectForm(e.target.value)} required>
                    <option value="">Select Domain</option>
                    {domains.map((domain) => (
                      <option key={domain._id} value={domain.domainName}>{domain.domainName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="projectName" className="form-label">Project Name:</label>
                  <input type="text" className="form-control" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description:</label>
                  <textarea className="form-control" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary" >Add Project</button>
              </form>
            )}
            {!showProjectForm && (
              <button className="btn btn-primary mt-3" onClick={() => setShowProjectForm(true)}>Add Project</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default New;
