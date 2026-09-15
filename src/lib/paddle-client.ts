type PaddleInstance = {
  Checkout: { open: (options: Record<string, unknown>) => void };
};

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (environment: "sandbox") => void };
      Initialize: (options: Record<string, unknown>) => void;
      Checkout: PaddleInstance["Checkout"];
    };
  }
}

let paddlePromise: Promise<PaddleInstance> | null = null;

export function loadPaddle(token: string, environment: "sandbox" | "production") {
  if (!token) return Promise.reject(new Error("PADDLE_NOT_CONFIGURED"));
  if (paddlePromise) return paddlePromise;
  paddlePromise = new Promise((resolve, reject) => {
    const initialize = () => {
      if (!window.Paddle) return reject(new Error("PADDLE_LOAD_FAILED"));
      if (environment === "sandbox") window.Paddle.Environment.set("sandbox");
      window.Paddle.Initialize({ token });
      resolve(window.Paddle);
    };
    if (window.Paddle) return initialize();
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = initialize;
    script.onerror = () => reject(new Error("PADDLE_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return paddlePromise;
}
