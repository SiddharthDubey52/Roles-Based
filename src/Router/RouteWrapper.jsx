import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from '../component/Login/Login'
import Dash from '../component/Dasboard/Dash'
import Project from '../component/Project/Project'
import Task from '../component/Task/Task'

const RouteWrapper = () => {
  return (
   <>
   <Routes>
    <Route path="/" element={<Login />} />
    <Route path='/dashboard' element={<Dash />} />
    <Route path='/projects' element={<Dash><Project /></Dash>} />
    <Route path='/tasks' element={<Dash><Task /></Dash>} />
   </Routes>

   </>
  )
}

export default RouteWrapper