import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import { api, ApiError } from "../../api";
import { useAuthStore } from "../../store/authStore";
import { CloseIcon } from "../icons";
import styles from "./AuthModal.module.css";

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

function AuthModal() {
  const { login, register, closeModal } = useAuthStore.getState();

  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    // Lock page scroll while the modal is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username")).trim();
    const password = String(data.get("password"));

    setError("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(username, password);
        toast.success(`Welcome, ${username}!`);
      } else {
        await login(username, password);
        toast.success("Welcome back!");
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : "Something went wrong. Please try again"
      );
      setIsSubmitting(false);
    }
  };

  const title = isRegister ? "Create account" : "Sign in";

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className={styles.close} type="button" aria-label="Close" onClick={closeModal}>
          <CloseIcon />
        </button>

        <h2 className={styles.title} id="auth-title">
          {title}
        </h2>
        <p className={styles.subtitle}>
          {isRegister ? "Save the tracks you love" : "Your favorites are waiting"}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              className={styles.input}
              name="username"
              autoComplete="username"
              minLength={MIN_USERNAME_LENGTH}
              maxLength={24}
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              className={styles.input}
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
              required
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={`button button--light ${styles.submit}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : title}
          </button>
        </form>

        <p className={styles.switch}>
          {isRegister ? "Already have an account?" : "New here?"}{" "}
          <button
            className={styles.switchButton}
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </p>

        {api.isDemo && (
          <p className={styles.note}>Demo mode: accounts are stored only in this browser.</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default AuthModal;
