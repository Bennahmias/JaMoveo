import React from "react";
import SignupForm from "../components/SignupForm";

const SignupAdmin: React.FC = () => {
  return <SignupForm isAdmin={true} />;
};

export default SignupAdmin;
