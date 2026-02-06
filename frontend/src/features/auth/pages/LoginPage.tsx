import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Temp Ops</h1>
                <p className="text-gray-500 mt-2">Enterprise Project Management</p>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                    <p className="text-sm text-gray-500">Please enter your details to sign in.</p>
                </div>

                <div className="flex justify-center">
                    <LoginForm />
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Temp Ops Inc. All rights reserved.
            </div>
        </div>
    );
};
