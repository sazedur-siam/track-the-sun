import React from 'react';

interface SafeBoundaryProps {
  /** Shown in the warning so failures are easy to find in logs. */
  name: string;
  children: React.ReactNode;
}

/**
 * Error boundary for optional sections: if one throws while rendering, it is
 * hidden instead of taking down the whole screen.
 * (Native crashes, e.g. in a map SDK, can't be caught here.)
 */
export default class SafeBoundary extends React.Component<SafeBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`[${this.props.name}] failed to render and was hidden:`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
