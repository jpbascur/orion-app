import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ORION ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'3rem',textAlign:'center',color:'#94a3b8'}}>
          <div style={{fontSize:'2rem',marginBottom:'1rem'}}>⚠️</div>
          <h2 style={{color:'#e2e8f0',marginBottom:'.75rem'}}>Something went wrong</h2>
          <p style={{color:'#64748b',marginBottom:'1.5rem',fontSize:'.9rem'}}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
