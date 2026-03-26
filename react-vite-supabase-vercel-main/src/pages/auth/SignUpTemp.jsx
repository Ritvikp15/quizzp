import { memo } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import "./auth.css";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

const SignUpTemp = () => {
    const navigate = useNavigate();

    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Account created! Check your email to confirm.");
            navigate("/");
        }
    };

    return (
        <>
            <h1>Sign Up</h1>
            <AccountForm onSubmit={signUp} />
        </>
    );
};

export default memo(SignUpTemp);