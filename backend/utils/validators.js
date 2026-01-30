export const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    // At least 6 characters
    return password.length >= 6;
};

export const validateRegistration = (data) => {
    const errors = {};

    if (!data.name || data.name.trim() === "") {
        errors.name = "Name is required";
    }

    if (!data.email || !validateEmail(data.email)) {
        errors.email = "Please provide a valid email";
    }

    if (!data.password || !validatePassword(data.password)) {
        errors.password = "Password must be at least 6 characters";
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
    };
};
