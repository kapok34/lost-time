import React from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
    return (
        <div>
            <h1>Welcome to the Landing Page</h1>
            <nav>
                <ul>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/apply">Apply</Link></li>
                </ul>
            </nav>
        </div>
    );
};

export default Index;