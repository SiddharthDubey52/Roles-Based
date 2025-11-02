import React from 'react'
import { BrowserRouter as Router } from "react-router-dom";
import RouteWrapper from './Router/RouteWrapper'
export const baseUrl = "https://llmproject-c6n4.onrender.com/api/v1"
const App = () => {
  return (
    <Router>
      <div>
        <RouteWrapper/>
      </div>
    </Router>
  )
}

export default App