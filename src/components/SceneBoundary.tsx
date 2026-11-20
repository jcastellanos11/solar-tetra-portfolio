import { Component, type ReactNode } from 'react';

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure: (error: unknown) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onFailure(error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
