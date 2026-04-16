import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        console.error('App crashed:', error, info)
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
                    <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
                    <pre style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                        {this.state.error.message}
                    </pre>
                    <button
                        onClick={() => this.setState({ error: null })}
                        style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                        Try again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}