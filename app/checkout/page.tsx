i found a bug in this system if the login session auth_user  auth_token is leak anyone can leak with a any browser and solve this bug firsly show how’s the plan of solving this bugtep component
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AccountStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 1:
        return <StatePackageStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 2:
        return <BusinessInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 3:
        return <OwnerInfoStep data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
      case 4:
        return <ReviewStep formData={data} updateData={updateData} onNext={nextStep} onBack={prevStep} goToStep={goToStep} />
      case 5:
        return <PaymentStep data={data} onBack={prevStep} onSubmit={handlePaymentSubmit} />
      default:
        return null
    }
  }

  return (
    <CheckoutShell
      steps={STEPS}
      currentStep={currentStep}
      data={data}
      isAuthenticated={isAuthenticated}
      originalStep={currentStep}
    >
      {renderStep()}
    </CheckoutShell>
  )
}
