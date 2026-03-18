import { memo } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import "./auth.css";

import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";

const LogIn = () => {
    const navigate = useNavigate();

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Welcome back!");
            navigate("/dashboard");
        }
    };

    return (
        <>
            <h1>Log In</h1>
            <AccountForm onSubmit={login} />
        </>
    );
};

export default memo(LogIn);
