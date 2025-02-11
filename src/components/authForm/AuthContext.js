import React, { createContext, Component } from "react";

const AuthContext = createContext(null);

class AuthProvider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            loading: true,
        };
    }

    componentDidMount() {
        fetch("http://localhost:8080/api/auth/me", {
            method: "GET",
            credentials: "include",
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Unauthorized");
                }
                return response.json();
            })
            .catch(() => {
                this.setState({ user: null, loading: false });
                localStorage.removeItem("user");
                localStorage.removeItem("avatarUrl");
                localStorage.removeItem("email");
                localStorage.removeItem("userId");
            });
    }

    render() {
        return (
            <AuthContext.Provider value={{ user: this.state.user, loading: this.state.loading }}>
                {this.props.children}
            </AuthContext.Provider>
        );
    }
}

const AuthConsumer = AuthContext.Consumer;

export { AuthProvider, AuthConsumer, AuthContext };
