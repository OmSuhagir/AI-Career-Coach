import { industries } from '@/data/industries'
import React from 'react'
import OnboardingForm from './components/onboardingform'



const OnboardingPage = async () => {

  return (
    <main>
      <OnboardingForm industries = {industries}/>
    </main>
  )
}

export default OnboardingPage
