# GraphQL

## Project Overview

This project creates a personalized profile page that displays your student information from Zone01's GraphQL API. Key features include:

- Login functionality using JWT authentication
- Display of personal profile information
- Interactive SVG graphs visualizing your progress
- Responsive design that works on all devices

## Getting Started

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- A text editor or IDE
- A web server for local testing (optional)

### Project Structure

```
graphql-profile/
├── index.html            # Main HTML page
├── styles/               # CSS stylesheets
│   ├── main.css          # General styles
│   ├── login.css         # Login page styles
│   └── profile.css       # Profile page styles
├── js/                   # JavaScript modules
│   ├── main.js           # Main application logic
│   ├── auth.js           # Authentication module
│   ├── api.js            # GraphQL API interface
│   ├── profile.js        # Profile data handling
│   └── graphs/           # SVG graph generators
│       ├── xpGraph.js    # XP over time visualization
│       └── auditGraph.js # Audit ratio visualization
└── README.md             # Project documentation
```

## Development Guide

### Authentication Setup

The authentication system uses JWT tokens to access the GraphQL API:

1. Users log in with username/email and password via the Zone01 auth API
2. The API returns a JWT token which is stored in localStorage
3. All subsequent GraphQL requests include this token in the Authorization header
4. The JWT is used to identify the user and fetch their specific data

### GraphQL Queries

The API module contains several pre-built queries to fetch different types of data:

- `getUserInfo()` - Basic user information (name, login, email)
- `getUserXP()` - XP transaction history
- `getProjectsXP()` - XP grouped by project
- `getUserProgress()` - Progress on exercises and projects
- `getUserResults()` - Detailed results with pass/fail status
- `getUserSkills()`  - User skill data with amounts
- `getAuditRatio()` - Audit statistics (given vs. received)

These queries demonstrate different GraphQL concepts:
- Basic field selection
- Filtering with WHERE clauses
- Sorting with ORDER BY
- Nested object relationships

### SVG Graphs

The project includes two interactive SVG graphs:

1. **XP Over Time Graph**
   - Displays cumulative XP growth over time
   - Interactive tooltip shows details on hover
   - Automatically scales based on data

2. **Audit Ratio Pie Chart**
   - Visualizes the ratio of audits given vs. received
   - Interactive segments that respond to user interaction

### Customization

You can customize your profile by:

1. Modifying the card layout in `index.html`
2. Adding additional data sections by creating new queries in `api.js`
3. Creating new graph types in the `graphs/` directory
4. Changing the visual style by editing the CSS files

## Deployment

### Vercel Deployment

1. Create a GitHub repository for your project
2. Push your code to the repository
3. Create a Vercel account and sign up using GitHub.
4. After logging in, click "New Project".
5. Select the Git repository where your site lives.
6. Hit Deploy — Vercel will build and deploy your site.
7. After a short wait, you’ll get a live link like:
```bash
https://your-project-name.vercel.app
```

For this project, the deployment link is: https://graphql-6i1g.vercel.app/


### Debug Tools

- Use browser developer tools to inspect network requests
- Check localStorage to verify JWT is being stored
- Use GraphiQL to test your queries directly against the API

## Extensions

Ideas to enhance the project:

1. Add more data visualizations (project success rate, skill breakdown)
2. Implement caching to improve performance
3. Add animations for graph transitions
4. Create a dark/light theme toggle
5. Add export functionality for graphs (PNG/SVG download)
