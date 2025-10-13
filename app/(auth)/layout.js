import React from 'react'
import { Children } from 'react'

const AuthLayout = ({children}) => {
  return (
    <div className='flex justify-center pt-40'>
      {children}
    </div>
  )
}

export default AuthLayout
