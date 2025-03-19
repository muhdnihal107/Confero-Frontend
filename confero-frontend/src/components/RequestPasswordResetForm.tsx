// components/RequestPasswordResetForm.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../Store/store';

const RequestPasswordResetForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const { requestPasswordReset, isLoadingReset, errorReset } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      alert('Password reset link sent to your email.');
    } catch (err) {
      console.error('Failed to request password reset:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {errorReset && <p style={{ color: 'red' }}>{errorReset}</p>}
      <button type="submit" disabled={isLoadingReset}>
        {isLoadingReset ? 'Sending...' : 'Request Password Reset'}
      </button>
    </form>
  );
};

export default RequestPasswordResetForm;