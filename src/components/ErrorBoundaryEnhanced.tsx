import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onReport?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  showDetails: boolean;
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error('ErrorBoundaryEnhanced caught an error:', error, errorInfo);

    // Report error to analytics or crash reporting service
    if (this.props.onReport) {
      this.props.onReport(error, errorInfo);
    }

    // Auto-retry for certain types of recoverable errors
    if (this.shouldAutoRetry(error) && this.retryCount < this.maxRetries) {
      console.log(`Auto-retry attempt ${this.retryCount + 1}/${this.maxRetries}`);
      this.scheduleRetry();
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Define which errors are potentially recoverable
    const recoverableErrors = [
      'Network request failed',
      'Loading chunk',
      'ChunkLoadError',
    ];

    return recoverableErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  private scheduleRetry = () => {
    setTimeout(() => {
      this.handleRetry();
    }, Math.pow(2, this.retryCount) * 1000); // Exponential backoff: 1s, 2s, 4s
  };

  private handleRetry = () => {
    this.retryCount++;
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  private handleManualRetry = () => {
    this.retryCount = 0; // Reset retry count for manual retries
    this.handleRetry();
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private getErrorSeverity(error: Error): 'low' | 'medium' | 'high' {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'low';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high';
    }
    return 'medium';
  }

  private getErrorTitle(error: Error): string {
    if (this.props.fallbackTitle) {
      return this.props.fallbackTitle;
    }

    const severity = this.getErrorSeverity(error);
    
    switch (severity) {
      case 'low':
        return 'Loading Issue';
      case 'high':
        return 'Application Error';
      default:
        return 'Something went wrong';
    }
  }

  private getErrorMessage(error: Error): string {
    if (this.props.fallbackMessage) {
      return this.props.fallbackMessage;
    }

    const severity = this.getErrorSeverity(error);
    
    switch (severity) {
      case 'low':
        return 'There was a temporary loading issue. Please try again.';
      case 'high':
        return 'The application encountered an unexpected error. We apologize for the inconvenience.';
      default:
        return 'An unexpected error occurred. Please try refreshing the app.';
    }
  }

  private getRecoveryActions(error: Error): Array<{
    title: string;
    action: () => void;
    primary?: boolean;
  }> {
    const actions = [];

    // Always show retry action
    actions.push({
      title: 'Try Again',
      action: this.handleManualRetry,
      primary: true,
    });

    // Show refresh action for certain error types
    if (error.name === 'ChunkLoadError') {
      actions.push({
        title: 'Refresh App',
        action: () => {
          // In a real app, this could trigger a full app refresh
          // For React Native, we might need to restart the bundle
          this.handleManualRetry();
        },
      });
    }

    return actions;
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      const severity = this.getErrorSeverity(error);
      const recoveryActions = this.getRecoveryActions(error);
      const showRetryCount = this.retryCount > 0;

      return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>🛠️ Oops!</Text>
            <Text style={styles.headerSubtitle}>
              {this.getErrorTitle(error)}
            </Text>
          </LinearGradient>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={styles.message}>
                {this.getErrorMessage(error)}
              </Text>

              {showRetryCount && (
                <View style={styles.retryInfo}>
                  <Text style={styles.retryText}>
                    Retry attempts: {this.retryCount}/{this.maxRetries}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionsSection}>
              {recoveryActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.primary && styles.primaryActionButton
                  ]}
                  onPress={action.action}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                  accessibilityHint={`${action.title} to recover from the error`}
                >
                  {action.primary ? (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.buttonGradient}
                    >
                      <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                        {action.title}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {action.title}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Error Details Section */}
            <View style={styles.detailsSection}>
              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={this.toggleDetails}
                accessibilityRole="button"
                accessibilityLabel={this.state.showDetails ? 'Hide error details' : 'Show error details'}
              >
                <Text style={styles.detailsToggleText}>
                  {this.state.showDetails ? '▼ Hide Details' : '▶ Show Details'}
                </Text>
              </TouchableOpacity>

              {this.state.showDetails && (
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsTitle}>Error Information:</Text>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{error.name}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Message:</Text>
                    <Text style={styles.detailValue}>{error.message}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Severity:</Text>
                    <Text style={[
                      styles.detailValue,
                      severity === 'low' ? styles.severityLow : 
                      severity === 'medium' ? styles.severityMedium : 
                      styles.severityHigh
                    ]}>
                      {severity.toUpperCase()}
                    </Text>
                  </View>

                  {error.stack && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Stack Trace:</Text>
                      <ScrollView style={styles.stackContainer} nestedScrollEnabled>
                        <Text style={styles.stackText}>{error.stack}</Text>
                      </ScrollView>
                    </View>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Component Stack:</Text>
                      <ScrollView style={styles.stackContainer} nestedScrollEnabled>
                        <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                If this problem persists, try restarting the app or checking your internet connection.
                The development team has been notified of this issue.
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryInfo: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionButton: {
    borderColor: 'transparent',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryActionButtonText: {
    color: '#fff',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  detailsSection: {
    marginBottom: 30,
  },
  detailsToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a6c7d',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 18,
  },
  severityLow: {
    color: '#27ae60',
  },
  severityMedium: {
    color: '#f39c12',
  },
  severityHigh: {
    color: '#e74c3c',
  },
  stackContainer: {
    maxHeight: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  stackText: {
    fontSize: 12,
    color: '#5a6c7d',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  helpSection: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    borderColor: '#bee5eb',
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c5460',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
  },
});