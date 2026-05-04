import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page" style={{ backgroundColor: '#ADD8E6' }}>
            <h1 style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>Welcome to Lost Time</h1>
            <p>This page is designed to keep you engaged while tracking your time.</p>
            <div className="content">
                // Add your content structure here
            </div>
        </div>
    );
};

export default LandingPage;